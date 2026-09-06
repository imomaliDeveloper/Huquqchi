import { MiddlewareFn } from 'telegraf';
import { MyContext } from '../bot/context';

export const errorHandler: MiddlewareFn<MyContext> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('❌ Bot Update Error:', error);
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery('⚠️ Xatolik yuz berdi!').catch(() => {});
      }
      await ctx.reply('⚠️ Tizimda kutilmagan xatolik yuz berdi. Iltimos, bir ozdan so‘ng qayta urinib ko‘ring.');
    } catch (sendErr) {
      console.error('Failed to send error notification to user:', sendErr);
    }
  }
};
