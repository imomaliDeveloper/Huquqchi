import type { VercelRequest, VercelResponse } from '@vercel/node';
import bot, { setupBotHandlers } from '../src/bot';

setupBotHandlers();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const webhookUrl = `${protocol}://${host}/api/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    return res.status(200).json({ ok: true, message: 'Telegram Webhook muvaffaqiyatli o‘rnatildi!', webhookUrl });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Webhook o‘rnatishda xatolik' });
  }
}
