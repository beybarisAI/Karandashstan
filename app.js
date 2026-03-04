// ════════════════════════════════════════════
//   QalamStan — play.qalamstan.kz — app.js
//   Firebase Realtime Database auth + UI logic
// ════════════════════════════════════════════

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, child }
                             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Firebase config ──────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCrOOvdQDSQeLub4J1HRSuWQAnVC05Wsq4",
  authDomain:        "qalamstan-eac25.firebaseapp.com",
  projectId:         "qalamstan-eac25",
  storageBucket:     "qalamstan-eac25.firebasestorage.app",
  messagingSenderId: "456019809682",
  appId:             "1:456019809682:web:eed4aed0183543caf1dd4b",
  measurementId:     "G-9RWWP78L4S",
  databaseURL:       "https://qalamstan-eac25-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── Simple hash (NOT for production — use Firebase Auth for real apps) ──
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(password);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Session helpers ──────────────────────────
const SESSION_KEY = "qalamstan_user";
let currentUser   = null;

function saveSession(nick) {
  sessionStorage.setItem(SESSION_KEY, nick);
  currentUser = nick;
}
function loadSession() {
  return sessionStorage.getItem(SESSION_KEY);
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
}

// ── Tab switcher ─────────────────────────────
window.switchTab = function(tab) {
  document.getElementById("tabLogin").classList.toggle("active",    tab === "login");
  document.getElementById("tabRegister").classList.toggle("active", tab === "register");
  document.getElementById("formLogin").classList.toggle("hidden",    tab !== "login");
  document.getElementById("formRegister").classList.toggle("hidden", tab !== "register");
  document.getElementById("loginError").textContent    = "";
  document.getElementById("registerError").textContent = "";
};

// ── Auth handlers ────────────────────────────
window.handleLogin = async function() {
  const nick = document.getElementById("loginNick").value.trim();
  const pwd  = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");

  if (!nick || !pwd) { errEl.textContent = "Барлық өрістерді толтырыңыз."; return; }

  try {
    const snap = await get(child(ref(db), `users/${nick}`));
    if (!snap.exists()) { errEl.textContent = "Мұндай пайдаланушы жоқ."; return; }

    const stored = snap.val();
    const hashed = await hashPassword(pwd);

    if (stored.password !== hashed) { errEl.textContent = "Құпиясөз қате."; return; }

    saveSession(nick);
    enterSite(nick);
  } catch(e) {
    errEl.textContent = "Қате орын алды. Қайта көріңіз.";
    console.error(e);
  }
};

window.handleRegister = async function() {
  const nick   = document.getElementById("regNick").value.trim();
  const pwd    = document.getElementById("regPassword").value;
  const pwdCnf = document.getElementById("regPasswordConfirm").value;
  const errEl  = document.getElementById("registerError");

  if (!nick || !pwd || !pwdCnf) { errEl.textContent = "Барлық өрістерді толтырыңыз."; return; }
  if (pwd !== pwdCnf)            { errEl.textContent = "Құпиясөздер сәйкес келмейді."; return; }
  if (pwd.length < 6)            { errEl.textContent = "Құпиясөз кем дегенде 6 таңба болуы керек."; return; }
  if (!/^[A-Za-z0-9_]+$/.test(nick)) {
    errEl.textContent = "НИК тек латын әріптері, цифр, _ қолдануы мүмкін."; return;
  }

  try {
    const snap = await get(child(ref(db), `users/${nick}`));
    if (snap.exists()) { errEl.textContent = "Бұл НИК бос емес."; return; }

    const hashed = await hashPassword(pwd);
    await set(ref(db, `users/${nick}`), {
      password:  hashed,
      nick:      nick,
      createdAt: Date.now()
    });

    saveSession(nick);
    enterSite(nick);
  } catch(e) {
    errEl.textContent = "Тіркелу кезінде қате орын алды.";
    console.error(e);
  }
};

window.handleLogout = function() {
  clearSession();
  document.getElementById("loginOverlay").classList.remove("fade-out");
  document.getElementById("navUser").textContent = "";
};

function enterSite(nick) {
  const overlay = document.getElementById("loginOverlay");
  overlay.classList.add("fade-out");
  document.getElementById("navUser").textContent = `⛏ ${nick}`;
}

// ── On load — check session ──────────────────
(function init() {
  const saved = loadSession();
  if (saved) {
    enterSite(saved);
  }
})();

