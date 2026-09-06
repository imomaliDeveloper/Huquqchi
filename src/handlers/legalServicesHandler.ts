import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';
import { getPhoneRequestKeyboard } from '../keyboards/registrationKeyboard';

export async function handleLegalServicesView(ctx: MyContext) {
  const text =
    `💼 ${UI.header('PROFESSIONAL YURIDIK XIZMATLAR', '⚖️')}\n\n` +
    `Bizning tajribali yurist va advokatlarimiz sizga quyidagi rasmiy yuridik xizmatlarni taklif etadi:\n\n` +
    ` 🔹 ⚖️ <b>Professional Advokat Konsultatsiyasi:</b> Fuqarolik, mehnat, oila va jinoyat ishlari bo‘yicha.\n` +
    ` 🔹 📄 <b>Shartnomalar Tuzish:</b> Ijara, oldi-sotdi va biznes shartnomalarini rasmiylashtirish.\n` +
    ` 🔹 🏛 <b>Sud Hujjatlari:</b> Da'vo arizalari, shikoyatlar va arizalar tayyorlash.\n` +
    ` 🔹 🏢 <b>Biznes Xizmatlari:</b> YTT va MChJlarni ro‘yxatdan o‘tkazish hamda yuridik kuzatuv.\n\n` +
    `${UI.DIVIDER}\n` +
    `Murojaat yuborish uchun quyidagi tugmani bosing:`;

  const buttons = [
    [Markup.button.callback('✍️ Rasmiy Murojaat Yuborish', 'service_apply_start')],
    [Markup.button.callback('📞 Yurist Bilan Bog‘lanish', 'service_contact')],
  ];

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

export async function handleServiceApplyStart(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.user) return ctx.reply('⚠️ Iltimos, /start buyrug‘i orqali avval ro‘yxatdan o‘ting.');

  ctx.session = ctx.session || {};
  (ctx.session as any).serviceApplication = { step: 'AWAITING_TEXT' };

  const buttons = [[Markup.button.callback('❌ Bekor Qilish', 'back_to_services')]];

  return ctx.editMessageText(
    `✍️ ${UI.header('RASMIY MUROJAAT YUBORISH', '📝')}\n\n` +
    `Iltimos, o‘zingizni qiziqtirgan **yuridik masalangizni yoki murojaat matnini** batafsilroq yozib yuboring:\n\n` +
    `${UI.THIN_DIVIDER}`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleServiceApplicationSteps(ctx: MyContext, next: () => Promise<void>) {
  const appSession = (ctx.session as any)?.serviceApplication;
  if (!appSession || !appSession.step) {
    return next();
  }

  if (!ctx.message) return next();

  // STEP 1: Awaiting request text
  if (appSession.step === 'AWAITING_TEXT') {
    if (!('text' in ctx.message) || ctx.message.text.trim().length < 5) {
      return ctx.reply('⚠️ Iltimos, murojaatingiz matnini batafsilroq va kamida 5 ta harfdan iborat ko‘rinishda yozing:');
    }

    const text = ctx.message.text.trim();
    appSession.requestText = text;

    // Check if user has phone
    if (ctx.user?.phone && ctx.user.phone !== 'Kiritilmagan') {
      appSession.phone = ctx.user.phone;
      return submitServiceApplication(ctx, appSession);
    } else {
      appSession.step = 'AWAITING_PHONE';
      return ctx.reply(
        `Rahmat! Endi yuristlarimiz siz bilan bog‘lanishlari uchun **"📱 Telefon raqamni yuborish"** tugmasini bosing:`,
        { parse_mode: 'HTML', ...getPhoneRequestKeyboard() }
      );
    }
  }

  // STEP 2: Awaiting phone number
  if (appSession.step === 'AWAITING_PHONE') {
    let phone = '';
    if ('contact' in ctx.message && ctx.message.contact) {
      phone = ctx.message.contact.phone_number;
    } else if ('text' in ctx.message) {
      phone = ctx.message.text.trim();
    }

    if (!phone || phone.length < 7) {
      return ctx.reply('⚠️ Iltimos, telefon raqamingizni to‘g‘ri shaklda yuboring:', getPhoneRequestKeyboard());
    }

    if (!phone.startsWith('+')) phone = '+' + phone;

    appSession.phone = phone;
    return submitServiceApplication(ctx, appSession);
  }

  return next();
}

async function submitServiceApplication(ctx: MyContext, appSession: any) {
  if (!ctx.user) return;

  const requestText = appSession.requestText;
  const phone = appSession.phone || ctx.user.phone || 'Kiritilmagan';

  try {
    // Save to UserActivity DB
    await prisma.userActivity.create({
      data: {
        userId: ctx.user.id,
        action: 'LEGAL_SERVICE_REQUEST',
        metadata: JSON.stringify({
          text: requestText,
          phone,
        }),
      },
    });

    // Notify all admins in Telegram
    const admins = await prisma.admin.findMany({ select: { telegramId: true } });

    const adminNotificationText =
      `🔔 ${UI.header('YANGI YURIDIK MUROJAAT KELDI', '📩')}\n\n` +
      `👤 <b>Foydalanuvchi:</b> ${escapeHTML(ctx.user.firstName)} (@${escapeHTML(ctx.user.username || 'username_yoq')})\n` +
      `📱 <b>Telefon:</b> <code>${escapeHTML(phone)}</code>\n` +
      `💼 <b>Maqomi:</b> ${escapeHTML(ctx.user.role || 'Belgilanmagan')}\n\n` +
      `${UI.THIN_DIVIDER}\n` +
      `📝 <b>MUROJAAT MATNI:</b>\n` +
      `"${escapeHTML(requestText)}"\n\n` +
      `${UI.DIVIDER}`;

    for (const adm of admins) {
      try {
        await ctx.telegram.sendMessage(Number(adm.telegramId), adminNotificationText, {
          parse_mode: 'HTML',
        });
      } catch (err) {
        console.error('Failed to notify admin about legal request:', err);
      }
    }

    (ctx.session as any).serviceApplication = undefined;

    return ctx.reply(
      `🎉 ${UI.header('MUROJAATINGIZ QABUL QILINDI', '✅')}\n\n` +
      `Yuridik murojaatingiz muvaffaqiyatli mutaxassislarimizga yuborildi.\n` +
      `📱 <b>Aloqa Raqami:</b> <code>${escapeHTML(phone)}</code>\n\n` +
      `Yuristlarimiz tez orada siz ko‘rsatgan telefon raqami orqali bog‘lanishadi. Rahmat!`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Error submitting legal service application:', error);
    return ctx.reply('⚠️ Murojaatni saqlashda xatolik yuz berdi.');
  }
}

export async function handleServiceContact(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const text =
    `📞 ${UI.header('YURIST BILAN TIKKA ALOQA', '☎️')}\n\n` +
    `Siz professional yurist va advokatimiz bilan bevosita bog‘lanishingiz mumkin:\n\n` +
    ` 📱 <b>Telefon:</b> <code>+998 (88) 399 88 60</code>\n` +
    ` 💬 <b>Telegram Admin:</b> @Imomali_Mamatkulov\n` +
    ` 🌐 <b>Ish Vaqti:</b> Dushanba - Shanba (09:00 - 18:00)\n\n` +
    `${UI.DIVIDER}`;

  const buttons = [
    [Markup.button.url('💬 Telegram Admin bilan Bog‘lanish', 'https://t.me/Imomali_Mamatkulov')],
    [Markup.button.callback('🔙 Yuridik Xizmatlarga Qaytish', 'back_to_services')],
  ];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}
