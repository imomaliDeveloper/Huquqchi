import express, { Express } from 'express';
import path from 'path';
import apiRoutes from './routes/apiRoutes';

export function createExpressServer(): Express {
  const app = express();

  // Middleware for JSON parsing and URL encoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS Middleware for Telegram WebApp
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Serve static files from 'public' directory for Telegram Mini App frontend with anti-caching headers
  const publicPath = path.resolve(process.cwd(), 'public');
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'HuquqchiBot Backend', timestamp: new Date().toISOString() });
  });

  app.use(express.static(publicPath, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));

  // Mount API routes
  app.use('/api', apiRoutes);
  app.use('/', apiRoutes);

  // Fallback for SPA routing with anti-caching
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  return app;
}

export function startExpressServer(initialPort: number = 3000): Promise<number> {
  const app = createExpressServer();
  
  const tryListen = (port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`🌐 Express Server for Mini App running on http://localhost:${port}`);
        resolve(port);
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && port < initialPort + 10) {
          console.warn(`⚠️ Port ${port} is in use. Trying port ${port + 1}...`);
          resolve(tryListen(port + 1));
        } else {
          console.error('❌ Express server startup error:', err);
          reject(err);
        }
      });
    });
  };

  return tryListen(initialPort);
}
