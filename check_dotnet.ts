import { execSync } from 'child_process';
try {
  const out = execSync('dotnet --version');
  console.log('dotnet version:', out.toString());
} catch (e) {
  console.log('dotnet not found');
}
