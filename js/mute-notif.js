/**
 * mute-notif.js — Notifikasi Mute (Tengah Stage)
 * + Force re-render chat saat mute expired
 */

let muteNotifTimer = null;
let muteExpiredTimer = null;

// ===== FORMAT WAKTU =====
function formatSisaMute(ms) {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const menit = Math.floor(totalSec / 60);
  const detik = totalSec % 60;
  if (menit > 0) return `${menit}m ${detik}s`;
  return `${detik}s`;
}

// ===== FORCE RE-RENDER CHAT =====
function forceRenderChat() {
  // Ambil log dari cache
  const cached = sessionStorage.getItem('umbrella_chat_cache');
  if (!cached) {
    console.warn('⚠️ Tidak ada cache chat untuk re-render');
    return;
  }

  try {
    const logs = JSON.parse(cached);
    if (typeof renderChatLogs === 'function') {
      renderChatLogs(logs);
      console.log('🔄 Force re-render chat (bersihkan log system)');
    }
  } catch (e) {
    console.error('❌ Gagal force render chat:', e);
  }
}

// ===== TAMPILKAN =====
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
  if (muteExpiredTimer) clearTimeout(muteExpiredTimer);

  // Update tiap detik
  muteNotifTimer = setInterval(() => {
    const expiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
    if (expiry <= 0 || Date.now() >= expiry) {
      el.classList.remove('show');
      clearInterval(muteNotifTimer);
      muteNotifTimer = null;
      localStorage.removeItem('umbrella_mute_expiry');
      console.log('🔓 Mute expired, notif disembunyikan');

      // 🎯 Force re-render chat
      forceRenderChat();
      return;
    }
    updateMuteNotifText();
  }, 1000);

  // 🎯 Timer akurat: tepat saat expired
  const sisaMs = expiry - Date.now();
  if (sisaMs > 0) {
    muteExpiredTimer = setTimeout(() => {
      console.log('⏰ Mute expired (timer akurat)');
      forceRenderChat();
    }, sisaMs + 100);   // buffer 100ms aja
  }
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
  if (muteExpiredTimer) {
    clearTimeout(muteExpiredTimer);
    muteExpiredTimer = null;
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
window.forceRenderChat = forceRenderChat;

console.log('✅ mute-notif.js loaded');
