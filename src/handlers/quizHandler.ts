import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML, sanitizeExternalAds } from '../utils/helpers';
import UI from '../utils/ui';
import { seedDtmMockExam, seedSchoolTextbookQuizzes } from '../data/dtmMockExamData';

export async function handleQuizView(ctx: MyContext) {
  try {
    const text =
      `📝 ${UI.header('HUQUQIY TESTLAR VA SAVOLNOMALAR MARKAZI', '🎯')}\n\n` +
      `Bilimingizni sinash va imtihonlarga tayyorlanish uchun kerakli bo‘limni tanlang:\n\n` +
      `🎯 <b>Interaktiv Quiz Testlar</b> – Savollarga onlayn javob bering va natijani zudlik bilan bilib oling.\n\n` +
      `📄 <b>PDF Testlar va Savolnomalar</b> – DTMB, OTM va Milliy Sertifikat imtihon test to‘plamlarini PDF formatda yuklab oling.\n\n` +
      `📊 <b>Mening Natijalarim</b> – Ishlagan testlaringiz statistikasi va natijalari.\n\n` +
      `${UI.DIVIDER}`;

    const buttons = [
      [Markup.button.callback('🎯 Interaktiv Quiz Testlar', 'quiz_interactive_home')],
      [Markup.button.callback('📄 PDF Testlar va Savolnomalar', 'quiz_pdf_home')],
      [Markup.button.callback('📊 Mening Natijalarim', 'quiz_my_results')],
    ];

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
        return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      });
    }

    return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error in handleQuizView:', error);
    return ctx.reply('⚠️ Testlar markazini yuklashda xatolik yuz berdi.');
  }
}

export async function handleInteractiveQuizView(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await seedDtmMockExam();
    await seedSchoolTextbookQuizzes();

    const buttons = [
      [Markup.button.callback('📘 8-sinf Huquq Darslik Testlari', 'quiz_cat_select_8-sinf Huquq')],
      [Markup.button.callback('📗 9-sinf Huquq Darslik Testlari', 'quiz_cat_select_9-sinf Huquq')],
      [Markup.button.callback('📙 10-sinf Huquq Darslik Testlari', 'quiz_cat_select_10-sinf Huquq')],
      [Markup.button.callback('📕 11-sinf Huquq Darslik Testlari', 'quiz_cat_select_11-sinf Huquq')],
      [Markup.button.callback('🎯 DTM 2026 Imtihon Testlari', 'quiz_cat_select_DTM Imtihon Testlari')],
      [Markup.button.callback('📜 Milliy Sertifikat Testlari', 'quiz_cat_select_Milliy Sertifikat Testlari')],
      [Markup.button.callback('📋 Barcha Interaktiv Testlar', 'quiz_cat_select_ALL')],
      [Markup.button.callback('🔙 Testlar Markaziga Qaytish', 'back_to_quizzes')],
    ];

    const text =
      `🎯 ${UI.header('INTERAKTIV QUIZ TESTLAR', '📝')}\n\n` +
      `Bilimingizni sinash va imtihonlarga tayyorlanish uchun kerakli darslik yoki imtihon bo‘limini tanlang:\n\n` +
      `${UI.DIVIDER}`;

    if (ctx.callbackQuery) {
      return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
        return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      });
    }

    return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error in handleInteractiveQuizView:', error);
    return ctx.reply('⚠️ Interaktiv testlarni yuklashda xatolik yuz berdi.');
  }
}

