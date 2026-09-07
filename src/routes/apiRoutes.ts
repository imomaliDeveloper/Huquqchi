import { Router, Request, Response } from 'express';
import prisma from '../database/prisma';
import { AiService } from '../services/aiService';
import { DocGeneratorService } from '../services/docGeneratorService';
import { TtsService } from '../services/ttsService';
import { FULL_CONSTITUTION_DATA } from '../data/constitutionData';

import bot from '../bot';

const router = Router();

// Telegram Webhook Handler for Vercel Serverless
router.post('/webhook', (req: Request, res: Response) => {
  return bot.handleUpdate(req.body, res);
});

// Telegram Set Webhook Endpoint
router.get('/set-webhook', async (req: Request, res: Response) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const webhookUrl = `${protocol}://${host}/api/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    res.json({ ok: true, message: 'Telegram Webhook muvaffaqiyatli o‘rnatildi!', webhookUrl });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Webhook o‘rnatishda xatolik' });
  }
});

// Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'Huquqchi Web API' });
});

// Get User Profile Info
router.get('/user', async (req: Request, res: Response) => {
  try {
    const telegramId = req.query.telegramId ? String(req.query.telegramId) : null;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId metric missing' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        _count: {
          select: {
            quizResults: true,
            aiConversations: true,
            certResults: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate today's AI question count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.userActivity.count({
      where: {
        userId: user.id,
        action: 'AI_QUESTION',
        createdAt: { gte: todayStart },
      },
    });

    res.json({
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role || 'FUQARO',
      isPro: user.isPro,
      referralCount: user.referralCount,
      usage: {
        todayAiCount: todayCount,
        dailyLimit: 2,
        remainingFree: user.isPro ? 'UNLIMITED' : Math.max(0, 2 - todayCount),
      },
      stats: {
        quizzesTaken: user._count.quizResults,
        aiQueries: user._count.aiConversations,
        certsPassed: user._count.certResults,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// System General Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalArticles, totalQuizzes, proUsers] = await Promise.all([
      prisma.user.count(),
      prisma.legalArticle.count(),
      prisma.quiz.count(),
      prisma.user.count({ where: { isPro: true } }),
    ]);

    res.json({
      totalUsers,
      totalArticles,
      totalQuizzes,
      proUsers,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register or Update User Profile (Mini App Login / Registration)
router.post('/user/register', async (req: Request, res: Response) => {
  try {
    const { telegramId, firstName, lastName, username, role, phone } = req.body;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId metric missing' });
    }

    const tId = BigInt(telegramId);
    const existingUser = await prisma.user.findUnique({ where: { telegramId: tId } });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { telegramId: tId },
        data: {
          firstName: firstName || existingUser.firstName,
          lastName: lastName !== undefined ? lastName : existingUser.lastName,
          username: username !== undefined ? username : existingUser.username,
          role: role || existingUser.role || 'FUQARO',
          phone: phone !== undefined ? phone : existingUser.phone,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          telegramId: tId,
          firstName: firstName || 'Foydalanuvchi',
          lastName: lastName || null,
          username: username || null,
          role: role || 'FUQARO',
          phone: phone || null,
        },
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        phone: user.phone,
        isPro: user.isPro,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

export const NATIONAL_CERTIFICATE_LAWS = [
  // --- KONSTITUTSIYAVIY HUQUQ ---
  { id: 1, name: "O'zbekiston Respublikasi Konstitutsiyasi", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/6445145" },
  { id: 2, name: "\"O'zbekiston Respublikasining Davlat bayrog'i to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/108529" },
  { id: 3, name: "\"O'zbekiston Respublikasining Davlat gerbi to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/108534" },
  { id: 4, name: "\"O'zbekiston Respublikasining Davlat madhiyasi to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/108538" },
  { id: 5, name: "O'zbekiston Respublikasining Saylov kodeksi", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/4386848" },
  { id: 6, name: "\"O'zbekiston Respublikasining referendumi to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/73913" },
  { id: 7, name: "\"O'zbekiston Respublikasining Konstitutsiyaviy sudi to'g'risida\"gi Konstitutsiyaviy qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/5392683" },
  { id: 8, name: "\"O'zbekiston Respublikasi Vazirlar Mahkamasi to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/4638308" },
  { id: 9, name: "\"Sudlar to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/5529457" },
  { id: 10, name: "\"Vijdon erkinligi va diniy tashkilotlar to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/5502095" },
  { id: 11, name: "\"Siyosiy partiyalar to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/73919" },
  { id: 12, name: "\"O'zbekiston Respublikasining Davlat tili haqida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/97597" },
  { id: 13, name: "\"O'zbekiston Respublikasi Oliy Majlisining Qonunchilik palatasi to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/97647" },
  { id: 14, name: "\"O'zbekiston Respublikasi Oliy Majlisining Senati to'g'risida\"gi qonun", category: "Konstitutsiyaviy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/97652" },

  // --- FUQAROLIK HUQUQI ---
  { id: 15, name: "O'zbekiston Respublikasining Fuqarolik kodeksi (1-qism)", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/111189" },
  { id: 16, name: "O'zbekiston Respublikasining Fuqarolik kodeksi (2-qism)", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/180552" },
  { id: 17, name: "O'zbekiston Respublikasining Fuqarolik protsessual kodeksi", category: "Fuqarolik Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/3517337" },
  { id: 18, name: "\"Iste'molchilarning huquqlarini himoya qilish to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/108560" },
  { id: 19, name: "\"Mualliflik huquqi va turdosh huquqlar to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/1023492" },
  { id: 20, name: "\"Notariat to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/108502" },
  { id: 21, name: "\"Advokatura to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/108518" },
  { id: 22, name: "\"Garov to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/108556" },
  { id: 23, name: "\"Ipoteka to'g'risida\"gi qonun", category: "Fuqarolik Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/1070505" },

  // --- MA'MURIY HUQUQ ---
  { id: 24, name: "O'zbekiston Respublikasining Ma'muriy javobgarlik to'g'risidagi kodeksi (MJtK)", category: "Ma'muriy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/97664" },
  { id: 25, name: "\"O'zbekiston Respublikasi Ma'muriy tartib-taomillar to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/3494793" },
  { id: 26, name: "O'zbekiston Respublikasining Ma'muriy sud ishlarini yuritish to'g'risidagi kodeksi", category: "Ma'muriy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/3516886" },
  { id: 27, name: "\"Jismoniy va yuridik shaxslarning murojaatlari to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/3336169" },
  { id: 28, name: "\"Davlat fuqarolik xizmati to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: false, lexUrl: "https://lex.uz/docs/6147097" },
  { id: 29, name: "\"Huquqbuzarliklar profilaktikasi to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: false, lexUrl: "https://lex.uz/docs/2387357" },
  { id: 30, name: "\"Korrupsiyaga qarshi kurashish to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: false, lexUrl: "https://lex.uz/docs/3088008" },
  { id: 31, name: "\"Normativ-huquqiy hujjatlar to'g'risida\"gi qonun", category: "Ma'muriy Huquq", isCert: true, lexUrl: "https://lex.uz/docs/5382979" },

  // --- MEHNAT HUQUQI ---
  { id: 32, name: "O'zbekiston Respublikasining Mehnat kodeksi (Yangi tahrir)", category: "Mehnat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/6257288" },
  { id: 33, name: "\"Aholini ish bilan ta'minlash to'g'risida\"gi qonun", category: "Mehnat Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/5055690" },
  { id: 34, name: "\"Mehnatni muhofaza qilish to'g'risida\"gi qonun", category: "Mehnat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/3027878" },
  { id: 35, name: "\"Kasaba uyushmalari to'g'risida\"gi qonun", category: "Mehnat Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/4638202" },
  { id: 36, name: "\"18 yoshgacha bo'lgan xodimlar uchun og'ir yuk me'yorlari to'g'risida\"gi Nizom", category: "Mehnat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/1483321" },

  // --- OILA HUQUQI ---
  { id: 37, name: "O'zbekiston Respublikasining Oila kodeksi", category: "Oila Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/104720" },
  { id: 38, name: "\"Bola huquqlarining kafolatlari to'g'risida\"gi qonun", category: "Oila Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/1297315" },
  { id: 39, name: "\"Xotin-qizlar va erkaklar uchun teng huquq hamda imkoniyatlar kafolatlari to'g'risida\"gi qonun", category: "Oila Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/4494709" },
  { id: 40, name: "\"Xotin-qizlarni tazyiq va zo'ravonlikdan himoya qilish to'g'risida\"gi qonun", category: "Oila Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/4494726" },

  // --- JINOYAT HUQUQI ---
  { id: 41, name: "O'zbekiston Respublikasining Jinoyat kodeksi", category: "Jinoyat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/111453" },
  { id: 42, name: "O'zbekiston Respublikasining Jinoyat-protsessual kodeksi", category: "Jinoyat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/111460" },
  { id: 43, name: "O'zbekiston Respublikasining Jinoyat-ijroiya kodeksi", category: "Jinoyat Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/168847" },
  { id: 44, name: "\"Prokuratura to'g'risida\"gi qonun", category: "Jinoyat Huquqi", isCert: true, lexUrl: "https://lex.uz/docs/108507" },
  { id: 45, name: "\"Tezkor-qidiruv faoliyati to'g'risida\"gi qonun", category: "Jinoyat Huquqi", isCert: false, lexUrl: "https://lex.uz/docs/2104169" },

  // --- SOLIQ & MOLIYA HUQUQI ---
  { id: 46, name: "O'zbekiston Respublikasining Soliq kodeksi", category: "Soliq & Moliya", isCert: true, lexUrl: "https://lex.uz/docs/4674902" },
  { id: 47, name: "O'zbekiston Respublikasining Budjet kodeksi", category: "Soliq & Moliya", isCert: true, lexUrl: "https://lex.uz/docs/2304138" },
  { id: 48, name: "O'zbekiston Respublikasining Bojxona kodeksi", category: "Soliq & Moliya", isCert: false, lexUrl: "https://lex.uz/docs/2876354" },
  { id: 49, name: "\"Davlat xaridlari to'g'risida\"gi qonun", category: "Soliq & Moliya", isCert: false, lexUrl: "https://lex.uz/docs/5382998" },
  { id: 50, name: "\"Banklar va bank faoliyati to'g'risida\"gi qonun", category: "Soliq & Moliya", isCert: false, lexUrl: "https://lex.uz/docs/4581456" },

  // --- EKOLOGIYA & YER HUQUQI ---
  { id: 51, name: "O'zbekiston Respublikasining Yer kodeksi", category: "Ekologiya & Yer", isCert: false, lexUrl: "https://lex.uz/docs/149947" },
  { id: 52, name: "\"Tabiatni muhofaza qilish to'g'risida\"gi qonun", category: "Ekologiya & Yer", isCert: true, lexUrl: "https://lex.uz/docs/108552" },
  { id: 53, name: "\"Suv va suvdan foydalanish to'g'risida\"gi qonun", category: "Ekologiya & Yer", isCert: false, lexUrl: "https://lex.uz/docs/108548" },
  { id: 54, name: "\"O'rmon to'g'risida\"gi qonun", category: "Ekologiya & Yer", isCert: false, lexUrl: "https://lex.uz/docs/3680983" }
];

// Get Laws by Search Query or Category Filter
router.get('/laws', (req: Request, res: Response) => {
  const query = req.query.q ? String(req.query.q).toLowerCase().trim() : '';
  const category = req.query.category ? String(req.query.category).trim() : '';

  let filtered = NATIONAL_CERTIFICATE_LAWS;

  if (category && category !== 'all') {
    if (category === 'sertifikat') {
      filtered = filtered.filter(l => (l as any).isCert);
    } else {
      filtered = filtered.filter(l => l.category.toLowerCase().includes(category.toLowerCase()));
    }
  }

  if (query) {
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(query) || l.category.toLowerCase().includes(query)
    );
  }

  res.json(filtered);
});
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        articles: {
          take: 10,
          select: {
            id: true,
            title: true,
            source: true,
            isPdfBook: true,
          },
        },
      },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Constitution Articles
router.get('/constitution', async (req: Request, res: Response) => {
  try {
    const search = req.query.q ? String(req.query.q).toLowerCase().trim() : '';
    let articles: any[] = [];

    try {
      articles = await prisma.constitutionArticle.findMany({
        orderBy: { articleNumber: 'asc' },
        take: 156,
      });
    } catch (e) {
      console.warn('⚠️ Constitution DB query failed, using in-memory fallback');
    }

    if (!articles || articles.length === 0) {
      articles = FULL_CONSTITUTION_DATA.map((art) => ({
        id: art.articleNumber + 1,
        articleNumber: art.articleNumber,
        title: art.title,
        chapter: art.chapter,
        part: art.part,
        text: art.text,
        audioFileId: null,
        audioDuration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    const filtered = search
      ? articles.filter(
          (a) =>
            a.title.toLowerCase().includes(search) ||
            a.text.toLowerCase().includes(search) ||
            (a.chapter && a.chapter.toLowerCase().includes(search))
        )
      : articles;

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Constitution query error' });
  }
});

// Stream Constitution Article Uzbek Speech Audio (TTS)
router.get('/constitution/audio', async (req: Request, res: Response) => {
  try {
    const articleId = req.query.articleId ? Number(req.query.articleId) : null;
    const articleNumber = req.query.articleNumber !== undefined ? Number(req.query.articleNumber) : null;

    let textToSpeak = 'O‘zbekiston Respublikasi Konstitutsiyasi';

    if (articleId || articleNumber !== null) {
      const art = await prisma.constitutionArticle.findFirst({
        where: {
          OR: [
            ...(articleId ? [{ id: articleId }] : []),
            ...(articleNumber !== null ? [{ articleNumber }] : []),
          ],
        },
      });

      if (art) {
        textToSpeak = `${art.title}. ${art.text}`;
      }
    } else if (req.query.text) {
      textToSpeak = String(req.query.text);
    }

    const audioBuffer = await TtsService.generateUzbekSpeechBuffer(textToSpeak);

    if (!audioBuffer) {
      const encoded = encodeURIComponent(textToSpeak.slice(0, 150));
      return res.redirect(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=uz&client=tw-ob`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Audio generate error' });
  }
});

