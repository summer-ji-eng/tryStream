const fs = require('fs');
const http = require('http');

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

const users = fs.readFileSync('./users.json').toString().split('');

const server = http.createServer(async (req, res) => {
  let index = 0;
  while (index < users.length) {
    await sleep(500);
    let random = Math.floor(Math.random() * 20);
    let str = '';
    for (let idx = 0; idx < random && index < users.length; ++idx) {
      str += users[index];
      ++index;
    }
    res.write(str);
  }
  res.end();
});

server.listen(8000);
