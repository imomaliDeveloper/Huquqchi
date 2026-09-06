import { MyContext } from '../bot/context';
import { LexService } from '../services/lexService';
import { escapeHTML, formatHeader, formatSectionDivider, formatBadge } from '../utils/ui';

export async function handleLexSearchView(ctx: MyContext) {
  const html = LexService.formatCodexListHtml();
  return ctx.reply(html, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
}

export async function handleLexQuerySearch(ctx: MyContext, query: string) {
  const results = LexService.searchArticles(query);

  if (results.length === 0) {
    let html = formatHeader('🔍 Lex.uz Qidiruv Natijasi');
    html += `<b>"${escapeHTML(query)}"</b> so‘rovi bo‘yicha aniq modda topilmadi.\n\n`;
    html += `💡 <i>Tavsiya: Savolingizni <b>⚖️ Huquqiy AI</b> bo‘limida bering yoki umumiyroq so‘z kiriting (masalan: "Mehnat", "Aliment", "Ijara").</i>`;
    return ctx.reply(html, { parse_mode: 'HTML' });
  }

  let html = formatHeader(`🔍 Qidiruv Natijasi (${results.length} ta modda)`);
  
  for (const art of results.slice(0, 3)) {
    html += `<b>📌 [${art.codexCode}] ${escapeHTML(art.title)} (Modda ${art.articleNumber})</b>\n`;
    html += `📖 <i>${escapeHTML(art.content)}</i>\n\n`;

    // AI Simple explanation
    const simpleExplanation = await LexService.getSimpleExplanation(art.title, art.content);
    html += `${simpleExplanation}\n`;
    html += `🌐 <a href="${art.lexUrl}">Lex.uz rasmiy matni</a>\n${formatSectionDivider()}\n`;
  }

  return ctx.reply(html, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
}