export async function handleInteractiveQuizCategory(ctx: MyContext, categoryName: string) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    let whereClause: any = {};
    if (categoryName !== 'ALL') {
      whereClause = {
        OR: [
          { category: categoryName },
          { title: { contains: categoryName } },
          { description: { contains: categoryName } },
        ],
      };
    }

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: { _count: { select: { questions: true } } },
      orderBy: { id: 'asc' },
    });

    if (quizzes.length === 0) {
      const emptyButtons = [[Markup.button.callback('🔙 Bo‘limlarga Qaytish', 'quiz_interactive_home')]];
      const msg =
        `📂 <b>${escapeHTML(categoryName).toUpperCase()} TESTLARI</b>\n\n` +
        `<i>Hozircha ushbu bo‘limda testlar mavjud emas. Admin tomonidan tez orada yuklanadi!</i>`;
      return ctx.editMessageText(msg, { parse_mode: 'HTML', ...Markup.inlineKeyboard(emptyButtons) }).catch(() => {});
    }

    const buttons = quizzes.map((quiz) => {
      let countText = `${quiz._count.questions} ta savol`;
      if (quiz._count.questions === 0 && quiz.description) {
        const m = quiz.description.match(/(\d+)\s*ta\s*savol/i);
        if (m) countText = `${m[1]} ta savol`;
        else if (quiz.description.includes('http')) countText = 'QuizBot Link';
      }
      const prefix = quiz._count.questions > 0 ? '📝' : '🎲';
      return [
        Markup.button.callback(`${prefix} ${quiz.title} (${countText})`, `quiz_start_${quiz.id}`),
      ];
    });

    buttons.push([Markup.button.callback('🔙 Bo‘limlarga Qaytish', 'quiz_interactive_home')]);

    const text =
      `📂 <b>${escapeHTML(categoryName).toUpperCase()} BO'LIMI TESTLARI</b>\n` +
      `${UI.THIN_DIVIDER}\n` +
      `Ishlamoqchi bo‘lgan testingizni tanlang:\n\n` +
      `${UI.DIVIDER}`;

    if (ctx.callbackQuery) {
      return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
        return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      });
    }

    return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error fetching interactive quiz category:', error);
    return ctx.reply('⚠️ Testlarni yuklashda xatolik yuz berdi.');
  }
}

export async function handlePdfQuizHome(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    let pdfCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: 'PDF' } },
          { name: { contains: 'DTM' } },
          { name: { contains: 'Test' } },
        ],
      },
      include: { _count: { select: { articles: true } } },
      orderBy: { id: 'asc' },
    });

    if (pdfCategories.length === 0) {
      const defaultPdfCats = [
        { name: '📄 DTMB & OTM Qabul PDF Testlari', description: 'DTMB hamda OTM qabul imtihonlari yuridik test to‘plamlari' },
        { name: '📄 TDYU & Yuridik Texnikum PDF Testlari', description: 'Toshkent davlat yuridik universiteti kirish hamda oraliq testlari' },
        { name: '📄 Milliy Sertifikat PDF Test Savollari', description: 'Huquqshunoslik fanidan milliy sertifikat PDF nazorat savollari' },
        { name: '📄 Konstitutsiya & Qonunchilik PDF Testlar Baza', description: 'Konstitutsiya va asosiy kodekslar bo‘yicha PDF savolnomalar' },
      ];

      for (const cat of defaultPdfCats) {
        await prisma.category.upsert({
          where: { name: cat.name },
          update: {},
          create: cat,
        });
      }

      pdfCategories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: 'PDF' } },
            { name: { contains: 'DTM' } },
            { name: { contains: 'Test' } },
          ],
        },
        include: { _count: { select: { articles: true } } },
        orderBy: { id: 'asc' },
      });
    }

    const buttons = pdfCategories.map((cat) => [
      Markup.button.callback(`${cat.name} (${cat._count.articles} ta)`, `quiz_pdf_cat_${cat.id}`),
    ]);

    buttons.push([Markup.button.callback('🔙 Testlar Markaziga Qaytish', 'back_to_quizzes')]);

    const text =
      `📄 ${UI.header('PDF TESTLAR VA SAVOLNOMALAR', '📚')}\n\n` +
      `Ushbu bo‘limda DTMB, OTM qabul, TDYU hamda Milliy sertifikat PDF test to‘plamlarini yuklab olishingiz mumkin:\n\n` +
      `${UI.DIVIDER}`;

    return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
      return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    });
  } catch (error) {
    console.error('Error fetching PDF quiz home:', error);
    return ctx.reply('⚠️ PDF testlar bo‘limini yuklashda xatolik yuz berdi.');
  }
}

