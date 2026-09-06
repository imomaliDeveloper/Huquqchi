import { MyContext } from '../bot/context';
import AiService from '../services/aiService';
import UI from '../utils/ui';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML, formatTelegramHtml, stripHTML } from '../utils/helpers';

export async function handleAiView(ctx: MyContext) {
  let subNote = '';
  if (ctx.user && !ctx.user.isPro) {
    const askedCount = await prisma.userActivity.count({
      where: { userId: ctx.user.id, action: 'AI_QUESTION' },
    });
    const remaining = Math.max(0, 50 - askedCount);
    subNote = `\n📊 <i>Sizning bepul savollar limitingiz: <b>${remaining}/50 ta</b> qoldi.</i>\n\n`;
  } else if (ctx.user?.isPro) {
    subNote = `\n👑 <b>VIP PRO statusingiz faol! Siz uchun AI konsultatsiyalar cheksiz.</b>\n\n`;
  }

  return ctx.reply(
    `⚖️ ${UI.header('HUQUQIY AI YORDAMCHI', '🤖')}\n\n` +
    `O‘zbekiston Respublikasi qonunchiligi bo‘yicha har qanday yuridik savolingizni yoza olasiz.${subNote}` +
    `💡 <b>MISOLLAR:</b>\n` +
    ` 🔹 <i>"Mehnat shartnomasini bekor qilish tartibi va muddatlari qanday?"</i>\n` +
    ` 🔹 <i>"YTT ro'yxatdan o'tish uchun qanday hujjatlar va boj to'lanadi?"</i>\n` +
    ` 🔹 <i>"Ta'lim krediti olish shartlari va foizsiz imtiyozlar kimlarga beriladi?"</i>\n\n` +
    `${UI.THIN_DIVIDER}\n` +
    `✍️ <b>Marhamat, savolingizni pastda yozib yuboring:</b>`,
    { parse_mode: 'HTML' }
  );
}

export async function handleAiQuestionMessage(ctx: MyContext) {
  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return; // ignore commands

  if (!ctx.user) {
    return ctx.reply('⚠️ Iltimos, avval /start buyrug‘i orqali ro‘yxatdan o‘ting.');
  }

  // Check 50-Question Limit for Non-PRO users
  if (!ctx.user.isPro) {
    const askedCount = await prisma.userActivity.count({
      where: { userId: ctx.user.id, action: 'AI_QUESTION' },
    });

    if (askedCount >= 50) {
      let limitText = `⚠️ <b>BEPUL AI SAVOL-JAVOB LIMITI TUGADI! (50/50 ishlatildi)</b>\n\n`;
      limitText += `Siz 50 ta bepul AI huquqiy savol imkoniyatidan to‘liq foydalandingiz.\n\n`;
      limitText += `👑 <b>VIP PRO ta‘rifiga o‘ting va quyidagi imkoniyatlarga ega bo‘ling:</b>\n`;
      limitText += ` ├ ⚖️ Cheksiz AI huquqiy konsultatsiyalar\n`;
      limitText += ` ├ 🎧 Cheksiz ovozli AI muloqot\n`;
      limitText += ` ├ 📄 Cheksiz PDF shartnoma & arizalar generatori\n`;
      limitText += ` └ ⚡️ Zudlik bilan va chuqurlashtirilgan yuridik javoblar!\n\n`;
      limitText += `${UI.DIVIDER}`;

      const buttons = [
        [Markup.button.callback('👑 VIP PRO ga O‘tish (Card Pay)', 'buy_pro_card_monthly')],
      ];

      return ctx.reply(limitText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }
  }

  // Send typing indicator action
  await ctx.sendChatAction('typing').catch(() => {});

  const loadingMsg = await ctx.reply('⚖️ <i>Huquqiy AI savolingizni qonunchilik bazasidan tahlil qilmoqda...</i>', { parse_mode: 'HTML' });

  try {
    let aiResponse = await AiService.askLegalQuestion(ctx.user.id, text);
    if (!aiResponse.includes('Sizning savolingiz')) {
      aiResponse = `❓ <b>Sizning savolingiz:</b> <i>"${escapeHTML(text)}"</i>\n\n` + aiResponse;
    }
    let replyButtons: any[] = [];

    if (!ctx.user.isPro) {
      const askedCountAfter = await prisma.userActivity.count({
        where: { userId: ctx.user.id, action: 'AI_QUESTION' },
      });

      if (askedCountAfter >= 50) {
        aiResponse += `\n\n----------------------------------------\n⚠️ <i>Eslatma: Siz oxirgi bepul AI savolingizdan foydalandingiz (50/50). Keyingi savollar va cheksiz konsultatsiyalar uchun VIP PRO ga o‘ting!</i>`;
        replyButtons.push([Markup.button.callback('👑 VIP PRO ga O‘tish (Card Pay)', 'buy_pro_card_monthly')]);
      } else {
        const remaining = 50 - askedCountAfter;
        aiResponse += `\n\n💡 <i>Eslatma: Siz ${askedCountAfter}/50 ta bepul AI savolingizdan foydalandingiz (Yana ${remaining} ta qoldi).</i>`;
      }
    }

    aiResponse = formatTelegramHtml(aiResponse);

    // Delete loading message and send final formatted answer
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
    const replyOptions = replyButtons.length > 0
      ? { parse_mode: 'HTML' as const, ...Markup.inlineKeyboard(replyButtons) }
      : { parse_mode: 'HTML' as const };

    return ctx.reply(aiResponse, replyOptions).catch(async (htmlErr) => {
      console.warn('HTML parse failed for AI reply, falling back to clean text:', htmlErr?.message);
      return ctx.reply(stripHTML(aiResponse));
    });
  } catch (error) {
    console.error('Error handling AI question message:', error);
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
    return ctx.reply('⚠️ Savolga javob tayyorlashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
  }
}
