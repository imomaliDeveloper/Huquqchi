import { MyContext } from '../bot/context';
import ConstitutionService from '../services/constitutionService';
import { Markup } from 'telegraf';
import { escapeHTML } from '../utils/helpers';
import AdminService from '../services/adminService';
import TtsService from '../services/ttsService';

function extractArticleNumberFromText(input: string): number | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (lower.includes('muqaddima')) return 0;
  const match = input.match(/(\d+)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num >= 0 && num <= 155) {
      return num;
    }
  }
  return null;
}

export async function handleConstitutionView(ctx: MyContext) {
  await ConstitutionService.seedDefaultArticles();

  let text = `📜 <b>O‘ZBEKISTON RESPUBLIKASI KONSTITUTSIYASI (AUDIO & MATN)</b>\n\n`;
  text += `Ushbu bo‘limda O‘zbekiston Respublikasi Konstitutsiyasining <b>Muqaddimasi va barcha 155 ta moddasini</b> matn hamda audio (.mp3) shaklida tinglashingiz va yuklab olishingiz mumkin.\n\n`;
  text += `💡 <b>Qidiruv:</b> Istalgan modda raqamini (masalan <code>1</code>, <code>15</code> yoki <code>155</code>) chatga yuborishingiz ham mumkin!`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📜 Muqaddima (0-modda)', 'const_art_0')],
    [
      Markup.button.callback('▶️ 1-10 Moddalar', 'const_page_1'),
      Markup.button.callback('▶️ 11-30 Moddalar', 'const_page_2'),
    ],
    [
      Markup.button.callback('▶️ 31-60 Moddalar', 'const_page_4'),
      Markup.button.callback('▶️ 61-100 Moddalar', 'const_page_7'),
    ],
    [
      Markup.button.callback('▶️ 101-130 Moddalar', 'const_page_11'),
      Markup.button.callback('▶️ 131-155 Moddalar', 'const_page_14'),
    ],
  ]);

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

export async function handleConstitutionPage(ctx: MyContext, page: number) {
  const limit = 10;
  const res = await ConstitutionService.listArticles(page, limit);

  let text = `📜 <b>KONSTITUTSIYA MODDALARI (${res.page}/${res.totalPages}-sahifa)</b>\n\n`;
  text += `Quyidagi moddalardan birini tanlang:\n`;

  const inlineButtons: any[][] = [];

  for (const art of res.items) {
    const hasAudio = !!art.audioFileId;
    const label = `${art.articleNumber === 0 ? '📜 Muqaddima' : `${art.articleNumber}-modda`} ${hasAudio ? '🎧' : '📖'}`;
    inlineButtons.push([Markup.button.callback(label, `const_art_${art.articleNumber}`)]);
  }

  const navRow: any[] = [];
  if (page > 1) {
    navRow.push(Markup.button.callback('⬅️ Oldingi', `const_page_${page - 1}`));
  }
  if (page < res.totalPages) {
    navRow.push(Markup.button.callback('Keyingi ➡️', `const_page_${page + 1}`));
  }
  if (navRow.length > 0) {
    inlineButtons.push(navRow);
  }
  inlineButtons.push([Markup.button.callback('📜 Bosh Konstitutsiya menyusi', 'const_home')]);

  const keyboard = Markup.inlineKeyboard(inlineButtons);

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => ctx.reply(text, { parse_mode: 'HTML', ...keyboard }));
  }

  return ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

