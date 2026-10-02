'use strict';

function readChunck(newOffset, buf)
{
	//check that the buffer is not too short and that it contains the length at least non so se è necesssario 
	if (buf.length < newOffset + 4)
	{
		throw new Error("Invalid or corrupted PNG");
	}

	//extracting chunk length wich is the length of the chunk data field in this chunk
	const len = buf.readUInt32BE(newOffset);
	console.log(`chunklen: ${len}`);

	//check that i can do only after i have the len of the data in the buffer it checks the buffer is at least long enough to contain chunck len chunck type chunk data and CRC non so se è necesssario 
	if (buf.length < newOffset + 12 + len)
	{
		throw new Error("Invalid or corrupted PNG");
	}

	//chunk length is always 4 byte so after reading it i increase newOffset by 4
	newOffset += 4;

	//extracting chunk type
	const type = buf.toString('ascii', newOffset, newOffset + 4)
	console.log(`buf type: ${type}`);

	//chunk type is always 4 byte so after reading it i increase newOffset by 4
	newOffset += 4;

	//extraction chunk data
	const data = buf.subarray(newOffset, newOffset + len);

	newOffset += len;

	//to-do check CRC signature ???
	newOffset += 4;
	return ({ chunk : {len, type, data}, newOffset: newOffset});
}

function main()
{
	const fs = require('fs')
	const buf = fs.readFileSync('./pixil-frame-0.png')
	const buf2 = fs.readFileSync('./output-onlinepngtools2.png')

	const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

	if (!(buf.subarray(0,8).equals(pngSignature)))
	{
		console.error("Invalid or corrupted PNG");
		process.exit(1);
	}

	console.log(`buf_length: ${buf.length}, buf2_length: ${buf2.length}`);

	let offset = 8;

	//first i handle the first chunk that must be of type IHDR 
	const {chunk, newOffset} = readChunck(offset, buf);
	offset = newOffset;

	if (!(chunk.type == "IHDR" && chunk.len == 13))
		console.log("PNG IS INVALID!!!")//to-do make better error and exit in in this case

	console.log(`offset: ${offset}`);

	const imgWidth = chunk.data.readUInt32BE(0);
	const imgHeight = chunk.data.readUInt32BE(4);
	const bitDepth = chunk.data.readUInt8(8);
	const colorType = chunk.data.readUInt8(9);
	const compressionMethod = chunk.data.readUInt8(10);
	const filterMethod = chunk.data.readUInt8(11)
	const InterlaceMethod = chunk.data.readUInt8(12);

	if (imgWidth <= 0 || imgHeight <= 0)
	{
		console.error("Invalid or corrupted PNG") 
		process.exit(1);
	}

	if (!(bitDepth == 8 && (colorType == 2 || colorType == 6)))
	{
		console.error("Unsupported PNG") //to-do make a proper error and exit in that case
		process.exit(1);
	}

	if (compressionMethod != 0 || filterMethod != 0 || InterlaceMethod != 0)
	{
		console.error("Unsupported PNG") //to-do make a proper error and exit in that case
		process.exit(1);
	}
	console.log(`imgWidth:  ${imgWidth}, imgHeight: ${imgHeight}, bitDepth: ${bitDepth}, colorType: ${colorType}, InterlaceMethod: ${InterlaceMethod}`);


	//now a while loop to iterate the folowing chunks wich will mostly be IDAT chunks because i dont't handle chunks of ancillary type
	let pixelData = Buffer.alloc(0);
	let onlyConsecutiveIdat = 0;
	let foundIendChunk = false;

	while(offset < buf.length && foundIendChunk == false) //not sure about this condition
	{
		const {chunk, newOffset} = readChunck(offset, buf);
		offset = newOffset;

		if (chunk.type == "IDAT")
		{
			if (onlyConsecutiveIdat == 0)
				onlyConsecutiveIdat = 1;
			if (onlyConsecutiveIdat != 1)
			{
				console.error("Invalid or corrupted PNG")
				process.exit(1);
			}
			pixelData = Buffer.concat([pixelData, chunk.data]);
		}
		else
		{
			if (onlyConsecutiveIdat == 1)
				onlyConsecutiveIdat = 2;
		}

		if (chunk.type == "IEND")//check there is only one chunk of type IEND(done) and it is at the end(to-do?)or i just consider as junk anthing that comes after
		{
			foundIendChunk = true;
		}

	}
	if (onlyConsecutiveIdat == 0 || foundIendChunk == false)
	{
		console.error("Invalid or corrupted PNG");//if there is not at least one chunk of type IDAT the png is invalid
		process.exit(1);
	}

	console.log(`final offset: ${offset}, pixelData length: ${pixelData.length}`);
}

try { main(); }
catch (e) { console.error(e.message); process.exit(1); }