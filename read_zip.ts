import fs from 'fs';
console.log(fs.readFileSync('prometheus.zip', 'utf-8').substring(0, 500));
