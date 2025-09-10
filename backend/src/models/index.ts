import { Sequelize } from 'sequelize';
import { initUserModel, User } from './user.js';
import { initBoardModel, Board } from './board.js';
import { initColumnModel, Column } from './column.js';
import { initCardModel, Card } from './card.js';
import { initNotificationModel, Notification } from './notification.js';
import { initAuditLogModel, AuditLog } from './auditLog.js';

export const initModels = (sequelize: Sequelize) => {
  initUserModel(sequelize);
  initBoardModel(sequelize);
  initColumnModel(sequelize);
  initCardModel(sequelize);
  initNotificationModel(sequelize);
  initAuditLogModel(sequelize);

  // Associations
  Board.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
  User.hasMany(Board, { as: 'ownedBoards', foreignKey: 'ownerId' });

  Column.belongsTo(Board, { foreignKey: 'boardId' });
  Board.hasMany(Column, { foreignKey: 'boardId' });

  Card.belongsTo(Board, { foreignKey: 'boardId' });
  Card.belongsTo(Column, { foreignKey: 'columnId' });
  Card.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
  Board.hasMany(Card, { foreignKey: 'boardId' });
  Column.hasMany(Card, { foreignKey: 'columnId' });
  User.hasMany(Card, { as: 'assignedCards', foreignKey: 'assigneeId' });

  Notification.belongsTo(User, { foreignKey: 'userId' });
  Notification.belongsTo(Board, { foreignKey: 'boardId' });
  User.hasMany(Notification, { foreignKey: 'userId' });
  Board.hasMany(Notification, { foreignKey: 'boardId' });

  AuditLog.belongsTo(Board, { foreignKey: 'boardId' });
  AuditLog.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
  Board.hasMany(AuditLog, { foreignKey: 'boardId' });
  User.hasMany(AuditLog, { as: 'actions', foreignKey: 'actorId' });

  return { User, Board, Column, Card, Notification, AuditLog };
};

