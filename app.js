/* StringIQ — app.js (Comprehensive Data Version) */

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCfSVizTInAFx0zDyt6JDsfHUpVvN6BELY",
    authDomain: "stringiq-c6c09.firebaseapp.com",
    projectId: "stringiq-c6c09",
    storageBucket: "stringiq-c6c09.firebasestorage.app",
    messagingSenderId: "884545730906",
    appId: "1:884545730906:web:9e448908d02d13b5d09b63",
    measurementId: "G-0W0HP22NF9"
};

// 2. INITIALIZE FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const $ = (id) => document.getElementById(id);

let currentUserRole = "player"; 
let allPlayers = [];

// --- DATASETS ---
const RACKET_DATA = {
    "Yonex": {
        "EZONE": ["EZONE 98", "EZONE 98 Tour", "EZONE 100", "EZONE 100L", "EZONE 100+", "EZONE 105", "EZONE Ace", "EZONE Game"],
        "VCORE": ["VCORE 95", "VCORE 98", "VCORE 98 Tour", "VCORE 100", "VCORE 100L", "VCORE 100+", "VCORE Game", "VCORE Ace"],
        "Percept": ["Percept 97", "Percept 97H", "Percept 100", "Percept 100D", "Percept 100L"]
    },
    "Wilson": {
        "Blade": ["Blade 98 V9 (16x19)", "Blade 98 V9 (18x20)", "Blade 100 V9", "Blade 100L", "Blade 104", "Blade Pro"],
        "Pro Staff": ["Pro Staff 97 V14", "Pro Staff 97L V14", "Pro Staff X", "Pro Staff RF 97"],
        "Ultra": ["Ultra 100 V4", "Ultra 100L", "Ultra 100UL", "Ultra 95", "Ultra Tour"],
        "Clash": ["Clash 100 V2", "Clash 100 Pro", "Clash 100L", "Clash 98", "Clash 108"]
    },
    "Babolat": {
        "Pure Drive": ["Pure Drive", "Pure Drive 98", "Pure Drive Tour", "Pure Drive Team", "Pure Drive Lite", "Pure Drive Plus", "Pure Drive VS", "Pure Drive Wimbledon"],
        "Pure Aero": ["Pure Aero", "Pure Aero 98", "Pure Aero Tour", "Pure Aero Team", "Pure Aero Lite", "Pure Aero Plus", "Pure Aero Rafa", "Pure Aero Rafa Origin"],
        "Pure Strike": ["Pure Strike 98 (16x19)", "Pure Strike 98 (18x20)", "Pure Strike 100", "Pure Strike Tour", "Pure Strike Team", "Pure Strike Lite"]
    },
    "Solinco": {
        "Whiteout": ["Whiteout 305 (16x19)", "Whiteout 305 (18x20)", "Whiteout 290", "Whiteout XTD"],
        "Blackout": ["Blackout 300", "Blackout 300 XTD", "Blackout 285", "Blackout Team"]
    }
};

const STRING_DATA = {
    "Luxilon": ["ALU Power", "ALU Power Soft", "4G", "4G Soft", "Element", "Big Banger Original"],
    "Solinco": ["Hyper-G", "Hyper-G Soft", "Tour Bite", "Tour Bite Soft", "Confidential", "Outlast"],
    "Babolat": ["RPM Blast", "RPM Rough", "RPM Team", "VS Touch (Natural Gut)"],
    "Yonex": ["Poly Tour Pro", "Poly Tour Rev", "Poly Tour Fire", "Poly Tour Drive"],
    "Head": ["Lynx Tour", "Hawk Touch", "Lynx", "Sonic Pro", "RIP Control"],
    "Wilson": ["NXT", "NXT Tour", "Sensation", "Natural Gut"],
    "Generic": ["Natural Gut", "Synthetic Gut", "Multifilament", "Poly", "Kevlar", "Hybrid"]
};

