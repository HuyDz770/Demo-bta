import AdmZip from 'adm-zip';
import fs from 'fs';

try {
  const zip = new AdmZip('downloaded_file');
  zip.extractAllTo('./ib2_cli', true);
  console.log('Extracted successfully to ./ib2_cli');
} catch (e) {
  console.error('Failed to extract as ZIP:', e.message);
  
  // Check magic bytes
  const buffer = fs.readFileSync('downloaded_file');
  const hex = buffer.toString('hex', 0, 4);
  console.log('Magic bytes:', hex);
}
