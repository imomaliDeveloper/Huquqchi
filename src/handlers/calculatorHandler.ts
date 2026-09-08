import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';

const CURRENT_BHM = 375000; // 1 BHM (Baza hisoblash miqdori) = 375,000 UZS

export async function handleCalculatorView(ctx: MyContext) {
  const text =
    `🧮 <b>YURIDIK VA DAVLAT BOJI KALKULYATORI</b>\n\n` +
    `Joriy Baza Hisoblash Miqdori (BHM): <b>${CURRENT_BHM.toLocaleString()} so'm</b>\n\n` +
    `Kerakli kalkulyator turini tanlang:\n\n` +
    `⚖️ <b>Fuqarolik Sudlari</b> — Mol-mulk da'volari bo'yicha davlat boji (4%)\n` +
    `🏢 <b>Iqtisodiy Sudlar</b> — Biznes da'volari bo'yicha davlat boji (2%)\n` +
    `🏛 <b>Ma'muriy Sudlar</b> — Davlat organi qaroridan shikoyat (1 BHM)\n` +
    `⌛ <b>Penya & Qarzdorlik</b> — Kechiktirilgan kunlar bo'yicha penya (0.4%/kun)`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⚖️ Fuqarolik Sudi Davlat Boji', 'calc_civil')],
    [Markup.button.callback('🏢 Iqtisodiy Sud Davlat Boji', 'calc_econ')],
    [Markup.button.callback('🏛 Ma\'muriy Sud Davlat Boji', 'calc_admin')],
    [Markup.button.callback('⌛ Penya & Kechiktirilgan Summa', 'calc_penya')],
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
      [
        Markup.button.callback('100 mln so\'m', 'calc_civil_val_100000000'),
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
    await ctx.reply('⚠️ Iltimos, to\'g\'ri musbat son kiriting! Masalan: <code>15000000</code>', { parse_mode: 'HTML' });
    return true;
  }

  delete (ctx.session as any).calcState;
  await handleCalcCalculation(ctx, calcState.type, num, 30);
  return true;
}