export async function handlePdfQuizCategory(ctx: MyContext, categoryId: number) {
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
      const emptyButtons = [[Markup.button.callback('🔙 PDF Bo‘limlariga Qaytish', 'quiz_pdf_home')]];
      return ctx.editMessageText(
        `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n\n` +
        `<i>Hozircha ushbu bo‘limga yangi PDF test to‘plamlari yuklanmoqda. Admin tomonidan zudlik bilan to‘ldiriladi!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(emptyButtons) }
      ).catch(() => {});
    }

    const buttons = category.articles.map((art) => [
      Markup.button.callback(`📄 ${art.title}`, `quiz_pdf_dl_${art.id}`),
    ]);

    buttons.push([Markup.button.callback('🔙 PDF Bo‘limlariga Qaytish', 'quiz_pdf_home')]);

    return ctx.editMessageText(
      `📂 <b>${escapeHTML(category.name).toUpperCase()}</b>\n` +
      `${UI.THIN_DIVIDER}\n` +
      `Yuklab olmoqchi bo‘lgan PDF test materialini tanlang:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    ).catch(() => {});
  } catch (error) {
    console.error('Error in handlePdfQuizCategory:', error);
    return ctx.reply('⚠️ PDF test kategoriyasini yuklashda xatolik yuz berdi.');
  }
}

export async function handleDownloadPdfQuiz(ctx: MyContext, articleId: number) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    const article = await prisma.legalArticle.findUnique({
      where: { id: articleId },
      include: { category: true },
    });

    if (!article) {
      return ctx.reply('⚠️ PDF test to‘plami topilmadi.');
    }

    if (article.fileId) {
      await ctx.replyWithDocument(article.fileId, {
        caption:
          `📄 <b>PDF TEST: ${escapeHTML(article.title)}</b>\n\n` +
          `📂 <b>Kategoriya:</b> ${escapeHTML(article.category?.name || 'PDF Testlar')}\n\n` +
          `💡 <i>Ushbu PDF test to‘plamini yuklab olib, offlayn rejimda bilimingizni sinashingiz mumkin. O‘qish va tayyorgarlikda zafarlar tilaymiz! 🚀</i>`,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply(
        `📄 <b>PDF TEST: ${escapeHTML(article.title)}</b>\n\n` +
        `${escapeHTML(article.content)}\n\n` +
        `💡 <i>Hujjat fayli tizimda raqamlashtirilmoqda.</i>`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Error in handleDownloadPdfQuiz:', error);
    return ctx.reply('⚠️ PDF testni yuklab olishda xatolik yuz berdi.');
  }
}

export async function handleQuizMyResults(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.user) {
    return ctx.reply('⚠️ Natijalarni ko‘rish uchun tizimda ro‘yxatdan o‘tgan bo‘lishingiz lozim.');
  }

  try {
    const results = await prisma.quizResult.findMany({
      where: { userId: ctx.user.id },
      include: { quiz: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const buttons = [[Markup.button.callback('🔙 Testlar Markaziga Qaytish', 'back_to_quizzes')]];

    if (results.length === 0) {
      return ctx.editMessageText(
        `📊 <b>MENING NATIJALARIM</b>\n\n` +
        `Siz hali birorta ham interaktiv test ishlamagansiz.\n` +
        `"🎯 Interaktiv Quiz Testlar" bo‘limiga o‘tib, birinchi testni topshiring va bilimingizni sinang!`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      ).catch(() => {});
    }

    const totalTaken = results.length;
    const avgScore = Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTaken);
    const highestScore = Math.max(...results.map((r) => r.percentage));

    let historyText = '';
    results.forEach((r, idx) => {
      const dateStr = new Date(r.createdAt).toLocaleDateString('uz-UZ');
      const badge = r.percentage >= 80 ? '🟢' : r.percentage >= 60 ? '🟡' : '🔴';
      historyText += `${idx + 1}. ${badge} <b>${escapeHTML(r.quiz?.title || 'Test')}</b>\n`;
      historyText += `   🎯 Javoblar: <b>${r.score}/${r.totalQuestions}</b> (${r.percentage}%) | ⏱ ${r.durationSeconds}s | 📅 ${dateStr}\n\n`;
    });

    const summaryText =
      `📊 ${UI.header('MENING TEST NATIJALARIM', '🏆')}\n\n` +
      `📈 <b>Jami topshirilgan testlar:</b> <code>${totalTaken} ta</code>\n` +
      `🎯 <b>O‘rtacha o‘zlashtirish:</b> <code>${avgScore}%</code>\n` +
      `⭐ <b>Eng yuqori natija:</b> <code>${highestScore}%</code>\n\n` +
      `${UI.THIN_DIVIDER}\n` +
      `<b>Oxirgi topshirilgan testlar:</b>\n\n` +
      `${historyText}` +
      `${UI.DIVIDER}`;

    return ctx.editMessageText(summaryText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return ctx.reply('⚠️ Natijalaringizni yuklashda xatolik yuz berdi.');
  }
}

export async function handleQuizStart(ctx: MyContext, quizId: number) {
  await ctx.answerCbQuery().catch(() => {});

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { id: 'asc' } } },
    });

    if (!quiz) {
      return ctx.reply('⚠️ Test topilmadi.');
    }

    if (quiz.questions.length === 0) {
      const linkMatch = quiz.description?.match(/(https?:\/\/[^\s\n]+)/);
      const quizLink = linkMatch ? linkMatch[1] : null;

      if (quizLink) {
        const cleanTitle = sanitizeExternalAds(quiz.title);
        const cleanDesc = sanitizeExternalAds(quiz.description || '');

        const buttons = [
          [Markup.button.url('🚀 QuizBot Testini Boshlash', quizLink)],
          [Markup.button.url('📢 @Huquq_study Kanalimiz', 'https://t.me/Huquq_study')],
          [Markup.button.callback('🔙 Testlar Ro‘yxatiga Qaytish', 'quiz_interactive_home')],
        ];

        const text =
          `🎲 <b>${escapeHTML(cleanTitle)}</b>\n\n` +
          `📂 <b>Bo‘lim:</b> <code>${escapeHTML(quiz.category || 'Huquqiy Testlar')}</code>\n` +
          `📝 <b>Tavsif:</b> ${escapeHTML(cleanDesc || 'Telegram QuizBot interaktiv testi')}\n\n` +
          `📢 <b>Rasmiy Kanal:</b> @Huquq_study\n\n` +
          `💡 <i>Ushbu test Telegram @QuizBot platformasida tayyorlangan. Quyidagi tugma orqali test yechishni boshlashingiz mumkin:</i>`;

        if (ctx.callbackQuery) {
          return ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {
            return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
          });
        }

        return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
      }

      return ctx.reply('⚠️ Ushbu testda hali savollar mavjud emas.');
    }

    ctx.session = ctx.session || {};
    ctx.session.quiz = {
      quizId,
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
    };

    return sendQuizQuestion(ctx, quiz, 0);
  } catch (error) {
    console.error('Error in handleQuizStart:', error);
    return ctx.reply('⚠️ Testni boshlashda xatolik yuz berdi.');
  }
}

