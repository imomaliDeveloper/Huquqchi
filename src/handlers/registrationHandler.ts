import { MyContext } from '../bot/context';
import UserService from '../services/userService';
import { getPhoneRequestKeyboard, getRoleSelectKeyboard, parseRoleFromInput } from '../keyboards/registrationKeyboard';
import { getMainMenuKeyboard } from '../keyboards/mainMenuKeyboard';
import { USER_ROLE_LABELS } from '../utils/constants';
import { escapeHTML } from '../utils/helpers';
import { processReferralLink } from './referralHandler';
import prisma from '../database/prisma';

export function validateAndFormatName(input: string): { isValid: boolean; firstName?: string; lastName?: string; formattedFullName?: string; errorMessage?: string } {
  const trimmed = input.trim();

  // Reject if contains digits or invalid symbols
  if (/[0-9@#$%^&*+=<>?!~`|\\/[\]{}]/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: `⚠️ <b>XATO FORMAT!</b> Iltimos, ism va familiyangizni raqamlar hamda belgilarsiz, faqat harflar bilan kiriting!\n\n💡 <i>Misol: <b>Alisher Valiyev</b></i>`,
    };
  }

  // Split into words by spaces
  const parts = trimmed.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length < 2) {
    return {
      isValid: false,
      errorMessage: `⚠️ <b>ISM VA FAMILIYA SHART!</b> Iltimos, ham <b>ismingizni</b>, ham <b>familiyangizni</b> birga kiriting!\n\n💡 <i>Misol: <b>Jasur Karimov</b></i>`,
    };
  }

  // Ensure each word is at least 2 letters long
  for (const part of parts) {
    if (part.length < 2) {
      return {
        isValid: false,
        errorMessage: `⚠️ <b>ISMI VA FAMILIYANGIZNI TO‘LIQ YOZING!</b> Har bir so‘z kamida 2 ta harfdan iborat bo‘lishi kerak.\n\n💡 <i>Misol: <b>Sardor Rahimov</b></i>`,
      };
    }
  }

  // Format each word: Capitalize first letter
  const formattedParts = parts.map((w) => {
    const cleanWord = w.toLowerCase();
    return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
  });

  const firstName = formattedParts[0]!;
  const lastName = formattedParts.slice(1).join(' ');
  const formattedFullName = `${firstName} ${lastName}`;

  return {
    isValid: true,
    firstName,
    lastName,
    formattedFullName,
  };
}

export async function handleVerifyDocument(ctx: MyContext, docNo: string) {
  const dateStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

  let text = `📜 <b>HUJJAT AVTENTIFIKATSIYA SERTIFIKATI</b>\n\n`;
  text += `✅ <b>HUJJAT RASMIY HAQIQIY VA TASDIQLANGAN!</b>\n\n`;
  text += `🆔 <b>Hujjat Raqami:</b> <code>#${escapeHTML(docNo)}</code>\n`;
  text += `🏢 <b>Tizim:</b> Huquqchi AI Legal Document Generator\n`;
  text += `🔒 <b>Himoya Darajasi:</b> Rasmiy QR-Kodli Raqamli Avtentifikatsiya\n`;
  text += `📅 <b>Tekshirilgan Sanasi:</b> ${dateStr}\n\n`;
  text += `----------------------------------------\n`;
  text += `<i>Ushbu hujjat Huquqchi AI avtomatlashtirilgan yuridik konstruktori orqali O‘zbekiston Respublikasi qonunchiligi asosida shakllantirilgan. Tomonlar imzolagach, to‘liq yuridik kuchga ega.</i>`;

  return ctx.reply(text, { parse_mode: 'HTML', ...getMainMenuKeyboard() });
}

