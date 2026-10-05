/**
 * gallery.js — Modal Gallery + Lightbox (V3)
 * 
 * Fitur lightbox:
 * - Fullscreen (hide browser chrome, UI bisa di-toggle)
 * - Pinch zoom (mobile, 2 jari)
 * - Wheel zoom (PC)
 * - Double-tap / double-click zoom
 * - Drag / pan saat zoom
 * - Swipe next/prev saat zoom 1x
 * - Tap 1x → toggle UI
 * - Keyboard (PC): ESC close, Arrow keys prev/next, +/- zoom
 * - Back button handler (browser history)
 * 
 * Format Body dari GAS: HTML <img src="..."> + caption
 */

let galleryOpen = false;
let galleryData = [];
let galleryIndex = 0;
let galleryPreloaded = false;

// ==========================================
// LIGHTBOX STATE
// ==========================================
const LbState = {
  scale: 1,          // zoom scale
  minScale: 1,
  maxScale: 5,
  translateX: 0,     // pan X
  translateY: 0,     // pan Y
  isDragging: false,
  isPinching: false,
  startX: 0,
  startY: 0,
  startTranslateX: 0,
  startTranslateY: 0,
  startDistance: 0,
  startScale: 1,
  lastTapTime: 0,
  swipeStartX: 0,
  swipeStartY: 0,
  isSwiping: false
};

let lbInitialized = false;

// ==========================================
// PRELOAD
// ==========================================
async function preloadGalleryData() {
  if (galleryPreloaded) {
    console.log('✅ Gallery sudah di-cache');
    return;
  }

  try {
    console.log('📥 Preload gallery...');
    const rawData = await API.getContent();
    if (!rawData || !Array.isArray(rawData)) return;

    const items = rawData.filter(item => (item.ID || '').toLowerCase() === 'gallery');
    galleryData = items.map(item => parseGalleryItem(item)).filter(Boolean);

    galleryPreloaded = true;
    console.log('✅ Gallery preloaded:', galleryData.length, 'foto');
  } catch (err) {
    console.error('❌ Preload gallery gagal:', err);
  }
}

// ==========================================
// PARSE ITEM
// ==========================================
function parseGalleryItem(item) {
  const judul = item.Header || 'Tanpa Judul';
  const body = item.Body || '';

  if (!body.trim()) return null;

  const imgMatch = body.match(/<img[^>]*src=["']([^"']+)["']/i);
  const imgUrl = imgMatch ? imgMatch[1] : '';

  if (!imgUrl) return null;

  let caption = body
    .replace(/<img[^>]*>/gi, '')
    .replace(/<\/?p[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    judul: judul,
    img: imgUrl,
    caption: caption,
  };
}

// ==========================================
// BUKA MODAL GALLERY
// ==========================================
function openGalleryModal() {
  const overlay = document.getElementById('galleryOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  galleryOpen = true;
  overlay.classList.add('open');
  if (stage) stage.classList.add('gallery-open');

  if (typeof updateButtons === 'function') updateButtons();

  if (galleryData.length > 0) {
    renderGalleryGrid();
  } else {
    const body = document.getElementById('galleryBody');
    if (body) body.innerHTML = '<div class="gallery-loading">Memuat...</div>';
    fetchGalleryData();
  }
}

// ==========================================
// TUTUP MODAL
// ==========================================
function closeGalleryModal(skipMenu = false) {
  const overlay = document.getElementById('galleryOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  galleryOpen = false;
  overlay.classList.remove('open');

  closeLightbox();

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

// ==========================================
// FETCH FALLBACK
// ==========================================
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

// ==========================================
// RENDER GRID
// ==========================================
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
      <div class="gallery-card" data-idx="${idx}">
        <img class="gallery-card-img" 
             src="${escapeGallery(item.img)}" 
             alt="${escapeGallery(item.judul)}"
             loading="lazy"
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

  // Pasang listener via event delegation
  body.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx);
      openLightbox(idx);
    });
  });
}

