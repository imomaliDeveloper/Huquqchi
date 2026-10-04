import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot from '../src/bot';
import { ChannelPostService } from '../src/services/channelPostService';
import { MotivationService } from '../src/services/motivationService';
import { ExamScraperService } from '../src/services/examScraperService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const results: Record<string, any> = {};

    // 1. Scrape latest exam notices
    try {
      await ExamScraperService.scrapeOfficialExamDates();
      results.scraper = 'success';
    } catch (e: any) {
      results.scraper = e?.message;
    }

    // 2. Post daily quiz to Telegram channel
    try {
      await ChannelPostService.postQuizToChannel(bot);
      results.channelPost = 'success';
    } catch (e: any) {
      results.channelPost = e?.message;
    }

    return res.status(200).json({
      ok: true,
      message: 'Daily Cron jobs executed successfully',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Cron execution failed',
    });
  }
}
