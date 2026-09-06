import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

// If running on Vercel or serverless environment without custom DB, ensure SQLite points to /tmp/dev.db
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes('file:./dev.db') || dbUrl === 'file:./dev.db') {
  if (process.env.VERCEL === '1') {
    const tmpDbPath = path.join('/tmp', 'dev.db');
    dbUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = dbUrl;
  } else {
    dbUrl = 'file:./dev.db';
    process.env.DATABASE_URL = dbUrl;
  }
}

// Polyfill BigInt.prototype.toJSON for safety during logging and JSON serialization
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbSynced: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Auto-sync database schema on serverless startup if tables don't exist
if (!globalForPrisma.dbSynced) {
  globalForPrisma.dbSynced = true;
  try {
    if (dbUrl && dbUrl.startsWith('file:')) {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'ignore',
        env: { ...process.env, DATABASE_URL: dbUrl },
      });
    }
  } catch (err) {
    console.warn('⚠️ Auto DB sync warning:', err);
  }
}

export default prisma;

