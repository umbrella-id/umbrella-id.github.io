/**
 * chat-input.js — Form Tulis Chat (V2 — With Rate Limit Handling)
 * 
 * Perubahan dari V1:
 * - Handle response "rate_limited" dari GAS 3
 * - Tampilkan pesan rate limit yang informatif
 * - Optimistic UI di-rollback kalau kena limit
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

// ===== BUKA FORM =====
function openChatInput() {
  // Baca ulang dari localStorage (fresh)
  muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;

  const overlay = document.getElementById('chatInputOverlay');
  const input = document.getElementById('chatInputBox');
  if (!overlay || !input) return;

  // Cek mute
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
  setTimeout(() => el.classList.remove('show'), 3500);   // ← dari 2500 → 3500 (biar kebaca)
}

function clearChatInputMessage() {
  const el = document.getElementById('chatInputMessage');
  if (!el) return;
  el.innerText = '';
  el.classList.remove('show');
}

// ===== KIRIM =====
async function kirimChat() {
  // 🎯 Cek mute DULU
  muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
  if (muteExpiryTime > 0 && Date.now() < muteExpiryTime) {
    const sisaMenit = Math.ceil((muteExpiryTime - Date.now()) / 60000);
    showChatInputMessage(`Kamu sedang di-mute. Sisa: ${sisaMenit} menit`);
    return;
  }

  const input = document.getElementById('chatInputBox');
  if (!input) return;

  const rawText = (input.innerText || '').trim();

  // Kosong → batal
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

  // 🎯 OPTIMISTIC UI — simpan referensi DOM biar bisa rollback
  const chatLogs = document.getElementById('chatLogs');
  let optimisticEl = null;

  if (chatLogs) {
    optimisticEl = document.createElement('div');
    optimisticEl.className = 'chat-line';
    optimisticEl.innerHTML = `<span class="chat-name">${escapeHtml(ign)} :</span><span class="chat-text"> ${escapeHtml(result.text)}</span>`;
    chatLogs.appendChild(optimisticEl);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }

  // Tutup form dulu (biar user bisa lihat chat log)
  closeChatInput();

  try {
    const res = await API.sendChat(uid, ign, result.text, 'msg');
    console.log('✅ Chat response:', res);

    // 🎯 HANDLE RATE LIMIT
    if (res && res.status === 'rate_limited') {
      // Rollback optimistic UI
      if (optimisticEl && optimisticEl.parentNode) {
        optimisticEl.remove();
      }

      const waitSec = res.retryAfter || 60;
      const waitMin = Math.ceil(waitSec / 60);
      const waitMsg = waitSec >= 60 
        ? `Tunggu sekitar ${waitMin} menit lagi`
        : `Tunggu sekitar ${waitSec} detik lagi`;

      // Tampilkan via chat system message (biar terlihat user)
      if (chatLogs) {
        const sysEl = document.createElement('div');
        sysEl.className = 'chat-line chat-system';
        sysEl.innerHTML = `<span class="chat-text">⚠️ Pesan terlalu cepat. ${waitMsg}.</span>`;
        chatLogs.appendChild(sysEl);
        chatLogs.scrollTop = chatLogs.scrollHeight;
      }

      // Toast juga
      if (typeof showToast === 'function') {
        showToast(`⚠️ ${waitMsg}`, true);
      }

      return;
    }

    // 🎯 SUCCESS — biarkan optimistic UI, sync untuk konfirmasi
    if (typeof syncChat === 'function') {
      setTimeout(() => syncChat(true), 500);
    }

  } catch (err) {
    console.error('❌ Gagal kirim chat:', err);

    // Rollback optimistic UI
    if (optimisticEl && optimisticEl.parentNode) {
      optimisticEl.remove();
    }

    // Tampilkan error
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

console.log('✅ chat-input.js loaded (V2 — With Rate Limit Handling)');
