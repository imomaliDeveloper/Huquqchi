import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot, { setupBotHandlers } from '../src/bot';

let isSetup = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      if (!isSetup) {
        setupBotHandlers();
        isSetup = true;
      }
      await bot.handleUpdate(req.body, res);
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      if (!res.headersSent) {
        res.status(200).json({ ok: true });
      }
    }
  } else {
    res.status(200).send('Huquqchi Telegram Webhook is Active');
  }
}
