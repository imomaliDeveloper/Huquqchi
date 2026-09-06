import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot from '../src/bot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      if (req.body) {
        await bot.handleUpdate(req.body);
      }
      if (!res.headersSent) {
        return res.status(200).json({ ok: true });
      }
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      if (!res.headersSent) {
        return res.status(200).json({ ok: true });
      }
    }
  }

  return res.status(200).send('Huquqchi Telegram Webhook is Active');
}
