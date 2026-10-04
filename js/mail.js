/**
 * mail.js — Mail 2 Arah (User Side) V2 — With Rate Limit Handling
 * 
 * Perubahan dari V1:
 * - Handle response "rate_limited" dari GAS 1
 * - Pesan error yang informatif
 */

let mailCurrentView = 'menu';
let mailCurrentList = [];
let mailCurrentDetail = null;
let mailCurrentFilter = 'all';
let mailLastTriggerCheck = 0;

// 🎯 CACHE
let mailCache = [];
let mailStamp = '';
const MAIL_CACHE_KEY = 'umbrella_mail_cache';
const MAIL_STAMP_KEY = 'umbrella_mail_stamp';

const GAS_MAIL_URL = 'https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec';

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const loaded = loadMailFromCache();
  
  setTimeout(() => {
    fetchMailFresh();
  }, loaded ? 500 : 100);
});

// ==========================================
// GET MESSAGE ID
// ==========================================
function getMessageId(mail) {
  return String(mail.timestamp);
}

// ==========================================
// LOAD CACHE
// ==========================================
function loadMailFromCache() {
  const cached = sessionStorage.getItem(MAIL_CACHE_KEY);
  if (!cached) return false;
  
  try {
    mailCache = JSON.parse(cached);
    mailStamp = cached;
    console.log('✅ Mail dari cache:', mailCache.length);
    updateBadgeFromCache();
    return true;
  } catch(e) {
    console.error('Load mail cache error:', e);
    return false;
  }
}

// ==========================================
// FETCH FRESH
// ==========================================
async function fetchMailFresh() {
  const uid = window.myUID;
  if (!uid) return;
  
  try {
    const url = `${GAS_MAIL_URL}?type=mail-list&uid=${encodeURIComponent(uid)}&filter=all`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'success' && data.mails) {
      const newStamp = JSON.stringify(data.mails);
      
      if (newStamp === mailStamp) {
        return;
      }
      
      mailCache = data.mails;
      mailStamp = newStamp;
      sessionStorage.setItem(MAIL_CACHE_KEY, newStamp);
      sessionStorage.setItem(MAIL_STAMP_KEY, newStamp);
      
      updateBadgeFromCache();
      refreshCurrentView();
    }
  } catch(e) {
    console.error('Fetch mail error:', e);
  }
}

// ==========================================
// REFRESH VIEW
// ==========================================
function refreshCurrentView() {
  const overlay = document.getElementById('mailOverlay');
  if (!overlay || !overlay.classList.contains('open')) return;
  
  if (mailCurrentView === 'list') {
    applyFilterAndRender(mailCurrentFilter);
  } else if (mailCurrentView === 'detail' && mailCurrentDetail) {
    openMailDetail(getMessageId(mailCurrentDetail));
  }
}

// ==========================================
// TRIGGER dari SyncChat
// ==========================================
function handleMailTrigger(lastMailReply) {
  if (!lastMailReply || lastMailReply <= 0) return;
  
  const savedReply = parseInt(localStorage.getItem('mail_last_reply_global') || '0');
  if (lastMailReply <= savedReply) return;
  
  console.log('📬 Mail trigger: ada balasan baru!', lastMailReply);
  localStorage.setItem('mail_last_reply_global', lastMailReply.toString());
  
  const now = Date.now();
  if (now - mailLastTriggerCheck < 5000) {
    return;
  }
  mailLastTriggerCheck = now;
  
  fetchMailFresh();
}

// ==========================================
// SET HEADER MODAL
// ==========================================
function setMailHeader(text) {
  const header = document.querySelector('#mailOverlay .mail-header');
  if (header) header.innerText = text;
}

