import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';
import { LexService } from '../services/lexService';
import { escapeHTML, formatHeader, formatSectionDivider } from '../utils/ui';

export async function handleLexSearchView(ctx: MyContext) {
  const text =
    `📖 <b>LEX.UZ RASMIY KODEKSLAR KATALOGI VA TOP-5 KODEKSLAR</b>\n\n` +
    `O'zbekiston Respublikasining rasmiy kodekslari va ulardagi eng muhim yuridik atamalar hamda moddalar bo'limiga xush kelibsiz!\n\n` +
    `Quyidagi <b>Top-5 Kodekslar</b>dan birini tanlang va uning asosiy tushunchalari hamda amaliyotdagi moddalarini o'rganing:\n\n` +
    `💼 <b>Mehnat Kodeksi</b> — Ta'tillar, ishdan bo'shatish, kompensatsiya va oylik\n` +
    `⚖️ <b>Fuqarolik Kodeksi</b> — Shartnoma, mulk huquqi, ijara va qarz tilxati\n` +
    `🏠 <b>Oila Kodeksi</b> — Aliment foizlari, nikoh, ajrim va mol-mulk bo'linishi\n` +
    `🚘 <b>MJtK</b> — Yo'l harakati jarimalari, YPX va ma'muriy huquqbuzarliklar\n` +
    `🏢 <b>Soliq Kodeksi</b> — Soliq imtiyozlari, JShDS va o'zini o'zi band qilish`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💼 Mehnat Kodeksi (MK)', 'lex_code_mk')],
    [Markup.button.callback('⚖️ Fuqarolik Kodeksi (FK)', 'lex_code_fk')],
    [Markup.button.callback('🏠 Oila Kodeksi (OK)', 'lex_code_ok')],
    [Markup.button.callback('🚘 MJtK (Ma\'muriy Jarimalar)', 'lex_code_mjtk')],
    [Markup.button.callback('🏢 Soliq Kodeksi (SK)', 'lex_code_sk')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleCodexDetails(ctx: MyContext, code: string) {
  await ctx.answerCbQuery().catch(() => {});

  let text = '';
  let keyboard: any = null;

  switch (code) {
    case 'mk':
      text =
        `💼 <b>MEHNAT KODEKSI (MK) — ASOSIY ATAMALAR VA MODDALAR</b>\n\n` +
        `🌐 <b>Lex.uz rasmiy havolasi:</b> <a href="https://lex.uz/docs/-6257288">Lex.uz Mehnat Kodeksi (581 ta modda)</a>\n\n` +
        `📚 <b>Muhim Atamalar va Tushunchalar:</b>\n` +
        `• <b>Mehnat shartnomasi:</b> Xodim bilan ish beruvchi o'rtasidagi asosiy huquqiy kelishuv.\n` +
        `• <b>Sinov muddati:</b> Maksimal 3 oy (Xodim malakasini tekshirish uchun).\n` +
        `• <b>Mehnat ta'tili (21-modda):</b> Yillik haq to'lanadigan asosiy ta'til kamida <b>21 ish kuni</b> bo'lishi shart.\n` +
        `• <b>Kompensatsiya:</b> Ishdan bo'shatilganda foydalanilmagan ta'til va staj uchun to'lov.\n\n` +
        `📌 <b>Amaliyotdagi eng ko'p qo'llaniladigan moddalar:</b>\n` +
        `• <b>161-modda:</b> Ish beruvchi tashabbusi bilan shartnomani bekor qilish (Noqonuniy bo'shatishga qarshi himoya).\n` +
        `• <b>160-modda:</b> Xodim tashabbusi bilan bo'shash (2 hafta oldin ogohlantirish).\n` +
        `• <b>244-modda:</b> Mehnat haqini to'lash muddatlari (Kamida oyiga 2 marotaba).`;

      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏖 Mehnat ta\'tili huquqlari', 'lex_topic_mk_vacation')],
        [Markup.button.callback('❌ Noqonuniy bo\'shatishdan himoya', 'lex_topic_mk_firing')],
        [Markup.button.callback('⬅️ Kodekslar kataloigiga qaytish', 'lex_home')],
      ]);
      break;

    case 'fk':
      text =
        `⚖️ <b>FUQAROLIK KODEKSI (FK) — MULK, SHARTNOMA VA QARZ</b>\n\n` +
        `🌐 <b>Lex.uz rasmiy havolasi:</b> <a href="https://lex.uz/docs/-111189">Lex.uz Fuqarolik Kodeksi (1199 ta modda)</a>\n\n` +
        `📚 <b>Muhim Atamalar va Tushunchalar:</b>\n` +
        `• <b>Mulk huquqi:</b> Shaxsning mol-mulkka egalik qilish, undan foydalanish va tasarruf etish huquqi.\n` +
        `• <b>Bitim va Shartnoma:</b> Ikki yoki undan ortiq shaxsning huquq va majburiyatlarni belgilash kelishuvi.\n` +
        `• <b>Qarz tilxati (732-modda):</b> BHMning 10 baravaridan ortiq qarz yozma shaklda tuzilishi shart.\n` +
        `• <b>Vositachilik va Ijara (600-modda):</b> Uyni ijaraga berish yozma shartnoma va soliq ro'yxatidan o'tishi shart.\n\n` +
        `📌 <b>Amaliyotdagi eng ko'p qo'llaniladigan moddalar:</b>\n` +
        `• <b>327-modda:</b> Majburiyatni bajarmaslik uchun penya hisoblash (Kunlik 0.4%).\n` +
        `• <b>985-modda:</b> YETKAZILGAN ZARARNI QOPLASH (G'arazli va g'ayriqonuniy zarar uchun 100% kompensatsiya).`;

      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📝 Qarz shartnomasi va Tilxat', 'lex_topic_fk_debt')],
        [Markup.button.callback('🏡 Turar joy Ijara qoidalari', 'lex_topic_fk_rent')],
        [Markup.button.callback('⬅️ Kodekslar kataloigiga qaytish', 'lex_home')],
      ]);
      break;

    case 'ok':
      text =
        `🏠 <b>OILA KODEKSI (OK) — ALIMENT, NIKOH VA MULK BO'LINISHI</b>\n\n` +
        `🌐 <b>Lex.uz rasmiy havolasi:</b> <a href="https://lex.uz/docs/-104720">Lex.uz Oila Kodeksi (238 ta modda)</a>\n\n` +
        `📚 <b>Muhim Atamalar va Tushunchalar:</b>\n` +
        `• <b>Er-xotinning birgalikdagi mulki:</b> Nikoh davomida orttirilgan barcha mol-mulk teng yarimdan (50/50) hisoblanadi.\n` +
        `• <b>Aliment (99-modda):</b> Voyaga yetmagan bolalar uchun ota-onadan undiriladigan oylik mablag'.\n` +
        `• <b>Nikoh shartnomasi:</b> Nikohga kiruvchi shaxslarning mulkiy huquqlarini belgilovchi notarizatsiyalangan kelishuv.\n\n` +
        `📊 <b>Aliment miqdorlari (99-modda):</b>\n` +
        `• <b>1 ta bola uchun:</b> Oylik daromadning <b>1/4 qismi (25%)</b>\n` +
        `• <b>2 ta bola uchun:</b> Oylik daromadning <b>1/3 qismi (33%)</b>\n` +
        `• <b>3 va undan ortiq bola uchun:</b> Oylik daromadning <b>1/2 qismi (50%)</b>`;

      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👶 Aliment hisoblash va undirish', 'lex_topic_ok_aliment')],
        [Markup.button.callback('💍 Nikohdagi mulkni bo\'lish', 'lex_topic_ok_property')],
        [Markup.button.callback('⬅️ Kodekslar kataloigiga qaytish', 'lex_home')],
      ]);
      break;

    case 'mjtk':
      text =
        `🚘 <b>MA'MURITY JAVOBGARLIK TO'G'RISIDAGI KODEKS (MJtK)</b>\n\n` +
        `🌐 <b>Lex.uz rasmiy havolasi:</b> <a href="https://lex.uz/docs/-97664">Lex.uz MJtK (350 ta modda)</a>\n\n` +
        `📚 <b>Muhim Atamalar va Tushunchalar:</b>\n` +
        `• <b>Ma'muriy huquqbuzarlik:</b> Jamiyatga va davlat tartibiga zarar yetkazuvchi, lekin jinoyat bo'lmagan qoidabuzarlik.\n` +
        `• <b>Ma'muriy bayonnoma (Protokol):</b> Qoidabuzarlik joyida tuziladigan rasmiy hujjat.\n` +
        `• <b>50% Chegirma:</b> Jarimani 15 kun ichida to'lasangiz 50% chegirma qo'llanadi!\n\n` +
        `📌 <b>Ommabop YHQ Jarimalari (MJtK 128-modda):</b>\n` +
        `• <b>Tezlikni oshirish:</b> 1 BHMdan 9 BHMgacha jarima.\n` +
        `• <b>Xavfsizlik kamari takmaslik:</b> 0.5 BHM (187 500 so'm).\n` +
        `• <b>Qizil chiroqqa o'tish:</b> 2 BHM (750 000 so'm).\n` +
        `• <b>Mast holda haydash:</b> 25 BHM + 1.5 yildan 3 yilgacha haydovchilikdan mahrum qilish.`;

      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🚘 YHQ Jarimalari va Chegirma', 'lex_topic_mjtk_traffic')],
        [Markup.button.callback('📝 Bayonnomaga e\'tiroz bildirish', 'lex_topic_mjtk_appeal')],
        [Markup.button.callback('⬅️ Kodekslar kataloigiga qaytish', 'lex_home')],
      ]);
      break;

    case 'sk':
      text =
        `🏢 <b>SOLIQ KODEKSI (SK) — SOLIQLAR VA IMTIYOZLAR</b>\n\n` +
        `🌐 <b>Lex.uz rasmiy havolasi:</b> <a href="https://lex.uz/docs/-4674902">Lex.uz Soliq Kodeksi (480 ta modda)</a>\n\n` +
        `📚 <b>Muhim Atamalar va Tushunchalar:</b>\n` +
        `• <b>JShDS (Jismoniy shaxslar daromad solig'i):</b> O'zbekistonda standart daromad solig'i <b>12%</b>ni tashkil etadi.\n` +
        `• <b>O'zini o'zi band qilish (Self-employed):</b> 100+ turdagi faoliyat bo'yicha daromad solig'idan <b>100% OZOD ETILADI</b> (Faqat ijtimoiy soliq to'lanadi).\n` +
        `• <b>Mol-mulk solig'i:</b> Uy-joy va ko'chmas mulk uchun yillik soliq to'lovi.\n` +
        `• <b>Keshbek (1%):</b> Xaridlarni chek orqali ro'yxatdan o'tkazib 1% soliq keshbekini qaytarib olish.`;

      keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👨‍💻 O\'zini o\'zi band qilish imtiyozlari', 'lex_topic_sk_selfemployed')],
        [Markup.button.callback('🏡 Mol-mulk va Yer solig\'i', 'lex_topic_sk_property')],
        [Markup.button.callback('⬅️ Kodekslar kataloigiga qaytish', 'lex_home')],
      ]);
      break;
  }

  await ctx.editMessageText(text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...keyboard }));
}

