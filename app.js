/* StringVault.us — app.js (Final Integrated Version) */

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
const GRIP_OPTIONS = ["Continental", "Eastern", "Semi-Eastern", "Semi", "Semi-Western", "Western", "Full Western", "Hawaiian", "Double Handed"];

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
    }
};

const STRING_DATA = {
    "Luxilon": ["ALU Power", "ALU Power Soft", "4G", "4G Soft", "Element", "Big Banger Original"],
    "Solinco": ["Hyper-G", "Hyper-G Soft", "Tour Bite", "Tour Bite Soft", "Confidential", "Outlast"],
    "Babolat": ["RPM Blast", "RPM Rough", "RPM Team", "VS Touch (Natural Gut)"],
    "Generic": ["Natural Gut", "Synthetic Gut", "Multifilament", "Poly", "Hybrid"]
};

// --- AUTH & INITIALIZATION ---
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
            
            // Show App Content
            $("authScreen").style.display = "none";
            $("appContent").style.display = "block";
            
            // POPULATE ALL DROPDOWNS FIRST
            initDropdowns(); 
            // THEN INIT DATA
            initApp(); 
        } catch (error) { console.error("Auth error:", error); auth.signOut(); }
    } else {
        $("authScreen").style.display = "flex";
        $("appContent").style.display = "none";
    }
});

// --- TOOLBOX ---
function calculateTensionLoss() {
    const dateInput = $("stringingDate").value;
    if (!dateInput) return;
    const days = Math.floor((new Date() - new Date(dateInput)) / (1000 * 60 * 60 * 24));
    let lossPercent = (days >= 1) ? 10 + (days * 0.8) : 0;
    if (days > 45) lossPercent = 40; 
    const result = $("tensionResult");
    const isCritical = lossPercent > 22;
    result.innerHTML = `Loss: <strong>${lossPercent.toFixed(1)}%</strong><br><small>${days} days old</small><br>
                        ${isCritical ? "⚠️ RESTRING RECOMMENDED" : "✅ TENSION STABLE"}`;
    result.style.color = isCritical ? "#ff4b4b" : "#2ecc71";
}

function checkWearWarning() {
    const status = $("shoeWearStatus")?.value;
    const refBox = $("wearReference");
    if (!refBox) return;

    let guidance = "";
    switch(status) {
        case "fresh": guidance = "🟢 <strong>Fresh:</strong> New condition. Maximum traction."; break;
        case "average": guidance = "🔵 <strong>Average:</strong> Typical wear. Safe for play."; break;
        case "moderate": guidance = "🟡 <strong>Moderate:</strong> Notable smoothing. Monitor traction."; break;
        case "smooth": guidance = "🔴 <strong>🚨 High Wear:</strong> Tread is gone. Replacement recommended."; break;
    }
    refBox.innerHTML = guidance;
    refBox.style.display = status ? "block" : "none";
}

// --- UI POPULATION ---
function initDropdowns() {
    // Populate Rackets
    const rackEl = $("racketModel");
    if (rackEl) {
        rackEl.innerHTML = '<option value="">-- Select Racket --</option>';
        for (const [brand, seriesObj] of Object.entries(RACKET_DATA)) {
            const group = document.createElement("optgroup");
            group.label = brand;
            for (const [series, models] of Object.entries(seriesObj)) {
                models.forEach(m => group.appendChild(new Option(`${brand} ${m}`, `${brand} ${m}`)));
            }
            rackEl.appendChild(group);
        }
    }

    // Populate Strings
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

    // Populate Grips
    const populateGrips = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">-- Select Grip --</option>';
        GRIP_OPTIONS.forEach(g => el.appendChild(new Option(g, g)));
    };
    populateGrips($("forehandGrip"));
    populateGrips($("backhandGrip"));

    // Populate Tensions
    const tm = $("tensionMain"), tc = $("tensionCross");
    if (tm && tm.options.length <= 1) {
        for(let i=35; i<=70; i++) {
            tm.add(new Option(i + " lbs", i));
            tc.add(new Option(i + " lbs", i));
        }
    }
}

// --- CORE APP ---
function initApp() {
    db.collection("players").onSnapshot((snapshot) => {
        allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        render();
    });
}

function render() {
    const list = $("playerList");
    const q = ($("search")?.value || "").toLowerCase().trim();
    let filtered = allPlayers.filter(p => (p.name || "").toLowerCase().includes(q));

    list.innerHTML = "";
    $("empty").style.display = filtered.length ? "none" : "block";

    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "item";
        const canEdit = (p.lastUpdatedBy === auth.currentUser.email.toLowerCase()) || (currentUserRole === "admin");
        
        div.innerHTML = `
            <div class="title"><h3>${escapeHtml(p.name)}</h3></div>
            <div class="badges">
                <span class="badge" style="background:#4b79ff; color:white; border:none;">Score: ${p.setupRating || 0}</span>
                <span class="badge">${p.racketModel}</span>
                <span class="badge">${p.ballMachineUsage === 'none' ? 'No Machine' : '🤖 ' + p.ballMachineUsage}</span>
            </div>
            <div class="actions" style="margin-top:10px;">
                ${canEdit ? `<button class="btn" onclick="editPlayer('${p.id}')">Edit Profile</button>` : ""}
            </div>
        `;
        list.appendChild(div);
    });
}

function editPlayer(id) {
    const p = allPlayers.find(x => x.id === id);
    if (!p) return;
    $("playerId").value = p.id;
    $("name").value = p.name || "";
    $("racketModel").value = p.racketModel || "";
    $("setupRating").value = p.setupRating || "";
    $("shoeWearStatus").value = p.shoeWearStatus || "average";
    $("ballMachineUsage").value = p.ballMachineUsage || "none";
    $("notes").value = p.notes || "";
    checkWearWarning();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

$("playerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("playerId").value || Math.random().toString(16).slice(2);
    const shoeStatus = $("shoeWearStatus").value;
    const ballUsage = $("ballMachineUsage").value;

    const data = {
        name: $("name").value.trim(),
        racketModel: $("racketModel").value,
        stringMain: $("stringMain")?.value || "",
        stringCross: $("stringCross")?.value || "",
        tensionMain: $("tensionMain")?.value || "",
        tensionCross: $("tensionCross")?.value || "",
        setupRating: $("setupRating").value,
        shoeWearStatus: shoeStatus,
        ballMachineUsage: ballUsage,
        notes: $("notes").value.trim(),
        updatedAt: Date.now(),
        lastUpdatedBy: auth.currentUser.email.toLowerCase()
    };

    try {
        await db.collection("players").doc(id).set(data, { merge: true });
        
        let alertMsg = "Profile Saved!";
        if (shoeStatus === "smooth") alertMsg += "\n\n⚠️ CRITICAL: Replace shoes to prevent injury.";
        if (ballUsage === "heavy") alertMsg += "\n\n🤖 NOTE: Heavy machine use will accelerate tension loss.";

        alert(alertMsg);
        $("playerForm").reset();
        checkWearWarning();
    } catch (err) { alert("Error saving profile."); }
});

// --- HELPERS ---
function escapeHtml(str) { return String(str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s])); }
async function handleGoogleLogin() { try { await auth.signInWithPopup(googleProvider); } catch (e) { alert(e.message); } }
async function handleLogout() { if(confirm("Log out?")) await auth.signOut(); }
