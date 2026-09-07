import { MyContext } from '../bot/context';
import AdminService from '../services/adminService';
import prisma from '../database/prisma';
import config from '../config';
import { Markup } from 'telegraf';
import { USER_ROLE_LABELS, UserRole } from '../utils/constants';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';
import { ChannelPostService } from '../services/channelPostService';

export interface AdminPdfUploadSession {
  step: 'AWAITING_FILE' | 'AWAITING_CATEGORY' | 'AWAITING_PRICE';
  fileId?: string;
  fileName?: string;
  categoryId?: number;
  isCert?: boolean;
  isTextbook?: boolean;
  isQuiz?: boolean;
}

export async function handleAdminCommand(ctx: MyContext) {
  if (!ctx.from) return;

  if (ctx.session) {
    delete (ctx.session as any).adminBroadcastActive;
    delete (ctx.session as any).adminPdfUpload;
    delete (ctx.session as any).adminConstitutionUpload;
    delete (ctx.session as any).adminQuiz;
  }

  const isAdmin = await AdminService.isAdmin(ctx.from.id);
  if (!isAdmin) {
    // If table is empty, promote the first user calling /admin to SuperAdmin for dev convenience
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      await AdminService.ensureSuperAdmin(ctx.from.id, ctx.from.username);
      await ctx.reply('🔑 <b>Siz tizimning birinchi Super Admini sifatida tayinlandingiz!</b>', { parse_mode: 'HTML' });
    } else {
      return ctx.reply('⛔ <b>Ruxsat berilmagan!</b> Ushbu buyruq faqat administratorlar uchun mo‘ljallangan.', {
        parse_mode: 'HTML',
      });
    }
  }

  const channelName = config.telegramChannelUsername || '@Huquq_study';

  const buttons = [
    [Markup.button.callback(`📢 ${channelName} Kanaliga Post Joylash`, 'admin_post_channel')],
    [Markup.button.callback('🎙 Konstitutsiya Audiosini Yuklash', 'admin_upload_const_audio')],
    [Markup.button.callback('🗑 Konstitutsiya Audiolarini Qayta Tozalash', 'admin_clear_const_audio')],
    [Markup.button.callback('📄 PDF Test / Savolnoma Yuklash', 'admin_upload_pdf_quiz')],
    [Markup.button.callback('📖 Huquqiy Darslik & Qonun Yuklash', 'admin_upload_textbook')],
    [Markup.button.callback('🗑 Darsliklarni Boshqarish & O‘chirish', 'admin_manage_textbooks')],
    [Markup.button.callback('💰 Sotuvlar & Daromad Hisoboti', 'admin_revenue')],
    [Markup.button.callback('📥 Foydalanuvchilarni CSV Export qilish', 'admin_export_csv')],
    [Markup.button.callback('🎓 Milliy Sertifikat PDF Qo‘llanma Yuklash', 'admin_upload_cert_pdf')],
    [Markup.button.callback('📝 Yangi Test Yaratish', 'admin_create_quiz')],
    [Markup.button.callback('📚 Oddiy PDF Kitob / Material Yuklash', 'admin_upload_pdf')],
    [Markup.button.callback('📊 Tizim Statistikasi', 'admin_stats')],
    [Markup.button.callback('👥 Foydalanuvchilar Ro‘yxati', 'admin_users')],
    [Markup.button.callback('📢 E‘lon yuborish (Broadcast)', 'admin_broadcast')],
  ];

  const text =
    `🔐 ${UI.header('ADMINISTRATOR PANELI', '👑')}\n\n` +
    `Xush kelibsiz, Admin!\n` +
    `Quyidagi bo‘limlardan birini tanlang:\n\n` +
    `${UI.DIVIDER}`;

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

