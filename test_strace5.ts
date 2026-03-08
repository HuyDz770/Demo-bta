import { execSync } from 'child_process';

try {
  const out = execSync(`strace -f -e trace=file ../../../../dotnet/dotnet "IronBrew2 CLI.dll" "../../../../test_input.lua" 2>&1 | grep -i ENOENT`, {
    cwd: `${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1`
  });
  console.log('Output:', out.toString());
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
