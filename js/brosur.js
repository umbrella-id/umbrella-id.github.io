
/**
 * brosur.js — Generate Brosur Open Member & Share
 */

const SHARE_TEXT = "Ayo gabung dengan guild Umbrella! Kunjungi web kami di https://umbrella-id.github.io";

// ===== AMBIL DATA =====
function getBrosurData() {
  if (typeof profilList === 'undefined' || typeof openmemberData === 'undefined') {
    console.warn('⚠️ Data profil/openmember belum siap');
    return { profilList: [], openmember: null };
  }
  const profil = Array.isArray(profilList) ? profilList : [];
  const openmember = openmemberData || null;
  console.log('📦 Brosur data:', profil.length, 'profil, openmember:', openmember ? 'ADA' : 'kosong');
  return { profilList: profil, openmember: openmember };
}

// ===== ESCAPE HTML =====
function brosurEscapeHtml(str) {
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

// ===== FORMAT TEKS (TANPA GAMBAR) =====
function brosurFormatText(text) {
  if (!text) return '';

  let cleaned = text;
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  cleaned = cleaned.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');

  if (/<[a-z][\s\S]*>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/javascript:/gi, '');
    return cleaned;
  }

  const lines = cleaned.split('\n');
  let inList = false;
  let html = '';

  for (let line of lines) {
    line = line.trim();
    if (line === '') continue;

    if (line.startsWith('-')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${brosurEscapeHtml(line.substring(1).trim())}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${brosurEscapeHtml(line)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

// ===== AMBIL BACKGROUND IMAGE (KONDISIONAL) =====
function getBrosurBgImage(openmember) {
  if (openmember && openmember.Body) {
    const imgMatch = openmember.Body.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      console.log('🖼️ Background dari openmember:', imgMatch[1]);
      return imgMatch[1];
    }
  }
  console.log('🖼️ Background fallback: Assets/Background.png');
  return 'Assets/Background.png';
}

// ===== BUAT ELEMEN BROSUR =====
function createBrosurElement() {
  const { profilList, openmember } = getBrosurData();

  const container = document.createElement('div');
  container.className = 'brosur-container';
  container.id = 'brosur-temp';

  const openHeader = openmember && openmember.Header ? openmember.Header : 'OPEN MEMBER';
  const openBody = openmember && openmember.Body ? openmember.Body : 'Ayo bergabung dengan Umbrella!';
  const bgImage = getBrosurBgImage(openmember);

  // ===== BUILD HTML =====
  let html = '';

  // Layer 1: Background image
  html += `<img src="${bgImage}" class="brosur-image" alt="">`;

  // Layer 2: Frame SVG
  html += `<img src="Assets/BROSUR-FRAME.svg" class="brosur-frame-svg" alt="">`;

  // Layer 3: Layout
  html += `<div class="brosur-layout">`;

  // --- HEADER ---
  html += `<div class="brosur-header">`;
  html += `<div class="brosur-logo-wrap">`;
  html += `<div class="brosur-logo-glow"></div>`;
  html += `<img src="Assets/logo.svg" class="brosur-logo" alt="Logo">`;
  html += `</div>`;
  html += `<h1 class="brosur-guild-name">UMBRELLA</h1>`;
  html += `<p class="brosur-open-header">${brosurEscapeHtml(openHeader)}</p>`;
  html += `</div>`;   // close header

  // --- BODY ---
  html += `<div class="brosur-body">`;
  html += `<div class="brosur-body-grid">`;

  if (profilList.length === 0) {
    for (let i = 0; i < 4; i++) {
      html += `<div class="brosur-item">`;
      html += `<h3>Profil ${i + 1}</h3>`;
      html += `<div class="brosur-item-body"><p>Belum ada profil.</p></div>`;
      html += `</div>`;
    }
  } else {
    const items = profilList.slice(0, 4);
    items.forEach(item => {
      html += `<div class="brosur-item">`;
      html += `<h3>${brosurEscapeHtml(item.Header || 'Profil')}</h3>`;
      html += `<div class="brosur-item-body">${brosurFormatText(item.Body)}</div>`;
      html += `</div>`;
    });
    const sisa = 4 - items.length;
    for (let i = 0; i < sisa; i++) {
      html += `<div class="brosur-item" style="opacity: 0.3;">`;
      html += `<h3>—</h3>`;
      html += `<div class="brosur-item-body"></div>`;
      html += `</div>`;
    }
  }

  html += `</div>`;   // close brosur-body-grid
  html += `</div>`;   // close brosur-body

  // --- FOOTER ---
  html += `<div class="brosur-footer">`;
  html += `<div class="brosur-footer-text">${brosurFormatText(openBody)}</div>`;
  html += `<div class="brosur-link">https://umbrella-id.github.io</div>`;
  html += `</div>`;   // close footer

  html += `</div>`;   // close layout

  container.innerHTML = html;
  return container;
}

// ===== ELEMEN → BLOB =====
async function brosurElementToBlob(element) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
      allowTaint: false
    });
    return new Promise((resolve) => {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  } catch (err) {
    console.error('❌ html2canvas error:', err);
    return null;
  }
}

// ===== TRIGGER SHARE =====
async function triggerShare() {
  const btn = document.querySelector('.headline-share-btn');
  const originalHTML = btn ? btn.innerHTML : '';

  if (btn) {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
  }

  try {
    const brosur = createBrosurElement();
    document.body.appendChild(brosur);

    await new Promise(r => setTimeout(r, 400));

    const blob = await brosurElementToBlob(brosur);
    brosur.remove();

    if (!blob) throw new Error("Gagal membuat gambar brosur");

    const imageFile = new File([blob], "umbrella-brosur.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({ title: "Umbrella Guild", text: SHARE_TEXT, files: [imageFile] });
    } else if (navigator.share) {
      await navigator.share({ title: "Umbrella Guild", text: SHARE_TEXT });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'umbrella-brosur.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('❌ Share error:', err);
    if (err.name !== 'AbortError') {
      alert('Gagal share: ' + (err.message || 'Terjadi kesalahan'));
    }
  } finally {
    if (btn) {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
    const leftover = document.getElementById('brosur-temp');
    if (leftover) leftover.remove();
  }
}

window.triggerShare = triggerShare;
console.log('✅ brosur.js loaded');
