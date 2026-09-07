import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// If running on Vercel or serverless environment without custom DB, ensure SQLite points to /tmp/dev.db
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.includes('file:./dev.db') || dbUrl === 'file:./dev.db') {
  if (process.env.VERCEL === '1') {
    const tmpDbPath = path.join('/tmp', 'dev.db');
    
    // Copy bundled schema dev.db to /tmp/dev.db if it doesn't exist in /tmp yet
    if (!fs.existsSync(tmpDbPath)) {
      const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(sourceDbPath)) {
        try {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
        } catch (err) {
          console.warn('⚠️ Failed to copy dev.db to /tmp:', err);
        }
      }
    }

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

// Auto-create database tables on serverless startup if running on SQLite and tables don't exist
if (!globalForPrisma.dbSynced) {
  globalForPrisma.dbSynced = true;
  (async () => {
    try {
      if (dbUrl && dbUrl.startsWith('file:')) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegramId BIGINT UNIQUE NOT NULL,
            username TEXT,
            firstName TEXT NOT NULL,
            lastName TEXT,
            phone TEXT,
            role TEXT,
            isPro BOOLEAN NOT NULL DEFAULT 0,
            referredById INTEGER,
            referralCount INTEGER NOT NULL DEFAULT 0,
            voiceCount INTEGER NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS legal_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            source TEXT,
            fileId TEXT,
            fileType TEXT,
            isPdfBook BOOLEAN NOT NULL DEFAULT 0,
            price INTEGER NOT NULL DEFAULT 0,
            categoryId INTEGER NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quizId INTEGER NOT NULL,
            question TEXT NOT NULL,
            optionA TEXT NOT NULL,
            optionB TEXT NOT NULL,
            optionC TEXT NOT NULL,
            optionD TEXT NOT NULL,
            correctAnswer TEXT NOT NULL,
            explanation TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            quizId INTEGER NOT NULL,
            score INTEGER NOT NULL,
            totalQuestions INTEGER NOT NULL,
            percentage REAL NOT NULL,
            durationSeconds INTEGER NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS cert_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            score INTEGER NOT NULL,
            totalQuestions INTEGER NOT NULL,
            percentage REAL NOT NULL,
            gradeLevel TEXT NOT NULL,
            durationSeconds INTEGER NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            plan TEXT NOT NULL,
            amount INTEGER NOT NULL DEFAULT 29000,
            startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            endDate DATETIME NOT NULL,
            isActive BOOLEAN NOT NULL DEFAULT 1,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            title TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS ai_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversationId INTEGER NOT NULL,
            sender TEXT NOT NULL,
            content TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegramId BIGINT UNIQUE NOT NULL,
            username TEXT,
            role TEXT NOT NULL DEFAULT 'admin',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS user_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            action TEXT NOT NULL,
            metadata TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS constitution_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            articleNumber INTEGER UNIQUE NOT NULL,
            title TEXT NOT NULL,
            chapter TEXT,
            part TEXT,
            text TEXT NOT NULL,
            audioFileId TEXT,
            audioDuration INTEGER,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => {});
      }
    } catch (err) {
      console.warn('⚠️ Auto DB table initialization warning:', err);
    }
  })();
}

export default prisma;

