import { execSync } from 'child_process';
import fs from 'fs';

fs.writeFileSync('test_input.lua', 'print("Hello from IB2")');

try {
  // Run from the directory where the DLL is, so it finds luac.exe and lua51.dll
  const out = execSync('../../../../dotnet/dotnet "IronBrew2 CLI.dll" "../../../../test_input.lua"', {
    cwd: 'ib2_cli/bin/Debug/netcoreapp3.1'
  });
  console.log('Output:', out.toString());
  
  if (fs.existsSync('ib2_cli/bin/Debug/netcoreapp3.1/out.lua')) {
    console.log('out.lua content:');
    console.log(fs.readFileSync('ib2_cli/bin/Debug/netcoreapp3.1/out.lua', 'utf-8').substring(0, 100) + '...');
  } else {
    console.log('out.lua not found');
  }
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
