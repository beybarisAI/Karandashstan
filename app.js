// ════════════════════════════════════════
//   QalamStan — app.js  (SPA, no-scroll)
// ════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, child }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// ── Block ALL scroll/swipe (except modal-box inner) ──
const noScroll = e => {
  if (e.target.closest('.modal-box') || e.target.closest('.cards-scroll-area')) return;
  e.preventDefault();
};
document.addEventListener('wheel',     noScroll, { passive: false });
document.addEventListener('touchmove', noScroll, { passive: false });
document.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key))
    e.preventDefault();
});

// ── Hash ─────────────────────────────────
async function hashPwd(pwd) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

// ── Session ──────────────────────────────
const SK = "qs_user";
let currentUser = null;
const saveSession = n => { sessionStorage.setItem(SK, n); currentUser = n; };
const loadSession = ()  => sessionStorage.getItem(SK);
const clearSession= ()  => { sessionStorage.removeItem(SK); currentUser = null; };

// ── Tab switch ───────────────────────────
window.switchTab = function(tab) {
  ["login","register"].forEach(t => {
    document.getElementById(`tab${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle("active", t===tab);
    document.getElementById(`form${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle("hidden", t!==tab);
  });
  document.getElementById("loginError").textContent = "";
  document.getElementById("registerError").textContent = "";
};

// ── Login ────────────────────────────────
window.handleLogin = async function() {
  const nick  = document.getElementById("loginNick").value.trim();
  const pwd   = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  if (!nick||!pwd){ errEl.textContent="Барлық өрістерді толтырыңыз."; return; }
  try {
    const snap = await get(child(ref(db), `users/${nick}`));
    if (!snap.exists())                            { errEl.textContent="Мұндай пайдаланушы жоқ."; return; }
    if (snap.val().password !== await hashPwd(pwd)){ errEl.textContent="Құпиясөз қате."; return; }
    saveSession(nick); enterSite(nick);
  } catch(e){ errEl.textContent="Қате орын алды."; console.error(e); }
};

// ── Register ─────────────────────────────
window.handleRegister = async function() {
  const nick  = document.getElementById("regNick").value.trim();
  const pwd   = document.getElementById("regPassword").value;
  const pwdC  = document.getElementById("regPasswordConfirm").value;
  const errEl = document.getElementById("registerError");
  if (!nick||!pwd||!pwdC)            { errEl.textContent="Барлық өрістерді толтырыңыз."; return; }
  if (pwd!==pwdC)                    { errEl.textContent="Құпиясөздер сәйкес келмейді."; return; }
  if (pwd.length<6)                  { errEl.textContent="Кем дегенде 6 таңба болуы керек."; return; }
  if (!/^[A-Za-z0-9_]+$/.test(nick)){ errEl.textContent="НИК тек латын, цифр, _."; return; }
  try {
    const snap = await get(child(ref(db), `users/${nick}`));
    if (snap.exists()){ errEl.textContent="Бұл НИК бос емес."; return; }
    await set(ref(db,`users/${nick}`),{ password:await hashPwd(pwd), nick, createdAt:Date.now() });
    saveSession(nick); enterSite(nick);
  } catch(e){ errEl.textContent="Тіркелу кезінде қате."; console.error(e); }
};

// ── Logout ───────────────────────────────
window.handleLogout = function() {
  clearSession();
  document.getElementById("loginOverlay").classList.remove("fade-out");
  setUserUI(null);
  closeSidebar();
  showSection("dashboard");
};

function enterSite(nick) {
  document.getElementById("loginOverlay").classList.add("fade-out");
  setUserUI(nick);
}
function setUserUI(nick) {
  document.getElementById("sidebarAvatar").textContent = nick ? nick.charAt(0).toUpperCase() : "?";
  document.getElementById("sidebarNick").textContent   = nick ? nick : "Кіру қажет";
}

(function init() {
  const saved = loadSession();
  if (saved) enterSite(saved);
})();

// ════════════════ SIDEBAR ════════════════
window.openSidebar = function() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("active");
};
window.closeSidebar = function() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("active");
};

// ════════════════ SECTION SWITCH ═════════
const SECTIONS = ["dashboard","donate","forum","top"];
window.showSection = function(id) {
  SECTIONS.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.toggle("active", s===id);
  });
  document.querySelectorAll(".sidebar-link").forEach((el, i) => {
    el.classList.toggle("active-link", SECTIONS[i]===id);
  });
};