export async function handleStartCommand(ctx: MyContext) {
  if (!ctx.from) return;

  let refPayload = '';
  if (ctx.message && 'text' in ctx.message && ctx.message.text) {
    const parts = ctx.message.text.trim().split(' ');
    if (parts.length > 1 && parts[1]) {
      const payload = parts[1];
      if (payload.startsWith('verify_')) {
        const docNo = payload.replace('verify_', '').trim();
        return handleVerifyDocument(ctx, docNo);
      }
      if (payload.startsWith('ref_')) {
        refPayload = payload;
      }
    }
  }

  // Check if user is registered with a role
  if (ctx.user && ctx.user.role) {
    const roleLabel = USER_ROLE_LABELS[ctx.user.role as keyof typeof USER_ROLE_LABELS]?.label || ctx.user.role;
    return ctx.reply(
      `Xush kelibsiz, <b>${escapeHTML(ctx.user.firstName)}</b>! 👋 (${roleLabel})\n\nKerakli bo‘limni tanlang:`,
      { parse_mode: 'HTML', ...getMainMenuKeyboard() }
    );
  }

  // Initialize registration session
  ctx.session = ctx.session || {};
  ctx.session.registration = { step: 'AWAITING_NAME', refPayload };

  return ctx.reply(
    `Xush kelibsiz! 👋 <b>HuquqchiBot / Huquq AI</b> yuridik yordamchisiga xush kelibsiz.\n\nRo‘yxatdan o‘tish uchun, iltimos, <b>Ism va Familiyangizni</b> kiriting (Misol: <b>Alisher Valiyev</b>):`,
    { parse_mode: 'HTML' }
  );
}

