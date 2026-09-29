/**
 * menu.js — Tombol Menu + Navigasi State + Handle Gate
 */

let currentPage = 'home';
let pageHistory = ['home'];

function getModalOverlay() {
  return document.getElementById('modalOverlay');
}

function getGate() {
  return document.getElementById('gatekeeper');
}

function updateButtons() {
  const ikonKiri = document.getElementById('ikonKiri');
  const ikonKanan = document.getElementById('ikonKanan');
  if (!ikonKiri || !ikonKanan) return;

  // Cek apakah gate mode 'change' (edit nama)
  const stage = document.getElementById('stage');
  const isGateEdit = stage && stage.classList.contains('gate-edit-mode');

  if (isGateEdit) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    return;
  }

  const modalOverlay = getModalOverlay();
  const modalOpen = modalOverlay && modalOverlay.classList.contains('open');

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

      // Prioritas 1: Gate buka
      const gate = getGate();
      if (gate && gate.classList.contains('open')) {
        if (typeof closeGate === 'function') closeGate();
        return;
      }

      // Prioritas 2: Normal
      if (currentPage === 'home') {
        const modalOverlay = getModalOverlay();
        if (modalOverlay && modalOverlay.classList.contains('open')) {
          if (typeof closeModal === 'function') closeModal();
        } else {
          if (typeof openModal === 'function') openModal();
        }
      } else {
        goBack();
      }
    });
  }

  if (btnKanan) {
    btnKanan.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      const gate = getGate();
      if (gate && gate.classList.contains('open')) return;

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
