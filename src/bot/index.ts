import { Telegraf } from 'telegraf';
import { config } from '../config';
import { MyContext } from './context';
import { errorHandler } from '../middlewares/errorHandler';
import { sessionMiddleware } from '../middlewares/sessionMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { subCheckMiddleware } from '../middlewares/subCheckMiddleware';
import { handleStartCommand, handleRegistrationSteps } from '../handlers/registrationHandler';
import { handleMainMenuRouting } from '../handlers/mainMenuHandler';
import { handleRoleChangePrompt, handleRoleSet, handleProfileRefresh } from '../handlers/profileHandler';
import {
  handleKnowledgeView,
  handleCategoryArticles,
  handleArticleDetails,
  handleDownloadPdfBook,
} from '../handlers/knowledgeHandler';
import {
  handleQuizView,
  handleInteractiveQuizView,
  handleInteractiveQuizCategory,
  handlePdfQuizHome,
  handlePdfQuizCategory,
  handleDownloadPdfQuiz,
  handleQuizMyResults,
  handleQuizStart,
  handleQuizAnswer,
} from '../handlers/quizHandler';
import {
  handleAdminCommand,
  handleAdminStats,
  handleAdminUsers,
  handleAdminBroadcastPrompt,
  handleAdminPdfUploadPrompt,
  handleAdminPdfCategorySelect,
  handleAdminRevenue,
  handleAdminExportCsv,
  handleAdminPostChannelMenu,
  handleAdminPostChannelExecute,
} from '../handlers/adminHandler';
import {
  handleCertView,
  handleCertExamStart,
  handleCertExamAnswer,
  handleCertMyResults,
  handleCertPdfBooksList,
  handleCertBuyPdfPrompt,
  handleCertInfoPage,
} from '../handlers/certHandler';
import {
  handleAdminCreateQuizStart,
  handleAdminQuizCategorySelect,
  handleAdminCorrectAnswerSelect,
  handleAdminSkipPhoto,
  handleAdminSkipExplanation,
  handleAdminAddAnotherQuestion,
  handleAdminFinishQuiz,
  handleAdminPollImport,
  handleAdminStartPollImportMenu,
  handleAdminSetImportCategory,
  handleAdminStopPollImport,
  handleAdminManageQuizzes,
  handleAdminDeleteQuizPrompt,
  handleAdminDeleteQuizConfirm,
} from '../handlers/adminQuizHandler';
import {
  handleLegalServicesView,
  handleServiceApplyStart,
  handleServiceContact,
} from '../handlers/legalServicesHandler';
import { handleDocumentTypeSelect } from '../handlers/documentHandler';
import {
  handlePaymentCardInfo,
  handlePaymentProcess,
  handleAdminApprovePayment,
  handleAdminApprovePdfDelivery,
  handleAdminRejectPayment,
} from '../handlers/paymentHandler';
import { handleReferralView } from '../handlers/referralHandler';
import {
  handleTextbooksView,
  handleTextbookCategory,
  handleTextbookDetails,
  handleDownloadTextbook,
  handleAdminDeleteTextbookPrompt,
  handleAdminDeleteTextbookConfirm,
  handleAdminManageTextbooks,
} from '../handlers/textbookHandler';
import { SubCheckService } from '../services/subCheckService';
import { handleRiskCheckView } from '../handlers/riskCheckHandler';
import { handleVoiceMessage } from '../handlers/voiceHandler';
import {
  handleConstitutionView,
  handleConstitutionPage,
  handleConstitutionArticleDetails,
  handleAdminConstitutionAudioStart,
  handleAdminConstitutionAudioClear,
} from '../handlers/constitutionHandler';

