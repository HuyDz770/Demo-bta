import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const db = new Database('app.db');

db.exec(`
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

  app.post('/api/upload', (req, res) => {
    try {
      const { code, preset } = req.body;
      if (!code) return res.status(400).json({ error: 'Code is required' });

      const id = generateRandomString(5, 'abcdefghijklmnopqrstuvwxyz');
      const key = generateRandomString(10, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

      // Simulate obfuscation since we don't have the actual binaries
      const obfuscatedCode = `-- Obfuscated with ${preset}\n-- Key: ${key}\n${code}`;

      const stmt = db.prepare('INSERT INTO scripts (id, key, content, preset) VALUES (?, ?, ?, ?)');
      stmt.run(id, key, obfuscatedCode, preset);

      res.json({ id, key });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Executor endpoint
  app.get('/:id([a-z]{5})', (req, res, next) => {
    const { id } = req.params;
    const ua = req.headers['user-agent'] || '';
    
    // Check if it's a browser
    const isBrowser = /Mozilla|Chrome|Safari|Edge|Opera/i.test(ua) && !/Roblox|Synapse|Krnl|Fluxus|Hydrogen/i.test(ua);

    if (isBrowser) {
      return next(); // Let Vite serve the frontend UI
    }

    const stmt = db.prepare('SELECT * FROM scripts WHERE id = ?');
    const script = stmt.get(id);

    if (!script) {
      return res.status(404).send('Script not found');
    }

    const tempPath = generateRandomString(100);
    const insertStmt = db.prepare('INSERT INTO temp_paths (path, script_id) VALUES (?, ?)');
    insertStmt.run(tempPath, id);

    res.redirect(`/${tempPath}`);
  });

  // Temp path endpoint for executor
  app.get('/:path([a-zA-Z0-9]{100})', (req, res, next) => {
    const { path } = req.params;
    
    const stmt = db.prepare('SELECT * FROM temp_paths WHERE path = ?');
    const tempRecord = stmt.get(path) as any;

    if (!tempRecord) {
      return next();
    }

    const scriptStmt = db.prepare('SELECT * FROM scripts WHERE id = ?');
    const script = scriptStmt.get(tempRecord.script_id) as any;

    if (!script) {
      return res.status(404).send('Script not found');
    }

    // Delete the path after 5 seconds
    setTimeout(() => {
      const delStmt = db.prepare('DELETE FROM temp_paths WHERE path = ?');
      delStmt.run(path);
    }, 5000);

    res.setHeader('Content-Type', 'text/plain');
    res.send(script.content);
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
