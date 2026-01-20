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
const GRIP_OPTIONS = [
    "Continental", 
    "Eastern", 
    "Semi-Eastern", 
    "Semi", // Added distinct Semi option
    "Semi-Western", 
    "Western", 
    "Full Western", 
    "Hawaiian", 
    "Double Handed"
];

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

// --- TOOLBOX ---
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
        `Loss: <strong>${lossPercent.toFixed(1)}%</strong><br><small>${days} days old</small><br>
         <div style="margin-top:5px; font-size:11px; font-weight:bold;">
            ${isCritical ? "⚠️ RESTRING RECOMMENDED" : "✅ TENSION STABLE"}
         </div>`;
    result.style.color = isCritical ? "#ff4b4b" : "#2ecc71";
}

function checkWearWarning() {
    const status = $("shoeWearStatus")?.value;
    const refBox = $("wearReference");
    if (refBox) {
        // Show visual reference when Smooth/Bald is selected (Toe Drag or Slanted Base)
        refBox.style.display = (status === "smooth") ? "block" : "none";
    }
}

// --- UI POPULATION ---
function initDropdowns() {
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

    const pattEl = $("pattern");
    if (pattEl) {
        const patterns = ["16x19", "18x20", "16x18", "16x20", "18x19", "14x18"];
        pattEl.innerHTML = "";
        patterns.forEach(p => pattEl.add(new Option(p, p)));
    }

    const populateGrips = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">-- Select Grip --</option>';
        GRIP_OPTIONS.forEach(g => el.appendChild(new Option(g, g)));
    };
    populateGrips($("forehandGrip"));
    populateGrips($("backhandGrip"));

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

    const tm = $("tensionMain"), tc = $("tensionCross");
    if (tm && tm.options.length <= 1) {
        for(let i=35; i<=70; i++) {
            tm.add(new Option(i + " lbs", i));
            tc.add(new Option(i + " lbs", i));
        }
    }
}

// --- CORE APP LOGIC ---
function initApp() {
    db.collection("players").onSnapshot((snapshot) => {
        allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        render();
    });
    initDropdowns();
}

function render() {
    const list = $("playerList");
    const q = ($("search")?.value || "").toLowerCase().trim();
    const sortVal = $("sortBy")?.value || "name";
    
    // Filter by name
    let filtered = allPlayers.filter(p => (p.name || "").toLowerCase().includes(q));

    // Advanced Sorting
    filtered.sort((a, b) => {
        if (sortVal === "name") return a.name.localeCompare(b.name);
        if (sortVal === "newest") return (b.updatedAt || 0) - (a.updatedAt || 0);
        if (sortVal === "feelHigh") return (Number(b.weeklyFeeling) || 0) - (Number(a.weeklyFeeling) || 0);
        if (sortVal === "feelLow") return (Number(a.weeklyFeeling) || 0) - (Number(b.weeklyFeeling) || 0);
        if (sortVal === "grip") return (a.forehandGrip || "").localeCompare(b.forehandGrip || "");
        return 0;
    });

    list.innerHTML = "";
    $("empty").style.display = filtered.length ? "none" : "block";

    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "item";
        const canEdit = (p.lastUpdatedBy === auth.currentUser.email.toLowerCase()) || (currentUserRole === "admin");
        
        // Performance logic for badges
        let wearStatus = "Fresh";
        let wearColor = "#2ecc71";

        if (p.shoeWearStatus === "smooth") {
            wearStatus = "🚨 High Wear/Uneven";
            wearColor = "#ff4b4b";
        } else if (p.shoeWearStatus === "average") {
            wearStatus = "Average";
            wearColor = "#4b79ff";
        }

        div.innerHTML = `
            <div class="title"><h3>${escapeHtml(p.name)}</h3></div>
            <div class="badges">
                <span class="badge" style="border-color:${wearColor}; color:${wearColor};">${wearStatus}</span>
                <span class="badge">Feel: ${p.weeklyFeeling || 50}</span>
                <span class="badge">FH: ${p.forehandGrip || 'N/A'}</span>
                <span class="badge">${escapeHtml(p.racketModel)}</span>
                <span class="badge">${p.tensionMain}/${p.tensionCross} lbs</span>
            </div>
            <div class="actions" style="margin-top:10px;">
                ${canEdit ? `<button class="btn" onclick="editPlayer('${p.id}')">Edit</button>` : ""}
            </div>
        `;
        list.appendChild(div);
    });
}

