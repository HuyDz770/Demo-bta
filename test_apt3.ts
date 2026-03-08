import { execSync } from 'child_process';

try {
  execSync('apt-get update && apt-get install -y luajit');
  console.log('Installed luajit');
} catch (e) {
  console.log('Error:', e.message);
}