const botToken = (process.env.BOT_TOKEN || config.botToken || '8708913937:AAFxVGita3lGuBLm1xgIWGdzhXh-SrEko7c').replace(/['"]/g, '').trim();
export const bot = new Telegraf<MyContext>(botToken);

// Register core middlewares
bot.use(errorHandler);
bot.use(sessionMiddleware);
bot.use(authMiddleware);
bot.use(subCheckMiddleware);

let handlersInitialized = false;

export function setupBotHandlers() {
  if (handlersInitialized) return;
  handlersInitialized = true;

  // Command handlers
  bot.command('start', handleStartCommand);
  bot.command('admin', handleAdminCommand);

  // Admin actions
  bot.action('admin_home', handleAdminCommand);
  bot.action('admin_stats', handleAdminStats);
  bot.action('admin_revenue', handleAdminRevenue);
  bot.action('admin_export_csv', handleAdminExportCsv);
  bot.action('admin_post_channel', handleAdminPostChannelMenu);
  bot.action('admin_post_channel_quiz', (ctx) => handleAdminPostChannelExecute(ctx, 'quiz'));
  bot.action('admin_post_channel_digest', (ctx) => handleAdminPostChannelExecute(ctx, 'digest'));
  bot.action('admin_users', handleAdminUsers);
  bot.action('admin_broadcast', handleAdminBroadcastPrompt);
  bot.action('admin_upload_cert_pdf', (ctx) => handleAdminPdfUploadPrompt(ctx, true, false, false));
  bot.action('admin_upload_textbook', (ctx) => handleAdminPdfUploadPrompt(ctx, false, true, false));
  bot.action('admin_upload_pdf_quiz', (ctx) => handleAdminPdfUploadPrompt(ctx, false, false, true));
  bot.action('admin_upload_pdf', (ctx) => handleAdminPdfUploadPrompt(ctx, false, false, false));
  bot.action('admin_upload_const_audio', handleAdminConstitutionAudioStart);
  bot.action('admin_clear_const_audio', handleAdminConstitutionAudioClear);
  bot.action(/^admin_pdf_cat_(\d+)$/, (ctx) => handleAdminPdfCategorySelect(ctx, parseInt(ctx.match[1]!, 10)));

  // Constitution actions
  bot.action('const_home', handleConstitutionView);
  bot.action(/^const_page_(\d+)$/, (ctx) => handleConstitutionPage(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^const_art_(\d+)$/, (ctx) => handleConstitutionArticleDetails(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action('stop_const_audio_bulk', async (ctx) => {
    const count = (ctx.session as any)?.adminConstitutionUpload?.uploadedCount || 0;
    delete (ctx.session as any).adminConstitutionUpload;
    await ctx.answerCbQuery('🎉 Ommaviy yuklash yakunlandi!').catch(() => {});
    return ctx.reply(`🎉 <b>Ommaviy audio yuklash yakunlandi!</b> Jami <b>${count} ta</b> modda audiosi saqlandi.`, { parse_mode: 'HTML' });
  });

  // Force Subscribe & Risk Check actions
  bot.action('check_sub', (ctx) => SubCheckService.handleCheckSubCallback(ctx));
  bot.action('risk_check_start', handleRiskCheckView);
  bot.action('risk_check_cancel', (ctx) => {
    delete (ctx.session as any).riskCheckSession;
    return ctx.reply('❌ AI Ekspertiza bekor qilindi. Asosiy menyudan foydalanishingiz mumkin.');
  });

  // Legal Textbooks & Legislation actions
  bot.action('textbooks_home', handleTextbooksView);
  bot.action('admin_manage_textbooks', handleAdminManageTextbooks);
  bot.action(/^admin_del_tb_(\d+)$/, (ctx) => handleAdminDeleteTextbookPrompt(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^admin_del_tb_confirm_(\d+)$/, (ctx) => handleAdminDeleteTextbookConfirm(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^tb_cat_(\d+)$/, (ctx) => handleTextbookCategory(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^tb_art_(\d+)$/, (ctx) => handleTextbookDetails(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^dl_tb_(\d+)$/, (ctx) => handleDownloadTextbook(ctx, parseInt(ctx.match[1]!, 10)));

  // Admin Quiz Creation & Management actions
  bot.action('admin_create_quiz', handleAdminCreateQuizStart);
  bot.action('admin_manage_quizzes', handleAdminManageQuizzes);
  bot.action(/^admin_del_quiz_(\d+)$/, (ctx) => handleAdminDeleteQuizPrompt(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^admin_del_quiz_confirm_(\d+)$/, (ctx) => handleAdminDeleteQuizConfirm(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^admin_quiz_cat_(.+)$/, (ctx) => handleAdminQuizCategorySelect(ctx, ctx.match[1]!));
  bot.action(/^admin_ans_(A|B|C|D)$/, (ctx) => handleAdminCorrectAnswerSelect(ctx, ctx.match[1]!));
  bot.action('admin_skip_photo', handleAdminSkipPhoto);
  bot.action('admin_skip_explanation', handleAdminSkipExplanation);
  bot.action('admin_add_another_question', handleAdminAddAnotherQuestion);
  bot.action('admin_finish_quiz', handleAdminFinishQuiz);
  bot.action('admin_start_poll_import', handleAdminStartPollImportMenu);
  bot.action(/^admin_set_import_cat_(.+)$/, (ctx) => handleAdminSetImportCategory(ctx, ctx.match[1]!));
  bot.action('admin_stop_poll_import', handleAdminStopPollImport);

  // Voice & Poll Import handlers
  bot.on('voice', handleVoiceMessage);
  bot.on('poll', handleAdminPollImport);

  // Legal Services actions
  bot.action('back_to_services', handleLegalServicesView);
  bot.action('service_apply_start', handleServiceApplyStart);
  bot.action('service_contact', handleServiceContact);

  // Referral actions
  bot.action('ref_info', handleReferralView);

  // Document Constructor actions
  bot.action(/^doc_type_(.+)$/, (ctx) => handleDocumentTypeSelect(ctx, ctx.match[1]!));

  // VIP Payment actions
  bot.action('buy_pro_card_monthly', (ctx) => handlePaymentCardInfo(ctx, 'PRO_MONTHLY'));
  bot.action('buy_pro_card_yearly', (ctx) => handlePaymentCardInfo(ctx, 'PRO_YEARLY'));
  bot.action('buy_pro_auto_monthly', (ctx) => handlePaymentProcess(ctx, 'PRO_MONTHLY'));
  bot.action(/^admin_approve_pay_(\d+)_(.+)$/, (ctx) =>
    handleAdminApprovePayment(ctx, parseInt(ctx.match[1]!, 10), ctx.match[2]! as any)
  );
  bot.action(/^admin_approve_pdf_(\d+)_(\d+)$/, (ctx) =>
    handleAdminApprovePdfDelivery(ctx, parseInt(ctx.match[1]!, 10), parseInt(ctx.match[2]!, 10))
  );
  bot.action(/^admin_reject_pay_(\d+)$/, (ctx) => handleAdminRejectPayment(ctx, parseInt(ctx.match[1]!, 10)));

  // Profile actions
  bot.action('change_role', handleRoleChangePrompt);
  bot.action('refresh_profile', handleProfileRefresh);
  bot.action(/^set_role_(.+)$/, (ctx) => handleRoleSet(ctx, ctx.match[1]!));

  // Legal Knowledge navigation actions
  bot.action('back_to_categories', handleKnowledgeView);
  bot.action(/^cat_(\d+)$/, (ctx) => handleCategoryArticles(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^art_(\d+)$/, (ctx) => handleArticleDetails(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^dl_pdf_(\d+)$/, (ctx) => handleDownloadPdfBook(ctx, parseInt(ctx.match[1]!, 10)));

  // Quiz navigation actions
  bot.action('back_to_quizzes', handleQuizView);
  bot.action('quiz_interactive_home', handleInteractiveQuizView);
  bot.action(/^quiz_cat_select_(.+)$/, (ctx) => handleInteractiveQuizCategory(ctx, ctx.match[1]!));
  bot.action('quiz_pdf_home', handlePdfQuizHome);
  bot.action(/^quiz_pdf_cat_(\d+)$/, (ctx) => handlePdfQuizCategory(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^quiz_pdf_dl_(\d+)$/, (ctx) => handleDownloadPdfQuiz(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action('quiz_my_results', handleQuizMyResults);
  bot.action(/^quiz_start_(\d+)$/, (ctx) => handleQuizStart(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action(/^quiz_ans_(\d+)_(\d+)_(A|B|C|D)$/, (ctx) =>
    handleQuizAnswer(ctx, parseInt(ctx.match[1]!, 10), parseInt(ctx.match[2]!, 10), ctx.match[3]!)
  );

  // National Legal Certificate actions
  bot.action('cert_home', handleCertView);
  bot.action('cert_info', (ctx) => handleCertInfoPage(ctx, 1));
  bot.action('cert_info_page_1', (ctx) => handleCertInfoPage(ctx, 1));
  bot.action('cert_info_page_2', (ctx) => handleCertInfoPage(ctx, 2));
  bot.action('cert_pdf_books', handleCertPdfBooksList);
  bot.action(/^cert_buy_pdf_(\d+)$/, (ctx) => handleCertBuyPdfPrompt(ctx, parseInt(ctx.match[1]!, 10)));
  bot.action('cert_exam_start', handleCertExamStart);
  bot.action('cert_my_results', handleCertMyResults);
  bot.action(/^cert_ans_(\d+)_(A|B|C|D)$/, (ctx) =>
    handleCertExamAnswer(ctx, parseInt(ctx.match[1]!, 10), ctx.match[2]!)
  );

  // Voice Message AI Assistant handler
  bot.on('voice', handleVoiceMessage);

  // Registration state machine middleware
  bot.use(handleRegistrationSteps);

  // Main menu navigation router
  bot.use(handleMainMenuRouting);
}

setupBotHandlers();

export default bot;