// --- EDIT & SUBMIT LOGIC ---
function editPlayer(id) {
    const p = allPlayers.find(x => x.id === id);
    if (!p) return;
    $("playerId").value = p.id;
    $("name").value = p.name || "";
    $("age").value = p.age || "";
    $("utr").value = p.utr || "";
    $("hand").value = p.hand || "Right";
    $("racketModel").value = p.racketModel || "";
    $("pattern").value = p.pattern || "16x19";
    $("stringMain").value = p.stringMain || "";
    $("stringCross").value = p.stringCross || "";
    $("tensionMain").value = p.tensionMain || "";
    $("tensionCross").value = p.tensionCross || "";
    $("setupRating").value = p.setupRating || "";
    $("forehandGrip").value = p.forehandGrip || "";
    $("backhandGrip").value = p.backhandGrip || "";
    
    if($("playIntensity")) $("playIntensity").value = p.playIntensity || "2.5";
    if($("shoeWearStatus")) $("shoeWearStatus").value = p.shoeWearStatus || "average";
    if($("weeklyFeeling")) $("weeklyFeeling").value = p.weeklyFeeling || 50;
    
    $("usedBallMachine").checked = p.usedBallMachine || false;
    $("notes").value = p.notes || "";
    
    checkWearWarning();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

$("playerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("playerId").value || Math.random().toString(16).slice(2);
    
    const fhGrip = $("forehandGrip").value;
    const shoeStatus = $("shoeWearStatus").value;

    const data = {
        name: $("name").value.trim(),
        age: $("age").value,
        utr: $("utr").value,
        hand: $("hand").value,
        racketModel: $("racketModel").value,
        pattern: $("pattern").value,
        stringMain: $("stringMain").value,
        stringCross: $("stringCross").value,
        tensionMain: $("tensionMain").value,
        tensionCross: $("tensionCross").value,
        setupRating: $("setupRating").value,
        forehandGrip: fhGrip,
        backhandGrip: $("backhandGrip").value,
        playIntensity: $("playIntensity").value,
        shoeWearStatus: shoeStatus,
        weeklyFeeling: $("weeklyFeeling") ? $("weeklyFeeling").value : 50,
        usedBallMachine: $("usedBallMachine").checked,
        notes: $("notes").value.trim(),
        updatedAt: Date.now(),
        lastUpdatedBy: auth.currentUser.email.toLowerCase()
    };

    try {
        await db.collection("players").doc(id).set(data);
        
        let alertMsg = "Profile Saved to StringVault.us!";
        if (shoeStatus === "smooth") {
            alertMsg += "\n\n🚨 WARNING: Uneven sole detected (Toe Drag/Slanted Base). Foundation is compromised.";
        }
        if (fhGrip === "Hawaiian" || fhGrip === "Full Western") {
            alertMsg += "\n⚠️ NOTE: Extreme grip will cause high friction; monitor string notching.";
        }

        alert(alertMsg);
        $("playerId").value = "";
        $("playerForm").reset();
        checkWearWarning();
    } catch (err) { alert("Error saving profile."); }
});

// --- HELPERS ---
function escapeHtml(str) { return String(str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s])); }
async function handleGoogleLogin() { try { await auth.signInWithPopup(googleProvider); } catch (e) { alert(e.message); } }
async function handleLogout() { if(confirm("Log out?")) await auth.signOut(); }
