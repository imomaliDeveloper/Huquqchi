import { escapeHTML, formatHeader, formatSectionDivider, formatBadge } from '../utils/ui';
import { AiService } from './aiService';

export interface LexCodex {
  code: string;
  name: string;
  description: string;
  lexUrl: string;
  articlesCount: number;
}

export interface LexArticle {
  codexCode: string;
  articleNumber: string;
  title: string;
  content: string;
  lexUrl: string;
}

export class LexService {
  private static CODES: LexCodex[] = [
    {
      code: 'MK',
      name: 'O‘zbekiston Respublikasi Mehnat Kodeksi',
      description: 'Xodim va ish beruvchi huquqlari, ta’tillar, ishdan bo‘shatish, ish haqi va kompensatsiyalar.',
      lexUrl: 'https://lex.uz/docs/-6257288',
      articlesCount: 581,
    },
    {
      code: 'FK',
      name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
      description: 'Mulk huquqi, shartnomalar, ijara, qarz, zarar yetkazish va bitimlar tartibi.',
      lexUrl: 'https://lex.uz/docs/-111189',
      articlesCount: 1199,
    },
    {
      code: 'OK',
      name: 'O‘zbekiston Respublikasi Oila Kodeksi',
      description: 'Nikoh, ajrim, aliment to‘lovlari, ota-onalik huquqi va bolalar manfaatlari.',
      lexUrl: 'https://lex.uz/docs/-104720',
      articlesCount: 238,
    },
    {
      code: 'JK',
      name: 'O‘zbekiston Respublikasi Jinoyat Kodeksi',
      description: 'Jinoyatlar javobgarligi, jazo turlari, jarimalar va sud amaliyoti.',
      lexUrl: 'https://lex.uz/docs/-111453',
      articlesCount: 302,
    },
    {
      code: 'SK',
      name: 'O‘zbekiston Respublikasi Soliq Kodeksi',
      description: 'Jismoniy va yuridik shaxslar soliq turlari, imtiyozlar va hisobotlar.',
      lexUrl: 'https://lex.uz/docs/-4674902',
      articlesCount: 480,
    },
    {
      code: 'MJtK',
      name: 'Ma‘muriy Javobgarlik To‘g‘risidagi Kodeks',
      description: 'Yo‘l harakati qoidalari (YHQ) jarimalari, ma‘muriy huquqbuzarliklar.',
      lexUrl: 'https://lex.uz/docs/-97664',
      articlesCount: 350,
    },
  ];

  private static POPULAR_ARTICLES: LexArticle[] = [
    {
      codexCode: 'MK',
      articleNumber: '161',
      title: 'Mehnat shartnomasini ish beruvchi tashabbusi bilan bekor qilish',
      content: 'Ish beruvchi xodimni o‘z-o‘zidan bo‘shata olmaydi. Shtat qisqarishi, intizom buzilishi yoki xodim malakasi yetishmasligi asoslantirilishi hamda kasaba uyushmasi roziligi olinishi shart.',
      lexUrl: 'https://lex.uz/docs/-6257288#6261543',
    },
    {
      codexCode: 'MK',
      articleNumber: '216',
      title: 'Har yilgi asosiy mehnat ta‘tili uzaytirilishi',
      content: 'Xodimlarga har yili davomiyligi kamida 21 ish kunidan iborat bo‘lgan haq to‘lanadigan asosiy ta‘til beriladi.',
      lexUrl: 'https://lex.uz/docs/-6257288#6262410',
    },
    {
      codexCode: 'OK',
      articleNumber: '99',
      title: 'Voyaga yetmagan bolalar uchun aliment miqdori',
      content: 'Ota-onadan 1 ta bola uchun — maoshining 1/4 qismi, 2 ta bola uchun — 1/3 qismi, 3 va undan ortiq bola uchun — 1/2 qismi miqdorida aliment undiriladi.',
      lexUrl: 'https://lex.uz/docs/-104720#104958',
    },
    {
      codexCode: 'FK',
      articleNumber: '600',
      title: 'Turar joyni ijaraga berish shartnomasi',
      content: 'Turar joy ijarasi shartnomasi yozma shaklda tuziladi va soliq organlarida (ijara.soliq.uz) majburiy hisobga qo‘yilishi shart.',
      lexUrl: 'https://lex.uz/docs/-111189#112543',
    },
    {
      codexCode: 'FK',
      articleNumber: '732',
      title: 'Qarz shartnomasi va tilxat shartlari',
      content: 'Qarz shartnomasi fuqarolar o‘rtasida BHMning 10 baravaridan ortiq bo‘lsa, yozma shaklda tuzilishi shart. Tilxat qarz mavjudligini isbotlaydi.',
      lexUrl: 'https://lex.uz/docs/-111189#112891',
    },
    {
      codexCode: 'MJtK',
      articleNumber: '128-1',
      title: 'Transport vositasi haydovchilarining tezlikni oshirishi',
      content: 'Tezlikni 20 km/soatgacha oshirish — BHMning 1 baravari, 20-40 km/soatgacha — BHMning 5 baravari, 40 km/soatdan ortiq oshirish — BHMning 9 baravari jarimaga sabab bo‘ladi.',
      lexUrl: 'https://lex.uz/docs/-97664#98512',
    },
  ];

  public static getCodexList(): LexCodex[] {
    return this.CODES;
  }

  public static searchArticles(query: string): LexArticle[] {
    const q = query.trim().toLowerCase();
    return this.POPULAR_ARTICLES.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.articleNumber.toLowerCase().includes(q) ||
        art.codexCode.toLowerCase().includes(q)
    );
  }

  /**
   * Explains a legal article in simple plain language for non-lawyers
   */
  public static async getSimpleExplanation(articleTitle: string, articleContent: string): Promise<string> {
    const prompt = `Siz O‘zbekiston milliy yuristisiz. Quyidagi modda va qonun matnini oddiy fuqaro uchun juda tushunarli, qisqa va sodda tilda tushuntirib bering:\n\nSarlavha: ${articleTitle}\nMatn: ${articleContent}`;
    try {
      // Pass dummy system userId 0 for AI explanation
      const aiResponse = await AiService.askLegalQuestion(0, prompt);
      return aiResponse;
    } catch {
      return `<b>💡 Sodda tushuntirish:</b>\nUshbu modda fuqarolarga o‘z huquqlarini himoya qilish va qonuniy tartibda harakat qilish majburiyatini yuklaydi.`;
    }
  }

  public static formatCodexListHtml(): string {
    let html = formatHeader('📜 Lex.uz Rasmiy Kodekslar Katalogi');
    html += `O‘zbekiston Respublikasining asosiy qonunlar to‘plami va rasmiy Lex.uz havolalari:\n\n`;

    this.CODES.forEach((codex, idx) => {
      html += `<b>${idx + 1}. ${escapeHTML(codex.name)} (${codex.code})</b>\n`;
      html += `📝 <i>${escapeHTML(codex.description)}</i>\n`;
      html += `🌐 <a href="${codex.lexUrl}">Lex.uz rasmiy matni (${codex.articlesCount} ta modda)</a>\n${formatSectionDivider()}\n`;
    });

    html += `🔎 <i>Qidirmoqchi bo‘lsangiz, qidiruv satriga modda raqami yoki kalit so‘zni yozing (masalan: "Mehnat kodeksi 161" yoki "Aliment").</i>`;
    return html;
  }
}
