import config from './config';
import { bot, setupBotHandlers } from './bot';
import prisma from './database/prisma';
import { CronService } from './services/cronService';
import { startExpressServer } from './server';

async function bootstrap() {
  try {
    console.log('🚀 Starting HuquqchiBot / Huquq AI backend system...');
    console.log(`🌍 Environment: ${config.nodeEnv}`);

    // Auto-verify and sync database tables on startup
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit', shell: true });
      console.log('✅ Database schema verified and synced.');
    } catch (err: any) {
      console.warn('⚠️ DB schema sync warning:', err?.message);
    }

    // Verify database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully.');

    // Start Express Web API & Web App server
    const port = Number(process.env.PORT) || 3000;
    await startExpressServer(port);

    // Register all command, menu, and callback handlers
    setupBotHandlers();

    // Register Telegram slash commands menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Botni ishga tushirish & Bosh menyu' },
      { command: 'ai', description: 'AI Yuristga savol berish' },
      { command: 'quiz', description: 'Milliy Sertifikat imtihon testi' },
      { command: 'constitution', description: 'Konstitutsiya moddalari & Audiosi' },
      { command: 'laws', description: '55+ Rasmiy Qonun va Kodekslar' },
      { command: 'risk', description: 'AI Shartnoma Ekspertizasi' },
      { command: 'doc', description: 'PDF Hujjat yaratish' },
      { command: 'pro', description: 'VIP PRO Obuna' },
    ]).catch(() => {});

    // Set Telegram Chat Menu Button to live Cloudflare Mini App URL
    const miniAppUrl = process.env.MINI_APP_URL || 'https://huquqchi-lovat.vercel.app';
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: '🚀 Mini App',
        web_app: { url: miniAppUrl },
      },
    }).catch((err) => console.warn('⚠️ Menu button set error:', err?.message));

    // Initialize daily cron scheduler for channel auto-posting to @Huquq_study
    CronService.initCronScheduler(bot);

    if (!config.botToken || config.botToken === 'YOUR_TELEGRAM_BOT_TOKEN') {
      console.log('⚠️ BOT_TOKEN is not configured yet in .env file.');
      console.log('💡 Set your actual BOT_TOKEN in .env file to start Telegram polling.');
      return;
    }

    // Delete any active webhook and launch Telegraf polling with retry logic for 409 conflicts
    await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});

    async function launchBotWithRetry(retries = 10, delayMs = 4000) {
      for (let i = 0; i < retries; i++) {
        try {
          await bot.launch(() => {
            console.log('🤖 HuquqchiBot is up and running on Telegram!');
            console.log(`📢 Target Auto-Post Channel: ${config.telegramChannelUsername}`);
          });
          return;
        } catch (err: any) {
          const is409 = err?.response?.error_code === 409 || err?.message?.includes('409');
          if (is409 && i < retries - 1) {
            console.warn(`⚠️ Telegram Bot 409 Conflict: Eski bot to'xtashini kutilmoqda... Urinish ${i + 1}/${retries}`);
            await new Promise((res) => setTimeout(res, delayMs));
          } else {
            console.error('❌ Bot launch error:', err?.message || err);
            break;
          }
        }
      }
    }

    launchBotWithRetry();

    // Enable graceful stop
    const stopBot = (reason: string) => {
      console.log(`\n🛑 Stopping bot due to ${reason}...`);
      bot.stop(reason);
      prisma.$disconnect().then(() => {
        console.log('👋 Database disconnected. Goodbye!');
        process.exit(0);
      });
    };

    process.once('SIGINT', () => stopBot('SIGINT'));
    process.once('SIGTERM', () => stopBot('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
