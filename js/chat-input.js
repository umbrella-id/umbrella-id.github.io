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
  // Varian sensor
  'anj*ng', 'b*ngs*t', 'k*nt*l', 'm*m*k', 'ng*nt*t',
  // Bahasa Inggris
  'fuck', 'fck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'cock', 'cunt', 'whore', 'slut', 'porn', 'sex', 'xxx',
];

// ===== STATE =====
let chatInputOpen = false;

// ===== FILTER =====
function filterPesan(text) {
  // 1. Sanitasi karakter berbahaya di AWAL (untuk Google Sheets)
  let cleaned = text.replace(/^[=+\-@<>]+/, '');

  // 2. Hapus tag HTML berbahaya
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 3. Cek kata terlarang
  const lowerText = cleaned.toLowerCase();
  const foundBad = KATA_TERLARANG.some(kata => lowerText.includes(kata));
  if (foundBad) {
    return { ok: false, reason: 'Pesan mengandung kata yang tidak pantas' };
  }

  // 4. Cek panjang
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

  // Auto-focus di desktop
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

// ===== KIRIM =====
async function kirimChat() {
  const input = document.getElementById('chatInputBox');
  if (!input) return;

  const rawText = input.innerText || '';
  const result = filterPesan(rawText);

  if (!result.ok) {
    showChatInputMessage(result.reason);
    return;
  }

  // Cek identitas
  const uid = window.myUID;
  const ign = window.myIGN;
  if (!uid || !ign) {
    showChatInputMessage('Identitas belum diisi');
    return;
  }

  // Optimistic UI: tampilkan dulu di log
  const chatLogs = document.getElementById('chatLogs');
  if (chatLogs) {
    const d = document.createElement('div');
    d.className = 'chat-line';
    d.innerHTML = `<span class="chat-name" style="color:#f0d78c">${escapeHtml(ign)}:</span><span class="chat-text">${escapeHtml(result.text)}</span>`;
    chatLogs.appendChild(d);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }

  // Tutup form
  closeChatInput();

  // Kirim ke GAS
  try {
    const res = await API.sendChat(uid, ign, result.text, 'msg');
    console.log('✅ Chat terkirim:', res);
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

// ===== AUTO-GROW KOTAK INPUT (max 3 baris) =====
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInputBox');
  if (input) {
    input.addEventListener('input', () => {
      // Reset height dulu biar bisa ngukur
      input.style.height = 'auto';
      // Set max 90px (3 baris)
      const newHeight = Math.min(input.scrollHeight, 90);
      input.style.height = newHeight + 'px';

      // Cek panjang
      if (input.innerText.length > CHAT_MAX_CHARS) {
        input.innerText = input.innerText.substring(0, CHAT_MAX_CHARS);
        // Pindahkan cursor ke akhir
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    // Enter → baris baru (default behavior di contenteditable)
    // Tapi cegah form submit & handle Ctrl+Enter? Nggak ada (kamu bilang kirim wajib tombol)
  }
});

// ===== EXPOSE =====
window.openChatInput = openChatInput;
window.closeChatInput = closeChatInput;
window.kirimChat = kirimChat;
window.filterPesan = filterPesan;

console.log('✅ chat-input.js loaded');
