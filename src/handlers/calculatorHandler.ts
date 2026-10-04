import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';

const CURRENT_BHM = 375000; // 1 BHM (Baza hisoblash miqdori) = 375,000 UZS

export async function handleCalculatorView(ctx: MyContext) {
  const text =
    `🧮 <b>YURIDIK VA DAVLAT BOJI KALKULYATORI</b>\n\n` +
    `Joriy Baza Hisoblash Miqdori (BHM): <b>${CURRENT_BHM.toLocaleString()} so'm</b>\n\n` +
    `Kerakli kalkulyator turini tanlang:\n\n` +
    `👶 <b>Aliment Kalkulyatori</b> — 1, 2, 3+ bola uchun oylik aliment (25%, 33%, 50%)\n` +
    `🚗 <b>YHQ Jarimalari</b> — 15 kunda 50% chegirma bilan jarima hisoblash\n` +
    `⚖️ <b>Fuqarolik Sudlari</b> — Mol-mulk da'volari bo'yicha davlat boji (4%)\n` +
    `🏢 <b>Iqtisodiy Sudlar</b> — Biznes da'volari bo'yicha davlat boji (2%)\n` +
    `🏛 <b>Ma'muriy Sudlar</b> — Davlat organi qaroridan shikoyat (1 BHM)\n` +
    `⌛ <b>Penya & Qarzdorlik</b> — Kechiktirilgan kunlar bo'yicha penya (0.4%/kun)`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('👶 Aliment Kalkulyatori', 'calc_aliment')],
    [Markup.button.callback('🚗 YHQ Jarimalari (50% Chegirma)', 'calc_yhq')],
    [
      Markup.button.callback('⚖️ Fuqarolik Sudi Boji', 'calc_civil'),
      Markup.button.callback('🏢 Iqtisodiy Sud Boji', 'calc_econ'),
    ],
    [
      Markup.button.callback('🏛 Ma\'muriy Sud Boji', 'calc_admin'),
      Markup.button.callback('⌛ Penya Hisoblash', 'calc_penya'),
    ],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleCalcSelection(ctx: MyContext, calcType: string) {
  await ctx.answerCbQuery().catch(() => {});

  // 1. ALIMENT KALKULYATORI
  if (calcType === 'aliment') {
    const text =
      `👶 <b>ALIMENT MIQDORI KALKULYATORI</b>\n\n` +
      `📌 <b>Oila Kodeksining 99-moddasi:</b>\n` +
      `Ota-onadan bolalar uchun undiriladigan oylik aliment miqdori:\n` +
      ` 🔹 <b>1 nafar bola uchun:</b> daromadning <b>1/4 qismi (25%)</b>\n` +
      ` 🔹 <b>2 nafar bola uchun:</b> daromadning <b>1/3 qismi (33.3%)</b>\n` +
      ` 🔹 <b>3 va undan ortiq bola uchun:</b> daromadning <b>1/2 qismi (50%)</b>\n\n` +
      `<i>⚠️ Har bir bola uchun eng kam aliment miqdori mehnatga haq to'lash eng kam miqdorining (MHTEKM) 26.5 foizidan kam bo'lmasligi shart.</i>\n\n` +
      `👇 Aliment to'lovchining oylik daromadini tanlang yoki chatga yozing (Masalan: <code>4500000</code>):`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('3 mln so\'m', 'calc_aliment_val_3000000'),
        Markup.button.callback('5 mln so\'m', 'calc_aliment_val_5000000'),
      ],
      [
        Markup.button.callback('8 mln so\'m', 'calc_aliment_val_8000000'),
        Markup.button.callback('12 mln so\'m', 'calc_aliment_val_12000000'),
      ],
      [Markup.button.callback('⬅️ Kalkulyator menyusiga qaytish', 'calc_home')],
    ]);

    (ctx.session as any).calcState = { type: 'aliment' };
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  // 2. YHQ JARIMALARI KALKULYATORI
  if (calcType === 'yhq') {
    const text =
      `🚗 <b>YHQ JARIMALARI VA 50% CHEGIRMA KALKULYATORI</b>\n\n` +
      `📌 <b>15 kunlik chegirma qoidasi (MJtK 332-1-modda):</b>\n` +
      `Jarima qarori chiqarilgan kundan boshlab <b>15 kun ichida</b> to'lasangiz, jarima summasining <b>50% ini</b> to'laysiz!\n\n` +
      `Quyidagi qoidabuzarliklardan birini tanlang:`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💺 Kamar taqmaslik (0.5 BHM)', 'calc_yhq_fine_187500_Kamar')],
      [Markup.button.callback('📱 Rulda telefon ishlatish (3 BHM)', 'calc_yhq_fine_1125000_Telefon')],
      [Markup.button.callback('🔴 Qizil chiroqqa o\'tish (2 BHM)', 'calc_yhq_fine_750000_Qizil')],
      [Markup.button.callback('⚡ Tezlik oshirish (+20 km/soat, 1 BHM)', 'calc_yhq_fine_375000_Tezlik1')],
      [Markup.button.callback('⚡ Tezlik oshirish (+20-40 km/soat, 5 BHM)', 'calc_yhq_fine_1875000_Tezlik2')],
      [Markup.button.callback('🛑 To\'xtash taqiqlangan joyda to\'xtash (2 BHM)', 'calc_yhq_fine_750000_Stop')],
      [Markup.button.callback('⬅️ Kalkulyator menyusiga qaytish', 'calc_home')],
    ]);

    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  if (calcType === 'admin') {
    const text =
      `🏛 <b>MA'MURITY SUD DAVLAT BOJI HISOBLASHI</b>\n\n` +
      `📌 <b>Nisbat:</b> Davlat organlari yoki mansabdor shaxslarning noqonuniy qarorlari ustidan shikoyat qilish:\n\n` +
      `👤 <b>Jismoniy shaxslar (Fuqarolar) uchun:</b> 1 BHM = <b>${CURRENT_BHM.toLocaleString()} so'm</b>\n` +
      `🏢 <b>Yuridik shaxslar (Kompaniyalar) uchun:</b> 2 BHM = <b>${(CURRENT_BHM * 2).toLocaleString()} so'm</b>\n\n` +
      `📬 <b>Pochta xarajati:</b> 0.05 BHM (<b>${(CURRENT_BHM * 0.05).toLocaleString()} so'm</b>)\n\n` +
      `💡 <i>Kvitansiya sudga da'vo arizasi bilan birga ilova qilinadi.</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Kalkulyator menyusiga qaytish', 'calc_home')],
    ]);
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  if (calcType === 'civil') {
    const text =
      `⚖️ <b>FUQAROLIK SUDI DAVLAT BOJI HISOBLAGICHI</b>\n\n` +
      `📌 <b>Qoida:</b> Mol-mulk xususiyatiga ega da'volarda da'vo bahosining <b>4% miqdorida</b> (lekin 1 BHM — ${CURRENT_BHM.toLocaleString()} so'mdan kam bo'lmagan holda) undiriladi.\n\n` +
      `👇 Da'vo summasini tanlang yoki chatga yozib yuboring (Masalan: <code>15000000</code>):`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('5 mln so\'m', 'calc_civil_val_5000000'),
        Markup.button.callback('10 mln so\'m', 'calc_civil_val_10000000'),
      ],
      [
        Markup.button.callback('25 mln so\'m', 'calc_civil_val_25000000'),
        Markup.button.callback('50 mln so\'m', 'calc_civil_val_50000000'),
      ],
      [Markup.button.callback('⬅️ Kalkulyator menyusi', 'calc_home')],
    ]);

    (ctx.session as any).calcState = { type: 'civil' };
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  if (calcType === 'econ') {
    const text =
      `🏢 <b>IQTISODIY SUD DAVLAT BOJI HISOBLAGICHI</b>\n\n` +
      `📌 <b>Qoida:</b> Mol-mulk tusidagi da'vo arizalaridan da'vo bahosining <b>2% miqdorida</b> (lekin 1 BHM — ${CURRENT_BHM.toLocaleString()} so'mdan kam bo'lmagan holda) undiriladi.\n\n` +
      `👇 Da'vo summasini tanlang yoki chatga yozib yuboring (Masalan: <code>50000000</code>):`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('10 mln so\'m', 'calc_econ_val_10000000'),
        Markup.button.callback('50 mln so\'m', 'calc_econ_val_50000000'),
      ],
      [
        Markup.button.callback('100 mln so\'m', 'calc_econ_val_100000000'),
        Markup.button.callback('200 mln so\'m', 'calc_econ_val_200000000'),
      ],
      [Markup.button.callback('⬅️ Kalkulyator menyusi', 'calc_home')],
    ]);

    (ctx.session as any).calcState = { type: 'econ' };
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  if (calcType === 'penya') {
    const text =
      `⌛ <b>PENYA VA KECHIKTIRILGAN SUMMA KALKULYATORI</b>\n\n` +
      `📌 <b>Qoida:</b> O'zbekiston Respublikasi Fuqarolik Kodeksining 327-moddasiga muvofiq, Majburiyat bajarilmaganda kunlik <b>0.4% penya</b> (yoki shartnomada ko'rsatilgan stavka) hisoblanadi. Maksimal penya da'vo summasining 50%idan oshmasligi shart.\n\n` +
      `👇 Qarzdorlik summasini tanlang yoki chatga kiriting (Masalan: <code>20000000</code>):`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('10 mln so\'m (30 kun)', 'calc_penya_preset_10000000_30'),
        Markup.button.callback('25 mln so\'m (60 kun)', 'calc_penya_preset_25000000_60'),
      ],
      [
        Markup.button.callback('50 mln so\'m (90 kun)', 'calc_penya_preset_50000000_90'),
      ],
      [Markup.button.callback('⬅️ Kalkulyator menyusi', 'calc_home')],
    ]);

    (ctx.session as any).calcState = { type: 'penya' };
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }
}

