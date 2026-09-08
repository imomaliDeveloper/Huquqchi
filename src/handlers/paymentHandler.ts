import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';
import { prisma } from '../database/prisma';
import config from '../config';
import { escapeHTML, formatHeader, formatBadge, formatSectionDivider } from '../utils/ui';

export async function handlePaymentView(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  const isPro = user?.isPro || false;

  let html = formatHeader('👑 VIP PRO Obuna va Imkoniyatlar');
  html += `Status: ${isPro ? formatBadge('ACTIVE PRO', 'pro') : formatBadge('FREE BEPUL', 'warning')}\n\n`;
  html += `🚀 <b>PRO Obuna bilan sizga quyidagilar ochiladi:</b>\n`;
  html += `✅ <b>Cheksiz AI Yuridik Konsultatsiya</b> (Kutishsiz tezkor javoblar);\n`;
  html += `✅ <b>Cheksiz PDF Hujjat Yaratuvchi</b> (Ijara, Qarz, Mehnat shartnomalari);\n`;
  html += `✅ <b>Barcha PDF Yuridik Kitoblar & Milliy Sertifikat Testlari</b> yuklab olish;\n`;
  html += `✅ <b>VIP Yurist Yordami</b> va ustuvor qo‘llab-quvvatlash.\n\n`;

  if (isPro) {
    html += `🎉 <b>Siz allaqachon VIP PRO a‘zosisiz! Barcha imkoniyatlar faol.</b>`;
    return ctx.reply(html, { parse_mode: 'HTML' });
  }

  html += `💳 <b>Rasmiy Karta Revisitlari:</b>\n`;
  html += `• 💳 <b>Karta Raqami:</b> <code>${config.adminCardNumber}</code>\n`;
  html += `• 👤 <b>Karta Egasi:</b> ${config.adminCardHolder}\n\n`;

  html += `💰 <b>Tarifni tanlang:</b>\n`;
  html += `• <b>1 Oylik PRO:</b> <code>29 000 UZS</code>\n`;
  html += `• <b>1 Yillik PRO (Tejamkor):</b> <code>199 000 UZS</code> (40% chegirma!)\n\n`;
  html += `📲 <i>To‘lovni har qanday bank ilovasi (Click, Payme, Uzum, Anorbank) orqali kartaga o‘tkazing va chekni yuboring.</i>`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💳 1 Oylik PRO (29,000 UZS)', 'buy_pro_card_monthly')],
    [Markup.button.callback('🌟 1 Yillik PRO (199,000 UZS)', 'buy_pro_card_yearly')],
  ]);

  return ctx.reply(html, { parse_mode: 'HTML', ...keyboard });
}

export async function handlePaymentCardInfo(ctx: MyContext, plan: 'PRO_MONTHLY' | 'PRO_YEARLY') {
  await ctx.answerCbQuery();
  const price = plan === 'PRO_MONTHLY' ? '29 000 UZS' : '199 000 UZS';
  const planTitle = plan === 'PRO_MONTHLY' ? '1 Oylik PRO' : '1 Yillik PRO';

  (ctx.session as any).paymentSession = {
    plan,
    price,
    step: 'AWAITING_RECEIPT',
  };

  let html = formatHeader(`💳 Karta Orqali To‘lov: ${planTitle}`);
  html += `To‘lovni amalga oshirish uchun quyidagi karta raqamiga o‘tkazma qiling:\n\n`;
  html += `📌 <b>To‘lov Summasi:</b> <code>${price}</code>\n`;
  html += `💳 <b>Karta Raqami:</b> <code>${config.adminCardNumber}</code>\n`;
  html += `👤 <b>Karta Egasi:</b> ${config.adminCardHolder}\n\n`;
  html += `📲 <b>QADAMLAR:</b>\n`;
  html += `1. Har qanday ilova (Click, Payme, Uzum, Anorbank) orqali kartaga <b>${price}</b> o‘tkazing.\n`;
  html += `2. To‘lov amalga oshirilgach, to‘lov <b>chekining rasm (skrinshot)ini</b> yoki kvitansiyasini ushbu chatga yuboring.\n`;
  html += `3. Admin to‘lovni tasdiqlashi bilanoq PRO obunangiz faollashadi! ✨`;

  return ctx.reply(html, { parse_mode: 'HTML' });
}

