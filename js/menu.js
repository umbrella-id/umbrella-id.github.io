/**
 * menu.js — Tombol Menu + Navigasi State
 */

const modalOverlay = document.getElementById('modalOverlay');

let currentPage = 'home';
let pageHistory = ['home'];

function updateButtons() {
  const ikonKiri = document.getElementById('ikonKiri');
  const ikonKanan = document.getElementById('ikonKanan');
  const modalOpen = modalOverlay.classList.contains('open');

  if (currentPage === 'home') {
    if (modalOpen) {
      ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
      ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-CHAT.svg" alt="">';
    } else {
      ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-MENU.svg" alt="">';
      ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-CHAT.svg" alt="">';
    }
  } else {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
  }
}

function goToPage(pageName) {
  currentPage = pageName;
  pageHistory.push(pageName);
  updateButtons();
  console.log('Pindah ke halaman:', pageName);
}

function goBack() {
  if (pageHistory.length > 1) {
    pageHistory.pop();
    currentPage = pageHistory[pageHistory.length - 1];
    updateButtons();
  }
}

function goHome() {
  pageHistory = ['home'];
  currentPage = 'home';
  updateButtons();
}

// ===== KLIK TOMBOL KIRI =====
document.getElementById('btnKiri').addEventListener('click', (e) => {
  if (e.target.closest('.plat-nama')) return;

  if (currentPage === 'home') {
    if (modalOverlay.classList.contains('open')) {
      closeModal();
    } else {
      openModal();
    }
  } else {
    goBack();
  }
});

// ===== KLIK TOMBOL KANAN =====
document.getElementById('btnKanan').addEventListener('click', () => {
  if (currentPage === 'home') {
    console.log('Buka form tulis chat');
    // TODO: buka modal tulis chat
  } else {
    goHome();
  }
});

window.goToPage = goToPage;
window.goBack = goBack;
window.goHome = goHome;
window.updateButtons = updateButtons;
console.log('✅ menu.js loaded');
