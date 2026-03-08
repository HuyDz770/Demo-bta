import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Downloading...');
  execSync('curl -L -o prometheus.zip "https://drive.google.com/uc?export=download&id=1CeAHF1fi1DUdPl7GZXUAVACkJ9qRwNTb&confirm=t"');
  console.log('Unzipping...');
  execSync('unzip -o prometheus.zip -d prometheus');
  console.log('Done!');
  console.log(fs.readdirSync('./prometheus'));
} catch (e) {
  console.error(e.message);
  if (e.stdout) console.error(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
}
