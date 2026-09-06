# ⚖️ HuquqchiBot / Huquq AI — Professional Telegram Bot Startup

**HuquqchiBot / Huquq AI** — O‘zbekiston fuqarolari, abituriyentlar, talabalar, tadbirkorlar va yuristlar uchun mo‘ljallangan professional, masshtablashuvchan Telegram bot backend tizimi. Tizim huquqiy bilimlarni olish, qonunchilik moddalarini qidirish, testlar ishlash hamda Google Gemini AI orqali aqlli huquqiy yordam ko‘rsatish imkonini beradi.

---

## 🎯 STARTUP LOYIHA IMKONIYATLARI

1. **👥 Foydalanuvchilar Tizimi va Maqomlar:**
   - Registratsiya oqimi (Ism, Telefon raqami kontakt orqali, Maqom tanlash).
   - 5 xil foydalanuvchi maqomi: `👨‍🎓 Abituriyent`, `👤 Fuqaro`, `🎓 Talaba`, `💼 Tadbirkor`, `⚖️ Yurist`.
   - Interaktiv inline profil boshqaruvi va rolni o'zgartirish.

2. **⚖️ Huquqiy AI Yordamchi (Google Gemini API):**
   - O‘zbekiston qonunchiligiga tayangan holda savollarga javob berish.
   - Bazadagi `LegalArticle` lardan kontekstual RAG qidiruvi.
   - Uydirmaslik (hallucination guard), professional yurist maslahatini tavsiya etish va rasmiy maslahat emasligi haqida majburiy disclaimer.
   - AI muloqotlar va xabarlar tarixini saqlash (`AIConversation` & `AIMessage`).

3. **📚 Huquqiy Bilimlar va Kategoriyalar:**
   - 9 ta standart huquq sohasi (*Konstitutsiya, Fuqarolik, Mehnat, Jinoyat, Ma'muriy, Oila, Tadbirkorlik, Ta'lim, Boshqa*).
   - Har bir maqolaning to'liq matni, kategoriyasi va rasmiy manbasi.

4. **📝 Interaktiv Test Tizimi:**
   - Ko'p variantli (A, B, C, D) testlar.
   - Sarflangan vaqtni hisoblash, ball/foiz chiqarish hamda har bir savol bo'yicha qonuniy izohlarni taqdim etish.
   - Natijalarni bazaga saqlash va profil statistikasi bilan integratsiya.

5. **🔐 Admin Paneli va Ruxsatlar:**
   - `/admin` buyrug'i va ruxsatlarni tekshirish.
   - Tizim statistikasi dashboard'i (Rollar taqsimoti, testlar, AI muloqotlar).
   - Oxirgi ro'yxatdan o'tgan foydalanuvchilar ro'yxati.
   - Barcha foydalanuvchilarga bildirishnoma/e'lon yuborish (Broadcast).

---

## 🛠 TEXNOLOGIK STACK

- **Language & Runtime**: Node.js, TypeScript (Strict Mode)
- **Bot Framework**: Telegraf v4
- **ORM & Database**: Prisma ORM, SQLite (Development), PostgreSQL tayyor architecture
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Validation & Tools**: Zod, Dotenv, tsx, PM2, Docker

---

## 📁 LOYIHA STRUKTURASI

```
src/
├── bot/                # Telegraf bot instance & context tiplari
├── config/             # Zod orqali env o'zgaruvchilarni parse qilish
├── database/           # Prisma client singleton wrapper
├── handlers/           # Registration, main menu, profile, knowledge, quiz, AI & admin handlerlar
├── keyboards/          # Interactive reply va inline klaviaturalar
├── middlewares/        # Error handling, session & auth middleware'lar
├── services/           # UserService, AiService, AdminService biznes logikalari
└── utils/              # Konstantalar va test suite skriptlari

prisma/
├── schema.prisma       # Prisma modellari va bazaviy sxema
└── seed.ts             # Dastlabki kategoriyalar, maqolalar va testlarni yuklash skripti
```

---

## 🚀 LOKAL ISHGA TUSHIRISH (DEVELOPMENT)

### 1. Repository va kutubxonalarni o'rnatish

```bash
# Dependencylarni o'rnatish
npm install
```

### 2. Environment (`.env`) faylini sozlash

Loyihaning ildiz papkasida `.env` faylini yaratib, quyidagi kalitlarni kiriting:

```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

### 3. Database sxemasini yaratish va Seed qilish

```bash
# SQLite bazasini sinxronlashtirish va Prisma Client hosil qilish
npm run prisma:generate
npx prisma db push

# Dastlabki kategoriyalar va testlarni yuklash
npx tsx prisma/seed.ts
```

### 4. Dev rejimda ishga tushirish

```bash
npm run dev
```

### 5. Integration Test Suite-ni ishga tushirish

```bash
npx tsx src/utils/testSuite.ts
```

---

## 🐳 PRODUCTION DEPLOYMENT

### PM2 orqali ishga tushirish:

```bash
# TypeScript kodni yig'ish (build)
npm run build

# PM2 orqali ishga tushirish
pm2 start ecosystem.config.js --env production
```

### Docker & Docker Compose orqali (PostgreSQL bilan):

```bash
# Docker konteynerlarini qurish va orqada ishga tushirish
docker-compose up -d --build
```

---

## 📄 LITSENZIYA

Ushbu loyiha **HuquqchiBot Startup** jamoasi uchun ishlab chiqilgan.
