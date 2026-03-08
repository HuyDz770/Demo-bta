import { execSync } from 'child_process';

try {
  const out = execSync(`strace -f -e execve ../../../../dotnet/dotnet "IronBrew2 CLI.dll" "../../../../test_input.lua" 2>&1`, {
    cwd: `${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1`,
    env: { ...process.env, PATH: `${process.env.PATH}:${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1` }
  });
  console.log('Output:', out.toString());
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
