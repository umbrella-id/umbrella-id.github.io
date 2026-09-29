/**
 * info.js — Modal Info Serikat
 */

let infoOpen = false;
let profilList = [];
let currentView = 'list';   // 'list' atau 'detail'
let currentDetailIndex = -1;

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

  // Fetch data dari GAS
  fetchInfoData();
}

// ===== TUTUP MODAL =====
// skipMenu = true  → langsung balik home
// skipMenu = false → balik ke menu
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

// ===== FETCH DATA =====
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

    // Filter ID 'profil'
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

  // Format isi: newline → <br>, deteksi HTML
  const isiFormatted = formatIsiCard(isi);

  contentCol.innerHTML = `
    <div class="info-detail">
      <h3 style="color:#f0d78c; font-size:14px; margin-bottom:10px; letter-spacing:1.5px;">${escapeHtml(judul)}</h3>
      ${isiFormatted}
    </div>
  `;

  // Reset scroll
  contentCol.scrollTop = 0;

  if (typeof updateButtons === 'function') updateButtons();
}

// ===== FORMAT ISI CARD =====
function formatIsiCard(text) {
  if (!text) return '';

  // Kalau ada tag HTML, biarkan (sanitize dulu)
  if (/<[a-z][\s\S]*>/i.test(text)) {
    // Ada HTML — sanitize tag berbahaya
    return sanitizeHtml(text);
  }

  // Plain text → newline jadi <br>
  return escapeHtml(text).replace(/\n/g, '<br>');
}

// ===== SANITIZE HTML =====
function sanitizeHtml(html) {
  // Hapus tag script, iframe, dll
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');   // hapus event handler
  cleaned = cleaned.replace(/javascript:/gi, '');
  return cleaned;
}

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

// ===== HANDLE TOMBOL BACK =====
// Dipanggil dari menu.js saat tombol kiri diklik
function infoGoBack() {
  if (currentView === 'detail') {
    // Balik ke list
    renderInfoList();
    return true;   // handled
  }
  return false;    // nggak handled → biarin menu.js handle
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

console.log('✅ info.js loaded');
