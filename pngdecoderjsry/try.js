const { on } = require('cluster');
const fs = require('fs')
const buf = fs.readFileSync('./pixil-frame-0.png')
const buf2 = fs.readFileSync('./output-onlinepngtools2.png')

const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
let signature = buf.subarray(1,4);
let signature2 = buf2.subarray(1,4);

let isPng = false;
if (buf.subarray(0,8).equals(pngSignature))
    isPng = true;

let isPNG2 = false;
if (buf2.subarray(0, 8).equals(pngSignature))
    isPng2 = true;

console.log(`isPng: ${isPng}, isPng2: ${isPng2},  signature: ${signature}, signature2: ${signature2}, buf_length: ${buf.length}, buf2_length: ${buf2.length}`);

let offset = 8;

let chunk = {len: 0, type: 0, data: 0, crcIsValid: 0}//not sure i need CrcIsValid and maybe len i don't need it either in here

function readChuck(offset, buf, chunk)
{
    //check that the buffer is not too short and that it contains the length at least non so se è necesssario 
    if (buf.length < offset + 4)
        console.log(`CHUNK IS CORRUPTED OR SOMETHING PNG IS INVALID`) //to-do make a proper error and exit in that case

    //extracting chunk length wich is the length of the chunk data field in this chunk
    chunk.len = buf.readUInt32BE(offset);
    console.log(`chunklen: ${chunk.len}`);

    //check that i can do only after i have the len of the data in the buffer it checks the buffer is at least long enough to contain chunck len chunck type chunk data and CRC non so se è necesssario 
    if (buf.length < offset + 12 + chunk.len)
        console.log(`CHUNK IS CORRUPTED OR SOMETHING PNG IS INVALID`) //to-do make a proper error and exit in that case

    //chunk length is always 4 byte so after reading it i increase offset by 4
    offset += 4;

    //extracting chunk type
    chunk.type = buf.toString('ascii', offset, offset + 4)
    console.log(`buf type: ${chunk.type}`);

    //chunk type is always 4 byte so after reading it i increase offset by 4
    offset += 4;

    //extraction chunk data
    chunk.data = buf.subarray(offset, offset + chunk.len);

    offset += chunk.len;

    //to-do check CRC signature ???
    offset += 4;
    return (chunk, offset);
}

//first i handle the first chunk that must be of type IHDR 
chunk, offset = readChuck(offset, buf, chunk);
if (!(chunk.type == "IHDR" && chunk.len == 13))
    console.log("PNG IS INVALID!!!")//to-do make better error and exit in in this case

console.log(`offset: ${offset}`);

let imgWidth = chunk.data.readUInt32BE(0);
let imgHeight = chunk.data.readUInt32BE(4);
let bitDepth = chunk.data.readUInt8(8);
let colorType = chunk.data.readUInt8(9);
//questo non so se mi serve è interlace method puo essere 0 o 1 nel dubbio lo salvo (to-do) o forse non lo gestisco quindi mettere errore se è 0 e anche per i due byte prima magari mettere errore se non sono 0 (?)
let InterlaceMethod = chunk.data.readUInt8(12);

console.log(`imgWidth:  ${imgWidth}, imgHeight: ${imgHeight}, bitDepth: ${bitDepth}, colorType: ${colorType}, InterlaceMethod: ${InterlaceMethod}`);


//now a while loop to iterate the folowing chunks wich will mostly be IDAT chunks because i dont't handle chunks of ancillary type
let pixelData = Buffer.alloc(0);;
let onlyConsecutiveIdat = 0;
while(offset < buf.length) //not sure about this condition
{
    chunk, offset = readChuck(offset, buf, chunk);

    if (chunk.type == "IDAT")
    {
        if (onlyConsecutiveIdat == 0)
            onlyConsecutiveIdat = 1;
        if (onlyConsecutiveIdat != 1)
            console.log("ERRORE IDAT DEVONO ESSERE CONSECUTIVI PNG INVALIDA (CREDO)")//to-do make a proper error and exit in that case
        pixelData = Buffer.concat([pixelData, chunk.data]);
    }
    else
    {
        if (onlyConsecutiveIdat == 1)
            onlyConsecutiveIdat = 2;
    }

    //check there is only one chunk of type IEND and it is at the end (?) to-do
}

console.log(`final offset: ${offset}, pixellData length: ${pixelData.length}`);