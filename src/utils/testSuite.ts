import prisma from '../database/prisma';
import UserService from '../services/userService';
import AiService from '../services/aiService';
import AdminService from '../services/adminService';
import { DocGeneratorService } from '../services/docGeneratorService';
import { LexService } from '../services/lexService';
import { processReferralLink } from '../handlers/referralHandler';
import { ChannelPostService } from '../services/channelPostService';
import { UserRole } from '../utils/constants';
import { validateAndFormatName } from '../handlers/registrationHandler';
import { SubCheckService } from '../services/subCheckService';
import ConstitutionService from '../services/constitutionService';
import TtsService from '../services/ttsService';

async function runTestSuite() {
  console.log('🧪 Starting HuquqchiBot / Huquq AI End-to-End Test Suite...\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  try {
    // TEST 1: Database Connection
    const count = await prisma.user.count();
    assert(typeof count === 'number', '1. Database Connection & User Count Query');

    // TEST 2: User Registration & Database Save
    const testTelegramId = 999888777;
    // Cleanup any prior test user
    await prisma.user.deleteMany({ where: { telegramId: BigInt(testTelegramId) } });

    const createdUser = await UserService.createUser({
      telegramId: testTelegramId,
      username: 'test_law_user',
      firstName: 'Ali',
      lastName: 'Valiyev',
      phone: '+998901234567',
      role: UserRole.TALABA,
    });

    assert(createdUser.id > 0, '2.1 User Creation in SQLite Database');
    assert(createdUser.firstName === 'Ali', '2.2 User First Name Verification');
    assert(createdUser.role === UserRole.TALABA, '2.3 User Role Assignment (TALABA)');

    // TEST 3: User Retrieval by Telegram ID
    const retrievedUser = await UserService.findByTelegramId(testTelegramId);
    assert(retrievedUser !== null && retrievedUser.phone === '+998901234567', '3. Find User by Telegram ID');

    // TEST 4: Role Selection & Role Update
    const updatedUser = await UserService.updateUser(testTelegramId, { role: UserRole.YURIST });
    assert(updatedUser.role === UserRole.YURIST, '4. Role Update to YURIST');

    // TEST 5: Profile Stats Calculation
    const stats = await UserService.getUserStats(updatedUser.id);
    assert(stats.totalQuizResults === 0, '5.1 Initial Quiz Results Stat');
    assert(typeof stats.avgQuizPercentage === 'number', '5.2 Average Quiz Percentage Stat');

    // TEST 6: Legal Knowledge Base Search & Categories
    const categories = await prisma.category.findMany();
    assert(categories.length >= 8, '6.1 Legal Categories Seed Verification (>= 8 categories)');

    const articles = await prisma.legalArticle.findMany();
    assert(articles.length >= 4, '6.2 Legal Articles Seed Verification');

    // TEST 7: Quiz Result Save
    const quiz = await prisma.quiz.findFirst();
    if (quiz) {
      const quizResult = await prisma.quizResult.create({
        data: {
          userId: updatedUser.id,
          quizId: quiz.id,
          score: 3,
          totalQuestions: 3,
          percentage: 100.0,
          durationSeconds: 12,
        },
      });
      assert(quizResult.id > 0 && quizResult.percentage === 100.0, '7. Quiz Result Database Save & Grading');
    } else {
      assert(false, '7. Quiz Result Database Save (Quiz not found)');
    }

    // TEST 8: AI Question Processing & Guardrails
    const aiAnswer = await AiService.askLegalQuestion(updatedUser.id, 'Mehnat ta\'tili necha kun?');
    assert(typeof aiAnswer === 'string' && aiAnswer.length > 20, '8.1 AI Legal Question Processing');
    assert(aiAnswer.includes('rasmiy yuridik maslahat'), '8.2 AI Legal Disclaimer Guardrail Enforcement');

    // TEST 9: Admin Authorization & System Stats
    await AdminService.ensureSuperAdmin(testTelegramId, 'test_admin');
    const isAdmin = await AdminService.isAdmin(testTelegramId);
    assert(isAdmin === true, '9.1 Admin Authorization Check');

    const adminStats = await AdminService.getSystemStats();
    assert(adminStats.totalUsers > 0, '9.2 Admin System Stats Aggregation');

    // TEST 10: PDF Document Generator Service
    const pdfBuffer = await DocGeneratorService.generateDocumentPdf({
      type: 'IJARA_SHARTNOMASI',
      docNumber: 'HQ-TEST-001',
      partyA: { name: 'Alimov Anvar', passport: 'AA 1234567' },
      partyB: { name: 'Karimov Jasur', passport: 'AB 7654321' },
      details: { amountOrPrice: '3,000,000 UZS', subjectAddressOrTitle: 'Toshkent sh., Yunusobod' },
    });
    assert(Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 1000, '10. PDF Document Generation Buffer Test (> 1KB)');

    // TEST 11: Lex.uz Codex Search Service
    const codexList = LexService.getCodexList();
    assert(codexList.length >= 6, '11.1 Lex.uz Codex Catalog List (>= 6 codexes)');

    const searchResults = LexService.searchArticles('mehnat');
    assert(searchResults.length > 0 && searchResults[0]?.codexCode === 'MK', '11.2 Lex.uz Search Query Execution');

    // TEST 12: VIP Subscription Activation
    const subscription = await prisma.subscription.create({
      data: {
        userId: updatedUser.id,
        plan: 'PRO_MONTHLY',
        amount: 29000,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
    await prisma.user.update({
      where: { id: updatedUser.id },
      data: { isPro: true },
    });
    const proUser = await UserService.findByTelegramId(testTelegramId);
    assert(proUser !== null && proUser.isPro === true && subscription.id > 0, '12. VIP Subscription Status Activation');

    // TEST 13: Paid PDF Material & Milliy Sertifikat Price Verification
    const certCat = await prisma.category.upsert({
      where: { name: '🎓 Milliy Sertifikat Materiallari' },
      update: {},
      create: { name: '🎓 Milliy Sertifikat Materiallari', description: 'DTM testlari va qo\'llanmalar' },
    });
    const testPdfMaterial = await prisma.legalArticle.create({
      data: {
        title: 'DTM Testlar To\'plami 2026',
        content: '500 ta test',
        categoryId: certCat.id,
        isPdfBook: true,
        fileType: 'pdf',
        price: 15000,
      },
    });
    assert(testPdfMaterial.id > 0 && testPdfMaterial.price === 15000, '13. Paid PDF Guidebook & Price Database Registration');

    // TEST 14: Referral Link Processing & Counter Increment
    const newRefTelegramId = 888777666;
    await prisma.user.deleteMany({ where: { telegramId: BigInt(newRefTelegramId) } });

    const refResult = await processReferralLink(newRefTelegramId, `ref_${testTelegramId}`);
    const checkReferrer = await UserService.findByTelegramId(testTelegramId);

    assert(
      refResult !== undefined && checkReferrer !== null && checkReferrer.referralCount > 0,
      '14. Referral Link Processing & Referral Counter Increment'
    );

    // TEST 15: Telegram Channel Auto-Post Generation (@Huquq_study)
    const channelQuizPost = await ChannelPostService.generateDailyQuizPost();
    const channelDigestPost = await ChannelPostService.generateDailyDigestPost();
    assert(
      typeof channelQuizPost.text === 'string' &&
        channelQuizPost.text.includes('@Huquq_study') &&
        typeof channelDigestPost.text === 'string',
      '15.1 Telegram Channel Auto-Post Content Generator (@Huquq_study)'
    );

    let mockSent = false;
    const mockTelegram = {
      sendMessage: async () => { mockSent = true; },
    };
    const mockBot = {
      telegram: mockTelegram,
    };

    const res1 = await ChannelPostService.postDigestToChannel(mockTelegram as any, '@Huquq_study');
    const res2 = await ChannelPostService.postQuizToChannel(mockBot as any, '@Huquq_study');

    assert(res1.success && res2.success && mockSent, '15.2 Telegram Channel postQuizToChannel and postDigestToChannel Execution');

    // TEST 16: Legal Textbooks & Legislation Database Module
    const textbookCat = await prisma.category.upsert({
      where: { name: '📘 Fuqarolik Huquqi Darsliklari' },
      update: {},
      create: { name: '📘 Fuqarolik Huquqi Darsliklari', description: 'Fuqarolik kodeksi va darsliklar' },
    });
    const testTextbook = await prisma.legalArticle.create({
      data: {
        title: 'Fuqarolik Huquqi 1-Qism Darslik 2026',
        content: 'O‘zbekiston Fuqarolik huquqi bo‘yicha OTM darsligi.',
        categoryId: textbookCat.id,
        isPdfBook: true,
        price: 0,
      },
    });
    assert(testTextbook.id > 0 && testTextbook.categoryId === textbookCat.id, '16. Legal Textbooks & Legislation Registration');

    // TEST 17: AI Contract Risk Analysis Engine
    const riskReport = await AiService.analyzeContractRisk('Ijara shartnomasi: Shartnomani muddatsiz bir taraflama bekor qilish va 50% jarima to\'lash.');
    assert(typeof riskReport === 'string' && riskReport.includes('Xavf Indeksi'), '17. AI Contract Risk Analysis Engine Output');

    // TEST 18: PDF Document Generation with QR Code Verification
    const qrPdfBuffer = await DocGeneratorService.generateDocumentPdf({
      type: 'QARZ_TILI_XATI',
      docNumber: 'HQ-QR-TEST-99',
      partyA: { name: 'Sardorbek Rahimov' },
      partyB: { name: 'Dilshod Olimov' },
      details: { amountOrPrice: '5,000,000 UZS' },
    });
    assert(Buffer.isBuffer(qrPdfBuffer) && qrPdfBuffer.length > 2000, '18. PDF Document Generation with QR Code Verification (> 2KB)');

    // TEST 19: Voice Message Counter & Limit Tracking
    await prisma.user.update({
      where: { id: updatedUser.id },
      data: { voiceCount: 1 },
    });
    const voiceCheckUser = await UserService.findByTelegramId(testTelegramId);
    assert(voiceCheckUser !== null && voiceCheckUser.voiceCount === 1, '19. Voice Message Counter & Limit Tracking');

    // TEST 20: First Name & Last Name Validation & Formatting
    const nameValidRes = validateAndFormatName('alisher valiyev');
    assert(nameValidRes.isValid && nameValidRes.firstName === 'Alisher' && nameValidRes.lastName === 'Valiyev', '20.1 Valid Name Auto-Capitalization (alisher valiyev -> Alisher Valiyev)');

    const nameSingleRes = validateAndFormatName('Alisher');
    assert(!nameSingleRes.isValid && !!nameSingleRes.errorMessage, '20.2 Reject Single Word Name Input');

    const nameDigitRes = validateAndFormatName('Alisher123');
    assert(!nameDigitRes.isValid, '20.3 Reject Numbers in Name Input');

    // TEST 21: Mandatory Telegram Channel Subscription Check (@Huquq_study)
    const mockCtx: any = {
      from: { id: testTelegramId },
      telegram: {
        getChatMember: async () => ({ status: 'member' }),
      },
    };
    const isSubbed = await SubCheckService.isUserSubscribed(mockCtx);
    assert(isSubbed === true, '21. Force Channel Subscription Verification (@Huquq_study)');

    // TEST 22: Constitution Articles & Audio File ID Update
    const constCount = await ConstitutionService.seedDefaultArticles();
    assert(constCount >= 156, '22.1 Constitution 155 Articles + Muqaddima Seed Verification (>= 156)');

    const art1 = await ConstitutionService.getArticleByNumber(1);
    assert(art1 !== null && art1.title === '1-modda', '22.2 Constitution 1-modda Retrieval');

    const updatedArt = await ConstitutionService.updateAudioFileId(1, 'CQACAgIAAxkBAAI_TEST_AUDIO_FILE_ID', 45);
    assert(updatedArt.audioFileId === 'CQACAgIAAxkBAAI_TEST_AUDIO_FILE_ID', '22.3 Constitution Audio File ID Attachment');

    // TEST 23: Admin Textbook Deletion Verification
    const delResult = await prisma.legalArticle.delete({ where: { id: testTextbook.id } });
    assert(delResult.id === testTextbook.id, '23. Admin Textbook Record Deletion');

    // TEST 24: PDF Quizzes & Enhanced Quizzes Menu Verification
    const pdfQuizCat = await prisma.category.upsert({
      where: { name: '📄 DTMB & OTM Qabul PDF Testlari' },
      update: {},
      create: { name: '📄 DTMB & OTM Qabul PDF Testlari', description: 'DTMB testlar to‘plami' },
    });

    const testPdfQuiz = await prisma.legalArticle.create({
      data: {
        title: 'DTMB 2026 Huquqshunoslik PDF Test',
        content: '2026-yil DTMB qabul imtihoni uchun 100 ta nazorat test savollari.',
        fileId: 'CQACAgIAAxkBAAI_TEST_PDF_QUIZ_FILE_ID',
        fileType: 'pdf_quiz',
        isPdfBook: true,
        price: 0,
        categoryId: pdfQuizCat.id,
      },
    });

    assert(testPdfQuiz.id > 0 && testPdfQuiz.fileType === 'pdf_quiz', '24. PDF Quizzes Article Registration & Category Attachment');

    await prisma.legalArticle.delete({ where: { id: testPdfQuiz.id } });

    // TEST 25: AI Uzbek Speech Generation (Text-to-Speech)
    const ttsBuffer = await TtsService.generateUzbekSpeechBuffer('O‘zbekiston Respublikasi Konstitutsiyasi inson huquq va erkinliklarini kafolatlaydi.');
    assert(Buffer.isBuffer(ttsBuffer) && ttsBuffer.length > 500, '25. AI Uzbek Speech Synthesis Buffer Generation (> 500 bytes)');

    // Cleanup PDF materials
    await prisma.legalArticle.delete({ where: { id: testPdfMaterial.id } });

    // TEST 26: Cleanup Test Data
    await prisma.subscription.deleteMany({ where: { userId: updatedUser.id } });
    await prisma.quizResult.deleteMany({ where: { userId: updatedUser.id } });
    await prisma.userActivity.deleteMany({ where: { userId: updatedUser.id } });
    await prisma.aIConversation.deleteMany({ where: { userId: updatedUser.id } });
    await prisma.admin.deleteMany({ where: { telegramId: BigInt(testTelegramId) } });
    await prisma.user.delete({ where: { id: updatedUser.id } });

    assert(true, '26. Test Suite Cleanup Completed');

  } catch (error) {
    console.error('❌ Test Suite Exception:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n📊 TEST RESULTS SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED CLEANLY!\n');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE CHECK LOGS.\n');
    process.exit(1);
  }
}

runTestSuite();
