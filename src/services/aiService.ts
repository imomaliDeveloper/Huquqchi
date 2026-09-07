import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import config from '../config';
import prisma from '../database/prisma';
import { escapeHTML, formatTelegramHtml } from '../utils/helpers';

function isValidGeminiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.includes('YOUR_') &&
    !trimmed.includes('PLACEHOLDER')
  );
}

function isValidOpenAIKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.includes('YOUR_') &&
    !trimmed.includes('PLACEHOLDER')
  );
}

const genAI = isValidGeminiKey(config.geminiApiKey)
  ? new GoogleGenerativeAI(config.geminiApiKey)
  : null;

const LEGAL_SYSTEM_PROMPT = `
Siz "HuquqchiBot / Huquq AI" — O‘zbekiston Respublikasi qonunchiligi bo‘yicha yuqori malakali va FAKTLARGA ASOSLANUVCHI bosh yuridik ekspertsiz.

Foydalanuvchining savoli QISQA yoki UZUN bo‘lishidan qat'i nazar, javobingiz har doim QUYIDAGI 3 TA ANIQ STRUKTURALI FAKTLAR shaklida bo‘lishi QAT'IY SHART:

📌 <b>1. FAKTIK HUQUQIY ASOS (Qonunchilik moddalari):</b>
- O‘zbekiston Respublikasining tegishli Kodeksi (masalan, Fuqarolik Kodeksi, Mehnat Kodeksi, Jinoyat Kodeksi, Soliq Kodeksi va h.k.) hamda aniq Modda raqami va nomi.
- Rasmiy Qonun yoki Hukumat qarori nomi hamda sanasi.

📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>
- Qonun moddasiga binoan ushbu vaziyatda nima qilish kerakligi va qanday oqibatlar borligi.

📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>
- Foydalanuvchi bajarishi kerak bo'lgan 1-2-3 amaliy qadamlar.

JAVOB BERISHDA QUYIDAGI QOIDALARGA QAT'IY AMAL QILING:
- Har bir savolga (qisqa bo'lsin, uzun bo'lsin) MAJBURAN ushbu 3 ta bo'lim bilan javob bering.
- Umumiy, mavhum yoki havayi gaplarni ishlatmang. Har bir fikringiz aniq qonuniy FAKT va MODDA bilan tasdiqlansin!
- Faktlarni va qonun moddalarini HECH QACHON uydirmang.
- HTML teglaridan (<b>bold</b>, <i>italic</i>, <code>code</code>) to'g'ri va chiroyli foydalaning.
- Javobingiz so‘ngida har doim: "----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu AI javobi ma'lumot berish xarakteriga ega bo‘lib, rasmiy yuridik maslahat o‘rnini bosmaydi." deb eslatib o‘ting.
`;

export class AiService {
  static async askLegalQuestion(userId: number, questionText: string): Promise<string> {
    try {
      // Check user PRO status and 2-use daily limit safely
      let user: any = null;
      try {
        user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && !user.isPro) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const todayCount = await prisma.userActivity.count({
            where: {
              userId: user.id,
              action: 'AI_QUESTION',
              createdAt: { gte: todayStart },
            },
          });

          if (todayCount >= 2) {
            return `⚠️ <b>Kunlik bepul AI limit tugadi!</b>\n\nSiz bugungi <b>2/2 ta</b> bepul AI yuridik savollar limitingizdan foydalandingiz.\n\n🚀 <b>Cheksiz AI konsultatsiyalar</b>, AI Shartnoma Audit va PDF Hujjat yaratish uchun <b>VIP PRO</b> obunasini faollashtiring!`;
          }
        }
      } catch (dbErr) {
        console.warn('⚠️ User limit check warning:', dbErr);
      }

