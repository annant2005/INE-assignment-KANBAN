import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required (Supabase connection string)');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
  },
  logging: process.env.DB_LOG === 'true' ? console.log : false,
});
