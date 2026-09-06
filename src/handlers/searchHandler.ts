import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { escapeHTML } from '../utils/helpers';

export async function handleSearchView(ctx: MyContext) {
  return ctx.reply(
    `🔎 <b>Huquqiy Ma'lumotlarni Qidirish</b>\n\n` +
    `Qidirmoqchi bo‘lgan kalit so‘zingizni yoki qonun/modda raqamini yozib yuboring:\n` +
    `<i>(Masalan: "Mehnat ta'tili", "Konstitutsiya 1-modda", "Jarima")</i>`,
    { parse_mode: 'HTML' }
  );
}

export async function executeSearch(ctx: MyContext, query: string) {
  try {
    const articles = await prisma.legalArticle.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      take: 5,
      include: { category: true },
    });

    const safeQuery = escapeHTML(query);

    if (articles.length === 0) {
      return ctx.reply(
        `🔎 <b>"${safeQuery}"</b> bo‘yicha hech qanday maqola topilmadi.\n\n` +
        `💡 Maslahat: Savolingizni <b>⚖️ Huquqiy AI</b> bo‘limiga yuborib ko‘ring!`,
        { parse_mode: 'HTML' }
      );
    }

    let responseText = `🔎 <b>"${safeQuery}"</b> bo‘yicha topilgan ma'lumotlar:\n\n`;

    articles.forEach((art, idx) => {
      responseText += `${idx + 1}. <b>${escapeHTML(art.title)}</b> (${escapeHTML(art.category.name)})\n`;
      const snippet = art.content.length > 150 ? art.content.slice(0, 150) + '...' : art.content;
      responseText += `   <i>${escapeHTML(snippet)}</i>\n\n`;
    });

    return ctx.reply(responseText, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error executing search:', error);
    return ctx.reply('⚠️ Qidiruv jarayonida xatolik yuz berdi.');
  }
}