// ==========================================
// BUKA MODAL MAIL
// ==========================================
function openMailModal() {
  const overlay = document.getElementById('mailOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;
  
  overlay.classList.add('open');
  if (stage) stage.classList.add('mail-open');
  
  if (typeof updateButtons === 'function') updateButtons();
  
  renderMailMenu();
  updateBadgeFromCache();
}

// ==========================================
// TUTUP MODAL MAIL
// ==========================================
function closeMailModal(skipMenu = false) {
  const overlay = document.getElementById('mailOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;
  
  overlay.classList.remove('open');
  if (stage) stage.classList.remove('mail-open');
  
  if (typeof updateButtons === 'function') updateButtons();
  
  mailCurrentView = 'menu';
  mailCurrentList = [];
  mailCurrentDetail = null;
  
  window._mailFromInfo = false;
  
  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openModal === 'function') openModal();
    }, 150);
  }
}

// ==========================================
// NAVIGASI BACK
// ==========================================
function mailGoBack() {
  switch (mailCurrentView) {
    case 'menu':
      closeMailModal();
      break;
    case 'list':
      renderMailMenu();
      break;
    case 'detail':
      openMailList(mailCurrentFilter);
      break;
    case 'reply':
      if (mailCurrentDetail) openMailDetail(getMessageId(mailCurrentDetail));
      else renderMailMenu();
      break;
    case 'history':
      renderMailMenu();
      break;
    case 'compose':
      if (window._mailFromInfo) {
        window._mailFromInfo = false;
        closeMailModal(true);
        setTimeout(() => {
          if (typeof openInfoModal === 'function') openInfoModal();
        }, 200);
      } else {
        renderMailMenu();
      }
      break;
    default:
      closeMailModal();
  }
}

// ==========================================
// RENDER MENU
// ==========================================
function renderMailMenu() {
  mailCurrentView = 'menu';
  setMailHeader('📬 KOTAK SURAT');
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="mail-menu-grid">
      <div class="mail-menu-item" onclick="openMailList('unread')">
        <span class="mail-menu-icon">📩</span>
        <span class="mail-menu-title">Belum Dibuka</span>
        <div class="mail-menu-badge" id="badge-unread" style="display:none;">0</div>
      </div>
      <div class="mail-menu-item" onclick="openMailList('read')">
        <span class="mail-menu-icon">📖</span>
        <span class="mail-menu-title">Sudah Dibaca</span>
      </div>
      <div class="mail-menu-item" onclick="openMailList('sent')">
        <span class="mail-menu-icon">📤</span>
        <span class="mail-menu-title">Terkirim</span>
      </div>
      <div class="mail-menu-item" onclick="openMailHistory()">
        <span class="mail-menu-icon">📋</span>
        <span class="mail-menu-title">Baca Sesuai Urutan</span>
      </div>
    </div>
    
    <div class="mail-compose-btn-wrap">
      <div class="btn-svg mail-compose-btn" onclick="openMailCompose()">
        <div class="btn-ujung-kiri"></div>
        <div class="btn-tengah"><span class="btn-teks">KIRIM SURAT BARU</span></div>
        <div class="btn-ujung-kanan"></div>
      </div>
    </div>
  `;
  
  updateBadgeFromCache();
}

// ==========================================
// BUKA LIST
// ==========================================
function openMailList(filter) {
  mailCurrentView = 'list';
  mailCurrentFilter = filter;
  
  const headerLabel = {
    'unread': '📩 BELUM DIBUKA',
    'read': '📖 SUDAH DIBACA',
    'sent': '📤 TERKIRIM'
  }[filter] || '📬 SURAT';
  setMailHeader(headerLabel);
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  container.innerHTML = `
    <div id="mailListContainer" class="mail-list"></div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  applyFilterAndRender(filter);
}

// ==========================================
// APPLY FILTER & RENDER
// ==========================================
function applyFilterAndRender(filter) {
  const container = document.getElementById('mailListContainer');
  if (!container) return;
  
  let filtered = mailCache;
  
  if (filter === 'unread') {
    filtered = mailCache.filter(m => m.isFromAdmin && !isMailReadLocal(getMessageId(m)));
  } else if (filter === 'read') {
    filtered = mailCache.filter(m => m.isFromAdmin && isMailReadLocal(getMessageId(m)));
  } else if (filter === 'sent') {
    filtered = mailCache.filter(m => !m.isFromAdmin);
  }
  
  filtered.sort((a, b) => b.timestamp - a.timestamp);
  
  mailCurrentList = filtered;
  renderMailList(filtered, filter);
}

