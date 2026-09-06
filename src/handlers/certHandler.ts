import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import config from '../config';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import UI, { formatHeader, formatSectionDivider } from '../utils/ui';

export async function handleCertView(ctx: MyContext) {
  const text =
    `🎓 ${UI.header('HUQUQ FANI BO‘YICHA MILLIY SERTIFIKAT', '📜')}\n\n` +
    `Ushbu bo‘lim O‘zbekiston Respublikasi Adliya vazirligi hamda Bilimni baholash agentligi (DTM) tomonidan o‘tkaziladigan <b>Huquqshunoslik bo‘yicha Milliy Sertifikat</b> imtihonlariga tayyorgarlik ko‘rish uchun mo‘ljallangan.\n\n` +
    `💡 <b>MILLIY SERTIFIKAT IMTIYOZLARI:</b>\n` +
    ` 🥇 <b>A+ Daraja (90%+):</b> OTMlarga kirishda Huquq fanidan <b>100% Maksimal Ball</b> beriladi.\n` +
    ` 🥈 <b>A Daraja (80%-89%):</b> Yuqori imtiyozli ball taqdim etiladi.\n` +
    ` 🥉 <b>B+ / B Daraja:</b> Tegishli darajadagi imtiyozli ballar.\n\n` +
    `${UI.DIVIDER}\n` +
    `Quyidagi bo‘limlardan birini tanlang:`;

  const buttons = [
    [Markup.button.callback('📚 PDF Qo‘llanmalar & DTM Testlar', 'cert_pdf_books')],
    [Markup.button.callback('📝 Imtihon Simulyatsiyasini Topshirish', 'cert_exam_start')],
    [Markup.button.callback('📊 Mening Sertifikatlarim & Natijalarim', 'cert_my_results')],
    [Markup.button.callback('📜 Imtihon uchun tavsiya etilgan qonunchilik hujjatlari', 'cert_info')],
  ];

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

export async function handleCertPdfBooksList(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const isPro = ctx.user?.isPro || false;

  // Find or create category for Milliy Sertifikat Materiallari
  let cat = await prisma.category.findUnique({ where: { name: '🎓 Milliy Sertifikat Materiallari' } });
  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: '🎓 Milliy Sertifikat Materiallari',
        description: 'DTM Huquqshunoslik milliy sertifikatiga tayyorgarlik PDF testlari va qo‘llanmalar',
      },
    });
  }

  // Find articles under this category or PDF books
  let articles = await prisma.legalArticle.findMany({
    where: {
      OR: [{ categoryId: cat.id }, { isPdfBook: true }],
    },
    orderBy: { createdAt: 'desc' },
  });

  // Seed sample materials if empty
  if (articles.length === 0) {
    const sampleArticle = await prisma.legalArticle.create({
      data: {
        title: 'DTM Huquqshunoslik Milliy Sertifikat 2026 Qomusiy Qo‘llanma',
        content: 'Konstitutsiya, Fuqarolik, Mehnat va Jinoyat kodeksi bo‘yicha DTM namunasidagi 500 ta tahliliy savollar to‘plami va rasmiy javoblar sharhi.',
        categoryId: cat.id,
        isPdfBook: true,
        fileType: 'pdf',
        price: 15000,
      },
    });
    articles = [sampleArticle];
  }

  let text = formatHeader('📚 Milliy Sertifikat PDF Qo‘llanmalar & Testlar');
  text += `Ushbu bo‘limda DTM Huquqshunoslik imtihoni uchun eng sara PDF qo‘llanma va test to‘plamlari mavjud:\n\n`;

  const inlineButtons: any[] = [];

  articles.forEach((art, idx) => {
    const priceText = art.price > 0 ? `${art.price.toLocaleString('uz-UZ')} UZS` : 'BEPUL';
    text += `<b>${idx + 1}. 📄 ${escapeHTML(art.title)}</b>\n`;
    text += `📝 <i>${escapeHTML(art.content)}</i>\n`;
    text += `🏷 <b>Narxi:</b> <code>${isPro ? 'BEPUL (VIP PRO)' : priceText}</code>\n${formatSectionDivider()}\n`;

    if (isPro || art.price === 0) {
      inlineButtons.push([Markup.button.callback(`📥 Yuklab Olish: ${art.title.slice(0, 20)}...`, `dl_pdf_${art.id}`)]);
    } else {
      inlineButtons.push([Markup.button.callback(`💳 Sotib Olish (${priceText}): ${art.title.slice(0, 15)}...`, `cert_buy_pdf_${art.id}`)]);
    }
  });

  inlineButtons.push([Markup.button.callback('🔙 Ortga', 'cert_home')]);

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(inlineButtons) }).catch(() => {});
}

