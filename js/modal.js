/**
 * modal.js — Modal Menu Logic 
 */

let modalTimer = null;

function openModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const chatBox = document.getElementById('chatBox');
  const stage = document.getElementById('stage');
  if (!modalOverlay) return;

  clearTimeout(modalTimer);
  
  if (typeof updateModalMenuItems === 'function') {
    updateModalMenuItems();
  }

  if (chatBox) chatBox.classList.add('shifted');
  if (stage) stage.classList.add('modal-open');

  modalTimer = setTimeout(() => {
    modalOverlay.classList.add('open');
    void modalOverlay.offsetHeight;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalOverlay.classList.add('animate-in');
        if (typeof updateButtons === 'function') updateButtons();
      });
    });
  }, 220);
}

function closeModal(skipModalOpenClass = false) {
  const modalOverlay = document.getElementById('modalOverlay');
  const chatBox = document.getElementById('chatBox');
  const stage = document.getElementById('stage');
  if (!modalOverlay) return;

  clearTimeout(modalTimer);
  modalOverlay.classList.remove('animate-in');

  modalTimer = setTimeout(() => {
    modalOverlay.classList.remove('open');
    if (chatBox) chatBox.classList.remove('shifted');

    if (stage && !skipModalOpenClass) {
      stage.classList.remove('modal-open');
    }

    if (typeof updateButtons === 'function') updateButtons();
  }, 350);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay && modalOverlay.classList.contains('open')) closeModal();
  }
});

function menuClick(type) {
  console.log('Menu dipilih:', type);

  closeModal(true);

  setTimeout(() => {
    if (type === 'kotak_surat') {
      if (typeof openMailModal === 'function') openMailModal();
    } 
    else if (type === 'info') {
      if (typeof openInfoModal === 'function') openInfoModal();
    } 
    else if (type === 'tentang') {
      if (typeof openTentangModal === 'function') openTentangModal();
    } 
    else if (type === 'gallery') {
      if (typeof openGalleryModal === 'function') openGalleryModal();
    }
    // 🎯 Akun Saya (member)
    else if (type === 'akun-saya') {
      if (typeof openAkunSaya === 'function') openAkunSaya();
    }
    // 🎯 Logout (guest)
    else if (type === 'logout') {
      if (typeof logoutAccount === 'function') logoutAccount();
    }
    else {
      if (typeof goToPage === 'function') goToPage(type);
    }

    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('modal-open');

    if (typeof updateButtons === 'function') updateButtons();
  }, 400);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.menuClick = menuClick;
console.log('✅ modal.js loaded');