// ==========================================
// BUKA LIGHTBOX
// ==========================================
function openLightbox(idx) {
  if (idx < 0 || idx >= galleryData.length) return;

  galleryIndex = idx;
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;

  // Build HTML lightbox sekali saja
  if (!lbInitialized) {
    buildLightboxHTML(lb);
    initLightboxEvents(lb);
    lbInitialized = true;
  }

  resetZoom();
  updateLightboxContent();
  lb.classList.add('open');

  // Push history untuk back button
  if (typeof pushView === 'function') {
    pushView('gallery-lightbox', { idx });
  } else {
    history.pushState({ view: 'gallery-lightbox', idx }, '');
  }

  // Tampilkan hint zoom sekali per session
  const hint = document.getElementById('galleryLbHint');
  if (hint && !sessionStorage.getItem('umbrella_lb_hint_seen')) {
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 3500);
    sessionStorage.setItem('umbrella_lb_hint_seen', '1');
  }
}

// ==========================================
// BUILD HTML LIGHTBOX
// ==========================================
function buildLightboxHTML(lb) {
  lb.innerHTML = `
    <div class="gallery-lb-stage" id="galleryLbStage">
      <img class="gallery-lb-img" id="galleryLbImg" src="" alt=""
           onerror="this.src='Assets/placeholder.png';">
    </div>
    <div class="gallery-lb-ui" id="galleryLbUI">
      <button class="gallery-lb-close" id="galleryLbClose" aria-label="Tutup">✕</button>
      <div class="gallery-lb-counter" id="galleryLbCounter">1 / 1</div>
      <div class="gallery-lb-nav prev" id="galleryLbPrev">◀</div>
      <div class="gallery-lb-nav next" id="galleryLbNext">▶</div>
      <div class="gallery-lb-info">
        <div class="gallery-lb-title" id="galleryLbTitle"></div>
        <div class="gallery-lb-caption" id="galleryLbCaption"></div>
      </div>
    </div>
    <div class="gallery-lb-hint" id="galleryLbHint">Pinch / scroll untuk zoom • Tap untuk sembunyikan UI</div>
  `;
}

// ==========================================
// TUTUP LIGHTBOX
// ==========================================
function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (!lb) return;
  if (!lb.classList.contains('open')) return;

  lb.classList.remove('open');
  resetZoom();

  // Pop history kalau ada state-nya
  if (history.state && history.state.view === 'gallery-lightbox') {
    history.back();
  }
}

// ==========================================
// UPDATE CONTENT LIGHTBOX
// ==========================================
function updateLightboxContent() {
  const item = galleryData[galleryIndex];
  if (!item) return;

  const imgEl = document.getElementById('galleryLbImg');
  const titleEl = document.getElementById('galleryLbTitle');
  const captionEl = document.getElementById('galleryLbCaption');
  const counterEl = document.getElementById('galleryLbCounter');

  if (imgEl) {
    imgEl.src = item.img;
    imgEl.classList.add('no-transition');
    resetZoom();
    requestAnimationFrame(() => {
      imgEl.classList.remove('no-transition');
    });
  }
  if (titleEl) titleEl.innerText = item.judul;
  if (captionEl) captionEl.innerText = item.caption || '';
  if (counterEl) counterEl.innerText = (galleryIndex + 1) + ' / ' + galleryData.length;

  updateNavVisibility();
}

// ==========================================
// NAV VISIBILITY (hide prev/next di ujung)
// ==========================================
function updateNavVisibility() {
  const prev = document.getElementById('galleryLbPrev');
  const next = document.getElementById('galleryLbNext');

  if (prev) {
    if (galleryIndex <= 0) prev.classList.add('hidden');
    else prev.classList.remove('hidden');
  }
  if (next) {
    if (galleryIndex >= galleryData.length - 1) next.classList.add('hidden');
    else next.classList.remove('hidden');
  }
}

// ==========================================
// NAVIGASI LIGHTBOX
// ==========================================
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