export async function handleCertBuyPdfPrompt(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery().catch(() => {});

  const article = await prisma.legalArticle.findUnique({ where: { id: articleId } });
  if (!article) return ctx.reply('⚠️ PDF material topilmadi.');

  const price = article.price > 0 ? `${article.price.toLocaleString('uz-UZ')} UZS` : '15 000 UZS';

  (ctx.session as any).paymentSession = {
    plan: 'PDF_MATERIAL',
    articleId: article.id,
    price,
    step: 'AWAITING_RECEIPT',
  };

  let html = formatHeader(`💳 PDF Material Sotib Olish`);
  html += `<b>Material:</b> ${escapeHTML(article.title)}\n`;
  html += `📌 <b>To‘lov Summasi:</b> <code>${price}</code>\n`;
  html += `💳 <b>Karta Raqami:</b> <code>${config.adminCardNumber}</code>\n`;
  html += `👤 <b>Karta Egasi:</b> ${config.adminCardHolder}\n\n`;
  html += `📲 <b>QADAMLAR:</b>\n`;
  html += `1. Har qanday bank ilovasi (Click, Payme, Uzum, Anorbank) orqali kartaga <b>${price}</b> o‘tkazing.\n`;
  html += `2. To‘lov <b>chekining rasm (skrinshot)ini</b> ushbu chatga yuboring.\n`;
  html += `3. Admin to‘lovni tasdiqlashi bilanoq PDF fayl avtomatik tarzda Telegramingizga yetkazib beriladi! 🚀`;

  const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🔙 Ortga', 'cert_pdf_books')]]);

  return ctx.editMessageText(html, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
}

export async function handleCertExamStart(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  // National Certificate Exam Questions Simulation
  const certQuestions = [
    {
      id: 101,
      question: 'O‘zbekiston Respublikasi Konstitutsiyasining nechanchi moddasida insonning shaxsiy daxlsizligi kafolatlanadi?',
      optionA: '25-modda',
      optionB: '1-modda',
      optionC: '50-modda',
      optionD: '10-modda',
      correctAnswer: 'A',
      explanation: 'Konstitutsiya 25-modda: Har kim erkinlik va shaxsiy daxlsizlik huquqiga ega.',
    },
    {
      id: 102,
      question: 'Fuqarolik kodeksiga ko‘ra to‘liq muomala layoqati necha yoshdan vujudga keladi?',
      optionA: '18 yoshdan',
      optionB: '16 yoshdan',
      optionC: '21 yoshdan',
      optionD: '14 yoshdan',
      correctAnswer: 'A',
      explanation: 'Fuqarolik kodeksi 22-moddasi: Fuqaroning muomala layoqati voyaga etishi bilan, ya\'ni o\'n sakkiz (18) yoshga to\'lishi bilan to\'liq hajmda vujudga keladi.',
    },
    {
      id: 103,
      question: 'Mehnat kodeksiga muvofiq sinov muddati ko‘pi bilan qancha muddatga belgilanishi mumkin?',
      optionA: '3 oy (tashkilot rahbarlari uchun 6 oy)',
      optionB: '1 oy',
      optionC: '1 yil',
      optionD: '6 oy har qanday xodim uchun',
      correctAnswer: 'A',
      explanation: 'Mehnat kodeksi 130-moddasi: Dastlabki sinov muddati uch oydan oshmasligi kerak.',
    },
    {
      id: 104,
      question: 'Ma‘muriy javobgarlik to‘g‘risidagi kodeks bo‘yicha Ma‘muriy qamoq muddati ko‘pi bilan necha sutkani tashkil etadi?',
      optionA: '15 sutka (favqulodda holatda 30 sutka)',
      optionB: '60 sutka',
      optionC: '5 sutka',
      optionD: '3 oy',
      correctAnswer: 'A',
      explanation: 'MJtK 29-modda: Ma‘muriy qamoq o‘n besh sutkagacha bo‘lgan muddatga qo‘llaniladi.',
    },
  ];

  ctx.session = ctx.session || {};
  (ctx.session as any).certExam = {
    currentIndex: 0,
    answers: {},
    questions: certQuestions,
    startTime: Date.now(),
  };

  return sendCertQuestion(ctx, certQuestions, 0);
}

export async function handleCertExamAnswer(ctx: MyContext, qIndex: number, chosenChoice: string) {
  await ctx.answerCbQuery().catch(() => {});

  const certSession = (ctx.session as any)?.certExam;
  if (!certSession || !certSession.questions) {
    return ctx.reply('⚠️ Imtihon sessiyasi topilmadi. Iltimos, imtihonni qaytadan boshlang.');
  }

  const question = certSession.questions[qIndex];
  if (question) {
    certSession.answers[question.id] = chosenChoice;
  }

  const nextIndex = qIndex + 1;
  if (nextIndex < certSession.questions.length) {
    certSession.currentIndex = nextIndex;
    return sendCertQuestion(ctx, certSession.questions, nextIndex);
  } else {
    return finishCertExam(ctx, certSession);
  }
}

async function sendCertQuestion(ctx: MyContext, questions: any[], index: number) {
  const q = questions[index];
  const total = questions.length;
  const progressBar = UI.progressBar(index + 1, total, 6);

  const text =
    `🎓 <b>MILLIY SERTIFIKAT IMTIHONI</b> (${index + 1}/${total})\n` +
    `${progressBar}\n` +
    `${UI.THIN_DIVIDER}\n\n` +
    `❓ <b>SAVOL:</b> ${escapeHTML(q.question)}\n\n` +
    `🅰️ ${escapeHTML(q.optionA)}\n` +
    `🅱️ ${escapeHTML(q.optionB)}\n` +
    `🅲️ ${escapeHTML(q.optionC)}\n` +
    `🅳️ ${escapeHTML(q.optionD)}`;

  const buttons = [
    [
      Markup.button.callback('A', `cert_ans_${index}_A`),
      Markup.button.callback('B', `cert_ans_${index}_B`),
    ],
    [
      Markup.button.callback('C', `cert_ans_${index}_C`),
      Markup.button.callback('D', `cert_ans_${index}_D`),
    ],
    [Markup.button.callback('❌ Imtihonni Bekor Qilish', 'cert_home')],
  ];

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

async function finishCertExam(ctx: MyContext, session: any) {
  const durationSeconds = Math.max(1, Math.round((Date.now() - (session.startTime || Date.now())) / 1000));
  let correctCount = 0;
  const questions = session.questions;

  let reportText = `🏆 ${UI.header('MILLIY SERTIFIKAT IMTIHON NATIJASI', '📜')}\n\n`;

  questions.forEach((q: any, i: number) => {
    const userChoice = session.answers[q.id];
    const isCorrect = userChoice === q.correctAnswer;
    if (isCorrect) correctCount++;

    reportText += `${i + 1}. ${isCorrect ? '✅' : '❌'} <b>Savol:</b> ${escapeHTML(q.question)}\n`;
    reportText += `   Siz: <b>${userChoice || '-'}</b> | To‘g‘ri javob: <b>${q.correctAnswer}</b>\n`;
    if (q.explanation) {
      reportText += `   💡 <i>${escapeHTML(q.explanation)}</i>\n`;
    }
    reportText += `\n`;
  });

  const total = questions.length;
  const percentage = Math.round((correctCount / total) * 100);

  let grade = 'C';
  let gradeBadge = '🎗';
  let privilege = "Sertifikat berilmadi (60% dan past ball)";

  if (percentage >= 90) {
    grade = 'A+';
    gradeBadge = '🥇';
    privilege = '<b>100% Maksimal Ball Imtiyozi</b> (DTM Imtihonida)';
  } else if (percentage >= 80) {
    grade = 'A';
    gradeBadge = '🥈';
    privilege = '<b>Yuqori Imtiyozli Ball</b>';
  } else if (percentage >= 70) {
    grade = 'B+';
    gradeBadge = '🥉';
    privilege = '<b>Imtiyozli Ball</b>';
  } else if (percentage >= 60) {
    grade = 'B';
    gradeBadge = '📜';
    privilege = '<b>Boshlang\'ich Sertifikat Balli</b>';
  }

  reportText += `${UI.DIVIDER}\n`;
  reportText += `${gradeBadge} <b>ERISHILGAN DARAJA: ${grade}</b> (${percentage}%)\n`;
  reportText += `🎯 <b>To‘g‘ri Javoblar:</b> ${correctCount} / ${total}\n`;
  reportText += `⏱ <b>Sarflangan Vaqt:</b> ${durationSeconds} soniya\n`;
  reportText += `💡 <b>Imtiyoz Holati:</b> ${privilege}\n`;
  reportText += `${UI.DIVIDER}`;

  // Save to DB
  if (ctx.user) {
    try {
      await prisma.certResult.create({
        data: {
          userId: ctx.user.id,
          score: correctCount,
          totalQuestions: total,
          percentage: percentage,
          gradeLevel: grade,
          durationSeconds: durationSeconds,
        },
      });
    } catch (err) {
      console.error('Error saving cert result:', err);
    }
  }

  (ctx.session as any).certExam = undefined;

  const buttons = [
    [Markup.button.callback('🔄 Qayta Imtihon Topshirish', 'cert_exam_start')],
    [Markup.button.callback('🔙 Sertifikat Bo‘limiga Qaytish', 'cert_home')],
  ];

  return ctx.editMessageText(reportText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export async function handleCertMyResults(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.user) return ctx.reply('⚠️ Iltimos, ro‘yxatdan o‘ting.');

  const results = await prisma.certResult.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (results.length === 0) {
    const text = `📊 <b>Siz hali Milliy Sertifikat imtihonini topshirmagansiz.</b>\n\nImtihon topshirish uchun quyidagi tugmani bosing:`;
    const buttons = [[Markup.button.callback('📝 Imtihon Topshirish', 'cert_exam_start')]];
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  let text = `📊 ${UI.header('MILLIY SERTIFIKAT IMTIHONLARINGIZ', '📜')}\n\n`;

  results.forEach((r, i) => {
    const date = new Date(r.createdAt).toLocaleDateString('uz-UZ');
    text += `${i + 1}. <b>Daraja: ${r.gradeLevel}</b> (${r.percentage}%) - ${r.score}/${r.totalQuestions} ta | <i>${date}</i>\n`;
  });
  text += `\n${UI.DIVIDER}`;

  const buttons = [
    [Markup.button.callback('📝 Yangi Imtihon Topshirish', 'cert_exam_start')],
    [Markup.button.callback('🔙 Ortga', 'cert_home')],
  ];

  return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}

export const NATIONAL_CERT_LAWS = [
  { id: 1, title: 'O‘zbekiston Respublikasi Konstitutsiyasi', url: 'https://lex.uz/docs/-6445145' },
  { id: 2, title: '“O‘zbekiston Respublikasining Davlat bayrog‘i to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110034' },
  { id: 3, title: '“O‘zbekiston Respublikasining Davlat gerbi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110052' },
  { id: 4, title: '“O‘zbekiston Respublikasining Davlat madhiyasi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-109968' },
  { id: 5, title: '“Vijdon erkinligi va diniy tashkilotlar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-5500588' },
  { id: 6, title: '“Siyosiy partiyalar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-84144' },
  { id: 7, title: '“O‘zbekiston Respublikasi Vazirlar Mahkamasi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-4636906' },
  { id: 8, title: '“Advokatura to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110006' },
  { id: 9, title: 'O‘zbekiston Respublikasining Budjet kodeksi', url: 'https://lex.uz/docs/-2304138' },
  { id: 10, title: 'O‘zbekiston Respublikasining Fuqarolik kodeksi', url: 'https://lex.uz/docs/-111189' },
  { id: 11, title: '“O‘zbekiston Respublikasining Fuqaroligi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-4761986' },
  { id: 12, title: '“Iste’molchilarning huquqlarini himoya qilish to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-14644' },
  { id: 13, title: 'O‘zbekiston Respublikasining Jinoyat kodeksi', url: 'https://lex.uz/docs/-111453' },
  { id: 14, title: 'O‘zbekiston Respublikasining Jinoyat-protsessual kodeksi', url: 'https://lex.uz/docs/-111460' },
  { id: 15, title: 'O‘zbekiston Respublikasining Ma’muriy javobgarlik to‘g‘risidagi kodeksi', url: 'https://lex.uz/docs/-97664' },
  { id: 16, title: 'O‘zbekiston Respublikasining Mehnat kodeksi', url: 'https://lex.uz/docs/-6257288' },
  { id: 17, title: 'Inson huquqlari bo‘yicha O‘zbekiston Respublikasi Milliy markazi to‘g‘risida NIZOM', url: 'https://lex.uz/docs/-4097457' },
  { id: 18, title: '“Mualliflik huquqi va turdosh huquqlar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-1023492' },
  { id: 19, title: '“Normativ-huquqiy hujjatlar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-5378966' },
  { id: 20, title: '“Notariat to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110002' },
  { id: 21, title: 'O‘zbekiston Respublikasining Oila kodeksi', url: 'https://lex.uz/docs/-162386' },
  { id: 22, title: '“Oliy Majlisning inson huquqlari bo‘yicha vakili (Ombudsman) to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110014' },
  { id: 23, title: '“Prokuratura to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110010' },
  { id: 24, title: '“O‘zbekiston Respublikasining referendumi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-140026' },
  { id: 25, title: 'O‘zbekiston Respublikasining Saylov kodeksi', url: 'https://lex.uz/docs/-4386848' },
  { id: 26, title: 'O‘zbekiston Respublikasining Soliq kodeksi', url: 'https://lex.uz/docs/-4674902' },
  { id: 27, title: '“Sudlar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-5532578' },
  { id: 28, title: 'O‘zbekiston Respublikasi Adliya vazirligi to‘g‘risida NIZOM', url: 'https://lex.uz/docs/-3679803' },
  { id: 29, title: '“O‘zbekiston Respublikasining Xalqaro shartnomalari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-4203173' },
  { id: 30, title: '“Tabiatni muhofaza qilish to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-109283' },
  { id: 31, title: '“Jamiyatda huquqiy ong va huquqiy madaniyatni yuksaltirish tizimini tubdan takomillashtirish to‘g‘risida”gi Prezident farmoni', url: 'https://lex.uz/docs/-4149025' },
  { id: 32, title: '“Jismoniy va yuridik shaxslarning murojaatlari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-3336169' },
  { id: 33, title: '“O‘zbekiston Respublikasida jamoat birlashmalari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110022' },
  { id: 34, title: '“Fuqarolarning o‘zini o‘zi boshqarish organlari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-2157580' },
  { id: 35, title: '“Mahalliy davlat hokimiyati to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110026' },
  { id: 36, title: '“O‘zbekiston Respublikasining Konstitutsiyaviy sudi to‘g‘risida”gi Konstitutsiyaviy qonun', url: 'https://lex.uz/docs/-5392688' },
  { id: 37, title: '“O‘zbekiston Respublikasi Oliy Majlisining Qonunchilik palatasi to‘g‘risida”gi Konstitutsiyaviy qonun', url: 'https://lex.uz/docs/-110018' },
  { id: 38, title: '“O‘zbekiston Respublikasi Oliy Majlisining Senati to‘g‘risida”gi Konstitutsiyaviy qonun', url: 'https://lex.uz/docs/-110020' },
  { id: 39, title: '“O‘zbekiston Respublikasining ma’muriy-hududiy tuzilishi to‘g‘risida”gi qonuni', url: 'https://lex.uz/docs/-4962292' },
  { id: 40, title: '“O‘zbekiston Respublikasi Prezidenti faoliyatining asosiy kafolatlari to‘g‘risida”gi qonuni', url: 'https://lex.uz/docs/-109964' },
  { id: 41, title: '“O‘n sakkiz yoshgacha bo‘lgan xodimlar ko‘tarishlari va tashishlari mumkin bo‘lgan og‘ir yuk normalarining chegarasini belgilash to‘g‘risida”gi NIZOM', url: 'https://lex.uz/docs/-1496924' },
  { id: 42, title: '“O‘zbekiston Respublikasining Davlat tili haqida”gi qonuni', url: 'https://lex.uz/docs/-109960' },
  { id: 43, title: 'Ma’muriy sud ishlarini yuritish to‘g‘risidagi kodeks', url: 'https://lex.uz/docs/-3527279' },
  { id: 44, title: '“Axborot olish kafolatlari va erkinligi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-110038' },
  { id: 45, title: '“Axborot erkinligi prinsiplari va kafolatlari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-109848' },
  { id: 46, title: '“Jamoatchilik nazorati to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-3679808' },
  { id: 47, title: '“Bola huquqlarining kafolatlari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-1297315' },
  { id: 48, title: '“Ommaviy axborot vositalari to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-109972' },
  { id: 49, title: 'Davlat mustaqilligi asoslari to‘g‘risidagi qonun', url: 'https://lex.uz/docs/-109956' },
  { id: 50, title: '“O‘zbekiston respublikasi MUDOFAA TO‘G‘RISIDA”gi qonuni', url: 'https://lex.uz/docs/-110042' },
  { id: 51, title: '“O‘zbekiston Respublikasi Sudyalar oliy kengashi to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-3156220' },
  { id: 52, title: '“O‘zbekiston Respublikasi Ma’muriy tartib-taomillar to‘g‘risida”gi qonun', url: 'https://lex.uz/docs/-3493774' },
];

export async function handleCertInfoPage(ctx: MyContext, page: number = 1) {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
  }

  const itemsPerPage = 26;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = NATIONAL_CERT_LAWS.slice(startIndex, endIndex);

  let text = `📜 <b>HUQUQSHUNOSLIK MILLIY SERTIFIKATI DASTURI</b> (Sahifa ${page}/2)\n\n`;
  text += `📌 <b>Tavsiya etilgan rasmiy qonunchilik hujjatlari ruyxati (Lex.uz rasmiy manbalari bilan):</b>\n\n`;

  pageItems.forEach((item) => {
    text += `${item.id}. <a href="${item.url}">${escapeHTML(item.title)}</a>\n`;
  });

  text += `\n<i>💡 Izoh: Har bir qonun nomiga bosib <a href="https://lex.uz">Lex.uz</a> rasmiy matni bilan bevosita tanishishingiz mumkin.</i>`;

  const buttons: any[] = [];
  if (page === 1) {
    buttons.push([Markup.button.callback('➡️ Keyingi Sahifa (27-52)', 'cert_info_page_2')]);
  } else {
    buttons.push([Markup.button.callback('⬅️ Oldingi Sahifa (1-26)', 'cert_info_page_1')]);
  }
  buttons.push([Markup.button.callback('🔙 Sertifikat Bo‘limiga Qaytish', 'cert_home')]);

  const replyOptions = {
    parse_mode: 'HTML' as const,
    link_preview_options: { is_disabled: true },
    ...Markup.inlineKeyboard(buttons),
  };

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, replyOptions).catch(() => {});
  }

  return ctx.reply(text, replyOptions);
}
