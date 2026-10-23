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

// ===== DATABASE KATA KASAR (BUG-10) =====
let badwordsDB = null;          // Set dari kata utuh
let badwordsPatterns = [];      // Array RegExp dari pola

// Fallback hardcoded (kalau fetch gagal)
const KATA_TERLARANG_FALLBACK = [
  'anjing', 'anjg', 'anjir', 'bangsat', 'bajingan', 'kontol', 'kntl',
  'memek', 'mmk', 'ngentot', 'ngentod', 'ngewe', 'pepek', 'peler',
  'titit', 'tai', 'tahi', 'kampret', 'keparat', 'sialan', 'babi',
  'monyet', 'kadal', 'asu', 'bedebah', 'brengsek', 'setan', 'iblis',
  'fuck', 'fck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'cock', 'cunt', 'whore', 'slut', 'porn', 'sex', 'xxx'
];

async function loadBadwordsDB() {
  try {
    const res = await fetch('Assets/badwords.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    
    badwordsDB = new Set(
      (data.words || []).map(w => w.toLowerCase().trim()).filter(Boolean)
    );
    badwordsPatterns = (data.patterns || [])
      .map(p => { try { return new RegExp(p, 'i'); } catch(e) { return null; } })
      .filter(Boolean);
    
    console.log('✅ Badwords DB loaded:', badwordsDB.size, 'words,', badwordsPatterns.length, 'patterns');
  } catch(e) {
    console.warn('⚠️ Badwords DB gagal load, pakai fallback:', e);
    badwordsDB = new Set(KATA_TERLARANG_FALLBACK);
    badwordsPatterns = [];
  }
}

// ===== NORMALISASI TEKS (untuk deteksi variasi) =====
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[8]/g, 'b')
    .replace(/[9]/g, 'g')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

let chatInputOpen = false;

// ===== FILTER =====
function filterPesan(text) {
  // Strip karakter kontrol di awal (cegah formula injection)
  let cleaned = text.replace(/^[=+\-@<>]+/, '');
  // Strip HTML tag
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Cek panjang dan kosong
  if (cleaned.length > CHAT_MAX_CHARS) {
    return { ok: false, reason: `Maksimal ${CHAT_MAX_CHARS} karakter` };
  }
  if (cleaned.trim() === '') {
    return { ok: false, reason: 'Pesan tidak boleh kosong' };
  }
  
  // ==========================================
  // BARU: deteksi kata kasar
  // ==========================================
  const normalized = normalizeText(cleaned);
  const words = normalized.split(/\s+/);
  
  // 1. Cek kata utuh (dari Set, exact match)
  if (badwordsDB) {
    for (const word of words) {
      if (word && badwordsDB.has(word)) {
        return { ok: false, reason: 'Pesan mengandung kata yang tidak pantas' };
      }
    }
  }
  
  // 2. Cek pola regex (untuk variasi seperti "anj1ng", "a n j i n g")
  //    Cek pada versi tanpa spasi juga (untuk deteksi "a n j i n g")
  const normalizedNoSpace = normalized.replace(/\s+/g, '');
  for (const pattern of badwordsPatterns) {
    if (pattern.test(normalized) || pattern.test(normalizedNoSpace)) {
      return { ok: false, reason: 'Pesan mengandung kata yang tidak pantas' };
    }
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
    
    if (res && res.status === 'muted') {
      if (optimisticEl && optimisticEl.parentNode) {
        optimisticEl.remove();
      }

      const sisaMenit = res.sisaMenit || 0;
      const waitMsg = `Kamu sedang dibisukan. Sisa ${sisaMenit} menit.`;

      if (chatLogs) {
        const sysEl = document.createElement('div');
        sysEl.className = 'chat-line chat-system';
        sysEl.innerHTML = `<span class="chat-text">🔇 ${escapeHtml(waitMsg)}</span>`;
        chatLogs.appendChild(sysEl);
        chatLogs.scrollTop = chatLogs.scrollHeight;
      }

      if (typeof showToast === 'function') {
        showToast(`🔇 ${waitMsg}`, true);
      }

      // Sync ulang supaya localStorage mute state akurat
      if (typeof syncChat === 'function') {
        setTimeout(() => syncChat(true), 500);
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

// ===== AUTO-GROW =====
document.addEventListener('DOMContentLoaded', () => {
  loadBadwordsDB();
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
