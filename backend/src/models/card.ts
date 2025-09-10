import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface CardAttributes {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  labels?: string[] | null;
  dueDate?: Date | null;
  version: number;
  updatedAt?: Date;
  createdAt?: Date;
}

export type CardCreationAttributes = Optional<CardAttributes, 'id' | 'version'>;

export class Card extends Model<CardAttributes, CardCreationAttributes> implements CardAttributes {
  public id!: string;
  public boardId!: string;
  public columnId!: string;
  public title!: string;
  public description!: string | null;
  public assigneeId!: string | null;
  public labels!: string[] | null;
  public dueDate!: Date | null;
  public version!: number;
  public readonly updatedAt!: Date;
  public readonly createdAt!: Date;
}

export const initCardModel = (sequelize: Sequelize) => {
  Card.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      boardId: { type: DataTypes.UUID, allowNull: false },
      columnId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(240), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      assigneeId: { type: DataTypes.UUID, allowNull: true },
      labels: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
      dueDate: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'cards' }
  );

  return Card;
};
