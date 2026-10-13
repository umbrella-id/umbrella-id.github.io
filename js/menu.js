/**
 * menu.js — Tombol Menu + Navigasi State (V5)
 * + Chat Maximized → Tombol Kiri Back
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

    // ==========================================
    // 🎯 PRIORITAS PALING ATAS: Chat Maximized
    // ==========================================
    if (typeof isChatMaximized === 'function' && isChatMaximized()) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-CHAT.svg" alt="">';
        return;
    }

    // Prioritas: Modal lain
    if (stage && stage.classList.contains('headline-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('mail-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('info-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('tentang-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('gallery-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('kaitkan-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    if (stage && stage.classList.contains('gate-edit-mode')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        return;
    }

    // Normal
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

// ===== CEK VERIFIED =====
function isVerifiedUid() {
  const uid = localStorage.getItem('u_uid') || '';
  return uid.endsWith('-v');
}

// ==========================================
// UPDATE MODAL MENU ITEMS
// ==========================================
function updateModalMenuItems() {
    const uid = localStorage.getItem('u_uid') || '';
    const isGuest = uid.startsWith('G-') || !uid;
    const isMember = uid.startsWith('M-');
    
    // Hapus "Ganti Nama" (kalau ada)
    const gantiNamaBtn = document.querySelector('.modal-list-item[onclick*="ganti"]');
    if (gantiNamaBtn) gantiNamaBtn.remove();
    
    // Menu "Logout" — guest
    let logoutBtn = document.getElementById('menuLogout');
    
    if (isGuest) {
        if (!logoutBtn) {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                const logoutHTML = `
                    <div class="btn-svg modal-list-item btn-danger" id="menuLogout" onclick="menuClick('logout')">
                        <div class="btn-ujung-kiri"></div>
                        <div class="btn-tengah"><span class="btn-teks">Logout</span></div>
                        <div class="btn-ujung-kanan"></div>
                    </div>
                `;
                modalContent.insertAdjacentHTML('beforeend', logoutHTML);
            }
        }
    } else {
        if (logoutBtn) logoutBtn.remove();
    }
    
    // Menu "Akun Saya" — member
    let akunSayaBtn = document.getElementById('menuAkunSaya');
    
    if (isMember) {
        if (!akunSayaBtn) {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                const akunSayaHTML = `
                    <div class="btn-svg modal-list-item" id="menuAkunSaya" onclick="menuClick('akun-saya')">
                        <div class="btn-ujung-kiri"></div>
                        <div class="btn-tengah"><span class="btn-teks">Akun Saya</span></div>
                        <div class="btn-ujung-kanan"></div>
                    </div>
                `;
                modalContent.insertAdjacentHTML('beforeend', akunSayaHTML);
            }
        }
    } else {
        if (akunSayaBtn) akunSayaBtn.remove();
    }
}

// ===== EVENT LISTENER =====
document.addEventListener('DOMContentLoaded', () => {
  updatePageClass();
  updateModalMenuItems();

  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  // ===== KLIK TOMBOL KIRI =====
  if (btnKiri) {
      btnKiri.addEventListener('click', (e) => {
          if (e.target.closest('.plat-nama')) return;
  
          const stage = document.getElementById('stage');
          
          // ==========================================
          // 🎯 PRIORITAS PALING ATAS: Chat Maximized
          // ==========================================
          if (typeof isChatMaximized === 'function' && isChatMaximized()) {
              if (typeof minimizeChatBox === 'function') minimizeChatBox();
              return;
          }
          
          // Prioritas: Modal Login
          if (typeof handleLoginModalBack === 'function' && handleLoginModalBack()) {
              return;
          }
  
          // Prioritas: Modal lain
          if (stage && stage.classList.contains('headline-open')) {
              if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
              return;
          }
  
          if (stage && stage.classList.contains('mail-open')) {
              if (typeof mailGoBack === 'function') {
                  mailGoBack();
              } else if (typeof closeMailModal === 'function') {
                  closeMailModal();
              }
              return;
          }
  
          if (stage && stage.classList.contains('info-open')) {
              if (typeof infoGoBack === 'function' && infoGoBack()) return;
              if (typeof closeInfoModal === 'function') closeInfoModal();
              return;
          }
  
          if (stage && stage.classList.contains('tentang-open')) {
              if (typeof closeTentangModal === 'function') closeTentangModal();
              return;
          }
  
          if (stage && stage.classList.contains('gallery-open')) {
              const lb = document.getElementById('galleryLightbox');
              if (lb && lb.classList.contains('open')) {
                  if (typeof closeLightbox === 'function') closeLightbox();
                  return;
              }
              if (typeof closeGalleryModal === 'function') closeGalleryModal();
              return;
          }
  
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') closeKaitkanAkun();
              return;
          }
  
          // Gate
          const gate = getGate();
          if (gate && gate.classList.contains('open')) {
              if (typeof closeGate === 'function') closeGate();
              return;
          }
  
          // Normal
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
  
          // 🎯 Prioritas: Chat Maximized → tetapkan
          if (typeof isChatMaximized === 'function' && isChatMaximized()) {
              // Tombol kanan saat chat maximized → tetap buka chat input
              if (typeof openChatInput === 'function') openChatInput();
              return;
          }
  
          // Prioritas: Modal lain
          if (stage && stage.classList.contains('headline-open')) {
              if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          if (stage && stage.classList.contains('mail-open')) {
              if (typeof closeMailModal === 'function') closeMailModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          if (stage && stage.classList.contains('info-open')) {
              if (typeof closeInfoModal === 'function') closeInfoModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          if (stage && stage.classList.contains('tentang-open')) {
              if (typeof closeTentangModal === 'function') closeTentangModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          if (stage && stage.classList.contains('gallery-open')) {
              if (typeof closeGalleryModal === 'function') closeGalleryModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') closeKaitkanAkun(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          const gate = getGate();
          if (gate && gate.classList.contains('open')) return;
  
          // Normal
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
window.updateModalMenuItems = updateModalMenuItems;
window.isVerifiedUid = isVerifiedUid;

console.log('✅ menu.js loaded (V5 — Chat Maximized Back)');
