/**
 * chat.js — Chat Box (Log Only) + Drag + Snap + Sinkronisasi GAS
 */

const chatBox = document.getElementById('chatBox');
const chatDrag = document.getElementById('chatDrag');

let isDragging = false;
let startPointer = { x: 0, y: 0 };
let startChatHeightPct = 25;
let currentChatHeightPct = 25;
let hasMoved = false;

const DEFAULT_PERCENT = 25;
const SNAP_THRESHOLD = 90;
const FULL_PERCENT = 100;
const MIN_PERCENT = 3;
const MOVE_THRESHOLD = 3;

// ===== CACHE & POLLING =====
const CHAT_CACHE_KEY = 'umbrella_chat_cache';
const CHAT_STAMP_KEY = 'umbrella_chat_stamp';
const POLL_INTERVAL_MS = 4500;
let chatPollingTimer = null;
let lastChatStamp = sessionStorage.getItem(CHAT_STAMP_KEY) || '';

// ===== DRAG LOGIC =====
function getPointer(e) {
  if (e.touches && e.touches.length) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function getVisualVH() {
  return isPortrait() ? window.innerWidth : window.innerHeight;
}

function onDown(e) {
  isDragging = true;
  hasMoved = false;
  startPointer = getPointer(e);
  startChatHeightPct = currentChatHeightPct;
  chatBox.classList.add('dragging');
  if (e.type === 'mousedown') e.preventDefault();
}

function onMove(e) {
  if (!isDragging) return;
  const pointer = getPointer(e);
  const dx = pointer.x - startPointer.x;
  const dy = pointer.y - startPointer.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!hasMoved && distance < MOVE_THRESHOLD) return;
  hasMoved = true;

  let movement;
  if (isPortrait()) {
    movement = dx;
  } else {
    movement = -dy;
  }

  const vh = getVisualVH();
  const percent = startChatHeightPct + (movement / vh) * 100;
  const clamped = Math.max(MIN_PERCENT, Math.min(FULL_PERCENT, percent));
  currentChatHeightPct = clamped;
  chatBox.style.height = clamped + '%';
  e.preventDefault();
}

function onUp() {
  if (!isDragging) return;
  isDragging = false;
  chatBox.classList.remove('dragging');
  if (!hasMoved) return;
  if (currentChatHeightPct > SNAP_THRESHOLD) {
    chatBox.style.height = FULL_PERCENT + '%';
    currentChatHeightPct = FULL_PERCENT;
  } else {
    chatBox.style.height = DEFAULT_PERCENT + '%';
    currentChatHeightPct = DEFAULT_PERCENT;
  }
}

chatDrag.addEventListener('mousedown', onDown);
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
chatDrag.addEventListener('touchstart', onDown, { passive: true });
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('touchend', onUp);

// ===== ESCAPE HTML =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
}