// ==========================================
// RENDER LIST
// ==========================================
function renderMailList(mails, filter) {
  const container = document.getElementById('mailListContainer');
  if (!container) return;
  
  if (!mails || mails.length === 0) {
    let msg = 'Belum ada surat';
    if (filter === 'unread') msg = 'Belum ada surat baru';
    else if (filter === 'read') msg = 'Belum ada surat dibaca';
    else if (filter === 'sent') msg = 'Belum ada surat terkirim';
    container.innerHTML = `<div class="mail-empty">📭 ${msg}</div>`;
    return;
  }
  
  let html = '';
  for (const mail of mails) {
    html += buildMailCardHTML(mail);
  }
  
  container.innerHTML = html;
}

// ==========================================
// BUILD MAIL CARD
// ==========================================
function buildMailCardHTML(mail) {
  const ts = new Date(mail.timestamp);
  const tgl = ts.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
  const jam = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const preview = escapeMail(mail.message).substring(0, 100) + (mail.message.length > 100 ? '...' : '');
  const fromAdmin = mail.isFromAdmin;
  
  const senderLabel = fromAdmin 
    ? `<span class="mail-sender-tag">[ADMIN]</span>${escapeMail(mail.ign)}`
    : escapeMail(mail.ign);
  
  return `
    <div class="mail-card" onclick="openMailDetailById('${getMessageId(mail)}')">
      <div class="mail-card-row1">
        <span class="mail-card-sender">${senderLabel}</span>
        <span class="mail-card-time">${tgl} ${jam}</span>
      </div>
      <div class="mail-card-category">${escapeMail(mail.category || 'Umum')}</div>
      <div class="mail-card-preview">${preview}</div>
    </div>
  `;
}

// ==========================================
// CEK ADMIN REPLY TERAKHIR
// ==========================================
function isLastAdminReplyInCategory(mail) {
  if (!mail.isFromAdmin) return false;
  
  const sameCategory = mailCache.filter(m => 
    m.category === mail.category
  );
  
  if (sameCategory.length === 0) return false;
  
  sameCategory.sort((a, b) => b.timestamp - a.timestamp);
  const lastAdmin = sameCategory.find(m => m.isFromAdmin);
  
  return lastAdmin && lastAdmin.timestamp === mail.timestamp;
}

// ==========================================
// BUKA DETAIL BY ID
// ==========================================
function openMailDetailById(messageId) {
  const mail = mailCache.find(m => getMessageId(m) === messageId);
  if (!mail) return;
  openMailDetail(messageId);
}

// ==========================================
// BUKA DETAIL
// ==========================================
function openMailDetail(messageId) {
  mailCurrentView = 'detail';
  setMailHeader('📄 PESAN');
  
  const mail = mailCache.find(m => getMessageId(m) === messageId);
  if (!mail) return;
  
  mailCurrentDetail = mail;
  
  if (mail.isFromAdmin && !isMailReadLocal(messageId)) {
    markMailReadLocal(messageId);
    mail.status = 'READ';
    updateBadgeFromCache();
  }
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  const ts = new Date(mail.timestamp);
  const tgl = ts.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const jam = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const fromAdmin = mail.isFromAdmin;
  
  const senderLabel = fromAdmin 
    ? `<span class="mail-sender-tag">[ADMIN]</span>${escapeMail(mail.ign)}`
    : escapeMail(mail.ign);
  
  const showReplyButton = isLastAdminReplyInCategory(mail);
  
  container.innerHTML = `
    <div class="mail-detail">
      <div class="mail-detail-header">
        <span class="mail-detail-sender">${senderLabel}</span>
        <span class="mail-detail-category">${escapeMail(mail.category || 'Umum')}</span>
      </div>
      
      <div class="mail-detail-time">${tgl} ${jam}</div>
      
      <div class="mail-detail-body">${escapeMail(mail.message)}</div>
      
      ${showReplyButton ? `
        <div class="mail-detail-actions">
          <div class="btn-svg" onclick="openMailReplyForm('${messageId}')">
            <div class="btn-ujung-kiri"></div>
            <div class="btn-tengah"><span class="btn-teks">BALAS</span></div>
            <div class="btn-ujung-kanan"></div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
}

