import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface NotificationAttributes {
  id: string;
  userId: string;
  boardId?: string | null;
  type: string;
  payload: object;
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'readAt' | 'boardId'>;

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public boardId!: string | null;
  public type!: string;
  public payload!: object;
  public readAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initNotificationModel = (sequelize: Sequelize) => {
  Notification.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      boardId: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.STRING(100), allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'notifications' }
  );

  return Notification;
};
