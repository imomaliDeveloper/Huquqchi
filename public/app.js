// Telegram WebApp Initialization & Haptics
const tg = window.Telegram?.WebApp || {
  ready: () => {},
  expand: () => {},
  HapticFeedback: { impactOccurred: () => {}, notificationOccurred: () => {} },
  initDataUnsafe: { user: { first_name: 'Foydalanuvchi', id: 123456789, username: 'user' } }
};

tg.ready();
tg.expand();

let currentTelegramId = tg.initDataUnsafe?.user?.id || null;
let currentUserName = tg.initDataUnsafe?.user?.first_name || 'Foydalanuvchi';

// Initialize Page Data
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderUser();
  fetchStats();
  setupConstArticles();
  setupQuizEngine();
  setupAiForm();
  setupRiskForm();
  setupDocForm();
  startExamCountdown();
});

// Setup User Profile Info
function setupHeaderUser() {
  const headerName = document.getElementById('headerUserName');
  const headerRole = document.getElementById('headerUserRole');
  if (headerName) headerName.textContent = currentUserName;

  if (currentTelegramId) {
    fetch(`/api/user?telegramId=${currentTelegramId}`)
      .then(res => res.json())
      .then(user => {
        if (user && !user.error) {
          if (headerRole) headerRole.textContent = user.role || 'FUQARO';
          if (user.isPro) {
            headerRole.className = 'text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/40';
            headerRole.textContent = 'VIP PRO';
          }
        }
      })
      .catch(() => {});
  }
}

// Fetch System Stats
function fetchStats() {
  fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
      if (data) {
        const statArticles = document.getElementById('statArticles');
        const statQuizzes = document.getElementById('statQuizzes');
        if (statArticles) statArticles.textContent = `${data.totalArticles || 155}+`;
        if (statQuizzes) statQuizzes.textContent = `${data.totalQuizzes || 40}+`;
      }
    })
    .catch(() => {});
}

// Tab Switcher
function switchTab(tabName) {
  tg.HapticFeedback?.impactOccurred('medium');

  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

  // Reset active navbar states
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active-tab');
    const iconBg = el.querySelector('.icon-bg');
    if (iconBg) {
      iconBg.style.background = 'transparent';
      iconBg.classList.remove('text-blue-400', 'text-amber-400', 'text-purple-400', 'text-indigo-400');
    }
  });

  // Show target tab
  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.remove('hidden');

  // Highlight active nav item
  const activeNav = document.getElementById(`nav-${tabName}`);
  if (activeNav) {
    activeNav.classList.add('active-tab');
    const iconBg = activeNav.querySelector('.icon-bg');
    if (iconBg) {
      iconBg.style.background = 'rgba(59, 130, 246, 0.2)';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------
// 1. AI CHAT SYSTEM
// ----------------------------------------------------
function setupAiForm() {
  const form = document.getElementById('aiChatForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('aiInput');
    const question = input.value.trim();
    if (!question) return;

    appendChatMessage('user', question);
    input.value = '';

    const loadingId = appendChatMessage('assistant', '<i>⚖️ Tahlil qilinmoqda... AI javob bermoqda...</i>');

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: currentTelegramId,
          question: question
        })
      });
      const data = await response.json();
      
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        const formatted = formatAiResponse(data.answer || 'Javob olishda xatolik yuz berdi.');
        loadingEl.innerHTML = formatted;

        // Auto popup PRO Modal if 2-use limit hit
        if (data.answer && data.answer.includes('Kunlik bepul AI limit tugadi')) {
          tg.HapticFeedback?.notificationOccurred('error');
          setTimeout(() => openProModal(), 800);
        } else {
          tg.HapticFeedback?.notificationOccurred('success');
        }
      }
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = '❌ Server bilan bog‘lanishda xatolik yuz berdi.';
      }
    }
  });
}

function setAiQuestion(text) {
  tg.HapticFeedback?.impactOccurred('light');
  const input = document.getElementById('aiInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function appendChatMessage(sender, text) {
  const container = document.getElementById('chatContainer');
  if (!container) return;

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const isUser = sender === 'user';

  const wrapper = document.createElement('div');
  wrapper.className = `flex items-start gap-2 ${isUser ? 'justify-end' : ''}`;

  if (isUser) {
    wrapper.innerHTML = `
      <div class="bg-blue-600 text-xs text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-sm">
        ${escapeHtml(text)}
      </div>
      <div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs">👤</div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs">🤖</div>
      <div id="${msgId}" class="bg-slate-800/90 text-xs text-slate-200 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 max-w-[85%] leading-relaxed shadow-sm">
        ${text}
      </div>
    `;
  }

  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  return msgId;
}

function clearChat() {
  tg.HapticFeedback?.impactOccurred('medium');
  const container = document.getElementById('chatContainer');
  if (container) {
    container.innerHTML = `
      <div class="flex items-start gap-2 max-w-[85%]">
        <div class="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs">🤖</div>
        <div class="bg-slate-800/90 text-xs text-slate-200 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 leading-relaxed">
          Assalomu alaykum! Men O‘zbekiston Respublikasi qonunchiligi bo‘yicha yuridik ekspertingizman. (Bepul kunlik limit: 2 ta). Qanday yuridik savolingiz bor?
        </div>
      </div>
    `;
  }
}

// Web Speech Voice Dictation (uz-UZ)
let isListening = false;
let recognition = null;

function startVoiceInput() {
  tg.HapticFeedback?.impactOccurred('heavy');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('⚠️ Brauzeringiz ovozli tanib olish (Speech Recognition) texnologiyasini qo‘llab-quvvatlamaydi. Matn ko‘rinishida kiriting.');
    return;
  }

  const micIcon = document.getElementById('micIcon');
  const input = document.getElementById('aiInput');

  if (isListening && recognition) {
    recognition.stop();
    isListening = false;
    if (micIcon) micIcon.className = 'fa-solid fa-microphone text-blue-400';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'uz-UZ';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    if (micIcon) micIcon.className = 'fa-solid fa-microphone text-red-500 animate-pulse';
    tg.HapticFeedback?.notificationOccurred('success');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (input) input.value = transcript;
    tg.HapticFeedback?.notificationOccurred('success');
  };

  recognition.onerror = () => {
    isListening = false;
    if (micIcon) micIcon.className = 'fa-solid fa-microphone text-blue-400';
    alert('⚠️ Ovozni tanib bo‘lmadi, qaytadan gapirib ko‘ring.');
  };

  recognition.onend = () => {
    isListening = false;
    if (micIcon) micIcon.className = 'fa-solid fa-microphone text-blue-400';
  };

  recognition.start();
}