// ==========================================
// ZOOM HELPERS
// ==========================================
function resetZoom() {
  LbState.scale = 1;
  LbState.translateX = 0;
  LbState.translateY = 0;
  applyTransform();
}

function applyTransform(useTransition = true) {
  const img = document.getElementById('galleryLbImg');
  if (!img) return;

  if (!useTransition) img.classList.add('no-transition');
  else img.classList.remove('no-transition');

  img.style.transform = `translate(${LbState.translateX}px, ${LbState.translateY}px) scale(${LbState.scale})`;
}

function clampTranslate() {
  if (LbState.scale <= 1) {
    LbState.translateX = 0;
    LbState.translateY = 0;
    return;
  }
  // Bebas pan selama zoom > 1 (biar user bisa geser ke mana saja)
  // (Clamping strict butuh ukuran gambar & container — skip untuk simplicity)
}

// ==========================================
// TOGGLE UI (TAP)
// ==========================================
function toggleLightboxUI() {
  const ui = document.getElementById('galleryLbUI');
  if (!ui) return;
  ui.classList.toggle('hidden');
}

// ==========================================
// INIT EVENT LIGHTBOX
// ==========================================
function initLightboxEvents(lb) {
  const stage = document.getElementById('galleryLbStage');
  const img = document.getElementById('galleryLbImg');
  const closeBtn = document.getElementById('galleryLbClose');
  const prevBtn = document.getElementById('galleryLbPrev');
  const nextBtn = document.getElementById('galleryLbNext');

  if (!stage) return;

  // ==========================================
  // CLOSE & NAV BUTTONS
  // ==========================================
  if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); lightboxPrev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); lightboxNext(); });

  // ==========================================
  // TOUCH EVENTS (MOBILE)
  // ==========================================
  let touchStartTime = 0;

  stage.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();

    if (e.touches.length === 2) {
      // ===== PINCH START =====
      e.preventDefault();
      LbState.isPinching = true;
      LbState.startDistance = getTouchDistance(e.touches[0], e.touches[1]);
      LbState.startScale = LbState.scale;
    } else if (e.touches.length === 1) {
      // ===== DRAG START (kalau zoom > 1) atau SWIPE START (kalau zoom = 1) =====
      const t = e.touches[0];
      if (LbState.scale > 1) {
        LbState.isDragging = true;
        LbState.startX = t.clientX;
        LbState.startY = t.clientY;
        LbState.startTranslateX = LbState.translateX;
        LbState.startTranslateY = LbState.translateY;
        stage.classList.add('dragging');
      } else {
        LbState.isSwiping = true;
        LbState.swipeStartX = t.clientX;
        LbState.swipeStartY = t.clientY;
      }
    }
  }, { passive: false });

  stage.addEventListener('touchmove', (e) => {
    if (LbState.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / LbState.startDistance;
      let newScale = LbState.startScale * ratio;
      newScale = Math.max(LbState.minScale, Math.min(LbState.maxScale, newScale));
      LbState.scale = newScale;
      applyTransform(false);
    } else if (LbState.isDragging && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      LbState.translateX = LbState.startTranslateX + (t.clientX - LbState.startX);
      LbState.translateY = LbState.startTranslateY + (t.clientY - LbState.startY);
      applyTransform(false);
    } else if (LbState.isSwiping && e.touches.length === 1) {
      // Just track — keputusan di touchend
      const t = e.touches[0];
      LbState.swipeEndX = t.clientX;
      LbState.swipeEndY = t.clientY;
    }
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;

    if (LbState.isPinching) {
      LbState.isPinching = false;

      // Kalau zoom balik ke 1, reset
      if (LbState.scale <= 1.05) {
        resetZoom();
      } else {
        clampTranslate();
        applyTransform(true);
      }
      return;
    }

    if (LbState.isDragging) {
      LbState.isDragging = false;
      stage.classList.remove('dragging');
      clampTranslate();
      applyTransform(true);
      return;
    }

    if (LbState.isSwiping) {
      LbState.isSwiping = false;

      const endX = LbState.swipeEndX || LbState.swipeStartX;
      const endY = LbState.swipeEndY || LbState.swipeStartY;
      const dx = endX - LbState.swipeStartX;
      const dy = endY - LbState.swipeStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // SWIPE horizontal (next/prev)
      if (absDx > 50 && absDx > absDy) {
        if (dx > 0) lightboxPrev();
        else lightboxNext();
        return;
      }

      // SWIPE vertikal (turun → close)
      if (absDy > 80 && absDy > absDx && dy > 0) {
        closeLightbox();
        return;
      }

      // TAP (durasi pendek + tidak banyak gerak)
      if (touchDuration < 250 && absDx < 10 && absDy < 10) {
        // Cek double-tap
        const now = Date.now();
        if (now - LbState.lastTapTime < 300) {
          // Double-tap → zoom toggle
          if (LbState.scale > 1) resetZoom();
          else { LbState.scale = 2; applyTransform(true); }
          LbState.lastTapTime = 0;
        } else {
          // Single tap → toggle UI (delay untuk cek double-tap)
          LbState.lastTapTime = now;
          setTimeout(() => {
            if (Date.now() - LbState.lastTapTime >= 250) {
              toggleLightboxUI();
            }
          }, 260);
        }
      }
    }
  });

  // ==========================================
  // MOUSE EVENTS (PC)
  // ==========================================
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    let newScale = LbState.scale + delta;
    newScale = Math.max(LbState.minScale, Math.min(LbState.maxScale, newScale));
    LbState.scale = newScale;
    if (LbState.scale <= 1) { LbState.translateX = 0; LbState.translateY = 0; }
    applyTransform(false);
  }, { passive: false });

  // Mouse drag untuk pan
  let mouseDownX = 0, mouseDownY = 0, mouseDragging = false;

  stage.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (LbState.scale <= 1) return;
    mouseDragging = true;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    LbState.startTranslateX = LbState.translateX;
    LbState.startTranslateY = LbState.translateY;
    stage.classList.add('dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!mouseDragging) return;
    LbState.translateX = LbState.startTranslateX + (e.clientX - mouseDownX);
    LbState.translateY = LbState.startTranslateY + (e.clientY - mouseDownY);
    applyTransform(false);
  });

  window.addEventListener('mouseup', () => {
    if (!mouseDragging) return;
    mouseDragging = false;
    stage.classList.remove('dragging');
    applyTransform(true);
  });

  // Double-click zoom
  stage.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (LbState.scale > 1) resetZoom();
    else { LbState.scale = 2; applyTransform(true); }
  });
}

