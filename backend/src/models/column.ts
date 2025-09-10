import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ColumnAttributes {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ColumnCreationAttributes = Optional<ColumnAttributes, 'id'>;

export class Column extends Model<ColumnAttributes, ColumnCreationAttributes> implements ColumnAttributes {
  public id!: string;
  public boardId!: string;
  public title!: string;
  public position!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initColumnModel = (sequelize: Sequelize) => {
  Column.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      boardId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'columns' }
  );

  return Column;
};