// AI Chat History Drawer Functions
function openChatHistoryModal() {
  tg.HapticFeedback?.impactOccurred('medium');
  const modal = document.getElementById('chatHistoryModal');
  const listDiv = document.getElementById('historyListContainer');
  if (!modal) return;

  modal.classList.remove('hidden');
  if (listDiv) listDiv.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Suhbatlar tarixi yuklanmoqda...</div>';

  fetch(`/api/ai/history?telegramId=${currentTelegramId || 123456789}`)
    .then(res => res.json())
    .then(conversations => {
      if (!conversations || conversations.length === 0) {
        listDiv.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Hozircha suhbatlar tarixi mavjud emas.</div>';
        return;
      }

      listDiv.innerHTML = conversations.map(c => `
        <div onclick="loadPastChat(${c.id})" class="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 p-3 rounded-xl cursor-pointer space-y-1 transition-all">
          <div class="flex items-center justify-between text-slate-200 font-bold">
            <span class="truncate text-xs">${escapeHtml(c.title || 'Yuridik Muloqot')}</span>
            <span class="text-[9px] text-slate-400 font-mono">${new Date(c.createdAt).toLocaleDateString('uz-UZ')}</span>
          </div>
          <p class="text-[11px] text-slate-400 truncate">${escapeHtml(c.messages?.[0]?.content || '')}</p>
        </div>
      `).join('');

      window.cachedConversations = conversations;
    })
    .catch(() => {
      if (listDiv) listDiv.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Tarixni yuklab bo‘lmadi.</div>';
    });
}

function closeChatHistoryModal() {
  const modal = document.getElementById('chatHistoryModal');
  if (modal) modal.classList.add('hidden');
}

