import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getDatabaseUrl } from './config/database';

function getDbAdapter() {
  const raw = getDatabaseUrl();
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, '');
  return new PrismaMariaDb({
    host: u.hostname,
    port: Number(u.port || '3306'),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  });
}

export const prisma = new PrismaClient({
  adapter: getDbAdapter(),
});