// ===== WARNA USERNAME =====
function getHashColor(uid) {
  if (!uid) return '#ccc';
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 75%, 75%)`;
}

// ===== RENDER LOG =====
function renderChatLogs(logs) {
  const container = document.getElementById('chatLogs');
  if (!container) return;

  if (!Array.isArray(logs) || logs.length === 0) {
    container.innerHTML = '<div class="chat-line chat-system"><span class="chat-text">Belum ada pesan.</span></div>';
    return;
  }

  container.innerHTML = '';

  const uid = window.myUID;

  logs.forEach(msg => {
    try {
      const msgType = msg.type || 'msg';
      const msgUID = msg.uid || '';
      const msgName = msg.username || 'Anon';
      const msgText = msg.message || '';
      const msgRole = msg.role || '';

      const isMe = msgUID === uid;
      const isAdmin = (typeof msgUID === 'string' && msgUID.startsWith('ADMIN_')) || msgRole === 'Admin';
      const isDeleted = msgText === '[deleted by admin]';

      const d = document.createElement('div');

      // 🎯 SYSTEM MESSAGE (command MUTE/UNMUTE atau info)
      if (msgType === 'command') {
        let displayText = msgText;
        if (msgText.startsWith('MUTE_')) {
          const parts = msgText.split('_');
          const targetIGN = parts[3] || 'Seseorang';
          const durasi = parts[2] || '?';
          displayText = `🔇 ${targetIGN} dibisukan selama ${durasi} menit`;
        } else if (msgText.startsWith('UNMUTE_')) {
          const parts = msgText.split('_');
          const targetIGN = parts[2] || 'Seseorang';
          displayText = `🔊 Bisuan ${targetIGN} telah dibuka`;
        } else {
          displayText = msgText;
        }
        d.className = 'chat-line chat-system';
        d.innerHTML = `<span class="chat-text">${escapeHtml(displayText)}</span>`;
      }
      // 🎯 PESAN DIHAPUS ADMIN
      else if (isDeleted) {
        d.className = 'chat-line chat-system';
        d.innerHTML = `<span class="chat-text">🗑️ Sebuah pesan dihapus oleh admin</span>`;
      }
      // 🎯 PESAN ADMIN (hijau)
      else if (isAdmin) {
        d.className = 'chat-line chat-admin';
        d.innerHTML = `<span class="chat-name">[ADMIN] ${escapeHtml(msgName)}:</span><span class="chat-text">${escapeHtml(msgText)}</span>`;
      }
      // 🎯 PESAN PENGGUNA (putih)
      else {
        d.className = 'chat-line';
        d.innerHTML = `<span class="chat-name">${escapeHtml(msgName)}:</span><span class="chat-text">${escapeHtml(msgText)}</span>`;
      }

      container.appendChild(d);
    } catch (e) {
      console.error('Error render chat:', e);
    }
  });

  container.scrollTop = container.scrollHeight;
}

// ===== SINKRONISASI CHAT =====
async function syncChat(force = false) {
  const uid = window.myUID;
  const ign = window.myIGN;
  if (!uid || !ign) return;

  // Cek mute
  const muteExpiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  const isMuted = Date.now() < muteExpiry;

  try {
    const data = await API.getChats(uid, ign, isMuted, muteExpiry);
    if (!data) return;

    const arrayChat = data.logs || [];
    const currentStamp = JSON.stringify(arrayChat);

    // Kalau data sama → skip render
    if (currentStamp === lastChatStamp && !force) {
      console.log('✅ Chat stamp sama, skip render');
      return;
    }

    lastChatStamp = currentStamp;
    sessionStorage.setItem(CHAT_STAMP_KEY, currentStamp);
    sessionStorage.setItem(CHAT_CACHE_KEY, currentStamp);

    renderChatLogs(arrayChat);
    console.log('🔄 Chat disinkronkan:', arrayChat.length, 'pesan');
  } catch (err) {
    console.error('❌ Gagal sync chat:', err);
  }
}

// ===== LOAD DARI CACHE =====
function loadChatFromCache() {
  const cached = sessionStorage.getItem(CHAT_CACHE_KEY);
  if (!cached) return false;

  try {
    const logs = JSON.parse(cached);
    renderChatLogs(logs);
    console.log('✅ Chat dari cache:', logs.length, 'pesan');
    return true;
  } catch (e) {
    console.error('Error load cache:', e);
    return false;
  }
}

// ===== POLLING =====
function startPolling() {
  if (chatPollingTimer) return;
  chatPollingTimer = setInterval(() => {
    syncChat(false);
  }, POLL_INTERVAL_MS);
  console.log('▶️ Polling chat dimulai (interval ' + POLL_INTERVAL_MS + 'ms)');
}

function stopPolling() {
  if (chatPollingTimer) {
    clearInterval(chatPollingTimer);
    chatPollingTimer = null;
    console.log('⏸️ Polling chat dihentikan');
  }
}

// ===== INISIALISASI =====
document.addEventListener('DOMContentLoaded', () => {
  // Coba load dari cache dulu
  const loaded = loadChatFromCache();

  // Fetch fresh dari GAS
  setTimeout(() => {
    syncChat(true);   // force fetch
    startPolling();
  }, loaded ? 500 : 0);
});

// ===== PAUSE POLLING SAAT TAB TIDAK AKTIF =====
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    syncChat(true);
    startPolling();
  }
});

// ===== EXPOSE =====
window.syncChat = syncChat;
window.renderChatLogs = renderChatLogs;
console.log('✅ chat.js loaded');