// --- AUTHENTICATION & IDENTITY GATE ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const email = user.email.toLowerCase();
            let doc = await db.collection("approved_users").doc(email).get();
            if (!doc.exists) {
                await db.collection("approved_users").doc(email).set({ role: "player", createdAt: Date.now() });
                doc = await db.collection("approved_users").doc(email).get();
            }
            currentUserRole = doc.data().role || "player";
            if ($("adminLink")) $("adminLink").style.display = (currentUserRole === "admin") ? "block" : "none";
            $("authScreen").style.display = "none";
            $("appContent").style.display = "block";
            initApp(); 
        } catch (error) { console.error("Auth error:", error); auth.signOut(); }
    } else {
        $("authScreen").style.display = "flex";
        $("appContent").style.display = "none";
    }
});

// --- ADMIN DASHBOARD ---
async function openAdminDashboard() {
    if (currentUserRole !== "admin") return alert("Unauthorized access.");
    const querySnapshot = await db.collection("approved_users").get();
    let userList = "Current Users:\n------------------\n";
    querySnapshot.forEach((doc) => { userList += `${doc.id} [${doc.data().role}]\n`; });
    const targetEmail = prompt(userList + "\nEnter user email to change role:");
    if (targetEmail) {
        const newRole = prompt("Enter new role (admin or player):").toLowerCase();
        if (newRole === "admin" || newRole === "player") {
            await db.collection("approved_users").doc(targetEmail.toLowerCase().trim()).update({ role: newRole });
            alert("User updated!");
        } else { alert("Invalid role choice."); }
    }
}

// --- TENSION LOSS PREDICTOR (TOOLBOX) ---
function calculateTensionLoss() {
    const dateInput = $("stringingDate").value;
    if (!dateInput) return;
    const start = new Date(dateInput);
    const today = new Date();
    const days = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    let lossPercent = (days >= 1) ? 10 + (days * 0.8) : 0;
    if (days > 45) lossPercent = 40; 
    const result = $("tensionResult");
    const isCritical = lossPercent > 22;
    result.innerHTML = days < 0 ? "Invalid Date" : 
        `Loss: <strong>${lossPercent.toFixed(1)}%</strong><br>
         <small>${days} days old</small><br>
         <div style="margin-top:5px; font-size:11px; font-weight:bold;">
            ${isCritical ? "⚠️ RESTRING RECOMMENDED" : "✅ TENSION STABLE"}
         </div>`;
    result.style.color = isCritical ? "#ff4b4b" : "#2ecc71";
}

// --- INITIALIZE DROPDOWNS ---
function initDropdowns() {
    // Populate Rackets
    const rackEl = $("racketModel");
    if (rackEl) {
        rackEl.innerHTML = '<option value="">-- Select Racket --</option>';
        for (const [brand, seriesObj] of Object.entries(RACKET_DATA)) {
            const group = document.createElement("optgroup");
            group.label = brand;
            for (const [series, models] of Object.entries(seriesObj)) {
                models.forEach(m => {
                    const option = new Option(`${brand} ${m}`, `${brand} ${m}`);
                    group.appendChild(option);
                });
            }
            rackEl.appendChild(group);
        }
    }

    // Populate Strings (Main & Cross)
    const populateStrings = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">-- Select String --</option>';
        for (const [brand, models] of Object.entries(STRING_DATA)) {
            const group = document.createElement("optgroup");
            group.label = brand;
            models.forEach(m => group.appendChild(new Option(`${brand} ${m}`, `${brand} ${m}`)));
            el.appendChild(group);
        }
    };
    populateStrings($("stringMain"));
    populateStrings($("stringCross"));

    // Populate Tensions (extended range to 70 for gut)
    const tm = $("tensionMain"), tc = $("tensionCross");
    if (tm && tm.options.length <= 1) {
        for(let i=35; i<=70; i++) {
            tm.add(new Option(i + " lbs", i));
            tc.add(new Option(i + " lbs", i));
        }
    }
}

function initApp() {
    db.collection("players").onSnapshot((snapshot) => {
        allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        render();
    });
    initDropdowns();
}

function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(str) { return String(str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s])); }

