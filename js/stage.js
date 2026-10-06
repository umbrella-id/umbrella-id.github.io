/**
 * stage.js — Auto-scale + Orientasi + Background Dinamis (V2)
 * 
 * Fitur baru:
 * - Load background dari bg.json (dynamic dari admin)
 * - Cek via HEAD + Last-Modified (hemat bandwidth)
 * - Session cache untuk kunjungan berikutnya
 * - Fallback ke default kalau bg.json tidak ada / nonaktif
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
// BACKGROUND LOADER — HEAD + CACHE + JSON
// ==========================================

const BG_JSON_URL = 'https://raw.githubusercontent.com/umbrella-id/web/main/upload/bg.json';
const BG_CACHE_KEY = 'umbrella_bg_config';
const BG_LM_KEY = 'umbrella_bg_last_modified';
const BG_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 jam

async function loadBackground() {
    console.log('🎨 Load background...');
    
    const bgEl = document.querySelector('.bg');
    
    // 1. Set placeholder warna (instant, tidak download apapun)
    document.documentElement.style.backgroundColor = '#030208';
    
    try {
        // 2. HEAD request — cek Last-Modified
        const headRes = await fetch(BG_JSON_URL, {
            method: 'HEAD',
            cache: 'no-cache'
        });
        
        if (!headRes.ok) {
            throw new Error('bg.json tidak ditemukan');
        }
        
        const lastModified = headRes.headers.get('Last-Modified') || '';
        const cachedModified = sessionStorage.getItem(BG_LM_KEY) || '';
        const cachedConfig = sessionStorage.getItem(BG_CACHE_KEY) || '';
        const cachedTime = parseInt(sessionStorage.getItem('umbrella_bg_time') || '0');
        
        // 3. Cek cache: kalau Last-Modified sama & belum expired
        const isCacheValid = 
            cachedConfig &&
            lastModified &&
            lastModified === cachedModified &&
            (Date.now() - cachedTime) < BG_CACHE_MAX_AGE;
        
        if (isCacheValid) {
            const config = JSON.parse(cachedConfig);
            applyBackground(config, bgEl);
            console.log('📦 Background dari cache');
            return;
        }
        
        // 4. Fetch full JSON
        console.log('🔄 Fetch bg.json (fresh)');
        const res = await fetch(BG_JSON_URL, { cache: 'no-cache' });
        
        if (!res.ok) throw new Error('Fetch bg.json gagal');
        
        const config = await res.json();
        
        // Simpan di session
        sessionStorage.setItem(BG_CACHE_KEY, JSON.stringify(config));
        sessionStorage.setItem(BG_LM_KEY, lastModified);
        sessionStorage.setItem('umbrella_bg_time', Date.now().toString());
        
        applyBackground(config, bgEl);
        console.log('✅ Background updated dari JSON');
        
    } catch(e) {
        console.warn('⚠️ bg.json gagal, pakai default:', e.message);
        applyBackground({ status: 'nonaktif' }, bgEl);
    }
}

function applyBackground(config, bgEl) {
    if (!config) config = { status: 'nonaktif' };
    
    let bgUrl = 'Assets/Background.png';
    
    if (config.status === 'aktif' && config.data && config.data.startsWith('data:image/')) {
        bgUrl = config.data;
        console.log('🎨 Pakai background CUSTOM');
    } else {
        console.log('🎨 Pakai background DEFAULT');
    }
    
    document.documentElement.style.setProperty('--bg-image', `url('${bgUrl}')`);
    
    if (bgEl) {
        void bgEl.offsetHeight;
        bgEl.classList.add('loaded');
    }
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
console.log('✅ stage.js loaded (V2 — Dynamic Background)');
