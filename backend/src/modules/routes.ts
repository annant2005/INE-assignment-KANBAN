import { Router } from 'express';
import { boardsRouter } from './routes/boards.js';
import { cardsRouter } from './routes/cards.js';
import { notificationsRouter } from './routes/notifications.js';
import { auditRouter } from './routes/audit.js';
import { authRouter } from './routes/auth.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRouter);

// Protected routes (require authentication)
apiRouter.use('/boards', authenticateToken, boardsRouter);
apiRouter.use('/cards', authenticateToken, cardsRouter);
apiRouter.use('/notifications', authenticateToken, notificationsRouter);
apiRouter.use('/audit', authenticateToken, auditRouter);


