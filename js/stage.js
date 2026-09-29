/**
 * stage.js — Auto-scale + Orientasi + Background Load Belakangan
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

// ===== LOAD BACKGROUND BELAKANGAN =====
function loadBackground() {
  console.log('🎨 Mulai load background...');

  const img = new Image();
  const bgUrl = 'Assets/Background.png';

  img.onload = () => {
    // Set CSS variable
    document.documentElement.style.setProperty('--bg-image', `url('${bgUrl}')`);

    // Trigger fade-in
    const bgEl = document.querySelector('.bg');
    if (bgEl) {
      // Force reflow biar transisi jalan
      void bgEl.offsetHeight;
      bgEl.classList.add('loaded');
    }

    console.log('✅ Background loaded & fade-in');
  };

  img.onerror = () => {
    console.warn('⚠️ Background gagal load');
  };

  img.src = bgUrl;
}

// ===== INIT =====
window.addEventListener('load', () => {
  // 1. Layout dulu — ornamen & tombol rapi
  updateLayout();
  console.log('✅ Layout siap');

  // 2. Delay 300ms — biar ornamen kelihatan dulu
  //    Baru load background
  setTimeout(loadBackground, 300);
});

window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));

window.isPortrait = isPortrait;
console.log('✅ stage.js loaded');
