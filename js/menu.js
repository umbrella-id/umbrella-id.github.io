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

    // Prioritas 1: Headline popup
    if (stage && stage.classList.contains('headline-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 2: Mail
    if (stage && stage.classList.contains('mail-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 3: Info
    if (stage && stage.classList.contains('info-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 4: Tentang
    if (stage && stage.classList.contains('tentang-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 5: Gallery
    if (stage && stage.classList.contains('gallery-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 6: Kaitkan Akun (Verifikasi / Akun Saya)
    if (stage && stage.classList.contains('kaitkan-open')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        ikonKanan.innerHTML = '<img src="Assets/SVG_ICON-HOME.svg" alt="">';
        return;
    }

    // Prioritas 7: Gate edit
    if (stage && stage.classList.contains('gate-edit-mode')) {
        ikonKiri.innerHTML = '<img src="Assets/SVG_ICON-BACK.svg" alt="">';
        return;
    }

    // Prioritas 8: Normal
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

// ===== CEK APAKAH VERIFIED =====
function isVerifiedUid() {
  const uid = localStorage.getItem('u_uid') || '';
  return uid.endsWith('-v');
}

// ==========================================
// 🎯 UPDATE MODAL MENU ITEMS
// - Guest: menu "Logout Guest"
// - Member: menu "Akun Saya" (verifikasi & logout di dalam)
// - Verified: "Ganti Nama" hidden
// ==========================================
function updateModalMenuItems() {
    const uid = localStorage.getItem('u_uid') || '';
    const isGuest = uid.startsWith('G-');
    const isMember = uid.startsWith('M-');
    const isVerified = uid.endsWith('-v');
    
    // ==========================================
    // 1. Sembunyikan "Ganti Nama" untuk verified
    // ==========================================
    const gantiNamaBtn = document.querySelector('.modal-list-item[onclick*="ganti"]');
    if (gantiNamaBtn) {
        if (isVerified) {
            gantiNamaBtn.style.display = 'none';
        } else {
            gantiNamaBtn.style.display = '';
        }
    }
    
    // ==========================================
    // 2. Menu "Akun Saya" — HANYA member
    // ==========================================
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
                
                const tentangBtn = modalContent.querySelector('.modal-list-item[onclick*="tentang"]');
                if (tentangBtn) {
                    tentangBtn.insertAdjacentHTML('beforebegin', akunSayaHTML);
                } else {
                    modalContent.insertAdjacentHTML('beforeend', akunSayaHTML);
                }
            }
        }
    } else {
        if (akunSayaBtn) akunSayaBtn.remove();
    }
    
    // ==========================================
    // 3. Menu "Logout Guest" — HANYA guest
    // ==========================================
    let logoutGuestBtn = document.getElementById('menuLogoutGuest');
    
    if (isGuest) {
        if (!logoutGuestBtn) {
            const modalContent = document.querySelector('.modal-content');
            if (modalContent) {
                const logoutGuestHTML = `
                    <div class="btn-svg modal-list-item" id="menuLogoutGuest" onclick="menuClick('logout-guest')">
                        <div class="btn-ujung-kiri"></div>
                        <div class="btn-tengah"><span class="btn-teks">Logout Guest</span></div>
                        <div class="btn-ujung-kanan"></div>
                    </div>
                `;
                
                const tentangBtn = modalContent.querySelector('.modal-list-item[onclick*="tentang"]');
                if (tentangBtn) {
                    tentangBtn.insertAdjacentHTML('beforebegin', logoutGuestHTML);
                } else {
                    modalContent.insertAdjacentHTML('beforeend', logoutGuestHTML);
                }
            }
        }
    } else {
        if (logoutGuestBtn) logoutGuestBtn.remove();
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
          
          // 🎯 PRIORITAS PALING ATAS: Modal Login (kalau buka)
          if (typeof handleLoginModalBack === 'function' && handleLoginModalBack()) {
              return;
          }
  
          // Prioritas 1: Headline
          if (stage && stage.classList.contains('headline-open')) {
              if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
              return;
          }
  
          // Prioritas 2: Mail
          if (stage && stage.classList.contains('mail-open')) {
              if (typeof mailGoBack === 'function') {
                  mailGoBack();
              } else if (typeof closeMailModal === 'function') {
                  closeMailModal();
              }
              return;
          }
  
          // Prioritas 3: Info
          if (stage && stage.classList.contains('info-open')) {
              if (typeof infoGoBack === 'function' && infoGoBack()) {
                  return;
              }
              if (typeof closeInfoModal === 'function') closeInfoModal();
              return;
          }
  
          // Prioritas 4: Tentang
          if (stage && stage.classList.contains('tentang-open')) {
              if (typeof closeTentangModal === 'function') closeTentangModal();
              return;
          }
  
          // Prioritas 5: Gallery
          if (stage && stage.classList.contains('gallery-open')) {
              const lb = document.getElementById('galleryLightbox');
              if (lb && lb.classList.contains('open')) {
                  if (typeof closeLightbox === 'function') closeLightbox();
                  return;
              }
              if (typeof closeGalleryModal === 'function') closeGalleryModal();
              return;
          }
  
          // Prioritas 6: Kaitkan Akun (Verifikasi / Akun Saya)
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') {
                  closeKaitkanAkun();
              }
              return;
          }
  
          // Prioritas 7: Gate
          const gate = getGate();
          if (gate && gate.classList.contains('open')) {
              if (typeof closeGate === 'function') closeGate();
              return;
          }
  
          // Prioritas 8: Normal
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
  
          // Prioritas 1: Headline
          if (stage && stage.classList.contains('headline-open')) {
              if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 2: Mail
          if (stage && stage.classList.contains('mail-open')) {
              if (typeof closeMailModal === 'function') closeMailModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 3: Info
          if (stage && stage.classList.contains('info-open')) {
              if (typeof closeInfoModal === 'function') closeInfoModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 4: Tentang
          if (stage && stage.classList.contains('tentang-open')) {
              if (typeof closeTentangModal === 'function') closeTentangModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 5: Gallery
          if (stage && stage.classList.contains('gallery-open')) {
              if (typeof closeGalleryModal === 'function') closeGalleryModal(true);
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 6: Kaitkan Akun
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') {
                  closeKaitkanAkun(true);
              }
              if (typeof goHome === 'function') goHome();
              return;
          }
  
          // Prioritas 7: Gate
          const gate = getGate();
          if (gate && gate.classList.contains('open')) return;
  
          // Prioritas 8: Normal
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

console.log('✅ menu.js loaded (V3 — Logout Situasional)');
