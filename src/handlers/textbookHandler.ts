import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';
import AdminService from '../services/adminService';

export async function handleTextbooksView(ctx: MyContext) {
  try {
    let categories = await prisma.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { id: 'asc' },
    });

    if (categories.length === 0) {
      // Seed default textbook categories if none exist
      const defaultCats = [
        { name: '📘 Fuqarolik Huquqi Darsliklari', description: 'Fuqarolik kodeksi, bitimlar va xususiy huquq' },
        { name: '📕 Jinoyat Huquqi va Protsessi', description: 'Jinoyat kodeksi, jazo va jinoyat-protsess' },
        { name: '📗 Mehnat va Soliq Qonunchiligi', description: 'Mehnat kodeksi, soliq va biznes huquqi' },
        { name: '📙 Konstitutsiyaviy Huquq', description: 'Konstitutsiya, inson huquqlari va davlat huquqi' },
        { name: '🎓 TDYU va OTM O‘quv Qo‘llanmalari', description: 'Universitet va Akademiya o‘quv qo‘llanmalari' },
      ];

      for (const cat of defaultCats) {
        await prisma.category.upsert({
          where: { name: cat.name },
          update: {},
          create: cat,
        });
      }

      categories = await prisma.category.findMany({
        include: { _count: { select: { articles: true } } },
        orderBy: { id: 'asc' },
      });
    }

    const buttons = categories.map((cat) => [
      Markup.button.callback(`${cat.name} (${cat._count.articles} ta)`, `tb_cat_${cat.id}`),
    ]);

    const message =
      `📖 ${UI.header('HUQUQIY DARSLIKLAR VA QONUNCHILIK', '📚')}\n\n` +
      `Ushbu bo‘limda O‘zbekiston Respublikasi Qonunchilik hujjatlari, TDYU, Akademiya darsliklari hamda rasmiy o‘quv qo‘llanmalarini o‘rganishingiz va PDF ko‘rinishida yuklab olishingiz mumkin:\n\n` +
      `${UI.DIVIDER}`;

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.editMessageText(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
        return ctx.reply(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      });
    }

    return ctx.reply(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error fetching textbook categories:', error);
    return ctx.reply('⚠️ Darsliklar kategoriyasini yuklashda xatolik yuz berdi.');
  }
}

export async function handleTextbookCategory(ctx: MyContext, categoryId: number) {
  await ctx.answerCbQuery().catch(() => {});

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { articles: true },
    });

    if (!category) {
      return ctx.reply('⚠️ Kategoriya topilmadi.');
    }

    if (category.articles.length === 0) {
      const emptyButtons = [[Markup.button.callback('🔙 Bo‘limlarga Qaytish', 'textbooks_home')]];
      return ctx.editMessageText(
        `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n\n` +
        `<i>Hozircha ushbu bo‘limga yangi darsliklar va qonunchilik hujjatlari yuklanmoqda. Admin tomonidan tez orada to‘ldiriladi!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(emptyButtons) }
      ).catch(() => {});
    }

    const buttons = category.articles.map((art) => {
      const priceTag = art.price > 0 ? ` [💰 ${art.price.toLocaleString('uz-UZ')} UZS]` : ' [BEPUL]';
      return [
        Markup.button.callback(`📖 ${art.title}${priceTag}`, `tb_art_${art.id}`),
      ];
    });

    buttons.push([Markup.button.callback('🔙 Bo‘limlarga Qaytish', 'textbooks_home')]);

    return ctx.editMessageText(
      `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n` +
      `${UI.THIN_DIVIDER}\n` +
      `Kerakli darslik yoki qonunchilik manbasini tanlang:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    ).catch(() => {});
  } catch (error) {
    console.error('Error in handleTextbookCategory:', error);
    return ctx.reply('⚠️ Darsliklarni yuklashda xatolik yuz berdi.');
  }
}

export async function handleTextbookDetails(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery().catch(() => {});

  try {
    const article = await prisma.legalArticle.findUnique({
      where: { id: articleId },
      include: { category: true },
    });

    if (!article) {
      return ctx.reply('⚠️ Darslik topilmadi.');
    }

    const priceText = article.price > 0 ? `${article.price.toLocaleString('uz-UZ')} UZS` : 'BEPUL / VIP PRO';

    let text = `📖 <b>${escapeHTML(article.title)}</b>\n`;
    text += `${UI.THIN_DIVIDER}\n`;
    text += `📁 <b>Kategoriya:</b> <i>${escapeHTML(article.category.name)}</i>\n`;
    text += `📌 <b>Manba:</b> <i>${escapeHTML(article.source || 'Huquqiy Darsliklar Bazi')}</i>\n`;
    text += `💵 <b>Narxi:</b> <code>${priceText}</code>\n\n`;
    text += `<b>TAVSIFI VA MAZMUNI:</b>\n`;
    text += `${escapeHTML(article.content)}\n\n`;
    text += `${UI.DIVIDER}`;

    const buttons: any[] = [];

    if (article.fileId) {
      buttons.push([Markup.button.callback('📥 PDF Darslikni Telegramda Yuklab Olish', `dl_tb_${article.id}`)]);
    } else {
      buttons.push([Markup.button.callback('📖 Telegramda O‘qish', `read_tb_${article.id}`)]);
    }

    // Show Admin Delete Button if current user is an Admin
    if (ctx.from && (await AdminService.isAdmin(ctx.from.id))) {
      buttons.push([Markup.button.callback('🗑 Darslikni O‘chirish (Admin)', `admin_del_tb_${article.id}`)]);
    }

    buttons.push([Markup.button.callback('🔙 Ro‘yxatga Qaytish', `tb_cat_${article.categoryId}`)]);

    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  } catch (error) {
    console.error('Error in handleTextbookDetails:', error);
    return ctx.reply('⚠️ Darslik tafsilotlarini yuklashda xatolik yuz berdi.');
  }
}

