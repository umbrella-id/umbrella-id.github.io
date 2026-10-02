/**
 * headline.js — Banner (2 item) & Popup Headline
 */

let headlineData = null;
let openmemberData = null;
let headlineDisplayed = false;

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
  if (headlineDisplayed) return;

  const stage = document.getElementById('stage');
  const container = document.getElementById('headlineBannerContainer');
  if (!container) return;

  if (stage && (
    stage.classList.contains('gate-first') ||
    stage.classList.contains('gate-edit-mode') ||
    stage.classList.contains('mail-open') ||
    stage.classList.contains('info-open')
  )) {
    console.log('⏸️ Headline ditunda — modal buka');
    return;
  }

  const punyaHeadline = headlineData && headlineData.Header && headlineData.Header.trim() !== '';
  const punyaOpenmember = openmemberData && openmemberData.Header && openmemberData.Header.trim() !== '';

  if (!punyaHeadline && !punyaOpenmember) {
    console.log('ℹ️ Nggak ada headline/openmember');
    return;
  }

  headlineDisplayed = true;

  renderBannerContainer();
  container.classList.add('show');

  const sudahLihat = sessionStorage.getItem(HEADLINE_SEEN_KEY);
  if (!sudahLihat) {
    setTimeout(() => {
      openHeadlinePopup();
      sessionStorage.setItem(HEADLINE_SEEN_KEY, '1');
    }, 600);
  }
}

// ===== RENDER BANNER CONTAINER =====
function renderBannerContainer() {
  const container = document.getElementById('headlineBannerContainer');
  if (!container) return;

  let html = '';

  if (headlineData && headlineData.Header && headlineData.Header.trim() !== '') {
    html += buildBannerItem(headlineData, 'headline');
  }

  if (openmemberData && openmemberData.Header && openmemberData.Header.trim() !== '') {
    html += buildBannerItem(openmemberData, 'openmember');
  }

  container.innerHTML = html;
}

// ===== BUILD BANNER ITEM =====
function buildBannerItem(data, type) {
  const body = data.Body || '';
  const judul = data.Header || '';

  const imgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);

  let inner = '';

  if (imgMatch && imgMatch[1]) {
    // Ada gambar
    inner = `<img class="banner-img" src="${imgMatch[1]}" alt="Banner">`;
  } else {
    // Nggak ada gambar → judul + body singkat
    let textHtml = '';
    if (judul) {
      textHtml += `<div class="banner-title">${escapeHtml(judul)}</div>`;
    }
    const textSingkat = getTextSingkat(body, '', 60);
    if (textSingkat) {
      textHtml += `<div class="banner-text">${escapeHtml(textSingkat)}</div>`;
    }
    inner = textHtml;
  }

  return `
    <div class="headline-banner" onclick="openHeadlinePopup('${type}')">
      ${inner}
    </div>
  `;
}

// ===== AMBIL TEKS SINGKAT =====
function getTextSingkat(body, fallbackJudul, maxChars = 60) {
  if (!body) return fallbackJudul;

  let text = body.replace(/<[^>]*>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= maxChars) return text;

  let truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxChars * 0.6) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + '...';
}

// ===== BUKA POPUP =====
function openHeadlinePopup(type) {
  let data = null;

  if (type === 'openmember') {
    data = openmemberData;
  } else if (type === 'headline') {
    data = headlineData;
  } else {
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

  // 🎯 Tambah tombol share KALAU type = 'openmember'
  if (isOpenmember) {
    body.innerHTML += `
      <div style="text-align: center; margin-top: 20px;">
        <div class="btn-svg headline-share-btn" onclick="triggerShare()">
          <div class="btn-ujung-kiri"></div>
          <div class="btn-tengah"><span class="btn-teks">BAGIKAN BROSUR</span></div>
          <div class="btn-ujung-kanan"></div>
        </div>
      </div>
    `;
  }

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

