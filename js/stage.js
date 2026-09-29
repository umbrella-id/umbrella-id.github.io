/**
 * stage.js — Auto-scale + Orientasi + Preload
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

// ===== PRELOAD BACKGROUND (belakangan) =====
function preloadBackground() {
  const img = new Image();
  const bgUrl = 'Assets/Background.png';

  img.onload = () => {
    // Pasang sebagai CSS variable
    document.documentElement.style.setProperty('--bg-image', `url('${bgUrl}')`);
    // Fade-in
    const bgEl = document.querySelector('.bg');
    if (bgEl) bgEl.classList.add('loaded');
    console.log('✅ Background siap');
  };

  img.onerror = () => {
    console.warn('⚠️ Background gagal load');
  };

  img.src = bgUrl;
}

// ===== PRELOAD INFO DATA =====
function preloadInfo() {
  if (typeof preloadInfoData === 'function') {
    preloadInfoData();
  }
}

// ===== INIT =====
window.addEventListener('load', () => {
  // Layout dulu — biar UI muncul cepat
  updateLayout();

  // Preload background (belakangan)
  setTimeout(preloadBackground, 100);

  // Preload info data (belakangan)
  setTimeout(preloadInfo, 300);
});

window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));

window.isPortrait = isPortrait;
console.log('✅ stage.js loaded');
