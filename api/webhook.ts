import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot from '../src/bot';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      let update = req.body;
      if (typeof update === 'string') {
        try {
          update = JSON.parse(update);
        } catch (e) {}
      }
      if (update && typeof update === 'object') {
        await bot.handleUpdate(update);
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
