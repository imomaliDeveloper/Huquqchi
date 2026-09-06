import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import UI from '../utils/ui';

export async function handleKnowledgeView(ctx: MyContext) {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { id: 'asc' },
    });

    if (categories.length === 0) {
      return ctx.reply(
        `📚 <b>HUQUQIY BILIMLAR BO‘LIMI</b>\n\n` +
        `Hozircha tizimga huquqiy kategoriyalar yuklanmoqda. Bir ozdan so‘ng qayta kirib ko‘ring!`,
        { parse_mode: 'HTML' }
      );
    }

    const buttons = categories.map((cat) => [
      Markup.button.callback(`📂 ${cat.name} (${cat._count.articles} ta manba)`, `cat_${cat.id}`),
    ]);

    const message =
      `📚 ${UI.header('HUQUQIY BILIMLAR & KUTUBXONA', '📖')}\n\n` +
      `Quyidagi bo‘limlardan birini tanlang. Har bir bo‘limda normativ hujjatlar, kodekslar va PDF kitoblarni o‘qishingiz hamda yuklab olishingiz mumkin:\n\n` +
      `${UI.DIVIDER}`;

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.editMessageText(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
        return ctx.reply(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      });
    }

    return ctx.reply(message, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ctx.reply('⚠️ Kategoriyalarni yuklashda xatolik yuz berdi.');
  }
}

export async function handleCategoryArticles(ctx: MyContext, categoryId: number) {
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
      const emptyButtons = [[Markup.button.callback('🔙 Kategoriyalarga Qaytish', 'back_to_categories')]];
      return ctx.editMessageText(
        `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n\n` +
        `<i>Ushbu kategoriyada hozircha ma'lumotlar kiritilmagan. Tezgoraq yangi maqola va PDF kitoblar qo‘shiladi!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(emptyButtons) }
      ).catch(() => {});
    }

    const buttons = category.articles.map((art) => [
      Markup.button.callback(`${art.isPdfBook ? '📖 [PDF Kitob]' : '📄'} ${art.title}`, `art_${art.id}`),
    ]);
    buttons.push([Markup.button.callback('🔙 Kategoriyalarga Qaytish', 'back_to_categories')]);

    return ctx.editMessageText(
      `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n` +
      `${UI.THIN_DIVIDER}\n` +
      `Batafsil o‘qish yoki PDF faylini yuklab olish uchun kerakli manbani tanlang:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    ).catch(() => {});
  } catch (error) {
    console.error('Error in handleCategoryArticles:', error);
    return ctx.reply('⚠️ Maqolalarni yuklashda xatolik yuz berdi.');
  }
}

export async function handleArticleDetails(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery().catch(() => {});

  try {
    const article = await prisma.legalArticle.findUnique({
      where: { id: articleId },
      include: { category: true },
    });

    if (!article) {
      return ctx.reply('⚠️ Maqola topilmadi.');
    }

    const articleText =
      `📖 <b>${escapeHTML(article.title)}</b>\n` +
      `${UI.THIN_DIVIDER}\n` +
      `📁 <b>Kategoriya:</b> <i>${escapeHTML(article.category.name)}</i>\n` +
      `📌 <b>Rasmiy Manba:</b> <i>${escapeHTML(article.source || 'O\'zbekiston Respublikasi Qonunchiligi')}</i>\n\n` +
      `<b>MAZMUNI:</b>\n` +
      `${escapeHTML(article.content)}\n\n` +
      `${UI.DIVIDER}`;

    const buttons: any[] = [];
    if (article.fileId) {
      buttons.push([Markup.button.callback('📥 PDF Kitobni Telegramda Yuklab Olish', `dl_pdf_${article.id}`)]);
    }
    buttons.push([Markup.button.callback('🔙 Ro‘yxatga Qaytish', `cat_${article.categoryId}`)]);

    return ctx.editMessageText(articleText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  } catch (error) {
    console.error('Error in handleArticleDetails:', error);
    return ctx.reply('⚠️ Maqola matnini yuklashda xatolik yuz berdi.');
  }
}

export async function handleDownloadPdfBook(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery('✨ Kitob Telegramga yuklanmoqda...').catch(() => {});

  try {
    const article = await prisma.legalArticle.findUnique({ where: { id: articleId } });
    if (!article || !article.fileId) {
      return ctx.reply('⚠️ PDF fayli topilmadi.');
    }

    return ctx.replyWithDocument(article.fileId, {
      caption: `📖 <b>${escapeHTML(article.title)}</b>\n\n@HuquqchiBot kutubxonasidan yuklab olindi.`,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Error downloading PDF book:', error);
    return ctx.reply('⚠️ PDF kitobni yuborishda xatolik yuz berdi.');
  }
}
