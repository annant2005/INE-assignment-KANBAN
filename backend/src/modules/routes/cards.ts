import { Router } from 'express';
import { z } from 'zod';
import { sequelize } from '../../storage/sequelize.js';
import { Card } from '../../models/card.js';
import { Column } from '../../models/column.js';
import { User } from '../../models/user.js';
import { AuditLog } from '../../models/auditLog.js';
import { Notification } from '../../models/notification.js';
import { sendCardAssignedEmail } from '../../clients/sendgrid.js';
import { QueryTypes } from 'sequelize';

export const cardsRouter = Router({ mergeParams: true });

// List cards optionally by board or column
cardsRouter.get('/', async (req, res, next) => {
  try {
    const q = z
      .object({ boardId: z.string().uuid().optional(), columnId: z.string().uuid().optional() })
      .parse(req.query);
    const where: any = {};
    if (q.boardId) where.boardId = q.boardId;
    if (q.columnId) where.columnId = q.columnId;
    const cards = await Card.findAll({ where, order: [['updatedAt', 'DESC']] });
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

const baseSchema = {
  title: z.string().min(1).max(240),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  labels: z.array(z.string().max(40)).max(20).optional(),
  dueDate: z.string().datetime().nullable().optional(),
};

const createSchema = z.object({
  columnId: z.string().uuid(),
  boardId: z.string().uuid(),
  ...baseSchema,
});

const updateSchema = z.object({
  ...baseSchema,
  version: z.number().int().positive(),
});

cardsRouter.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const result = await sequelize.transaction(async (t) => {
      // Create system user if it doesn't exist
      const [systemUser] = await User.findOrCreate({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        defaults: { 
          id: '00000000-0000-0000-0000-000000000000',
          displayName: 'System',
          email: 'system@kanban.app'
        },
        transaction: t
      });

      const card = await Card.create(
        {
          boardId: input.boardId,
          columnId: input.columnId,
          title: input.title,
          description: input.description ?? null,
          assigneeId: input.assigneeId ?? null,
          labels: input.labels ?? null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        { transaction: t }
      );
      await AuditLog.create(
        {
          boardId: input.boardId,
          actorId: systemUser.id,
          type: 'CardCreated',
          payload: { cardId: card.id, title: card.title },
        },
        { transaction: t }
      );
      return card;
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

cardsRouter.put('/:cardId', async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const input = updateSchema.parse(req.body);
    const existing = await Card.findByPk(cardId);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.version !== input.version) {
      return res.status(409).json({ error: 'Version conflict', serverVersion: existing.version, server: existing });
    }
    const assigneeChanged =
      typeof input.assigneeId !== 'undefined' && input.assigneeId !== existing.assigneeId;

    const [, rows] = await Card.update(
      {
        title: input.title ?? existing.title,
        description: input.description ?? existing.description,
        assigneeId: typeof input.assigneeId !== 'undefined' ? input.assigneeId : existing.assigneeId,
        labels: input.labels ?? existing.labels,
        dueDate: input.dueDate ? new Date(input.dueDate) : existing.dueDate,
        version: existing.version + 1,
      },
      { where: { id: cardId }, returning: true }
    );

    const updated = rows[0];

    if (assigneeChanged && updated.assigneeId) {
      await Notification.create({
        userId: updated.assigneeId,
        boardId: updated.boardId,
        type: 'CardAssigned',
        payload: { cardId: updated.id, title: updated.title },
      });
      // Send email notification to assignee
      try {
        const assignee = await User.findByPk(updated.assigneeId);
        if (assignee && assignee.email) {
          const board = await sequelize.query(
            'SELECT title FROM "boards" WHERE id = :boardId',
            { replacements: { boardId: updated.boardId }, type: QueryTypes.SELECT }
          );
          const boardTitle = (board[0] as any)?.title || 'Unknown Board';
          
          await sendCardAssignedEmail(
            assignee.email,
            assignee.displayName,
            updated.title,
            boardTitle
          );
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const moveSchema = z.object({
  toColumnId: z.string().uuid(),
  toPosition: z.number().int().nonnegative(),
});

cardsRouter.post('/:cardId/move', async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const input = moveSchema.parse(req.body);
    const card = await Card.findByPk(cardId);
    if (!card) return res.status(404).json({ error: 'Not found' });
    const target = await Column.findByPk(input.toColumnId);
    if (!target) return res.status(404).json({ error: 'Target column not found' });

    const result = await sequelize.transaction(async (t) => {
      // Get system user for audit log
      const [systemUser] = await User.findOrCreate({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        defaults: { 
          id: '00000000-0000-0000-0000-000000000000',
          displayName: 'System',
          email: 'system@kanban.app'
        },
        transaction: t
      });

      const [, rows] = await Card.update(
        { columnId: input.toColumnId, version: card.version + 1 },
        { where: { id: cardId }, returning: true, transaction: t }
      );

      await AuditLog.create({
        boardId: card.boardId,
        actorId: systemUser.id,
        type: 'CardMoved',
        payload: { cardId: card.id, fromColumnId: card.columnId, toColumnId: input.toColumnId, toPosition: input.toPosition },
      }, { transaction: t });

      return rows[0];
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

cardsRouter.delete('/:cardId', async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    const deleted = await Card.destroy({ where: { id: cardId } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

