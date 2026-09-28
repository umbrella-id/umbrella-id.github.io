/**
 * menu.js — Tombol Menu + Navigasi State
 */

let currentPage = 'home';
let pageHistory = ['home'];

function getModalOverlay() {
  return document.getElementById('modalOverlay');
}

function updateButtons() {
  const ikonKiri = document.getElementById('ikonKiri');
  const ikonKanan = document.getElementById('ikonKanan');
  const modalOverlay = getModalOverlay();
  if (!ikonKiri || !ikonKanan || !modalOverlay) return;

  const modalOpen = modalOverlay.classList.contains('open');

  if (currentPage === 'home') {
    if (modalOpen) {
      ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    } else {
      ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-MENU.svg" alt="">';
    }
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-CHAT.svg" alt="">';
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

document.addEventListener('DOMContentLoaded', () => {
  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  if (btnKiri) {
    btnKiri.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      if (currentPage === 'home') {
        const modalOverlay = getModalOverlay();
        if (modalOverlay && modalOverlay.classList.contains('open')) {
          closeModal();
        } else {
          openModal();
        }
      } else {
        goBack();
      }
    });
  }

  if (btnKanan) {
    btnKanan.addEventListener('click', () => {
      if (currentPage === 'home') {
        console.log('Buka form tulis chat');
      } else {
        goHome();
      }
    });
  }
});

window.goToPage = goToPage;
window.goBack = goBack;
window.goHome = goHome;
window.updateButtons = updateButtons;
console.log('✅ menu.js loaded');
