import fs from 'fs';
import { execSync } from 'child_process';

const dir = `${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1`;
console.log('Files in dir:', fs.readdirSync(dir));

try {
  const out = execSync(`${dir}/luac.exe`);
  console.log('luac.exe output:', out.toString());
} catch (e) {
  console.log('luac.exe error:', e.message);
}
