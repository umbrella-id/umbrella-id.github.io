/**
 * identity.js - Umbrella Identity System (Final Gold - Clean Single-Satpam)
 * Versi: Final (Android Back Clean Architecture & No Mobile Auto-Focus)
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

    // 🎯 SUNTIKAN NAVIGASI HP: Pasang jebakan riwayat palsu di browser saat panel input mekar
    history.pushState({ boksTerbuka: "siteGatekeeper" }, "");

    gate.style.display = 'flex';
    gate.style.opacity = "1";
    
    // ANTI-AUTO KEYBOARD MOBILE (Hanya fokus otomatis di PC)
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
        // Hapus riwayat palsu jika user sukses login/simpan nama agar history browser bersih kembali
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
        // Hapus riwayat palsu jika ditutup manual lewat klik tombol X atau area luar overlay
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

// 🎯 FUNGSI EKSEKUSI DI-BACK LEWAT NAVBAR HP
// Fungsi ini akan dipanggil secara aman oleh satpam universal yang ada di file chat.js lu!
function closeGateFromNavbar() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // Mode Re-Identity: Langsung kuncupin visualnya tanpa memicu history.back() lagi
        gate.style.opacity = "0";
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    } else {
        // Mode User Baru: Paksa kasih nick Guest jika nekat pencet tombol back pas awal masuk
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
    console.log("🛡️ Identity Gate closed safely via Central Satpam.");
}

// Expose fungsi eksekutor ke window global agar bisa diculik dan dipanggil oleh chat.js
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
    
    /* 🚨 LINGKUNGAN AMAN: Event window.addEventListener('popstate'...) 
       DI SINI SUDAH DIHAPUS TOTAL agar tidak bentrok dengan satpam utama di chat.js lu! */
});

// Expose fungsi ke window agar tombol HTML 'onclick' bisa memanggilnya tanpa kendala scope
window.unlockSite = unlockSite;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
