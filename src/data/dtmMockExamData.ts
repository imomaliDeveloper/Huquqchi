import prisma from '../database/prisma';

export const DTM_MOCK_EXAM_TITLE = "🎯 DTM 2026 Rasmiy Imtihon Simulatsiyasi (30 ta savol)";
export const DTM_MOCK_EXAM_CATEGORY = "DTM Imtihon Simulatsiyasi";
export const DTM_MOCK_EXAM_DESC = "O'zR Bilim va malakalarni baholash agentligi (DTM) rasmiy formati bo'yicha 30 ta savoldan iborat to'liq imtihon blok testi.";

export const DTM_30_QUESTIONS = [
  {
    question: "“Qattiq jazo choralarini qo‘llab, jinoyat uchun o‘zaro javobgarlik tizimi joriy etilganida odamlar o‘zlarida qonun kuchini sinab ko‘rishga jur'at qila olishmasdi”. Yuqoridagi jumla muallifini aniqlang.",
    optionA: "Mark Tuliy Setseron",
    optionB: "Shan Yan",
    optionC: "Gyote",
    optionD: "Sharl Lui Monteske",
    correctAnswer: "B",
    explanation: "Ushbu jumla qadimgi Xitoy huquqshunosi va davlat arbobi Shan Yan tomonidan aytilgan."
  },
  {
    question: "Jamiyatni boshqarish va xalq manfaatlarini himoya qilishni amalga oshiradigan davlat organlarining yaxlit tizimi – bu . . . .",
    optionA: "davlat funksiyalari",
    optionB: "davlat belgilari",
    optionC: "davlat mexanizmi",
    optionD: "davlat vazifalari",
    correctAnswer: "C",
    explanation: "Davlat organlarining yaxlit va tartiblangan tizimi davlat mexanizmi deb ataladi."
  },
  {
    question: "Birinchi ish yili uchun har yilgi mehnat ta'tilidan foydalanish huquqi xodimda u ushbu ish beruvchida uzluksiz ishlagan qancha muddat o‘tgandan keyin yuzaga keladi?",
    optionA: "olti oy",
    optionB: "bir yil",
    optionC: "uch oy",
    optionD: "ikki yil",
    correctAnswer: "A",
    explanation: "O'zR Mehnat kodeksiga ko'ra, birinchi ish yili uchun har yilgi mehnat ta'tili 6 oy uzluksiz ishlagandan keyin beriladi."
  },
  {
    question: "Quyidagilardan yunon (grek)chadan olingan yuridik atamalarni aniqlang.\n1) viza; 2) yurisprudensiya; 3) amnistiya; 4) kodeks; 5) kvorum; 6) demokratiya; 7) apatrid; 8) veto.",
    optionA: "1, 2, 3",
    optionB: "2, 3, 6",
    optionC: "3, 6, 7",
    optionD: "2, 6, 7",
    correctAnswer: "C",
    explanation: "Amnistiya, demokratiya va apatrid atamalari yunoncha (grekcha) ildizga ega."
  },
  {
    question: "O‘zbekiston Respublikasida qonunlar qachon orqaga qaytish kuchiga ega bo‘lishi mumkin?\n1) jinoiy javobgarlikni yengillashtiruvchi qonunlar;\n2) ma’muriy javobgarlikni yengillashtiruvchi qonunlar;\n3) fuqarolik javobgarlikni yengillashtiruvchi qonunlar;\n4) intizomiy javobgarlikni yengillashtiruvchi qonunlar;\n5) kodekslashtirilgan qonunlar;\n6) konstitutsiyaviy qonunlar;",
    optionA: "1, 2",
    optionB: "3, 4",
    optionC: "5, 6",
    optionD: "2, 4",
    correctAnswer: "A",
    explanation: "Javobgarlikni yengillashtiruvchi yoki bekor qiluvchi jinoiy va ma'muriy qonunlar orqaga qaytish kuchiga ega."
  },
  {
    question: "Vazirliklar hamda tashkilotlarning, fuqarolarning huquq va erkinliklari qonuniy manfaatlariga daxldor normativ-hujjatlarni qayd etish quyidagi qaysi idora tomonidan amalga oshiriladi?",
    optionA: "Adliya vazirligi",
    optionB: "Vazirlar Mahkamasi",
    optionC: "Prokuratura organlari",
    optionD: "Qonun hujjatlari monitoring instituti",
    correctAnswer: "A",
    explanation: "Idoraviy normativ-huquqiy hujjatlarni davlat ro'yxatidan o'tkazish O'zR Adliya vazirligi tomonidan amalga oshiriladi."
  },
  {
    question: "Yurtimizda amalga oshirilayotgan islohotlarning bosh maqsadi qilib aynan inson kapitalini rivojlantirish belgilanganligining sababini ko‘rsating.",
    optionA: "O‘zbekistonni inson kapitali indeksida yuqoriga ko‘tarish maqsadida",
    optionB: "aholining ma'naviy boyligi – uning dunyoqarashi, xulqi, odobi, madaniyati kabi ruhiy dunyosi bilan bog‘liq fazilatlarini oshirish maqsadida",
    optionC: "fuqarolik jamiyatini qurish maqsadida",
    optionD: "inson kapitali mamlakatimizning jahon mezonidagi raqobatbardoshligini ta'minlab beradigan omildir",
    correctAnswer: "D",
    explanation: "Inson kapitali mamlakatimizning jahon bozoridagi raqobatbardoshligi va rivojlanishini ta'minlovchi hal qiluvchi omildir."
  },
  {
    question: "Dastlabki bosqichda jamiyat qanday yo‘sinda boshqarilgan?",
    optionA: "majburlash",
    optionB: "ishontirish",
    optionC: "ijtimoiy demokratiya",
    optionD: "ibtidoiy demokratiya",
    correctAnswer: "D",
    explanation: "Ibtidoiy jamiyatda boshqaruv ibtidoiy demokratiya va urug' oqsoqollari kengashi vositasida amalga oshirilgan."
  },
  {
    question: "Berilgan ma'lumotlarni tahlil qilib Eyler-Venn diagrammasiga mos tushuvchi javobni belgilang.\nKonstitutsiyaviy sud (I) | Oliy sud (II) | Ikkalasiga ham tegishli (III)\na) Prezident taqdimiga binoan Senat tomonidan saylanadi;\nb) qonun chiqaruvchi va ijro etuvchi hokimiyat hujjatlarining Konstitutsiyaga muvofiqligini ko'radi;\nc) fuqarolik, jinoiy, iqtisodiy va ma'muriy sud ishlarini yuritish oliy organi;\nd) o'z tarkibidan raisini va o'rinbosarini 5 yillik muddatga saylaydi;\ne) raisi va o'rinbosarlari Prezident taqdimiga binoan Senat tomonidan 5 yillik muddatga saylanadi;\nf) qabul qilingan hujjatlari qat'iy hisoblanadi;",
    optionA: "I-b, d, f; II-c; III-a, e",
    optionB: "I-b, a; II-c, e; III-d, f",
    optionC: "I-c, e; II-b, d; III-a, f",
    optionD: "I-b, d; II-c, e; III-a, f",
    correctAnswer: "D",
    explanation: "Konstitutsiyaviy sud (I-b,d), Oliy sud (II-c,e) hamda har ikki sud a va f belgilariga ega."
  },
  {
    question: "“Ijtimoiy adolat, mamlakat taraqqiyoti va ma’naviy yangilanishni ta’minlash” – quyidagi qaysi siyosiy partiyaning maqsadi etib belgilangan?",
    optionA: "O‘zbekiston Respublikasi liberal-demokratik partiyasi",
    optionB: "Adolat sotsial demokratik partiyasi",
    optionC: "Xalq demokratik partiyasi",
    optionD: "Milliy tiklanish demokratik partiyasi",
    correctAnswer: "C",
    explanation: "Ushbu shior va maqsad O'zbekiston Xalq demokratik partiyasi (XDP) dasturiy maqsadi hisoblanadi."
  },
  {
    question: "Quyidagilardan Ombudsman faoliyati bilan bog‘liq ma'lumotlar berilgan javobni aniqlang.\n1) davlat organlari tomonidan inson huquqlariga rioya etilishi ustidan parlament nazorati;\n2) huzurida konstitutsiyaviy huquq va erkinliklarga rioya etilishi bo‘yicha komissiya tuzilgan;\n3) fuqarolar va tashkilotlardan o‘z nomiga kelgan murojaatlarni ko‘rib chiqadi;\n4) aholi o‘rtasida inson huquqlari sohasidagi huquqiy targ‘ibot;\n5) mintaqaviy tashkilotlar hamkorligi;\n6) mansabdor shaxs qarori bekor qilinishi lozimligi haqida xulosa beradi;",
    optionA: "1, 2, 3, 4",
    optionB: "1, 3, 4, 6",
    optionC: "2, 4, 5, 6",
    optionD: "1, 2, 3, 6",
    correctAnswer: "D",
    explanation: "Ombudsman vakolatlariga 1, 2, 3 va 6-bandlardagi ma'lumotlar kiradi."
  },
  {
    question: "Murojaatlar to'g'risidagi qonunchilikka ko'ra to‘g‘ri hukmlarni aniqlang.\nI. Jismoniy shaxs murojaatida familiyasi va manzili ko'rsatiladi.\nII. Murojaatda davlat organining nomi, mansabdor shaxs lavozimi va mohiyati ko'rsatilishi kerak.\nIII. Murojaatlarda elektron pochta va aloqa telefonlari ko'rsatilishi mumkin emas.\nIV. Og'zaki murojaat imzo bilan tasdiqlangan bo'lishi lozim.",
    optionA: "I – to‘g‘ri; II – to‘g‘ri; III – noto‘g‘ri; IV – to‘g‘ri",
    optionB: "I – noto‘g‘ri; II – to‘g‘ri; III – noto‘g‘ri; IV – noto‘g‘ri",
    optionC: "I – noto‘g‘ri; II – noto‘g‘ri; III – to‘g‘ri; IV – noto‘g‘ri",
    optionD: "I – noto‘g‘ri; II – to‘g‘ri; III – to‘g‘ri; IV – to‘g‘ri",
    correctAnswer: "B",
    explanation: "Faqat II-hukm to'liq to'g'ri hisoblanadi."
  },
  {
    question: "O‘zbekiston Respublikasi Oliy Majlisi Senati tomonidan lavozimga tayinlanmaydigan va lavozimdan ozod etilmaydigan mansabdorlarni toping.\n1) chet davlatlardagi diplomatik vakolatxona rahbarlari;\n2) xalqaro tashkilotlar huzuridagi vakolatxona rahbarlari;\n3) Markaziy bank boshqaruvi raisi;\n4) Bosh prokuror;\n5) Hisob palatasi raisi;",
    optionA: "1, 2",
    optionB: "2, 3",
    optionC: "4, 5",
    optionD: "3, 5",
    correctAnswer: "C",
    explanation: "Bosh prokuror hamda Hisob palatasi raisi Senat tomonidan tasdiqlanadi/tayinlanadi (4 va 5)."
  },
  {
    question: "O‘zbekiston Respublikasi Sudyalar oliy kengashi raisi va uning o‘rinbosari lavozimga tayinlanish (saylanish) tartibi to‘g‘ri ko‘rsatilgan javobni toping.",
    optionA: "O‘zbekiston Respublikasi Prezidentining taqdimiga binoan O‘zbekiston Respublikasi Oliy Majlisining Senati tomonidan",
    optionB: "O‘zbekiston Respublikasi Prezidentining taqdimiga binoan Qonunchilik palatasi tomonidan",
    optionC: "Sudyalar oliy kengashi tomonidan",
    optionD: "Senat taqdimiga binoan Prezident tomonidan",
    correctAnswer: "A",
    explanation: "Sudyalar oliy kengashi raisi va o'rinbosari Prezident taqdimiga binoan Senat tomonidan tayinlanadi."
  },
  {
    question: "Qonun chiqaruvchi hokimiyatni ikki palatali (Qonunchilik palatasi va Senat) etib tashkil etishdan ko‘zlangan asosiy maqsadlarni aniqlang.\n1) Oliy Majlis faoliyatida manfaatlar muvozanati tizimini shakllantirish;\n2) Parlament islohotini yangi bosqichga olib chiqish;\n3) Referendum natijalari ijrosini ta'minlash;\n4) Qonun ijodkorligi sifatini ta'minlash;\n5) Umumdavlat va hududiy manfaatlarning mutanosibligiga erishish;\n6) Chegaralar daxlsizligini ta'minlash;",
    optionA: "1, 2, 3",
    optionB: "1, 4, 5",
    optionC: "1, 4, 6",
    optionD: "2, 4, 6",
    correctAnswer: "B",
    explanation: "Ikki palatali parlamentning asosiy maqsadlari: 1, 4 va 5-bandlarda to'g'ri keltirilgan."
  },
  {
    question: "Ma’muriy jazo – bu . . . .\n1) ma’muriy huquqbuzarlik sodir etgan shaxsni qonunlarga rioya etish ruhida tarbiyalash maqsadi;\n2) sud hukmi bilan qo'llaniladigan majburlov chorasi;\n3) mahkumni huquqlardan mahrum qilish chorasi;\n4) yangi huquqbuzarlik sodir etilishining oldini olish maqsadi;",
    optionA: "1, 2",
    optionB: "2, 3",
    optionC: "3, 4",
    optionD: "1, 4",
    correctAnswer: "D",
    explanation: "Ma'muriy jazo tushunchasi 1 va 4-bandlarda to'g'ri ta'riflangan."
  },
  {
    question: "Huquqning me'yorlari mulkiy hamda u bilan bog‘liq shaxsiy nomulkiy munosabatlarni (sha'n va qadr-qimmatini himoya qilishni) tartibga soladigan sohasi – bu . . . .",
    optionA: "iqtisodiyot huquqi",
    optionB: "fuqarolik huquqi",
    optionC: "fuqarolik protsessual huquqi",
    optionD: "jinoyat huquqi",
    correctAnswer: "B",
    explanation: "Mulkiy va shaxsiy nomulkiy munosabatlar Fuqarolik huquqi predmeti hisoblanadi."
  },
  {
    question: "Mehnat huquqi va subyektlari bo'yicha to‘g‘ri berilgan qatorni toping.",
    optionA: "fuqarolik huquqi subyekti // jamoa subyekti // fuqaroligi bo‘lmagan shaxs",
    optionB: "fuqarolik huquqi subyekti // yakka tartibdagi subyekt // yakka tadbirkor",
    optionC: "mehnat huquqi subyekti // ish beruvchi // o‘n sakkiz yosh",
    optionD: "mehnat huquqi subyekti // kasaba uyushmasi raisi // nizolar komissiyasi",
    correctAnswer: "C",
    explanation: "Mehnat huquqi subyektlari va mezonlari C variantida to'g'ri berilgan."
  },
  {
    question: "Bitimlar va ishonchnoma bo'yicha to‘g‘ri hukmni aniqlang.\nI. Layoqati cheklangan fuqarolar bitimlarini vasiylari tuzadi.\nII. Faqat shaxsan tuzilishi lozim bo'lgan bitimni vakil orqali tuzib bo'lmaydi.\nIII. Ishonchnoma oddiy yozma yoki notarial shaklda bo'ladi.\nIV. Berilgan sanasi ko'rsatilmagan ishonchnoma 1 yil amal qiladi.",
    optionA: "I – to‘g‘ri; II – noto‘g‘ri; III – noto‘g‘ri; IV – noto‘g‘ri",
    optionB: "I – noto‘g‘ri; II – to‘g‘ri; III – to‘g‘ri; IV – noto‘g‘ri",
    optionC: "I – noto‘g‘ri; II – to‘g‘ri; III – noto‘g‘ri; IV – noto‘g‘ri",
    optionD: "I – to‘g‘ri; II – to‘g‘ri; III – noto‘g‘ri; IV – to‘g‘ri",
    correctAnswer: "B",
    explanation: "II va III hukmlar to'liq to'g'ri bo'lib, IV (sanasi ko'rsatilmagan ishonchnoma haqiqiy emas) va I noto'g'ri."
  },
  {
    question: "Quyidagilardan qaysilarini so‘roq qilishning umumiy davom etish vaqti dam olish uchun beriladigan 1 soat tanaffusni hisobga olmaganda bir kunda 8 soatdan oshmasligi lozim?\n1) ayblanuvchi; 2) guvoh; 3) jabrlanuvchi; 4) gumon qilinuvchi; 5) fuqaroviy javobgar;",
    optionA: "1, 2",
    optionB: "4, 5",
    optionC: "1, 4",
    optionD: "2, 4",
    correctAnswer: "C",
    explanation: "Ayblanuvchi va gumon qilinuvchini so'roq qilish bir kunda 8 soatdan oshmasligi kerak (1 va 4)."
  },
  {
    question: "Ish vaqtining davomiyligi 16 yoshdan 18 yoshgacha bo‘lgan xodimlar uchun haftasiga necha soatdan (a), 15 yoshdan 16 yoshgacha bo‘lganlar uchun necha soatdan (b) oshmaydigan qilib belgilanadi?",
    optionA: "a – o‘ttiz olti; b – yigirma to‘rt",
    optionB: "a – o‘ttiz olti; b – yigirma sakkiz",
    optionC: "a – yigirma to‘rt; b – yigirma to‘rt",
    optionD: "a – yigirma to‘rt; b – o‘ttiz olti",
    correctAnswer: "A",
    explanation: "Mehnat kodeksiga ko'ra: 16-18 yoshdagilarga haftasiga 36 soat (a), 15-16 yoshdagilarga 24 soat (b)."
  },
  {
    question: "Mehnatni muhofaza qilish qoidalarini buzish jinoyatining obyektiv tomoni bilan bog‘liq ma'lumotlarni aniqlang.\n1) texnika xavfsizligi buzilishi o'rtacha og'ir tan jarohati keltirsa;\n2) sanoat sanitariyasi buzilishi yengil jarohat keltirsa;\n3) texnika xavfsizligi buzilishi yengil jarohat keltirsa;\n4) sanoat sanitariyasi buzilishi og'ir tan jarohati keltirsa;",
    optionA: "1, 2",
    optionB: "2, 3",
    optionC: "3, 4",
    optionD: "1, 4",
    correctAnswer: "D",
    explanation: "Obyektiv tomondan og'ir yoki o'rtacha og'ir jarohat (1 va 4) jinoiy javobgarlik keltirib chiqaradi."
  },
  {
    question: "Jinoyat va uning obyektlari XATO berilgan qatorlarni aniqlang.\n1. Odam o‘g‘rilash — odamning erkinligi\n2. Zo‘rlik ishlatib g‘ayriqonuniy ozodlikdan mahrum qilish — shaxsiy ozodlik\n3. Tovlamachilik — shaxsning hayoti va sog‘lig‘i\n4. Mualliflik huquqini buzish — mehnat qilish huquqi",
    optionA: "1, 2",
    optionB: "3, 4",
    optionC: "1, 3",
    optionD: "2, 4",
    correctAnswer: "B",
    explanation: "3 va 4-qatorlar noto'g mezoniy moslashtirilgan (tovlamachilik - mulkiy jinoyat, mualliflik - intellektual mulk)."
  },
  {
    question: "Quyidagi qaysi davlatlarda nikoh yoshi har ikki jins vakillariga ham 18 yosh etib belgilangan?\n1) Bolgariya; 2) AQSh; 3) Fransiya; 4) O‘zbekiston; 5) Angliya; 6) Vengriya",
    optionA: "1, 4",
    optionB: "2, 5",
    optionC: "3, 4",
    optionD: "3, 6",
    correctAnswer: "A",
    explanation: "Bolgariya hamda O'zbekistonda nikoh yoshi har ikkala jins uchun ham 18 yosh qilib belgilangan."
  },
  {
    question: "Er va xotinning umumiy mol-mulkini bo'lish to'g'risidagi to‘g‘ri hukmni aniqlang.\nI. Mol-mulk faqat nikohdan ajralgandan keyin bo'linadi.\nII. Mol-mulk kelishuv shartnomasi notarial tasdiqlanishi shart.\nIII. Nizo bo'lganda bo'lish ma'muriy tartibda bo'ladi.\nIV. Oilaviy munosabatlar tugatilganda sud alohida yashalgan davrdagi mol-mulkni har birining o'z mulki deb topishi mumkin.",
    optionA: "I – to‘g‘ri; II – noto‘g‘ri; III – noto‘g‘ri; IV – noto‘g‘ri",
    optionB: "I – noto‘g‘ri; II – to‘g‘ri; III – to‘g‘ri; IV – noto‘g‘ri",
    optionC: "I – noto‘g‘ri; II – noto‘g‘ri; III – noto‘g‘ri; IV – to‘g‘ri",
    optionD: "I – noto‘g‘ri; II – noto‘g‘ri; III – to‘g‘ri; IV – to‘g‘ri",
    correctAnswer: "C",
    explanation: "Faqat IV hukm to'g'ri (I, II, III hukmlarda qonun normalari noto'g'ri ko'rsatilgan)."
  },
  {
    question: "Budjet jarayoni – bu . . . .\n1) budjet tizimi budjetlarini shakllantirish, tuzish va qabul qilish;\n2) ichki va xorijiy majburiyatlar;\n3) budjet ijrosini nazorat qilish jarayoni;\n4) budjet ijrosi hisobotlarini tayyorlash va tasdiqlash;",
    optionA: "1, 3, 5",
    optionB: "1, 3, 4",
    optionC: "2, 4, 6",
    optionD: "3, 4, 6",
    correctAnswer: "B",
    explanation: "Budjet jarayoni tushunchasiga 1, 3 va 4-bandlar kiradi."
  },
  {
    question: "Konstitutsiya moddalarining to'g'ri mosligini aniqlang.\n2. Asosiy prinsiplar -> Tashqi siyosat -> Tinchliksevar tashqi siyosat;\n3. Inson huquqlari -> Kafolatlar -> Nogironligi bo'lgan shaxslar imkoniyatlari;\n5. Jamiyat va shaxs -> OMV -> OMV erkinligi kafolati;",
    optionA: "1, 3, 5",
    optionB: "2, 4, 6",
    optionC: "1, 2, 3",
    optionD: "2, 3, 5",
    correctAnswer: "D",
    explanation: "2, 3 va 5-qatorlar Konstitutsiyaviy moddalar strukturasi bilan to'g mezoniy moslashtirilgan."
  },
  {
    question: "Kredit munosabatlarining bir turi bo‘lib, unda davlat yoki uning mahalliy organlari qarz oluvchi yoxud beruvchi bo‘lib ishtirok etadi – bu . . . .",
    optionA: "kredit",
    optionB: "davlat krediti",
    optionC: "qarz munosabati",
    optionD: "davlat zayomi",
    correctAnswer: "D",
    explanation: "Davlat yoki mahalliy organlar qarz oluvchi/beruvchi bo'lgan kredit shakli davlat zayomi deyiladi."
  },
  {
    question: "Jinoiy jazolar (voyaga yetmaganlarga nisbatan) mosligini belgilang:\na) 6 oydan 2 yilgacha; b) 6 oydan 10 yilgacha; c) 1 oydan 1 yilgacha;\n1) axloq tuzatish ishlari; 2) ozodlikdan mahrum qilish; 3) ozodlikni cheklash;",
    optionA: "a - 1; b - 2; c - 3",
    optionB: "a - 2; b - 3; c - 1",
    optionC: "a - 3; b - 2; c - 1",
    optionD: "a - 3; b - 1; c - 2",
    correctAnswer: "C",
    explanation: "a-3 (ozodlikni cheklash 6 oy-2 yil), b-2 (ozodlikdan mahrum qilish 6 oy-10 yil), c-1 (axloq tuzatish 1 oy-1 yil)."
  },
  {
    question: "“Qonun bilan taqiqlangan barcha narsaga ruxsat etilishi” prinsipi bilan bog‘liq ma'lumotlarni aniqlang.\n1) fuqarolarning harakatlanish erkinligi va imkoniyatlari kengaytiriladi;\n2) qonunda taqiqlanmagan harakatlar uchun yuridik javobgarlik belgilanmaydi;",
    optionA: "1, 3",
    optionB: "2, 4",
    optionC: "1, 2",
    optionD: "3, 4",
    correctAnswer: "C",
    explanation: "Ushbu prinsip fuqarolarning erkinligini ta'minlaydi (1 va 2-bandlar)."
  }
];

