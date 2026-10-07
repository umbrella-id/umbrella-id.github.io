/**
 * stage.js — Auto-scale + Orientasi + Background Dinamis V3
 * 
 * Fitur:
 * - Load bg.json (metadata) + bg-img (binary) — dual fetch
 * - Support multi format: JPEG, PNG, WebP, GIF, AVIF, SVG
 * - Tanpa base64 overhead di storage & client
 * - Cache efisien via version + sessionStorage
 * - SVG aman (dirender sebagai CSS background — JavaScript diblokir)
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
const BG_VERSION_KEY = 'umbrella_bg_version';
const BG_BLOB_KEY = 'umbrella_bg_blob_url';

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

async function loadBackground() {
    console.log('🎨 Load background...');
    
    const bgEl = document.querySelector('.bg');
    document.documentElement.style.backgroundColor = '#030208';
    
    try {
        // 1. Fetch bg.json (kecil, cepat)
        const res = await fetch(BG_JSON_URL, { cache: 'no-cache' });
        
        if (!res.ok) throw new Error('bg.json tidak ada');
        
        const config = await res.json();
        
        // 2. Cek status
        if (config.status !== 'aktif') {
            console.log('🎨 Status nonaktif, pakai default');
            applyDefaultBackground(bgEl);
            return;
        }
        
        // 3. Cek cache (version sama → pakai blob lama)
        const cachedVersion = sessionStorage.getItem(BG_VERSION_KEY) || '';
        const cachedBlobUrl = sessionStorage.getItem(BG_BLOB_KEY) || '';
        
        if (config.version && String(config.version) === cachedVersion && cachedBlobUrl) {
            document.documentElement.style.setProperty('--bg-image', `url('${cachedBlobUrl}')`);
            console.log('📦 Background dari cache (version sama)');
            if (bgEl) { void bgEl.offsetHeight; bgEl.classList.add('loaded'); }
            return;
        }
        
        // 4. Fetch binary image
        console.log('🔄 Fetch bg-img (binary)...');
        const imgRes = await fetch(BG_IMG_URL + '?v=' + (config.version || Date.now()), { cache: 'no-cache' });
        
        if (!imgRes.ok) throw new Error('bg-img tidak ada');
        
        const rawBlob = await imgRes.blob();
        
        // 5. Override MIME (GitHub raw kirim application/octet-stream untuk file tanpa ekstensi)
        const actualMime = FORMAT_TO_MIME[(config.format || '').toLowerCase()] || 'image/jpeg';
        const blob = new Blob([rawBlob], { type: actualMime });
        const blobUrl = URL.createObjectURL(blob);
        
        // 6. Simpan cache
        sessionStorage.setItem(BG_VERSION_KEY, String(config.version || ''));
        sessionStorage.setItem(BG_BLOB_KEY, blobUrl);
        
        // 7. Apply background
        document.documentElement.style.setProperty('--bg-image', `url('${blobUrl}')`);
        console.log('✅ Background custom:', config.format, ((config.size || 0) / 1024).toFixed(0) + 'KB');
        
        if (bgEl) { void bgEl.offsetHeight; bgEl.classList.add('loaded'); }
        
    } catch(e) {
        console.warn('⚠️ bg.json gagal:', e.message);
        applyDefaultBackground(bgEl);
    }
}

function applyDefaultBackground(bgEl) {
    document.documentElement.style.setProperty('--bg-image', `url('/Assets/Background.png')`);
    console.log('🎨 Pakai background DEFAULT');
    
    if (bgEl) { void bgEl.offsetHeight; bgEl.classList.add('loaded'); }
}

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
});

window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));

window.isPortrait = isPortrait;
window.loadBackground = loadBackground;
console.log('✅ stage.js loaded (V3 — Dual File Background + SVG Support)');