// --- RENDER LIST ---
function render() {
    const list = $("playerList");
    const sortVal = $("sortBy")?.value || "name";
    const q = ($("search")?.value || "").toLowerCase().trim();
    const userEmail = auth.currentUser?.email.toLowerCase();
    
    let filtered = allPlayers.filter(p => (p.name || "").toLowerCase().includes(q));

    filtered.sort((a, b) => {
        if (sortVal === "ratingHigh") return (Number(b.setupRating) || 0) - (Number(a.setupRating) || 0);
        if (sortVal === "ratingLow") return (Number(a.setupRating) || 0) - (Number(b.setupRating) || 0);
        if (sortVal === "newest") return (b.updatedAt || 0) - (a.updatedAt || 0);
        return (a.name || "").localeCompare(b.name || "");
    });

    list.innerHTML = "";
    $("empty").style.display = filtered.length ? "none" : "block";

    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "item";
        const setupHigh = Number(p.setupRating) >= 85;
        const canEdit = (p.lastUpdatedBy === userEmail) || (currentUserRole === "admin");
        
        div.innerHTML = `
            <div class="title">
                <h3>${escapeHtml(p.name)}</h3>
                <div class="actions">
                    <button class="btn" style="font-size:11px; padding:4px 8px;" onclick="viewHistory('${p.id}')">History</button>
                    ${canEdit ? `<button class="btn" onclick="editPlayer('${p.id}')">Edit</button>` : ""}
                    ${canEdit ? `<button class="btn" onclick="deletePlayer('${p.id}')">Delete</button>` : ""}
                </div>
            </div>
            <div class="badges">
                <span class="badge" style="${setupHigh ? 'border-color:#4b79ff;color:#4b79ff;font-weight:bold;' : ''}">
                    Setup: ${p.setupRating || 0}/100 ${setupHigh ? '🔥' : ''}
                </span>
                <span class="badge">UTR: ${p.utr || 'N/A'}</span>
                <span class="badge">${escapeHtml(p.racketModel)}</span>
                <span class="badge">${p.tensionMain}/${p.tensionCross} lbs</span>
                ${p.usedBallMachine ? '<span class="badge" style="background:#4b79ff; color:white; border:none;">Ball Machine</span>' : ''}
            </div>
            ${p.notes ? `<p>${escapeHtml(p.notes)}</p>` : ""}
        `;
        list.appendChild(div);
    });
}

// --- CRUD OPERATIONS ---
async function deletePlayer(id) {
    if (confirm("Are you sure you want to delete this player?")) {
        try { await db.collection("players").doc(id).delete(); } 
        catch(e) { alert("Permission Denied."); }
    }
}

function editPlayer(id) {
    const p = allPlayers.find(x => x.id === id);
    if (!p) return;
    $("playerId").value = p.id;
    $("name").value = p.name || "";
    $("utr").value = p.utr || "";
    $("racketModel").value = p.racketModel || "";
    $("tensionMain").value = p.tensionMain || "";
    $("tensionCross").value = p.tensionCross || "";
    $("setupRating").value = p.setupRating || "";
    $("usedBallMachine").checked = p.usedBallMachine || false;
    $("notes").value = p.notes || "";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

$("playerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("playerId").value || uid();
    const machineUsed = $("usedBallMachine").checked;

    const data = {
        name: $("name").value.trim(),
        utr: $("utr").value,
        racketModel: $("racketModel").value,
        tensionMain: $("tensionMain").value,
        tensionCross: $("tensionCross").value,
        setupRating: $("setupRating").value,
        weeklyFeeling: $("weeklyFeeling") ? $("weeklyFeeling").value : null,
        usedBallMachine: machineUsed,
        notes: $("notes").value.trim(),
        updatedAt: Date.now(),
        lastUpdatedBy: auth.currentUser.email.toLowerCase()
    };

    try {
        await db.collection("players").doc(id).set(data);
        if (machineUsed) {
            alert("Profile Saved! \n\n💡 According to our data, players have better weekly feeling when practicing with a ball machine. Ball machine recommended!");
        } else {
            alert("Profile Saved!");
        }
        $("playerId").value = "";
        $("playerForm").reset();
    } catch (err) { alert("Permission Denied."); }
});

// --- AUTH HANDLERS ---
async function handleGoogleLogin() { try { await auth.signInWithPopup(googleProvider); } catch (e) { alert(e.message); } }
async function handleLogout() { if(confirm("Log out of StringIQ?")) await auth.signOut(); }

if($("search")) $("search").addEventListener("input", render);
if($("sortBy")) $("sortBy").addEventListener("change", render);
