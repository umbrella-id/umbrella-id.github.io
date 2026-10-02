/**
 * mute-notif.js — Notifikasi Mute (Tengah Layar)
 */

let muteNotifTimer = null;

// ===== FORMAT WAKTU =====
function formatSisaMute(ms) {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const menit = Math.floor(totalSec / 60);
  const detik = totalSec % 60;
  
  if (menit > 0) return `${menit}m ${detik}s`;
  return `${detik}s`;
}

// ===== TAMPILKAN NOTIFIKASI =====
function showMuteNotif() {
  const el = document.getElementById('muteNotif');
  if (!el) return;

  const expiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  if (expiry <= 0 || Date.now() >= expiry) {
    el.classList.remove('show');
    return;
  }

  el.classList.add('show');
  updateMuteNotifText();

  // Clear timer lama
  if (muteNotifTimer) clearInterval(muteNotifTimer);

  // Update tiap detik
  muteNotifTimer = setInterval(() => {
    const now = Date.now();
    const expiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;

    if (expiry <= 0 || now >= expiry) {
      // Mute habis → sembunyikan
      el.classList.remove('show');
      clearInterval(muteNotifTimer);
      muteNotifTimer = null;
      localStorage.removeItem('umbrella_mute_expiry');
      console.log('🔓 Mute expired, notif disembunyikan');
      return;
    }

    updateMuteNotifText();
  }, 1000);
}

// ===== UPDATE TEKS =====
function updateMuteNotifText() {
  const el = document.getElementById('muteNotif');
  if (!el) return;

  const expiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  const sisaMs = expiry - Date.now();
  if (sisaMs <= 0) return;

  el.innerText = `Anda sedang Dibisukan ${formatSisaMute(sisaMs)}`;
}

// ===== SEMBUNYIKAN =====
function hideMuteNotif() {
  const el = document.getElementById('muteNotif');
  if (!el) return;
  el.classList.remove('show');
  if (muteNotifTimer) {
    clearInterval(muteNotifTimer);
    muteNotifTimer = null;
  }
}

// ===== CEK & TAMPILKAN OTOMATIS =====
function checkMuteNotif() {
  const expiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  if (expiry > 0 && Date.now() < expiry) {
    showMuteNotif();
  } else {
    hideMuteNotif();
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  checkMuteNotif();
});

// ===== EXPOSE =====
window.showMuteNotif = showMuteNotif;
window.hideMuteNotif = hideMuteNotif;
window.checkMuteNotif = checkMuteNotif;

console.log('✅ mute-notif.js loaded');
