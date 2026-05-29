/**
 * identity.js - Umbrella Identity System (Final Gold - Clean Single-Satpam)
 */

// 1. INISIALISASI DATA GLOBAL
window.myUID = localStorage.getItem('u_uid') || 'U-' + Math.random().toString(36).substring(2, 11);
window.myIGN = localStorage.getItem('u_ign') || ""; 
localStorage.setItem('u_uid', window.myUID);

// 2. FUNGSI UPDATE UI
function updateIdentityUI() {
    const display = document.getElementById('current-ign-display');
    if (display) display.innerText = window.myIGN || "Guest";
}

// 3. FUNGSI UNLOCK / BUKA PANEL
function unlockSite() {
    const gate = document.getElementById('site-gatekeeper');
    const input = document.getElementById('global-ign-input');
    const title = document.getElementById('gate-title');

    if (!gate) return;

    if (window.myIGN) {
        if (title) title.innerText = "Nama / IGN";
        if (input) input.value = window.myIGN;
    } else {
        if (title) title.innerText = "Selamat Datang";
    }

    // Pasang riwayat palsu
    history.pushState({ boksTerbuka: "siteGatekeeper" }, "");

    gate.style.display = 'flex';
    gate.style.opacity = "1";
    
    if (input && window.innerWidth >= 768) {
        setTimeout(() => input.focus(), 300);
    }
}

// 4. FUNGSI SIMPAN
function saveIdentity() {
    const input = document.getElementById('global-ign-input');
    if (!input) return;

    let rawValue = input.value.trim();
    rawValue = rawValue.replace(/^[=+\-@]+/, ''); 

    if (rawValue === "") {
        input.focus();
        input.style.border = "1px solid red";
        setTimeout(() => input.style.border = "none", 1000);
        return;
    }
    window.myIGN = rawValue;
    localStorage.setItem('u_ign', window.myIGN);
    updateIdentityUI();
    closeGate();
}

// 5. FUNGSI FINALIZE LOGIN (SATU VERSI)
function finalizeLogin(name, shouldGoBack = true) {
    window.myIGN = name.substring(0, 15);
    localStorage.setItem('u_ign', window.myIGN);
    
    const gate = document.getElementById('site-gatekeeper');
    if (gate) {
        if (shouldGoBack && history.state && history.state.boksTerbuka === "siteGatekeeper") {
            history.back();
        }
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
        }, 500);
    }
}

// 6. FUNGSI SKIP LOGIN
function skipLogin() {
    const guestName = "Guest-" + Math.floor(1000 + Math.random() * 9000);
    finalizeLogin(guestName, false); // ← jangan back
}

// 7. FUNGSI TUTUP GATE (Tombol X)
function closeGate() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        if (history.state && history.state.boksTerbuka === "siteGatekeeper") {
            history.back();
        }
        gate.style.opacity = "0";
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    } else {
        console.log("User skipped identification. Auto-generating Guest ID...");
        skipLogin();
    }
}

// 8. FUNGSI EKSEKUSI DARI NAVBAR (popstate)
function closeGateFromNavbar() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        gate.style.opacity = "0";
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    } else {
        const guestName = "Guest-" + Math.floor(1000 + Math.random() * 9000);
        window.myIGN = guestName;
        localStorage.setItem('u_ign', window.myIGN);
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
        }, 500);
    }
    console.log("🛡️ Identity Gate closed safely via Central Satpam.");
}

window.closeGateFromNavbar = closeGateFromNavbar;

// 9. EVENT LISTENERS
document.addEventListener("DOMContentLoaded", () => {
    if (!window.myIGN) {
        unlockSite();
    } else {
        updateIdentityUI();
    }

    document.getElementById('global-ign-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveIdentity();
    });

    document.getElementById('site-gatekeeper')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeGate();
        }
    });
});

// Expose
window.unlockSite = unlockSite;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