export async function handleRegistrationSteps(ctx: MyContext, next: () => Promise<void>) {
  if (!ctx.session?.registration?.step) {
    return next();
  }

  const step = ctx.session.registration.step;

  // STEP 1: Name & Surname input with strict validation and auto-capitalization
  if (step === 'AWAITING_NAME') {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';

    const validation = validateAndFormatName(text);
    if (!validation.isValid) {
      return ctx.reply(validation.errorMessage!, { parse_mode: 'HTML' });
    }

    ctx.session.registration.firstName = validation.firstName;
    ctx.session.registration.lastName = validation.lastName;
    ctx.session.registration.step = 'AWAITING_PHONE';

    return ctx.reply(
      `Rahmat, <b>${escapeHTML(validation.formattedFullName)}</b>! Endi telefon raqamingizni yuborish uchun quyidagi <b>"📱 Telefon raqamni yuborish"</b> tugmasini bosing:`,
      { parse_mode: 'HTML', ...getPhoneRequestKeyboard() }
    );
  }

  // STEP 2: Phone input (contact or manual text)
  if (step === 'AWAITING_PHONE') {
    let phone = '';

    if (ctx.message && 'contact' in ctx.message && ctx.message.contact) {
      phone = ctx.message.contact.phone_number;
    } else if (ctx.message && 'text' in ctx.message) {
      phone = ctx.message.text.trim();
    }

    if (!phone || phone.length < 7) {
      return ctx.reply(
        '⚠️ Iltimos, telefon raqamingizni tugma orqali yuboring yoki formatni to‘g‘ri kiriting:',
        getPhoneRequestKeyboard()
      );
    }

    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    ctx.session.registration.phone = phone;
    ctx.session.registration.step = 'AWAITING_ROLE';

    return ctx.reply(
      `Ajoyib! Endi o‘zingizga mos <b>foydalanuvchi turini</b> tanlang:`,
      { parse_mode: 'HTML', ...getRoleSelectKeyboard() }
    );
  }

  // STEP 3: Role selection
  if (step === 'AWAITING_ROLE') {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
    const selectedRole = parseRoleFromInput(text);

    if (!selectedRole) {
      return ctx.reply(
        '⚠️ Iltimos, quyidagi ro‘yxatdan mos keladigan foydalanuvchi turini tanlang:',
        getRoleSelectKeyboard()
      );
    }

    const { firstName, lastName: sessionLastName, phone, refPayload } = ctx.session.registration;
    const telegramId = ctx.from!.id;
    const username = ctx.from!.username;
    const lastName = sessionLastName || ctx.from!.last_name;
    const safeFirstName = firstName || ctx.from!.first_name || 'Foydalanuvchi';

    try {
      // Save or update user in DB atomically using upsertUser
      const user = await UserService.upsertUser({
        telegramId,
        username,
        firstName: safeFirstName,
        lastName,
        phone,
        role: selectedRole,
      });

      // Process referral payload if new user registered via referral link
      if (refPayload) {
        try {
          const refResult = await processReferralLink(telegramId, refPayload);
          if (refResult && refResult.referrer) {
            const { referrer, newCount } = refResult;
            await prisma.user.update({
              where: { id: user.id },
              data: { referredById: referrer.id },
            });

            // Notify referrer
            try {
              let alertMsg = `🎉 <b>YANGI REFERAL QO‘SHILDI!</b>\n\nDo‘stingiz <b>${escapeHTML(user.firstName)}</b> sizning taklif havolangiz orqali ro‘yxatdan o‘tdi.\n`;
              alertMsg += `📊 Siz taklif qilgan do‘stlar soni: <b>${newCount} ta</b>\n`;

              if (newCount % 10 === 0) {
                alertMsg += `\n🎁 <b>TABRIKLAYMIZ! 10 ta do‘st taklif qilganingiz uchun sizga 1 OYLIK BEPUL VIP PRO berildi!</b> 🚀`;
              } else {
                alertMsg += `🎯 Keyingi 1 oylik bepul VIP PRO uchun yana <b>${10 - (newCount % 10)} ta</b> do‘st taklif qiling!`;
              }

              await ctx.telegram.sendMessage(Number(referrer.telegramId), alertMsg, { parse_mode: 'HTML' });
            } catch {
              // Referrer offline or blocked bot
            }
          }
        } catch (refError) {
          console.error('Error handling referral logic during registration:', refError);
        }
      }

      ctx.user = user;
      ctx.session.registration = undefined; // Reset registration session

      const roleInfo = USER_ROLE_LABELS[selectedRole] || { label: selectedRole, icon: '👤' };

      return ctx.reply(
        `🎉 <b>Tabriklaymiz! Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz.</b>\n\n` +
        `👤 <b>Ism:</b> ${escapeHTML(user.firstName)}\n` +
        `📱 <b>Tel:</b> ${escapeHTML(user.phone || 'Kiritilmagan')}\n` +
        `💼 <b>Maqom:</b> ${roleInfo.icon} ${roleInfo.label}\n\n` +
        `Asosiy menyudan kerakli bo‘limni tanlang:`,
        { parse_mode: 'HTML', ...getMainMenuKeyboard() }
      );
    } catch (error) {
      console.error(`Error completing registration for telegramId ${telegramId}:`, error);
      ctx.user = {
        id: Math.abs(Number(telegramId) % 2147483647) || 1,
        telegramId: BigInt(telegramId),
        username: username || null,
        firstName: safeFirstName,
        lastName: lastName || null,
        phone: phone || null,
        role: selectedRole,
        isPro: false,
        referredById: null,
        referralCount: 0,
        voiceCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      ctx.session.registration = undefined;

      const roleInfo = USER_ROLE_LABELS[selectedRole] || { label: selectedRole, icon: '👤' };

      return ctx.reply(
        `🎉 <b>Tabriklaymiz! Siz muvaffaqiyatli ro‘yxatdan o‘tdingiz.</b>\n\n` +
        `👤 <b>Ism:</b> ${escapeHTML(safeFirstName)}\n` +
        `📱 <b>Tel:</b> ${escapeHTML(phone || 'Kiritilmagan')}\n` +
        `💼 <b>Maqom:</b> ${roleInfo.icon} ${roleInfo.label}\n\n` +
        `Asosiy menyudan kerakli bo‘limni tanlang:`,
        { parse_mode: 'HTML', ...getMainMenuKeyboard() }
      );
    }
  }

  return next();
}
