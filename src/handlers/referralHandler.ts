import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import config from '../config';
import { escapeHTML, formatHeader, formatBadge, formatSectionDivider } from '../utils/ui';

export async function handleReferralView(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) {
    return ctx.reply('⚠️ Iltimos, /start buyrug‘ini bosing va ro‘yxatdan o‘ting.');
  }

  const botUsername = ctx.botInfo?.username || config.botUsername || 'Huquqchi_bot';
  const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramId}`;

  const referralCount = user.referralCount || 0;
  const earnedMonths = Math.floor(referralCount / 10);
  const neededForNext = 10 - (referralCount % 10);

  let html = formatHeader('🔗 DO‘STLARNI TAKLIF QILISH (REFERAL TIZIMI)', '🎁');
  html += `Botni do‘stlaringiz va yaqinlaringizga ulashing hamda <b>BEPUL VIP PRO</b> obunasini qo‘lga kiriting!\n\n`;

  html += `📊 <b>SIZNING STATISTIKANGIZ:</b>\n`;
  html += ` ├ 👥 Taklif qilingan do‘stlar: <b>${referralCount} ta</b>\n`;
  html += ` ├ 🎁 Yutib olingan bepul VIP oylar: <b>${earnedMonths} oy</b>\n`;
  html += ` └ 🎯 Keyingi 1 oylik PRO uchun: <b>${neededForNext} ta do‘st kerak</b>\n\n`;

  html += `${formatSectionDivider()}\n\n`;
  html += `📌 <b>QOIDA VA MUKOFOTLAR:</b>\n`;
  html += `• Har <b>10 ta taklif qilingan do‘stingiz</b> uchun bot sizga <b>1 OYLIK BEPUL VIP PRO</b> beradi!\n`;
  html += `• VIP PRO a‘zolari AI konsultatsiyalar va PDF shartnoma generatoridan cheksiz foydalanishadi.\n\n`;

  html += `🔗 <b>Sizning Shaxsiy Taklif Havolangiz:</b>\n`;
  html += `<code>${refLink}</code>\n\n`;
  html += `<i>Ushbu havolani nusxalab Telegram guruhlar yoki do‘stlaringizga yuboring!</i>`;

  const shareText = encodeURIComponent(
    `⚖️ Huquqiy savollaringizga zudlik bilan javob beruvchi va PDF shartnomalar yaratuvchi Huquqchi AI Telegram botiga taklif qilaman!\n\nSiz ham foydalanung: ${refLink}`
  );
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('📲 Telegram‘da Do‘stlarga Yuborish', shareUrl)],
    [Markup.button.callback('🔄 Statistikalarni Yangilash', 'ref_info')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(html, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
  }

  return ctx.reply(html, { parse_mode: 'HTML', ...keyboard });
}

export async function processReferralLink(newTelegramId: number, startPayload: string) {
  if (!startPayload || !startPayload.startsWith('ref_')) return;

  const referrerTelegramIdStr = startPayload.replace('ref_', '').trim();
  const referrerTelegramId = parseInt(referrerTelegramIdStr, 10);
  if (!referrerTelegramId || referrerTelegramId === newTelegramId) return;

  try {
    const referrer = await prisma.user.findUnique({
      where: { telegramId: BigInt(referrerTelegramId) },
    });

    if (!referrer) return;

    // Increment referrer count
    const updatedReferrer = await prisma.user.update({
      where: { id: referrer.id },
      data: {
        referralCount: { increment: 1 },
      },
    });

    const newCount = updatedReferrer.referralCount;

    // If referralCount is a multiple of 10, award 1 Month Free VIP PRO!
    if (newCount > 0 && newCount % 10 === 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      await prisma.user.update({
        where: { id: referrer.id },
        data: { isPro: true },
      });

      await prisma.subscription.create({
        data: {
          userId: referrer.id,
          plan: 'PRO_REFERRAL_BONUS',
          amount: 0,
          endDate,
          isActive: true,
        },
      });
    }

    return { referrer, newCount };
  } catch (err) {
    console.error('Error processing referral link:', err);
  }
}
