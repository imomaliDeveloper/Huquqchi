const { Telegraf } = require('telegraf');

const botToken = process.env.BOT_TOKEN || '8708913937:AAFxVGita3lGuBLm1xgIWGdzhXh-SrEko7c';
const bot = new Telegraf(botToken);

module.exports = async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'huquqchi.vercel.app';
    const webhookUrl = `${protocol}://${host}/api/webhook`;
    
    await bot.telegram.setWebhook(webhookUrl);
    res.status(200).json({ ok: true, message: 'Telegram Webhook muvaffaqiyatli o‘rnatildi!', webhookUrl });
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'Webhook o‘rnatishda xatolik' });
  }
};
