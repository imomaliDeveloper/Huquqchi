import { MiddlewareFn } from 'telegraf';
import { MyContext } from '../bot/context';
import UserService from '../services/userService';

export const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  try {
    const user = await UserService.findByTelegramId(ctx.from.id);
    ctx.user = user;
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    ctx.user = null;
  }

  return next();
};
