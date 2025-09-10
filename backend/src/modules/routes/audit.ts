import { Router } from 'express';
import { AuditLog } from '../../models/auditLog.js';

export const auditRouter = Router();

auditRouter.get('/', async (req, res, next) => {
  try {
    const boardId = String(req.query.boardId || '');
    if (!boardId) return res.status(400).json({ error: 'boardId required' });
    const items = await AuditLog.findAll({ where: { boardId }, order: [['createdAt', 'DESC']], limit: 200 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

