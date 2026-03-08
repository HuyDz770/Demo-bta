import fs from 'fs';
import { execSync } from 'child_process';

async function installDotnet() {
  const url = 'https://dotnetcli.azureedge.net/dotnet/Runtime/3.1.32/dotnet-runtime-3.1.32-linux-x64.tar.gz';
  console.log('Downloading .NET Core 3.1 runtime from', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('dotnet.tar.gz', Buffer.from(buffer));
  console.log('Downloaded.');
  
  fs.mkdirSync('dotnet', { recursive: true });
  execSync('tar -xzf dotnet.tar.gz -C dotnet');
  console.log('Extracted .NET runtime.');
}

installDotnet().catch(console.error);