// ════════════════ RANK DATA ══════════════════
const rankData = {
  vip: {
    title:  "VIP",
    color:  "#22c55e",
    icon:   "👑",
    perks:  [
      { icon:"🔀", text:"Телепортацияны өшіру",   cmd:"/tptoggle" },
      { icon:"🎒", text:"Өз китің",               cmd:"/kits" },
      { icon:"🪚", text:"Виртуалды верстак",       cmd:"/workbench" },
      { icon:"📦", text:"Инвентарь",              cmd:"" },
      { icon:"🏠", text:"Үй нүктелері: 2",        cmd:"" },
      { icon:"🏰", text:"База саны: 2",           cmd:"" },
      { icon:"📐", text:"Приват аймақ: 360 блок", cmd:"" },
      { icon:"👥", text:"Достар лимиті: 3",       cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"480₸" },
      { label:"3 ай",      price:"1 260₸" },
      { label:"Шексіздік", price:"1 840₸" }
    ]
  },
  lord: {
    title:  "LORD",
    color:  "#1e3a8a",
    icon:   "⚔️",
    perks:  [
      { icon:"🎩", text:"Блокты басыңа кию",  cmd:"/hat" },
      { icon:"🍖", text:"Қарын тойдыру",      cmd:"/feed" },
      { icon:"🎒", text:"Өз китің",           cmd:"/kits" },
      { icon:"🔍", text:"Зат ID-сін білу",    cmd:"/iteminfo" },
      { icon:"🧵", text:"Виртуалды тоқыма",   cmd:"/loom" },
      { icon:"🏠", text:"Үй нүктелері: 2",    cmd:"" },
      { icon:"🏰", text:"База саны: 2",       cmd:"" },
      { icon:"📐", text:"Приват аймақ: 400 блок", cmd:"" },
      { icon:"👥", text:"Достар лимиті: 4",   cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"926₸" },
      { label:"3 ай",      price:"2 479₸" },
      { label:"Шексіздік", price:"3 145₸" }
    ]
  },
  overlord: {
    title:  "OVERLORD",
    color:  "#38bdf8",
    icon:   "🌊",
    perks:  [
      { icon:"🌍", text:"Алыс телепортация",       cmd:"/rtp far" },
      { icon:"🔥", text:"Өзіңді сөндіру",          cmd:"/ext" },
      { icon:"🎒", text:"Өз китің",                cmd:"/kits" },
      { icon:"🚫", text:"Ойыншыны елемеу",         cmd:"/ignore" },
      { icon:"🗑️", text:"Инвентарды тазалау",     cmd:"/clear" },
      { icon:"🗺️", text:"Картограф үстелі",        cmd:"/cartographytable" },
      { icon:"🏠", text:"Үй нүктелері: 4",         cmd:"" },
      { icon:"🏰", text:"База саны: 3",            cmd:"" },
      { icon:"📐", text:"Приват аймақ: 440 блок",  cmd:"" },
      { icon:"👥", text:"Достар лимиті: 5",        cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"1 798₸" },
      { label:"3 ай",      price:"4 323₸" },
      { label:"Шексіздік", price:"5 643₸" }
    ]
  },
  elite: {
    title:  "ELITE",
    color:  "#f97316",
    icon:   "🔱",
    perks:  [
      { icon:"❤️", text:"Денсаулықты толықтыру",  cmd:"/heal" },
      { icon:"📦", text:"Эндер-сандық",           cmd:"/ec" },
      { icon:"🎒", text:"Өз китің",               cmd:"/kits" },
      { icon:"⏰", text:"Жеке уақыт орнату",      cmd:"/ptime" },
      { icon:"🌍", text:"Алыс телепортация",       cmd:"/rtp far" },
      { icon:"🔧", text:"Бір затты жөндеу",       cmd:"/repair" },
      { icon:"🏠", text:"Үй нүктелері: 5",        cmd:"" },
      { icon:"🏰", text:"База саны: 5",           cmd:"" },
      { icon:"📐", text:"Приват аймақ: 500 блок", cmd:"" },
      { icon:"👥", text:"Достар лимиті: 6",       cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"2 651₸" },
      { label:"3 ай",      price:"5 498₸" },
      { label:"Шексіздік", price:"6 743₸" }
    ]
  },
  phantom: {
    title:  "PHANTOM",
    color:  "#a855f7",
    icon:   "👻",
    perks:  [
      { icon:"🔧", text:"Барлық заттарды жөндеу",   cmd:"/repair all" },
      { icon:"🎒", text:"Өз китің",                 cmd:"/kits" },
      { icon:"🔇", text:"Ойыншыға мут беру",        cmd:"/mute" },
      { icon:"🧭", text:"Жақын телепортация",       cmd:"/rtp near" },
      { icon:"🪨", text:"Виртуалды таскескіш",      cmd:"/stonecutter" },
      { icon:"🏠", text:"Үй нүктелері: 6",          cmd:"" },
      { icon:"🏰", text:"База саны: 6",             cmd:"" },
      { icon:"📐", text:"Приват аймақ: 540 блок",   cmd:"" },
      { icon:"👥", text:"Достар лимиті: 7",         cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"3 300₸" },
      { label:"3 ай",      price:"6 854₸" },
      { label:"Шексіздік", price:"8 076₸" }
    ]
  },
  legend: {
    title:  "LEGEND",
    color:  "#3b82f6",
    icon:   "🌀",
    perks:  [
      { icon:"👜", text:"Инвентарға кіру",          cmd:"/invsee" },
      { icon:"📢", text:"Хабарландыру жазу",        cmd:"/broadcast" },
      { icon:"🎒", text:"Өз китің",                 cmd:"/kits" },
      { icon:"📖", text:"Кітаптарды өңдеу",        cmd:"/book" },
      { icon:"🗑️", text:"Виртуалды қоқыс жәшігі", cmd:"/dispose" },
      { icon:"⏳", text:"Уақытша бан беру",         cmd:"/tempban" },
      { icon:"🏠", text:"Үй нүктелері: 7",          cmd:"" },
      { icon:"🏰", text:"База саны: 8",             cmd:"" },
      { icon:"📐", text:"Приват аймақ: 580 блок",   cmd:"" },
      { icon:"👥", text:"Достар лимиті: 8",         cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"4 127₸" },
      { label:"3 ай",      price:"9 123₸" },
      { label:"Шексіздік", price:"12 000₸" }
    ]
  },
  king: {
    title:  "KING",
    color:  "#ef4444",
    icon:   "🔥",
    perks:  [
      { icon:"🔊", text:"Ойыншыны размут ету",              cmd:"/unmute" },
      { icon:"📦", text:"Эндер-сандықты ашу",              cmd:"/ec (ник)" },
      { icon:"🎒", text:"Өз китің",                         cmd:"/kits" },
      { icon:"🏛️", text:"Жеке мемлекет аша алады",         cmd:"" },
      { icon:"🔍", text:"Ойыншыны табу",                    cmd:"/near" },
      { icon:"⚙️", text:"Жөндеу + сиқырды алу",            cmd:"/grindstone" },
      { icon:"✏️", text:"Мәтінді астын сызылған жазу",     cmd:"" },
      { icon:"✏️", text:"Мәтінді үсті сызылған жазу",     cmd:"" },
      { icon:"✏️", text:"Мәтінді қалың жазу",             cmd:"" },
      { icon:"🏠", text:"Үй нүктелері: 8",                  cmd:"" },
      { icon:"🏰", text:"База саны: 10",                    cmd:"" },
      { icon:"📐", text:"Приват аймақ: 620 блок",           cmd:"" },
      { icon:"👥", text:"Достар лимиті: 10",               cmd:"" }
    ],
    pricing: [
      { label:"1 ай",      price:"5 000₸" },
      { label:"3 ай",      price:"12 455₸" },
      { label:"Шексіздік", price:"16 530₸" }
    ]
  }
};

