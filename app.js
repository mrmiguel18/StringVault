/* StringVault.us — app.js 
   Complete Equipment & Performance Vault Logic
*/

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCfSVizTInAFx0zDyt6JDsfHUpVvN6BELY",
    authDomain: "stringiq-c6c09.firebaseapp.com",
    projectId: "stringiq-c6c09",
    storageBucket: "stringiq-c6c09.firebasestorage.app",
    messagingSenderId: "884545730906",
    appId: "1:884545730906:web:9e448908d02d13b5d09b63",
    measurementId: "G-0W0HP22NF9"
};

// --- 2. INITIALIZATION ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Utility for quick DOM selection
const $ = (id) => document.getElementById(id);

// Global State
let currentUserRole = "player"; 
let allPlayers = [];
let unsubscribe = null;

// --- 3. COMPREHENSIVE EQUIPMENT DATA ---

const GRIP_OPTIONS = [
    "Continental", 
    "Eastern", 
    "Semi-Eastern", 
    "Semi-Western", 
    "Western", 
    "Full Western", 
    "Hawaiian", 
    "Double Handed"
];

const RACKET_DATA = {
    "Yonex": {
        "EZONE": [
            "EZONE 98", "EZONE 98 Tour", "EZONE 98+", 
            "EZONE 100", "EZONE 100+", "EZONE 100L", "EZONE 100SL", 
            "EZONE 105", "EZONE 110", "EZONE Game", "EZONE Feel"
        ],
        "VCORE": [
            "VCORE 95", "VCORE 98", "VCORE 98+", "VCORE 98 Tour", 
            "VCORE 100", "VCORE 100+", "VCORE 100L", "VCORE Game"
        ],
        "Percept": [
            "Percept 97", "Percept 97H", "Percept 97D", 
            "Percept 100", "Percept 100D"
        ]
    },
    "Prince": {
        "Phantom": [
            "Phantom 100X (18x20)", "Phantom 100X (16x19)", "Phantom 100X (305g)",
            "Phantom 93P (14x18)", "Phantom 93P (18x20)", "Phantom 97P", "Phantom 100P"
        ],
        "Tour": [
            "Tour 100 (310g)", "Tour 100 (290g)", "Tour 100P", "Tour 98", "Tour 95"
        ],
        "Beast": [
            "Beast 100", "Beast 100 O3", "Beast 98", "Beast DB 100"
        ],
        "Ripstick": [
            "Ripstick 100 (300g)", "Ripstick 100 (280g)"
        ],
        "Synergy": ["Synergy 98"]
    },
    "Head": {
        "Speed": [
            "Speed Pro", "Speed MP", "Speed MP L", "Speed Team", "Speed PWR"
        ],
        "Radical": [
            "Radical Pro", "Radical MP", "Radical Team"
        ],
        "Gravity": [
            "Gravity Pro", "Gravity MP", "Gravity Tour", "Gravity Team"
        ],
        "Extreme": [
            "Extreme Tour", "Extreme MP", "Extreme MP L", "Extreme Team"
        ],
        "Prestige": [
            "Prestige Pro", "Prestige Tour", "Prestige MP", "Prestige MP L"
        ],
        "Boom": [
            "Boom Pro", "Boom MP", "Boom Team"
        ]
    },
    "Solinco": {
        "Whiteout": [
            "Whiteout 305 (16x19)", "Whiteout 305 (18x20)", 
            "Whiteout 290", "Whiteout XTD"
        ],
        "Blackout": [
            "Blackout 300", "Blackout 300 XTD", "Blackout 285", "Blackout 265"
        ]
    },
    "Wilson": {
        "Blade": [
            "Blade 98 V9 (16x19)", "Blade 98 V9 (18x20)", 
            "Blade 100 V9", "Blade 100L V9", "Blade 104 V9"
        ],
        "Pro Staff": [
            "Pro Staff 97 V14", "Pro Staff RF 97", "Pro Staff X", "Pro Staff Six.One"
        ],
        "Ultra": [
            "Ultra 100 V4", "Ultra 100L V4", "Ultra Tour"
        ],
        "Clash": [
            "Clash 100 V2", "Clash 100 Pro V2", "Clash 98 V2", "Clash 100L V2"
        ]
    },
    "Babolat": {
        "Pure Drive": [
            "Pure Drive", "Pure Drive 98", "Pure Drive Tour", 
            "Pure Drive VS", "Pure Drive Team", "Pure Drive Lite"
        ],
        "Pure Aero": [
            "Pure Aero", "Pure Aero 98", "Pure Aero Rafa Origin", 
            "Pure Aero Rafa", "Pure Aero Team"
        ],
        "Pure Strike": [
            "Pure Strike 98 (16x19)", "Pure Strike 98 (18x20)", 
            "Pure Strike 100 (16x20)", "Pure Strike 97", "Pure Strike VS"
        ]
    }
};

