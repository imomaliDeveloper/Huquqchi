import { Markup } from 'telegraf';

export function getMainMenuKeyboard() {
  const miniAppUrl = process.env.MINI_APP_URL || 'https://share-removal-cake-photos.trycloudflare.com';
  return Markup.keyboard([
    [Markup.button.webApp('🚀 Huquqchi Mini App (Web UI)', miniAppUrl)],
    ['⚖️ Huquqiy AI', '🛡 AI Shartnoma Ekspertizasi'],
    ['🎧 Konstitutsiya (Audio & Matn)', '📄 Hujjat yaratish'],
    ['🔍 Lex.uz Kodekslar', '📖 Huquqiy Darsliklar'],
    ['🎓 Milliy Sertifikat', '📝 Testlar'],
    ['📚 Huquqiy bilimlar', '💼 Yuridik xizmatlar'],
    ['👑 VIP PRO Obuna', '🔗 Do‘stlarni taklif qilish'],
    ['👤 Profil', 'ℹ️ Bot haqida'],
  ]).resize();
}

export const MAIN_MENU_BUTTONS = {
  AI_CONSULTANT: '⚖️ Huquqiy AI',
  RISK_CHECK: '🛡 AI Shartnoma Ekspertizasi',
  CONSTITUTION: '🎧 Konstitutsiya (Audio & Matn)',
  DOCUMENT_GENERATOR: '📄 Hujjat yaratish',
  LEX_SEARCH: '🔍 Lex.uz Kodekslar',
  TEXTBOOKS: '📖 Huquqiy Darsliklar',
  NATIONAL_CERTIFICATE: '🎓 Milliy Sertifikat',
  LEGAL_KNOWLEDGE: '📚 Huquqiy bilimlar',
  QUIZZES: '📝 Testlar',
  LEGAL_SERVICES: '💼 Yuridik xizmatlar',
  PRO_VIP: '👑 VIP PRO Obuna',
  REFERRAL: '🔗 Do‘stlarni taklif qilish',
  SEARCH: '🔎 Qidiruv',
  PROFILE: '👤 Profil',
  ABOUT: 'ℹ️ Bot haqida',
};
