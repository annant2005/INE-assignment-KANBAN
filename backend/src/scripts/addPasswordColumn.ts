import 'dotenv/config';
import { sequelize } from '../storage/sequelize';

async function addPasswordColumn() {
  try {
    await sequelize.authenticate();
    
    // Add password column to users table
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
    
    console.log('✅ Password column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding password column:', error);
    process.exit(1);
  }
}

addPasswordColumn();
