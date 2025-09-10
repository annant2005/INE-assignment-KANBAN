import 'dotenv/config';
import { sequelize } from '../storage/sequelize';
import { QueryTypes } from 'sequelize';

(async () => {
  try {
    console.log('Adding joinCode column to boards table...');
    
    // Check if column already exists
    const result = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'boards' AND column_name = 'joinCode'
    `, { type: QueryTypes.SELECT });
    
    if (result.length > 0) {
      console.log('joinCode column already exists');
      process.exit(0);
    }
    
    // Add the joinCode column
    await sequelize.query(`
      ALTER TABLE "boards" 
      ADD COLUMN "joinCode" VARCHAR(8) UNIQUE
    `);
    
    console.log('joinCode column added successfully');
    
    // Update existing boards with random join codes
    const boards = await sequelize.query(`
      SELECT id FROM "boards" WHERE "joinCode" IS NULL
    `, { type: QueryTypes.SELECT });
    
    for (const board of boards as any[]) {
      const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await sequelize.query(`
        UPDATE "boards" 
        SET "joinCode" = :joinCode 
        WHERE id = :id
      `, {
        replacements: { joinCode, id: board.id },
        type: QueryTypes.UPDATE
      });
    }
    
    console.log(`Updated ${boards.length} existing boards with join codes`);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