function loadPastChat(convId) {
  closeChatHistoryModal();
  switchTab('ai');

  const conv = (window.cachedConversations || []).find(c => c.id === convId);
  if (!conv || !conv.messages) return;

  const container = document.getElementById('chatContainer');
  if (!container) return;

  container.innerHTML = conv.messages.map(m => {
    const isUser = m.sender === 'user';
    return `
      <div class="flex items-start gap-2 ${isUser ? 'justify-end' : ''}">
        ${!isUser ? `<div class="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs">🤖</div>` : ''}
        <div class="${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/50'} text-xs p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm">
          ${isUser ? escapeHtml(m.content) : formatAiResponse(m.content)}
        </div>
        ${isUser ? `<div class="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs">👤</div>` : ''}
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function formatAiResponse(text) {
  return text
    .replace(/<b>(.*?)<\/b>/g, '<strong class="text-blue-300 font-bold">$1</strong>')
    .replace(/<i>(.*?)<\/i>/g, '<em class="text-slate-300">$1</em>')
    .replace(/\n/g, '<br>');
}

// ----------------------------------------------------
// 2. CONTRACT RISK AUDIT FORM
// ----------------------------------------------------
function setupRiskForm() {
  const form = document.getElementById('riskCheckForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contractText = document.getElementById('riskContractText').value.trim();
    if (!contractText) return;

    const btn = document.getElementById('riskSubmitBtn');
    const resultBox = document.getElementById('riskResultBox');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> AI Tahlil Qilinmoqda...';
    resultBox.classList.add('hidden');

    try {
      const response = await fetch('/api/ai/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText })
      });
      const data = await response.json();

      resultBox.classList.remove('hidden');
      resultBox.innerHTML = formatAiResponse(data.result || 'Tahlil natijasi bo\'sh.');

      if (data.result && data.result.includes('Kunlik bepul AI limit tugadi')) {
        setTimeout(() => openProModal(), 800);
      } else {
        tg.HapticFeedback?.notificationOccurred('success');
      }
    } catch (err) {
      alert('❌ Tahlil jarayonida xatolik yuz berdi.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

// ----------------------------------------------------
// 3. QUIZ ENGINE & CERTIFICATE SUBMISSION
// ----------------------------------------------------
const FULL_QUIZ_BANK = [
  {
    question: "Abdulla do‘kondan kir yuvish mashinasini sotib olmoqchi. Ushbu vaziyatda Abdullaning tovar haqida ma’lumot olish huquqi huquqiy munosabatlarning qaysi tarkibiy elementiga oid hisoblanadi?",
    options: ["A) Subyektiv huquq", "B) Yuridik majburiyat", "C) Obyekt", "D) Subyekt"],
    correct: 0,
    explanation: "O'zR Fuqarolik kodeksiga ko'ra, iste'molchining tovar haqida ma'lumot talab qilish huquqi fuqarolik huquqiy munosabatlarining subyektiv huquq elementiga kiradi."
  },
  {
    question: "To‘g‘ri berilgan ma’lumotni aniqlang (Oila kodeksi, 93-modda, 2025-yil holatiga ko‘ra):",
    options: [
      "A) Voyaga yetmagan bolalar qonunda belgilangan tartibda xususiy mulk egasi bo‘lish huquqiga ega",
      "B) Vasiylik organi ota-ona va bolalar manfaatlari o‘rtasida qarama-qarshilik borligini aniqlaganda ham ota-ona bolani himoya qiladi",
      "C) Voyaga yetmagan bolalarning shaxsiy mehnati bilan orttirgan mol-mulki ularning xususiy mulki hisoblanmaydi",
      "D) Voyaga yetmaganlarning shaxsiy foydalanishidagi buyumlari (kiyim, poyabzal) ularning xususiy mulki hisoblanmaydi"
    ],
    correct: 0,
    explanation: "Oila kodeksining 93-moddasiga muvofiq, voyaga yetmagan bolalar qonuniy tartibda xususiy mulk ob'yekti va egasi bo'lish huquqiga egadirlar."
  },
  {
    question: "Quyida berilganlardan qaysilari advokatlik faoliyatining turlariga kiradi? (\"Advokatura to‘g‘risida\"gi qonun, 5-modda):\n1) meros guvohnomasini berish; 2) fuqarolik/iqtisodiy/ma'muriy ishlarda sudda vakillik; 3) bitimlarni tasdiqlash; 4) jinoyat ishlarida himoyachi bo'lish; 5) hujjat nusxalarini shahodatlash; 6) hakamlik va arbitrajda vakillik.",
    options: ["A) 1, 4, 6", "B) 1, 3, 5", "C) 2, 4, 6", "D) 2, 3, 5"],
    correct: 2,
    explanation: "\"Advokatura to'g'risida\"gi Qonunning 5-moddasiga ko'ra, 2, 4 va 6-bandlar advokatlik faoliyatining rasmiy turlari hisoblanadi (1, 3, 5 esa Notariat vakolatiga kiradi)."
  },
  {
    question: "Quyida berilgan ma’lumotlarga mos yakuniy xulosalar (to‘g‘ri/noto‘g‘ri) keltirilgan javobni aniqlang (Konstitutsiya):\nI. Prezident vazifasini bajara olmaganda Senat Raisiga o'tadi va 3 oyda saylov o'tkaziladi;\nII. Konstitutsiyaviy qonunlarni qabul qilishda deputat/senatorlar kamida 2/3 qismi ishtirok etishi shart;\nIII. Senat o'zini tarqatish bo'yicha 1/3 ko'pchilik ovoz bilan qaror qiladi;",
    options: [
      "A) I-to‘g‘ri; II-noto‘g‘ri; III-to‘g‘ri",
      "B) I-to‘g‘ri; II-to‘g‘ri; III-noto‘g‘ri",
      "C) I-noto‘g‘ri; II-to‘g‘ri; III-noto‘g‘ri",
      "D) I-noto‘g‘ri; II-noto‘g‘ri; III-to‘g‘ri"
    ],
    correct: 1,
    explanation: "Konstitutsiyaga ko'ra, I va II to'g'ri, III esa noto'g'ri (Senat qarorlari 2/3 ko'pchilik bilan olinadi)."
  },
  {
    question: "Har kunlik ish (smena)ning davomiyligi 16 yoshdan 18 yoshgacha bo‘lgan xodimlar uchun 5 kunlik ish haftasida necha soatdan oshishi mumkin emas (Mehnat kodeksi, 416-modda)?",
    options: [
      "A) 5 soatu 30 daqiqadan",
      "B) 7 soatu 30 daqiqadan",
      "C) 4 soatdan",
      "D) 6 soatdan"
    ],
    correct: 1,
    explanation: "Mehnat kodeksining 416-moddasiga ko'ra, 16 yoshdan 18 yoshgacha bo'lgan o'smirlar uchun kunlik ish smenasi 7 soat 30 daqiqadan oshmasligi kerak."
  },
  {
    question: "O‘zbekiston Respublikasi Konstitutsiyasiga muvofiq Davlat hokimiyatining yagona manbai kim hisoblanadi?",
    options: ["A) Oliy Majlis", "B) Prezident", "C) O‘zbekiston xalqi", "D) Konstitutsiyaviy Sud"],
    correct: 2,
    explanation: "Konstitutsiyaning 7-moddasi: O‘zbekiston xalqi davlat hokimiyatining yagona manbaidir."
  },
  {
    question: "Fuqarolik huquqida emansipatsiya deb nimaga aytiladi?",
    options: [
      "A) Voyaga yetmagan 16 yoshga to'lgan shaxsning to'liq muomala layoqatli deb e'lon qilinishi",
      "B) Shaxsning huquq layoqatidan mahrum etilishi",
      "C) Sud qarori bilan muomala layoqatsiz deb topilishi",
      "D) Chet el fuqarosiga O'zbekiston fuqaroligi berilishi"
    ],
    correct: 0,
    explanation: "Fuqarolik kodeksining 28-moddasi: 16 yoshga to'lgan voyaga yetmagan shaxs mehnat shartnomasi bo'yicha ishlayotgan bo'lsa yoki tadbirkorlik bilan shug'ullanayotgan bo'lsa, to'liq muomala layoqatli deb e'lon qilinishi (emansipatsiya) mumkin."
  },
  {
    question: "Ma'muriy javobgarlik to'g'risidagi kodeksga ko'ra Ma'muriy qamoq muddati ko'pi bilan necha sutkani tashkil etadi?",
    options: ["A) 15 sutka (favqulodda holatda 30 sutka)", "B) 30 sutka", "C) 60 sutka", "D) 10 sutka"],
    correct: 0,
    explanation: "MJtK 29-moddasiga ko'ra ma'muriy qamoq 15 sutkagacha, favqulodda holat rejimida esa 30 sutkagacha qo'llaniladi."
  },
  {
    question: "Mehnat shartnomasini bekor qilishda xodim necha kun oldin ish beruvchini yozma ravishda ogohlantirishi shart?",
    options: ["A) 14 kun (2 hafta)", "B) 1 o'y", "C) 3 kun", "D) 7 kun"],
    correct: 0,
    explanation: "Mehnat kodeksining 160-moddasiga ko'ra xodim o'z xohishiga ko'ra mehnat shartnomasini bekor qilish haqida ish beruvchini 2 hafta (14 kun) oldin yozma ravishda ogohlantirishi shart."
  },
  {
    question: "Oila kodeksiga ko'ra nikoh yoshi erkaklar va ayollar uchun necha yosh etib belgilangan?",
    options: ["A) 18 yosh", "B) 17 yosh", "C) Erkaklar 18, ayollar 17", "D) 21 yosh"],
    correct: 0,
    explanation: "Oila kodeksining 15-moddasiga muvofiq O'zbekiston Respublikasida nikoh yoshi erkaklar va ayollar uchun o'n sakkiz (18) yosh etib belgilangan."
  }
];

const CASES_QUIZ_BANK = [
  {
    question: "17 yoshli Rustam ota-onasining roziligisiz o‘ziga tegishli qimmatbaho telefonni sotyapti. Xaridor pulni berdi. Buni bilgan ota-ona bitimni bekor qilishni talab qilmoqda. O'zR Fuqarolik Kodeksiga muvofiq ushbu bitim taqdiri nima bo'ladi?",
    options: [
      "A) Bitim ota-onaning roziligisiz tuzilgani uchun sud orqali haqiqiy emas deb topilishi mumkin",
      "B) Rustam 16 yoshdan oshgani uchun bitim to'liq o'z kuchida qoladi",
      "C) Xaridor telefonni qaytarishga majbur emas",
      "D) Faqat IIB aralashuvi bilan bekor qilinadi"
    ],
    correct: 0,
    explanation: "O'zR FK 27-moddasi: 14 yoshdan 18 yoshgacha bo'lgan voyaga yetmaganlar bitimlarni ota-onalari yoki vasiylarining yozma roziligi bilan tuzadilar. Aks holda bitim shubhali hisoblanadi va bekor qilinishi mumkin."
  },
  {
    question: "20 yoshli xodim Sardor ish beruvchini ogohlantirmasdan va ariza yozmasdan 5 kun ishga chiqmadi. Ish beruvchi uni Mehnat kodeksiga ko'ra qaysi modda bilan ishdan bo'shatishi mumkin?",
    options: [
      "A) Mehnat intizomini qo'pol ravishda buzganligi uchun (MK 161-modda)",
      "B) Xodimni ishdan bo'shatish taqiqlanadi",
      "C) Faqat ma'muriy jarima qo'llaniladi",
      "D) Xodim o'z xohishiga ko'ra ketgan hisoblanadi"
    ],
    correct: 0,
    explanation: "O'zR Mehnat Kodeksining 161-moddasiga muvofiq, xodimning usursiz sabablarga ko'ra ishda bo'lmasligi mehnat majburiyatlarini qo'pol ravishda buzish hisoblanadi va ish beruvchi tashabbusi bilan bekor qilinadi."
  },
  {
    question: "Fuqaro Aziz va Olim o'rtasida 1 yillik uy-joy ijara shartnomasi og'zaki tuzildi va notariusda tasdiqlanmadi hamda soliq organida ro'yxatdan o'tkazilmadi. Nizoda ushbu bitim qanday baholanadi?",
    options: [
      "A) Qonunchilikka ko'ra ijara shartnomasi yozma tuzilishi va soliqda ro'yxatdan o'tkazilishi shart, aks holda bitim qonuniy kuchga ega emas",
      "B) Og'zaki bitim bo'lsa ham to'liq qonuniy kuchga ega",
      "C) Guvohlar bo'lsa kifoya",
      "D) Faqat shahar hokimiyati tasdiqlaydi"
    ],
    correct: 0,
    explanation: "O'zR Fuqarolik Kodeksining 600-moddasi va Soliq kodeksiga ko'ra turar joy ijara shartnomasi yozma shaklda tuzilishi va ijara.soliq.uz da hisobga qo'yilishi shart."
  },
  {
    question: "Akmal do'sti Nodirga 50,000,000 so'm qarz berdi va u notariusda tasdiqlanmasdan, oddiy yozma tilxat (qo'lxat) tuzildi. Sudda ushbu tilxat delil sifatida o'tadimi?",
    options: [
      "A) Ha, oddiy yozma tildagi tilxat qarz mavjudligini isbotlovchi to'liq yuridik dalil hisoblanadi",
      "B) Yo'q, notariusda tasdiqlanmagan tilxat o'tmaydi",
      "C) Faqat guvohlar kelib tasdiqlasa o'tadi",
      "D) BHMning 10 baravaridan oshsa mutlaqo o'tmaydi"
    ],
    correct: 0,
    explanation: "O'zR FK 733-moddasi: Fuqarolar o'rtasidagi qarz shartnomasi BHMning 10 baravaridan oshsa yozma tuzilishi shart. Tilxat yozma shakl talabiga javob beradi va notarial tasdiqlash shart emas."
  },
  {
    question: "16 yoshli o'quvchi Jasur darsdan bo'sh vaqtida kafega ishga kirdi. Ish beruvchi unga kuniga 10 soatlik ish smenasi belgiladi. Ushbu buyruq qonuniy bormi?",
    options: [
      "A) Noto'g'ri, MK 416-moddasiga ko'ra 16-18 yoshli o'smirlar uchun kunlik ish smenasi 7 soat 30 daqiqadan oshmasligi kerak",
      "B) Ha, xodim rozi bo'lsa qonuniy",
      "C) Faqat tungi vaqtda ishlasa taqiqlanadi",
      "D) Haftasiga 60 soatgacha ruxsat beriladi"
    ],
    correct: 0,
    explanation: "O'zR Mehnat Kodeksining 416-moddasiga muvofiq 16 yoshdan 18 yoshgacha bo'lgan o'smirlar uchun kunlik ish vaqti 7 soat 30 daqiqadan oshishi mumkin emas."
  }
];

let quizData = [];
let currentQuizIdx = 0;
let score = 0;
let userAnswers = [];
let quizTimerInterval = null;
let remainingSeconds = 0;
let totalExamTimeSeconds = 0;
let quizMode = 'quick'; // 'quick' | 'full' | 'cases'

function setupQuizEngine() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  startQuizMode('quick');
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function openOtmModal() {
  tg.HapticFeedback?.impactOccurred('medium');
  const modal = document.getElementById('otmModal');
  if (modal) modal.classList.remove('hidden');
}

function closeOtmModal() {
  const modal = document.getElementById('otmModal');
  if (modal) modal.classList.add('hidden');
}

async function startQuizMode(mode) {
  tg.HapticFeedback?.impactOccurred('heavy');
  quizMode = mode;

  const btnQuick = document.getElementById('modeBtnQuick');
  const btnFull = document.getElementById('modeBtnFull');
  const btnCases = document.getElementById('modeBtnCases');

  const activeClass = 'flex-1 py-2 px-2 bg-purple-600 text-white rounded-xl text-[11px] font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1';
  const inactiveClass = 'flex-1 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1';

  if (btnQuick && btnFull && btnCases) {
    btnQuick.className = mode === 'quick' ? activeClass : inactiveClass;
    btnFull.className = mode === 'full' ? activeClass : inactiveClass;
    btnCases.className = mode === 'cases' ? activeClass : inactiveClass;
  }

  if (mode === 'cases') {
    quizData = shuffleArray([...CASES_QUIZ_BANK]);
    remainingSeconds = 5 * 60; // 5 min
  } else {
    let pool = [...FULL_QUIZ_BANK];
    try {
      const res = await fetch('/api/quiz/questions');
      const dbQuestions = await res.json();
      if (Array.isArray(dbQuestions) && dbQuestions.length > 0) {
        pool = [...dbQuestions, ...FULL_QUIZ_BANK];
      }
    } catch (e) {}

    pool = shuffleArray(pool);

    if (mode === 'quick') {
      quizData = pool.slice(0, 5);
      remainingSeconds = 5 * 45; // 3 min 45 sec
    } else {
      quizData = pool.slice(0, 10);
      remainingSeconds = 15 * 60; // 15 min
    }
  }

  totalExamTimeSeconds = remainingSeconds;
  currentQuizIdx = 0;
  score = 0;
  userAnswers = [];

  startQuizTimer();
  renderQuizQuestion();
}

function startQuizTimer() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);

  updateTimerDisplay();
  quizTimerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(quizTimerInterval);
      tg.HapticFeedback?.notificationOccurred('error');
      alert('⏱ Vaqt tugadi! Imtihon natijalari hisoblanmoqda...');
      submitQuizResult();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('quizTimer');
  if (!timerEl) return;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  timerEl.textContent = `⏱ ${formatted}`;

  if (remainingSeconds < 60) {
    timerEl.className = 'text-xs font-mono bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full border border-red-500/40 animate-pulse';
  } else {
    timerEl.className = 'text-xs font-mono bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30';
  }
}

function renderQuizQuestion() {
  const questionNum = document.getElementById('quizQuestionNum');
  const questionText = document.getElementById('quizQuestionText');
  const optionsDiv = document.getElementById('quizOptions');
  const progressBar = document.getElementById('quizProgressBar');

  if (!questionNum || !questionText || !optionsDiv) return;

  if (currentQuizIdx >= quizData.length) {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    submitQuizResult();
    return;
  }

  const progressPct = ((currentQuizIdx) / quizData.length) * 100;
  if (progressBar) progressBar.style.width = `${progressPct}%`;

  const q = quizData[currentQuizIdx];
  questionNum.textContent = `Savol ${currentQuizIdx + 1} / ${quizData.length}`;

  const imageHtml = q.imageUrl ? `<div class="mb-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1"><img src="${escapeHtml(q.imageUrl)}" alt="Test Rasmi" class="w-full max-h-56 object-contain rounded-lg"></div>` : '';
  questionText.innerHTML = `${imageHtml}<span>${escapeHtml(q.question)}</span>`;

  optionsDiv.innerHTML = q.options.map((opt, idx) => `
    <button onclick="handleAnswer(${idx})" class="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-all font-medium flex items-center gap-2 active:scale-98">
      <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px] flex items-center justify-center">${String.fromCharCode(65 + idx)}</span>
      ${escapeHtml(opt)}
    </button>
  `).join('');
}

function handleAnswer(selectedIdx) {
  const q = quizData[currentQuizIdx];
  tg.HapticFeedback?.impactOccurred('medium');

  const isCorrect = selectedIdx === q.correct;
  if (isCorrect) {
    score++;
    tg.HapticFeedback?.notificationOccurred('success');
  } else {
    tg.HapticFeedback?.notificationOccurred('error');
  }

  userAnswers.push({
    question: q.question,
    options: q.options,
    selected: selectedIdx,
    correct: q.correct,
    explanation: q.explanation,
    isCorrect
  });

  currentQuizIdx++;
  renderQuizQuestion();
}

async function submitQuizResult() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);

  const questionNum = document.getElementById('quizQuestionNum');
  const questionText = document.getElementById('quizQuestionText');
  const optionsDiv = document.getElementById('quizOptions');
  const progressBar = document.getElementById('quizProgressBar');

  if (progressBar) progressBar.style.width = '100%';

  const timeSpentSeconds = totalExamTimeSeconds - remainingSeconds;
  const timeSpentMins = Math.floor(timeSpentSeconds / 60);
  const timeSpentSecs = timeSpentSeconds % 60;
  const formattedSpent = `${timeSpentMins} daq ${timeSpentSecs} sek`;

  try {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: currentTelegramId,
        score,
        totalQuestions: quizData.length,
        durationSeconds: timeSpentSeconds
      })
    });
    const data = await res.json();

    const gradeColor = data.gradeLevel === 'A+' ? 'text-emerald-400' :
                       data.gradeLevel === 'A' ? 'text-blue-400' :
                       data.gradeLevel === 'B+' ? 'text-purple-400' :
                       data.gradeLevel === 'B' ? 'text-amber-400' : 'text-red-400';

    if (questionNum) {
      questionNum.innerHTML = `<span class="${gradeColor} font-bold text-sm">🎓 Grade: ${data.gradeLevel} (${Math.round(data.percentage)}%)</span>`;
    }

    if (questionText) {
      questionText.innerHTML = `
        <div class="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-1 my-1 text-xs">
          <div class="flex justify-between font-semibold text-slate-200">
            <span>🎯 To'g'ri javoblar:</span>
            <span class="text-emerald-400 font-bold">${score} / ${quizData.length}</span>
          </div>
          <div class="flex justify-between font-semibold text-slate-200">
            <span>⏱ Sarflangan vaqt:</span>
            <span class="text-purple-300 font-mono">${formattedSpent}</span>
          </div>
        </div>
      `;
    }

    if (optionsDiv) {
      const reviewHtml = userAnswers.map((ua, idx) => `
        <div class="bg-slate-900 border ${ua.isCorrect ? 'border-emerald-500/40' : 'border-red-500/40'} p-3 rounded-xl space-y-1.5 text-left text-xs">
          <div class="flex items-center justify-between font-bold">
            <span class="${ua.isCorrect ? 'text-emerald-400' : 'text-red-400'}">${idx + 1}-Savol: ${ua.isCorrect ? '✅ To‘g‘ri' : '❌ Noto‘g‘ri'}</span>
          </div>
          <p class="text-slate-200 font-semibold leading-snug">${escapeHtml(ua.question)}</p>
          <div class="text-[11px] space-y-0.5 pt-1">
            <div class="${ua.isCorrect ? 'text-emerald-300 font-bold' : 'text-red-400'}">Sizning javobingiz: ${escapeHtml(ua.options[ua.selected])}</div>
            ${!ua.isCorrect ? `<div class="text-emerald-400 font-bold">To‘g‘ri javob: ${escapeHtml(ua.options[ua.correct])}</div>` : ''}
          </div>
          <div class="bg-slate-800/80 p-2 rounded-lg text-[10px] text-slate-300 border border-slate-700/60 mt-1">
            💡 <strong class="text-purple-300">O'zR Qonunchiligi Izohi:</strong> ${escapeHtml(ua.explanation)}
          </div>
        </div>
      `).join('');

      optionsDiv.innerHTML = `
        <div class="space-y-3 pt-2">
          ${reviewHtml}
          <button onclick="resetQuiz()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs active:scale-95 shadow-lg shadow-purple-600/30">
            🔄 Boshqa Rejimda Qayta Topshirish
          </button>
        </div>
      `;
    }
  } catch (err) {
    if (questionNum) questionNum.textContent = '🎉 Yakunlandi';
    if (questionText) questionText.textContent = `Natija: ${score} / ${quizData.length}`;
  }
}

function resetQuiz() {
  setupQuizEngine();
}

// ----------------------------------------------------
// 4. QONUNCHILIK, MILLIY SERTIFIKAT 52 TA QONUN & LEX.UZ LINKS
// ----------------------------------------------------
let currentLawsMode = 'recommended'; // 'recommended' | 'constitution'
let currentLawsQuery = '';

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('huquqchi_bookmarks') || '[]');
  } catch (e) {
    return [];
  }
}

function toggleBookmark(id, type, name, category, lexUrl, text) {
  tg.HapticFeedback?.impactOccurred('medium');
  let bookmarks = getBookmarks();
  const idx = bookmarks.findIndex(b => b.id === id && b.type === type);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    alert('⭐️ Saqlanganlardan olib tashlandi.');
  } else {
    bookmarks.push({ id, type, name, category, lexUrl, text });
    alert('⭐ Saqlanganlarga muvaffaqiyatli qo‘shildi!');
  }
  localStorage.setItem('huquqchi_bookmarks', JSON.stringify(bookmarks));
  if (currentLawsMode === 'bookmarks') loadConstArticles();
}

function setupConstArticles() {
  loadConstArticles();
}

function filterLawsCategory(mode, btn) {
  tg.HapticFeedback?.impactOccurred('light');
  currentLawsMode = mode;

  document.querySelectorAll('.law-cat-btn').forEach(el => {
    el.className = 'law-cat-btn flex-shrink-0 px-3 py-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-xl transition-all';
  });

  if (btn) {
    btn.className = 'law-cat-btn flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white rounded-xl shadow-md transition-all font-bold';
  }

  loadConstArticles();
}

function handleLawSearchInput(query) {
  currentLawsQuery = query.trim().toLowerCase();
  loadConstArticles();
}

function loadConstArticles() {
  const list = document.getElementById('constArticlesList');
  if (!list) return;

  if (currentLawsMode === 'bookmarks') {
    const bookmarks = getBookmarks();
    const filtered = currentLawsQuery
      ? bookmarks.filter(b => (b.name || b.title || '').toLowerCase().includes(currentLawsQuery) || (b.text || '').toLowerCase().includes(currentLawsQuery))
      : bookmarks;

    if (filtered.length === 0) {
      list.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Saqlangan qonunlar mavjud emas. Sevimli qonun yoki moddalaringizni ⭐ tugmasi orqali saqlang!</div>';
      return;
    }

    list.innerHTML = filtered.map(item => `
      <div class="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 space-y-2 transition-all">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-300">${escapeHtml(item.name || item.title)}</span>
          <button onclick="toggleBookmark(${item.id}, '${item.type}', '${escapeHtml(item.name || item.title)}', '${escapeHtml(item.category || '')}', '${item.lexUrl || ''}', '${escapeHtml(item.text || '')}')" class="text-amber-400 hover:scale-110 p-1">
            <i class="fa-solid fa-star text-sm"></i>
          </button>
        </div>
        ${item.text ? `<p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(item.text)}</p>` : ''}
        ${item.lexUrl ? `
          <div class="flex justify-end pt-1 border-t border-slate-800">
            <a href="${item.lexUrl}" target="_blank" class="text-[10px] bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg font-bold flex items-center gap-1 border border-amber-500/30">
              <i class="fa-solid fa-up-right-from-square text-[9px]"></i> Lex.uz'da O'qish
            </a>
          </div>
        ` : ''}
      </div>
    `).join('');
    return;
  }

  if (currentLawsMode === 'constitution') {
    fetch(`/api/constitution?q=${encodeURIComponent(currentLawsQuery)}`)
      .then(res => res.json())
      .then(articles => {
        const filtered = currentLawsQuery
          ? articles.filter(a => a.title.toLowerCase().includes(currentLawsQuery) || a.text.toLowerCase().includes(currentLawsQuery))
          : articles;

        if (filtered.length === 0) {
          list.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Modda topilmadi.</div>';
          return;
        }

        const bookmarks = getBookmarks();
        list.innerHTML = filtered.map(art => {
          const isSaved = bookmarks.some(b => b.id === art.id && b.type === 'const');
          return `
            <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 space-y-1 transition-all">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400">${escapeHtml(art.title)}</span>
                <div class="flex items-center gap-1.5">
                  <button onclick="toggleBookmark(${art.id}, 'const', '${escapeHtml(art.title)}', 'Konstitutsiya', '', '${escapeHtml(art.text)}')" class="${isSaved ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} transition-colors p-1">
                    <i class="fa-solid fa-star text-xs"></i>
                  </button>
                  <button onclick="playConstAudio(${art.id}, ${art.articleNumber}, '${escapeHtml(art.title)}')" class="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-500/30 border border-emerald-500/30 active:scale-95">
                    <i class="fa-solid fa-volume-high"></i> Audio
                  </button>
                </div>
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(art.text)}</p>
            </div>
          `;
        }).join('');
      })
      .catch(() => {
        list.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Moddalar yuklanmoqda...</div>';
      });
  } else {
    let catParam = currentLawsMode;
    if (currentLawsMode === 'recommended') catParam = 'sertifikat';

    fetch(`/api/laws?category=${encodeURIComponent(catParam)}&q=${encodeURIComponent(currentLawsQuery)}`)
      .then(res => res.json())
      .then(laws => {
        if (!laws || laws.length === 0) {
          list.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Ushbu sohada qonun topilmadi.</div>';
          return;
        }

        const bookmarks = getBookmarks();
        list.innerHTML = laws.map(law => {
          const isSaved = bookmarks.some(b => b.id === law.id && b.type === 'law');
          return `
            <div class="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 space-y-2 transition-all">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                    ${law.id}
                  </span>
                  <span class="text-xs font-bold text-white leading-snug">${escapeHtml(law.name)}</span>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <button onclick="toggleBookmark(${law.id}, 'law', '${escapeHtml(law.name)}', '${escapeHtml(law.category)}', '${law.lexUrl}', '')" class="${isSaved ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'} transition-colors p-1">
                    <i class="fa-solid fa-star text-xs"></i>
                  </button>
                  <span class="text-[9px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ${escapeHtml(law.category)}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span class="text-[10px] text-slate-400">
                  <i class="fa-solid fa-scale-balanced text-emerald-400 mr-1"></i> O'zR Rasmiy Qonunchiligi
                </span>
                <a href="${law.lexUrl}" target="_blank" onclick="tg.HapticFeedback?.impactOccurred('medium')" class="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all active:scale-95">
                  <i class="fa-solid fa-up-right-from-square text-[9px]"></i> Lex.uz'da O'qish
                </a>
              </div>
            </div>
          `;
        }).join('');
      })
      .catch(() => {
        list.innerHTML = '<div class="text-xs text-slate-400 p-4 text-center">Qonunchilik hujjatlari yuklanmoqda...</div>';
      });
  }
}

function playConstAudio(artId, artNum, artTitle) {
  tg.HapticFeedback?.impactOccurred('medium');

  const playerBar = document.getElementById('audioPlayerBar');
  const player = document.getElementById('globalAudioPlayer');
  const titleEl = document.getElementById('audioArticleTitle');
  const statusEl = document.getElementById('audioStatusText');
  const playIcon = document.getElementById('audioPlayIcon');

  if (!playerBar || !player) return;

  playerBar.classList.remove('hidden');
  if (titleEl) titleEl.textContent = artTitle || `${artNum}-modda Audiosi`;
  if (statusEl) statusEl.textContent = '⏳ Audio yuklanmoqda...';

  player.src = `/api/constitution/audio?articleId=${artId}&articleNumber=${artNum}`;
  player.play()
    .then(() => {
      if (statusEl) statusEl.textContent = '🎧 Ijro etilmoqda...';
      if (playIcon) playIcon.className = 'fa-solid fa-pause';
    })
    .catch(() => {
      if (statusEl) statusEl.textContent = '▶️ Ijroni boshlash';
      if (playIcon) playIcon.className = 'fa-solid fa-play';
    });

  player.onended = () => {
    if (statusEl) statusEl.textContent = '✅ Yakunlandi';
    if (playIcon) playIcon.className = 'fa-solid fa-play';
  };
}

function toggleConstAudio() {
  const player = document.getElementById('globalAudioPlayer');
  const playIcon = document.getElementById('audioPlayIcon');
  const statusEl = document.getElementById('audioStatusText');
  if (!player) return;

  if (player.paused) {
    player.play();
    if (playIcon) playIcon.className = 'fa-solid fa-pause';
    if (statusEl) statusEl.textContent = '🎧 Ijro etilmoqda...';
  } else {
    player.pause();
    if (playIcon) playIcon.className = 'fa-solid fa-play';
    if (statusEl) statusEl.textContent = '⏸ Pauza';
  }
}

function closeConstAudio() {
  const playerBar = document.getElementById('audioPlayerBar');
  const player = document.getElementById('globalAudioPlayer');
  if (player) player.pause();
  if (playerBar) playerBar.classList.add('hidden');
}

// ----------------------------------------------------
// 5. DOCUMENT GENERATOR FORM
// ----------------------------------------------------
function setupDocForm() {
  const form = document.getElementById('docForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('docTypeSelect').value;
    const partyAName = document.getElementById('partyAName').value.trim();
    const partyBName = document.getElementById('partyBName').value.trim();
    const docAmount = document.getElementById('docAmount').value.trim();
    const docDetails = document.getElementById('docDetails').value.trim();

    const btn = document.getElementById('docGenerateBtn');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> PDF Yaratilmoqda...';

    try {
      const response = await fetch('/api/doc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: currentTelegramId,
          type,
          partyA: { name: partyAName },
          partyB: { name: partyBName },
          details: {
            amountOrPrice: docAmount,
            additionalInfo: docDetails
          }
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errData = await response.json();
          alert('⚠️ ' + (errData.error || 'Kunlik bepul PDF hujjat generatsiya kvotangiz tugadi!'));
          setTimeout(() => openProModal(), 500);
          return;
        }
        throw new Error('Generatsiya xatoligi');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Huquqchi_${type}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      tg.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      alert('❌ PDF Hujjat yaratishda xatolik yuz berdi.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  });
}

// ----------------------------------------------------
// 6. USER PROFILE & REGISTRATION MODAL
// ----------------------------------------------------
function openProfileModal() {
  tg.HapticFeedback?.impactOccurred('medium');
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  const mName = document.getElementById('modalUserName');
  const fName = document.getElementById('profFirstName');
  const lName = document.getElementById('profLastName');
  const roleSel = document.getElementById('profRole');
  const phoneInp = document.getElementById('profPhone');
  const quotaText = document.getElementById('profAiQuota');

  if (mName) mName.textContent = currentUserName;
  if (fName && (!fName.value || fName.value === 'Foydalanuvchi')) {
    fName.value = currentUserName !== 'Foydalanuvchi' ? currentUserName : '';
  }

  if (currentTelegramId) {
    fetch(`/api/user?telegramId=${currentTelegramId}`)
      .then(res => res.json())
      .then(user => {
        if (user && !user.error) {
          if (fName && user.firstName) fName.value = user.firstName;
          if (lName && user.lastName) lName.value = user.lastName || '';
          if (roleSel && user.role) roleSel.value = user.role;
          if (phoneInp && user.phone) phoneInp.value = user.phone || '';
          if (quotaText) {
            quotaText.textContent = user.isPro ? 'VIP PRO / CHEKSIZ' : `${user.usage.todayAiCount}/2 ta ishlatildi`;
          }
        }
      })
      .catch(() => {});
  }

  modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

function handleProfileSubmit(e) {
  e.preventDefault();
  tg.HapticFeedback?.impactOccurred('heavy');

  const btn = document.getElementById('btnSaveProfile');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Saqlanmoqda...';
  }

  const firstName = document.getElementById('profFirstName')?.value.trim();
  const lastName = document.getElementById('profLastName')?.value.trim();
  const role = document.getElementById('profRole')?.value;
  const phone = document.getElementById('profPhone')?.value.trim();

  fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramId: currentTelegramId || 123456789,
      firstName: firstName || currentUserName,
      lastName: lastName || null,
      username: tg.initDataUnsafe?.user?.username || null,
      role: role || 'FUQARO',
      phone: phone || null,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-check mr-1"></i> Saqlash & Ro\'yxatdan O\'tish';
      }

      if (data.success) {
        tg.HapticFeedback?.notificationOccurred('success');
        currentUserName = data.user.firstName;
        setupHeaderUser();
        closeProfileModal();
        alert('✅ Ma’lumotlaringiz va profiliz muvaffaqiyatli saqlandi!');
      } else {
        alert('⚠️ Xatolik yuz berdi: ' + (data.error || 'Saqlab bo\'lmadi'));
      }
    })
    .catch(err => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-check mr-1"></i> Saqlash & Ro\'yxatdan O\'tish';
      }
      alert('⚠️ Tizim xatoligi yuz berdi');
    });
}

// ----------------------------------------------------
// 7. VIP PRO MODAL
// ----------------------------------------------------
function openProModal() {
  tg.HapticFeedback?.impactOccurred('heavy');
  const modal = document.getElementById('proModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProModal() {
  const modal = document.getElementById('proModal');
  if (modal) modal.classList.add('hidden');
}

function payViaTelegram() {
  tg.HapticFeedback?.notificationOccurred('success');
  alert("💳 To'lov amalga oshirish uchun Telegram Botga /start yuboring va 'VIP PRO Obuna' menyusini tanlang.");
  closeProModal();
}

// ----------------------------------------------------
// 8. DTM & MILLIY SERTIFIKAT EXAM COUNTDOWN TIMER
// ----------------------------------------------------
function startExamCountdown() {
  // Target Exam Date: July 1, 2026 09:00:00
  const examDate = new Date('2026-07-01T09:00:00+05:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = examDate - now;

    const daysEl = document.getElementById('countdownDays');
    const hoursEl = document.getElementById('countdownHours');
    const minsEl = document.getElementById('countdownMins');
    const secsEl = document.getElementById('countdownSecs');

    if (distance < 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ----------------------------------------------------
// 9. YURIDIK ATAMALAR FLASHCARDS SYSTEM
// ----------------------------------------------------
const FLASHCARDS_DATA = [
  {
    term: "Emansipatsiya",
    category: "FUQAROLIK HUQUQI",
    definition: "16 yoshga to'lgan voyaga yetmagan shaxsning mehnat shartnomasi bo'yicha ishlayotgani yoki tadbirkorlik faoliyati bilan shug'ullanayotgani munosabati bilan to'liq muomala layoqatli deb e'lon qilinishi.",
    article: "📜 Manba: O'zR Fuqarolik Kodeksi 28-moddasi"
  },
  {
    term: "Legitimlik",
    category: "KONSTITUTSIYAVIY HUQUQ",
    definition: "Davlat hokimiyati, qonunlar va mansabdor shaxslar faoliyatining xalq va jamiyat tomonidan tan olinishi, qonuniy va adolatli deb e'tirof etilishi.",
    article: "📜 Manba: Konstitutsiyaviy Huquq Atamalari"
  },
  {
    term: "Presedent (Yuridik)",
    category: "HUQUQ NAZARIYASI",
    definition: "Sud yoki ma'muriy organning muayyan ish bo'yicha chiqargan va keyinchalik o'xshash barcha ishlar uchun majburiy qoida bo'lib xizmat qiladigan qarori.",
    article: "📜 Manba: Umumiy Huquq Sistemasi"
  },
  {
    term: "Suverenitet",
    category: "KONSTITUTSIYAVIY HUQUQ",
    definition: "Davlatning o'z hududida oliy hokimiyatga ega bo'lishi hamda tashqi munosabatlarda boshqa davlatlardan mustaqilligi.",
    article: "📜 Manba: O'zR Konstitutsiyasi 1-moddasi"
  },
  {
    term: "Apellyatsiya",
    category: "PROTSESSUAL HUQUQ",
    definition: "Sudning hali qonuniy kuchga kirmagan hal qiluv qarorlari va hukmlari ustidan yuqori sudga shikoyat qilish va qayta ko'rib chiqish tartibi.",
    article: "📜 Manba: FPK & FPK Kodekslari"
  },
  {
    term: "Kassatsiya",
    category: "PROTSESSUAL HUQUQ",
    definition: "Sudning qonuniy kuchga kirgan hal qiluv qarorlari yoki hukmlari ustidan qonuniylik va adolatlilik nuqtai nazaridan shikoyat berish tartibi.",
    article: "📜 Manba: Sud Protsessi Qonunlari"
  },
  {
    term: "Amnistiya",
    category: "JINOYAT HUQUQI",
    definition: "Oliy Majlis Senati tomonidan muayyan toifadagi shaxslarni jinoyat javobgarligidan yoki jazodan ozod qilish haqida qabul qilinadigan akt.",
    article: "📜 Manba: O'zR Jinoyat Kodeksi 68-moddasi"
  },
  {
    term: "Ratifikatsiya",
    category: "XALQARO HUQUQ",
    definition: "Xalqaro shartnoma va bitimlar davlatning Oliy vakillik organi (Parlament) tomonidan ma'qullanib, yuridik kuchga kiritilishi tartibi.",
    article: "📜 Manba: Xalqaro Shartnomalar Qonuni"
  },
  {
    term: "Referendum",
    category: "KONSTITUTSIYAVIY HUQUQ",
    definition: "Eng muhim davlat va jamiyat masalalari bo'yicha fuqarolarning umumxalq ovoz berishi (bevosita demokratiya shakli).",
    article: "📜 Manba: Referendum to'g'risidagi Qonun"
  },
  {
    term: "Muomala Layoqati",
    category: "FUQAROLIK HUQUQI",
    definition: "Shaxsning o'z harakatlari bilan fuqarolik huquqlariga ega bo'lish va o'zi uchun fuqarolik majburiyatlarini yaratish hamda ularni bajarish qobiliyati.",
    article: "📜 Manba: O'zR FK 22-moddasi"
  }
];

let currentFcIdx = 0;
let isFcFlipped = false;

function openFlashcardsModal() {
  tg.HapticFeedback?.impactOccurred('medium');
  const modal = document.getElementById('flashcardsModal');
  if (modal) modal.classList.remove('hidden');

  currentFcIdx = 0;
  isFcFlipped = false;
  renderFlashcard();
}

function closeFlashcardsModal() {
  const modal = document.getElementById('flashcardsModal');
  if (modal) modal.classList.add('hidden');
}

function renderFlashcard() {
  const fcCategory = document.getElementById('fcCategory');
  const fcTermTitle = document.getElementById('fcTermTitle');
  const fcTermDef = document.getElementById('fcTermDef');
  const fcTermArticle = document.getElementById('fcTermArticle');
  const fcCounter = document.getElementById('flashcardCounter');
  const front = document.getElementById('fcCardFront');
  const back = document.getElementById('fcCardBack');

  if (currentFcIdx < 0) currentFcIdx = FLASHCARDS_DATA.length - 1;
  if (currentFcIdx >= FLASHCARDS_DATA.length) currentFcIdx = 0;

  const item = FLASHCARDS_DATA[currentFcIdx];

  if (fcCounter) fcCounter.textContent = `${currentFcIdx + 1} / ${FLASHCARDS_DATA.length}`;
  if (fcCategory) fcCategory.textContent = item.category;
  if (fcTermTitle) fcTermTitle.textContent = item.term;
  if (fcTermDef) fcTermDef.textContent = item.definition;
  if (fcTermArticle) fcTermArticle.textContent = item.article;

  isFcFlipped = false;
  if (front) front.classList.remove('hidden');
  if (back) back.classList.add('hidden');
}

function flipFlashcard() {
  tg.HapticFeedback?.impactOccurred('light');
  isFcFlipped = !isFcFlipped;

  const front = document.getElementById('fcCardFront');
  const back = document.getElementById('fcCardBack');

  if (isFcFlipped) {
    if (front) front.classList.add('hidden');
    if (back) back.classList.remove('hidden');
  } else {
    if (front) front.classList.remove('hidden');
    if (back) back.classList.add('hidden');
  }
}

function nextFlashcard() {
  tg.HapticFeedback?.impactOccurred('medium');
  currentFcIdx++;
  renderFlashcard();
}

function prevFlashcard() {
  tg.HapticFeedback?.impactOccurred('medium');
  currentFcIdx--;
  renderFlashcard();
}

// Helper: HTML Escaper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
