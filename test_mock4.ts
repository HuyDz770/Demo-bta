import fs from 'fs';
import { execSync } from 'child_process';

fs.writeFileSync('ib2_cli/bin/Debug/netcoreapp3.1/luac.exe', '#!/bin/sh\necho "luac mock called with: $@"\nexit 0\n');
execSync('chmod +x ib2_cli/bin/Debug/netcoreapp3.1/luac.exe');

fs.writeFileSync('ib2_cli/bin/Debug/netcoreapp3.1/luajit.exe', '#!/bin/sh\necho "luajit mock called with: $@"\nexit 0\n');
execSync('chmod +x ib2_cli/bin/Debug/netcoreapp3.1/luajit.exe');

try {
  // Add current directory to PATH
  const out = execSync('../../../../dotnet/dotnet "IronBrew2 CLI.dll" "../../../../test_input.lua"', {
    cwd: 'ib2_cli/bin/Debug/netcoreapp3.1',
    env: { ...process.env, PATH: `${process.env.PATH}:${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1` }
  });
  console.log('Output:', out.toString());
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