export async function handlePaymentReceiptMessage(ctx: MyContext) {
  const session = (ctx.session as any)?.paymentSession;
  if (!session || session.step !== 'AWAITING_RECEIPT') return false;

  const telegramId = ctx.from?.id;
  if (!telegramId) return false;

  const user = ctx.user || (await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } }));
  if (!user) return false;

  // Clear session step
  delete (ctx.session as any).paymentSession;

  let html = formatHeader('🧾 To‘lov Cheki Qabul Qilindi!');
  html += `To‘lov chekingiz admin ko‘rib chiqishi uchun yuborildi.\n\n`;
  html += `⏱ <i>Tez orada to‘lovingiz tekshirilib, so‘ralgan xizmat/fayl taqdim etiladi. Rahmat!</i>`;

  await ctx.reply(html, { parse_mode: 'HTML' });

  // Send Notification to all Admins in DB
  const admins = await prisma.admin.findMany();
  const userName = user.username ? `@${user.username}` : `${user.firstName} ${user.lastName || ''}`;

  let adminAlertHtml = formatHeader('🔔 YANGI TO‘LOV CHEKI KELDI!');
  adminAlertHtml += `<b>Foydalanuvchi:</b> ${escapeHTML(userName)}\n`;
  adminAlertHtml += `<b>Telegram ID:</b> <code>${user.telegramId}</code>\n`;
  adminAlertHtml += `<b>Maqsadi:</b> ${session.articleId ? `PDF Material (ID: ${session.articleId})` : session.plan}\n`;
  adminAlertHtml += `<b>To‘lov Summasi:</b> ${session.price}\n\n`;
  adminAlertHtml += `<i>To‘lovni tasdiqlaysizmi?</i>`;

  const approveCallback = session.articleId
    ? `admin_approve_pdf_${user.id}_${session.articleId}`
    : `admin_approve_pay_${user.id}_${session.plan}`;

  const adminKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Tasdiqlash va Yuborish', approveCallback)],
    [Markup.button.callback('❌ Rad Etish', `admin_reject_pay_${user.id}`)],
  ]);

  const photoMsg = ctx.message && 'photo' in ctx.message ? (ctx.message as any) : null;
  const hasPhoto = photoMsg && Array.isArray(photoMsg.photo) && photoMsg.photo.length > 0;

  for (const adm of admins) {
    try {
      if (hasPhoto) {
        // Forward receipt photo to Admin
        const photoId = photoMsg.photo[photoMsg.photo.length - 1].file_id;
        await ctx.telegram.sendPhoto(Number(adm.telegramId), photoId, {
          caption: adminAlertHtml,
          parse_mode: 'HTML',
          ...adminKeyboard,
        });
      } else {
        await ctx.telegram.sendMessage(Number(adm.telegramId), adminAlertHtml, {
          parse_mode: 'HTML',
          ...adminKeyboard,
        });
      }
    } catch {
      // Ignore admin offline / block errors
    }
  }

  return true;
}

export async function handleAdminApprovePayment(ctx: MyContext, targetUserId: number, plan: 'PRO_MONTHLY' | 'PRO_YEARLY') {
  await ctx.answerCbQuery();

  const days = plan === 'PRO_MONTHLY' ? 30 : 365;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const targetUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isPro: true },
  });

  await prisma.subscription.create({
    data: {
      userId: targetUserId,
      plan,
      endDate,
      isActive: true,
    },
  });

  // Notify Admin
  await (ctx.editMessageCaption
    ? ctx.editMessageCaption(`✅ <b>TO‘LOV TASDIQLANDI!</b>\nFoydalanuvchi (ID: ${targetUser.telegramId})ga ${plan} VIP PRO obunasi berildi.`, { parse_mode: 'HTML' }).catch(() => {})
    : ctx.reply(`✅ <b>TO‘LOV TASDIQLANDI!</b>\nFoydalanuvchi (ID: ${targetUser.telegramId})ga ${plan} VIP PRO obunasi berildi.`, { parse_mode: 'HTML' }));

  // Notify User in Telegram
  try {
    let userHtml = formatHeader('🎉 TO‘LOVINGIZ TASDIQLANDI!');
    userHtml += `Admin to‘lov chekingizni tasdiqladi! 👑 <b>VIP PRO</b> obunangiz faollashtirildi!\n\n`;
    userHtml += `<b>Reja:</b> ${plan === 'PRO_MONTHLY' ? '1 Oylik PRO' : '1 Yillik PRO'}\n`;
    userHtml += `<b>Amal qilish muddati:</b> ${endDate.toLocaleDateString('uz-UZ')}\n\n`;
    userHtml += `Endi siz barcha PDF shartnomalar, AI yordamchi va Lex.uz xizmatlaridan cheksiz foydalanishingiz mumkin! 🚀`;

    await ctx.telegram.sendMessage(Number(targetUser.telegramId), userHtml, { parse_mode: 'HTML' });
  } catch {
    // User blocked bot or invalid ID
  }
}