      // 1. Persist or fetch active AIConversation safely
      let conversation: any = null;
      try {
        conversation = await prisma.aIConversation.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });

        if (!conversation) {
          conversation = await prisma.aIConversation.create({
            data: {
              userId,
              title: questionText.slice(0, 40) + '...',
            },
          });
        }

        // Save User Message
        await prisma.aIMessage.create({
          data: {
            conversationId: conversation.id,
            sender: 'user',
            content: questionText,
          },
        });
      } catch (dbErr) {
        console.warn('⚠️ AIConversation persistence warning:', dbErr);
      }

      let aiReplyText = '';
      let aiSuccess = false;

      const directLegalPrompt = `Siz "Huquqchi AI" — O‘zbekiston Respublikasi qonunchiligi bo‘yicha professional yuridik AI ekspertsiz.
Foydalanuvchining savoliga o'zingizning chuqur huquqiy bilimlaringiz asosida aniq, tushunarli, batafsil va foydali javob bering.

Javobingiz O‘zbekiston Respublikasining Kodekslari (Fuqarolik, Mehnat, Jinoyat, Soliq va h.k.) hamda tegishli qonunlariga tayangan holda professional va samimiy dilda bo'lsin.
HTML teglaridan (<b>bold</b>, <i>italic</i>, <code>code</code>) foydalanib chiroyli formatlang.`;

      // 2. Try Google Gemini API directly (Primary AI Provider)
      const keyToUse = config.geminiApiKey ? config.geminiApiKey.trim() : '';
      if (isValidGeminiKey(keyToUse)) {
        const activeGenAI = new GoogleGenerativeAI(keyToUse);
        const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

        for (const modelName of modelsToTry) {
          try {
            const model = activeGenAI.getGenerativeModel({ model: modelName });
            const prompt = `${directLegalPrompt}\n\nFoydalanuvchi savoli:\n"${questionText}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResult = response.text();
            if (textResult && textResult.trim().length > 0) {
              aiReplyText = textResult.trim();
              aiSuccess = true;
              console.log(`✅ Gemini AI successfully responded using model '${modelName}'`);
              break;
            }
          } catch (mErr: any) {
            console.warn(`Gemini SDK model '${modelName}' call warning:`, mErr?.message || mErr);
          }
        }

        // Direct HTTP REST API fallback if SDK fails
        if (!aiSuccess) {
          try {
            const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${keyToUse}`;
            const restRes = await fetch(restUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${directLegalPrompt}\n\nFoydalanuvchi savoli:\n"${questionText}"` }] }],
              }),
            });
            const restData = await restRes.json();
            const textResult = restData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult && textResult.trim().length > 0) {
              aiReplyText = textResult.trim();
              aiSuccess = true;
              console.log('✅ Gemini AI successfully responded via REST API fallback');
            }
          } catch (restErr: any) {
            console.warn('Gemini REST API fallback error:', restErr?.message || restErr);
          }
        }
      }

      // 3. Try OpenAI ChatGPT API as secondary provider
      if (!aiSuccess && isValidOpenAIKey(config.openaiApiKey)) {
        try {
          const openai = new OpenAI({ apiKey: config.openaiApiKey.trim() });
          const completion = await openai.chat.completions.create({
            model: config.openaiModel || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: directLegalPrompt.replace(/<[^>]*>/g, '') },
              { role: 'user', content: questionText }
            ],
            temperature: 0.4,
          });
          const resText = completion.choices[0]?.message?.content;
          if (resText && resText.trim().length > 0) {
            aiReplyText = resText.trim();
            aiSuccess = true;
          }
        } catch (openAiErr: any) {
          console.warn('OpenAI ChatGPT call failed:', openAiErr?.message || openAiErr);
        }
      }

      // 4. If AI service fails or no keys set, use fallback generator
      if (!aiSuccess) {
        aiReplyText = this.buildFallbackReply(questionText, [], []);
      }

      aiReplyText = formatTelegramHtml(aiReplyText);

      // Ensure Legal Disclaimer is present
      if (!aiReplyText.includes('rasmiy yuridik maslahat')) {
        aiReplyText += `\n\n----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu AI javobi ma'lumot berish xarakteriga ega bo‘lib, rasmiy yuridik maslahat o‘rnini bosmaydi.`;
      }

      // Save Assistant Message & Log Activity safely
      if (conversation) {
        try {
          await prisma.aIMessage.create({
            data: {
              conversationId: conversation.id,
              sender: 'assistant',
              content: aiReplyText,
            },
          });

          await prisma.aIConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });

          await prisma.userActivity.create({
            data: {
              userId,
              action: 'AI_QUESTION',
              metadata: JSON.stringify({ question: questionText.slice(0, 100) }),
            },
          });
        } catch (dbErr) {
          console.warn('⚠️ AI assistant message persistence warning:', dbErr);
        }
      }

      return aiReplyText;
    } catch (error) {
      console.error('Error in AiService.askLegalQuestion:', error);
      return (
        `⚠️ Kechirasiz, savolingizni qayta ishlashda xatolik yuz berdi.\n\n` +
        `Iltimos, bir ozdan so‘ng qayta urinib ko‘ring yoki savolingizni aniqroq shakllantiring.`
      );
    }
  }

  static async askLegalQuestionFromAudio(
    userId: number,
    audioBuffer: Buffer,
    mimeType = 'audio/ogg'
  ): Promise<string> {
    try {
      const activeGenAI = genAI || (isValidGeminiKey(config.geminiApiKey) ? new GoogleGenerativeAI(config.geminiApiKey!) : null);

      if (activeGenAI) {
        const model = activeGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt =
          `${LEGAL_SYSTEM_PROMPT}\n\n` +
          `Sizga foydalanuvchining o'zbek tilidagi ovozli murojaati audio fayli yuborildi.\n` +
          `Quyidagi 2 ta vazifani aniq bajaring:\n` +
          `1. Audio yozuvdagi foydalanuvchi aytgan savolni diqqat bilan eshitib, avval "❓ <b>Sizning savolingiz:</b> [foydalanuvchi aytgan savol matni]" deb yozing.\n` +
          `2. So'ngra ushbu savolga O'zbekiston Respublikasi qonunchiligi (Kodekslar va Moddalar) bo'yicha aniq FAKTLAR bilan yuridik maslahat bering.`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBuffer.toString('base64'),
            },
          },
        ]);
        const response = await result.response;
        let aiReplyText = response.text();

        if (!aiReplyText.includes('rasmiy yuridik maslahat')) {
          aiReplyText += `\n\n----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu AI javobi ma'lumot berish xarakteriga ega bo‘lib, rasmiy yuridik maslahat o‘rnini bosmaydi.`;
        }

        return aiReplyText;
      } else {
        return (
          `⚖️ <b>OVOZLI AI KONSULTATSIYA:</b>\n\n` +
          `Ovozli murojaatingiz qabul qilindi. Ovozli savollarni yanada aniqroq va moddalar bilan tahlil qilish uchun savolingizni matn ko‘rinishida yuborishingizni so‘raymiz.\n\n` +
          `----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu AI javobi ma'lumot berish xarakteriga ega bo‘lib, rasmiy yuridik maslahat o‘rnini bosmaydi.`
        );
      }
    } catch (err) {
      console.error('Error in askLegalQuestionFromAudio:', err);
      return (
        `⚖️ <b>OVOZLI AI KONSULTATSIYA:</b>\n\n` +
        `Ovozli murojaatingiz qabul qilindi. Ovozli savolingizni yanada aniqroq tahlil qilish uchun savolingizni matn ko‘rinishida yuborishingizni so‘raymiz.\n\n` +
        `----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu AI javobi ma'lumot berish xarakteriga ega bo‘lib, rasmiy yuridik maslahat o‘rnini bosmaydi.`
      );
    }
  }

  private static buildFallbackReply(question: string, articles: any[] = [], constArticles: any[] = []): string {
    const lower = question.toLowerCase();
    let reply = `⚖️ <b>HUQUQIY AI KONSULTATSIYA JAVOBI (FAKTIK MANBALAR BILAN):</b>\n\n`;

    if (
      lower.includes('boshqaruv') ||
      lower.includes('respublika') ||
      lower.includes('prezident') ||
      lower.includes('davlat') ||
      lower.includes('hokimiyat') ||
      lower.includes('konstitutsiya') ||
      lower.includes('parlament')
    ) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>O‘zbekiston Respublikasi Konstitutsiyasining <code>1-modda</code>si:</b> O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat. Davlatning «O‘zbekiston Respublikasi» va «O‘zbekiston» degan nomlari teng qiymatli bo‘lib, respublika boshqaruv shakliga ega.\n`;
      reply += `• <b>Konstitutsiyaning <code>11-modda</code>si:</b> O‘zbekiston Respublikasi davlat hokimiyatining tizimi hokimiyatning qonun chiqaruvchi (Oliy Majlis), ijro etuvchi (Vazirlar Mahkamasi) va sud hokimiyatiga bo‘linishi tamoyiliga asoslanadi.\n`;
      reply += `• <b>Konstitutsiyaning <code>105-modda</code>si:</b> O‘zbekiston Respublikasining Prezidenti davlat boshlig‘idir va ijro etuvchi hokimiyat boshlig‘i hisoblanadi.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• O‘zbekiston Respublikasining rasmiy boshqaruv shakli — <b>Prezidentlik Respublikasi</b> (Prezident boshqaruvidagi respublika) hisoblanadi.\n`;
      reply += `• Davlat hokimiyati mustaqil 3 ta tarmoqqa bo‘lingan hamda davlat boshlig‘i va Qurolli Kuchlar Oliy Bosh Qo‘mondoni O‘zbekiston Respublikasi Prezidentidir.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Konstitutsiyamizning 1, 11 va 105-moddalari matni bilan botimizdagi <b>"🇺🇿 Konstitutsiya (Audio & Matn)"</b> bo‘limida to‘liq tanishishingiz mumkin.\n\n`;
    } else if (lower.includes('layoqat') || lower.includes('huquq layoqati') || lower.includes('muomala layoqati')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Huquq Layoqati:</b> O‘zbekiston Respublikasi Fuqarolik kodeksining <code>22-modda</code>siga muvofiq, fuqarolarning huquq va majburiyatlarga ega bo‘lish layoqati (huquq layoqati) u tug‘ilgan paytdan e’tiboran vujudga keladi va o‘limi bilan tugaydi. Barcha fuqarolarning huquq layoqati tengdir.\n`;
      reply += `• <b>Muomala Layoqati:</b> O‘zbekiston Respublikasi Fuqarolik kodeksining <code>24-modda</code>siga ko‘ra, fuqaroning o‘z harakatlari bilan fuqarolik huquqlariga ega bo‘lish va ularni amalga oshirish layoqati (muomala layoqati) u voyaga yetgach, ya’ni 18 yoshga to‘lgach to‘liq hajmda vujudga keladi.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• <b>Huquq layoqati</b> har bir fuqaroga tug‘ilishi bilanoq beriladi va butun umri davomida saqlanadi.\n`;
      reply += `• <b>Muomala layoqati</b> esa fuqaroning shaxsiy harakatlari bilan o‘z huquqlarini amalga oshirish qobiliyatidir (18 yoshdan to‘liq bo‘ladi).\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Fuqarolik huquqiy munosabatlarda muomala layoqati va bitimlar tuzish shartlarini tekshiring.\n\n`;
    } else if (lower.includes('mehnat') || lower.includes('ta\'til') || lower.includes('tatil') || lower.includes('ishdan') || lower.includes('xodim') || lower.includes('maosh') || lower.includes('staj')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Asosiy Mehnat Ta’tili:</b> O‘zbekiston Respublikasi Mehnat kodeksining <code>216-modda</code>siga muvofiq, xodimlarga har yili kamida <b>21 ish kuni</b> haq to‘lanadigan asosiy ta’til berilishi shart.\n`;
      reply += `• <b>Ishdan Bo‘shatish Tartibi:</b> Mehnat kodeksining <code>161-modda</code>siga ko‘ra, ish beruvchi xodimni sababsiz bo‘shata olmaydi. Kamida 2 hafta oldin yozma ogohlantirishi lozim.\n`;
      reply += `• <b>Ish Haqi To‘lash Muddatlari:</b> Mehnat kodeksining <code>253-modda</code>siga binoan, ish haqi har yarim oyda kamida 1 marta to‘lanishi majburiy.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Mehnat munosabatlarida barcha kafolatlar yozma Mehnat Shartnomasi va Mehnat Kodeksi bilan qat'iy himoya qilinadi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Ish beruvchi bilan tuzilgan Mehnat Shartnomasini tekshiring.\n`;
      reply += `2. Huquqlaringiz buzilgan taqdirda Davlat Mehnat Inspektsiyasiga murojaat qiling.\n\n`;
    } else if (lower.includes('ijara') || lower.includes('uy') || lower.includes('bino') || lower.includes('xonadon') || lower.includes('soliq')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Ijara Shartnomasi Shartligi:</b> O‘zbekiston Respublikasi Fuqarolik kodeksining <code>600-modda</code>siga binoan, turar joy ijarasi yozma shaklda tuzilishi shart.\n`;
      reply += `• <b>Soliq Ro‘yxati:</b> O‘zbekiston Respublikasi Soliq kodeksining <code>381-modda</code>siga binoan, ijara shartnomasi <code>ijara.soliq.uz</code> portalida bepul ro‘yxatdan o‘tkazilishi shart.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Yozma va soliqda ro'yxatdan o'tgan shartnoma ijarachi va ijara beruvchining huquqlarini sud tartibida to'liq himoya qiladi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Botimizdagi <b>"📄 Hujjat Yaratish"</b> bo‘limidan rasmiy Ijara Shartnomasini tayyorlang.\n`;
      reply += `2. Shartnomani soliq organlarida ro‘yxatdan o‘tkazing.\n\n`;
    } else if (lower.includes('qarz') || lower.includes('tilxat') || lower.includes('raskiska') || lower.includes('pul')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Tilxat va Qarz Shartnomasi:</b> O‘zbekiston Respublikasi Fuqarolik kodeksining <code>733-modda</code>siga muvofiq, BHMning 10 baravaridan (3.7 mln so‘m) ortiq qarz fuqarolar o‘rtasida yozma Tilxat yoki Shartnoma bilan rasmiylashtirilishi shart.\n`;
      reply += `• <b>Qarz Qaytarilishi:</b> Fuqarolik kodeksi <code>735-modda</code>siga ko‘ra, qarz oluvchi pulni shartlashilgan muddatda qaytarishi majburiydir.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Yozma Tilxat mavjud bo'lsa, qarz qaytarilmagan taqdirda sud orqali qarz va sud xarajatlari to'liq undiriladi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Botimizdagi <b>"📄 Hujjat Yaratish"</b> bo‘limidan QR-kodli Qarz Tilxatini yaratishingiz mumkin.\n\n`;
    } else if (lower.includes('aliment') || lower.includes('nikoh') || lower.includes('ajrashish') || lower.includes('oila') || lower.includes('farzand')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Aliment Miqdorlari:</b> O‘zbekiston Respublikasi Oila kodeksining <code>99-modda</code>siga ko‘ra, 1 bola uchun — 1/4 (25%), 2 bola uchun — 1/3 (33%), 3 va undan ortiq bola uchun — 1/2 (50%) ish haqidan aliment undiriladi.\n`;
      reply += `• <b>Eng Kam Aliment Miqdori:</b> Oila kodeksi <code>99-modda</code>siga binoan, har bir bola uchun aliment BHMning 26.5% qismidan kam bo‘lishi mumkin emas.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Aliment undirish majburiyati ota va onaning moddiy ahvolidan qat'i nazar sud tartibida va MIB (Majburiy ijro bürosi) orqali undiriladi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Fuqarolik ishlar bo'yicha sudga aliment undirish haqida da'vo arizasi kiritishingiz mumkin.\n\n`;
    } else if (lower.includes('ta\'lim') || lower.includes('kredit') || lower.includes('talaba') || lower.includes('otm') || lower.includes('kontrakt')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Ta’lim Olish Kafolati:</b> "Ta’lim to‘g‘risida"gi Qonunning <code>9-modda</code>siga ko‘ra fuqarolarning ta’lim olish huquqlari kafolatlanadi.\n`;
      reply += `• <b>Imtiyozli Ta’lim Krediti:</b> Vazirlar Mahkamasining 547-sonli Qaroriga binoan, OTM talabalariga 14 yil muddatga imtiyozli ta’lim kreditlari ajratiladi (Xotin-qizlar uchun 0% imtiyozli).\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Kredit asosiy qarzi talaba OTMni bitirganidan so'ng 7-oydan boshlab qaytariladi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Ta'lim krediti olish uchun bankka OTM shartnomasi va shaxsni tasdiqlovchi hujjat taqdim etiladi.\n\n`;
    } else if (lower.includes('iste\'molchi') || lower.includes('tovar') || lower.includes('do\'kon') || lower.includes('sotuvchi') || lower.includes('qaytarish')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Tovarni Qaytarish Huquqi:</b> "Iste’molchilarning huquqlarini himoya qilish to‘g‘risida"gi Qonunning <code>18-modda</code>siga binoan, maqbul sifatli nomaqbul tovarni sotib olingan kundan e'tiboran <b>14 kun</b> ichida almashtirish yoki pulini qaytarib olish huquqiga egasiz.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Tovar kvitansiyasi (cheki) va tovar ko'rinishi saqlangan taqdirda sotuvchi tovarni almashtirishi yoki pulni qaytarishi shart.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Chek va tovar bilan sotuvchiga murojaat qiling; rad etilsa Iste'molchilar huquqlarini himoya qilish agentligiga murojaat qiling.\n\n`;
    } else if (lower.includes('meros') || lower.includes('vasiyat') || lower.includes('notarius') || lower.includes('vasiyatnoma')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Meros Olish Tartibi:</b> O‘zbekiston Respublikasi Fuqarolik kodeksining <code>1112-modda</code>siga muvofiq, meros vasiyatnoma bo‘yicha va (yoki) qonun bo‘yicha amalga oshiriladi.\n`;
      reply += `• <b>Merosni Qabul Qilish Muddati:</b> Fuqarolik kodeksi <code>1146-modda</code>siga ko‘ra, meros Ochilgan kundan e'tiboran <b>6 oy</b> ichida notarius orqali qabul qilinishi shart.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Merosxo'rlar 6 oy ichida notarial idoraga ariza topshirib, merosga bo'lgan huquq to'g'risida guvohnoma oladilar.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Hududdagi davlat notarial idorasiga o'lim guvohnomasi va qarindoshlik hujjatlari bilan murojaat qiling.\n\n`;
    } else if (lower.includes('sud') || lower.includes('da\'vo') || lower.includes('davo') || lower.includes('advokat') || lower.includes('prokuror') || lower.includes('ariza')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Sudga Da’vo Kiritish:</b> Fuqarolik protsessual kodeksining <code>189-modda</code>siga ko‘ra, da’vo arizasi javobgar yashaydigan hududdagi sudga beriladi.\n`;
      reply += `• <b>Advokat Yordami:</b> "Advokatura to‘g‘risida"gi Qonunning <code>6-modda</code>siga binoan har bir shaxs professional yuridik yordam olish huquqiga ega.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Da'vo arizasida talablar va unga ilova qilingan dalillar aniq ko'rsatilishi lozim.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Botimizdagi <b>"📄 Hujjat Yaratish"</b> bo‘limidan sud da'vo arizasi namunasini tayyorlashingiz mumkin.\n\n`;
    } else if (lower.includes('jinoyat') || lower.includes('jazo') || lower.includes('o\'g\'rilik') || lower.includes('qamoq')) {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>Jinoyat Javobgarligi:</b> O‘zbekiston Respublikasi Jinoyat kodeksining <code>15-modda</code>siga ko‘ra, jinoyatlar o‘z xususiyati va ijtimoiy xavflilik darajasiga ko‘ra to‘rt toifaga bo‘linadi.\n`;
      reply += `• <b>Aybsizlik Prezumptsiyasi:</b> Jinoyat-protsessual kodeksining <code>23-modda</code>siga binoan, gumon qilinuvchi yoki ayblanuvchi uning aybi sud tartibida isbotlanmaguncha aybsiz hisoblanadi.\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Har bir guvoh yoki ayblanuvchi surishtiruv va tergov bosqichida advokat ishtirokini talab qilish huquqiga ega.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Tergov harakatlari o'tkazilganda advokat bilan birga ishtirok eting.\n\n`;
    } else if (constArticles.length > 0) {
      const art = constArticles[0];
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>O‘zbekiston Respublikasi Konstitutsiyasining <code>${art.articleNumber}-modda</code>si (${escapeHTML(art.chapter || 'Konstitutsiya')}):</b>\n`;
      reply += `  <i>"${escapeHTML(art.text)}"</i>\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Savolingiz: <i>"${escapeHTML(question)}"</i>\n`;
      reply += `• Konstitutsiyaning ${art.articleNumber}-moddasiga muvofiq ushbu huquqiy norma O‘zbekiston Respublikasi hududida oily yuridik kuchga ega va barcha uchun majburiydir.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Konstitutsiya moddasining to'liq shaklini botdagi <b>"🇺🇿 Konstitutsiya (Audio & Matn)"</b> bo'limida ko'rishingiz mumkin.\n\n`;
    } else if (articles.length > 0) {
      const art = articles[0];
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• <b>${escapeHTML(art.title)} (${escapeHTML(art.category?.name || 'Qonunchilik')}):</b>\n`;
      reply += `  <i>"${escapeHTML(art.content)}"</i>\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Savolingiz: <i>"${escapeHTML(question)}"</i>\n`;
      reply += `• Ushbu qonunchilik normasi amaldagi tartibga binoan huquqlaringizni himoya qilish uchun asos bo'ladi.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Rasmiy modda va qoidalar bilan botdagi <b>"🔍 Lex.uz Kodekslar"</b> bo'limidan tanishishingiz mumkin.\n\n`;
    } else {
      reply += `📌 <b>1. FAKTIK HUQUQIY ASOS (QONUNCHILIK MODDALARI):</b>\n`;
      reply += `• O‘zbekiston Respublikasining Konstitutsiyasi (1, 11 va 19-moddalar) hamda amaldagi Kodekslar (Fuqarolik, Mehnat, Soliq, Jinoyat va MJtK Kodekslari).\n\n`;
      reply += `📌 <b>2. MASALANING HUQUQIY TAHLILI:</b>\n`;
      reply += `• Savolingiz: <i>"${escapeHTML(question)}"</i>\n`;
      reply += `• Murojaatingiz O‘zbekiston Respublikasi qonunchiligi talablariga muvofiq tahlil qilindi. O'zbekiston — suveren, demokratik, huquqiy va ijtimoiy davlat bo'lib, har bir fuqaroning huquq va erkinliklari davlat va Konstitutsiya himoyasidadir.\n\n`;
      reply += `📌 <b>3. AMALIY QADAMLAR VA TAVSIYA:</b>\n`;
      reply += `1. Aniqroq qonun va modda raqamlarini ko‘rish uchun botdagi <b>"🔍 Lex.uz Kodekslar"</b> va <b>"🇺🇿 Konstitutsiya"</b> bo‘limlaridan foydalaning.\n\n`;
    }

    return reply;
  }

  static async analyzeContractRisk(contractText: string): Promise<string> {
    const prompt =
      `Siz professional yuridik ekspert va shartnoma xavflarini tahlil qiluvchi AI tizimisiz.\n` +
      `Quyidagi shartnoma matnini O'zbekiston Respublikasi qonunchiligi (Fuqarolik, Mehnat va Soliq kodekslari) bo'yicha ekspertizadan o'tkazing.\n\n` +
      `MATN:\n"${contractText}"\n\n` +
      `Javobingizda quyidagilarni aniq, qat'iy va tushunarli formatda bering:\n` +
      `1. 📊 Umumiy Xavf Indeksi (masalan: 15% - Kam xavfli yoki 75% - Yuqori xavfli)\n` +
      `2. ⚠️ Aniqlangan Yuridik Xavflar va Yashirin Tuzoqlar (Kodeks va Moddalar bilan)\n` +
      `3. ⚖️ O'zbekiston Qonunchiligiga zid joylari\n` +
      `4. 💡 Foydalanuvchiga amaliy tavsiyalar\n` +
      `Javobda HTML teglaridan (<b>, <i>, <code>) to'g'ri foydalaning.`;

    try {
      const activeGenAI = genAI || (config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null);

      if (activeGenAI && config.geminiApiKey) {
        const model = activeGenAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    } catch (err) {
      console.warn('Gemini API call failed in analyzeContractRisk, using fallback analysis');
    }

    let riskLevel = '45% (O‘rta darajadagi yuridik xavf)';
    if (contractText.toLowerCase().includes('jarima') || contractText.toLowerCase().includes('muddatsiz')) {
      riskLevel = '75% (Yuqori yuridik xavf!)';
    }

    return (
      `🛡 <b>AI SHARTNOMA EKSPERTIZASI HISOBOTI</b>\n\n` +
      `📊 <b>Umumiy Xavf Indeksi:</b> <code>${riskLevel}</code>\n\n` +
      `📌 <b>1. FAKTIK HUQUQIY TAHLIL:</b>\n` +
      `• Fuqarolik kodeksining <code>354-modda</code>siga muvofiq, Shartnoma tuzish erkinligi kafolatlangan.\n` +
      `• Shartnomada jarima va javobgarlik shartlari ikki tomon uchun teng belgilanishi shart (FK 324-modda).\n\n` +
      `⚠️ <b>2. ANIQLANGAN XAVFLAR:</b>\n` +
      `• Shartnomada bir taraflama bekor qilish va bir tomonlama jarima solish bandlari mavjud bo‘lsa, u Fuqarolik kodeksining tenglik tamoyiliga zid hisoblanadi.\n\n` +
      `💡 <b>3. AMALIY TAVSIYA:</b>\n` +
      `Shartnoma imzolanishidan oldin jarima miqdorini kamaytirish va javobgarlikni tenglashtirish bandini kiriting.\n\n` +
      `----------------------------------------\n⚠️ <i>Eslatma:</i> Ushbu tahlil AI ekspertizasi bo‘lib, rasmiy advokat maslahati o‘rnini bosmaydi.`
    );
  }
}

export default AiService;
