/**
 * mail.js — Mail 2 Arah (User Side)
 * Konsep: Header Dinamis + Grid Menu Horizontal + Tombol SVG
 */

let mailCurrentView = 'menu';
let mailCurrentList = [];
let mailCurrentDetail = null;
let mailCurrentFilter = 'all';

const GAS_MAIL_URL = 'https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec';

// ==========================================
// SET HEADER MODAL (dinamis)
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
  updateMailBadge();
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
  console.log('📬 Mail back from view:', mailCurrentView);
  
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
      if (mailCurrentDetail) openMailDetail(mailCurrentDetail.rowId);
      else renderMailMenu();
      break;
    case 'history':
    case 'compose':
      renderMailMenu();
      break;
    default:
      closeMailModal();
  }
}

// ==========================================
// RENDER MENU (Grid 2x2 Horizontal + Tombol SVG)
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
  
  updateMailBadge();
}

// ==========================================
// BUKA LIST
// ==========================================
async function openMailList(filter) {
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
    <div id="mailListContainer" class="mail-list">
      <div class="mail-loading">Memuat...</div>
    </div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  try {
    const uid = window.myUID;
    const url = `${GAS_MAIL_URL}?type=mail-list&uid=${encodeURIComponent(uid)}&filter=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'success' && data.mails) {
      mailCurrentList = data.mails;
      renderMailList(data.mails, filter);
    } else {
      document.getElementById('mailListContainer').innerHTML = 
        '<div class="mail-empty">Gagal memuat</div>';
    }
  } catch(e) {
    console.error("Mail list error:", e);
    document.getElementById('mailListContainer').innerHTML = 
      '<div class="mail-empty">Koneksi gagal</div>';
  }
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
    const ts = new Date(mail.timestamp);
    const tgl = ts.toLocaleDateString('id-ID');
    const jam = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const preview = escapeMail(mail.message).substring(0, 60) + (mail.message.length > 60 ? '...' : '');
    const fromAdmin = mail.isFromAdmin;
    const icon = fromAdmin ? '📤' : '📩';
    const statusLabel = mail.status === 'UNREAD' ? '🔴 BARU' : (mail.status === 'READ' ? '📖 DIBACA' : '✅ DONE');
    
    html += `
      <div class="mail-card" onclick="openMailDetail(${mail.rowId})">
        <div class="mail-card-header">
          <span class="mail-card-sender">${icon} ${escapeMail(mail.ign)}</span>
          <span class="mail-card-status">${statusLabel}</span>
        </div>
        <div class="mail-card-category">${escapeMail(mail.category || 'Umum')}</div>
        <div class="mail-card-preview">${preview}</div>
        <div class="mail-card-time">${tgl} ${jam}</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// ==========================================
// BUKA DETAIL PESAN
// ==========================================
async function openMailDetail(rowId) {
  mailCurrentView = 'detail';
  setMailHeader('📄 PESAN');
  
  const mail = mailCurrentList.find(m => m.rowId === rowId);
  if (!mail) return;
  
  mailCurrentDetail = mail;
  
  if (mail.isFromAdmin && mail.status === 'UNREAD') {
    try {
      await fetch(`${GAS_MAIL_URL}?type=mail-read&rowId=${rowId}`);
      mail.status = 'READ';
    } catch(e) {}
  }
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  const ts = new Date(mail.timestamp);
  const tgl = ts.toLocaleDateString('id-ID');
  const jam = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const fromAdmin = mail.isFromAdmin;
  const senderRole = fromAdmin ? 'ADMIN' : 'KAMU';
  const icon = fromAdmin ? '📤' : '📩';
  
  container.innerHTML = `
    <div class="mail-detail">
      <div class="mail-detail-header">
        <span class="mail-detail-sender">${icon} ${escapeMail(mail.ign)} <small>[${senderRole}]</small></span>
        <span class="mail-detail-category">${escapeMail(mail.category || 'Umum')}</span>
      </div>
      
      <div class="mail-detail-time">${tgl} ${jam}</div>
      
      <div class="mail-detail-body">${escapeMail(mail.message)}</div>
      
      ${fromAdmin ? `
        <div class="mail-detail-actions">
          <div class="btn-svg" onclick="openMailReplyForm(${mail.rowId})">
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
function openMailReplyForm(rowId) {
  mailCurrentView = 'reply';
  setMailHeader('✏️ BALAS');
  
  const mail = mailCurrentList.find(m => m.rowId === rowId);
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
        <div class="btn-svg" onclick="submitMailReply(${rowId})">
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
async function submitMailReply(rowId) {
  const input = document.getElementById('mailReplyInput');
  const reply = input ? input.value.trim() : '';
  
  if (!reply) {
    showMailReplyMessage('Balasan tidak boleh kosong', 'error');
    return;
  }
  
  const uid = window.myUID;
  const ign = window.myIGN;
  const mail = mailCurrentList.find(m => m.rowId === rowId);
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
    
    if (data.status === 'success') {
      showMailReplyMessage('✅ Balasan terkirim', 'success');
      setTimeout(() => {
        openMailList('sent');
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
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ==========================================
// HISTORY
// ==========================================
async function openMailHistory() {
  mailCurrentView = 'history';
  setMailHeader('📋 BACA SESUAI URUTAN');
  
  const container = document.getElementById('mailContent');
  if (!container) return;
  
  container.innerHTML = `
    <div id="mailHistoryContainer" class="mail-history">
      <div class="mail-loading">Memuat...</div>
    </div>
  `;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  try {
    const uid = window.myUID;
    const url = `${GAS_MAIL_URL}?type=mail-history&uid=${encodeURIComponent(uid)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'success' && data.history) {
      renderMailHistory(data.history);
    } else {
      document.getElementById('mailHistoryContainer').innerHTML = 
        '<div class="mail-empty">Gagal memuat</div>';
    }
  } catch(e) {
    console.error("History error:", e);
    document.getElementById('mailHistoryContainer').innerHTML = 
      '<div class="mail-empty">Koneksi gagal</div>';
  }
}

function renderMailHistory(history) {
  const container = document.getElementById('mailHistoryContainer');
  if (!container) return;
  
  if (!history || history.length === 0) {
    container.innerHTML = '<div class="mail-empty">📭 Belum ada percakapan</div>';
    return;
  }
  
  let html = '';
  for (const msg of history) {
    const ts = new Date(msg.timestamp);
    const tgl = ts.toLocaleDateString('id-ID');
    const jam = ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const fromAdmin = msg.isFromAdmin;
    const icon = fromAdmin ? '📤' : '📩';
    const role = fromAdmin ? 'Admin' : 'Kamu';
    
    html += `
      <div class="mail-history-card ${fromAdmin ? 'from-admin' : 'from-user'}">
        <div class="mail-history-header">
          <span>${icon} ${escapeMail(msg.ign)}</span>
          <span class="mail-history-role">[${role}]</span>
        </div>
        <div class="mail-history-time">${tgl} ${jam}</div>
        <div class="mail-history-body">${escapeMail(msg.message)}</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// ==========================================
// COMPOSE (Kirim Surat Baru)
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
    
    if (data.status === 'success') {
      showMailComposeMessage('✅ Surat terkirim', 'success');
      setTimeout(() => {
        openMailList('sent');
      }, 800);
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
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ==========================================
// KATEGORI DROPDOWN
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
// BADGE UNREAD
// ==========================================
async function updateMailBadge() {
  const uid = window.myUID;
  if (!uid) return;
  
  try {
    const url = `${GAS_MAIL_URL}?type=mail-unread-count&uid=${encodeURIComponent(uid)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'success') {
      const badge = document.getElementById('badge-unread');
      if (badge) {
        if (data.unread > 0) {
          badge.innerText = data.unread > 99 ? '99+' : data.unread;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch(e) {}
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
window.openMailReplyForm = openMailReplyForm;
window.submitMailReply = submitMailReply;
window.openMailHistory = openMailHistory;
window.openMailCompose = openMailCompose;
window.submitMailCompose = submitMailCompose;
window.toggleMailKategori = toggleMailKategori;
window.pilihMailKategori = pilihMailKategori;
window.updateMailBadge = updateMailBadge;
window.setMailHeader = setMailHeader;

console.log("✅ mail.js loaded (Mail 2 Arah V6 — Grid Horizontal + SVG Button)");
