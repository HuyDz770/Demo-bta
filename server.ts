import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import { spawn, execSync } from 'child_process';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';

dotenv.config();

const useFirebase = !!process.env.FIREBASE_PROJECT_ID;
let sqliteDb: any;
let firestoreDb: any;

if (useFirebase) {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  const app = initializeApp(firebaseConfig);
  firestoreDb = getFirestore(app);
  console.log('🔥 Using Firebase Firestore for database');
} else {
  sqliteDb = new Database('app.db');
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      key TEXT,
      content TEXT,
      preset TEXT,
      filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS temp_paths (
      path TEXT PRIMARY KEY,
      script_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('🗄️ Using SQLite for database (Local/Fallback)');
}

const generateRandomString = (length: number, chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function _buildSpawnArgs(preset: string, filename: string, outFileName: string) {
  if (preset === "Lightrew") {
    const exePath = path.join(process.cwd(), "lightrew", "Xhider CLI", "bin", "Release", "netcoreapp3.1", "Xhider CLI.exe");
    return { cmd: exePath, args: [filename, outFileName] };
  }
  if (preset === "Env Logger") {
    return { cmd: "lune", args: ["run", "uveilr/main2", "--", filename, "-o", outFileName] };
  }
  if (preset === "IB2") {
    return { cmd: "lua", args: ["./lua/ib2/cli.lua", "--LuaU", filename, "--out", outFileName] };
  }
  return { cmd: "lua", args: ["./lua/cli.lua", "--LuaU", "--preset", preset, filename, "--out", outFileName] };
}

let isObfuscating = false;
const obfuscationQueue: Array<{ code: string, preset: string, resolve: (val: string) => void, reject: (err: Error) => void }> = [];

function processObfuscationQueue() {
  if (isObfuscating || obfuscationQueue.length === 0) return;
  
  isObfuscating = true;
  const { code, preset, resolve, reject } = obfuscationQueue.shift()!;
  
  const tempDir = path.join(process.cwd(), 'ib2_cli', 'bin', 'Debug', 'netcoreapp3.1');
  const tempFile = path.join(tempDir, `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.lua`);
  const outFile = path.join(tempDir, 'out.lua');

  try {
    fs.writeFileSync(tempFile, code);

    const child = spawn('../../../../dotnet/dotnet', ['IronBrew2 CLI.dll', tempFile], {
      cwd: tempDir
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }

      if (code !== 0) {
        reject(new Error(`Obfuscation failed with code ${code}: ${stderr || stdout}`));
      } else if (!fs.existsSync(outFile)) {
        reject(new Error('Obfuscation failed: out.lua not found'));
      } else {
        const obfuscatedCode = fs.readFileSync(outFile, 'utf8');
        try {
          fs.unlinkSync(outFile);
        } catch (e) {
          console.error('Failed to delete out.lua:', e);
        }
        resolve(obfuscatedCode);
      }
      
      isObfuscating = false;
      processObfuscationQueue();
    });
  } catch (e: any) {
    reject(e);
    isObfuscating = false;
    processObfuscationQueue();
  }
}

function obfuscate(code: string, preset: string): Promise<string> {
  return new Promise((resolve, reject) => {
    obfuscationQueue.push({ code, preset, resolve, reject });
    processObfuscationQueue();
  });
}

async function startServer() {
  try {
    console.log('Installing dependencies...');
    execSync('apt-get update && apt-get install -y lua5.1 luajit', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to install dependencies:', e);
  }

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/obfuscate', async (req, res) => {
    try {
      const { code, preset } = req.body;
      if (!code) return res.status(400).json({ error: 'Code is required' });

      const obfuscatedCode = await obfuscate(code, preset || 'Basic');
      res.json({ code: obfuscatedCode });
    } catch (error: any) {
      console.error('Obfuscation error:', error);
      res.status(500).json({ error: error.message || 'Obfuscation failed' });
    }
  });

  app.post('/api/upload', async (req, res) => {
    try {
      const { code, preset, filename, expireTime, privacy } = req.body;
      if (!code) return res.status(400).json({ error: 'Code is required' });

      // If user provided a filename, use it as ID (remove .lua if present for cleaner URLs)
      // Otherwise generate a random 5-char ID
      let id = filename ? filename.replace(/\.lua$/, '') : generateRandomString(5, 'abcdefghijklmnopqrstuvwxyz');
      
      // Ensure ID is URL safe
      id = encodeURIComponent(id);

      const key = generateRandomString(10, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

      let finalCode = code;
      try {
        finalCode = await obfuscate(code, preset || 'Basic');
      } catch (obfError) {
        console.error('Failed to obfuscate before save, saving raw:', obfError);
      }

      if (useFirebase) {
        await setDoc(doc(firestoreDb, 'scripts', id), {
          id, key, content: finalCode, preset, filename: filename || `${id}.lua`, expireTime, privacy, createdAt: new Date().toISOString()
        });
      } else {
        const stmt = sqliteDb.prepare('INSERT OR REPLACE INTO scripts (id, key, content, preset, filename) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, key, finalCode, preset, filename || `${id}.lua`);
      }

      res.json({ id, key });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Catch-all for script execution (handles both custom paths and random IDs)
  // We place this BEFORE the Vite middleware so it intercepts script requests
  app.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Ignore API routes and static assets
      if (id.startsWith('api') || id.includes('.') || id === 'src' || id === '@vite') {
        return next();
      }

      const ua = req.headers['user-agent'] || '';
      
      // Check if it's a browser (not an executor)
      const isBrowser = /Mozilla|Chrome|Safari|Edge|Opera/i.test(ua) && !/Roblox|Synapse|Krnl|Fluxus|Hydrogen|Delta|Arceus|Codex/i.test(ua);

      if (isBrowser) {
        // If it's a browser, let Vite handle it (SPA routing)
        return next();
      }

      // It's an executor, fetch the script
      let script;
      if (useFirebase) {
        const docSnap = await getDoc(doc(firestoreDb, 'scripts', id));
        if (docSnap.exists()) {
          script = docSnap.data();
        } else {
          // Fallback: try to find by filename if ID didn't match
          const q = query(collection(firestoreDb, 'scripts'), where('filename', '==', id));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            script = querySnapshot.docs[0].data();
          }
        }
      } else {
        const stmt = sqliteDb.prepare('SELECT * FROM scripts WHERE id = ? OR filename = ?');
        script = stmt.get(id, id);
      }

      if (!script) {
        return res.status(404).send('-- Script not found or expired');
      }

      if (script.privacy === 'private') {
        const providedKey = req.query.key;
        if (providedKey !== script.key) {
          return res.status(403).send('-- Unauthorized: Invalid or missing Access Key');
        }
      }

      // Generate a temporary path for the actual execution
      const tempPath = generateRandomString(100);
      
      if (useFirebase) {
        await setDoc(doc(firestoreDb, 'temp_paths', tempPath), {
          path: tempPath, script_id: script.id, createdAt: new Date().toISOString()
        });
      } else {
        const insertStmt = sqliteDb.prepare('INSERT INTO temp_paths (path, script_id) VALUES (?, ?)');
        insertStmt.run(tempPath, script.id);
      }

      // Redirect the executor to the temporary path
      res.redirect(`/${tempPath}`);
    } catch (error) {
      console.error('Executor endpoint error:', error);
      res.status(500).send('-- Internal Server Error');
    }
  });

  // Temp path endpoint for executor (the actual code delivery)
  app.get('/:path([a-zA-Z0-9]{100})', async (req, res, next) => {
    try {
      const { path } = req.params;
      
      let tempRecord;
      if (useFirebase) {
        const docSnap = await getDoc(doc(firestoreDb, 'temp_paths', path));
        if (docSnap.exists()) tempRecord = docSnap.data();
      } else {
        const stmt = sqliteDb.prepare('SELECT * FROM temp_paths WHERE path = ?');
        tempRecord = stmt.get(path) as any;
      }

      if (!tempRecord) {
        return next();
      }

      let script;
      if (useFirebase) {
        const scriptSnap = await getDoc(doc(firestoreDb, 'scripts', tempRecord.script_id));
        if (scriptSnap.exists()) script = scriptSnap.data();
      } else {
        const scriptStmt = sqliteDb.prepare('SELECT * FROM scripts WHERE id = ?');
        script = scriptStmt.get(tempRecord.script_id) as any;
      }

      if (!script) {
        return res.status(404).send('-- Script not found');
      }

      // Delete the temp path after 5 seconds to prevent reuse
      setTimeout(async () => {
        try {
          if (useFirebase) {
            await deleteDoc(doc(firestoreDb, 'temp_paths', path));
          } else {
            const delStmt = sqliteDb.prepare('DELETE FROM temp_paths WHERE path = ?');
            delStmt.run(path);
          }
        } catch (e) {
          console.error('Failed to delete temp path:', e);
        }
      }, 5000);

      res.setHeader('Content-Type', 'text/plain');
      res.send(script.content);
    } catch (error) {
      console.error('Temp path endpoint error:', error);
      res.status(500).send('-- Internal Server Error');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(new URL('./dist/index.html', import.meta.url).pathname);
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
