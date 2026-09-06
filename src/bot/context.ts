import { Context } from 'telegraf';
import { User } from '@prisma/client';

export interface RegistrationSessionData {
  step?: 'AWAITING_NAME' | 'AWAITING_PHONE' | 'AWAITING_ROLE';
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  refPayload?: string;
}

export interface QuizSessionData {
  quizId?: number;
  currentQuestionIndex?: number;
  answers?: Record<number, string>; // questionId -> chosen answer
  startTime?: number;
}

export interface BotSessionData {
  registration?: RegistrationSessionData;
  quiz?: QuizSessionData;
  activeAiConversationId?: number;
}

export interface MyContext extends Context {
  user?: User | null;
  session?: BotSessionData;
}