const STRING_DATA = {
    "Yonex": [
        "Poly Tour Pro", "Poly Tour Strike", "Poly Tour Rev", 
        "Poly Tour Spin", "Poly Tour Fire", "Poly Tour Air", 
        "Rexis Speed", "Rexis Comfort", "Rexis Feel"
    ],
    "Solinco": [
        "Hyper-G", "Hyper-G Soft", "Hyper-G Round", 
        "Tour Bite", "Tour Bite Soft", "Tour Bite Diamond Rough",
        "Confidential", "Outlast", "Barb Wire", "Vanquish", "X-Natural"
    ],
    "Luxilon": [
        "ALU Power", "ALU Power Rough", "ALU Power Spin", "ALU Power Vibe",
        "4G", "4G Soft", "4G Rough", 
        "Element", "Element Rough", 
        "Smart", "Original", "Savage", "LXN Eco Power"
    ],
    "Prince": [
        "Diablo", "Tour XP", "Tour XC", "Tour XS", 
        "Warrior Response", "Premier Control", "Premier Touch"
    ],
    "Babolat": [
        "RPM Blast", "RPM Rough", "RPM Power", "RPM Team", "RPM Soft", 
        "VS Touch (Natural Gut)", "Touch VS", "Xcel", "Addixion"
    ],
    "Head": [
        "Hawk Touch", "Hawk", "Hawk Power", 
        "Lynx", "Lynx Tour", "Lynx Edge", "Lynx Touch",
        "Velocity MLT", "Reflex MLT", "Sonic Pro"
    ],
    "Generic": [
        "Synthetic Gut (Generic)", "Natural Gut (Generic)", 
        "Multifilament (Generic)", "Polyester (Generic)"
    ]
};

// --- 4. AUTHENTICATION LOGIC ---

auth.onAuthStateChanged(user => {
    if (user) {
        $('authScreen').style.display = 'none';
        $('appContent').style.display = 'block';
        initApp(user);
    } else {
        $('authScreen').style.display = 'flex';
        $('appContent').style.display = 'none';
        if(unsubscribe) unsubscribe();
    }
});

function handleEmailLogin() {
    const email = $('loginEmail').value;
    const pass = $('loginPass').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
}

function handleEmailSignUp() {
    const email = $('loginEmail').value;
    const pass = $('loginPass').value;
    auth.createUserWithEmailAndPassword(email, pass).catch(e => alert(e.message));
}

function handleGoogleLogin() {
    auth.signInWithPopup(googleProvider).catch(e => alert(e.message));
}

function handleLogout() {
    auth.signOut();
    window.location.reload();
}

// --- 5. APP INITIALIZATION & UI POPULATION ---

function initApp(user) {
    initDropdowns();
    
    // Subscribe to Firestore updates
    unsubscribe = db.collection('players')
        .orderBy('updatedAt', 'desc')
        .onSnapshot(snapshot => {
            allPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            render();
        });
}