// ════════════════ RANK DATA ══════════════
const rankData = {
  vip: {
    title:"VIP", color:"#16a34a", icon:"fa-star",
    perks:[
      { icon:"fa-shuffle",            text:"Телепортацияны өшіру",   cmd:"/tptoggle" },
      { icon:"fa-box-open",           text:"Өз китің",               cmd:"/kits" },
      { icon:"fa-screwdriver-wrench", text:"Виртуалды верстак",       cmd:"/workbench" },
      { icon:"fa-house",              text:"Үй нүктелері: 2",         cmd:"" },
      { icon:"fa-building",           text:"База саны: 2",            cmd:"" },
      { icon:"fa-vector-square",      text:"Приват аймақ: 360 блок",  cmd:"" },
      { icon:"fa-users",              text:"Достар лимиті: 3",        cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"480₸"},{label:"3 ай",price:"1 260₸"},{label:"Шексіздік",price:"1 840₸"}
    ]
  },
  lord: {
    title:"LORD", color:"#1e3a8a", icon:"fa-shield",
    perks:[
      { icon:"fa-hat-wizard",    text:"Блокты басыңа кию",    cmd:"/hat" },
      { icon:"fa-utensils",      text:"Қарын тойдыру",        cmd:"/feed" },
      { icon:"fa-box-open",      text:"Өз китің",             cmd:"/kits" },
      { icon:"fa-circle-info",   text:"Зат ID-сін білу",      cmd:"/iteminfo" },
      { icon:"fa-layer-group",   text:"Виртуалды тоқыма",     cmd:"/loom" },
      { icon:"fa-house",         text:"Үй нүктелері: 2",      cmd:"" },
      { icon:"fa-building",      text:"База саны: 2",         cmd:"" },
      { icon:"fa-vector-square", text:"Приват аймақ: 400 блок",cmd:"" },
      { icon:"fa-users",         text:"Достар лимиті: 4",     cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"926₸"},{label:"3 ай",price:"2 479₸"},{label:"Шексіздік",price:"3 145₸"}
    ]
  },
  overlord: {
    title:"OVERLORD", color:"#0284c7", icon:"fa-crown",
    perks:[
      { icon:"fa-location-dot",       text:"Алыс телепортация",      cmd:"/rtp far" },
      { icon:"fa-fire-flame-simple",  text:"Өзіңді сөндіру",         cmd:"/ext" },
      { icon:"fa-box-open",           text:"Өз китің",               cmd:"/kits" },
      { icon:"fa-user-slash",         text:"Ойыншыны елемеу",        cmd:"/ignore" },
      { icon:"fa-trash",              text:"Инвентарды тазалау",     cmd:"/clear" },
      { icon:"fa-map",                text:"Картограф үстелі",       cmd:"/cartographytable" },
      { icon:"fa-house",              text:"Үй нүктелері: 4",        cmd:"" },
      { icon:"fa-building",           text:"База саны: 3",           cmd:"" },
      { icon:"fa-vector-square",      text:"Приват аймақ: 440 блок", cmd:"" },
      { icon:"fa-users",              text:"Достар лимиті: 5",       cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"1 798₸"},{label:"3 ай",price:"4 323₸"},{label:"Шексіздік",price:"5 643₸"}
    ]
  },
  elite: {
    title:"ELITE", color:"#ea580c", icon:"fa-bolt",
    perks:[
      { icon:"fa-heart-pulse",   text:"Денсаулықты толықтыру",  cmd:"/heal" },
      { icon:"fa-box-archive",   text:"Эндер-сандық",           cmd:"/ec" },
      { icon:"fa-box-open",      text:"Өз китің",               cmd:"/kits" },
      { icon:"fa-sun",           text:"Жеке уақыт орнату",      cmd:"/ptime" },
      { icon:"fa-location-dot",  text:"Алыс телепортация",      cmd:"/rtp far" },
      { icon:"fa-wrench",        text:"Бір затты жөндеу",       cmd:"/repair" },
      { icon:"fa-house",         text:"Үй нүктелері: 5",        cmd:"" },
      { icon:"fa-building",      text:"База саны: 5",           cmd:"" },
      { icon:"fa-vector-square", text:"Приват аймақ: 500 блок", cmd:"" },
      { icon:"fa-users",         text:"Достар лимиті: 6",       cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"2 651₸"},{label:"3 ай",price:"5 498₸"},{label:"Шексіздік",price:"6 743₸"}
    ]
  },
  phantom: {
    title:"PHANTOM", color:"#9333ea", icon:"fa-ghost",
    perks:[
      { icon:"fa-screwdriver-wrench",  text:"Барлық заттарды жөндеу", cmd:"/repair all" },
      { icon:"fa-box-open",            text:"Өз китің",               cmd:"/kits" },
      { icon:"fa-microphone-slash",    text:"Ойыншыға мут беру",      cmd:"/mute" },
      { icon:"fa-street-view",         text:"Жақын телепортация",     cmd:"/rtp near" },
      { icon:"fa-scissors",            text:"Виртуалды таскескіш",    cmd:"/stonecutter" },
      { icon:"fa-house",               text:"Үй нүктелері: 6",        cmd:"" },
      { icon:"fa-building",            text:"База саны: 6",           cmd:"" },
      { icon:"fa-vector-square",       text:"Приват аймақ: 540 блок", cmd:"" },
      { icon:"fa-users",               text:"Достар лимиті: 7",       cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"3 300₸"},{label:"3 ай",price:"6 854₸"},{label:"Шексіздік",price:"8 076₸"}
    ]
  },
  legend: {
    title:"LEGEND", color:"#2563eb", icon:"fa-infinity",
    perks:[
      { icon:"fa-eye",           text:"Инвентарға кіру",          cmd:"/invsee" },
      { icon:"fa-bullhorn",      text:"Хабарландыру жазу",        cmd:"/broadcast" },
      { icon:"fa-box-open",      text:"Өз китің",                 cmd:"/kits" },
      { icon:"fa-book-open",     text:"Кітаптарды өңдеу",        cmd:"/book" },
      { icon:"fa-trash-can",     text:"Виртуалды қоқыс жәшігі",  cmd:"/dispose" },
      { icon:"fa-ban",           text:"Уақытша бан беру",         cmd:"/tempban" },
      { icon:"fa-house",         text:"Үй нүктелері: 7",          cmd:"" },
      { icon:"fa-building",      text:"База саны: 8",             cmd:"" },
      { icon:"fa-vector-square", text:"Приват аймақ: 580 блок",   cmd:"" },
      { icon:"fa-users",         text:"Достар лимиті: 8",         cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"4 127₸"},{label:"3 ай",price:"9 123₸"},{label:"Шексіздік",price:"12 000₸"}
    ]
  },
  king: {
    title:"KING", color:"#dc2626", icon:"fa-chess-king",
    perks:[
      { icon:"fa-volume-high",      text:"Ойыншыны размут ету",    cmd:"/unmute" },
      { icon:"fa-box-archive",      text:"Эндер-сандықты ашу",     cmd:"/ec (ник)" },
      { icon:"fa-box-open",         text:"Өз китің",               cmd:"/kits" },
      { icon:"fa-flag",             text:"Жеке мемлекет аша алады",cmd:"" },
      { icon:"fa-magnifying-glass", text:"Ойыншыны табу",          cmd:"/near" },
      { icon:"fa-gear",             text:"Жөндеу + сиқырды алу",  cmd:"/grindstone" },
      { icon:"fa-underline",        text:"Мәтінді астын сызылған", cmd:"" },
      { icon:"fa-strikethrough",    text:"Мәтінді үсті сызылған",  cmd:"" },
      { icon:"fa-bold",             text:"Мәтінді қалың жазу",     cmd:"" },
      { icon:"fa-house",            text:"Үй нүктелері: 8",        cmd:"" },
      { icon:"fa-building",         text:"База саны: 10",          cmd:"" },
      { icon:"fa-vector-square",    text:"Приват аймақ: 620 блок", cmd:"" },
      { icon:"fa-users",            text:"Достар лимиті: 10",      cmd:"" }
    ],
    pricing:[
      {label:"1 ай",price:"5 000₸"},{label:"3 ай",price:"12 455₸"},{label:"Шексіздік",price:"16 530₸"}
    ]
  }
};

