import { execSync } from 'child_process';

try {
  const out = execSync(`curl -X POST http://localhost:3000/api/obfuscate -H "Content-Type: application/json" -d '{"code": "print(\\"hello\\")"}'`);
  console.log('Output:', out.toString());
} catch (e) {
  console.log('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}
