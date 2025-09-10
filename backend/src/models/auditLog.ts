import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface AuditLogAttributes {
  id: string;
  boardId: string;
  actorId: string;
  type: string; // CardCreated | CardMoved | CardUpdated
  payload: object;
  createdAt?: Date;
}

export type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public boardId!: string;
  public actorId!: string;
  public type!: string;
  public payload!: object;
  public readonly createdAt!: Date;
}

export const initAuditLogModel = (sequelize: Sequelize) => {
  AuditLog.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      boardId: { type: DataTypes.UUID, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.STRING(60), allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
    },
    { sequelize, tableName: 'audit_logs', updatedAt: false }
  );

  return AuditLog;
};