// Get Available Quizzes
router.get('/quizzes', async (req: Request, res: Response) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: true,
      },
    });
    res.json(quizzes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ask Legal AI Assistant
router.post('/ai/ask', async (req: Request, res: Response) => {
  try {
    const { telegramId, question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Savol matni kiritilmagan' });
    }

    let userId = 1; // Default fallback ID if not logged in
    if (telegramId) {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });
      if (user) userId = user.id;
    }

    const aiAnswer = await AiService.askLegalQuestion(userId, question.trim());
    res.json({ answer: aiAnswer });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI xatoligi yuz berdi' });
  }
});

// AI Contract Risk Audit (Shartnoma Ekspertizasi)
router.post('/ai/risk-check', async (req: Request, res: Response) => {
  try {
    const { contractText } = req.body;
    if (!contractText || contractText.trim().length < 10) {
      return res.status(400).json({ error: 'Shartnoma matni kamida 10 ta belgidan iborat bo\'lishi kerak' });
    }

    const prompt = `Siz O‘zbekiston yuridik ekspertisiz. Quyidagi shartnoma matnini sinchiklab tahlil qiling va 3 ta narsani ajratib bering:
1. Xavflilik darajasi (Risk percentage 0% - 100%)
2. ⚠️ Diqqat talab qiluvchi va noqulay bandlar (Jarimalar, birtaraflama bekor qilish, majburiyatlar)
3. 💡 Tavsiyalar va xulosalar

Shartnoma matni:
"""
${contractText}
"""`;

    const aiResult = await AiService.askLegalQuestion(1, prompt);
    res.json({ result: aiResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Ekspertiza xatoligi' });
  }
});

// Submit Quiz Results
router.post('/quiz/submit', async (req: Request, res: Response) => {
  try {
    const { telegramId, quizId, score, totalQuestions, durationSeconds } = req.body;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    let gradeLevel = 'C';
    if (percentage >= 90) gradeLevel = 'A+';
    else if (percentage >= 80) gradeLevel = 'A';
    else if (percentage >= 70) gradeLevel = 'B+';
    else if (percentage >= 60) gradeLevel = 'B';

    if (telegramId) {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });
      if (user) {
        await prisma.certResult.create({
          data: {
            userId: user.id,
            score,
            totalQuestions,
            percentage,
            gradeLevel,
            durationSeconds: durationSeconds || 60,
          },
        });
      }
    }

    res.json({
      percentage: Math.round(percentage),
      gradeLevel,
      score,
      totalQuestions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Natijani saqlashda xatolik' });
  }
});

// Get Quiz Questions (From DB or Fallback)
router.get('/quiz/questions', async (req: Request, res: Response) => {
  try {
    const questions = await prisma.quizQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (questions.length === 0) {
      return res.json([]);
    }

    const formatted = questions.map((q) => ({
      id: q.id,
      question: q.question,
      imageUrl: q.imageUrl || null,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correct: q.correctAnswer === 'A' ? 0 : q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : 3,
      explanation: q.explanation || 'Rasmiy O‘zR Qonunchiligi asosida.',
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Savollarni olishda xatolik' });
  }
});

// Add New Quiz Question (Admin / API)
router.post('/quiz/question/add', async (req: Request, res: Response) => {
  try {
    const { question, imageUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation, quizId } = req.body;

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({ error: 'Savol va barcha 4 ta variantlar kiritilishi shart' });
    }

    // Default or create main quiz if quizId not provided
    let targetQuizId = quizId;
    if (!targetQuizId) {
      let mainQuiz = await prisma.quiz.findFirst();
      if (!mainQuiz) {
        mainQuiz = await prisma.quiz.create({
          data: {
            title: 'Milliy Sertifikat & DTM Imtihon Testlari',
            category: 'Konstitutsiyaviy Huquq',
            description: 'Rasmiy DTM va Sertifikat tayyorgarlik testlari',
          },
        });
      }
      targetQuizId = mainQuiz.id;
    }

    const newQuestion = await prisma.quizQuestion.create({
      data: {
        quizId: targetQuizId,
        question,
        imageUrl: imageUrl || null,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswer.toUpperCase(),
        explanation: explanation || null,
      },
    });

    res.json({
      success: true,
      message: '✅ Yangi test savoli muvaffaqiyatli qo‘shildi!',
      question: newQuestion,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Savol qo‘shishda xatolik' });
  }
});

// Get User's Past AI Chat History
router.get('/ai/history', async (req: Request, res: Response) => {
  try {
    const telegramId = req.query.telegramId ? String(req.query.telegramId) : null;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId metric missing' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.json([]);
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF Document (With 2 Free PDF/day limit for non-PRO users)
router.post('/doc/generate', async (req: Request, res: Response) => {
  try {
    const { type, partyA, partyB, details, telegramId } = req.body;

    if (!type || !partyA?.name || !partyB?.name) {
      return res.status(400).json({ error: 'Hujjat ma\'lumotlari to\'liq emas' });
    }

    if (telegramId) {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });

      if (user && !user.isPro) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayPdfCount = await prisma.userActivity.count({
          where: {
            userId: user.id,
            action: 'DOC_GENERATE',
            createdAt: { gte: todayStart },
          },
        });

        if (todayPdfCount >= 2) {
          return res.status(403).json({
            error: 'Kunlik bepul 2 ta PDF hujjat generatsiya qilish kvotangiz tugadi! Cheksiz yaratish uchun VIP PRO obunasiga o‘ting.',
          });
        }

        // Log user activity for doc generate
        await prisma.userActivity.create({
          data: {
            userId: user.id,
            action: 'DOC_GENERATE',
            metadata: JSON.stringify({ type }),
          },
        });
      }
    }

    const pdfBuffer = await DocGeneratorService.generateDocumentPdf({
      type,
      partyA,
      partyB,
      details: details || {},
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Huquqchi_${type}_${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Hujjat generatsiya qilishda xatolik' });
  }
});

export default router;
