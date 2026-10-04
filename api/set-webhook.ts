import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawToken = process.env.BOT_TOKEN || '';
    const botToken = rawToken.replace(/['"]/g, '').trim();

    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: 'BOT_TOKEN muhit o‘zgaruvchisi topilmadi yoki bo‘sh!',
        tokenLength: (process.env.BOT_TOKEN || '').length,
        rawLength: rawToken.length,
        availableEnvs: Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('VERCEL_')),
      });
    }

    const tempBot = new Telegraf(botToken);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'huquqchi-lovat.vercel.app';
    const webhookUrl = `${protocol}://${host}/api/webhook`;

    const result = await tempBot.telegram.setWebhook(webhookUrl);
    const botInfo = await tempBot.telegram.getMe();

    return res.status(200).json({
      ok: true,
      message: 'Telegram Webhook muvaffaqiyatli o‘rnatildi!',
      botUsername: botInfo.username,
      botFirstName: botInfo.first_name,
      webhookUrl,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Webhook o‘rnatishda xatolik',
    });
  }
}