/**
 * Seed or update the DTM 30-Question Mock Exam in Prisma DB
 */
export async function seedDtmMockExam() {
  try {
    let quiz = await prisma.quiz.findFirst({
      where: { title: DTM_MOCK_EXAM_TITLE }
    });

    if (!quiz) {
      quiz = await prisma.quiz.create({
        data: {
          title: DTM_MOCK_EXAM_TITLE,
          category: DTM_MOCK_EXAM_CATEGORY,
          description: DTM_MOCK_EXAM_DESC,
        }
      });
      console.log(`✅ [DTM Seed] DTM Mock Exam created with ID: ${quiz.id}`);
    }

    // Check count of questions
    const questionCount = await prisma.quizQuestion.count({
      where: { quizId: quiz.id }
    });

    if (questionCount < 30) {
      // Re-populate questions
      await prisma.quizQuestion.deleteMany({
        where: { quizId: quiz.id }
      });

      for (const q of DTM_30_QUESTIONS) {
        await prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          }
        });
      }
      console.log(`✅ [DTM Seed] 30 DTM exam questions successfully imported for Quiz ID: ${quiz.id}`);
    }
    await seedSchoolTextbookQuizzes();
    return quiz;
  } catch (err) {
    console.error('❌ [DTM Seed Error]:', err);
    return null;
  }
}

export async function seedSchoolTextbookQuizzes() {
  const defaultCategories = [
    { title: "📘 8-sinf Huquq Darslik Testlari", category: "8-sinf Huquq", desc: "8-sinf Konstitutsiyaviy huquq darslik mavzulari bo'yicha testlar." },
    { title: "📗 9-sinf Huquq Darslik Testlari", category: "9-sinf Huquq", desc: "9-sinf Inson huquqlari va jamiyat darslik testlari." },
    { title: "📙 10-sinf Huquq Darslik Testlari", category: "10-sinf Huquq", desc: "10-sinf Fuqarolik va Mehnat huquqi darslik testlari." },
    { title: "📕 11-sinf Huquq Darslik Testlari", category: "11-sinf Huquq", desc: "11-sinf Davlat va Huquq nazariyasi darslik testlari." },
  ];

  for (const item of defaultCategories) {
    try {
      const existing = await prisma.quiz.findFirst({ where: { title: item.title } });
      if (!existing) {
        await prisma.quiz.create({
          data: {
            title: item.title,
            category: item.category,
            description: item.desc,
          }
        });
      }
    } catch (e) {}
  }
}
