import fs from 'fs';
const buf = fs.readFileSync('ib2_cli/bin/Debug/netcoreapp3.1/IronBrew2.dll');
const str = buf.toString('ascii');
const matches = str.match(/[a-zA-Z0-9_\-\.\/\\]+/g);
if (matches) {
  const unique = Array.from(new Set(matches)).filter(s => s.length > 3);
  fs.writeFileSync('strings.txt', unique.join('\n'));
}
