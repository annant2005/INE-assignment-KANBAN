import { Router } from 'express';
import { Notification } from '../../models/notification.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const items = await Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/:id/read', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [count, rows] = await Notification.update({ readAt: new Date() }, { where: { id }, returning: true });
    if (!count) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

