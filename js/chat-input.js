/**
 * chat-input.js — Form Tulis Chat
 */

// ===== KONFIG =====
const CHAT_MAX_CHARS = 100;

// Daftar kata kasar / porno (dasar — bisa ditambah)
const KATA_TERLARANG = [
  // Kata kasar Indonesia
  'anjing', 'anjg', 'anjir', 'bangsat', 'bajingan', 'kontol', 'kntl',
  'memek', 'mmk', 'ngentot', 'ngentod', 'ngewe', 'pepek', 'peler',
  'titit', 'tai', 'tahi', 'kampret', 'keparat', 'sialan', 'babi',
  'monyet', 'kadal', 'asu', 'bedebah', 'brengsek', 'setan', 'iblis',
  'anj*ng', 'b*ngs*t', 'k*nt*l', 'm*m*k', 'ng*nt*t',
  // Bahasa Inggris
  'fuck', 'fck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'cock', 'cunt', 'whore', 'slut', 'porn', 'sex', 'xxx',
];

// ===== STATE =====
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
  const overlay = document.getElementById('chatInputOverlay');
  const input = document.getElementById('chatInputBox');
  if (!overlay || !input) return;

  // Cek mute
  if (typeof muteExpiryTime !== 'undefined' && Date.now() < muteExpiryTime) {
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

// ===== PESAN ERROR =====
function showChatInputMessage(msg) {
  const el = document.getElementById('chatInputMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function clearChatInputMessage() {
  const el = document.getElementById('chatInputMessage');
  if (!el) return;
  el.innerText = '';
  el.classList.remove('show');
}

// ===== KIRIM / BATAL =====
async function kirimChat() {
  const input = document.getElementById('chatInputBox');
  if (!input) return;

  const rawText = (input.innerText || '').trim();

  // 🎯 KALAU KOSONG → BATAL (tutup form)
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

  // Optimistic UI
  const chatLogs = document.getElementById('chatLogs');
  if (chatLogs) {
    const d = document.createElement('div');
    d.className = 'chat-line';
    d.innerHTML = `<span class="chat-name" style="color:#f0d78c">${escapeHtml(ign)}:</span><span class="chat-text">${escapeHtml(result.text)}</span>`;
    chatLogs.appendChild(d);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }

  closeChatInput();

  try {
    const res = await API.sendChat(uid, ign, result.text, 'msg');
    console.log('✅ Chat terkirim:', res);
    // Refresh log chat setelah kirim
    if (typeof syncChat === 'function') {
      setTimeout(() => syncChat(true), 500);
    }
  } catch (err) {
    console.error('❌ Gagal kirim chat:', err);
    showChatInputMessage('Gagal mengirim pesan');
  }
}

// ===== ESCAPE HTML =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
}

// ===== AUTO-GROW KOTAK INPUT =====
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

console.log('✅ chat-input.js loaded');
