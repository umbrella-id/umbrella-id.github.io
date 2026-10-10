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

    // 🎯 Prioritas 6: Kaitkan Akun (BARU)
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

// ===== CEK APAKAH VERIFIED (akhiran -v) =====
function isVerifiedUid() {
  const uid = localStorage.getItem('u_uid') || '';
  return uid.endsWith('-v');
}

// ==========================================
// 🎯 UPDATE MODAL MENU ITEMS
// - Sembunyikan "Ganti Nama" untuk verified
// - Tambah/update menu "Kaitkan Akun" / "Akun Saya"
// ==========================================
function updateModalMenuItems() {
    const uid = localStorage.getItem('u_uid') || '';
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
    // 2. Handle menu "Kaitkan Akun" / "Akun Saya"
    // ==========================================
    let kaitkanBtn = document.getElementById('menuKaitkanAkun');
    
    if (!isMember) {
        // Bukan member → hapus menu kalau ada
        if (kaitkanBtn) kaitkanBtn.remove();
        return;
    }
    
    // Kalau member → tampilkan menu (buat kalau belum ada)
    if (!kaitkanBtn) {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;
        
        const label = isVerified ? 'Akun Saya' : 'Kaitkan Akun';
        const action = isVerified ? 'akun-saya' : 'kaitkan';
        
        const kaitkanHTML = `
            <div class="btn-svg modal-list-item" id="menuKaitkanAkun" onclick="menuClick('${action}')">
                <div class="btn-ujung-kiri"></div>
                <div class="btn-tengah"><span class="btn-teks">${label}</span></div>
                <div class="btn-ujung-kanan"></div>
            </div>
        `;
        
        // Sisipkan sebelum tombol "Tentang Kami"
        const tentangBtn = modalContent.querySelector('.modal-list-item[onclick*="tentang"]');
        if (tentangBtn) {
            tentangBtn.insertAdjacentHTML('beforebegin', kaitkanHTML);
        } else {
            modalContent.insertAdjacentHTML('beforeend', kaitkanHTML);
        }
    } else {
        // Update label & onclick kalau sudah ada
        const label = kaitkanBtn.querySelector('.btn-teks');
        if (label) {
            label.innerText = isVerified ? 'Akun Saya' : 'Kaitkan Akun';
        }
        kaitkanBtn.setAttribute('onclick', `menuClick('${isVerified ? 'akun-saya' : 'kaitkan'}')`);
    }
}

// ===== EVENT LISTENER =====
document.addEventListener('DOMContentLoaded', () => {
  updatePageClass();
  updateModalMenuItems();   // ← BARU

  const btnKiri = document.getElementById('btnKiri');
  const btnKanan = document.getElementById('btnKanan');

  // ===== KLIK TOMBOL KIRI =====
  if (btnKiri) {
      btnKiri.addEventListener('click', (e) => {
          if (e.target.closest('.plat-nama')) return;
  
          const stage = document.getElementById('stage');
  
          // 🎯 Prioritas BARU: Modal Kaitkan buka
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') closeKaitkanAkun();
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
  
          // Prioritas 6: Gate
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
  
          // 🎯 Prioritas BARU: Modal Kaitkan buka → close + home
          if (stage && stage.classList.contains('kaitkan-open')) {
              if (typeof closeKaitkanAkun === 'function') closeKaitkanAkun();
              if (typeof goHome === 'function') goHome();
              return;
          }
  
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
  
          // Prioritas 6: Gate
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
window.updateModalMenuItems = updateModalMenuItems;
window.isVerifiedUid = isVerifiedUid;

console.log('✅ menu.js loaded (V2 — Filter Ganti Nama)');
