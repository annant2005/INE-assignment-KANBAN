import 'dotenv/config';
import { sequelize } from '../storage/sequelize';
import { initModels } from '../models';

(async () => {
  try {
    await sequelize.authenticate();
    initModels(sequelize);
    await sequelize.sync();
    // eslint-disable-next-line no-console
    console.log('DB synced successfully');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DB sync failed:', err);
    process.exit(1);
  }
})();
