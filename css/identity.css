/**
 * identity.js - Umbrella Identity System (Final Gold - Verified Patch)
 * Versi: Final (No Browser Prompt)
 */

// 1. INISIALISASI DATA GLOBAL
// 🎯 PATCH FIX: Mengubah .substr() kuno menjadi .substring() standar modern agar lolos linter GitHub
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

    // 🎯 SUNTIKAN BARU: Amankan tombol back Android saat panel nama kebuka
    history.pushState({ boksTerbuka: "gatekeeper" }, "");

    gate.style.display = 'flex';
    gate.style.opacity = "1";
    if (input) setTimeout(() => input.focus(), 300);
}

// 4. FUNGSI SIMPAN (Tombol Initialize)
function saveIdentity() {
    const input = document.getElementById('global-ign-input');
    const name = input ? input.value.trim() : "";
    
    if (name.length >= 2) {
        // Jika input valid, simpan nama baru
        finalizeLogin(name);
    } else {
        // LOGIKA BARU:
        if (window.myIGN) {
            // Jika sudah punya nama (Mode Edit), abaikan input kosong & tutup
            closeGate();
        } else {
            // Jika benar-benar user baru & input kosong, jadikan Guest
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
        gate.style.opacity = "0";
        setTimeout(() => {
            gate.style.display = 'none';
            updateIdentityUI();
            // Beritahu portal.js untuk refresh chat dengan nama baru
            if (typeof window.syncChat === "function") window.syncChat();
        }, 500);
    }
}

// FUNGSI TUTUP / CANCEL / SKIP (Tombol X)
function closeGate() {
    const gate = document.getElementById('site-gatekeeper');
    if (!gate) return;

    if (window.myIGN) {
        // 🎯 SUNTIKAN BARU: Hapus riwayat palsu dari memori karena ditutup manual lewat klik X
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

    // 🎯 PATCH FIX: Memindahkan event click overlay ke dalam DOMContentLoaded agar tidak bernilai 'null'
    document.getElementById('site-gatekeeper')?.addEventListener('click', function(e) {
        // Jika yang diklik adalah backgroundnya (bukan kotak portal-box di dalamnya)
        if (e.target === this) {
            closeGate();
        }
    });
});

// Expose fungsi ke window agar tombol HTML 'onclick' bisa memanggilnya tanpa kendala scope
window.unlockSite = unlockSite;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
