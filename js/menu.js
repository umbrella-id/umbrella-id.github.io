/**
 * menu.js — Tombol Menu + Navigasi State + Handle Gate + Handle Mail
 */

let currentPage = 'home';
let pageHistory = ['home'];

function getModalOverlay() {
  return document.getElementById('modalOverlay');
}

function getGate() {
  return document.getElementById('gatekeeper');
}

// ==========================================
// UPDATE ICON TOMBOL
// ==========================================
function updateButtons() {
  const ikonKiri = document.getElementById('ikonKiri');
  const ikonKanan = document.getElementById('ikonKanan');
  if (!ikonKiri || !ikonKanan) return;

  const stage = document.getElementById('stage');

  // Prioritas 1: Form surat buka → BACK + HOME
  if (stage && stage.classList.contains('mail-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 2: Gate mode 'change' → BACK
  if (stage && stage.classList.contains('gate-edit-mode')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    return;
  }

  // Prioritas 3: Normal
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

// ==========================================
// NAVIGASI
// ==========================================
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

// ==========================================
// EVENT LISTENER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  // ===== KLIK TOMBOL KIRI =====
  if (btnKiri) {
    btnKiri.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      const stage = document.getElementById('stage');

      // Prioritas 1: Form surat buka → kembali ke menu
      if (stage && stage.classList.contains('mail-open')) {
        if (typeof closeMailForm === 'function') closeMailForm();   // default skipMenu=false
        return;
      }

      // Prioritas 2: Gate buka → close
      const gate = getGate();
      if (gate && gate.classList.contains('open')) {
        if (typeof closeGate === 'function') closeGate();   // default skipMenu=false
        return;
      }

      // Prioritas 3: Normal
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

  // ===== KLIK TOMBOL KANAN =====
  if (btnKanan) {
    btnKanan.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      const stage = document.getElementById('stage');

      // Prioritas 1: Form surat buka → balik ke home
      if (stage && stage.classList.contains('mail-open')) {
        if (typeof closeMailForm === 'function') closeMailForm(true);   // skipMenu=true
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 2: Gate buka → non-aktif
      const gate = getGate();
      if (gate && gate.classList.contains('open')) return;

      // Prioritas 3: Normal
      if (currentPage === 'home') {
        if (typeof openChatInput === 'function') openChatInput();
      } else {
        goHome();
      }
    });
  }
});

// ==========================================
// EXPOSE
// ==========================================
window.goToPage = goToPage;
window.goBack = goBack;
window.goHome = goHome;
window.updateButtons = updateButtons;

console.log('✅ menu.js loaded');