// ==========================================
// FORM BALAS
// ==========================================
function openMailReplyForm(messageId) {
  mailCurrentView = 'reply';
  setMailHeader('✏️ BALAS');
  
  const mail = mailCache.find(m => getMessageId(m) === messageId);
  if (!mail) return;
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="mail-compose">
      <div class="mail-compose-context">
        <div class="mail-compose-context-label">Pesan admin:</div>
        <div class="mail-compose-context-body">${escapeMail(mail.message)}</div>
      </div>
      
      <div class="mail-compose-group">
        <label class="mail-label">BALASAN ANDA</label>
        <textarea id="mailReplyInput" class="mail-textarea" placeholder="Tulis balasan..." maxlength="1000"></textarea>
      </div>
      
      <div class="mail-compose-footer">
        <div class="btn-svg" onclick="submitMailReply('${messageId}')">
          <div class="btn-ujung-kiri"></div>
          <div class="btn-tengah"><span class="btn-teks">KIRIM</span></div>
          <div class="btn-ujung-kanan"></div>
        </div>
      </div>
      
      <p class="mail-message" id="mailReplyMessage"></p>
    </div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  setTimeout(() => {
    const ta = document.getElementById('mailReplyInput');
    if (ta) ta.focus();
  }, 200);
}

// ==========================================
// KIRIM BALASAN
// ==========================================
async function submitMailReply(messageId) {
  const input = document.getElementById('mailReplyInput');
  const reply = input ? input.value.trim() : '';
  
  if (!reply) {
    showMailReplyMessage('Balasan tidak boleh kosong', 'error');
    return;
  }
  
  const uid = window.myUID;
  const ign = window.myIGN;
  const mail = mailCache.find(m => getMessageId(m) === messageId);
  const category = mail ? mail.category : 'Umum';
  
  const btn = document.querySelector('#mailContent .btn-svg');
  if (btn) {
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  }
  
  try {
    const url = `${GAS_MAIL_URL}?type=mail&uid=${encodeURIComponent(uid)}&ign=${encodeURIComponent(ign)}&category=${encodeURIComponent(category)}&msg=${encodeURIComponent(reply)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // 🎯 HANDLE RATE LIMIT
    if (data.status === 'rate_limited') {
      const waitMsg = data.retryAfter 
        ? `Tunggu sekitar ${Math.ceil(data.retryAfter / 60)} menit lagi.`
        : 'Tunggu beberapa saat.';
      showMailReplyMessage(`⚠️ ${waitMsg}`, 'error');
      if (btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
      return;
    }
    
    if (data.status === 'success') {
      showMailReplyMessage('✅ Balasan terkirim', 'success');
      
      window._mailFromInfo = false;
      
      mailStamp = '';
      await fetchMailFresh();
      
      setTimeout(() => {
        renderMailMenu();
      }, 800);
    } else {
      showMailReplyMessage('Gagal mengirim', 'error');
      if (btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }
  } catch(e) {
    console.error("Reply error:", e);
    showMailReplyMessage('Koneksi gagal', 'error');
    if (btn) {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
  }
}

function showMailReplyMessage(msg, type = 'error') {
  const el = document.getElementById('mailReplyMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('success', 'error');
  el.classList.add(type, 'show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// ==========================================
// HISTORY
// ==========================================
function openMailHistory() {
  mailCurrentView = 'history';
  setMailHeader('📋 BACA SESUAI URUTAN');
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  const sorted = [...mailCache].sort((a, b) => a.timestamp - b.timestamp);
  renderMailHistory(sorted);
}

function renderMailHistory(history) {
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  if (!history || history.length === 0) {
    container.innerHTML = '<div class="mail-history"><div class="mail-empty">📭 Belum ada percakapan</div></div>';
    return;
  }
  
  let html = '<div class="mail-history">';
  for (const msg of history) {
    html += buildMailCardHTML(msg);
  }
  html += '</div>';
  
  container.innerHTML = html;
}

// ==========================================
// COMPOSE
// ==========================================
function openMailCompose() {
  mailCurrentView = 'compose';
  setMailHeader('✏️ KIRIM SURAT BARU');
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="mail-compose">
      <div class="mail-compose-group">
        <label class="mail-label">KATEGORI</label>
        <div class="mail-kategori-btn" onclick="toggleMailKategori()">
          <span id="mailKategoriLabel">Umum / General</span>
        </div>
        <div class="mail-kategori-list" id="mailKategoriList">
          <div class="mail-kategori-item" onclick="pilihMailKategori('Umum')">Umum / General</div>
          <div class="mail-kategori-item" onclick="pilihMailKategori('Request Join')">Request Join</div>
          <div class="mail-kategori-item" onclick="pilihMailKategori('Saran')">Saran / Masukan</div>
        </div>
      </div>
      
      <div class="mail-compose-group">
        <label class="mail-label">PESAN</label>
        <textarea id="mailComposeInput" class="mail-textarea" placeholder="Tulis pesan Anda..." maxlength="1000"></textarea>
      </div>
      
      <div class="mail-compose-footer">
        <div class="btn-svg" onclick="submitMailCompose()">
          <div class="btn-ujung-kiri"></div>
          <div class="btn-tengah"><span class="btn-teks">KIRIM</span></div>
          <div class="btn-ujung-kanan"></div>
        </div>
      </div>
      
      <p class="mail-message" id="mailComposeMessage"></p>
    </div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  window._mailKategori = 'Umum';
  setTimeout(() => {
    const ta = document.getElementById('mailComposeInput');
    if (ta) ta.focus();
  }, 200);
}

// ==========================================
// KIRIM SURAT BARU
// ==========================================
async function submitMailCompose() {
  const input = document.getElementById('mailComposeInput');
  const pesan = input ? input.value.trim() : '';
  
  if (!pesan) {
    showMailComposeMessage('Pesan tidak boleh kosong', 'error');
    return;
  }
  
  const uid = window.myUID;
  const ign = window.myIGN;
  const category = window._mailKategori || 'Umum';
  
  const btn = document.querySelector('#mailContent .btn-svg');
  if (btn) {
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  }
  
  try {
    const url = `${GAS_MAIL_URL}?type=mail&uid=${encodeURIComponent(uid)}&ign=${encodeURIComponent(ign)}&category=${encodeURIComponent(category)}&msg=${encodeURIComponent(pesan)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // 🎯 HANDLE RATE LIMIT
    if (data.status === 'rate_limited') {
      const waitMsg = data.retryAfter 
        ? `Tunggu sekitar ${Math.ceil(data.retryAfter / 60)} menit lagi.`
        : 'Tunggu beberapa saat.';
      showMailComposeMessage(`⚠️ Terlalu banyak surat. ${waitMsg}`, 'error');
      if (btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
      return;
    }
    
    if (data.status === 'success') {
      showMailComposeMessage('✅ Surat terkirim', 'success');
      
      mailStamp = '';
      await fetchMailFresh();
      
      if (window._mailFromInfo) {
        window._mailFromInfo = false;
        setTimeout(() => {
          closeMailModal(true);
          setTimeout(() => {
            if (typeof openInfoModal === 'function') openInfoModal();
          }, 200);
        }, 800);
      } else {
        setTimeout(() => {
          renderMailMenu();
        }, 800);
      }
    } else {
      showMailComposeMessage('Gagal mengirim', 'error');
      if (btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }
  } catch(e) {
    console.error("Compose error:", e);
    showMailComposeMessage('Koneksi gagal', 'error');
    if (btn) {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
  }
}

function showMailComposeMessage(msg, type = 'error') {
  const el = document.getElementById('mailComposeMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('success', 'error');
  el.classList.add(type, 'show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// ==========================================
// KATEGORI
// ==========================================
function toggleMailKategori() {
  const list = document.getElementById('mailKategoriList');
  if (list) list.classList.toggle('open');
}

function pilihMailKategori(val) {
  window._mailKategori = val;
  const el = document.getElementById('mailKategoriLabel');
  if (el) {
    if (val === 'Umum') el.innerText = 'Umum / General';
    else if (val === 'Request Join') el.innerText = 'Request Join';
    else if (val === 'Saran') el.innerText = 'Saran / Masukan';
  }
  toggleMailKategori();
}

// ==========================================
// LOCAL STORAGE — Status Baca
// ==========================================
function isMailReadLocal(messageId) {
  const uid = window.myUID;
  if (!uid) return false;
  const key = `umbrella_mail_read_${uid}`;
  try {
    const readList = JSON.parse(localStorage.getItem(key) || '[]');
    return readList.includes(messageId);
  } catch(e) {
    return false;
  }
}

function markMailReadLocal(messageId) {
  const uid = window.myUID;
  if (!uid) return;
  const key = `umbrella_mail_read_${uid}`;
  try {
    const readList = JSON.parse(localStorage.getItem(key) || '[]');
    if (!readList.includes(messageId)) {
      readList.push(messageId);
      if (readList.length > 500) {
        readList.splice(0, readList.length - 500);
      }
      localStorage.setItem(key, JSON.stringify(readList));
      updateMailNotifIcon();
    }
  } catch(e) {}
}

// ==========================================
// BADGE dari CACHE
// ==========================================
function updateBadgeFromCache() {
  const unreadCount = mailCache.filter(m => 
    m.isFromAdmin && !isMailReadLocal(getMessageId(m))
  ).length;
  
  const badge = document.getElementById('badge-unread');
  if (badge) {
    if (unreadCount > 0) {
      badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  updateMailNotifIcon();
}

// ==========================================
// NOTIF ICON 📩
// ==========================================
function updateMailNotifIcon() {
  const hasUnread = mailCache.some(m => 
    m.isFromAdmin && !isMailReadLocal(getMessageId(m))
  );
  
  const icon = document.getElementById('mailNotifIcon');
  if (!icon) return;
  
  if (hasUnread) {
    icon.style.display = 'flex';
  } else {
    icon.style.display = 'none';
  }
}

function openMailFromNotif() {
  if (typeof openMailModal === 'function') {
    if (typeof closeModal === 'function') closeModal(true);
    
    setTimeout(() => {
      openMailModal();
    }, 200);
  }
}

// ==========================================
// ESCAPE HTML
// ==========================================
function escapeMail(str) {
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

// ==========================================
// EXPOSE
// ==========================================
window.openMailModal = openMailModal;
window.closeMailModal = closeMailModal;
window.mailGoBack = mailGoBack;
window.renderMailMenu = renderMailMenu;
window.openMailList = openMailList;
window.openMailDetail = openMailDetail;
window.openMailDetailById = openMailDetailById;
window.openMailReplyForm = openMailReplyForm;
window.submitMailReply = submitMailReply;
window.openMailHistory = openMailHistory;
window.openMailCompose = openMailCompose;
window.submitMailCompose = submitMailCompose;
window.toggleMailKategori = toggleMailKategori;
window.pilihMailKategori = pilihMailKategori;
window.updateBadgeFromCache = updateBadgeFromCache;
window.setMailHeader = setMailHeader;
window.handleMailTrigger = handleMailTrigger;
window.isMailReadLocal = isMailReadLocal;
window.markMailReadLocal = markMailReadLocal;
window.fetchMailFresh = fetchMailFresh;
window.isLastAdminReplyInCategory = isLastAdminReplyInCategory;
window.updateMailNotifIcon = updateMailNotifIcon;
window.openMailFromNotif = openMailFromNotif;
window.getMessageId = getMessageId;

console.log("✅ mail.js loaded (V2 — With Rate Limit Handling)");
