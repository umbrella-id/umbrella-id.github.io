/**
 * chat-input.js — Form Tulis Chat (V4 — Hapus Deteksi Admin)
 * 
 * Perubahan dari V3:
 * - Hapus deteksi admin (user web publik tidak akan pernah admin)
 * - Optimistic UI cuma 2 class: member / guest
 */

// ===== KONFIG =====
const CHAT_MAX_CHARS = 100;

// ===== STATE MUTE =====
let muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;

// Daftar kata kasar / porno (dasar)
const KATA_TERLARANG = [
  'anjing', 'anjg', 'anjir', 'bangsat', 'bajingan', 'kontol', 'kntl',
  'memek', 'mmk', 'ngentot', 'ngentod', 'ngewe', 'pepek', 'peler',
  'titit', 'tai', 'tahi', 'kampret', 'keparat', 'sialan', 'babi',
  'monyet', 'kadal', 'asu', 'bedebah', 'brengsek', 'setan', 'iblis',
  'anj*ng', 'b*ngs*t', 'k*nt*l', 'm*m*k', 'ng*nt*t',
  'fuck', 'fck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'cock', 'cunt', 'whore', 'slut', 'porn', 'sex', 'xxx',
];

let chatInputOpen = false;

// ===== FILTER =====
function filterPesan(text) {
  let cleaned = text.replace(/^[=+\-@<>]+/, '');
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  const lowerText = cleaned.toLowerCase();
  const foundBad = KATA_TERLARANG.some(kata => lowerText.includes(kata));
  if (foundBad) {
    return { ok: false, reason: 'Pesan mengandung kata yang tidak pantas' };
  }

  if (cleaned.length > CHAT_MAX_CHARS) {
    return { ok: false, reason: `Maksimal ${CHAT_MAX_CHARS} karakter` };
  }

  if (cleaned.trim() === '') {
    return { ok: false, reason: 'Pesan tidak boleh kosong' };
  }

  return { ok: true, text: cleaned.trim() };
}

// ==========================================
// 🎯 DETEKSI CLASS UNTUK OPTIMISTIC UI
// (Cuma member / guest — admin tidak relevan)
// ==========================================
function getMyChatClass() {
  const uid = window.myUID || '';
  
  if (uid.startsWith('M-')) return 'member';
  return 'guest';
}

// ==========================================
// 🎯 RENDER OPTIMISTIC ELEMENT
// ==========================================
function buildOptimisticElement(ign, text) {
  const chatClass = getMyChatClass();
  const el = document.createElement('div');
  
  if (chatClass === 'member') {
    el.className = 'chat-line chat-member';
    el.innerHTML = `<span class="chat-name">${escapeHtml(ign)} :</span><span class="chat-text"> ${escapeHtml(text)}</span>`;
  } else {
    el.className = 'chat-line';
    el.innerHTML = `<span class="chat-name">${escapeHtml(ign)} :</span><span class="chat-text"> ${escapeHtml(text)}</span>`;
  }
  
  return el;
}

// ===== BUKA FORM =====
function openChatInput() {
  muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;

  const overlay = document.getElementById('chatInputOverlay');
  const input = document.getElementById('chatInputBox');
  if (!overlay || !input) return;

  if (muteExpiryTime > 0 && Date.now() < muteExpiryTime) {
    const sisaMs = muteExpiryTime - Date.now();
    const sisaMenit = Math.ceil(sisaMs / 60000);
    showChatInputMessage(`Kamu sedang di-mute. Sisa: ${sisaMenit} menit`);
    return;
  }

  chatInputOpen = true;
  input.innerText = '';
  overlay.classList.add('open');
  clearChatInputMessage();

  if (window.innerWidth >= 768) {
    setTimeout(() => input.focus(), 300);
  }
}

// ===== TUTUP FORM =====
function closeChatInput() {
  const overlay = document.getElementById('chatInputOverlay');
  if (!overlay) return;

  chatInputOpen = false;
  overlay.classList.remove('open');
  clearChatInputMessage();
}

