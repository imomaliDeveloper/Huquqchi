import { MyContext } from '../bot/context';
import AdminService from '../services/adminService';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';

export interface AdminQuizSessionData {
  step?:
    | 'AWAITING_QUIZ_TITLE'
    | 'AWAITING_QUIZ_CATEGORY'
    | 'AWAITING_QUESTION_TEXT'
    | 'AWAITING_QUESTION_IMAGE'
    | 'AWAITING_OPTION_A'
    | 'AWAITING_OPTION_B'
    | 'AWAITING_OPTION_C'
    | 'AWAITING_OPTION_D'
    | 'AWAITING_CORRECT_ANSWER'
    | 'AWAITING_EXPLANATION';
  quizId?: number;
  quizTitle?: string;
  quizCategory?: string;
  currentQuestion?: {
    text?: string;
    imageUrl?: string;
    fileId?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer?: string;
    explanation?: string;
  };
  addedQuestionsCount?: number;
}

export async function handleAdminCreateQuizStart(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  ctx.session = ctx.session || {};
  (ctx.session as any).adminQuiz = {
    step: 'AWAITING_QUIZ_TITLE',
    currentQuestion: {},
    addedQuestionsCount: 0,
  };

  const buttons = [[Markup.button.callback('❌ Bekor qilish', 'admin_home')]];

  return ctx.editMessageText(
    `📝 <b>YANGI HUQUQIY TEST YARATISH (1-bosqich / 3)</b>\n\n` +
    `Iltimos, yaratmoqchi bo‘lgan testingiz uchun <b>Sarlavha (Nom)</b> kiriting:\n` +
    `<i>(Masalan: "Ma'muriy Javobgarlik Bo'yicha Test")</i>`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminQuizSteps(ctx: MyContext, next: () => Promise<void>) {
  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession || !quizSession.step) {
    return next();
  }

  const step = quizSession.step;
  const hasMessage = !!ctx.message;
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';

  // STEP 1: Quiz Title
  if (step === 'AWAITING_QUIZ_TITLE' && text) {
    if (text.length < 3) {
      return ctx.reply('⚠️ Test sarlavhasi kamida 3 ta harfdan iborat bo‘lishi kerak:');
    }

    quizSession.quizTitle = text;
    quizSession.step = 'AWAITING_QUIZ_CATEGORY';

    const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const buttons = categories.map((cat) => [
      Markup.button.callback(`📂 ${cat.name}`, `admin_quiz_cat_${cat.name}`),
    ]);
    buttons.push([Markup.button.callback('❌ Bekor qilish', 'admin_home')]);

    return ctx.reply(
      `✅ Test sarlavhasi: <b>"${escapeHTML(text)}"</b>\n\n` +
      `Endi ushbu test qaysi **Kategoriya**ga tegishli ekanligini tanlang:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    );
  }

  // STEP 3: Question Text Input
  if (step === 'AWAITING_QUESTION_TEXT' && text) {
    if (text.length < 3) {
      return ctx.reply('⚠️ Savol matni o‘ta qisqa. Qayta kiriting:');
    }

    quizSession.currentQuestion = quizSession.currentQuestion || {};
    quizSession.currentQuestion.text = text;
    quizSession.step = 'AWAITING_QUESTION_IMAGE';

    const buttons = [[Markup.button.callback('⏭ Rasmsiz davom etish', 'admin_skip_photo')]];

    return ctx.reply(
      `❓ Savol: <b>"${escapeHTML(text)}"</b>\n\n` +
      `🖼 <b>Ushbu savolga Rasm/Foto biriktirmoqchimisiz?</b>\n` +
      `Ushbu chatga <b>rasm (skrinshot)</b> yoki rasm URL havolasini yuboring. Agar rasm bo'lmasa, quyidagi tugmani bosing:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    );
  }

  // STEP 3.5: Question Image Input (Photo message or Image URL)
  if (step === 'AWAITING_QUESTION_IMAGE') {
    if (ctx.message && 'photo' in ctx.message && Array.isArray(ctx.message.photo) && ctx.message.photo.length > 0) {
      const highestResPhoto = ctx.message.photo[ctx.message.photo.length - 1];
      if (highestResPhoto) {
        quizSession.currentQuestion!.fileId = highestResPhoto.file_id;

        // Get Telegram photo direct link if available
        try {
          const link = await ctx.telegram.getFileLink(highestResPhoto.file_id);
          quizSession.currentQuestion!.imageUrl = link.href;
        } catch (err) {}
      }

      quizSession.step = 'AWAITING_OPTION_A';
      return ctx.reply(`✅ Rasm biriktirildi! 🖼\n\nEndi <b>A variant</b> javobini kiriting:`, {
        parse_mode: 'HTML',
      });
    } else if (text && text.startsWith('http')) {
      quizSession.currentQuestion!.imageUrl = text;
      quizSession.step = 'AWAITING_OPTION_A';
      return ctx.reply(`✅ Rasm URL biriktirildi! 🖼\n\nEndi <b>A variant</b> javobini kiriting:`, {
        parse_mode: 'HTML',
      });
    }
  }

  // STEP 4: Option A
  if (step === 'AWAITING_OPTION_A' && text) {
    quizSession.currentQuestion!.optionA = text;
    quizSession.step = 'AWAITING_OPTION_B';
    return ctx.reply(`🅰️ A variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>B variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 5: Option B
  if (step === 'AWAITING_OPTION_B' && text) {
    quizSession.currentQuestion!.optionB = text;
    quizSession.step = 'AWAITING_OPTION_C';
    return ctx.reply(`🅱️ B variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>C variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 6: Option C
  if (step === 'AWAITING_OPTION_C' && text) {
    quizSession.currentQuestion!.optionC = text;
    quizSession.step = 'AWAITING_OPTION_D';
    return ctx.reply(`🅲️ C variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>D variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 7: Option D
  if (step === 'AWAITING_OPTION_D' && text) {
    quizSession.currentQuestion!.optionD = text;
    quizSession.step = 'AWAITING_CORRECT_ANSWER';

    const buttons = [
      [
        Markup.button.callback('A', 'admin_ans_A'),
        Markup.button.callback('B', 'admin_ans_B'),
        Markup.button.callback('C', 'admin_ans_C'),
        Markup.button.callback('D', 'admin_ans_D'),
      ],
    ];

    return ctx.reply(
      `🅳️ D variant: <b>"${escapeHTML(text)}"</b>\n\n` +
      `Endi ushbu savolning <b>To‘g‘ri Javob variantini</b> tanlang:`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
    );
  }

  // STEP 9: Explanation Input (Optional)
  if (step === 'AWAITING_EXPLANATION' && text) {
    quizSession.currentQuestion!.explanation = text === '-' ? '' : text;
    return saveQuestionToDatabase(ctx, quizSession);
  }

  return next();
}

export async function handleAdminQuizCategorySelect(ctx: MyContext, categoryName: string) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession || !quizSession.quizTitle) {
    return ctx.reply('⚠️ Test yaratish sessiyasi topilmadi.');
  }

  try {
    // Create new Quiz in DB
    const newQuiz = await prisma.quiz.create({
      data: {
        title: quizSession.quizTitle,
        category: categoryName,
        description: `Admin tomonidan yaratilgan ${categoryName} bo'yicha test.`,
      },
    });

    quizSession.quizId = newQuiz.id;
    quizSession.quizCategory = categoryName;
    quizSession.step = 'AWAITING_QUESTION_TEXT';

    return ctx.editMessageText(
      `✅ Test sarlavhasi: <b>"${escapeHTML(quizSession.quizTitle)}"</b> (${escapeHTML(categoryName)})\n\n` +
      `Endi <b>1-savol matnini</b> kiriting:`,
      { parse_mode: 'HTML' }
    ).catch(() => {});
  } catch (error) {
    console.error('Error creating quiz:', error);
    return ctx.reply('⚠️ Test yaratishda xatolik yuz berdi.');
  }
}

export async function handleAdminCorrectAnswerSelect(ctx: MyContext, chosenAnswer: string) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession || !quizSession.currentQuestion) {
    return ctx.reply('⚠️ Savol sessiyasi topilmadi.');
  }

  quizSession.currentQuestion.correctAnswer = chosenAnswer;
  quizSession.step = 'AWAITING_EXPLANATION';

  const buttons = [[Markup.button.callback('⏭ Izohni o‘tkazib yuborish (Skip)', 'admin_skip_explanation')]];

  return ctx.editMessageText(
    `✅ To‘g‘ri javob: <b>${chosenAnswer}</b>\n\n` +
    `Ushbu savol uchun <b>Modda / Qonuniy Izoh</b> kiriting (yoki quyidagi tugma orqali o‘tkazib yuboring):`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminSkipPhoto(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession || !quizSession.currentQuestion) return;

  quizSession.step = 'AWAITING_OPTION_A';
  return ctx.reply(`⏩ Rasm o'tkazib yuborildi.\n\nEndi <b>A variant</b> javobini kiriting:`, {
    parse_mode: 'HTML',
  });
}

export async function handleAdminSkipExplanation(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession) return;

  if (quizSession.currentQuestion) {
    quizSession.currentQuestion.explanation = undefined;
  }

  return saveQuestionToDatabase(ctx, quizSession);
}

