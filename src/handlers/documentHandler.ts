import { Markup } from 'telegraf';
import { MyContext } from '../bot/context';
import { DocGeneratorService, DocTemplateParams } from '../services/docGeneratorService';
import { escapeHTML, formatHeader, formatBadge, formatSectionDivider } from '../utils/ui';

export interface DocFormSession {
  step: 'TYPE_SELECT' | 'PARTY_A_NAME' | 'PARTY_A_PASSPORT' | 'PARTY_B_NAME' | 'AMOUNT' | 'DETAILS';
  docType?: 'IJARA_SHARTNOMASI' | 'QARZ_TILI_XATI' | 'MEHNAT_SHARTNOMASI' | 'DAVO_ARIZASI';
  partyAName?: string;
  partyAPasport?: string;
  partyBName?: string;
  amount?: string;
  details?: string;
}

export async function handleDocumentView(ctx: MyContext) {
  let html = formatHeader('📄 Avtomatik Yuridik Hujjat Yaratuvchi');
  html += `Siz bir necha soniya ichida rasmiy legal <b>PDF Shartnoma</b> va <b>Arizalar</b> tuzishingiz mumkin.\n\n`;
  html += `📌 <b>Mavjud Hujjat Turlari:</b>\n`;
  html += `1. 🏠 <b>Ijara Shartnomasi</b> (Turar joy ijarasi);\n`;
  html += `2. 💸 <b>Qarz Tili Xati</b> (Moliyaviy tilxat va qarz majburiyati);\n`;
  html += `3. 👔 <b>Mehnat Shartnomasi</b> (Xodimlarni ishga qabul qilish);\n`;
  html += `4. ⚖️ <b>Sudga Da‘vo Arizasi</b> (Aliment va nizolar bo‘yicha ariza).\n\n`;
  html += `Quyidagi tugmalardan birini tanlang:`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🏠 Ijara Shartnomasi', 'doc_type_IJARA_SHARTNOMASI')],
    [Markup.button.callback('💸 Qarz Tili Xati', 'doc_type_QARZ_TILI_XATI')],
    [Markup.button.callback('👔 Mehnat Shartnomasi', 'doc_type_MEHNAT_SHARTNOMASI')],
    [Markup.button.callback('⚖️ Sudga Da‘vo Arizasi', 'doc_type_DAVO_ARIZASI')],
  ]);

  return ctx.reply(html, { parse_mode: 'HTML', ...keyboard });
}

export async function handleDocumentTypeSelect(ctx: MyContext, docType: any) {
  await ctx.answerCbQuery();
  (ctx.session as any).docForm = {
    step: 'PARTY_A_NAME',
    docType,
  } as DocFormSession;

  let title = '1-Tomon (Ijaraga beruvchi / Qarz beruvchi / Ish beruvchi / Da‘vogar)';
  if (docType === 'QARZ_TILI_XATI') title = 'Qarz beruvchi shaxs';
  if (docType === 'DAVO_ARIZASI') title = 'Da‘vogar shaxs';

  let html = formatHeader('📝 Qadam 1 / 5: Birinchi Tomon');
  html += `Iltimos, <b>${title}</b>ning to‘liq <b>F.I.SH. (Ismi, Familiyasi, Otasining ismi)</b>ni yozib yuboring:\n\n`;
  html += `<i>Misol: Abdullayev Anvar Ikromovich</i>`;

  return ctx.reply(html, { parse_mode: 'HTML' });
}

