/**
 * headline.js — Banner (2 item) & Popup Headline
 */

let headlineData = null;      // headline
let openmemberData = null;    // openmember

const HEADLINE_SEEN_KEY = 'umbrella_headline_seen';

// ===== PRELOAD =====
async function preloadHeadlineData() {
  if (headlineData || openmemberData) {
    console.log('✅ Headline/Openmember sudah di-cache');
    return;
  }

  try {
    console.log('📥 Preload headline & openmember...');
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    headlineData = rawData.find(item => (item.ID || '').toLowerCase() === 'headline') || null;
    openmemberData = rawData.find(item => (item.ID || '').toLowerCase() === 'openmember') || null;

    console.log('✅ Headline:', headlineData ? 'ADA' : 'kosong');
    console.log('✅ Openmember:', openmemberData ? 'ADA' : 'kosong');

    initHeadlineDisplay();
  } catch (err) {
    console.error('❌ Preload headline gagal:', err);
  }
}

// ===== INIT =====
function initHeadlineDisplay() {
  const stage = document.getElementById('stage');
  const container = document.getElementById('headlineBannerContainer');
  if (!container) return;

  // Kalau gate/mail/info buka → tunda
  if (stage && (
    stage.classList.contains('gate-first') ||
    stage.classList.contains('gate-edit-mode') ||
    stage.classList.contains('mail-open') ||
    stage.classList.contains('info-open')
  )) {
    console.log('⏸️ Headline ditunda — modal buka');
    return;
  }

  // Cek: minimal ada 1 data
  const punyaHeadline = headlineData && headlineData.Header && headlineData.Header.trim() !== '';
  const punyaOpenmember = openmemberData && openmemberData.Header && openmemberData.Header.trim() !== '';

  if (!punyaHeadline && !punyaOpenmember) {
    console.log('ℹ️ Nggak ada headline/openmember — banner & popup nggak ditampilkan');
    return;
  }

  // Render banner (2 item kalau ada dua-duanya)
  renderBannerContainer();

  // Tampilkan container
  container.classList.add('show');

  // Popup otomatis (1× per sesi)
  const sudahLihat = sessionStorage.getItem(HEADLINE_SEEN_KEY);
  if (!sudahLihat) {
    setTimeout(() => {
      openHeadlinePopup();   // prioritas: headline → openmember
      sessionStorage.setItem(HEADLINE_SEEN_KEY, '1');
    }, 600);
  }
}

// ===== RENDER BANNER CONTAINER =====
function renderBannerContainer() {
  const container = document.getElementById('headlineBannerContainer');
  if (!container) return;

  let html = '';

  // Banner 1: Headline (kalau ada)
  if (headlineData && headlineData.Header && headlineData.Header.trim() !== '') {
    html += buildBannerItem(headlineData, 'headline');
  }

  // Banner 2: Openmember (kalau ada)
  if (openmemberData && openmemberData.Header && openmemberData.Header.trim() !== '') {
    html += buildBannerItem(openmemberData, 'openmember');
  }

  container.innerHTML = html;
}

// ===== BUILD BANNER ITEM =====
function buildBannerItem(data, type) {
  const body = data.Body || '';
  const judul = data.Header || '';

  // Deteksi gambar di body
  const imgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);

  let inner = '';

  if (imgMatch && imgMatch[1]) {
    // Ada gambar → tampilkan gambar
    inner = `<img class="banner-img" src="${imgMatch[1]}" alt="Banner">`;
  } else {
    // Nggak ada gambar → tampilkan judul
    inner = `<div class="banner-text">${escapeHtml(judul)}</div>`;
  }

  return `
    <div class="headline-banner" onclick="openHeadlinePopup('${type}')">
      ${inner}
    </div>
  `;
}

// ===== BUKA POPUP =====
// type: 'headline' (default) atau 'openmember'
// Kalau nggak ada argumen → auto: headline dulu, openmember kalau headline kosong
function openHeadlinePopup(type) {
  let data = null;

  if (type === 'openmember') {
    data = openmemberData;
  } else if (type === 'headline') {
    data = headlineData;
  } else {
    // Auto: prioritas headline → openmember
    const punyaHeadline = headlineData && headlineData.Header && headlineData.Header.trim() !== '';
    const punyaOpenmember = openmemberData && openmemberData.Header && openmemberData.Header.trim() !== '';

    if (punyaHeadline) {
      data = headlineData;
    } else if (punyaOpenmember) {
      data = openmemberData;
    }
  }

  if (!data) {
    console.log('ℹ️ Data popup kosong');
    return;
  }

  const overlay = document.getElementById('headlineOverlay');
  const header = document.getElementById('headlineHeader');
  const body = document.getElementById('headlineBody');
  if (!overlay || !header || !body) return;

  header.innerText = data.Header || '';
  body.innerHTML = formatHeadlineBody(data.Body || '');

  overlay.classList.add('open');
  body.scrollTop = 0;
}

// ===== TUTUP POPUP =====
function closeHeadlinePopup() {
  const overlay = document.getElementById('headlineOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
}

// ===== FORMAT BODY =====
function formatHeadlineBody(text) {
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

// ===== ESC =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('headlineOverlay');
    if (overlay && overlay.classList.contains('open')) {
      closeHeadlinePopup();
    }
  }
});

// ===== EXPOSE =====
window.preloadHeadlineData = preloadHeadlineData;
window.openHeadlinePopup = openHeadlinePopup;
window.closeHeadlinePopup = closeHeadlinePopup;
window.initHeadlineDisplay = initHeadlineDisplay;

console.log('✅ headline.js loaded');