async function saveQuestionToDatabase(ctx: MyContext, quizSession: AdminQuizSessionData) {
  if (!quizSession.quizId || !quizSession.currentQuestion) return;

  const q = quizSession.currentQuestion;

  try {
    await prisma.quizQuestion.create({
      data: {
        quizId: quizSession.quizId,
        question: q.text || 'Savol',
        imageUrl: q.imageUrl || null,
        fileId: q.fileId || null,
        optionA: q.optionA || 'A',
        optionB: q.optionB || 'B',
        optionC: q.optionC || 'C',
        optionD: q.optionD || 'D',
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || null,
      },
    });

    quizSession.addedQuestionsCount = (quizSession.addedQuestionsCount || 0) + 1;
    quizSession.currentQuestion = {}; // Reset question draft
    quizSession.step = undefined;

    const buttons = [
      [Markup.button.callback('➕ Yana savol qo‘shish', 'admin_add_another_question')],
      [Markup.button.callback('✅ Test yaratishni yakunlash', 'admin_finish_quiz')],
    ];

    const text =
      `🎉 <b>SAVOL SAQLANDI!</b>\n\n` +
      `📌 <b>Test:</b> ${escapeHTML(quizSession.quizTitle)}\n` +
      `📊 <b>Jami qo‘shilgan savollar:</b> ${quizSession.addedQuestionsCount} ta\n\n` +
      `Yana savol qo‘shasizmi yoki testni yakunlaysizmi?`;

    return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (error) {
    console.error('Error saving quiz question:', error);
    return ctx.reply('⚠️ Savolni saqlashda xatolik yuz berdi.');
  }
}

export async function handleAdminAddAnotherQuestion(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  if (!quizSession || !quizSession.quizId) {
    return ctx.reply('⚠️ Test topilmadi.');
  }

  quizSession.step = 'AWAITING_QUESTION_TEXT';
  quizSession.currentQuestion = {};

  return ctx.editMessageText(
    `📝 <b>${escapeHTML(quizSession.quizTitle)}</b>\n\n` +
    `<b>${(quizSession.addedQuestionsCount || 0) + 1}-savol matnini</b> kiriting:`,
    { parse_mode: 'HTML' }
  ).catch(() => {});
}

export async function handleAdminFinishQuiz(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});

  const quizSession: AdminQuizSessionData = (ctx.session as any)?.adminQuiz;
  const count = quizSession?.addedQuestionsCount || 0;
  const title = quizSession?.quizTitle || 'Test';

  (ctx.session as any).adminQuiz = undefined;

  const buttons = [[Markup.button.callback('🔙 Admin panelga qaytish', 'admin_home')]];

  return ctx.editMessageText(
    `🎉 <b>TEST MUVAFFAQIYATLI YARATILDI VA CHOP ETILDI!</b>\n\n` +
    `📌 <b>Test:</b> ${escapeHTML(title)}\n` +
    `📝 <b>Savollar soni:</b> ${count} ta\n\n` +
    `Ushbu test endi barcha foydalanuvchilarga "📝 Testlar" bo‘limida ko‘rinadi!`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminStartPollImportMenu(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  const categoryButtons = [
    [
      Markup.button.callback('📘 8-sinf Huquq Darslik', 'admin_set_import_cat_8-sinf Huquq'),
      Markup.button.callback('📗 9-sinf Huquq Darslik', 'admin_set_import_cat_9-sinf Huquq'),
    ],
    [
      Markup.button.callback('📙 10-sinf Huquq Darslik', 'admin_set_import_cat_10-sinf Huquq'),
      Markup.button.callback('📕 11-sinf Huquq Darslik', 'admin_set_import_cat_11-sinf Huquq'),
    ],
    [
      Markup.button.callback('🎯 DTM 2026 Imtihon Testlari', 'admin_set_import_cat_DTM Imtihon Testlari'),
      Markup.button.callback('📜 Milliy Sertifikat Testlari', 'admin_set_import_cat_Milliy Sertifikat Testlari'),
    ],
    [Markup.button.callback('❌ Bekor qilish', 'admin_home')],
  ];

  return ctx.editMessageText(
    `📥 <b>TELEGRAM QUIZBOT TEST IMPORT PANELI</b>\n\n` +
    `Qaysi darslik yoki kategoriya bo‘limi uchun testlarni yuklamoqchisiz?\n` +
    `Quyidagi bo‘limlardan birini tanlang:`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(categoryButtons) }
  ).catch(() => {});
}

