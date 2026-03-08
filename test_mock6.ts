import fs from 'fs';
import { execSync } from 'child_process';

const dir = `${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1`;

fs.writeFileSync(`${dir}/cmd.exe`, '#!/bin/sh\necho "cmd mock called with: $@"\nexit 0\n');
execSync(`chmod +x ${dir}/cmd.exe`);

try {
  const out = execSync(`../../../../dotnet/dotnet "IronBrew2 CLI.dll" "../../../../test_input.lua"`, {
    cwd: dir,
    env: { ...process.env, PATH: `${process.env.PATH}:${dir}` }
  });
  console.log('Output:', out.toString());
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