function initDropdowns() {
    // 1. Populate Rackets
    const rackEl = $("racketModel");
    if (rackEl) {
        rackEl.innerHTML = '<option value="">-- Select Racket --</option>';
        for (const [brand, seriesObj] of Object.entries(RACKET_DATA)) {
            const group = document.createElement("optgroup");
            group.label = brand;
            for (const [series, models] of Object.entries(seriesObj)) {
                models.forEach(m => {
                    // Check if string contains brand already to avoid "Yonex Yonex EZONE"
                    const val = m.startsWith(brand) ? m : `${brand} ${m}`;
                    group.appendChild(new Option(val, val));
                });
            }
            rackEl.appendChild(group);
        }
    }

    // 2. Populate Patterns
    const patEl = $("pattern");
    if (patEl) {
        const patterns = ["16x19", "18x20", "16x18", "16x20", "18x19", "14x18 (Prince)", "18x16 (Spin)"];
        patEl.innerHTML = '<option value="">-- Pattern --</option>';
        patterns.forEach(p => patEl.add(new Option(p, p)));
    }

    // 3. Populate Strings
    const populateStrings = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">-- Select String --</option>';
        for (const [brand, models] of Object.entries(STRING_DATA)) {
            const group = document.createElement("optgroup");
            group.label = brand;
            models.forEach(m => {
                const val = m.startsWith(brand) ? m : `${brand} ${m}`;
                group.appendChild(new Option(val, val));
            });
            el.appendChild(group);
        }
    };
    populateStrings($("stringMain"));
    populateStrings($("stringCross"));

    // 4. Populate Grips
    const populateGrips = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">-- Select Grip --</option>';
        GRIP_OPTIONS.forEach(g => el.appendChild(new Option(g, g)));
    };
    populateGrips($("forehandGrip"));
    populateGrips($("backhandGrip"));

    // 5. Populate Tensions (30lbs to 75lbs)
    const tm = $("tensionMain"), tc = $("tensionCross");
    if (tm && tm.options.length <= 1) {
        for(let i=30; i<=75; i++) {
            tm.add(new Option(i + " lbs", i));
            tc.add(new Option(i + " lbs", i));
        }
    }
}

// --- 6. CORE FUNCTIONS: RENDER & EDIT ---

