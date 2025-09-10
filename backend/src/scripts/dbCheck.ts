import 'dotenv/config';
import { sequelize } from '../storage/sequelize';

(async () => {
  try {
    const url = process.env.DATABASE_URL || 'not set';
    // eslint-disable-next-line no-console
    console.log('DATABASE_URL:', url.replace(/:[^:@/]+@/, '://****@'));
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('DB connection OK');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DB connection failed:', err);
    process.exit(1);
  }
})();
