import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().optional().default('8708913937:AAFxVGita3lGuBLm1xgIWGdzhXh-SrEko7c'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_CARD_NUMBER: z.string().optional().default('8600 0000 0000 0000'),
  ADMIN_CARD_HOLDER: z.string().optional().default('Huquqchi Admin'),
  TELEGRAM_CHANNEL_USERNAME: z.string().optional().default('@Huquq_study'),
  BOT_USERNAME: z.string().optional().default('Huquqchi_bot'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuration error in environment variables:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
}

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminCardNumber: process.env.ADMIN_CARD_NUMBER || '8600 0000 0000 0000',
  adminCardHolder: process.env.ADMIN_CARD_HOLDER || 'Huquqchi Admin',
  telegramChannelUsername: process.env.TELEGRAM_CHANNEL_USERNAME || '@Huquq_study',
  botUsername: (process.env.BOT_USERNAME || 'Huquqchi_bot').replace(/^@/, ''),
  isDev: (process.env.NODE_ENV || 'development') === 'development',
};

export default config;
