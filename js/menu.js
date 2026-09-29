/**
 * menu.js — Tombol Menu + Navigasi State + Handle Gate
 */

let currentPage = 'home';
let pageHistory = ['home'];

// ==========================================
// HELPER
// ==========================================
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

  // Prioritas 1: Gate sedang buka
  const gate = getGate();
  if (gate && gate.classList.contains('open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    // Tombol kanan: tetap CHAT (nggak berubah)
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-CHAT.svg" alt="">';
    return;
  }

  // Prioritas 2: Normal
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
// KLIK TOMBOL KIRI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  if (btnKiri) {
    btnKiri.addEventListener('click', (e) => {
      // Klik di plat nama? Abaikan
      if (e.target.closest('.plat-nama')) return;

      // ===== PRIORITAS 1: GATE SEDANG BUKA =====
      const gate = getGate();
      if (gate && gate.classList.contains('open')) {
        // Mode 'first' → nggak bisa close (wajib isi)
        // Mode 'change' → bisa close (batal)
        if (typeof closeGate === 'function') {
          closeGate();
        }
        return;
      }

      // ===== PRIORITAS 2: NORMAL =====
      if (currentPage === 'home') {
        const modalOverlay = getModalOverlay();
        if (modalOverlay && modalOverlay.classList.contains('open')) {
          // Modal buka → tutup
          if (typeof closeModal === 'function') closeModal();
        } else {
          // Modal tutup → buka
          if (typeof openModal === 'function') openModal();
        }
      } else {
        // Subpage → back
        goBack();
      }
    });
  }

  if (btnKanan) {
    btnKanan.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      // Kalau gate buka → tombol kanan nggak aktif
      const gate = getGate();
      if (gate && gate.classList.contains('open')) return;

      if (currentPage === 'home') {
        // Buka form tulis chat (placeholder)
        console.log('Buka form tulis chat');
        // TODO: openChatInput()
      } else {
        // Subpage → home
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
