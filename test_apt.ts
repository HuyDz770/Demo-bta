import { execSync } from 'child_process';

try {
  execSync('apt-get update && apt-get install -y strace');
  console.log('Installed strace');
} catch (e) {
  console.log('Error:', e.message);
}
