import util from 'util';
import stream from 'stream';
import { Transform } from 'stream';
import fetch from 'node-fetch';

async function main() {
  const arrayParser = new StreamArrayPaser();
  const testParser = new TestStreamParser()
  const response = await fetch('http://localhost:8000/')
  await util.promisify(stream.pipeline)(
    response.body,
    arrayParser,
    testParser,
  )
  // const readStream = fs.createReadStream('users.json', {highWaterMark: 120 });
  // const arrayParser = new StreamArrayPaser();
  // const testParser = new TestStreamParser()

  // await util.promisify(stream.pipeline)(
  //   readStream,
  //   arrayParser,
  //   testParser,
  // )
}

class TestStreamParser extends Transform {
  _transform(chunk, _, callback) {
    console.log("------------TestStreamParser--------------------");
    console.log(JSON.parse(chunk));
    callback(null, Buffer.from(chunk));
  }
}

class StreamArrayPaser extends Transform {
  constructor(options) {
    super(Object.assign({}, options, {readableObjectMode: true}));
    this._done = false;
    this._prevBlock = Buffer.from('');
    this._isInString = false;
    this._level = 0;
  }
  _transform(chunk, _, callback) {
    console.log('=================transform starts===========================')
    // console.log('printout the chunk::||', chunk.toString())
    // this.push(chunk);
    let objectStart = 0;
    let curIndex = 0;
    // let match = 0;
    // let curValue = 0;
    if (this._level === 0 && curIndex === 0) {
      if (String.fromCharCode(chunk[0]) !== '\['){
        console.log('first not [ but it is :', String.fromCharCode(chunk[0]))
        throw new Error('Can only parse for Array of json, not start on array');
      }
      curIndex++;
      this._level++;
    }

    while (curIndex < chunk.length) {
      const curValue = String.fromCharCode(chunk[curIndex])
      switch (curValue) {
        case '{':
          // check if it's in string
          // level++
          if (!this._isInString) {
            this._level++;
          }
          if (!this._isInString && this._level === 2) {
            objectStart = curIndex;
          }
          break;
        case '"':
          // flip the string status
          this._isInString = !this._isInString;
          break;
        case '}':
          // check if it's in string
          // if true, do nothing
          // if false and level = 0, push data
          if (!this._isInString) {
            this._level--;
          }
          if (!this._isInString && this._level === 1) {
            // find a object
            const objBuff = Buffer.concat([this._prevBlock, chunk.slice(objectStart, curIndex+1)]);
            // console.log('@@@objBuff::', JSON.parse(objBuff))
            // const joinerSet = new Set('\,','\n', '\s', ',', ' ');
            // console.log('<<<<<<>>>>>', String.fromCharCode(chunk[curIndex+1]))
            // let next = 1;
            // while (joinerSet.has(String.fromCharCode(chunk[curIndex+next]))) {
            //   console.log('_+_+_+_+_+_+')
            //   next++;
            // }
            // console.log('object start: ', objectStart);
            // console.log('cur index: ', curIndex);
            objectStart = curIndex + 1;

            // console.log('get the object string:: ', objBuff.toString());
            // console.log('------------------');
            // console.log('get the object:: ', JSON.parse(objBuff.toString()));
            this._prevBlock = Buffer.from('');
            this.push(objBuff);
          }
          break;
        case ']':
          if (!this._isInString && this._level === 1) {
            this._done = true;
          }
          break;
        case '\\':
          curIndex++;
          break;
        default:
          break;
      }
      curIndex++;
    }

    if (this._level > 1) {
      this._prevBlock = Buffer.concat([this._prevBlock, chunk.slice(objectStart, curIndex)]);
    }
    callback();
  }

  _flush(callback) {
    console.log("================flushing===============")
    // this._done = true;
    // super._flush(error => {
    //   if (error) return callback(err)
    // })
    callback();
  }
}

main()

// usage: start server node server.js
// in another terminal, node index.jsc