export async function handleDocumentWizardSteps(ctx: MyContext, text: string) {
  const session = (ctx.session as any).docForm as DocFormSession;
  if (!session || !session.step) return false;

  switch (session.step) {
    case 'PARTY_A_NAME': {
      session.partyAName = text.trim();
      session.step = 'PARTY_A_PASSPORT';
      let html = formatHeader('📝 Qadam 2 / 5: Pasport Ma‘lumotlari');
      html += `<b>${escapeHTML(session.partyAName)}</b>ning Pasport seriya va raqamini kiriting (ixtiyoriy, o‘tkazib yuborish uchun <code>-</code> belgisi yuboring):\n\n`;
      html += `<i>Misol: AA 1234567</i>`;
      await ctx.reply(html, { parse_mode: 'HTML' });
      return true;
    }

    case 'PARTY_A_PASSPORT': {
      session.partyAPasport = text.trim() === '-' ? 'Kiritilmagan' : text.trim();
      session.step = 'PARTY_B_NAME';

      let title = '2-Tomon (Ijaraga oluvchi / Qarz oluvchi / Xodim / Javobgar)';
      if (session.docType === 'QARZ_TILI_XATI') title = 'Qarz oluvchi shaxs';
      if (session.docType === 'DAVO_ARIZASI') title = 'Javobgar shaxs';

      let html = formatHeader('📝 Qadam 3 / 5: Ikkinchi Tomon');
      html += `Iltimos, <b>${title}</b>ning to‘liq <b>F.I.SH.</b>ini kiriting:\n\n`;
      html += `<i>Misol: Karimov Jasur Baxtiyorovich</i>`;
      await ctx.reply(html, { parse_mode: 'HTML' });
      return true;
    }

    case 'PARTY_B_NAME': {
      session.partyBName = text.trim();
      session.step = 'AMOUNT';

      let title = 'Summa yoki To‘lov Miqdori';
      if (session.docType === 'IJARA_SHARTNOMASI') title = 'Oylik ijara to‘lovi (so‘mda)';
      if (session.docType === 'QARZ_TILI_XATI') title = 'Qarz summasi (so‘mda)';
      if (session.docType === 'MEHNAT_SHARTNOMASI') title = 'Oylik maosh (so‘mda)';
      if (session.docType === 'DAVO_ARIZASI') title = 'Da‘vo summasi (so‘mda)';

      let html = formatHeader('📝 Qadam 4 / 5: Moliyaviy Summa');
      html += `<b>${title}</b>ni kiriting:\n\n`;
      html += `<i>Misol: 3 500 000 so‘m</i>`;
      await ctx.reply(html, { parse_mode: 'HTML' });
      return true;
    }

    case 'AMOUNT': {
      session.amount = text.trim();
      session.step = 'DETAILS';

      let title = 'Manzil, Muddat va Qo‘shimcha Shartlar';
      if (session.docType === 'IJARA_SHARTNOMASI') title = 'Uy manzili va ijara muddati (masalan: Toshkent sh., Chilonzor 5-diz, 12 oy)';
      if (session.docType === 'QARZ_TILI_XATI') title = 'Qarz qaytarilish muddati (masalan: 2026-yil 31-dekabrgacha)';
      if (session.docType === 'MEHNAT_SHARTNOMASI') title = 'Lavozim nomi (masalan: Bosh buxgalter)';
      if (session.docType === 'DAVO_ARIZASI') title = 'Sud nomi va da‘vo sababi (masalan: Yakkasaroy tuman sudi, Qarz undirish)';

      let html = formatHeader('📝 Qadam 5 / 5: Yakuniy Tafsilotlar');
      html += `<b>${title}</b>ni kiriting:\n\n`;
      await ctx.reply(html, { parse_mode: 'HTML' });
      return true;
    }

    case 'DETAILS': {
      session.details = text.trim();
      await ctx.reply('⏳ <i>Sizning rasmiy PDF hujjatingiz tuzilmoqda va formatlanmoqda... Iltimos kuting.</i>', { parse_mode: 'HTML' });

      try {
        const templateParams: DocTemplateParams = {
          type: session.docType || 'IJARA_SHARTNOMASI',
          partyA: {
            name: session.partyAName || '1-Tomon',
            passport: session.partyAPasport,
          },
          partyB: {
            name: session.partyBName || '2-Tomon',
          },
          details: {
            amountOrPrice: session.amount,
            subjectAddressOrTitle: session.details,
            durationOrDate: session.details,
          },
        };

        const pdfBuffer = await DocGeneratorService.generateDocumentPdf(templateParams);

        // Clear wizard session
        delete (ctx.session as any).docForm;

        let successHtml = formatHeader('✅ PDF Hujjat Tayyor Bo‘ldi!');
        successHtml += `Sizning <b>${session.docType}</b> hujjatiningiz tayyorlandi.\n\n`;
        successHtml += `📌 <i>Ushbu PDF faylni yuklab olib, chop etishingiz va tomonlar imzolashi mumkin.</i>`;

        await ctx.replyWithDocument(
          {
            source: pdfBuffer,
            filename: `Huquqchi_${session.docType}_${Date.now()}.pdf`,
          },
          {
            caption: successHtml,
            parse_mode: 'HTML',
          }
        );
      } catch (err: any) {
        delete (ctx.session as any).docForm;
        await ctx.reply(`❌ Hujjat yaratishda xatolik yuz berdi: ${err?.message || 'Noma‘lum xato'}`);
      }
      return true;
    }
  }

  return false;
}