// ===== PESAN =====
function showChatInputMessage(msg) {
  const el = document.getElementById('chatInputMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

function clearChatInputMessage() {
  const el = document.getElementById('chatInputMessage');
  if (!el) return;
  el.innerText = '';
  el.classList.remove('show');
}

// ===== KIRIM =====
async function kirimChat() {
  muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  if (muteExpiryTime > 0 && Date.now() < muteExpiryTime) {
    const sisaMenit = Math.ceil((muteExpiryTime - Date.now()) / 60000);
    showChatInputMessage(`Kamu sedang di-mute. Sisa: ${sisaMenit} menit`);
    return;
  }

  const input = document.getElementById('chatInputBox');
  if (!input) return;

  const rawText = (input.innerText || '').trim();

  if (rawText === '') {
    closeChatInput();
    return;
  }

  const result = filterPesan(rawText);
  if (!result.ok) {
    showChatInputMessage(result.reason);
    return;
  }

  const uid = window.myUID;
  const ign = window.myIGN;
  if (!uid || !ign) {
    showChatInputMessage('Identitas belum diisi');
    return;
  }

  // 🎯 OPTIMISTIC UI — dengan class yang sesuai
  const chatLogs = document.getElementById('chatLogs');
  let optimisticEl = null;

  if (chatLogs) {
    optimisticEl = buildOptimisticElement(ign, result.text);
    chatLogs.appendChild(optimisticEl);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }

  closeChatInput();

  try {
    const res = await API.sendChat(uid, ign, result.text, 'msg');
    console.log('✅ Chat response:', res);

    if (res && res.status === 'rate_limited') {
      if (optimisticEl && optimisticEl.parentNode) {
        optimisticEl.remove();
      }

      const waitSec = res.retryAfter || 60;
      const waitMin = Math.ceil(waitSec / 60);
      const waitMsg = waitSec >= 60 
        ? `Tunggu sekitar ${waitMin} menit lagi`
        : `Tunggu sekitar ${waitSec} detik lagi`;

      if (chatLogs) {
        const sysEl = document.createElement('div');
        sysEl.className = 'chat-line chat-system';
        sysEl.innerHTML = `<span class="chat-text">⚠️ Pesan terlalu cepat. ${waitMsg}.</span>`;
        chatLogs.appendChild(sysEl);
        chatLogs.scrollTop = chatLogs.scrollHeight;
      }

      if (typeof showToast === 'function') {
        showToast(`⚠️ ${waitMsg}`, true);
      }

      return;
    }

    if (typeof syncChat === 'function') {
      setTimeout(() => syncChat(true), 500);
    }

  } catch (err) {
    console.error('❌ Gagal kirim chat:', err);

    if (optimisticEl && optimisticEl.parentNode) {
      optimisticEl.remove();
    }

    if (chatLogs) {
      const sysEl = document.createElement('div');
      sysEl.className = 'chat-line chat-system';
      sysEl.innerHTML = `<span class="chat-text">⚠️ Gagal mengirim pesan. Coba lagi.</span>`;
      chatLogs.appendChild(sysEl);
      chatLogs.scrollTop = chatLogs.scrollHeight;
    }

    if (typeof showToast === 'function') {
      showToast('❌ Gagal mengirim pesan', true);
    }
  }
}

// ===== ESCAPE =====
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

// ===== AUTO-GROW =====
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInputBox');
  if (input) {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      const newHeight = Math.min(input.scrollHeight, 90);
      input.style.height = newHeight + 'px';

      if (input.innerText.length > CHAT_MAX_CHARS) {
        input.innerText = input.innerText.substring(0, CHAT_MAX_CHARS);
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }
});

// ===== EXPOSE =====
window.openChatInput = openChatInput;
window.closeChatInput = closeChatInput;
window.kirimChat = kirimChat;
window.filterPesan = filterPesan;
window.getMyChatClass = getMyChatClass;

console.log('✅ chat-input.js loaded (V4 — Hapus Deteksi Admin)');
