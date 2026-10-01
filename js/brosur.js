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

// ===== FORMAT TEKS =====
function brosurFormatText(text) {
  if (!text) return '';

  // Kalau ada HTML → sanitize + return
  if (/<[a-z][\s\S]*>/i.test(text)) {
    let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/javascript:/gi, '');
    return cleaned;
  }

  // Plain text → convert newline + bullet
  const lines = text.split('\n');
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

  // ===== HEADER =====
  const headerHtml = `<div class="brosur-header"><h1>UMBRELLA</h1></div>`;

  // ===== BINGKAI UTAMA =====
  let frameHtml = '<div class="brosur-frame">';

  // --- Kiri: Brand ---
  frameHtml += `
    <div class="brosur-brand">
      <img src="Assets/logo.svg" class="brosur-logo" alt="Logo Umbrella">
      <div class="brand-name">UMBRELLA</div>
      <div class="brand-main">Tempat Kita Berteduh dan Bertumbuh</div>
      <div class="brand-sub">dari pertemuan jadi kebersamaan<br>dari serikat jadi keluarga</div>
    </div>
  `;

  // --- Kanan: Profil ---
  frameHtml += '<div class="brosur-content">';

  if (profilList.length === 0) {
    frameHtml += `
      <div class="brosur-item">
        <h2>Profil</h2>
        <div class="brosur-item-body"><p>Belum ada profil.</p></div>
      </div>
    `;
  } else {
    profilList.forEach(item => {
      frameHtml += `
        <div class="brosur-item">
          <h2>${brosurEscapeHtml(item.Header || 'Profil')}</h2>
          <div class="brosur-item-body">
            ${brosurFormatText(item.Body)}
          </div>
        </div>
      `;
    });
  }

  frameHtml += '</div>';   // close brosur-content

  frameHtml += '</div>';   // close brosur-frame

  // ===== FOOTER =====
  let footerHtml = '';
  if (openmember && openmember.Body) {
    const cleanBody = openmember.Body.replace(/<br\s*\/?>|\r?\n/g, ' ');
    footerHtml = `
      <div class="brosur-footer">
        <div class="brosur-footer-text">${brosurFormatText(cleanBody)}</div>
        <div class="brosur-link">https://umbrella-id.github.io</div>
      </div>
    `;
  } else {
    footerHtml = `
      <div class="brosur-footer">
        <div class="brosur-footer-text">Ayo bergabung dengan Umbrella!</div>
        <div class="brosur-link">https://umbrella-id.github.io</div>
      </div>
    `;
  }

  container.innerHTML = headerHtml + frameHtml + footerHtml;
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
    // 1. Buat elemen brosur
    const brosur = createBrosurElement();
    document.body.appendChild(brosur);

    // 2. Tunggu render
    await new Promise(r => setTimeout(r, 200));

    // 3. Convert ke blob
    const blob = await brosurElementToBlob(brosur);
    brosur.remove();

    if (!blob) throw new Error("Gagal membuat gambar brosur");

    // 4. Cek navigator.share
    const imageFile = new File([blob], "umbrella-brosur.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      // Support share dengan file
      await navigator.share({
        title: "Umbrella Guild",
        text: SHARE_TEXT,
        files: [imageFile]
      });
      console.log('✅ Share berhasil');
    } else if (navigator.share) {
      // Share tanpa file
      await navigator.share({
        title: "Umbrella Guild",
        text: SHARE_TEXT
      });
      console.log('✅ Share berhasil (tanpa file)');
    } else {
      // Fallback: download
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
    // Cleanup
    const leftover = document.getElementById('brosur-temp');
    if (leftover) leftover.remove();
  }
}

// ===== EXPOSE =====
window.triggerShare = triggerShare;
console.log('✅ brosur.js loaded');