export async function handleAdminApprovePdfDelivery(ctx: MyContext, targetUserId: number, articleId: number) {
  await ctx.answerCbQuery();

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  const article = await prisma.legalArticle.findUnique({ where: { id: articleId } });

  if (!targetUser || !article) {
    return ctx.reply('⚠️ Foydalanuvchi yoki PDF material topilmadi.');
  }

  // Notify Admin
  await (ctx.editMessageCaption
    ? ctx.editMessageCaption(`✅ <b>PDF TO‘LOVI TASDIQLANDI!</b>\n"${article.title}" PDF fayli foydalanuvchiga yuborildi.`, { parse_mode: 'HTML' }).catch(() => {})
    : ctx.reply(`✅ <b>PDF TO‘LOVI TASDIQLANDI!</b>\n"${article.title}" PDF fayli foydalanuvchiga yuborildi.`, { parse_mode: 'HTML' }));

  // Send PDF document directly to user
  try {
    let captionHtml = formatHeader('🎓 MILLIY SERTIFIKAT PDF MATERIALI');
    captionHtml += `Siz xarid qilgan <b>"${escapeHTML(article.title)}"</b> PDF materiali taqdim etildi.\n\n`;
    captionHtml += `Muvaffaqiyatli imtihon topshirishingizni tilaymiz! 🚀`;

    if (article.fileId) {
      await ctx.telegram.sendDocument(Number(targetUser.telegramId), article.fileId, {
        caption: captionHtml,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.telegram.sendMessage(
        Number(targetUser.telegramId),
        `${captionHtml}\n\n📖 <b>Kontent:</b>\n${escapeHTML(article.content)}`
      );
    }
  } catch (err: any) {
    console.error('Error delivering PDF to user:', err);
  }
}

export async function handleAdminRejectPayment(ctx: MyContext, targetUserId: number) {
  await ctx.answerCbQuery();

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

  await (ctx.editMessageCaption
    ? ctx.editMessageCaption(`❌ <b>TO‘LOV RAD ETILDI!</b>\nFoydalanuvchining to‘lovi rad etildi.`, { parse_mode: 'HTML' }).catch(() => {})
    : ctx.reply(`❌ <b>TO‘LOV RAD ETILDI!</b>\nFoydalanuvchining to‘lovi rad etildi.`, { parse_mode: 'HTML' }));

  if (targetUser) {
    try {
      await ctx.telegram.sendMessage(
        Number(targetUser.telegramId),
        `⚠️ <b>To‘lov rad etildi:</b> Siz yuborgan to‘lov cheki tasdiqlanmadi. Qaytadan tekshirib yuborishingizni so‘raymiz.`
      );
    } catch {}
  }
}

export async function handlePaymentProcess(ctx: MyContext, plan: 'PRO_MONTHLY' | 'PRO_YEARLY') {
  await ctx.answerCbQuery();
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return;

  const days = plan === 'PRO_MONTHLY' ? 30 : 365;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  // Activate PRO subscription in Prisma DB
  await prisma.user.update({
    where: { id: user.id },
    data: { isPro: true },
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan,
      endDate,
      isActive: true,
    },
  });

  let html = formatHeader('🎉 TO‘LOV MUVAFFAQIYATLI AMALGA OSHIRILDI!');
  html += `Sizning <b>VIP PRO</b> obunangiz faollashtirildi! ✨\n\n`;
  html += `<b>Reja:</b> ${plan === 'PRO_MONTHLY' ? '1 Oylik PRO' : '1 Yillik PRO'}\n`;
  html += `<b>Amal qilish muddati:</b> ${endDate.toLocaleDateString('uz-UZ')}\n\n`;
  html += `Endi siz barcha PDF shartnomalar, AI yordamchi va Lex.uz xizmatlaridan cheksiz foydalanishingiz mumkin! 🚀`;

  return ctx.reply(html, { parse_mode: 'HTML' });
}
