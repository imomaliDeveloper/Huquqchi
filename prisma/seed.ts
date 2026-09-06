import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with default legal categories, articles, and quizzes...');

  const defaultCategories = [
    { name: 'Konstitutsiya', description: 'O‘zbekiston Respublikasi Konstitutsiyasi va davlat tuzilishi' },
    { name: 'Fuqarolik huquqi', description: 'Mulk huquqi, shartnomalar va fuqarolik munosabatlari' },
    { name: 'Mehnat huquqi', description: 'Mehnat shartnomalari, ta‘til, ish vaqti va mehnating muhofazasi' },
    { name: 'Jinoyat huquqi', description: 'Jinoyat kodeksi, javobgarlik va jazo choralari' },
    { name: 'Ma‘muriy huquq', description: 'Ma‘muriy javobgarlik, jarimalar va davlat organlari bilan munosabatlar' },
    { name: 'Oila huquqi', description: 'Nikoh, oilaviy munosabatlar, aliment va ota-onalik huquqlari' },
    { name: 'Tadbirkorlik huquqi', description: 'Biznesni ro‘yxatdan o‘tkazish, litsenziyalar va soliq imtiyozlari' },
    { name: 'Ta‘lim huquqi', description: 'Talabalar huquqlari, ta‘lim kreditlari va stipendiyalar' },
    { name: 'Boshqa', description: 'Boshqa huquqiy va normativ-huquqiy hujjatlar' },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  // Fetch created categories
  const konstitutsiyaCat = await prisma.category.findUnique({ where: { name: 'Konstitutsiya' } });
  const mehnatCat = await prisma.category.findUnique({ where: { name: 'Mehnat huquqi' } });
  const tadbirkorlikCat = await prisma.category.findUnique({ where: { name: 'Tadbirkorlik huquqi' } });
  const talimCat = await prisma.category.findUnique({ where: { name: 'Ta‘lim huquqi' } });

  const initialArticles = [
    {
      title: 'Konstitutsiya 1-modda: O‘zbekiston — suveren respublika',
      content: 'O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat. Davlatning "O‘zbekiston Respublikasi" va "O‘zbekiston" degan nomlari bir ma‘noni anglatadi.',
      source: 'O‘zbekiston Respublikasi Konstitutsiyasi (Yangi tahrir)',
      categoryId: konstitutsiyaCat?.id || 1,
    },
    {
      title: 'Mehnat shartnomasini bekor qilish tartibi (MK 155-160 moddalar)',
      content: 'Xodim mehnat shartnomasini ikkala taraf kelishuviga ko‘ra yoki 2 hafta oldin yozma ravishda ogohlantirgan holda o‘z tashabbusi bilan bekor qilishga haqli. Ogohlantirish muddati davomida xodim o‘z arizasini qaytarib olish huquqiga ega.',
      source: 'O‘zbekiston Respublikasi Mehnat Kodeksi',
      categoryId: mehnatCat?.id || 3,
    },
    {
      title: 'YTT (Yakka tartibdagi tadbirkor) ro‘yxatdan o‘tish shartlari',
      content: 'Yakka tartibdagi tadbirkorlik subyekti sifatingizda ro‘yxatdan o‘tish YIDXP (my.gov.uz) portali orqali onlayn 5 daqiqada amalga oshiriladi. Davlat boji bazaviy hisoblash miqdorining (BHM) 10 foizini tashkil etadi.',
      source: 'O‘zbekiston Respublikasi "Tadbirkorlik faoliyati erkinligining kafolatlari to‘g‘risida"gi Qonuni',
      categoryId: tadbirkorlikCat?.id || 7,
    },
    {
      title: 'Ta‘lim krediti olish tartibi va imtiyozlari',
      content: 'Oliy va professional ta‘lim muassasalarida to‘lov-kontrakt asosida o‘qiyotgan talabalar uchun imtiyozli ta‘lim kreditlari Markaziy bankning qayta moliyalash stavkasida ajratiladi. Xotin-qizlar uchun kredit foizsiz beriladi va ta‘limni tugatgandan so‘ng 7 yil davomida qaytariladi.',
      source: 'O‘zbekiston Respublikasi Vazirlar Mahkamasining 2021-yil 18-avgustdagi 527-son qarori',
      categoryId: talimCat?.id || 8,
    },
  ];

  for (const art of initialArticles) {
    const existing = await prisma.legalArticle.findFirst({
      where: { title: art.title },
    });
    if (!existing) {
      await prisma.legalArticle.create({ data: art });
    }
  }

  // Seed Quizzes
  const quiz1 = await prisma.quiz.upsert({
    where: { id: 1 },
    update: { title: 'Konstitutsiyaviy Huquq Bo‘yicha Test', category: 'Konstitutsiya' },
    create: {
      title: 'Konstitutsiyaviy Huquq Bo‘yicha Test',
      description: 'O‘zbekiston Respublikasi Konstitutsiyasi bo‘yicha bilimlarni sinash uchun 3 ta savol',
      category: 'Konstitutsiya',
      questions: {
        create: [
          {
            question: 'O‘zbekiston Respublikasi Konstitutsiyasi 1-moddasiga ko‘ra O‘zbekiston qanday davlat?',
            optionA: 'Suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat',
            optionB: 'Unitar monarxiya davlati',
            optionC: 'Federativ respublika',
            optionD: 'Konstitutsiyaviy monarxiya',
            correctAnswer: 'A',
            explanation: '1-modda: O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.',
          },
          {
            question: 'O‘zbekiston Respublikasida davlat hokimiyatining birinchi va yagona manbai kim?',
            optionA: 'Prezident',
            optionB: 'Xalq',
            optionC: 'Oliy Majlis',
            optionD: 'Vazirlar Mahkamasi',
            correctAnswer: 'B',
            explanation: '7-modda: Xalq davlat hokimiyatining birdan bir manbaidir.',
          },
          {
            question: 'O‘zbekiston Respublikasining davlat tili qaysi?',
            optionA: 'O‘zbek tili',
            optionB: 'O‘zbek va Rus tillari',
            optionC: 'O‘zbek va Ingliz tillari',
            optionD: 'O‘zbek va Qoraqalpoq tillari',
            correctAnswer: 'A',
            explanation: '4-modda: O‘zbekiston Respublikasining davlat tili o‘zbek tilidir.',
          },
        ],
      },
    },
  });

  const quiz2 = await prisma.quiz.upsert({
    where: { id: 2 },
    update: { title: 'Mehnat Huquqi Bo‘yicha Test', category: 'Mehnat huquqi' },
    create: {
      title: 'Mehnat Huquqi Bo‘yicha Test',
      description: 'Mehnat Kodeksi va ishchi-xodimlar huquqlari bo‘yicha testlar',
      category: 'Mehnat huquqi',
      questions: {
        create: [
          {
            question: 'Yangi Mehnat Kodeksiga ko‘ra xodimlarga har yillik eng kam asosiy mehnat ta‘tili muddati qancha?',
            optionA: '15 ish kuni',
            optionB: '21 kalendar kuni',
            optionC: '14 kalendar kuni',
            optionD: '30 kalendar kuni',
            correctAnswer: 'B',
            explanation: 'Mehnat kodeksi 217-moddasiga ko‘ra, har yillik eng kam mehnat ta‘tili muddati 21 kalendar kunini tashkil etadi.',
          },
          {
            question: 'Mehnat shartnomasini xodim o‘z xohishiga ko‘ra bekor qilish haqida ish beruvchini necha kun/hafta oldin ogohlantirishi kerak?',
            optionA: '3 kun oldin',
            optionB: '2 hafta oldin',
            optionC: '1 oy oldin',
            optionD: '1 hafta oldin',
            correctAnswer: 'B',
            explanation: 'Mehnat kodeksining 160-moddasiga ko‘ra xodim 2 hafta oldin yozma ogohlantirishi kerak.',
          },
        ],
      },
    },
  });

  const quiz3 = await prisma.quiz.upsert({
    where: { id: 3 },
    update: { title: '🎓 Milliy Yuridik Sertifikat Imtihon Testlari', category: 'Milliy Sertifikat' },
    create: {
      title: '🎓 Milliy Yuridik Sertifikat Imtihon Testlari',
      description: 'Davlat Huquqiy Sertifikati imtihoni uchun 5 ta rasmiy test savollari (2025-2026)',
      category: 'Milliy Sertifikat',
      questions: {
        create: [
          {
            question: 'Abdulla do‘kondan kir yuvish mashinasini sotib olmoqchi. Ushbu vaziyatda Abdullaning tovar haqida ma’lumot olish huquqi huquqiy munosabatlarning qaysi tarkibiy elementiga oid hisoblanadi?',
            optionA: 'subyektiv huquq',
            optionB: 'yuridik majburiyat',
            optionC: 'obyekt',
            optionD: 'subyekt',
            correctAnswer: 'A',
            explanation: 'Tovar haqida ma’lumot olish huquqi — subyektiv huquq hisoblanadi.',
          },
          {
            question: 'To‘g‘ri berilgan ma’lumotni aniqlang (Oila kodeksi, 93-modda):',
            optionA: 'voyaga yetmagan bolalar qonunda belgilangan tartibda xususiy mulk egasi bo‘lish huquqiga ega',
            optionB: 'vasiylik va homiylik organi ota-ona va bolalar manfaatlari qarama-qarshiligida ota-ona himoya qilishga haqli',
            optionC: 'voyaga yetmagan bolalarning shaxsiy mehnati va tadbirkorlik mol-mulki xususiy mulk hisoblanmaydi',
            optionD: 'voyaga yetmaganlarning shaxsiy buyumlari xususiy mulk hisoblanmaydi',
            correctAnswer: 'A',
            explanation: 'Oila kodeksi 93-moddasi: Voyaga yetmagan bolalar xususiy mulk egasi bo‘lish huquqiga ega.',
          },
          {
            question: 'Quyida berilganlardan qaysilari advokatlik faoliyatining turlariga kiradi? ("Advokatura to‘g‘risida"gi qonun, 5-modda):\n1) meros guvohnomasini berish; 2) fuqarolik/iqtisodiy/ma\'muriy ishlarda sudda va organlarda vakillik; 3) bitimlarni va vasiyatnomalarni tasdiqlash; 4) jinoyat ishlarida himoyachi sifatida ishtirok etish; 5) hujjat nusxalarini shahodatlash; 6) hakamlik va xalqaro tijorat arbitrajida vakillik.',
            optionA: '1, 4, 6',
            optionB: '1, 3, 5',
            optionC: '2, 4, 6',
            optionD: '2, 3, 5',
            correctAnswer: 'C',
            explanation: '2, 4, 6 advokatlik faoliyati turlari hisoblanadi.',
          },
          {
            question: 'Quyida berilgan ma’lumotlarga mos yakuniy xulosalar (to‘g‘ri/noto‘g‘ri) keltirilgan javobni aniqlang (Konstitutsiya):\nI. Prezident vazifasini bajara olmaganda Senat Raisiga o\'tadi va 3 oyda saylov o\'tkaziladi;\nII. Konstitutsiyaviy qonunlarni qabul qilishda deputat/senatorlar kamida 2/3 qismi ishtirok etishi shart;\nIII. Senat o\'zini tarqatish bo\'yicha 1/3 ko\'pchilik ovoz bilan qaror qiladi;\nIV. Qonunchilik palatasi va Senat farmoyish va farmon chiqaradi;\nV. Oliy Majlis tarqatilganda yangi saylov 6 oyda o\'tkaziladi.',
            optionA: 'I-to‘g‘ri; II-noto‘g‘ri; III-to‘g‘ri; IV-to‘g‘ri; V-to‘g‘ri',
            optionB: 'I-to‘g‘ri; II-to‘g‘ri; III-noto‘g‘ri; IV-noto‘g‘ri; V-noto‘g‘ri',
            optionC: 'I-noto‘g‘ri; II-to‘g‘ri; III-noto‘g‘ri; IV-to‘g‘ri; V-noto‘g‘ri',
            optionD: 'I-noto‘g‘ri; II-noto‘g‘ri; III-to‘g‘ri; IV-noto‘g‘ri; V-to‘g‘ri',
            correctAnswer: 'B',
            explanation: "I va II to'g'ri, III, IV, V noto'g'ri (B javob).",
          },
          {
            question: 'Har kunlik ish (smena)ning davomiyligi 16 yoshdan 18 yoshgacha bo‘lgan xodimlar uchun 5 kunlik ish haftasida necha soatdan oshishi mumkin emas (Mehnat kodeksi, 416-modda)?',
            optionA: 'besh soatu o‘ttiz daqiqadan',
            optionB: 'yetti soatu o‘ttiz daqiqadan',
            optionC: 'to‘rt soatdan',
            optionD: 'olti soatdan',
            correctAnswer: 'B',
            explanation: 'Mehnat kodeksi 416-moddasiga ko‘ra 7 soatu 30 daqiqadan oshmasligi kerak.',
          },
        ],
      },
    },
  });

  console.log('✅ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
