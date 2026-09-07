import { Telegraf, Markup } from 'telegraf';
import { MyContext } from '../bot/context';
import config from '../config';
import prisma from '../database/prisma';
import { escapeHTML, formatHeader, formatSectionDivider } from '../utils/ui';

export class ChannelPostService {
  public static async generateDailyQuizPost() {
    // Try to get a random question from database, or use default sample question
    const questions = await prisma.quizQuestion.findMany({ take: 20 });
    let q: any = questions.length > 0 ? questions[Math.floor(Math.random() * questions.length)] : null;

    if (!q) {
      q = {
        id: 1,
        quizId: 1,
        question: 'Mehnat kodeksiga muvofiq har yillik asosiy mehnat ta’tili davomiyligi kamida necha ish kunidan iborat?',
        imageUrl: null,
        fileId: null,
        optionA: '15 ish kuni',
        optionB: '21 ish kuni',
        optionC: '30 ish kuni',
        optionD: '14 ish kuni',
        correctAnswer: 'B',
        explanation: 'Mehnat kodeksi 216-moddasi: Xodimlarga har yili kamida 21 ish kunidan iborat asosiy ta’til beriladi.',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const botUsername = (config.botUsername || 'Huquqchi_bot').replace(/^@/, '');
    const channelName = config.telegramChannelUsername || '@Huquq_study';

    let html = `📝 <b>${escapeHTML(channelName)} | KUN HUQUQIY TESTI</b>\n`;
    html += `${formatSectionDivider()}\n\n`;
    html += `❓ <b>SAVOL:</b> ${escapeHTML(q.question)}\n\n`;
    html += `🅰️ ${escapeHTML(q.optionA)}\n`;
    html += `🅱️ ${escapeHTML(q.optionB)}\n`;
    html += `🅲️ ${escapeHTML(q.optionC)}\n`;
    html += `🅳️ ${escapeHTML(q.optionD)}\n\n`;
    html += `${formatSectionDivider()}\n`;
    html += `💡 <i>To‘g‘ri javobni bilish, testni ishlash va sertifikat olish uchun botga o‘ting:</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📝 Testni Botda Ishlash', `https://t.me/${botUsername}?start=quiz_${q.id}`)],
      [Markup.button.url('⚖️ Huquqchi AI Botiga Kirish', `https://t.me/${botUsername}`)],
    ]);

    return { text: html, keyboard, question: q };
  }

  public static async generateDailyDigestPost() {
    const channelName = config.telegramChannelUsername || '@Huquq_study';
    const botUsername = (config.botUsername || 'Huquqchi_bot').replace(/^@/, '');

    const tips = [
      {
        title: '🏠 TURAR JOY IJARA SHARTNOMASI QOIDALARI',
        content: 'Fuqarolik kodeksi 600-moddasiga muvofiq, turar joy ijarasi shartnomasi yozma shaklda tuziladi va ijara.soliq.uz saytida majburiy hisobga qo‘yiladi. Yozma shartnomasiz yashash 1500 dollargacha moliyaviy nizolarga olib kelishi mumkin.',
      },
      {
        title: '💸 QARZ TILI XATI (TILXAT) NIMA UCHUN KERAK?',
        content: 'BHMning 10 baravaridan (3.7 mln so‘m) ortiq qarz fuqarolar o‘rtasida berilganda, yozma shartnoma yoki Tilxat tuzilishi shart. Tilxatda pul summasi, qaytarish sanasi hamda 2 tomon pasport ma’lumotlari to‘liq ko‘rsatilishi kerak.',
      },
      {
        title: '👔 ISHDAN NOQONUNIY BO‘SHATILGANDA NIMA QILISH KERAK?',
        content: 'Mehnat kodeksining 161-moddasiga ko‘ra, ish beruvchi xodimni sababsiz bo‘shata olmaydi. Agar huquqingiz buzilsa, bo‘shatilgan kundan boshlab 1 oy ichida Sudga da’vo arizasi kiritishingiz va barcha majburiy bekor yurgan kunlar uchun ish haqi undirishingiz mumkin.',
      },
    ];

    const index = Math.floor(Math.random() * tips.length);
    const selected = tips[index] || tips[0];
    const title = selected ? selected.title : 'HUQUQIY MASLAHAT';
    const content = selected ? selected.content : 'Huquqlaringizni qonuniy himoya qiling.';

    let html = `📢 <b>${escapeHTML(channelName)} | KUN HUQUQIY DAJESTI</b>\n`;
    html += `${formatSectionDivider()}\n\n`;
    html += `📌 <b>${escapeHTML(title)}</b>\n\n`;
    html += `📖 <i>${escapeHTML(content)}</i>\n\n`;
    html += `${formatSectionDivider()}\n`;
    html += `🤖 <i>O‘zingizni qiziqtirgan yuridik savollarni Huquqchi AI botida bepul so‘rang:</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('⚖️ AI Yurist bilan Maslahatlashish', `https://t.me/${botUsername}`)],
      [Markup.button.url('📄 Shartnoma PDF Yaratish', `https://t.me/${botUsername}`)],
    ]);

    return { text: html, keyboard, tip: selected };
  }

  public static async postQuizToChannel(botOrTelegram: any, targetChannel?: string) {
    const channel = targetChannel || config.telegramChannelUsername || '@Huquq_study';
    const { text, keyboard } = await this.generateDailyQuizPost();

    try {
      const telegram = botOrTelegram?.telegram || botOrTelegram;
      await telegram.sendMessage(channel, text, {
        parse_mode: 'HTML',
        ...keyboard,
      });
      return { success: true, channel };
    } catch (err: any) {
      console.error(`Error posting quiz to channel ${channel}:`, err?.message || err);
      return { success: false, channel, error: err?.message || 'Noma’lum xatolik' };
    }
  }

  public static async postDigestToChannel(botOrTelegram: any, targetChannel?: string) {
    const channel = targetChannel || config.telegramChannelUsername || '@Huquq_study';
    const { text, keyboard } = await this.generateDailyDigestPost();

    try {
      const telegram = botOrTelegram?.telegram || botOrTelegram;
      await telegram.sendMessage(channel, text, {
        parse_mode: 'HTML',
        ...keyboard,
      });
      return { success: true, channel };
    } catch (err: any) {
      console.error(`Error posting digest to channel ${channel}:`, err?.message || err);
      return { success: false, channel, error: err?.message || 'Noma’lum xatolik' };
    }
  }
}