export async function handleConstitutionArticleDetails(ctx: MyContext, articleNumber: number) {
  const article = await ConstitutionService.getArticleByNumber(articleNumber);

  if (!article) {
    return ctx.reply('⚠️ Modda topilmadi!');
  }

  let text = `📜 <b>${escapeHTML(article.title)}</b>\n`;
  if (article.part) {
    text += `🏛 <i>${escapeHTML(article.part)}</i>\n`;
  }
  if (article.chapter) {
    text += `📖 <i>${escapeHTML(article.chapter)}</i>\n`;
  }
  text += `----------------------------------------\n\n`;
  text += `${escapeHTML(article.text)}\n\n`;

  if (article.audioFileId) {
    text += `🎧 <b>Audio fayl biriktirilgan!</b> (Pastda eshitishingiz va yuklab olishingiz mumkin)`;
  } else {
    text += `💡 <i>Ushbu moddaning audiosi admin tomonidan tez orada yuklanadi.</i>`;
  }

  const navButtons: any[] = [];
  if (articleNumber > 0) {
    navButtons.push(Markup.button.callback('⬅️ Oldingi modda', `const_art_${articleNumber - 1}`));
  }
  if (articleNumber < 155) {
    navButtons.push(Markup.button.callback('➡️ Keyingi modda', `const_art_${articleNumber + 1}`));
  }

  const keyboard = Markup.inlineKeyboard([
    navButtons,
    [Markup.button.callback('📜 Moddalar ro‘yxatiga qaytish', 'const_page_1')],
  ]);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }).catch(() => {});
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }

  // Send audio file if available, or generate dynamic Neural Voice speech buffer
  if (article.audioFileId) {
    try {
      await ctx.replyWithAudio(article.audioFileId, {
        caption: `🎧 ${article.title} - O‘zbekiston Respublikasi Konstitutsiyasi (Huquqchi AI)`,
      });
    } catch (err) {
      // Fallback voice message send if audio fails
      await ctx.replyWithVoice(article.audioFileId).catch(() => {});
    }
  } else {
    try {
      const speechBuffer = await TtsService.generateUzbekSpeechBuffer(article.text);
      if (speechBuffer) {
        await ctx.replyWithVoice(
          { source: speechBuffer, filename: `modda_${articleNumber}.mp3` },
          { caption: `🎙 <b>${article.title} (Ovozli ijro - Madina Neural TTS)</b>`, parse_mode: 'HTML' }
        );
      }
    } catch (ttsErr) {
      console.warn('Dynamic TTS voice generation error:', ttsErr);
    }
  }
}

export async function handleAdminConstitutionAudioStart(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await AdminService.isAdmin(telegramId))) {
    return ctx.reply('⚠️ Siz admin emassiz!');
  }

  ctx.session = ctx.session || {};
  (ctx.session as any).adminConstitutionUpload = { step: 'AWAITING_ARTICLE_NUM', uploadedCount: 0 };

  let text = `🎙 <b>OMMAVIY KONSTITUTSIYA AUDIOSINI YUKLASH (ADMIN)</b>\n\n`;
  text += `Boshlanish <b>modda raqamini</b> kiriting (0 = Muqaddima, 1-155):\n`;
  text += `💡 <i>Masalan <code>1</code> deb yozsangiz, ketma-ket yuborgan barcha mp3 audiolaringiz 1, 2, 3... moddalarga avtomatik biriktiriladi!</i>\n\n`;
  text += `⚡ <i>Bitta amalda Telegram'da 155 ta audio faylni tanlab, bittada yuborishingiz mumkin!</i>`;

  return ctx.reply(text, { parse_mode: 'HTML' });
}

