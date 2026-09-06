import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot, { setupBotHandlers } from '../src/bot';

setupBotHandlers();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body, res);
  } else {
    res.status(200).send('Telegram Webhook Endpoint is Active');
  }
}
