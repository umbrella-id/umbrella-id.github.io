/**
 * headline.js — Banner & Popup Headline
 */

let headlineData = null;
let headlineBannerClosed = false;

const HEADLINE_SEEN_KEY = 'umbrella_headline_seen';

// ===== PRELOAD (dipanggil dari stage.js) =====
async function preloadHeadlineData() {
  if (headlineData) {
    console.log('✅ Headline sudah di-cache');
    return;
  }

  try {
    console.log('📥 Preload headline...');
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    headlineData = rawData.find(item => (item.ID || '').toLowerCase() === 'headline') || null;

    if (headlineData) {
      console.log('✅ Headline preloaded:', headlineData.Header || '(tanpa judul)');
      // Setelah preload, tampilkan banner & popup
      initHeadlineDisplay();
    } else {
      console.log('ℹ️ Nggak ada headline');
    }
  } catch (err) {
    console.error('❌ Preload headline gagal:', err);
  }
}

// ===== INISIALISASI BANNER & POPUP =====
function initHeadlineDisplay() {
  if (!headlineData) return;

  const stage = document.getElementById('stage');
  const banner = document.getElementById('headlineBanner');
  if (!banner) return;

  // Kalau gate/mail/info buka → jangan tampil dulu
  if (stage && (
    stage.classList.contains('gate-first') ||
    stage.classList.contains('gate-edit-mode') ||
    stage.classList.contains('mail-open') ||
    stage.classList.contains('info-open')
  )) {
    console.log('⏸️ Headline ditunda — gate/mail/info buka');
    return;
  }

  // Set isi banner
  renderBannerContent();

  // Tampilkan banner
  banner.classList.add('show');

  // Popup otomatis (1× per sesi)
  const sudahLihat = sessionStorage.getItem(HEADLINE_SEEN_KEY);
  if (!sudahLihat) {
    // Delay dikit biar banner muncul dulu
    setTimeout(() => {
      openHeadlinePopup();
      sessionStorage.setItem(HEADLINE_SEEN_KEY, '1');
    }, 600);
  }
}

// ===== RENDER ISI BANNER =====
function renderBannerContent() {
  const banner = document.getElementById('headlineBanner');
  if (!banner || !headlineData) return;

  const body = headlineData.Body || '';
  const judul = headlineData.Header || 'Pengumuman';

  // Deteksi gambar di body
  const imgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);

  let html = '<div class="banner-label">PENGUMUMAN</div>';

  if (imgMatch && imgMatch[1]) {
    // Ada gambar → tampilkan gambar
    html += `<img class="banner-img" src="${imgMatch[1]}" alt="Headline">`;
  } else {
    // Nggak ada gambar → tampilkan judul
    html += `<div class="banner-text">${escapeHtml(judul)}</div>`;
  }

  banner.innerHTML = html;
}

// ===== BUKA POPUP =====
function openHeadlinePopup() {
  if (!headlineData) return;

  const overlay = document.getElementById('headlineOverlay');
  const header = document.getElementById('headlineHeader');
  const body = document.getElementById('headlineBody');
  if (!overlay || !header || !body) return;

  header.innerText = headlineData.Header || 'Pengumuman';
  body.innerHTML = formatHeadlineBody(headlineData.Body || '');

  overlay.classList.add('open');
  body.scrollTop = 0;
}

// ===== TUTUP POPUP =====
function closeHeadlinePopup() {
  const overlay = document.getElementById('headlineOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
}

// ===== TUTUP BANNER =====
function closeHeadlineBanner() {
  const banner = document.getElementById('headlineBanner');
  if (banner) banner.classList.remove('show');
  headlineBannerClosed = true;
}

// ===== FORMAT BODY =====
function formatHeadlineBody(text) {
  if (!text) return '';

  // Kalau ada HTML, sanitize
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return sanitizeHtml(text);
  }

  // Plain text
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
window.closeHeadlineBanner = closeHeadlineBanner;
window.initHeadlineDisplay = initHeadlineDisplay;

console.log('✅ headline.js loaded');
