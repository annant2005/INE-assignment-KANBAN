import { Sequelize } from 'sequelize';
import dns from 'dns';
import { URL } from 'url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required (Supabase connection string)');
}

export async function initSequelize(): Promise<Sequelize> {
  // Parse DATABASE_URL and resolve hostname to IPv4, then reconnect using components
  const parsed = new URL(databaseUrl!);
  const hostname = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 5432;
  const database = (parsed.pathname || '/').replace(/^\//, '');
  const username = decodeURIComponent(parsed.username || '');
  const password = decodeURIComponent(parsed.password || '');

  // Resolve IPv4 address
  const ipv4 = await new Promise<string>((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) return reject(err);
      resolve(address);
    });
  });

  const sequelize = new Sequelize(database, username, password, {
    host: ipv4,
    port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
      keepAlive: true,
    },
    logging: process.env.DB_LOG === 'true' ? console.log : false,
  });

  return sequelize;
}