// ==========================================
// TOUCH DISTANCE HELPER
// ==========================================
function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ==========================================
// ESCAPE HTML
// ==========================================
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

// ==========================================
// KEYBOARD SHORTCUTS (PC)
// ==========================================
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('galleryLightbox');
  if (!lb || !lb.classList.contains('open')) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    lightboxPrev();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    lightboxNext();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    LbState.scale = Math.min(LbState.maxScale, LbState.scale + 0.5);
    applyTransform(true);
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    LbState.scale = Math.max(LbState.minScale, LbState.scale - 0.5);
    if (LbState.scale <= 1) resetZoom();
    else applyTransform(true);
  } else if (e.key === '0') {
    e.preventDefault();
    resetZoom();
  }
});

// ==========================================
// ESC — TUTUP MODAL GALLERY (BUKAN LIGHTBOX)
// ==========================================
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

// ==========================================
// BACK BUTTON HANDLER
// ==========================================
window.addEventListener('popstate', function(event) {
  const lb = document.getElementById('galleryLightbox');
  if (lb && lb.classList.contains('open')) {
    lb.classList.remove('open');
    resetZoom();
  }
});

// ==========================================
// EXPOSE
// ==========================================
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.preloadGalleryData = preloadGalleryData;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.lightboxPrev = lightboxPrev;
window.lightboxNext = lightboxNext;

console.log("✅ gallery.js loaded (V3 — Fullscreen + Zoom)");
