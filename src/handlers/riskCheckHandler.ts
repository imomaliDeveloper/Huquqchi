import { MyContext } from '../bot/context';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';
import AiService from '../services/aiService';

export async function handleRiskCheckView(ctx: MyContext) {
  ctx.session = ctx.session || {};
  (ctx.session as any).riskCheckSession = { step: 'AWAITING_TEXT' };

  const buttons = [[Markup.button.callback('❌ Bekor Qilish', 'risk_check_cancel')]];

  const text =
    `🛡 ${UI.header('AI SHARTNOMA VA HUJJAT EKSPERTIZASI', '⚖️')}\n\n` +
    `Ushbu modul orqali siz ijarachilar, hamkorlar yoki ish beruvchilar bilan tuziladigan **shartnoma matnlarini AI ekspertizasidan** o‘tkazishingiz mumkin!\n\n` +
    `📌 <b>NIMALAR TEKSHIRILADI:</b>\n` +
    ` ├ ⚠️ Yashirin jarimalar va bir tomonlama majburiyatlar\n` +
    ` ├ ⚖️ O‘zbekiston Fuqarolik va Mehnat kodeksiga zid moddalar\n` +
    ` └ 📊 Umumiy Xavf Indeksi (Risk Score 0% - 100%)\n\n` +
    `📥 <b>Iltimos, shartnoma matnini yoki shubhali bandini botga yozib yuboring:</b>\n\n` +
    `${UI.DIVIDER}`;

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

export async function handleRiskCheckMessage(ctx: MyContext, text: string) {
  delete (ctx.session as any).riskCheckSession;

  await ctx.reply('🔍 <i>AI Shartnoma matnini va yuridik xavflarni tahlil qilmoqda...</i>', { parse_mode: 'HTML' });

  try {
    const analysisReport = await AiService.analyzeContractRisk(text);
    const buttons = [[Markup.button.callback('🛡 Boshqa Shartnomani Tekshirish', 'risk_check_start')]];

    return ctx.reply(analysisReport, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (err) {
    console.error('Error in handleRiskCheckMessage:', err);
    return ctx.reply('⚠️ Shartnoma matnini tahlil qilishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
  }
}
