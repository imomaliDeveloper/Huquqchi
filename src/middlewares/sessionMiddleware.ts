import { MiddlewareFn } from 'telegraf';
import { MyContext, BotSessionData } from '../bot/context';

const sessions = new Map<number, BotSessionData>();

export const sessionMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  const userId = ctx.from.id;

  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }

  ctx.session = sessions.get(userId)!;

  await next();
};

export function resetSession(userId: number) {
  sessions.set(userId, {});
}
