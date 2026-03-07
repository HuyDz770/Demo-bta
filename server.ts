import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/upload', async (req, res) => {
    try {
      const { code, preset } = req.body;
      if (!code) return res.status(400).json({ error: 'Code is required' });

      const id = generateRandomString(5, 'abcdefghijklmnopqrstuvwxyz');
      const key = generateRandomString(10, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

      // Simulate obfuscation since we don't have the actual binaries
      const obfuscatedCode = `-- Obfuscated with ${preset}\n-- Key: ${key}\n${code}`;

      if (useFirebase) {
        await setDoc(doc(firestoreDb, 'scripts', id), {
          id, key, content: obfuscatedCode, preset, createdAt: new Date().toISOString()
        });
      } else {
        const stmt = sqliteDb.prepare('INSERT INTO scripts (id, key, content, preset) VALUES (?, ?, ?, ?)');
        stmt.run(id, key, obfuscatedCode, preset);
      }

      res.json({ id, key });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Executor endpoint
  app.get('/:id([a-z]{5})', async (req, res, next) => {
    try {
      const { id } = req.params;
      const ua = req.headers['user-agent'] || '';
      
      // Check if it's a browser
      const isBrowser = /Mozilla|Chrome|Safari|Edge|Opera/i.test(ua) && !/Roblox|Synapse|Krnl|Fluxus|Hydrogen/i.test(ua);

      if (isBrowser) {
        return next(); // Let Vite serve the frontend UI
      }

      let script;
      if (useFirebase) {
        const docSnap = await getDoc(doc(firestoreDb, 'scripts', id));
        if (docSnap.exists()) script = docSnap.data();
      } else {
        const stmt = sqliteDb.prepare('SELECT * FROM scripts WHERE id = ?');
        script = stmt.get(id);
      }

      if (!script) {
        return res.status(404).send('Script not found');
      }

      const tempPath = generateRandomString(100);
      
      if (useFirebase) {
        await setDoc(doc(firestoreDb, 'temp_paths', tempPath), {
          path: tempPath, script_id: id, createdAt: new Date().toISOString()
        });
      } else {
        const insertStmt = sqliteDb.prepare('INSERT INTO temp_paths (path, script_id) VALUES (?, ?)');
        insertStmt.run(tempPath, id);
      }

      res.redirect(`/${tempPath}`);
    } catch (error) {
      console.error('Executor endpoint error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Temp path endpoint for executor
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
        return res.status(404).send('Script not found');
      }

      // Delete the path after 5 seconds
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
      res.status(500).send('Internal Server Error');
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
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
