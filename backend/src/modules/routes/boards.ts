import { Router } from 'express';
import { z } from 'zod';
import { sequelize } from '../../storage/sequelize.js';
import { Board } from '../../models/board.js';
import { Column } from '../../models/column.js';
import { User } from '../../models/user.js';
import { AuditLog } from '../../models/auditLog.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

export const boardsRouter = Router();

const boardSchema = z.object({
  title: z.string().min(1).max(200),
});

boardsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const boards = await Board.findAll({ 
      where: { ownerId: req.user!.id },
      order: [['createdAt', 'DESC']] 
    });
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

boardsRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = boardSchema.parse(req.body);
    const result = await sequelize.transaction(async (t) => {
      const board = await Board.create({
        title: parsed.title,
        ownerId: req.user!.id
      }, { transaction: t });
      
      await AuditLog.create(
        {
          boardId: board.id,
          actorId: req.user!.id,
          type: 'BoardCreated',
          payload: { title: parsed.title },
        },
        { transaction: t }
      );
      return board;
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

boardsRouter.get('/:boardId', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const board = await Board.findByPk(boardId);
    if (!board) return res.status(404).json({ error: 'Not found' });
    const columns = await Column.findAll({ where: { boardId }, order: [['position', 'ASC']] });
    res.json({ board, columns });
  } catch (err) {
    next(err);
  }
});

// Join board by code
boardsRouter.post('/join/:joinCode', async (req, res, next) => {
  try {
    const joinCode = req.params.joinCode;
    const board = await Board.findOne({ where: { joinCode } });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const columns = await Column.findAll({ where: { boardId: board.id }, order: [['position', 'ASC']] });
    res.json({ board, columns });
  } catch (err) {
    next(err);
  }
});

boardsRouter.put('/:boardId', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const parsed = z.object({ title: z.string().min(1).max(200) }).parse(req.body);
    const updated = await Board.update(
      { title: parsed.title },
      { where: { id: boardId }, returning: true }
    );
    const board = updated[1][0];
    if (!board) return res.status(404).json({ error: 'Not found' });
    res.json(board);
  } catch (err) {
    next(err);
  }
});

boardsRouter.delete('/:boardId', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const deleted = await Board.destroy({ where: { id: boardId } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Columns
const columnSchema = z.object({
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative(),
});

boardsRouter.post('/:boardId/columns', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const parsed = columnSchema.parse(req.body);
    const board = await Board.findByPk(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const column = await Column.create({ ...parsed, boardId });
    res.status(201).json(column);
  } catch (err) {
    next(err);
  }
});

boardsRouter.put('/:boardId/columns/:columnId', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const columnId = req.params.columnId;
    const parsed = z
      .object({ title: z.string().min(1).max(200).optional(), position: z.number().int().nonnegative().optional() })
      .parse(req.body);
    const [count, rows] = await Column.update(parsed, { where: { id: columnId, boardId }, returning: true });
    if (!count) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

boardsRouter.delete('/:boardId/columns/:columnId', async (req, res, next) => {
  try {
    const boardId = req.params.boardId;
    const columnId = req.params.columnId;
    const deleted = await Column.destroy({ where: { id: columnId, boardId } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

