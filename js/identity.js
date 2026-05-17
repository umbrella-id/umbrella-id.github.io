/**
 * identity.js - Umbrella Identity System (Final Gold - Verified Patch V2)
 * Versi: Final (No Browser Prompt + UX Android Native Navbar Back Support)
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

    // 🎯 SUNTIKAN 1: Kunci tombol back Android saat panel Gatekeeper mekar
    history.pushState({ boksTerbuka: "gatekeeper" }, "");

    gate.style.display = 'flex';
    gate.style.opacity = "1";
    
    // Smart Focus untuk PC (Layar lebar), abaikan di HP agar transisi mulus
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
    
    // 🎯 SUNTIKAN 2: Bersihkan riwayat palsu dari memori karena login sukses disubmit
    if (history.state && history.state.boksTerbuka === "gatekeeper") {
        history.back();
    }
    
    const gate = document.getElementById('site-gatekeeper');
    if (gate) {
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
            if (typeof window.syncChat === "function") window.syncChat();
        }, 500);
    }
}

// FUNGSI TUTUP / CANCEL / SKIP (Tombol X atau klik overlay luar)
function closeGate() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // 🎯 SUNTIKAN 3: Bersihkan riwayat palsu karena ditutup manual lewat klik X fisik / overlay luar
        if (history.state && history.state.boksTerbuka === "gatekeeper") {
            history.back();
        }

        // MODE RE-IDENTITY: Tutup saja, biarkan nama tetap yang lama
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
        }, 500);
    } else {
        // MODE USER BARU: Klik X berarti "Malas Isi", otomatis buatkan nama System
        console.log("User skipped identification. Auto-generating Guest ID...");
        skipLogin(); // Ini akan memanggil finalizeLogin dengan nama Guest-XXXX
    }
}

// 🎯 SUNTIKAN KUSTOM UNTUK NAVBAR ANDROID ONLY: 
// Fungsi ini dipanggil khusus oleh satpam popstate di chat.js saat user menekan tombol Back fisik HP
function closeGateFromNavbar() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // Mode Edit Nama: Cukup tutup visual tanpa manggil history.back() lagi (karena navbarnya udah otomatis mundur)
        gate.style.opacity = "0";
        setTimeout(() => { gate.style.display = 'none'; }, 500);
    } else {
        // User Baru: Paksa bikinin nama Guest secara otomatis
        skipLogin();
    }
}

function skipLogin() {
    const guestName = "Guest-" + Math.floor(1000 + Math.random() * 9000);
    finalizeLogin(guestName);
}

// 6. EVENT LISTENERS GLOBAL (Disatukan setelah DOM Siap)
document.addEventListener("DOMContentLoaded", () => {
    // Cek akses saat pertama kali masuk
    if (!window.myIGN) {
        unlockSite();
    } else {
        updateIdentityUI();
    }

    // Handler Enter di Input
    document.getElementById('global-ign-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveIdentity();
    });

    // Event click overlay luar (Background gatekeeper)
    document.getElementById('site-gatekeeper')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeGate();
        }
    });
});

// Expose fungsi ke window agar tombol HTML 'onclick' dan file chat.js bisa memanggil tanpa kendala scope
window.unlockSite = unlockSite;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
window.closeGateFromNavbar = closeGateFromNavbar; // 🎯 Expose fungsi navbar baru
