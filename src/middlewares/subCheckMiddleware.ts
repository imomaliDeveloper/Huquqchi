import { MiddlewareFn } from 'telegraf';
import { MyContext } from '../bot/context';
import { SubCheckService } from '../services/subCheckService';

export const subCheckMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  // Allow check_sub callback button so user can trigger subscription verification
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === 'check_sub') {
    return next();
  }

  const isSubscribed = await SubCheckService.isUserSubscribed(ctx);
  if (!isSubscribed) {
    return SubCheckService.sendForceSubPrompt(ctx);
  }

  return next();
};
