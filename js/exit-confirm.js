/**
 * exit-confirm.js — Popup Konfirmasi Keluar (Back Button Android)
 */

let exitPopupOpen = false;
let exitConfirmReady = false;

// ===== SETUP: Push history palsu =====
function setupExitConfirm() {
  if (exitConfirmReady) return;
  exitConfirmReady = true;

  // Push state palsu — biar ada history yang bisa di-back
  history.pushState({ umbrella: 'main' }, '');

  // Cegat back button
  window.addEventListener('popstate', (e) => {
    console.log('⬅️ Back button ditekan');

    // Push ulang biar tetap di halaman
    history.pushState({ umbrella: 'main' }, '');

    // Kalau popup lain buka → tutup dulu (prioritas)
    // Kalau nggak ada → tampilkan konfirmasi keluar
    if (adaModalBuka()) {
      console.log('ℹ️ Modal buka — back nggak trigger exit');
      return;
    }

    openExitConfirm();
  });
}

// ===== Cek: ada modal lain buka? =====
function adaModalBuka() {
  const checks = [
    'headlineOverlay',
    'mailOverlay',
    'infoOverlay',
    'tentangOverlay',
    'galleryOverlay',
    'modalOverlay',
    'gatekeeper',
    'chatInputOverlay',
    'galleryLightbox'
  ];

  for (const id of checks) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.classList.contains('open')) return true;
    if (el.classList.contains('show')) return true;
  }

  return false;
}

// ===== BUKA POPUP =====
function openExitConfirm() {
  const overlay = document.getElementById('exitOverlay');
  if (!overlay) return;

  exitPopupOpen = true;
  overlay.classList.add('open');
}

// ===== TUTUP POPUP =====
function closeExitConfirm() {
  const overlay = document.getElementById('exitOverlay');
  if (!overlay) return;

  exitPopupOpen = false;
  overlay.classList.remove('open');
}

// ===== KONFIRMASI KELUAR (YA) =====
function konfirmasiKeluar() {
  console.log('👋 User konfirmasi keluar');

  // Reset flag biar popstate nggak cegat
  exitConfirmReady = false;

  // Hapus state palsu (2x: 1 untuk popup, 1 untuk state awal)
  history.go(-2);

  // Fallback: kalau history.go gagal (nggak ada history), coba close
  setTimeout(() => {
    try {
      window.close();
    } catch (e) {
      // Browser nggak allow window.close() kecuali dibuka via JS
      // Fallback: redirect ke about:blank
      window.location.href = 'about:blank';
    }
  }, 100);
}

// ===== BATAL (TIDAK) =====
function batalKeluar() {
  console.log('↩️ User batal keluar');
  closeExitConfirm();
}

// ===== ESC =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (exitPopupOpen) {
      closeExitConfirm();
    }
  }
});

// ===== INIT =====
window.addEventListener('load', () => {
  setTimeout(setupExitConfirm, 500);   // delay biar page settle
});

// ===== EXPOSE =====
window.openExitConfirm = openExitConfirm;
window.closeExitConfirm = closeExitConfirm;
window.konfirmasiKeluar = konfirmasiKeluar;
window.batalKeluar = batalKeluar;

console.log('✅ exit-confirm.js loaded');
