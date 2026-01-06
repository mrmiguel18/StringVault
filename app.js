/* StringIQ — app.js (Firebase Cloud + Admin PIN + Smart Install) */

// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCfSVizTInAFx0zDyt6JDsfHUpVvN6BELY",
    authDomain: "stringiq-c6c09.firebaseapp.com",
    projectId: "stringiq-c6c09",
    storageBucket: "stringiq-c6c09.firebasestorage.app",
    messagingSenderId: "884545730906",
    appId: "1:884545730906:web:9e448908d02d13b5d09b63",
    measurementId: "G-0W0HP22NF9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const $ = (id) => document.getElementById(id);

// --- SECURITY SETTINGS ---
const MASTER_PIN = "1234"; 

// --- THE MASTER INDEX ---
const RACKET_DATA = {
  "Yonex": ["EZONE 98", "EZONE 100", "VCORE 98", "VCORE 100", "Percept 97"],
  "Wilson": ["Blade 98 V9", "Pro Staff 97 V14", "Ultra 100 V4", "Clash 100 V2"],
  "Head": ["Speed MP", "Radical MP", "Extreme MP", "Gravity MP", "Boom MP"],
  "Babolat": ["Pure Drive", "Pure Aero", "Pure Strike 98"],
  "Solinco": ["Whiteout 305", "Blackout 300"]
};

const STRING_DATA = {
  "Luxilon": ["ALU Power", "4G", "Element"],
  "Solinco": ["Hyper-G", "Confidential", "Tour Bite"],
  "Yonex": ["Poly Tour Pro", "Poly Tour Rev"],
  "Babolat": ["RPM Blast", "VS Touch"]
};

let allPlayers = []; 
let deferredPrompt;

// --- INSTALL LOGIC ---
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// Show banner if not installed
window.addEventListener('load', () => {
  if (!isStandalone) {
    if (isIOS) {
      $("installBanner").style.display = "block";
    }
  }
});

// Capture Android Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("installBanner").style.display = "block";
});

$("installBtn").addEventListener('click', () => {
  if (isIOS) {
    $("iosPrompt").style.display = "block";
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') $("installBanner").style.display = "none";
      deferredPrompt = null;
    });
  }
});

// --- CLOUD SYNC & RENDERING ---
function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

db.collection("players").onSnapshot((snapshot) => {
    allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
});

function render() {
  const list = $("playerList");
  const sortVal = $("sortBy").value;
  const q = ($("search").value || "").toLowerCase();
  
  let filtered = allPlayers.filter(p => (p.name || "").toLowerCase().includes(q));

  filtered.sort((a, b) => {
    if (sortVal === "ratingHigh") return (b.setupRating || 0) - (a.setupRating || 0);
    if (sortVal === "newest") return (b.updatedAt || 0) - (a.updatedAt || 0);
    return (a.name || "").localeCompare(b.name || "");
  });

  list.innerHTML = "";
  $("empty").style.display = filtered.length ? "none" : "block";

  filtered.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="title">
        <h3>${p.name}</h3>
        <div class="actions">
          <button class="btn" onclick="editPlayer('${p.id}')">Edit</button>
          <button class="btn" onclick="deletePlayer('${p.id}')">Delete</button>
        </div>
      </div>
      <div class="badges">
        <span class="badge">Rating: ${p.setupRating || 0}</span>
        <span class="badge">${p.racketModel}</span>
        <span class="badge">${p.tensionMain}/${p.tensionCross} lbs</span>
      </div>
    `;
    list.appendChild(div);
  });
}

// --- PIN PROTECTED ACTIONS ---
$("playerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if ($("adminPin").value !== MASTER_PIN) return alert("Incorrect PIN");

  const id = $("playerId").value || uid();
  const data = {
    name: $("name").value.trim(),
    utr: $("utr").value,
    racketModel: getStringValue($("racketModel"), $("racketCustom")),
    tensionMain: $("tensionMain").value,
    tensionCross: $("tensionCross").value,
    setupRating: $("setupRating").value,
    updatedAt: Date.now()
  };

  await db.collection("players").doc(id).set(data);
  $("playerForm").reset();
  $("adminPin").value = "";
  $("playerId").value = "";
});

async function deletePlayer(id) {
  const pin = prompt("Enter PIN to delete:");
  if (pin === MASTER_PIN) {
    await db.collection("players").doc(id).delete();
  } else {
    alert("Incorrect PIN");
  }
}

function editPlayer(id) {
  const p = allPlayers.find(x => x.id === id);
  if (!p) return;
  $("playerId").value = p.id;
  $("name").value = p.name;
  $("setupRating").value = p.setupRating;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getStringValue(sel, cus) {
  return (sel.value === "Custom...") ? cus.value : sel.value;
}

function initDropdowns() {
  const populate = (el, data) => {
    if (!el) return;
    el.innerHTML = '<option value="">-- Select --</option>';
    for (const [brand, models] of Object.entries(data)) {
      const group = document.createElement("optgroup");
      group.label = brand;
      models.forEach(m => group.appendChild(new Option(`${brand} ${m}`, `${brand} ${m}`)));
      el.appendChild(group);
    }
    el.add(new Option("Custom...", "Custom..."));
  };
  populate($("racketModel"), RACKET_DATA);
  populate($("stringMain"), STRING_DATA);
  populate($("stringCross"), STRING_DATA);
  
  for (let i = 30; i <= 75; i++) {
      $("tensionMain").add(new Option(`${i} lbs`, i));
      $("tensionCross").add(new Option(`${i} lbs`, i));
  }
}

$("search").addEventListener("input", render);
$("sortBy").addEventListener("change", render);
initDropdowns();
