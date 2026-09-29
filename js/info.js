/**
 * info.js — Modal Info Serikat (dengan preload cache)
 */

let infoOpen = false;
let profilList = [];
let currentView = 'list';
let currentDetailIndex = -1;

// ===== PRELOAD (dipanggil dari stage.js / init) =====
async function preloadInfoData() {
  if (profilList.length > 0) {
    console.log('✅ Info data sudah di-cache');
    return;   // udah ada
  }

  try {
    console.log('📥 Preload info data...');
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    profilList = rawData.filter(item => (item.ID || '').toLowerCase() === 'profil');
    console.log('✅ Info data preloaded:', profilList.length, 'profil');
  } catch (err) {
    console.error('❌ Preload info gagal:', err);
  }
}

// ===== BUKA MODAL =====
function openInfoModal() {
  const overlay = document.getElementById('infoOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  infoOpen = true;
  currentView = 'list';
  currentDetailIndex = -1;

  overlay.classList.add('open');
  if (stage) stage.classList.add('info-open');

  if (typeof updateButtons === 'function') updateButtons();

  // Kalau data udah ada → langsung render
  if (profilList.length > 0) {
    renderInfoList();
  } else {
    // Belum ada → tampil loading + fetch
    const contentCol = document.getElementById('infoContentCol');
    if (contentCol) contentCol.innerHTML = '<div class="info-loading">Memuat data...</div>';
    fetchInfoData();
  }
}

// ===== TUTUP MODAL =====
function closeInfoModal(skipMenu = false) {
  const overlay = document.getElementById('infoOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  infoOpen = false;
  currentView = 'list';
  currentDetailIndex = -1;

  overlay.classList.remove('open');
  if (stage) stage.classList.remove('info-open');

  if (typeof updateButtons === 'function') updateButtons();

  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openModal === 'function') openModal();
    }, 100);
  }
}

// ===== FETCH (fallback kalau preload gagal) =====
async function fetchInfoData() {
  const contentCol = document.getElementById('infoContentCol');
  if (!contentCol) return;

  contentCol.innerHTML = '<div class="info-loading">Memuat data...</div>';

  try {
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) {
      contentCol.innerHTML = '<div class="info-empty">Data tidak tersedia</div>';
      return;
    }

    profilList = rawData.filter(item => (item.ID || '').toLowerCase() === 'profil');

    if (profilList.length === 0) {
      contentCol.innerHTML = '<div class="info-empty">Belum ada profil</div>';
      return;
    }

    renderInfoList();
  } catch (err) {
    console.error('❌ Gagal fetch info:', err);
    contentCol.innerHTML = '<div class="info-empty">Gagal memuat data</div>';
  }
}

// ===== RENDER LIST =====
function renderInfoList() {
  const contentCol = document.getElementById('infoContentCol');
  if (!contentCol) return;

  currentView = 'list';
  currentDetailIndex = -1;

  let html = '<div class="info-list">';
  profilList.forEach((item, idx) => {
    const judul = item.Header || 'Tanpa Judul';
    html += `
      <div class="info-list-item" onclick="showInfoDetail(${idx})">
        <div class="btn-ujung-kiri"></div>
        <div class="btn-tengah"><span class="btn-teks">${escapeHtml(judul)}</span></div>
        <div class="btn-ujung-kanan"></div>
      </div>
    `;
  });
  html += '</div>';

  contentCol.innerHTML = html;

  if (typeof updateButtons === 'function') updateButtons();
}

// ===== TAMPILKAN DETAIL =====
function showInfoDetail(idx) {
  const contentCol = document.getElementById('infoContentCol');
  if (!contentCol) return;

  const item = profilList[idx];
  if (!item) return;

  currentView = 'detail';
  currentDetailIndex = idx;

  const judul = item.Header || 'Tanpa Judul';
  const isi = item.Body || '';

  const isiFormatted = formatIsiCard(isi);

  contentCol.innerHTML = `
    <div class="info-detail">
      <h3>${escapeHtml(judul)}</h3>
      ${isiFormatted}
    </div>
  `;

  contentCol.scrollTop = 0;

  if (typeof updateButtons === 'function') updateButtons();
}

// ===== FORMAT ISI =====
function formatIsiCard(text) {
  if (!text) return '';

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return sanitizeHtml(text);
  }

  return escapeHtml(text).replace(/\n/g, '<br>');
}

// ===== SANITIZE =====
function sanitizeHtml(html) {
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  return cleaned;
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

// ===== HANDLE TOMBOL BACK =====
function infoGoBack() {
  if (currentView === 'detail') {
    renderInfoList();
    return true;
  }
  return false;
}

// ===== ESC =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (infoOpen) {
      if (currentView === 'detail') {
        renderInfoList();
      } else {
        closeInfoModal();
      }
    }
  }
});

// ===== EXPOSE =====
window.openInfoModal = openInfoModal;
window.closeInfoModal = closeInfoModal;
window.showInfoDetail = showInfoDetail;
window.infoGoBack = infoGoBack;
window.preloadInfoData = preloadInfoData;

console.log('✅ info.js loaded');
