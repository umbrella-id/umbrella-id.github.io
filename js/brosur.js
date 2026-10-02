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

// ===== BUAT ELEMEN BROSUR =====
function createBrosurElement() {
  const { profilList, openmember } = getBrosurData();

  const container = document.createElement('div');
  container.className = 'brosur-container';
  container.id = 'brosur-temp';

  // Data header & footer dari openmember
  const openHeader = openmember && openmember.Header ? openmember.Header : 'OPEN MEMBER';
  const openBody = openmember && openmember.Body ? openmember.Body : 'Ayo bergabung dengan Umbrella!';

  // ===== HTML =====
  let html = '';

  // Layer 1: Image (top 25%)
  html += `<img src="Assets/brosur-bg.jpg" class="brosur-image" alt="">`;

  // Layer 2: Frame SVG (overlay)
  html += `<img src="Assets/BROSUR-FRAME.svg" class="brosur-frame-svg" alt="">`;

  // Layer 3: Konten
  html += `<div class="brosur-layout">`;

  // --- HEADER (35%) ---
  html += `
    <div class="brosur-header">
      <img src="Assets/logo.svg" class="brosur-logo" alt="Logo">
      <h1 class="brosur-guild-name">UMBRELLA</h1>
      <p class="brosur-open-header">${brosurEscapeHtml(openHeader)}</p>
    </div>
  `;

  // --- BODY (50%) — Grid 2×2 ---
  html += `<div class="brosur-body">`;

  if (profilList.length === 0) {
    for (let i = 0; i < 4; i++) {
      html += `
        <div class="brosur-item">
          <h3>Profil ${i + 1}</h3>
          <div class="brosur-item-body"><p>Belum ada profil.</p></div>
        </div>
      `;
    }
  } else {
    const items = profilList.slice(0, 4);
    items.forEach(item => {
      html += `
        <div class="brosur-item">
          <h3>${brosurEscapeHtml(item.Header || 'Profil')}</h3>
          <div class="brosur-item-body">${brosurFormatText(item.Body)}</div>
        </div>
      `;
    });
    // Placeholder kalau kurang dari 4
    const sisa = 4 - items.length;
    for (let i = 0; i < sisa; i++) {
      html += `
        <div class="brosur-item" style="opacity: 0.3;">
          <h3>—</h3>
          <div class="brosur-item-body"></div>
        </div>
      `;
    }
  }

  html += `</div>`;   // close body

  // --- FOOTER (15%) ---
  html += `
    <div class="brosur-footer">
      <div class="brosur-footer-text">${brosurFormatText(openBody)}</div>
      <div class="brosur-link">https://umbrella-id.github.io</div>
    </div>
  `;

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
    btn.innerHTML = '⏳ MEMBUAT...';
    btn.disabled = true;
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
      await navigator.share({
        title: "Umbrella Guild",
        text: SHARE_TEXT,
        files: [imageFile]
      });
      console.log('✅ Share berhasil');
    } else if (navigator.share) {
      await navigator.share({
        title: "Umbrella Guild",
        text: SHARE_TEXT
      });
      console.log('✅ Share berhasil (tanpa file)');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'umbrella-brosur.png';
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ Brosur didownload');
    }
  } catch (err) {
    console.error('❌ Share error:', err);
    if (err.name !== 'AbortError') {
      alert('Gagal share: ' + (err.message || 'Terjadi kesalahan'));
    }
  } finally {
    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
    const leftover = document.getElementById('brosur-temp');
    if (leftover) leftover.remove();
  }
}

window.triggerShare = triggerShare;
console.log('✅ brosur.js loaded');
