import 'dotenv/config';
import { sequelize } from '../storage/sequelize';
import { User } from '../models/user';
import { initModels } from '../models';

async function createSystemUser() {
  try {
    await sequelize.authenticate();
    initModels(sequelize);
    await sequelize.sync();

    const [systemUser, created] = await User.findOrCreate({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      defaults: {
        id: '00000000-0000-0000-0000-000000000000',
        displayName: 'System',
        email: 'system@kanban.app'
      }
    });

    if (created) {
      console.log('✅ System user created successfully');
    } else {
      console.log('ℹ️  System user already exists');
    }
    
    console.log('System user:', systemUser.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating system user:', error);
    process.exit(1);
  }
}

createSystemUser();
