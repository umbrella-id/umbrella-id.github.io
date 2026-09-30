/**
 * stage.js — Auto-scale + Orientasi + Background Load Belakangan + Preload Info
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
  const imgLoadPath = 'Assets/Background.png';       // relatif ke index.html
  const cssPath = '../Assets/Background.png';        // relatif ke css/stage.css

  img.onload = () => {
    document.documentElement.style.setProperty('--bg-image', `url('${cssPath}')`);

    const bgEl = document.querySelector('.bg');
    if (bgEl) {
      void bgEl.offsetHeight;   // force reflow
      bgEl.classList.add('loaded');
    }

    console.log('✅ Background loaded & fade-in');
  };

  img.onerror = () => {
    console.warn('⚠️ Background gagal load:', imgLoadPath);
  };

  img.src = imgLoadPath;
}

// ===== PRELOAD INFO DATA =====
function preloadInfo() {
  if (typeof preloadInfoData === 'function') {
    preloadInfoData();
  }
}

// ===== PRELOAD HEADLINE =====
function preloadHeadline() {
  if (typeof preloadHeadlineData === 'function') {
    preloadHeadlineData();
  }
}

// ===== INIT =====
window.addEventListener('load', () => {
  updateLayout();
  console.log('✅ Layout siap');

  setTimeout(loadBackground, 300);
  setTimeout(preloadInfo, 500);
  setTimeout(preloadHeadline, 800);   // ← headline terakhir
});

window.addEventListener('resize', updateLayout);
window.addEventListener('orientationchange', () => setTimeout(updateLayout, 150));

window.isPortrait = isPortrait;
console.log('✅ stage.js loaded');
