const fs = require('fs')
const buf = fs.readFileSync('./pixil-frame-0.png')
const buf2 = fs.readFileSync('./output-onlinepngtools2.png')

const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
let signature = buf.subarray(1,4);
let signature2 = buf2.subarray(1,4);

let isPng = false;
if (buf.subarray(0,7).equals(pngSignature))
    isPng = true;

let isPNG2 = false;
if (buf2.subarray(0, 8).equals(pngSignature))
    isPng2 = true;

console.log(`isPng: ${isPng}, isPng2: ${isPng2},  signature: ${signature}, signature2: ${signature2}, buf_length: ${buf.length}, buf2_length: ${buf2.length}`);