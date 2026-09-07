import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { MyContext } from '../bot/context';
import { ChannelPostService } from './channelPostService';

export class CronService {
  private static isInitialized = false;

  public static initCronScheduler(bot: Telegraf<MyContext>) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('⏰ Initializing Daily Cron Scheduler for @Huquq_study auto-posting (09:00 AM every morning)...');

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
