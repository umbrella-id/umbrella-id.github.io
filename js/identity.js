/**
 * identity.js - Umbrella Identity System (Final Gold - Verified Patch)
 * Versi: Final (Android Back Navigation & No Mobile Auto-Focus)
 */

// 1. INISIALISASI DATA GLOBAL
window.myUID = localStorage.getItem('u_uid') || 'U-' + Math.random().toString(36).substring(2, 11);
window.myIGN = localStorage.getItem('u_ign') || ""; 
localStorage.setItem('u_uid', window.myUID);

// 2. FUNGSI UPDATE UI (Nama di Label ID)
function updateIdentityUI() {
    const display = document.getElementById('current-ign-display');
    if (display) display.innerText = window.myIGN || "Guest";
}

// 3. FUNGSI UNLOCK / BUKA PANEL (Triggered by Label ID or Startup)
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

    // 🎯 SUNTIKAN NAVIGASI HP 1: Pasang jebakan riwayat palsu di browser saat panel input mekar
    // Biar kalau user mencet tombol Back fisik, browser gak keluar dari web lu.
    history.pushState({ boksTerbuka: "siteGatekeeper" }, "");

    gate.style.display = 'flex';
    gate.style.opacity = "1";
    
    // ANTI-AUTO KEYBOARD MOBILE
    if (input && window.innerWidth >= 768) {
        setTimeout(() => input.focus(), 300);
    }
}

// 4. FUNGSI SIMPAN (Tombol Initialize)
function saveIdentity() {
    const input = document.getElementById('global-ign-input');
    const name = input ? input.value.trim() : "";
    
    if (name.length >= 2) {
        finalizeLogin(name);
    } else {
        if (window.myIGN) {
            closeGate();
        } else {
            skipLogin();
        }
    }
}

// 5. FINALISASI DATA & TUTUP PANEL 
function finalizeLogin(name) {
    window.myIGN = name.substring(0, 15);
    localStorage.setItem('u_ign', window.myIGN);
    
    const gate = document.getElementById('site-gatekeeper');
    if (gate) {
        // 🎯 SUNTIKAN NAVIGASI HP 2: Bersihkan riwayat palsu jika user sukses login/simpan nama
        if (history.state && history.state.boksTerbuka === "siteGatekeeper") {
            history.back();
        }

        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
            if (typeof window.syncChat === "function") window.syncChat();
        }, 500);
    }
}

// FUNGSI TUTUP / CANCEL / SKIP (Tombol X)
function closeGate() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // 🎯 SUNTIKAN NAVIGASI HP 3: Hapus riwayat palsu jika ditutup manual lewat tombol X / klik luar
        if (history.state && history.state.boksTerbuka === "siteGatekeeper") {
            history.back();
        }

        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
        }, 500);
    } else {
        console.log("User skipped identification. Auto-generating Guest ID...");
        skipLogin();
    }
}

function skipLogin() {
    const guestName = "Guest-" + Math.floor(1000 + Math.random() * 9000);
    finalizeLogin(guestName);
}

// 🎯 SUNTIKAN NAVIGASI HP 4: SATPAM POPSTATE UTAMANYA!
// Fungsi ini dipanggil khusus saat browser mendeteksi tombol back navigasi HP ditekan
function closeGateFromNavbar() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // Mode Re-Identity: Langsung kuncupin murni visualnya
        gate.style.opacity = "0";
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    } else {
        // Mode User Baru: Nekat nge-back pas disuruh isi nama, auto-jejelin ID Guest biar portal gak macet
        const guestName = "Guest-" + Math.floor(1000 + Math.random() * 9000);
        window.myIGN = guestName;
        localStorage.setItem('u_ign', window.myIGN);
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
            if (typeof window.syncChat === "function") window.syncChat();
        }, 500);
    }
    console.log("🛡️ Identity Gate closed safely via Android/iOS Navbar.");
}

// Expose fungsi baru ke window global agar bisa saling panggil antardokumen JS
window.closeGateFromNavbar = closeGateFromNavbar;

// 6. EVENT LISTENERS GLOBAL (Disatukan setelah DOM Siap)
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

    // 🎯 SUNTIKAN NAVIGASI HP 5: Pasang detektor tombol back fisik HP universal
    window.addEventListener('popstate', function(e) {
        // Jika yang memicu back adalah riwayat palsu milik gatekeeper kita
        if (e.state && e.state.boksTerbuka === "siteGatekeeper") {
            closeGateFromNavbar();
        }
    });
});

// Expose fungsi ke window agar tombol HTML 'onclick' bisa memanggilnya tanpa kendala scope
window.unlockSite = unlockSite;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
