import { MiddlewareFn } from 'telegraf';
import { MyContext } from '../bot/context';
import UserService from '../services/userService';

export const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  try {
    let user = await UserService.findByTelegramId(ctx.from.id);
    if (!user) {
      user = await UserService.upsertUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name || 'Foydalanuvchi',
        lastName: ctx.from.last_name || undefined,
      });
    }
    ctx.user = user;
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    ctx.user = null;
  }

  return next();
};
