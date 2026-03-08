import { execSync } from 'child_process';

try {
  execSync('apt-get update && apt-get install -y lua5.1');
  console.log('Installed lua5.1');
} catch (e) {
  console.log('Error:', e.message);
}
