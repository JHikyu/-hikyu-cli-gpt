require('@hikyu/env')();

const https = require('https');

let options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.openaiToken}`
  }
};

function sendMessage(message, callback) {
  let req = https.request(options, (res) => {
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

//!2034890293485034578690835760834578609345680-495684590-680965496


const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function userInput() {
  rl.question('> ', (message) => {

    sendMessage(message, (res) => {
      if(!res) {
        console.log('\n');
        userInput();
        return;
      }
  
      if(!res.choices[0].delta.content) return;
      process.stdout.write(res.choices[0].delta.content);
    });
  });
}

userInput();