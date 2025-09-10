import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface BoardAttributes {
  id: string;
  title: string;
  ownerId: string;
  joinCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BoardCreationAttributes = Optional<BoardAttributes, 'id' | 'joinCode'>;

export class Board extends Model<BoardAttributes, BoardCreationAttributes> implements BoardAttributes {
  public id!: string;
  public title!: string;
  public ownerId!: string;
  public joinCode!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initBoardModel = (sequelize: Sequelize) => {
  Board.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      ownerId: { type: DataTypes.UUID, allowNull: false },
      joinCode: { 
        type: DataTypes.STRING(8), 
        allowNull: false, 
        unique: true,
        defaultValue: () => Math.random().toString(36).substring(2, 10).toUpperCase()
      },
    },
    { sequelize, tableName: 'boards' }
  );

  return Board;
};