export async function handleAdminSetImportCategory(ctx: MyContext, categoryName: string) {
  await ctx.answerCbQuery().catch(() => {});
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return;

  ctx.session = ctx.session || {};
  (ctx.session as any).adminQuizImportCategory = categoryName;

  const buttons = [[Markup.button.callback('❌ Import Rejimini Yopish', 'admin_stop_poll_import')]];

  return ctx.editMessageText(
    `✅ <b>QUIZBOT TEST IMPORT REJIMI FAOLLASHDI!</b>\n\n` +
    `📌 <b>Hozirgi Tanlangan Bo‘lim:</b> <code>${escapeHTML(categoryName)}</code>\n\n` +
    `💡 <b>KO'RSATMA:</b> Endi Telegram'dagi har qanday @QuizBot yoki Poll testlarini to‘g‘ridan-to‘g‘ri ushbu chatga <b>FORWARD (Uzatish)</b> qilishingiz mumkin!\n\n` +
    `Barcha yuborilgan testlar avtomatik ravishda <b>"${escapeHTML(categoryName)}"</b> bo‘limiga saqlanadi! 🚀`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  ).catch(() => {});
}

export async function handleAdminStopPollImport(ctx: MyContext) {
  await ctx.answerCbQuery().catch(() => {});
  if (ctx.session) {
    delete (ctx.session as any).adminQuizImportCategory;
  }
  return ctx.editMessageText('❌ Import rejimi yopildi. Asosiy admin paneliga qaytishingiz mumkin.', {
    reply_markup: { inline_keyboard: [[Markup.button.callback('🔙 Admin Panel', 'admin_home')]] }
  }).catch(() => {});
}

