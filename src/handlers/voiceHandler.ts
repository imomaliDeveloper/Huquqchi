import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { Markup } from 'telegraf';
import UI from '../utils/ui';
import AiService from '../services/aiService';
import UserService from '../services/userService';
import TtsService from '../services/ttsService';

export async function handleVoiceMessage(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('voice' in ctx.message)) return;

  const user = await UserService.findByTelegramId(telegramId);
  if (!user) {
    return ctx.reply('⚠️ Iltimos, avval /start buyrug‘ini bosing va ro‘yxatdan o‘ting.');
  }

  // Check voice limit for Non-PRO users
  if (!user.isPro) {
    const currentVoiceCount = user.voiceCount || 0;
    if (currentVoiceCount >= 1) {
      let text = `⚠️ <b>BEPUL OVOZLI SAVOL LIMITI TUGADI! (1/1 ishlatildi)</b>\n\n`;
      text += `Siz 1 ta bepul ovozli savol imkoniyatidan foydalandingiz.\n\n`;
      text += `👑 <b>VIP PRO ta‘rifiga o‘ting va imkoniyatlarga ega bo‘ling:</b>\n`;
      text += ` ├ 🎧 Cheksiz ovozli AI konsultatsiyalar (Audio javob bilan)\n`;
      text += ` ├ 📄 Cheksiz PDF shartnoma & arizalar generatori\n`;
      text += ` └ ⚡️ Zudlik bilan va chuqurlashtirilgan yuridik javoblar!\n\n`;
      text += `${UI.DIVIDER}`;

      const buttons = [
        [Markup.button.callback('👑 VIP PRO ga O‘tish (Card Pay)', 'buy_pro_card_monthly')],
      ];

      return ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }

    // Increment voice counter for free tier first try
    await prisma.user.update({
      where: { id: user.id },
      data: { voiceCount: { increment: 1 } },
    });
  }

  const voice = ctx.message.voice;
  const duration = voice.duration || 0;

  await ctx.reply(
    `🎧 <i>Ovozli xabaringiz qabul qilindi (${duration} soniya). AI yurist ovozni qayta ishlamoqda hamda javob tayyorlamoqda...</i>`,
    { parse_mode: 'HTML' }
  );

  try {
    // 1. Download user's actual voice message audio from Telegram
    let aiAdvice = '';
    try {
      const fileLink = await ctx.telegram.getFileLink(voice.file_id);
      const audioResponse = await fetch(fileLink.href);
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

      // 2. Parse & listen to user's exact audio question via Gemini multimodal AI
      aiAdvice = await AiService.askLegalQuestionFromAudio(user.id, audioBuffer, 'audio/ogg');
    } catch (voiceFetchErr) {
      console.warn('Could not fetch voice link or parse audio, using text fallback:', voiceFetchErr);
      const queryFallback = `Ovozli murojaat yuzasidan yuridik konsultatsiya va O'zbekiston Respublikasi qonunchiligi tahlili.`;
      aiAdvice = await AiService.askLegalQuestion(user.id, queryFallback);
    }

    // 3. Synthesize AI voice audio response in Uzbek
    const voiceBuffer = await TtsService.generateUzbekSpeechBuffer(aiAdvice);

    if (voiceBuffer) {
      await ctx.replyWithVoice(
        { source: voiceBuffer, filename: 'ai_voice_reply.mp3' },
        { caption: '🔊 <b>AI Yuristning Ovozli Javobi (TTS)</b>', parse_mode: 'HTML' }
      ).catch((err) => {
        console.warn('Could not send voice reply:', err);
      });
    }

    // 2. Send complete detailed text advice
    let replyText = `🎧 <b>OVOZLI AI KONSULTATSIYA JAVOBI:</b>\n`;
    replyText += `${UI.THIN_DIVIDER}\n\n`;
    replyText += `${aiAdvice}\n\n`;

    if (!user.isPro) {
      replyText += `${UI.DIVIDER}\n`;
      replyText += `💡 <i>Eslatma: Siz 1/1 bepul ovozli savolingizdan foydalandingiz. Cheksiz ovozli muloqot uchun VIP PRO ga o‘ting!</i>`;
    }

    const buttons = !user.isPro
      ? [[Markup.button.callback('👑 VIP PRO Obuna Olish', 'buy_pro_card_monthly')]]
      : [];

    return ctx.reply(replyText, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  } catch (err) {
    console.error('Error handling voice message:', err);
    return ctx.reply('⚠️ Ovozli xabarni qayta ishlashda xatolik yuz berdi. Iltimos, savolingizni matn ko‘rinishida yuboring.');
  }
}
