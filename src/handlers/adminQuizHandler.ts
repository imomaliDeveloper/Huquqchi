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

  if (!ctx.message || !('text' in ctx.message)) {
    return next();
  }

  const text = ctx.message.text.trim();
  const step = quizSession.step;

  // STEP 1: Quiz Title
  if (step === 'AWAITING_QUIZ_TITLE') {
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
  if (step === 'AWAITING_QUESTION_TEXT') {
    if (text.length < 3) {
      return ctx.reply('⚠️ Savol matni o‘ta qisqa. Qayta kiriting:');
    }

    quizSession.currentQuestion = quizSession.currentQuestion || {};
    quizSession.currentQuestion.text = text;
    quizSession.step = 'AWAITING_OPTION_A';

    return ctx.reply(`❓ Savol: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>A variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 4: Option A
  if (step === 'AWAITING_OPTION_A') {
    quizSession.currentQuestion!.optionA = text;
    quizSession.step = 'AWAITING_OPTION_B';
    return ctx.reply(`🅰️ A variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>B variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 5: Option B
  if (step === 'AWAITING_OPTION_B') {
    quizSession.currentQuestion!.optionB = text;
    quizSession.step = 'AWAITING_OPTION_C';
    return ctx.reply(`🅱️ B variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>C variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 6: Option C
  if (step === 'AWAITING_OPTION_C') {
    quizSession.currentQuestion!.optionC = text;
    quizSession.step = 'AWAITING_OPTION_D';
    return ctx.reply(`🅲️ C variant: <b>"${escapeHTML(text)}"</b>\n\nEndi <b>D variant</b> javobini kiriting:`, {
      parse_mode: 'HTML',
    });
  }

  // STEP 7: Option D
  if (step === 'AWAITING_OPTION_D') {
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
  if (step === 'AWAITING_EXPLANATION') {
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