export async function handleCodexSubTopic(ctx: MyContext, topic: string) {
  await ctx.answerCbQuery().catch(() => {});

  let text = '';

  switch (topic) {
    case 'mk_vacation':
      text =
        `🏖 <b>MEHNAT TA'TILI HUQUQLARI HAKIDA QONUNCHILIK</b>\n\n` +
        `• <b>Minimal muddat:</b> Yillik haq to'lanadigan ta'til kamida <b>21 ish kuni</b> bo'lishi shart (MK 216-modda).\n` +
        `• <b>Birinchi ta'til:</b> Yangi ish joyida 6 oy ishlagandan so'ng ta'til olish huquqi tug'iladi.\n` +
        `• <b>Ta'til puli (Otpuskoy):</b> Ta me ta'til boshlanishidan kamida 3 kun oldin to me to'liq to'lanishi kerak.\n` +
        `• <b>Foydalanilmagan ta'til:</b> Ishdan bo'shaganda ishlatilmagan barcha ta'til kunlari uchun 100% pul kompensatsiyasi to'lanadi.`;
      break;

    case 'mk_firing':
      text =
        `❌ <b>NOQONUNII ISHDAN BO'SHATISHDAN HIMOYA</b>\n\n` +
        `• Ish beruvchi xodimni shunchaki "yoqmay qoldi" deb bo me bo'shata olmaydi (MK 161-modda).\n` +
        `• <b>Kasal bo'lganda yoki ta me ta'tilda:</b> Xodim mehnatga layoqatsizlik davrida bo'shatilishi TAQIQLANADI.\n` +
        `• <b>Shtat qisqarishi:</b> Kamida 2 oy oldin yozma ravishda ogohlantirilishi shart.\n` +
        `• <b>Sudga murojaat:</b> Noqonuniy bo'shatilganda 1 oy ichida Sudga da'vo kiritib, majburiy bekor yurgan kunlar uchun oylik va ma me ma'naviy zarar undirish mumkin.`;
      break;

    case 'fk_debt':
      text =
        `📝 <b>QARZ SHARTNOMASI VA TILXAT QOIDALARI (FK 732-MODDA)</b>\n\n` +
        `• <b>Yozma shakl:</b> BHMning 10 baravari (3.75 mln so'm)dan ortiq qarz albatta YOZMA shaklda (tilxat yoki shartnoma) tuzilishi shart.\n` +
        `• <b>Tilxatda nimalar bo'lishi kerak:</b>\n` +
        `  1. Qarz beruvchi va oluvchining F.I.SH hamda Pasport ma me ma'lumotlari;\n` +
        `  2. Qarz summasi (Raqam va so'z bilan);\n` +
        `  3. Qaytarishning aniq sanasi;\n` +
        `  4. Qarz oluvchining shaxsiy imzosi.\n` +
        `• <b>Notarius:</b> Notariusda tasdiqlash majburiy emas, lekin notarizatsiya qilinsa sud jarayoni 10 baravar tezlashadi.`;
      break;

    case 'fk_rent':
      text =
        `🏡 <b>TURAR JOY IJARA QOIDALARI (FK 600-MODDA)</b>\n\n` +
        `• <b>Yozma shartnoma:</b> Ijara shartnomasi yozma tuzilishi hamda Soliq organlarining <code>ijara.soliq.uz</code> portalida ro'yxatdan o'tkazilishi shart.\n` +
        `• <b>Talabalar uchun:</b> Ijara shartnomasi bor talabalarga davlat tomonidan ijara to'lovining 50%i (qonuniy me'yorgacha) qoplab beriladi.\n` +
        `• <b>Muddatidan oldin chiqarish:</b> Ijara beruvchi ijarachini sababsiz ko'chaga chiqarib yubora olmaydi (Kamida 3 oy oldin ogohlantirish shart).`;
      break;

    case 'ok_aliment':
      text =
        `👶 <b>ALIMENT MIKDORLARI VA UNDIRISH TARTIBI (OK 99-MODDA)</b>\n\n` +
        `• <b>1 ta bola uchun:</b> Oylik maoshning 25% (1/4)\n` +
        `• <b>2 ta bola uchun:</b> Oylik maoshning 33% (1/3)\n` +
        `• <b>3 va undan ko'p bola uchun:</b> Oylik maoshning 50% (1/2)\n` +
        `• <b>Ishsiz ota uchun:</b> Agar ota rasman ishlamasa, aliment O'zbekistondagi o me o'rtacha oylik maoshdan hisoblanadi!\n` +
        `• <b>MIB (Majburiy ijro):</b> Aliment to'lamagan shaxsga nisbatan chet elga chiqishga taqiq va 15 sutkagacha ma'muriy qamoq qo'llanadi.`;
      break;

    case 'ok_property':
      text =
        `💍 <b>NIKOHDAGI ER-XOTIN MULKINI BO'LISH</b>\n\n` +
        `• <b>Birgalikdagi mulk:</b> Nikoh tuzilgandan keyin sotib olingan barcha ko'chmas mulk, avtomobil va jamg'armalar 50/50 teng bo'linadi.\n` +
        `• <b>Shaxsiy mulk hisoblanadi:</b>\n` +
        `  1. Nikohgacha sotib olingan mol-mulk;\n` +
        `  2. Hadiya (poda me sovg'a) qilingan yoki meros qolgan mulk;\n` +
        `  3. Shaxsiy kiyim-kechak va taqinchoqlar.\n` +
        `• <b>Nikoh shartnomasi:</b> Mulk bo'linishini notarius orqali oldindan kelishib qo'yish mumkin.`;
      break;

    case 'mjtk_traffic':
      text =
        `🚘 <b>YHQ JARIMALARI VA 50% CHEGIRMA QOIDASI</b>\n\n` +
        `• <b>15 kunlik chegirma:</b> Jarima qarori chiqarilgan kundan e'tiboran <b>15 kun ichida</b> to'lasangiz — jarimaning faqat <b>50% ini</b> to'laysiz!\n` +
        `• <b>Kamera jarimalari:</b> Radar va kameralar jarima qarorini 3 kun ichida yubormasa, jarima bekor qilinishi mumkin.\n` +
        `• <b>Avtoturargoh (Shtrafploshadka):</b> Hujjat bo'lmaganda yoki mast holda haydalganda mashina shtrafploshadkaga qo me qo'yiladi.`;
      break;

    case 'mjtk_appeal':
      text =
        `📝 <b>YPX YOSH MA'MURII BAYONNOMAGA E'TIROZ BILDIRISH</b>\n\n` +
        `• YPX xodimi bayonnoma tuzayotganda siz: <i>"Bayonnomaga rozimasman, YPX xodimi dislokatsiyasini ko'rsatmadi va qoidabuzarlik isbotlanmadi"</i> deb e'tiroz yozish huquqiga egasiz.\n` +
        `• E'tirozli bayonnomani YPX xodimi joyida jarimaga torta olmaydi, ish ko'rib chiqish uchun Ma me Ma'muriy sudga yuborilishi shart!`;
      break;

    case 'sk_selfemployed':
      text =
        `👨‍💻 <b>O'ZINI O'ZI BAND KILISH (SELF-EMPLOYED) IMTIYOZLARI</b>\n\n` +
        `• <b>100+ faoliyat turi:</b> Dasturchilar, frilanserlar, rerepetitorlar, taksichilar, sartaroshlar va b.\n` +
        `• <b>Daromad solig'i:</b> 0% (Jismoniy shaxslar daromad solig'idan to'liq ozod qilingan!).\n` +
        `• <b>Staj yozilishi:</b> Yiliga 1 BHM (375 000 so'm) ijtimoiy soliq to'lasangiz, 1 yillik ish staji yoziladi.\n` +
        `• <b>Ro'yxatdan o'tish:</b> Soliq ilovasi orqali 1 daqiqada bepul amalga oshiriladi.`;
      break;

    case 'sk_property':
      text =
        `🏡 <b>MOL-MULK VA YER SOLIG'I QOIDALARI</b>\n\n` +
        `• <b>To'lov muddati:</b> Jismoniy shaxslarning mol-mulk va yer solig me solig'i har yili <b>15-oktyabrgacha</b> to'lanishi shart.\n` +
        `• <b>Imtiyozlar:</b> I-II guruh nogironlari, pensionerlar, urush qatnashchilariga mol-mulk solig'idan imtiyozlar beriladi.\n` +
        `• <b>Soliq.uz:</b> Soliq to'lovlarini <code>Soliq</code> ilovasi orqali keshbek bilan to'lash mumkin.`;
      break;
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Orqaga (Kodekslar menyusi)', 'lex_home')],
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...keyboard }));
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