function extractUrlsFromMessage(ctx: MyContext): string[] {
  const urls: string[] = [];
  const msg = ctx.message;
  if (!msg) return urls;

  // 1. Check inline_keyboard buttons FIRST (QuizBot share posts put the start link in inline buttons!)
  if ((msg as any).reply_markup?.inline_keyboard) {
    for (const row of (msg as any).reply_markup.inline_keyboard) {
      for (const btn of row) {
        if (btn.url && !urls.includes(btn.url)) {
          urls.push(btn.url);
        }
      }
    }
  }

  // 2. Check entities (text_link & url)
  const text = 'text' in msg ? msg.text : ('caption' in msg ? msg.caption : '');
  const entities = 'entities' in msg ? msg.entities : ('caption_entities' in msg ? (msg as any).caption_entities : []);
  if (Array.isArray(entities)) {
    for (const ent of entities) {
      if (ent.type === 'text_link' && ent.url) {
        if (!urls.includes(ent.url)) urls.push(ent.url);
      } else if (ent.type === 'url' && text) {
        const u = text.substring(ent.offset, ent.offset + ent.length);
        if (u && !urls.includes(u)) urls.push(u);
      }
    }
  }

  // 3. Regex match text
  if (text) {
    const matches = text.match(/https?:\/\/[^\s\n<>()"]+/g);
    if (matches) {
      for (const m of matches) {
        if (!urls.includes(m)) urls.push(m);
      }
    }
  }

  // Prioritize URLs containing 'quizbot' or 'QuizBot' or 'start='
  urls.sort((a, b) => {
    const aIsQuizBot = /quizbot|\?start=/i.test(a);
    const bIsQuizBot = /quizbot|\?start=/i.test(b);
    if (aIsQuizBot && !bIsQuizBot) return -1;
    if (!aIsQuizBot && bIsQuizBot) return 1;
    return 0;
  });

  return urls;
}

function extractQuizTitle(text: string): string {
  if (!text) return 'Huquqiy Quiz Test';

  // 1. Check for text inside quotes “...” or "..." or '...' or «...»
  const quoteMatch = text.match(/["“'«]([^"”'»]+)["”'»]/);
  if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length > 2) {
    return quoteMatch[1].trim();
  }

  // 2. Look for lines starting with 🎲, ⚖️, 📌, 📝
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^[🎲⚖️📌📝]\s*(.+)/.test(line)) {
      let clean = line.replace(/^[🎲⚖️📌📝]\s*/, '').replace(/via @\w+/i, '').replace(/testi$/i, '').trim();
      if (clean.startsWith('"') || clean.startsWith('“')) {
        clean = clean.replace(/^["“']|["”']$/g, '').trim();
      }
      if (clean.length > 2 && !clean.toLowerCase().startsWith('http')) {
        return clean;
      }
    }
  }

  // 3. Fallback to first non-URL line
  for (const line of lines) {
    if (!line.toLowerCase().startsWith('http') && !line.includes('via @') && !/savol/i.test(line)) {
      let clean = line.replace(/^["“']|["”']$/g, '').trim();
      if (clean.length > 2) return clean.slice(0, 60);
    }
  }

  return 'Huquqiy Quiz Test';
}

function getCategoryDefaultQuizTitle(categoryName: string): string {
  if (categoryName.includes('8-sinf')) return '📘 8-sinf Huquq Darslik Testlari';
  if (categoryName.includes('9-sinf')) return '📗 9-sinf Huquq Darslik Testlari';
  if (categoryName.includes('10-sinf')) return '📙 10-sinf Huquq Darslik Testlari';
  if (categoryName.includes('11-sinf')) return '📕 11-sinf Huquq Darslik Testlari';
  if (categoryName.includes('DTM')) return '🎯 DTM 2026 Rasmiy Imtihon Simulatsiyasi (30 ta savol)';
  if (categoryName.includes('Milliy')) return '📜 Milliy Sertifikat Huquqshunoslik Testlari';
  return `${categoryName} Darslik Testlari`;
}

export async function handleAdminPollImport(ctx: MyContext): Promise<boolean> {
  if (!ctx.from || !(await AdminService.isAdmin(ctx.from.id))) return false;

  const categoryName = (ctx.session as any)?.adminQuizImportCategory;
  if (!categoryName) return false;

  const poll = ctx.message && 'poll' in ctx.message ? ctx.message.poll : null;
  const msgText = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : (ctx.message && 'caption' in ctx.message ? (ctx.message as any).caption.trim() : '');
  const urls = extractUrlsFromMessage(ctx);

  // Detect QuizBot Share Post format or Link Post
  const isQuizBotPost =
    urls.length > 0 ||
    /via @quizbot|@quizbot|t\.me\/|testi|savol|soniya/i.test(msgText) ||
    (ctx.message && 'forward_from' in ctx.message && (ctx.message as any).forward_from?.username?.toLowerCase() === 'quizbot');

  if (poll) {
    const question = poll.question;
    const options = poll.options.map((o: any) => o.text);
    const optionA = options[0] || 'A';
    const optionB = options[1] || 'B';
    const optionC = options[2] || 'C';
    const optionD = options[3] || 'D';

    const correctIndex = poll.correct_option_id !== undefined ? poll.correct_option_id : 0;
    const letterMap = ['A', 'B', 'C', 'D'];
    const correctAnswer = letterMap[correctIndex] || 'A';
    const explanation = poll.explanation || null;

    try {
      const quizTitle = getCategoryDefaultQuizTitle(categoryName);
      let quiz = await prisma.quiz.findFirst({ where: { title: quizTitle } });

      if (!quiz) {
        quiz = await prisma.quiz.create({
          data: {
            title: quizTitle,
            category: categoryName,
            description: `Admin tomonidan yuklangan ${categoryName} bo'yicha poll test to'plami.`,
          },
        });
      }

      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          explanation: explanation || null,
        },
      });

      const totalCount = await prisma.quizQuestion.count({ where: { quizId: quiz.id } });
      const buttons = [[Markup.button.callback('❌ Import Rejimini Yopish', 'admin_stop_poll_import')]];

      await ctx.reply(
        `✅ <b>POLL SAVOL BAZAGA SAQLANDI! (#${totalCount})</b>\n\n` +
        `📌 <b>Test:</b> ${escapeHTML(quizTitle)}\n` +
        `📂 <b>Bo‘lim:</b> <code>${escapeHTML(categoryName)}</code>\n` +
        `❓ <b>Savol:</b> ${escapeHTML(question.slice(0, 300))}\n` +
        `🅰️ ${escapeHTML(optionA)}\n` +
        `🅱️ ${escapeHTML(optionB)}\n` +
        `🅲️ ${escapeHTML(optionC)}\n` +
        `🅳️ ${escapeHTML(optionD)}\n\n` +
        `🎯 <b>To‘g‘ri javob:</b> <b>${correctAnswer}</b>\n\n` +
        `💡 <i>Keyingi QuizBot yoki Poll testini bemalol FORWARD qilishingiz mumkin!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      );
      return true;
    } catch (error) {
      console.error('Error saving imported poll:', error);
      await ctx.reply('⚠️ Poll savolini saqlashda xatolik yuz berdi.');
      return true;
    }
  } else if (isQuizBotPost && urls.length > 0) {
    // Process QuizBot Link import
    try {
      const quizTitle = extractQuizTitle(msgText);
      const quizLink = urls[0];
      const savolMatch = msgText.match(/(\d+)\s*ta\s*savol|(\d+)\s*savol/i);
      const countText = savolMatch ? `${savolMatch[1] || savolMatch[2]} ta savol` : 'Interaktiv test';

      let quiz = await prisma.quiz.findFirst({
        where: { title: quizTitle },
      });

      if (!quiz) {
        quiz = await prisma.quiz.create({
          data: {
            title: quizTitle,
            category: categoryName,
            description: `🔗 Telegram QuizBot Testi: ${quizLink} (${countText})`,
          },
        });
      } else {
        await prisma.quiz.update({
          where: { id: quiz.id },
          data: {
            category: categoryName,
            description: `🔗 Telegram QuizBot Testi: ${quizLink} (${countText})`,
          },
        });
      }

      const buttons = [[Markup.button.callback('❌ Import Rejimini Yopish', 'admin_stop_poll_import')]];

      await ctx.reply(
        `✅ <b>QUIZBOT TESTI BAZAGA SAQLANDI!</b>\n\n` +
        `📌 <b>Test Nomi:</b> <b>"${escapeHTML(quizTitle)}"</b>\n` +
        `📂 <b>Bo‘lim:</b> <code>${escapeHTML(categoryName)}</code>\n` +
        `📊 <b>Hajmi:</b> ${escapeHTML(countText)}\n` +
        `🔗 <b>Havola:</b> ${escapeHTML(quizLink)}\n\n` +
        `💡 <i>Ushbu test "📝 Testlar" -> "🎯 Interaktiv Onlayn Testlar" bo‘limida muvaffaqiyatli paydo bo‘ldi!\n` +
        `Keyingi QuizBot testini bemalol FORWARD (Uzatish) qilishingiz mumkin!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      );
      return true;
    } catch (error) {
      console.error('Error saving QuizBot test link:', error);
      await ctx.reply('⚠️ QuizBot testini saqlashda xatolik yuz berdi.');
      return true;
    }
  } else if (msgText) {
    // Check if text has options A), B), C), D)
    const lines = msgText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    let foundA = lines.find((l: string) => /^a[).]/i.test(l));
    let foundB = lines.find((l: string) => /^b[).]/i.test(l));
    let foundC = lines.find((l: string) => /^c[).]/i.test(l));
    let foundD = lines.find((l: string) => /^d[).]/i.test(l));

    let optionA = 'A';
    let optionB = 'B';
    let optionC = 'C';
    let optionD = 'D';
    let correctAnswer = 'A';

    if (foundA) optionA = foundA.replace(/^a[).]\s*/i, '');
    if (foundB) optionB = foundB.replace(/^b[).]\s*/i, '');
    if (foundC) optionC = foundC.replace(/^c[).]\s*/i, '');
    if (foundD) optionD = foundD.replace(/^d[).]\s*/i, '');

    const ansMatch = msgText.match(/(?:to'g'ri\s*javob|javob|kalit|ans|key)\s*[:=-]?\s*([a-d])/i);
    if (ansMatch && ansMatch[1]) {
      correctAnswer = ansMatch[1].toUpperCase();
    }

    const questionLines = lines.filter((l: string) => !/^[a-d][).]/i.test(l) && !/(?:to'g'ri\s*javob|javob|kalit)\s*[:=-]/i.test(l));
    const question = questionLines.join(' ') || msgText;

    try {
      const quizTitle = getCategoryDefaultQuizTitle(categoryName);
      let quiz = await prisma.quiz.findFirst({ where: { title: quizTitle } });

      if (!quiz) {
        quiz = await prisma.quiz.create({
          data: {
            title: quizTitle,
            category: categoryName,
            description: `Admin tomonidan yuklangan ${categoryName} bo'yicha test to'plami.`,
          },
        });
      }

      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          explanation: null,
        },
      });

      const totalCount = await prisma.quizQuestion.count({ where: { quizId: quiz.id } });
      const buttons = [[Markup.button.callback('❌ Import Rejimini Yopish', 'admin_stop_poll_import')]];

      await ctx.reply(
        `✅ <b>SAVOL BAZAGA SAQLANDI! (#${totalCount})</b>\n\n` +
        `📌 <b>Test:</b> ${escapeHTML(quizTitle)}\n` +
        `📂 <b>Bo‘lim:</b> <code>${escapeHTML(categoryName)}</code>\n` +
        `❓ <b>Savol:</b> ${escapeHTML(question.slice(0, 300))}\n` +
        `🅰️ ${escapeHTML(optionA)}\n` +
        `🅱️ ${escapeHTML(optionB)}\n` +
        `🅲️ ${escapeHTML(optionC)}\n` +
        `🅳️ ${escapeHTML(optionD)}\n\n` +
        `🎯 <b>To‘g‘ri javob:</b> <b>${correctAnswer}</b>\n\n` +
        `💡 <i>Keyingi testni (Poll yoki Matn) bemalol FORWARD qilishingiz mumkin!</i>`,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      );
      return true;
    } catch (error) {
      console.error('Error saving text quiz:', error);
      await ctx.reply('⚠️ Test savolini saqlashda xatolik yuz berdi.');
      return true;
    }
  } else {
    await ctx.reply('⚠️ Noma’lum xabar formati. Iltimos, Telegram QuizBot testini yoki Poll savolini FORWARD yuboring.');
    return true;
  }
}

