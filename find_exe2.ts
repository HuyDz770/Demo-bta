import fs from 'fs';
const buf = fs.readFileSync('ib2_cli/bin/Debug/netcoreapp3.1/IronBrew2.dll');
const str = buf.toString('utf16le');
const matches = str.match(/[a-zA-Z0-9_\-\.]+\.exe/g);
if (matches) {
  console.log(Array.from(new Set(matches)));
}