function render() {
    const list = $("playerList");
    const search = $("search").value.toLowerCase();
    const sortBy = $("sortBy") ? $("sortBy").value : "updatedAt";

    list.innerHTML = "";

    // Filter
    let filtered = allPlayers.filter(p => p.name.toLowerCase().includes(search));

    // Sort
    filtered.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'ratingHigh') return (b.setupRating || 0) - (a.setupRating || 0);
        // default: newest/updatedAt
        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    if (filtered.length === 0) {
        $("empty").style.display = "block";
        return;
    }
    $("empty").style.display = "none";

    // Generate Cards
    filtered.forEach(p => {
        const div = document.createElement("div");
        div.className = "item-card";
        div.onclick = () => editPlayer(p.id);
        
        // Color code based on feeling
        const feelingColor = (p.weeklyFeeling > 80) ? '#4caf50' : (p.weeklyFeeling < 40) ? '#f44336' : '#ffa000';
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>${escapeHTML(p.name)}</strong>
                <span style="font-size:12px; color:${feelingColor}; font-weight:bold;">
                    Feel: ${p.weeklyFeeling || '--'}
                </span>
            </div>
            <div style="font-size:12px; color:#666; margin-top:4px;">
                ${p.racketModel || 'Unknown Racket'}
            </div>
            <div style="font-size:11px; color:#888; margin-top:2px;">
                ${p.stringMain || '?'}/${p.stringCross || '?'} @ ${p.tensionMain || '?'}lbs
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
    
    // Racket & String Setup
    $("racketModel").value = p.racketModel || "";
    $("pattern").value = p.pattern || "";
    $("stringMain").value = p.stringMain || "";
    $("stringCross").value = p.stringCross || "";
    $("tensionMain").value = p.tensionMain || "";
    $("tensionCross").value = p.tensionCross || "";
    $("forehandGrip").value = p.forehandGrip || "";
    $("backhandGrip").value = p.backhandGrip || "";

    // Physicals & Stats
    $("shoeWearStatus").value = p.shoeWearStatus || "average";
    $("ballMachineUsage").value = p.ballMachineUsage || "none";
    $("playIntensity").value = p.playIntensity || "2.5";
    $("weeklyFeeling").value = p.weeklyFeeling || "";
    $("setupRating").value = p.setupRating || "";
    
    $("notes").value = p.notes || "";
    
    checkWearWarning(); // Update the visual warning based on loaded data
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 7. TOOLBOX FUNCTIONS ---

function checkWearWarning() {
    const status = $("shoeWearStatus").value;
    const refDiv = $("wearReference");
    
    if (status === "smooth") {
        refDiv.style.display = "block";
        refDiv.style.background = "rgba(255, 75, 75, 0.1)";
        refDiv.style.border = "1px solid #ff4b4b";
        refDiv.innerHTML = "🚨 <strong>Critical Warning:</strong> Smooth outsoles significantly increase risk of ACL/Ankle injury on hard courts. Replace shoes immediately.";
    } else if (status === "moderate") {
        refDiv.style.display = "block";
        refDiv.style.background = "rgba(255, 235, 59, 0.1)";
        refDiv.style.border = "1px solid #ffeb3b";
        refDiv.innerHTML = "⚠️ <strong>Caution:</strong> Traction is compromised. Be careful on wide defensive slides.";
    } else {
        refDiv.style.display = "none";
    }
}

function calculateTensionLoss() {
    // Basic calculator: Poly strings lose ~10-15% in first 24h, then settle
    const dateInput = $("stringingDate");
    const resultDiv = $("tensionResult");
    
    if (!dateInput.value) return;

    const start = new Date(dateInput.value);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    let loss = 0;
    if (diffDays < 1) loss = "0-5%";
    else if (diffDays <= 2) loss = "8-12%";
    else if (diffDays <= 7) loss = "15-20%";
    else if (diffDays <= 30) loss = "25-30%";
    else loss = "35%+ (Dead)";

    resultDiv.innerHTML = `Days Since Stringing: <strong>${diffDays}</strong><br>Est. Tension Loss: <strong>${loss}</strong>`;
}

// --- 8. FORM SUBMISSION ---

$("playerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("playerId").value || Math.random().toString(36).substr(2, 9);
    
    const data = {
        name: $("name").value.trim(),
        
        // Racket Specs
        racketModel: $("racketModel").value,
        pattern: $("pattern").value,
        stringMain: $("stringMain").value,
        stringCross: $("stringCross").value,
        tensionMain: $("tensionMain").value,
        tensionCross: $("tensionCross").value,
        forehandGrip: $("forehandGrip").value,
        backhandGrip: $("backhandGrip").value,
        
        // Performance Stats
        shoeWearStatus: $("shoeWearStatus").value,
        ballMachineUsage: $("ballMachineUsage").value,
        playIntensity: $("playIntensity").value,
        weeklyFeeling: $("weeklyFeeling").value,
        setupRating: $("setupRating").value,
        
        notes: $("notes").value.trim(),
        updatedAt: Date.now(),
        lastUpdatedBy: auth.currentUser ? auth.currentUser.email : 'anon'
    };

    try {
        await db.collection("players").doc(id).set(data, { merge: true });
        alert("Success: Player Profile Vaulted.");
        $("playerForm").reset();
        $("playerId").value = "";
        $("wearReference").style.display = "none";
    } catch (err) {
        console.error(err);
        alert("Error saving vault record.");
    }
});

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}
