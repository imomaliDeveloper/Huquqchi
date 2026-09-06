import { MyContext } from '../bot/context';

export async function handleAboutView(ctx: MyContext) {
  const text =
    `ℹ️ <b>"HuquqchiBot / Huquq AI" Haqida</b>\n\n` +
    `Ushbu Telegram bot O‘zbekiston fuqarolari, abituriyentlar, talabalar, tadbirkorlar va yuristlar uchun huquqiy savollarga tezkor va ishonchli javob olish, huquqiy bilimlarni oshirish hamda testlar ishlash uchun maxsus yaratilgan professional yuridik platformadir.\n\n` +
    `💡 <b>Asosiy imkoniyatlar:</b>\n` +
    `• ⚖️ <b>Huquqiy AI</b>: Google Gemini AI orqali huquqiy savollaringizga aqlli javoblar.\n` +
    `• 💼 <b>Yuridik xizmatlar</b>: Professional advokatlar va yuristlarga rasmiy murojaat yuborish.\n` +
    `• 📚 <b>Huquqiy bilimlar</b>: Kodekslar, PDF kitoblar va qonunlar bo‘yicha tartiblangan maqolalar.\n` +
    `• 📝 <b>Testlar & Milliy Sertifikat</b>: Huquqiy bilimlaringizni sinash hamda DTM Milliy sertifikatiga tayyorgarlik.\n` +
    `• 🔎 <b>Qidiruv</b>: Kerakli modda va mavzularni kalit so‘z orqali topish.`;

  return ctx.reply(text, { parse_mode: 'HTML' });
}
