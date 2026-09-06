import { MyContext } from '../bot/context';
import UserService from '../services/userService';
import { USER_ROLE_LABELS, UserRole } from '../utils/constants';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';
import { Markup } from 'telegraf';

export async function handleProfileView(ctx: MyContext) {
  if (!ctx.user) {
    return ctx.reply('⚠️ Siz hali ro‘yxatdan o‘tmagansiz. Iltimos, /start buyrug‘ini bosing.');
  }

  const user = ctx.user;
  const roleInfo = user.role && user.role in USER_ROLE_LABELS
    ? USER_ROLE_LABELS[user.role as UserRole]
    : { label: user.role || 'Belgilanmagan', icon: '👤' };

  const stats = await UserService.getUserStats(user.id);
  const regDate = new Date(user.createdAt).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const proStatus = user.isPro ? '⭐ <b>PRO MAQOM (FAOL)</b>' : '👤 <b>ODDIY MAQOM</b>';

  const profileText =
    `✨ ${UI.header('FOYDALANUVCHI PROFILI', '👤')}\n\n` +
    `📌 <b>SHAXSIY MA'LUMOTLAR:</b>\n` +
    ` ├ 👤 <b>Ism-Sharif:</b> <b>${escapeHTML(user.firstName)} ${user.lastName ? escapeHTML(user.lastName) : ''}</b>\n` +
    ` ├ 💬 <b>Username:</b> ${user.username ? '@' + escapeHTML(user.username) : '<i>Mavjud emas</i>'}\n` +
    ` ├ 📱 <b>Telefon:</b> <code>${escapeHTML(user.phone || 'Kiritilmagan')}</code>\n` +
    ` ├ 💼 <b>Faoliyat Turi:</b> ${roleInfo.icon} <b>${roleInfo.label}</b>\n` +
    ` └ 📅 <b>A'zolik Sanasi:</b> <i>${regDate}</i>\n\n` +
    `${UI.THIN_DIVIDER}\n\n` +
    `📊 <b>FAOLIYAT STATISTIKASI:</b>\n` +
    ` ├ 📝 Ishlangan Testlar: <b>${stats.totalQuizResults} ta</b>\n` +
    ` ├ 📈 O'rtacha O'zlashtirish: <b>${stats.avgQuizPercentage}%</b> ${UI.progressBar(stats.avgQuizPercentage, 100, 5)}\n` +
    ` └ 🤖 AI Muloqotlar Soni: <b>${stats.totalAiConversations} ta</b>\n\n` +
    ` status: ${proStatus}\n` +
    `${UI.DIVIDER}`;

  const inlineKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Maqomni O‘zgartirish', 'change_role')],
    [Markup.button.callback('🔄 Ma‘lumotlarni Yangilash', 'refresh_profile')],
  ]);

  if (ctx.callbackQuery) {
    return ctx.editMessageText(profileText, { parse_mode: 'HTML', ...inlineKeyboard }).catch(async () => {
      return ctx.reply(profileText, { parse_mode: 'HTML', ...inlineKeyboard });
    });
  }

  return ctx.reply(profileText, { parse_mode: 'HTML', ...inlineKeyboard });
}

export async function handleRoleChangePrompt(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const buttons = Object.entries(USER_ROLE_LABELS).map(([key, val]) => [
    Markup.button.callback(`${val.icon} ${val.label}`, `set_role_${key}`),
  ]);

  return ctx.editMessageText(
    `💼 <b>YANGI FAOLIYAT TURINGIZNI TANLANG:</b>\n\n` +
    `<i>Tizim siz tanlagan maqomga moslashtirilgan huquqiy kontentlarni taqdim etadi:</i>`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleRoleSet(ctx: MyContext, newRole: string) {
  await ctx.answerCbQuery().catch(() => {});

  if (!ctx.from) return;

  if (newRole in USER_ROLE_LABELS) {
    const updatedUser = await UserService.updateUser(ctx.from.id, { role: newRole });
    ctx.user = updatedUser;

    const roleInfo = USER_ROLE_LABELS[newRole as UserRole];
    await ctx.reply(`🎉 Maqomingiz muvaffaqiyatli <b>${roleInfo.icon} ${roleInfo.label}</b> etib yangilandi!`, {
      parse_mode: 'HTML',
    });

    return handleProfileView(ctx);
  }
}

export async function handleProfileRefresh(ctx: MyContext) {
  await ctx.answerCbQuery('✨ Profil ma\'lumotlari yangilandi!').catch(() => {});
  if (ctx.from) {
    const freshUser = await UserService.findByTelegramId(ctx.from.id);
    if (freshUser) ctx.user = freshUser;
  }
  return handleProfileView(ctx);
}