// ═══════════════ MODAL LOGIC ═════════════════
let selectedPricing = 0;

window.openModal = function(rankKey) {
  const rank = rankData[rankKey];
  if (!rank) return;

  selectedPricing = 0;

  const perksHTML = rank.perks.map(p => `
    <li>
      <span>${p.icon}</span>
      <span>${p.text}</span>
      ${p.cmd ? `<code>${p.cmd}</code>` : ""}
    </li>
  `).join("");

  const pricingHTML = rank.pricing.map((pr, i) => `
    <div class="pricing-row${i===0?' selected':''}" 
         onclick="selectPricing(this, ${i})"
         data-index="${i}">
      <span class="pricing-row-label">${pr.label}</span>
      <span class="pricing-row-price">${pr.price}</span>
    </div>
  `).join("");

  document.getElementById("modalContent").innerHTML = `
    <div class="modal-rank-title" style="color:${rank.color}">${rank.icon} ${rank.title}</div>
    <p class="modal-rank-sub">Ранг мүмкіндіктері мен бағалары</p>

    <p class="modal-perks-title">⚡ Мүмкіндіктер</p>
    <ul class="modal-perks">${perksHTML}</ul>

    <p class="modal-pricing-title">💰 Баға жоспары</p>
    <div class="pricing-options">${pricingHTML}</div>

    <button class="btn-modal-buy" onclick="confirmBuy()">🛒 Сатып алу</button>
  `;

  document.getElementById("rankModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

window.selectPricing = function(el, idx) {
  document.querySelectorAll(".pricing-row").forEach(r => r.classList.remove("selected"));
  el.classList.add("selected");
  selectedPricing = idx;
};

window.closeModal = function() {
  document.getElementById("rankModal").classList.add("hidden");
  document.body.style.overflow = "";
};

window.confirmBuy = function() {
  closeModal();
  setTimeout(() => {
    document.getElementById("successModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }, 150);
};

window.closeSuccessModal = function() {
  document.getElementById("successModal").classList.add("hidden");
  document.body.style.overflow = "";
};

// Close modals by clicking backdrop
document.getElementById("rankModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});
document.getElementById("successModal").addEventListener("click", function(e) {
  if (e.target === this) closeSuccessModal();
});

// ESC key
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    closeModal();
    closeSuccessModal();
  }
});

// ═══════════════ NAVBAR SCROLL FX ════════════
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  nav.style.boxShadow = window.scrollY > 20
    ? "0 4px 30px rgba(200,100,30,0.15)"
    : "0 2px 20px rgba(200,100,30,0.08)";
});
