import { Router } from 'express';
import { boardsRouter } from './routes/boards';
import { cardsRouter } from './routes/cards';
import { notificationsRouter } from './routes/notifications';
import { auditRouter } from './routes/audit';
import { authRouter } from './routes/auth';
import { authenticateToken, optionalAuth } from '../middleware/auth';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRouter);

// Protected routes (require authentication)
apiRouter.use('/boards', authenticateToken, boardsRouter);
apiRouter.use('/cards', authenticateToken, cardsRouter);
apiRouter.use('/notifications', authenticateToken, notificationsRouter);
apiRouter.use('/audit', authenticateToken, auditRouter);
