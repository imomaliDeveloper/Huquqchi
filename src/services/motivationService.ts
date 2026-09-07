import { Telegraf } from 'telegraf';
import { MyContext } from '../bot/context';
import prisma from '../database/prisma';
import { ExamScraperService } from './examScraperService';

export const MOTIVATION_QUOTES = [
  "«Aql - bilim olish bilan, muvaffaqiyat esa sabr bilan keladi.» Imtihonga oz vaqt qoldi, har bir daqiqa sizni orzuingizdagi TDYU va yuristlik maqomiga yaqinlashtirmoqda! ⚖️",
  "«Qonunlarni bilgan inson har qanday vaziyatda g‘olibdir.» Bugun 1 soat ajratib ishlagan testingiz, ertaga imtihondagi Grant balingizni hal qiladi! 💪",
  "«Niyat qil va harakatni to‘xtatma!» Abituriyentlik davri - hayotingizdagi eng muhim burilish nuqtasi. Bugun o‘z kelajagingiz uchun kurashing! 🎓",
  "«G‘alaba - bu tasodif emas, bu har kungi tinimsiz mehnat natijasidir.» Kodeks va moddalarni qaytarishni bugunoq boshlang! 📚",
  "«Kelajak shifokorlari va yuristlari bugun tayyorlanadi.» O‘zingizga ishoning, siz albatta Milliy Sertifikatda A+ darajasini olasiz! 🌟",
  "«Qiyinchiliklar vaqtincha, lekin erishilgan yutug‘ingiz bir umrlikdir!» Bugun erinmang, har bir ishlangan test savoli g‘alabangiz kalitidir! 🔑"
];

export class MotivationService {
  /**
   * Broadcast daily motivation message with countdown & inline web app button to all users
   */
  public static async broadcastDailyMotivation(bot: Telegraf<MyContext>): Promise<{ totalUsers: number; successCount: number; failCount: number }> {
    console.log('📣 [MotivationService] Har kungi motivatsiya xabarini foydalanuvchilarga yuborish boshlandi...');
    
    let successCount = 0;
    let failCount = 0;

    try {
      // 1. Get current exam config and days remaining
      const examConfig = ExamScraperService.getExamConfig();
      const targetTime = new Date(examConfig.targetDate).getTime();
      const nowTime = Date.now();
      const diffMs = targetTime - nowTime;
      const daysLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      // 2. Select a random quote of the day
      const quoteIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
      const quote = MOTIVATION_QUOTES[quoteIndex] || MOTIVATION_QUOTES[0];

      // 3. Fetch all active users from database
      const users = await prisma.user.findMany({
        select: { telegramId: true, firstName: true }
      });

      if (!users || users.length === 0) {
        console.log('⚠️ [MotivationService] Yuborish uchun foydalanuvchilar topilmadi.');
        return { totalUsers: 0, successCount: 0, failCount: 0 };
      }

      const webAppUrl = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || 'https://huquqchi.onrender.com';

      // 4. Send personalized motivation to each user
      for (const user of users) {
        try {
          const messageText = 
`☀️ <b>Xayrli tong, ${user.firstName || 'Abituriyent'}!</b>

⏳ <b>Imtihon Taymeri:</b>
Huquqshunoslik imtihoniga <b>${daysLeft} KUN</b> qoldi!

🔥 <b>Kun Motivatsiyasi:</b>
<i>${quote}</i>

💡 Bugun Mini App'ga kirib test ishlashni va yuridik atamalarni takrorlashni unutmang!`;

          await bot.telegram.sendMessage(user.telegramId.toString(), messageText, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Mini App'da Test Ishlash",
                    web_app: { url: webAppUrl }
                  }
                ],
                [
                  {
                    text: "📚 Flashcards Lug'atini Ko'rish",
                    web_app: { url: webAppUrl }
                  }
                ]
              ]
            }
          });

          successCount++;
          // Small delay to prevent Telegram Bot API rate limit (30 msgs/sec)
          await new Promise(res => setTimeout(res, 40));
        } catch (err) {
          failCount++;
        }
      }

      console.log(`✅ [MotivationService] Motivatsiya xabari yakunlandi! Jami: ${users.length}, Yuborildi: ${successCount}, Xato: ${failCount}`);
      return { totalUsers: users.length, successCount, failCount };
    } catch (err: any) {
      console.error('❌ [MotivationService] Broadcast error:', err);
      return { totalUsers: 0, successCount, failCount };
    }
  }
}
