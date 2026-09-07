import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { MyContext } from '../bot/context';
import { ChannelPostService } from './channelPostService';
import { ExamScraperService } from './examScraperService';
import { MotivationService } from './motivationService';

export class CronService {
  private static isInitialized = false;

  public static initCronScheduler(bot: Telegraf<MyContext>) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('⏰ Initializing Daily Cron Scheduler...');

    // Initial immediate scraper run on boot
    ExamScraperService.scrapeOfficialExamDates().catch((err) => {
      console.warn('⚠️ Initial exam scraper run notice:', err?.message || err);
    });

    // Cron expression: 0 6 * * * (Every morning at 06:00 AM) - Scrape official exam dates
    cron.schedule('0 6 * * *', async () => {
      console.log('🔍 Executing scheduled daily exam date scraper for @uzbmb_rasmiy...');
      try {
        await ExamScraperService.scrapeOfficialExamDates();
      } catch (err) {
        console.error('Error in scheduled exam date scraper:', err);
      }
    });

    // Cron expression: 30 8 * * * (Every morning at 08:30 AM) - Broadcast daily motivation to users
    cron.schedule('30 8 * * *', async () => {
      console.log('📣 Executing scheduled daily motivation broadcast to all users (08:30 AM)...');
      try {
        await MotivationService.broadcastDailyMotivation(bot);
      } catch (err) {
        console.error('Error in scheduled daily motivation broadcast:', err);
      }
    });

    // Cron expression: 0 9 * * * (Every morning at 09:00 AM)
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Executing scheduled daily channel auto-post to @Huquq_study...');
      try {
        await ChannelPostService.postQuizToChannel(bot);
      } catch (err) {
        console.error('Error in scheduled daily channel auto-post:', err);
      }
    });

    // Render Keep-Alive Self-Pinger (Every 10 minutes) to prevent free tier sleeping
    const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || '';
    if (renderUrl) {
      console.log(`⏰ Initializing Render Keep-Alive Self-Pinger for: ${renderUrl}`);
      cron.schedule('*/10 * * * *', async () => {
        try {
          const healthUrl = `${renderUrl.replace(/\/$/, '')}/api/health`;
          await fetch(healthUrl).catch(() => {});
          console.log(`💓 Render Keep-Alive self-ping sent to ${healthUrl}`);
        } catch (e) {}
      });
    }
  }
}