// ════════════════ MODAL ═════════════════
window.openModal = function(key) {
  const rank = rankData[key]; if (!rank) return;

  const perksHTML = rank.perks.map(p => `
    <li>
      <i class="fa-solid ${p.icon}"></i>
      <span>${p.text}</span>
      ${p.cmd ? `<code>${p.cmd}</code>` : ""}
    </li>`).join("");

  const pricingHTML = rank.pricing.map((pr,i) => `
    <div class="pricing-row${i===0?" selected":""}" onclick="selectPricing(this)">
      <span class="pricing-row-label">${pr.label}</span>
      <span class="pricing-row-price">${pr.price}</span>
    </div>`).join("");

  document.getElementById("modalContent").innerHTML = `
    <div class="modal-rank-title" style="color:${rank.color}">
      <i class="fa-solid ${rank.icon}" style="margin-right:9px"></i>${rank.title}
    </div>
    <p class="modal-rank-sub">Ранг мүмкіндіктері мен баға жоспары</p>
    <div class="modal-section-label"><i class="fa-solid fa-bolt"></i>Мүмкіндіктер</div>
    <ul class="modal-perks">${perksHTML}</ul>
    <div class="modal-section-label"><i class="fa-solid fa-tag"></i>Баға жоспары</div>
    <div class="pricing-options">${pricingHTML}</div>
    <button class="btn-modal-buy" onclick="confirmBuy()">
      <i class="fa-solid fa-cart-shopping"></i> Сатып алу
    </button>`;

  document.getElementById("rankModal").classList.remove("hidden");
};

window.selectPricing = function(el) {
  document.querySelectorAll(".pricing-row").forEach(r => r.classList.remove("selected"));
  el.classList.add("selected");
};
window.closeModal       = () => document.getElementById("rankModal").classList.add("hidden");
window.confirmBuy       = () => { closeModal(); setTimeout(()=>document.getElementById("successModal").classList.remove("hidden"),150); };
window.closeSuccessModal= () => document.getElementById("successModal").classList.add("hidden");

document.getElementById("rankModal").addEventListener("click",   e=>{ if(e.target===e.currentTarget) closeModal(); });
document.getElementById("successModal").addEventListener("click", e=>{ if(e.target===e.currentTarget) closeSuccessModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeModal(); closeSuccessModal(); } });
