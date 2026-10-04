/**
 * gallery.js — Modal Gallery (Album Foto)
 * 
 * Format Body dari GAS (sama dengan dashboard):
 *   <img src="URL" style="..."><p>Caption</p>
 * 
 * Client langsung render HTML-nya (tanpa parsing).
 */

let galleryOpen = false;
let galleryData = [];
let galleryIndex = 0;
let galleryPreloaded = false;

// ===== PRELOAD =====
async function preloadGalleryData() {
  if (galleryPreloaded) {
    console.log('✅ Gallery sudah di-cache');
    return;
  }

  try {
    console.log('📥 Preload gallery...');
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    // Filter ID 'gallery'
    const items = rawData.filter(item => (item.ID || '').toLowerCase() === 'gallery');

    // Parse setiap item
    galleryData = items.map(item => parseGalleryItem(item)).filter(Boolean);

    galleryPreloaded = true;
    console.log('✅ Gallery preloaded:', galleryData.length, 'foto');
  } catch (err) {
    console.error('❌ Preload gallery gagal:', err);
  }
}

// ===== PARSE ITEM =====
// Body dari admin berisi HTML: <img src="URL" style="..."><p>Caption</p>
// Kita ekstrak: URL gambar + caption (text bersih)
function parseGalleryItem(item) {
  const judul = item.Header || 'Tanpa Judul';
  const body = item.Body || '';

  if (!body.trim()) return null;

  // Ekstrak URL gambar dari <img src="...">
  const imgMatch = body.match(/<img[^>]*src=["']([^"']+)["']/i);
  const imgUrl = imgMatch ? imgMatch[1] : '';

  if (!imgUrl) return null;

  // Ekstrak caption — hapus semua tag HTML, sisanya text
  let caption = body
    .replace(/<img[^>]*>/gi, '')          // hapus tag img
    .replace(/<\/?p[^>]*>/gi, ' ')        // hapus tag p
    .replace(/<[^>]+>/g, ' ')             // hapus tag HTML lainnya
    .replace(/\s+/g, ' ')                 // rapikan spasi
    .trim();

  return {
    judul: judul,
    img: imgUrl,
    caption: caption,
  };
}

// ===== BUKA MODAL =====
function openGalleryModal() {
  const overlay = document.getElementById('galleryOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  galleryOpen = true;
  overlay.classList.add('open');
  if (stage) stage.classList.add('gallery-open');

  if (typeof updateButtons === 'function') updateButtons();

  // Render grid
  if (galleryData.length > 0) {
    renderGalleryGrid();
  } else {
    // Belum ada data → fetch ulang
    const body = document.getElementById('galleryBody');
    if (body) body.innerHTML = '<div class="gallery-loading">Memuat...</div>';
    fetchGalleryData();
  }
}

// ===== TUTUP MODAL =====
function closeGalleryModal(skipMenu = false) {
  const overlay = document.getElementById('galleryOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  galleryOpen = false;
  overlay.classList.remove('open');

  // Tutup lightbox juga
  closeLightbox();

  // Kalau balik ke menu → tambah modal-open dulu
  if (!skipMenu && stage) {
    stage.classList.add('modal-open');
  }

  if (stage) stage.classList.remove('gallery-open');

  if (typeof updateButtons === 'function') updateButtons();

  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openModal === 'function') openModal();
    }, 100);
  }
}

// ===== FETCH (fallback) =====
async function fetchGalleryData() {
  try {
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    const items = rawData.filter(item => (item.ID || '').toLowerCase() === 'gallery');
    galleryData = items.map(item => parseGalleryItem(item)).filter(Boolean);

    renderGalleryGrid();
  } catch (err) {
    console.error('❌ Fetch gallery gagal:', err);
    const body = document.getElementById('galleryBody');
    if (body) body.innerHTML = '<div class="gallery-empty">Gagal memuat gallery.</div>';
  }
}

// ===== RENDER GRID =====
function renderGalleryGrid() {
  const body = document.getElementById('galleryBody');
  if (!body) return;

  if (galleryData.length === 0) {
    body.innerHTML = '<div class="gallery-empty">Belum ada foto.</div>';
    return;
  }

  let html = '<div class="gallery-grid">';

  galleryData.forEach((item, idx) => {
    html += `
      <div class="gallery-card" onclick="openLightbox(${idx})">
        <img class="gallery-card-img" 
             src="${escapeGallery(item.img)}" 
             alt="${escapeGallery(item.judul)}"
             onerror="this.src='Assets/placeholder.png'; this.classList.add('error');">
        <div class="gallery-card-info">
          <div class="gallery-card-title">${escapeGallery(item.judul)}</div>
          ${item.caption ? `<div class="gallery-card-caption">${escapeGallery(item.caption)}</div>` : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';
  body.innerHTML = html;
}

// ===== BUKA LIGHTBOX =====
function openLightbox(idx) {
  if (idx < 0 || idx >= galleryData.length) return;

  galleryIndex = idx;
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;

  updateLightboxContent();
  lb.classList.add('open');
}

// ===== TUTUP LIGHTBOX =====
function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  lb.classList.remove('open');
}

// ===== UPDATE CONTENT LIGHTBOX =====
function updateLightboxContent() {
  const item = galleryData[galleryIndex];
  if (!item) return;

  const imgEl = document.getElementById('galleryLbImg');
  const titleEl = document.getElementById('galleryLbTitle');
  const captionEl = document.getElementById('galleryLbCaption');
  const counterEl = document.getElementById('galleryLbCounter');

  if (imgEl) imgEl.src = item.img;
  if (titleEl) titleEl.innerText = item.judul;
  if (captionEl) captionEl.innerText = item.caption || '';
  if (counterEl) counterEl.innerText = (galleryIndex + 1) + ' / ' + galleryData.length;
}

// ===== NAVIGASI LIGHTBOX =====
function lightboxPrev() {
  if (galleryIndex > 0) {
    galleryIndex--;
    updateLightboxContent();
  }
}

function lightboxNext() {
  if (galleryIndex < galleryData.length - 1) {
    galleryIndex++;
    updateLightboxContent();
  }
}

// ===== ESCAPE =====
function escapeGallery(str) {
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

// ===== KEYBOARD (LIGHTBOX) =====
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('galleryLightbox');
  if (!lb || !lb.classList.contains('open')) return;

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

// ===== ESC (MODAL) =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lb = document.getElementById('galleryLightbox');
    if (lb && lb.classList.contains('open')) return;

    const overlay = document.getElementById('galleryOverlay');
    if (overlay && overlay.classList.contains('open')) {
      closeGalleryModal();
    }
  }
});

// ===== EXPOSE =====
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.preloadGalleryData = preloadGalleryData;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.lightboxPrev = lightboxPrev;
window.lightboxNext = lightboxNext;

console.log('✅ gallery.js loaded (V2 — HTML Body)');
