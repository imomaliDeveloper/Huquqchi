import { MyContext } from '../bot/context';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenuKeyboard';
import { handleProfileView } from './profileHandler';
import { handleAboutView } from './aboutHandler';
import { handleKnowledgeView } from './knowledgeHandler';
import { handleQuizView } from './quizHandler';
import { handleAiView, handleAiQuestionMessage } from './aiHandler';
import { handleSearchView } from './searchHandler';
import { handleAdminBroadcastExecute, handleAdminPdfDocumentMessage } from './adminHandler';
import { handleCertView } from './certHandler';
import { handleAdminQuizSteps, handleAdminPollImport } from './adminQuizHandler';
import { handleLegalServicesView, handleServiceApplicationSteps } from './legalServicesHandler';
import { handleDocumentView, handleDocumentWizardSteps } from './documentHandler';
import { handleLexSearchView, handleLexQuerySearch } from './lexSearchHandler';
import { handlePaymentView, handlePaymentReceiptMessage } from './paymentHandler';
import { handleReferralView } from './referralHandler';
import { handleTextbooksView } from './textbookHandler';
import { handleRiskCheckView, handleRiskCheckMessage } from './riskCheckHandler';
import { handleConstitutionView, handleAdminConstitutionAudioStep, handleConstitutionArticleDetails } from './constitutionHandler';
import { handleSosView } from './sosHandler';
import { handleCalculatorView, handleCalcTextInput } from './calculatorHandler';

export async function handleMainMenuRouting(ctx: MyContext, next: () => Promise<void>) {
  // Check if Admin Quiz Import Mode is active (checked BEFORE AI routing so forwarded polls/text/QuizBot posts are saved to DB!)
  if ((ctx.session as any)?.adminQuizImportCategory && ctx.message) {
    await handleAdminPollImport(ctx);
    return;
  }

  // Handle Admin Broadcast input if session active (checked BEFORE text check so media/forwards work)
  if ((ctx.session as any)?.adminBroadcastActive && ctx.message) {
    return handleAdminBroadcastExecute(ctx);
  }

  // Check if Legal Calculator custom amount input is active
  if ((ctx.session as any)?.calcState && ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text.trim();
    if (!text.startsWith('/')) {
      const handled = await handleCalcTextInput(ctx, text);
      if (handled) return;
    }
  }

  // Check if AI Contract Risk Check step is active
  if ((ctx.session as any)?.riskCheckSession?.step === 'AWAITING_TEXT' && ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text.trim();
    if (!text.startsWith('/')) {
      return handleRiskCheckMessage(ctx, text);
    }
  }
  // Check if user is sending a Payment Receipt (Photo, Document, or Text)
  if ((ctx.session as any)?.paymentSession?.step === 'AWAITING_RECEIPT') {
    const handled = await handlePaymentReceiptMessage(ctx);
    if (handled) return;
  }

  // Check if Admin PDF Document upload (File upload OR price entry) is active
  if ((ctx.session as any)?.adminPdfUpload?.step) {
    return handleAdminPdfDocumentMessage(ctx, next);
  }

  // Check if Admin Constitution Audio Upload step is active
  if ((ctx.session as any)?.adminConstitutionUpload?.step) {
    return handleAdminConstitutionAudioStep(ctx, next);
  }

  // Check if Admin Quiz Creation step is active
  if ((ctx.session as any)?.adminQuiz?.step) {
    return handleAdminQuizSteps(ctx, next);
  }

  // Check if Legal Service Application step is active
  if ((ctx.session as any)?.serviceApplication?.step) {
    return handleServiceApplicationSteps(ctx, next);
  }

  if (!ctx.message || !('text' in ctx.message)) {
    return next();
  }

  // If user is currently in an active registration flow, pass to registration handler
  if (ctx.session?.registration?.step) {
    return next();
  }

  const text = ctx.message.text.trim();

  // Check if Document Constructor Wizard step is active
  if ((ctx.session as any)?.docForm?.step) {
    const handled = await handleDocumentWizardSteps(ctx, text);
    if (handled) return;
  }

  switch (text) {
    case MAIN_MENU_BUTTONS.AI_CONSULTANT:
      return handleAiView(ctx);

    case MAIN_MENU_BUTTONS.SOS_HELP:
      return handleSosView(ctx);

    case MAIN_MENU_BUTTONS.CALCULATOR:
      return handleCalculatorView(ctx);

    case MAIN_MENU_BUTTONS.RISK_CHECK:
      return handleRiskCheckView(ctx);

    case MAIN_MENU_BUTTONS.CONSTITUTION:
      return handleConstitutionView(ctx);

    case MAIN_MENU_BUTTONS.DOCUMENT_GENERATOR:
      return handleDocumentView(ctx);

    case MAIN_MENU_BUTTONS.LEX_SEARCH:
      return handleLexSearchView(ctx);

    case MAIN_MENU_BUTTONS.TEXTBOOKS:
      return handleTextbooksView(ctx);

    case MAIN_MENU_BUTTONS.LEGAL_KNOWLEDGE:
      return handleKnowledgeView(ctx);

    case MAIN_MENU_BUTTONS.QUIZZES:
      return handleQuizView(ctx);

    case MAIN_MENU_BUTTONS.NATIONAL_CERTIFICATE:
      return handleCertView(ctx);

    case MAIN_MENU_BUTTONS.LEGAL_SERVICES:
      return handleLegalServicesView(ctx);

    case MAIN_MENU_BUTTONS.PRO_VIP:
      return handlePaymentView(ctx);

    case MAIN_MENU_BUTTONS.REFERRAL:
      return handleReferralView(ctx);

    case MAIN_MENU_BUTTONS.SEARCH:
      return handleSearchView(ctx);

    case MAIN_MENU_BUTTONS.PROFILE:
      return handleProfileView(ctx);

    case MAIN_MENU_BUTTONS.ABOUT:
      return handleAboutView(ctx);

    default:
      if (!text.startsWith('/')) {
        const lower = text.toLowerCase().trim();
        // Detect direct constitution article search e.g. "1", "1-modda", "1 modda", "modda 1", "konstitutsiya 15", "muqaddima"
        const moddaMatch = lower.match(/^(?:konstitutsiya\s*)?(?:(\d+)-modda|modda\s*(\d+)|(\d+)\s*modda|(\d+)|muqaddima)$/i);
        if (moddaMatch) {
          if (lower === 'muqaddima') {
            return handleConstitutionArticleDetails(ctx, 0);
          }
          const numStr = moddaMatch[1] || moddaMatch[2] || moddaMatch[3] || moddaMatch[4];
          if (numStr) {
            const num = parseInt(numStr, 10);
            if (num >= 0 && num <= 155) {
              return handleConstitutionArticleDetails(ctx, num);
            }
          }
        }

        return handleAiQuestionMessage(ctx);
      }
      return next();
  }
}
