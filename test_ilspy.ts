import { execSync } from 'child_process';

try {
  execSync('../../../../dotnet/dotnet tool install -g ilspycmd', {
    cwd: `${process.cwd()}/ib2_cli/bin/Debug/netcoreapp3.1`,
    env: { ...process.env, DOTNET_ROOT: `${process.cwd()}/dotnet` }
  });
  console.log('Installed ilspycmd');
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
