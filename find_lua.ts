import fs from 'fs';
const buf = fs.readFileSync('ib2_cli/bin/Debug/netcoreapp3.1/IronBrew2.dll');
const str = buf.toString('ascii');
const matches = str.match(/luac|luajit|lua51/g);
if (matches) {
  console.log(Array.from(new Set(matches)));
}
