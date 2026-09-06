import { MyContext } from '../bot/context';
import config from '../config';
import AdminService from '../services/adminService';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import { getMainMenuKeyboard } from '../keyboards/mainMenuKeyboard';
import { handleStartCommand } from '../handlers/registrationHandler';

export class SubCheckService {
  public static async isUserSubscribed(ctx: MyContext): Promise<boolean> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return true;

    // Admins bypass force subscribe
    const isAdmin = await AdminService.isAdmin(telegramId);
    if (isAdmin) return true;

    const channel = config.telegramChannelUsername || '@Huquq_study';

    try {
      const member = await ctx.telegram.getChatMember(channel, telegramId);
      const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
      return validStatuses.includes(member.status);
    } catch (err: any) {
      // If error checking subscription (e.g. dev environment or bot not admin yet), allow through
      console.warn(`[SubCheckService] Subscription check warning for user ${telegramId}:`, err?.message || err);
      return true;
    }
  }

  public static async sendForceSubPrompt(ctx: MyContext) {
    const channel = config.telegramChannelUsername || '@Huquq_study';
    const channelClean = channel.replace(/^@/, '');

    let text = `🔒 <b>BOTDAN FOYDALANISH UCHUN KANALGA A‘ZO BO‘LING!</b>\n\n`;
    text += `Huquqchi AI botidan bepul foydalanish, yangi qonunlar va kunlik testlarni o‘tkazib yubormaslik uchun rasmiy Telegram kanalimizga obuna bo‘ling:\n\n`;
    text += `📢 <b>Kanal:</b> <b>${escapeHTML(channel)}</b>\n\n`;
    text += `Obuna bo‘lgach, pastdagi <b>"✅ A‘zolikni Tekshirish"</b> tugmasini bosing!`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url(`📢 ${channel} Kanaliga A‘zo Bo‘lish`, `https://t.me/${channelClean}`)],
      [Markup.button.callback('✅ A‘zolikni Tekshirish', 'check_sub')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('⚠️ Iltimos, avval kanalga a‘zo bo‘ling!').catch(() => {});
      return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
    }

    return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  public static async handleCheckSubCallback(ctx: MyContext) {
    const isSubscribed = await this.isUserSubscribed(ctx);

    if (isSubscribed) {
      await ctx.answerCbQuery('🎉 A‘zoligingiz tasdiqlandi!').catch(() => {});
      if (ctx.user && ctx.user.role) {
        return ctx.reply(
          `🎉 <b>A‘ZOLIK TASDIQLANDI!</b>\n\n` +
          `Rahmat, <b>${escapeHTML(ctx.user.firstName)}</b>! Endi Huquqchi AI botining barcha imkoniyatlaridan to‘liq foydalanishingiz mumkin.`,
          { parse_mode: 'HTML', ...getMainMenuKeyboard() }
        );
      } else {
        return handleStartCommand(ctx);
      }
    } else {
      await ctx.answerCbQuery('⚠️ Siz hali kanalga a‘zo bo‘lmadingiz!').catch(() => {});
      return this.sendForceSubPrompt(ctx);
    }
  }
}
