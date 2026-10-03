/**
 * menu.js — Tombol Menu + Navigasi State
 */

let currentPage = 'home';
let pageHistory = ['home'];

function getModalOverlay() {
  return document.getElementById('modalOverlay');
}

function getGate() {
  return document.getElementById('gatekeeper');
}

// ===== UPDATE CLASS PAGE DI STAGE =====
function updatePageClass() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  if (currentPage === 'home') {
    stage.classList.add('page-home');
  } else {
    stage.classList.remove('page-home');
  }
}

// ===== UPDATE ICON TOMBOL =====
function updateButtons() {
  const ikonKiri = document.getElementById('ikonKiri');
  const ikonKanan = document.getElementById('ikonKanan');
  if (!ikonKiri || !ikonKanan) return;

  const stage = document.getElementById('stage');

  // Prioritas 1: Headline popup buka → BACK + HOME
  if (stage && stage.classList.contains('headline-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 2: Form surat buka → BACK + HOME
  if (stage && stage.classList.contains('mail-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 3: Info serikat buka → BACK + HOME
  if (stage && stage.classList.contains('info-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 4: Tentang Kami buka → BACK + HOME
  if (stage && stage.classList.contains('tentang-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 5: Gallery buka → BACK + HOME
  if (stage && stage.classList.contains('gallery-open')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
    return;
  }

  // Prioritas 6: Gate mode 'change' → BACK
  if (stage && stage.classList.contains('gate-edit-mode')) {
    ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
    return;
  }

  // Prioritas 7: Normal
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

// ===== NAVIGASI =====
function goToPage(pageName) {
  currentPage = pageName;
  pageHistory.push(pageName);
  updatePageClass();
  updateButtons();
  console.log('Pindah ke halaman:', pageName);
}

function goBack() {
  if (pageHistory.length > 1) {
    pageHistory.pop();
    currentPage = pageHistory[pageHistory.length - 1];
    updatePageClass();
    updateButtons();
  }
}

function goHome() {
  pageHistory = ['home'];
  currentPage = 'home';
  updatePageClass();
  updateButtons();
}

// ===== EVENT LISTENER =====
document.addEventListener('DOMContentLoaded', () => {
  updatePageClass();

  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  // ===== KLIK TOMBOL KIRI =====
  if (btnKiri) {
    btnKiri.addEventListener('click', (e) => {
      if (e.target.closest('.plat-nama')) return;

      const stage = document.getElementById('stage');

      // Prioritas 1: Headline popup buka → tutup
      if (stage && stage.classList.contains('headline-open')) {
        if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
        return;
      }

      // Prioritas 2: Mail buka → navigasi bertingkat
      if (stage && stage.classList.contains('mail-open')) {
        if (typeof mailGoBack === 'function') {
          mailGoBack();
        } else if (typeof closeMailModal === 'function') {
          closeMailModal();
        }
        return;
      }

      // Prioritas 3: Info serikat buka
      if (stage && stage.classList.contains('info-open')) {
        if (typeof infoGoBack === 'function' && infoGoBack()) {
          return;
        }
        if (typeof closeInfoModal === 'function') closeInfoModal();
        return;
      }

      // Prioritas 4: Tentang Kami buka → balik ke menu
      if (stage && stage.classList.contains('tentang-open')) {
        if (typeof closeTentangModal === 'function') closeTentangModal();
        return;
      }

      // Prioritas 5: Gallery buka
      if (stage && stage.classList.contains('gallery-open')) {
        const lb = document.getElementById('galleryLightbox');
        if (lb && lb.classList.contains('open')) {
          if (typeof closeLightbox === 'function') closeLightbox();
          return;
        }
        if (typeof closeGalleryModal === 'function') closeGalleryModal();
        return;
      }

      // Prioritas 6: Gate buka → close
      const gate = getGate();
      if (gate && gate.classList.contains('open')) {
        if (typeof closeGate === 'function') closeGate();
        return;
      }

      // Prioritas 7: Normal
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

      // Prioritas 1: Headline popup buka → tutup + home
      if (stage && stage.classList.contains('headline-open')) {
        if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 2: Mail buka → tutup + home
      if (stage && stage.classList.contains('mail-open')) {
        if (typeof closeMailModal === 'function') closeMailModal(true);
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 3: Info serikat buka → balik ke home
      if (stage && stage.classList.contains('info-open')) {
        if (typeof closeInfoModal === 'function') closeInfoModal(true);
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 4: Tentang Kami buka → tutup + home
      if (stage && stage.classList.contains('tentang-open')) {
        if (typeof closeTentangModal === 'function') closeTentangModal(true);
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 5: Gallery buka → tutup + home
      if (stage && stage.classList.contains('gallery-open')) {
        if (typeof closeGalleryModal === 'function') closeGalleryModal(true);
        if (typeof goHome === 'function') goHome();
        return;
      }

      // Prioritas 6: Gate buka → non-aktif
      const gate = getGate();
      if (gate && gate.classList.contains('open')) return;

      // Prioritas 7: Normal
      if (currentPage === 'home') {
        if (typeof openChatInput === 'function') openChatInput();
      } else {
        goHome();
      }
    });
  }
});

// ===== EXPOSE =====
window.goToPage = goToPage;
window.goBack = goBack;
window.goHome = goHome;
window.updateButtons = updateButtons;
window.updatePageClass = updatePageClass;

console.log('✅ menu.js loaded');
