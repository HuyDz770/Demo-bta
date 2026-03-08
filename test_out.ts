import fs from 'fs';
console.log(fs.readFileSync('ib2_cli/bin/Debug/netcoreapp3.1/out.lua', 'utf8').substring(0, 100));