export async function handleAdminConstitutionAudioStep(ctx: MyContext, next: () => Promise<void>) {
  const session = (ctx.session as any)?.adminConstitutionUpload;
  if (!session?.step) {
    return next();
  }

  // Step 1: Article Number Input
  if (session.step === 'AWAITING_ARTICLE_NUM') {
    const textInput = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '1';
    let num = 1;

    const numMatch = textInput.match(/(\d+)/);
    if (numMatch && numMatch[1]) {
      const parsed = parseInt(numMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 155) {
        num = parsed;
      }
    }

    session.articleNumber = num;
    session.uploadedCount = 0;
    session.step = 'AWAITING_AUDIO';

    const artTitle = num === 0 ? 'Muqaddima' : `${num}-modda`;

    const stopKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏹ Rejimni yakunlash', 'stop_const_audio_bulk')],
    ]);

    return ctx.reply(
      `🚀 <b>OMMAVIY AUDIONY YUKLASH REJIMIDA!</b>\n\n` +
      `Boshlanish targeti: <b>${artTitle}</b>\n\n` +
      `📥 Endi istalgancha audio (.mp3 / voice) fayllarni bittada yoki birma-bir yuborishingiz mumkin!\n` +
      `💡 Har bir audio saqlanib, modda raqami avtomatik oshib boradi (1, 2, 3...).\n\n` +
      `<i>Tugatish uchun pastdagi tugmani bosing yoki "Tugatish" deb yozing.</i>`,
      { parse_mode: 'HTML', ...stopKeyboard }
    );
  }

  // Step 2: Audio File Upload (Continuous Loop)
  if (session.step === 'AWAITING_AUDIO') {
    // Check if user sent text to stop/cancel
    if (ctx.message && 'text' in ctx.message && ctx.message.text) {
      const textVal = ctx.message.text.trim().toLowerCase();
      if (['tugatish', 'stop', 'done', 'bekor', '/stop', '/done'].includes(textVal)) {
        const count = session.uploadedCount || 0;
        delete (ctx.session as any).adminConstitutionUpload;
        return ctx.reply(`🎉 <b>Ommaviy yuklash yakunlandi!</b> Jami <b>${count} ta</b> modda audiosi muvaffaqiyatli saqlandi.`, { parse_mode: 'HTML' });
      }
    }

    let fileId = '';
    let duration = 0;
    let caption = '';
    let fileName = '';
    let audioTitle = '';

    if (ctx.message && 'audio' in ctx.message && ctx.message.audio) {
      fileId = ctx.message.audio.file_id;
      duration = ctx.message.audio.duration || 0;
      caption = ctx.message.caption || '';
      fileName = ctx.message.audio.file_name || '';
      audioTitle = ctx.message.audio.title || '';
    } else if (ctx.message && 'voice' in ctx.message && ctx.message.voice) {
      fileId = ctx.message.voice.file_id;
      duration = ctx.message.voice.duration || 0;
      caption = ctx.message.caption || '';
    }

    if (!fileId) {
      return ctx.reply(
        `⚠️ Iltimos, <b>Audio (.mp3)</b> fayl yuboring, yoki yuklashni to‘xtatish uchun <b>"Tugatish"</b> deb yozing!`,
        { parse_mode: 'HTML' }
      );
    }

    // Smart Article Number Detection (Check caption -> file_name -> audio title -> default session auto-increment)
    let targetArtNum = session.articleNumber;
    const detectedFromCaption = extractArticleNumberFromText(caption);
    const detectedFromFileName = extractArticleNumberFromText(fileName);
    const detectedFromTitle = extractArticleNumberFromText(audioTitle);

    if (detectedFromCaption !== null) {
      targetArtNum = detectedFromCaption;
    } else if (detectedFromFileName !== null) {
      targetArtNum = detectedFromFileName;
    } else if (detectedFromTitle !== null) {
      targetArtNum = detectedFromTitle;
    }

    await ConstitutionService.updateAudioFileId(targetArtNum, fileId, duration);

    session.uploadedCount = (session.uploadedCount || 0) + 1;
    // Set next target article number automatically
    session.articleNumber = Math.min(155, targetArtNum + 1);

    const artTitle = targetArtNum === 0 ? 'Muqaddima' : `${targetArtNum}-modda`;
    const nextTitle = session.articleNumber === 0 ? 'Muqaddima' : `${session.articleNumber}-modda`;

    const stopKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏹ Yuklashni yakunlash', 'stop_const_audio_bulk')],
    ]);

    try {
      // Throttle progress replies to avoid Telegram rate limits during 100+ rapid file uploads
      if (session.uploadedCount === 1 || session.uploadedCount % 5 === 0 || caption) {
        await ctx.reply(
          `✅ <b>SAQLANDI! (${session.uploadedCount}-fayl)</b>\n\n` +
          `🎙 <b>${artTitle}</b> audiosi biriktirildi.\n` +
          `👉 Keyingi target: <b>${nextTitle}</b>\n\n` +
          `<i>Barchasini saqlab bo'lgach, "Tugatish" deb yozing yoki tugmani bosing.</i>`,
          { parse_mode: 'HTML', ...stopKeyboard }
        );
      }
    } catch (err: any) {
      console.warn(`[BulkAudio] Saved ${artTitle} to DB. Reply throttled by Telegram:`, err?.message || err);
    }

    return;
  }

  return next();
}

export async function handleAdminConstitutionAudioClear(ctx: MyContext) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !(await AdminService.isAdmin(telegramId))) {
    return ctx.reply('⚠️ Siz admin emassiz!');
  }

  await ConstitutionService.clearAllAudioFileIds();

  let text = `🗑 <b>KONSTITUTSIYA AUDIOLARI MUVAFFAQIYATLI TOZALANDI!</b>\n\n`;
  text += `Barcha modda va Muqaddima audiolari ma'lumotlar bazasidan o'chirib tashlandi.\n`;
  text += `Endi yangidan toza holatda ommaviy yuklashingiz mumkin! 🚀`;

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery('🗑 Audiolar tozalandi!').catch(() => {});
    return ctx.editMessageText(text, { parse_mode: 'HTML' }).catch(() => ctx.reply(text, { parse_mode: 'HTML' }));
  }

  return ctx.reply(text, { parse_mode: 'HTML' });
}