export async function handleDownloadTextbook(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery('✨ PDF Darslik yuklanmoqda...').catch(() => {});

  try {
    const article = await prisma.legalArticle.findUnique({ where: { id: articleId } });
    if (!article || !article.fileId) {
      return ctx.reply('⚠️ Darslikning PDF fayli topilmadi.');
    }

    return ctx.replyWithDocument(article.fileId, {
      caption: `📖 <b>${escapeHTML(article.title)}</b>\n\n@Huquqchi_bot darsliklar bo‘limidan yuklab olindi.`,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error downloading textbook PDF:', error);
    return ctx.reply('⚠️ PDF darslikni yuborishda xatolik yuz berdi.');
  }
}

export async function handleAdminDeleteTextbookPrompt(ctx: MyContext, articleId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await AdminService.isAdmin(telegramId))) {
    return ctx.reply('⚠️ Siz admin emassiz!');
  }

  const article = await prisma.legalArticle.findUnique({
    where: { id: articleId },
    include: { category: true },
  });

  if (!article) {
    return ctx.reply('⚠️ Darslik topilmadi.');
  }

  let text = `⚠️ <b>DARSLIKNI O‘CHIRISHNI TASDIQLANG!</b>\n\n`;
  text += `📖 <b>Nomi:</b> ${escapeHTML(article.title)}\n`;
  text += `📁 <b>Kategoriya:</b> ${escapeHTML(article.category.name)}\n\n`;
  text += `Ushbu darslik va unga biriktirilgan PDF fayl ma'lumotlar bazasidan butunlay o‘chiriladi.\n`;
  text += `Rostdan ham o‘chirmoqchimisiz?`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔴 Ha, Butunlay O‘chirilsin', `admin_del_tb_confirm_${article.id}`)],
    [Markup.button.callback(' Bekor qilish', `tb_art_${article.id}`)],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

export async function handleAdminDeleteTextbookConfirm(ctx: MyContext, articleId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await AdminService.isAdmin(telegramId))) {
    return ctx.reply('⚠️ Siz admin emassiz!');
  }

  const article = await prisma.legalArticle.findUnique({ where: { id: articleId } });
  if (!article) {
    return ctx.reply('⚠️ Darslik allaqachon o‘chirilgan yoki topilmadi.');
  }

  await prisma.legalArticle.delete({ where: { id: articleId } });

  let text = `✅ <b>DARSLIK MUVAFFAQIYATLI O‘CHIRILDI!</b>\n\n`;
  text += `📖 <i>${escapeHTML(article.title)}</i> bazadan to‘liq o‘chirib tashlandi.`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📖 Darsliklar Bo‘limiga Qaytish', 'textbooks_home')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery('✅ Darslik o‘chirildi!').catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

export async function handleAdminManageTextbooks(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await AdminService.isAdmin(telegramId))) {
    return ctx.reply('⚠️ Siz admin emassiz!');
  }

  const articles = await prisma.legalArticle.findMany({
    include: { category: true },
    orderBy: { id: 'desc' },
    take: 30,
  });

  if (articles.length === 0) {
    const emptyKb = Markup.inlineKeyboard([[Markup.button.callback('🔙 Admin Panel', 'admin_home')]]);
    return ctx.reply('📭 Hozircha birorta ham darslik mavjud emas.', { parse_mode: 'HTML', ...emptyKb });
  }

  let text = `📚 <b>MAVJUD DARSLIKLAR VA QONUNCHILIK HUJJATLARI (${articles.length} ta)</b>\n\n`;
  text += `O‘chirmoqchi bo‘lgan darsligingiz yonidagi <b>"🗑 O‘chirish"</b> tugmasini bosing:\n\n`;

  const buttons: any[][] = [];
  for (const art of articles) {
    buttons.push([
      Markup.button.callback(`📖 ${art.title.slice(0, 25)}...`, `tb_art_${art.id}`),
      Markup.button.callback(`🗑 O‘chirish`, `admin_del_tb_${art.id}`),
    ]);
  }
  buttons.push([Markup.button.callback('🔙 Admin Panelga Qaytish', 'admin_home')]);

  const keyboard = Markup.inlineKeyboard(buttons);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}