export async function handleAdminPostChannelMenu(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const channelName = config.telegramChannelUsername || '@Huquq_study';

  let text = `📢 ${UI.header(`TELEGRAM KANALGA POST JOYLASH (${channelName})`, '🚀')}\n\n`;
  text += `Qaysi kontent turini zudlik bilan <b>${escapeHTML(channelName)}</b> kanaliga chop etmoqchisiz?\n\n`;
  text += `💡 <i>Eslatma: Bot <b>${escapeHTML(channelName)}</b> kanalida Administrator bo‘lishi va post yuborish ruxsatiga ega bo‘lishi lozim.</i>`;

  const buttons = [
    [Markup.button.callback('📝 Kun Testini Kanalga Joylash', 'admin_post_channel_quiz')],
    [Markup.button.callback('📖 Huquqiy Dajestni Kanalga Joylash', 'admin_post_channel_digest')],
    [Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')],
  ];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export async function handleAdminPostChannelExecute(ctx: MyContext, type: 'quiz' | 'digest') {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const channelName = config.telegramChannelUsername || '@Huquq_study';
  await ctx.reply(`🚀 <i>Post <b>${escapeHTML(channelName)}</b> kanaliga chop etilmoqda...</i>`, { parse_mode: 'HTML' });

  let result;
  if (type === 'quiz') {
    result = await ChannelPostService.postQuizToChannel(ctx.telegram as any, channelName);
  } else {
    result = await ChannelPostService.postDigestToChannel(ctx.telegram as any, channelName);
  }

  if (result.success) {
    let successText = `🎉 <b>POST MUVAFFAQIYATLI CHOP ETILDI!</b>\n\n`;
    successText += `📢 <b>Kanal:</b> ${escapeHTML(channelName)}\n`;
    successText += `📦 <b>Tur:</b> ${type === 'quiz' ? 'Kunlik Huquqiy Test' : 'Kunlik Huquqiy Dajest'}\n\n`;
    successText += `Kanal obunachilari endi post va botga o‘tuvchi tugmani ko‘rishlari mumkin! 🚀`;

    const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];
    return ctx.reply(successText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } else {
    let errorText = `⚠️ <b>KANALGA POST JOYLASHDA XATOLIK!</b>\n\n`;
    errorText += `<b>Kanal:</b> ${escapeHTML(channelName)}\n`;
    errorText += `<b>Xato sababi:</b> ${escapeHTML(result.error || 'Noma’lum xatolik')}\n\n`;
    errorText += `📌 <b>YELCHIM:</b>\n`;
    errorText += `1. Telegram‘da <b>${escapeHTML(channelName)}</b> kanaliga kiring.\n`;
    errorText += `2. Kanal sozlamalaridan Botni <b>Administrator</b> qilib qo‘shing.\n`;
    errorText += `3. Botga "Post xabarlarini yuborish (Publishing messages)" huquqini bering va qayta urinib ko‘ring.`;

    const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];
    return ctx.reply(errorText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  }
}

export async function handleAdminRevenue(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const totalProUsers = await prisma.user.count({ where: { isPro: true } });
  const totalSubscriptions = await prisma.subscription.count();
  const subRevenueAggregate = await prisma.subscription.aggregate({
    _sum: { amount: true },
  });

  const totalSubRevenue = subRevenueAggregate._sum.amount || 0;

  let text = `💰 ${UI.header('MOLIYAVIY HISOBOT VA DAROMAD', '💵')}\n\n`;
  text += `💵 <b>Jami Tushgan Daromad:</b> <code>${totalSubRevenue.toLocaleString('uz-UZ')} UZS</code>\n\n`;
  text += `👑 <b>Faol VIP PRO Foydalanuvchilar:</b> <b>${totalProUsers} ta</b>\n`;
  text += `📦 <b>Jami Sotilgan Obunalar:</b> <b>${totalSubscriptions} ta</b>\n\n`;
  text += `${UI.DIVIDER}\n`;
  text += `<i>Barcha to‘lovlar to‘g‘ridan-to‘g‘ri admin kartasiga o‘tkazilgan va tasdiqlangan.</i>`;

  const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export async function handleAdminExportCsv(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let csvContent = 'ID,TelegramId,FirstName,LastName,Username,Phone,Role,IsPro,ReferralCount,CreatedAt\n';

  users.forEach((u) => {
    const fName = `"${(u.firstName || '').replace(/"/g, '""')}"`;
    const lName = `"${(u.lastName || '').replace(/"/g, '""')}"`;
    const uName = `"${(u.username || '').replace(/"/g, '""')}"`;
    const phone = `"${(u.phone || '').replace(/"/g, '""')}"`;
    const role = `"${(u.role || '').replace(/"/g, '""')}"`;
    const date = new Date(u.createdAt).toISOString();

    csvContent += `${u.id},${u.telegramId},${fName},${lName},${uName},${phone},${role},${u.isPro},${u.referralCount || 0},${date}\n`;
  });

  const buffer = Buffer.from(csvContent, 'utf-8');

  await ctx.replyWithDocument(
    {
      source: buffer,
      filename: `Huquqchi_Users_${Date.now()}.csv`,
    },
    {
      caption: `📊 <b>Foydalanuvchilar ma‘lumotlar bazasi (CSV formatida)</b>\nJami: ${users.length} ta foydalanuvchi.`,
      parse_mode: 'HTML',
    }
  );
}

export async function handleAdminPdfUploadPrompt(ctx: MyContext, isCert = false, isTextbook = false, isQuiz = false) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  ctx.session = ctx.session || {};
  (ctx.session as any).adminPdfUpload = {
    step: 'AWAITING_FILE',
    isCert,
    isTextbook,
    isQuiz,
  } as AdminPdfUploadSession;

  const buttons = [[Markup.button.callback('❌ Bekor Qilish', 'admin_home')]];

  let title = '📚 PDF KITOB YOKI MANBA YUKLASH';
  let helpText = 'Iltimos, **PDF kitob** yoki manba faylingizni botga yuboring (Document shaklida):';

  if (isQuiz) {
    title = '📄 PDF TEST VA SAVOLNOMA YUKLASH';
    helpText = 'Iltimos, "PDF Testlar va Savolnomalar" bo‘limiga qo‘shmoqchi bo‘lgan **PDF test faylini** botga yuboring (Document shaklida):';
  } else if (isTextbook) {
    title = '📖 HUQUQIY DARSLIK VA QONUNCHILIK YUKLASH';
    helpText = 'Iltimos, "Huquqiy Darsliklar va Qonunchilik" bo‘limiga qo‘shmoqchi bo‘lgan **PDF darslik** faylini botga yuboring (Document shaklida):';
  } else if (isCert) {
    title = '🎓 MILLIY SERTIFIKAT PDF QO‘LLANMA YUKLASH';
    helpText = 'Iltimos, **Milliy Sertifikat** bo‘limiga qo‘shmoqchi bo‘lgan DTM testlar to‘plami yoki PDF qo‘llanma faylini botga yuboring (Document shaklida):';
  }

  return ctx.editMessageText(
    `${UI.header(title, '📖')}\n\n${helpText}`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminPdfDocumentMessage(ctx: MyContext, next: () => Promise<void>) {
  const uploadSession = (ctx.session as any)?.adminPdfUpload as AdminPdfUploadSession;
  if (!uploadSession || !uploadSession.step) {
    return next();
  }

  // Handle Price Text Input Step
  if (uploadSession.step === 'AWAITING_PRICE' && ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text.trim();
    const priceAmount = Math.max(0, parseInt(text.replace(/\D/g, ''), 10) || 0);

    try {
      let categoryId = uploadSession.categoryId;
      if (uploadSession.isCert && !categoryId) {
        let certCat = await prisma.category.findUnique({ where: { name: '🎓 Milliy Sertifikat Materiallari' } });
        if (!certCat) {
          certCat = await prisma.category.create({
            data: { name: '🎓 Milliy Sertifikat Materiallari', description: 'DTM testlari va qo‘llanmalar' },
          });
        }
        categoryId = certCat.id;
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId! } });

      await prisma.legalArticle.create({
        data: {
          title: uploadSession.fileName || 'PDF Qo‘llanma.pdf',
          content: uploadSession.isQuiz
            ? `PDF Testlar va Savolnomalar bo‘limi uchun yuklangan test to‘plami.`
            : uploadSession.isCert
            ? `Milliy Sertifikat imtihoniga tayyorgarlik uchun PDF o‘quv qo‘llanmasi va testlar to‘plami.`
            : `Ushbu kitob "${category?.name || 'Kutubxona'}" bo‘limi uchun PDF o‘quv manbasi sifatida yuklangan.`,
          source: 'Admin tomonidan yuklangan PDF manba',
          fileId: uploadSession.fileId,
          fileType: uploadSession.isQuiz ? 'pdf_quiz' : 'pdf',
          isPdfBook: true,
          price: priceAmount,
          categoryId: categoryId!,
        },
      });

      delete (ctx.session as any).adminPdfUpload;

      const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];
      const priceText = priceAmount > 0 ? `${priceAmount.toLocaleString('uz-UZ')} UZS` : 'BEPUL';

      return ctx.reply(
        `🎉 <b>PDF QO‘LLANMA DASTURGA QO‘SHILDI!</b>\n\n` +
        `📖 <b>Kitob/Qo‘llanma:</b> ${escapeHTML(uploadSession.fileName)}\n` +
        `📂 <b>Kategoriya:</b> ${escapeHTML(category?.name || 'Milliy Sertifikat')}\n` +
        `🏷 <b>Belgilangan Narx:</b> <code>${priceText}</code>\n\n` +
        `Ushbu PDF fayl endi foydalanuvchilarga ko‘rinadi va belgilangan narxda karta orqali sotiladi! 🚀`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      );
    } catch (err) {
      console.error('Error saving PDF guidebook:', err);
      delete (ctx.session as any).adminPdfUpload;
      return ctx.reply('⚠️ PDF qo‘llanmani saqlashda xatolik yuz berdi.');
    }
  }

  // Handle Document File Upload Step
  if (uploadSession.step === 'AWAITING_FILE') {
    if (ctx.message && 'document' in ctx.message && ctx.message.document) {
      const doc = ctx.message.document;
      const fileId = doc.file_id;
      const fileName = doc.file_name || 'Huquqiy_Qo‘llanma.pdf';

      uploadSession.fileId = fileId;
      uploadSession.fileName = fileName;

      if (uploadSession.isCert) {
        uploadSession.step = 'AWAITING_PRICE';
        return ctx.reply(
          `✅ <b>"${escapeHTML(fileName)}"</b> fayli qabul qilindi!\n\n` +
          `💰 <b>Ushbu PDF qo‘llanma uchun sotuv narxini kiriting (so‘mda):</b>\n\n` +
          `<i>Misol: 15000 (bepul qilmoqchi bo‘lsangiz 0 yuboring)</i>`,
          { parse_mode: 'HTML' }
        );
      } else {
        uploadSession.step = 'AWAITING_CATEGORY';
        const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
        const buttons = categories.map((cat) => [
          Markup.button.callback(`📂 ${cat.name}`, `admin_pdf_cat_${cat.id}`),
        ]);
        buttons.push([Markup.button.callback('❌ Bekor Qilish', 'admin_home')]);

        return ctx.reply(
          `✅ <b>"${escapeHTML(fileName)}"</b> fayli qabul qilindi!\n\n` +
          `Endi ushbu kitob qaysi huquqiy kategoriyaga tegishli ekanligini tanlang:`,
          { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
        );
      }
    } else {
      return ctx.reply('⚠️ Iltimos, PDF faylni **Document** (hujjat) shaklida yuboring:');
    }
  }

  return next();
}

export async function handleAdminPdfCategorySelect(ctx: MyContext, categoryId: number) {
  await ctx.answerCbQuery().catch(() => {});

  const uploadSession = (ctx.session as any)?.adminPdfUpload as AdminPdfUploadSession;
  if (!uploadSession || !uploadSession.fileId) {
    return ctx.reply('⚠️ Yuklash sessiyasi topilmadi.');
  }

  uploadSession.categoryId = categoryId;
  uploadSession.step = 'AWAITING_PRICE';

  return ctx.reply(
    `💰 <b>Ushbu PDF kitob uchun sotuv narxini kiriting (so‘mda):</b>\n\n` +
    `<i>Misol: 10000 (bepul qilmoqchi bo‘lsangiz 0 yuboring)</i>`,
    { parse_mode: 'HTML' }
  );
}

export async function handleAdminStats(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const stats = await AdminService.getSystemStats();

  let rolesText = '';
  Object.entries(USER_ROLE_LABELS).forEach(([key, val]) => {
    const count = stats.roleStatsMap[key] || 0;
    rolesText += `   ├ ${val.icon} ${val.label}: <b>${count} ta</b>\n`;
  });

  const text =
    `📊 ${UI.header('TIZIM STATISTIKASI HISOBOTI', '📈')}\n\n` +
    `👥 <b>Jami Foydalanuvchilar:</b> <b>${stats.totalUsers} ta</b>\n\n` +
    `💼 <b>Rollar Bo'yicha Taqsimot:</b>\n${rolesText}\n` +
    `📚 <b>Kategoriyalar / Maqolalar:</b> <b>${stats.totalCategories} / ${stats.totalArticles} ta</b>\n` +
    `📝 <b>Jami Testlar / Ishlanganlar:</b> <b>${stats.totalQuizzes} / ${stats.totalQuizResults} ta</b>\n` +
    `🤖 <b>AI Muloqotlar / Xabarlar:</b> <b>${stats.totalAiConversations} / ${stats.totalAiMessages} ta</b>\n\n` +
    `${UI.DIVIDER}`;

  const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export async function handleAdminUsers(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const users = await AdminService.getAllUsers();

  let text = `👥 ${UI.header(`OXIRGI FOYDALANUVCHILAR (Top ${users.length})`, '📋')}\n\n`;

  users.forEach((u, i) => {
    const roleIcon = u.role && u.role in USER_ROLE_LABELS ? USER_ROLE_LABELS[u.role as UserRole].icon : '👤';
    const username = u.username ? '@' + escapeHTML(u.username) : 'username_yoq';
    text += `${i + 1}. ${roleIcon} <b>${escapeHTML(u.firstName)}</b> (${username}) - <code>${escapeHTML(u.phone || 'Tel yoq')}</code>\n`;
  });

  text += `\n${UI.DIVIDER}`;

  const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export async function handleAdminBroadcastPrompt(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  ctx.session = ctx.session || {};
  ctx.session.registration = { step: undefined };
  (ctx.session as any).adminBroadcastActive = true;

  const buttons = [[Markup.button.callback('❌ Bekor Qilish', 'admin_home')]];

  return ctx.editMessageText(
    `📢 ${UI.header('FOYDALANUVCHILARGA E\'LON YUBORISH', '📩')}\n\n` +
    `Barcha ro‘yxatdan o‘tgan foydalanuvchilarga yubormoqchi bo‘lgan e'loningizni yuboring (Matn, Rasm, Video, Hujjat yoki Boshqa kanaldan Forward qilingan xabar):\n\n` +
    `💡 <i>Yuborgan xabaringiz shakli va fayllari o‘z holicha barcha obunachilarga yetkaziladi.</i>`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminBroadcastExecute(ctx: MyContext) {
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;
  if (!ctx.chat || !ctx.message) return;

  if (ctx.session) {
    delete (ctx.session as any).adminBroadcastActive;
  }

  // Check if admin wants to cancel
  if ('text' in ctx.message) {
    const textMsg = ctx.message.text.trim();
    if (textMsg === '❌ Bekor Qilish' || textMsg === '/cancel') {
      return handleAdminCommand(ctx);
    }
  }

  const statusMsg = await ctx.reply("🚀 <i>E'lon barcha foydalanuvchilarga yuborilmoqda...</i>", { parse_mode: 'HTML' });

  const allUsers = await prisma.user.findMany({ select: { id: true, telegramId: true } });
  let successCount = 0;
  let failCount = 0;
  let deletedCount = 0;

  for (const u of allUsers) {
    try {
      await ctx.telegram.copyMessage(u.telegramId.toString(), ctx.chat.id, ctx.message.message_id);
      successCount++;
    } catch (err: any) {
      failCount++;
      const errStr = String(err?.message || err?.description || err).toLowerCase();
      // Auto-delete blocked, deactivated, or missing users from DB so they don't clog future broadcasts
      if (
        errStr.includes('blocked') ||
        errStr.includes('deactivated') ||
        errStr.includes('chat not found') ||
        errStr.includes('kicked') ||
        err?.response?.error_code === 403
      ) {
        try {
          await prisma.user.delete({ where: { id: u.id } });
          deletedCount++;
        } catch (delErr) {
          console.warn(`Failed to delete blocked user ${u.id}:`, delErr);
        }
      }
    }

    if (allUsers.length > 20) {
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }

  await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

  const buttons = [[Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]];

  let summaryText = `✅ <b>E'lon tarqatish yakunlandi!</b>\n\n` +
    `📬 Muvaffaqiyatli yetkazildi: <b>${successCount} ta</b>\n` +
    `❌ Yetkazilmadi (bloklangan/o'chirilgan): <b>${failCount} ta</b>`;

  if (deletedCount > 0) {
    summaryText += `\n🗑 <b>Bazadan avtomatik o‘chirildi:</b> <b>${deletedCount} ta</b> (botni bloklaganlar)`;
  }

  return ctx.reply(summaryText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}
