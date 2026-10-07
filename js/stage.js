/**
 * stage.js — Auto-scale + Orientasi + Background Dinamis V4
 * 
 * Perubahan dari V3:
 * - Fix bug blob URL expired (ERR_FILE_NOT_FOUND)
 * - Blob URL tidak lagi disimpan di sessionStorage (blob tidak bisa cross-session)
 * - Selalu fetch bg-img setiap load + create blob baru
 * - Revoke blob lama untuk cegah memory leak
 * - Fetch bg-img di-cache browser via ?v=version — tetap cepat
 * - NPC lazy load tetap ada
 */

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

function checkOrientation() {
  if (isPortrait()) {
    document.documentElement.classList.add('portrait');
  } else {
    document.documentElement.classList.remove('portrait');
  }
}

const BASE_HEIGHT = 300;

function resizeStage() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const vw = isPortrait() ? window.innerHeight : window.innerWidth;
  const vh = isPortrait() ? window.innerWidth : window.innerHeight;
  const scale = vh / BASE_HEIGHT;
  const stageWidth = vw / scale;

  stage.style.width = stageWidth + 'px';
  stage.style.height = BASE_HEIGHT + 'px';
  stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
}

function updateLayout() {
  checkOrientation();
  resizeStage();
}

// ==========================================
// BACKGROUND LOADER — DUAL FILE (JSON + BINARY)
// ==========================================

const BG_JSON_URL = 'https://raw.githubusercontent.com/umbrella-id/umbrella-id.github.io/main/upload/bg.json';
const BG_IMG_URL  = 'https://raw.githubusercontent.com/umbrella-id/umbrella-id.github.io/main/upload/bg-img';

const FORMAT_TO_MIME = {
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'avif': 'image/avif',
    'svg': 'image/svg+xml',
    'svg+xml': 'image/svg+xml'
};

// Global reference untuk blob URL aktif (untuk di-revoke)
window.__umbrella_current_blob = null;

async function loadBackground() {
    console.log('🎨 Load background...');
    
    const bgEl = document.querySelector('.bg');
    document.documentElement.style.backgroundColor = '#030208';
    
    try {
        // 1. Fetch bg.json (metadata)
        const res = await fetch(BG_JSON_URL, { cache: 'no-cache' });
        
        if (!res.ok) throw new Error('bg.json tidak ada');
        
        const config = await res.json();
        
        // 2. Cek status
        if (config.status !== 'aktif') {
            console.log('🎨 Status nonaktif, pakai default');
            applyDefaultBackground(bgEl);
            return;
        }
        
        // 3. Fetch binary image (SELALU — blob URL tidak bisa cross-session)
        console.log('🔄 Fetch bg-img (binary)...');
        const imgRes = await fetch(BG_IMG_URL + '?v=' + (config.version || Date.now()), { cache: 'no-cache' });
        
        if (!imgRes.ok) throw new Error('bg-img tidak ada');
        
        const rawBlob = await imgRes.blob();
        
        // 4. Override MIME (GitHub raw kirim application/octet-stream untuk file tanpa ekstensi)
        const actualMime = FORMAT_TO_MIME[(config.format || '').toLowerCase()] || 'image/jpeg';
        const blob = new Blob([rawBlob], { type: actualMime });
        const blobUrl = URL.createObjectURL(blob);
        
        // 5. Revoke blob lama (kalau ada) — cegah memory leak
        const oldBlobUrl = window.__umbrella_current_blob;
        if (oldBlobUrl && oldBlobUrl !== blobUrl) {
            try { URL.revokeObjectURL(oldBlobUrl); } catch(e) {}
        }
        window.__umbrella_current_blob = blobUrl;
        
        // 6. Apply background
        document.documentElement.style.setProperty('--bg-image', `url('${blobUrl}')`);
        console.log('✅ Background custom:', config.format, ((config.size || 0) / 1024).toFixed(0) + 'KB');
        
        if (bgEl) { void bgEl.offsetHeight; bgEl.classList.add('loaded'); }
        
    } catch(e) {
        console.warn('⚠️ bg.json gagal:', e.message);
        applyDefaultBackground(bgEl);
    }
}

function applyDefaultBackground(bgEl) {
    document.documentElement.style.setProperty('--bg-image', `url('/Assets/Background.webp')`);
    console.log('🎨 Pakai background DEFAULT');
    
    if (bgEl) { void bgEl.offsetHeight; bgEl.classList.add('loaded'); }
}

// ==========================================
// NPC / MASKOT — Lazy Load
// ==========================================

function loadNpc() {
    const container = document.getElementById('npcContainer');
    if (!container) return;
    
    // Jangan load kalau sudah ada
    if (container.querySelector('.npc-maskot')) return;
    
    // Jangan load saat gate aktif (user baru)
    const stage = document.getElementById('stage');
    if (stage && (stage.classList.contains('gate-first') || stage.classList.contains('gate-edit-mode'))) {
        console.log('⏸️ NPC ditunda — gate aktif');
        return;
    }
    
    const img = document.createElement('img');
    img.className = 'npc-maskot';
    img.alt = 'Umbrella NPC';
    img.src = 'Assets/NPC.webp';
    
    img.onload = () => {
        img.classList.add('loaded');
        console.log('✅ NPC loaded');
    };
    
    img.onerror = () => {
        console.warn('⚠️ NPC gagal load:', img.src);
        img.remove();
    };
    
    container.appendChild(img);
}

function checkAndLoadNpc() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    
    // Load NPC kalau gate tidak aktif
    if (!stage.classList.contains('gate-first') && !stage.classList.contains('gate-edit-mode')) {
        loadNpc();
    }
}

// ==========================================
// CLEANUP — Revoke blob saat halaman ditutup
// ==========================================

window.addEventListener('beforeunload', () => {
    if (window.__umbrella_current_blob) {
        try { URL.revokeObjectURL(window.__umbrella_current_blob); } catch(e) {}
        window.__umbrella_current_blob = null;
    }
});

// ==========================================
// PRELOAD
// ==========================================

function preloadAllData() {
  if (typeof preloadInfoData === 'function') preloadInfoData();
  if (typeof preloadHeadlineData === 'function') preloadHeadlineData();
}

function preloadTentang() {
  if (typeof preloadTentangData === 'function') preloadTentangData();
}

function preloadGallery() {
  if (typeof preloadGalleryData === 'function') preloadGalleryData();
}

// ==========================================
// INIT
// ==========================================

window.addEventListener('load', () => {
  updateLayout();
  console.log('✅ Layout siap');

  setTimeout(loadBackground, 100);
  setTimeout(preloadAllData, 500);
  setTimeout(preloadTentang, 700);
  setTimeout(preloadGallery, 700);
  
  // 🎭 NPC: cek dulu, kalau gate tidak aktif → load
  setTimeout(checkAndLoadNpc, 800);
});

window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));

window.isPortrait = isPortrait;
window.loadBackground = loadBackground;
window.loadNpc = loadNpc;
window.checkAndLoadNpc = checkAndLoadNpc;

console.log('✅ stage.js loaded (V4 — Blob Fix + NPC)');
