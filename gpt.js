#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const colors = require('colors');

//* Token functions 
const tokenFileExists = () => {
  try {
    const filePath = path.join(__dirname, 'token');
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};
const saveTokenToFile = (token) => {
  const filePath = path.join(__dirname, 'token');
  fs.writeFileSync(filePath, token);
};
const readTokenFromFile = () => {
  try {
    const filePath = path.join(__dirname, 'token');
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
};
async function getToken() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('OpenAi Token: ', (message) => {
      saveTokenToFile(message);
      rl.close();

      resolve(message);
    });
  });

}

//* Openai
const options = token => {
  return {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
}

(async () => {
  console.log(colors.gray('Thanks for using @hikyu/cli-gpt'));

  // Get token
  let token = readTokenFromFile();
  if(!token) token = await getToken();
  
  const apiOptions = options(token);

  userInput(apiOptions);
})();


function userInput(apiOptions) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('👤 ', (message) => {

    process.stdout.write('🤖 ');

    sendMessage(apiOptions, message, (res) => {
      if(!res) {
        console.log('\n');
        userInput(apiOptions);
        return;
      }
  
      if(!res.choices[0].delta.content) return;
      process.stdout.write(res.choices[0].delta.content);
    });

    rl.close();
  });
}

function sendMessage(apiOptions, message, callback) {
  let req = https.request(apiOptions, (res) => {
    res.on('data', (chunk) => {
      const obj = chunk.toString().replace(/data: /g, '').trimRight();
      if(obj.includes('[DONE]')) return callback(false);
      const splitted = obj.split('\n');
      
      splitted.forEach(element => {
        if(!element) return;
        callback(JSON.parse(element));
      });

      
      // console.log(obj, 123);
    });
  });
  
  req.on('error', (error) => {
    console.error(`Problem with request: ${error.message}`);
  });
  
  let data = JSON.stringify({
    model: "gpt-3.5-turbo",
    stream: true,
    max_tokens: 100,
    messages: [
      { role: 'user', content: message }
    ]
  });
  
  req.write(data);
  req.end();
}