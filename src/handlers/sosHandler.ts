import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';

export async function handleSosView(ctx: MyContext) {
  const text =
    `🚨 <b>SOS TEZKOR HUQUQIY YORDAM</b>\n\n` +
    `Favqulodda yoki noxush yuridik vaziyatga tushganingizda, o'zingizni yo'qotmang! ` +
    `Quyidagi tugmalardan birini tanlab, <b>30 soniya ichida</b> o'z huquqlaringiz va nima deyish lozimligini bilib oling:\n\n` +
    `🚘 <b>YPX to'xtatganda</b> — Haydovchilik huquqlari va videotasvir\n` +
    `👮 <b>IIB / PPX ushlanganda</b> — Shaxsni tasdiqlash va ushlab turish tartibi\n` +
    `🏢 <b>Soliq / Finkontrol kelganda</b> — Tekshiruv buyrug'i va vakolatlar\n` +
    `🔍 <b>Tintuv va ko'zdan kechirish</b> — Xolislar (ponyatye) va bayonnoma\n` +
    `⚖️ <b>Fuqaroning 5 ta daxlsiz huquqi</b> — O'z-o'zini himoya qilish formulasi\n` +
    `📞 <b>Ishonch telefonlari</b> — 102, Prokuratura va Ombudsiman`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🚘 YPX to\'xtatganda', 'sos_ypx')],
    [Markup.button.callback('👮 IIB / PPX ushlanganda', 'sos_iib')],
    [Markup.button.callback('🏢 Soliq va Tekshiruv', 'sos_tax')],
    [Markup.button.callback('🔍 Tintuv va Ko\'zdan kechirish', 'sos_search')],
    [Markup.button.callback('⚖️ 5 ta Daxlsiz Huquq', 'sos_rights')],
    [Markup.button.callback('📞 Tezkor Ishonch Telefonlari', 'sos_phones')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleSosTopic(ctx: MyContext, topic: string) {
  await ctx.answerCbQuery().catch(() => {});

  let text = '';

  switch (topic) {
    case 'ypx':
      text =
        `🚘 <b>YPX XODIMI TO'XTATGANDA NIMA QILISH KERAK?</b>\n\n` +
        `1️⃣ <b>Xodim majburiyati:</b> YPX xodimi darhol sizga yaqinlashib, o'zini tanishtirishi (lavozimi, unvoni, familiyasi) va to'xtatish SABABINI aytishi shart (<i>VM-139 nizom</i>).\n` +
        `2️⃣ <b>Ko'krak nishoni va Dislokatsiya:</b> Xodimda ko'krak nishoni (jeston) bo'lishi shart. Siz undan dislokatsiya (xizmat o'tash ko'chirma qog'ozi)ni ko'rsatishni talab qilishga HAKLISIZ.\n` +
        `3️⃣ <b>Videotasvirga olish:</b> Siz YPX xodimi bilan muloqotni o'zingizning telefoningizga tasvirga olishga 100% huquqingiz bor!\n` +
        `4️⃣ <b>Hujjatlarni berish:</b> Transport vositasini tark etmasdan, oynadan hujjatlarni ko'rsatishingiz yetarli. Salondan chiqish faqat alohida hollarda (mastlik, qidiruv) shart.\n\n` +
        `🗣 <b>Nima deyish kerak:</b>\n` +
        `<i>"Assalomu alaykum xodim. Vazirlar Mahkamasining 139-sonli Qaroriga ko'ra o'zingizni tanishtiring va to'xtatish sababini hamda dislokatsiyangizni ko'rsating."</i>`;
      break;

    case 'iib':
      text =
        `👮 <b>IIB / PPX XODIMI USHLANGANDA YOKI SHAXSNI TASDIQLASH SO'RALGANDA</b>\n\n` +
        `1️⃣ <b>Hujjat talab qilish:</b> Xodim birinchi bo'lib o'z xizmat guvohnomasini ochiq holda ko'rsatishi shart (<i>"Ichki ishlar organlari to'g'risida"gi Qonun 22-modda</i>).\n` +
        `2️⃣ <b>Shaxsni tasdiqlash:</b> Pasport, ID-karta yoki uning rasmi telefonda bo'lsa kifoya. Sababsiz bo'limga (GOVD/ROVD) olib ketishga yo'l qo'yilmaydi.\n` +
        `3️⃣ <b>Ushlab turish muddati:</b> Ma'muriy huquqbuzarlikda shaxs <b>3 soatdan ortiq</b> ushlab turilishi MUMKIN ERMAS!\n` +
        `4️⃣ <b>Qo'ng'iroq qilish huquqi:</b> Ushlangan zahoti yaqinlaringizga yoki advokatga qo'ng'iroq qilish va xabar berish huquqiga egasiz (<i>Konstitutsiya 28-modda</i>).\n\n` +
        `🗣 <b>Nima deyish kerak:</b>\n` +
        `<i>"Meni ushlashingizga qanday qonuniy asos bor? Guvohnomangizni ko'rsating. Konstitutsiyaning 28-moddasiga ko'ra advokatsiz va yaqinlarimga qo'ng'iroq qilmasdan javob bermayman."</i>`;
      break;

    case 'tax':
      text =
        `🏢 <b>SOLIQ YOKI TEKSHIRUVCHILAR KELGANDA (AUDIT / FINKONTROL)</b>\n\n` +
        `1️⃣ <b>Buyruq va Qayd etish:</b> Tekshiruvchilar Ishbilarmonlik sub'ekti (Biznes)ga kirganda <b>Buyruq (Prikaz)</b> va Business.gov.uz tizimidagi QR-kodli ro'yxatdan o'tgan hujjatni ko'rsatishi shart.\n` +
        `2️⃣ <b>Tekshirish kitobi:</b> Soliqchi yoki inspektor "Tekshirishlarni ro'yxatga olish kitobi"ga imzo qo'ymaguncha tekshirishni boshlay olmaydi.\n` +
        `3️⃣ <b>Noqonuniy talab:</b> Shaxsiy telefoni, shaxsiy hisob-raqami yoki buyruqda ko'rsatilmagan hujjatlarni so'rashga HAKKI YO'Q.\n\n` +
        `🗣 <b>Nima deyish kerak:</b>\n` +
        `<i>"Tekshiruv QR-kodli buyrug'ingiz va Tekshirishlarni ro'yxatga olish kitobidagi belgingizni ko'rsating. Biznes-Ombudsman vakilini xabardor qilaman."</i>`;
      break;

    case 'search':
      text =
        `🔍 <b>TINTUV (OBISK) VA KO'ZDAN KECHIRISH TARTIBI</b>\n\n` +
        `1️⃣ <b>Tintuv vs Ko'zdan kechirish:</b> Ko'zdan kechirish — bu faqat tashqaridan qarash. Cho'ntagingizga yoki mashina ichiga qo'l tiqib kavlash — bu TINTUV hisoblanadi!\n` +
        `2️⃣ <b>Prokuror / Sud qarori:</b> Tintuv faqat Sud yoki Prokuror sanksiyasi (qarori) bo'lganda o'tkaziladi (kechiktirib bo'lmaydigan hollar bundan mustasno).\n` +
        `3️⃣ <b>Xolislar (Ponyatye):</b> Kamida 2 ta xolis guvoh ishtirok etishi shart. Xolislar politsiya xodimi emas, doimiy fuqarolar bo'lishi kerak.\n` +
        `4️⃣ <b>Bayonnoma (Protokol):</b> Har bir harakat bayonnomaga yoziladi. Bayonnomaga o'z e'tirozlaringizni yozib imzo cheking.\n\n` +
        `🗣 <b>Nima deyish kerak:</b>\n` +
        `<i>"Tintuv o'tkazish uchun sud/prokuror qarorini ko'rsating va 2 ta xolis guvoh ishtirokida bayonnoma tuzishingizni talab qilaman."</i>`;
      break;

    case 'rights':
      text =
        `⚖️ <b>O'ZBEKISTON FUQAROSINING 5 TA DAXLSIZ HUQUQI</b>\n\n` +
        `1️⃣ <b>Aybsizlik prezumpsiyasi:</b> Aybingiz sud qarori bilan isbotlanmaguncha siz aybsizsiz (<i>Konstitutsiya 28-modda</i>).\n` +
        `2️⃣ <b>O'ziga va yaqinlariga qarshi ko'rsatma bermaslik:</b> Siz o'zingizga hamda oila a'zolaringizga qarshi ko'rsatma bermaslikka HAKLI SIZ (Mirand ogohlantirishi).\n` +
        `3️⃣ <b>Advokat yordami:</b> Ushlangan daqiqadan boshlab tekin yoki shaxsiy advokat talab qilish huquqi.\n` +
        `4️⃣ <b>Qiynoq va shafqatsiz muomaladan himoya:</b> Ruhiy yoki jismoniy tazyiq o'tkazish jinoyat hisoblanadi.\n` +
        `5️⃣ <b>Zararni qoplash:</b> Davlat organining noqonuniy harakati tufayli yetkazilgan zarar davlat tomonidan qoplanadi.`;
      break;

    case 'phones':
      text =
        `📞 <b>TEZKOR ISHONCH TELEFONLARI VA SHOSHILINCH ALOQA</b>\n\n` +
        `🚨 <b>Ichki Ishlar (Militsiya):</b> <code>102</code>\n` +
        `⚖️ <b>Bosh Prokuratura Ishonch Telefoni:</b> <code>1007</code> / <code>1100</code>\n` +
        `🚘 <b>YPX (Yol Harakati Xavfsizligi):</b> <code>1102</code>\n` +
        `🛡 <b>Biznes-Ombudsman (Tadbirkorlar himoyasi):</b> <code>1100</code>\n` +
        `🏢 <b>Soliq Qo'mitasi Ishonch Telefoni:</b> <code>1198</code>\n` +
        `👤 <b>Inson Huquqlari bo'yicha Ombudsman:</b> <code>1096</code>\n\n` +
        `💡 <i>Raqam ustiga bossangiz nusxalanadi. Noqonuniy harakat bo'lganda darhol Prokuraturaning 1007 raqamiga qo'ng'iroq qiling!</i>`;
      break;
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ SOS menyusiga qaytish', 'sos_home')],
    [Markup.button.callback('⚖️ AI Yuristdan so\'rash', 'start_ai_question')],
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
}
