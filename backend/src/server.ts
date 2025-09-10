import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { initWebsocketServer } from './ws/server.js';
import { sequelize } from './storage/sequelize.js';
import { loadEnv } from './utils/env.js';
import { initModels } from './models/index.js';
import { apiRouter } from './modules/routes.js';

loadEnv();

const app = express();
app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api', apiRouter);

// Basic error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(400).json({ error: err.message || 'Request error' });
});

// Static hosting for frontend build (dist copied to backend/public)
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const httpServer = createServer(app);
initWebsocketServer(httpServer);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

(async () => {
  try {
    console.log('Kanban backend server starting...');
    await sequelize.authenticate();
    await sequelize.authenticate();
    initModels(sequelize);
    await sequelize.sync();
    httpServer.listen(PORT,'0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Startup error', err);
    process.exit(1);
  }
})();



