const { Telegraf } = require('telegraf');

const botToken = process.env.BOT_TOKEN || '8708913937:AAFxVGita3lGuBLm1xgIWGdzhXh-SrEko7c';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { setupBotHandlers, bot } = require('../dist/bot');
      setupBotHandlers();
      await bot.handleUpdate(req.body, res);
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(200).json({ ok: true });
    }
  } else {
    res.status(200).send('Telegram Webhook Endpoint is Active');
  }
};