export async function handleAlimentCalculation(ctx: MyContext, salary: number) {
  const for1Child = Math.round(salary * 0.25);
  const for2Children = Math.round(salary * (1 / 3));
  const for3Children = Math.round(salary * 0.5);

  const text =
    `👶 <b>ALIMENT HISOBLASH NATIJASI (OK 99-MODDA)</b>\n\n` +
    `💼 <b>Oylik daromad (ish haqi):</b> <b>${salary.toLocaleString()} so'm</b>\n` +
    `➖➖➖➖➖➖➖➖➖➖\n` +
    `🔹 <b>1 nafar bola uchun (25%):</b>\n` +
    `👉 <b>${for1Child.toLocaleString()} so'm / oyiga</b>\n\n` +
    `🔹 <b>2 nafar bola uchun (33.3%):</b>\n` +
    `👉 <b>${for2Children.toLocaleString()} so'm / oyiga</b>\n\n` +
    `🔹 <b>3 va undan ortiq bola uchun (50%):</b>\n` +
    `👉 <b>${for3Children.toLocaleString()} so'm / oyiga</b>\n` +
    `➖➖➖➖➖➖➖➖➖➖\n` +
    `💡 <i>Agar ota rasmiy ishlamasa yoki daromadi aniq bo'lmasa, aliment o'rtacha oylik ish haqi miqdoridan kelib chiqib belgilanadi.</i>`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Qayta hisoblash', 'calc_aliment')],
    [Markup.button.callback('📄 Sudga Aliment Da\'vo Arizasi', 'doc_type_aliment')],
    [Markup.button.callback('⬅️ Asosiy Kalkulyator', 'calc_home')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleYhqFineCalculation(ctx: MyContext, fineAmount: number, violationTitle: string) {
  const discountFine = Math.round(fineAmount * 0.5);

  const text =
    `🚗 <b>YHQ JARIMASI HISOBLANDI</b>\n\n` +
    `⚠️ <b>Qoidabuzarlik:</b> ${violationTitle}\n` +
    `💰 <b>Asosiy jarima miqdori:</b> <b>${fineAmount.toLocaleString()} so'm</b>\n` +
    `➖➖➖➖➖➖➖➖➖➖\n` +
    `⚡️ <b>15 KUN ICHIDA TO'LASANGIZ (50% CHEGIRMA):</b>\n` +
    `🎉 <b>${discountFine.toLocaleString()} so'm</b>\n\n` +
    `📈 <b>Iqtisod qilingan summa:</b> ${discountFine.toLocaleString()} so'm!\n` +
    `➖➖➖➖➖➖➖➖➖➖\n` +
    `💡 <i>Qaror nusxasi kelgan kundan boshlab 15 kun ichida YIDXP (my.gov.uz) yoki bank ilovalarida to'lashingiz mumkin.</i>`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Boshqa qoidabuzarlikni hisoblash', 'calc_yhq')],
    [Markup.button.callback('⬅️ Asosiy Kalkulyator', 'calc_home')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleCalcCalculation(ctx: MyContext, type: 'civil' | 'econ' | 'penya', amount: number, days: number = 30) {
  let text = '';

  if (type === 'civil') {
    const rawDuty = amount * 0.04;
    const duty = Math.max(rawDuty, CURRENT_BHM);
    const postal = CURRENT_BHM * 0.05;
    const total = duty + postal;

    text =
      `⚖️ <b>FUQAROLIK SUDI DAVLAT BOJI NATIJASI</b>\n\n` +
      `💰 <b>Da'vo summasi:</b> ${amount.toLocaleString()} so'm\n` +
      `📊 <b>Davlat boji stavkasi:</b> 4%\n` +
      `💸 <b>Davlat boji:</b> <b>${duty.toLocaleString()} so'm</b> ${rawDuty < CURRENT_BHM ? '(Minimal 1 BHM o\'rnatildi)' : ''}\n` +
      `📬 <b>Pochta xarajati:</b> ${postal.toLocaleString()} so'm (0.05 BHM)\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `💵 <b>JAMI SUDGA TO'LANADIGAN SUMMA:</b> <b>${total.toLocaleString()} so'm</b>\n\n` +
      `💡 <i>Ushbu to'lov kvitansiyasini da'vo arizasiga ilova qilish shart.</i>`;
  } else if (type === 'econ') {
    const rawDuty = amount * 0.02;
    const duty = Math.max(rawDuty, CURRENT_BHM);
    const postal = CURRENT_BHM * 0.05;
    const total = duty + postal;

    text =
      `🏢 <b>IQTISODIY SUD DAVLAT BOJI NATIJASI</b>\n\n` +
      `💰 <b>Da'vo summasi:</b> ${amount.toLocaleString()} so'm\n` +
      `📊 <b>Davlat boji stavkasi:</b> 2%\n` +
      `💸 <b>Davlat boji:</b> <b>${duty.toLocaleString()} so'm</b> ${rawDuty < CURRENT_BHM ? '(Minimal 1 BHM o\'rnatildi)' : ''}\n` +
      `📬 <b>Pochta xarajati:</b> ${postal.toLocaleString()} so'm (0.05 BHM)\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `💵 <b>JAMI SUDGA TO'LANADIGAN SUMMA:</b> <b>${total.toLocaleString()} so'm</b>\n\n` +
      `💡 <i>Iqtisodiy sudga da'vo ariza berishdan oldin javobgarga talabnoma (pretenziya) yuborilgan bo'lishi shart.</i>`;
  } else if (type === 'penya') {
    const dailyRate = 0.004; // 0.4% per day
    const rawPenya = amount * dailyRate * days;
    const maxPenya = amount * 0.5; // Max 50% limit
    const penya = Math.min(rawPenya, maxPenya);
    const totalCollectible = amount + penya;

    text =
      `⌛ <b>PENYA HISOBLASH NATIJASI (FK 327-MODDA)</b>\n\n` +
      `💰 <b>Asosiy qarzdorlik:</b> ${amount.toLocaleString()} so'm\n` +
      `📅 <b>Kechiktirilgan kunlar:</b> ${days} kun\n` +
      `📈 <b>Kunlik penya stavkasi:</b> 0.4%\n` +
      `💸 <b>Hisoblangan penya summasi:</b> <b>${penya.toLocaleString()} so'm</b> ${rawPenya > maxPenya ? '(Maksimal 50% chegara qo\'llanildi)' : ''}\n` +
      `➖➖➖➖➖➖➖➖➖➖\n` +
      `💵 <b>JAMI UNDIRILADIGAN SUMMA:</b> <b>${totalCollectible.toLocaleString()} so'm</b>`;
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Qayta hisoblash', 'calc_home')],
    [Markup.button.callback('📄 Sud da\'vo arizasi yaratish', 'doc_type_daavo')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleCalcTextInput(ctx: MyContext, text: string): Promise<boolean> {
  const calcState = (ctx.session as any)?.calcState;
  if (!calcState || !calcState.type) return false;

  const num = parseInt(text.replace(/\s+/g, ''), 10);
  if (isNaN(num) || num <= 0) {
    await ctx.reply('⚠️ Iltimos, to\'g\'ri musbat son kiriting! Masalan: <code>5000000</code>', { parse_mode: 'HTML' });
    return true;
  }

  const type = calcState.type;
  delete (ctx.session as any).calcState;

  if (type === 'aliment') {
    await handleAlimentCalculation(ctx, num);
    return true;
  }

  await handleCalcCalculation(ctx, type, num, 30);
  return true;
}