export async function handleQuizAnswer(ctx: MyContext, quizId: number, qIndex: number, chosenAnswer: string) {
  await ctx.answerCbQuery().catch(() => {});

  if (!ctx.session?.quiz || ctx.session.quiz.quizId !== quizId) {
    return ctx.reply('⚠️ Test sessiyasi muddati tugagan. Iltimos, testni qaytadan boshlang.');
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { id: 'asc' } } },
    });

    if (!quiz) return ctx.reply('⚠️ Test topilmadi.');

    const currentQuestion = quiz.questions[qIndex];
    if (currentQuestion) {
      if (!ctx.session.quiz.answers) {
        ctx.session.quiz.answers = {};
      }
      ctx.session.quiz.answers[currentQuestion.id] = chosenAnswer;
    }

    const nextIndex = qIndex + 1;

    if (nextIndex < quiz.questions.length) {
      ctx.session.quiz.currentQuestionIndex = nextIndex;
      return sendQuizQuestion(ctx, quiz, nextIndex);
    } else {
      return finishQuiz(ctx, quiz);
    }
  } catch (error) {
    console.error('Error in handleQuizAnswer:', error);
    return ctx.reply('⚠️ Javobni saqlashda xatolik yuz berdi.');
  }
}

async function sendQuizQuestion(ctx: MyContext, quiz: any, questionIndex: number) {
  const question = quiz.questions[questionIndex];
  const total = quiz.questions.length;
  const progressBar = UI.progressBar(questionIndex + 1, total, 6);

  const questionText =
    `📝 <b>${escapeHTML(quiz.title)}</b> (${questionIndex + 1}/${total})\n` +
    `${progressBar}\n` +
    `${UI.THIN_DIVIDER}\n\n` +
    `❓ <b>SAVOL:</b> ${escapeHTML(question.question)}\n\n` +
    `🅰️ ${escapeHTML(question.optionA)}\n` +
    `🅱️ ${escapeHTML(question.optionB)}\n` +
    `🅲️ ${escapeHTML(question.optionC)}\n` +
    `🅳️ ${escapeHTML(question.optionD)}`;

  const buttons = [
    [
      Markup.button.callback('A', `quiz_ans_${quiz.id}_${questionIndex}_A`),
      Markup.button.callback('B', `quiz_ans_${quiz.id}_${questionIndex}_B`),
    ],
    [
      Markup.button.callback('C', `quiz_ans_${quiz.id}_${questionIndex}_C`),
      Markup.button.callback('D', `quiz_ans_${quiz.id}_${questionIndex}_D`),
    ],
    [Markup.button.callback('❌ Testni Bekor Qilish', 'back_to_quizzes')],
  ];

  if (ctx.callbackQuery) {
    return ctx.editMessageText(questionText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
  }

  return ctx.reply(questionText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
}

async function finishQuiz(ctx: MyContext, quiz: any) {
  const quizSession = ctx.session?.quiz;
  if (!quizSession || !quizSession.answers) return;

  const userAnswers = quizSession.answers;
  const durationSeconds = Math.max(1, Math.round((Date.now() - (quizSession.startTime || Date.now())) / 1000));
  let correctCount = 0;
  let summaryText = `🎉 ${UI.header('TEST YAKUNLANDI', '🏆')}\n\n📌 <b>Test:</b> ${escapeHTML(quiz.title)}\n\n`;

  quiz.questions.forEach((q: any, idx: number) => {
    const userChoice = userAnswers[q.id];
    const isCorrect = userChoice === q.correctAnswer;
    if (isCorrect) correctCount++;

    summaryText += `${idx + 1}. ${isCorrect ? '✅' : '❌'} <b>Savol:</b> ${escapeHTML(q.question)}\n`;
    summaryText += `   Sizning javobingiz: <b>${userChoice || 'Belgilanmagan'}</b> | To‘g‘ri javob: <b>${q.correctAnswer}</b>\n`;
    if (q.explanation) {
      summaryText += `   💡 <i>Izoh: ${escapeHTML(q.explanation)}</i>\n`;
    }
    summaryText += `\n`;
  });

  const total = quiz.questions.length;
  const percentage = Math.round((correctCount / total) * 100);

  let gradeBadge = "🏆 <b>A'LO DARAJA!</b>";
  if (percentage < 60) gradeBadge = '⚠️ <b>BILIMLARNI YANADA MUSTAHKAMLANG</b>';
  else if (percentage < 80) gradeBadge = '👍 <b>YAXSHI NATIJA</b>';

  summaryText += `${UI.DIVIDER}\n`;
  summaryText += `${gradeBadge}\n`;
  summaryText += `🎯 <b>Natija:</b> <b>${correctCount} / ${total}</b> (${percentage}%)\n`;
  summaryText += `📊 ${UI.progressBar(correctCount, total, 8)}\n`;
  summaryText += `⏱ <b>Sarflangan Vaqt:</b> ${durationSeconds} soniya\n`;
  summaryText += `${UI.DIVIDER}`;

  if (ctx.user) {
    try {
      await prisma.quizResult.create({
        data: {
          userId: ctx.user.id,
          quizId: quiz.id,
          score: correctCount,
          totalQuestions: total,
          percentage: percentage,
          durationSeconds: durationSeconds,
        },
      });

      await prisma.userActivity.create({
        data: {
          userId: ctx.user.id,
          action: 'QUIZ_TAKEN',
          metadata: JSON.stringify({ quizId: quiz.id, percentage, score: correctCount }),
        },
      });
    } catch (dbErr) {
      console.error('Failed to save QuizResult to database:', dbErr);
    }
  }

  if (ctx.session) {
    ctx.session.quiz = undefined;
  }

  const buttons = [
    [Markup.button.callback('🔄 Qayta Ishlash', `quiz_start_${quiz.id}`)],
    [Markup.button.callback('🔙 Testlar Ro‘yxatiga Qaytish', 'back_to_quizzes')],
  ];

  return ctx.editMessageText(summaryText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }).catch(() => {});
}
