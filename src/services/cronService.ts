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
  }
}
