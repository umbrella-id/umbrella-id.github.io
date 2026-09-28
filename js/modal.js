/**
 * modal.js — Modal Menu Logic
 */

let modalTimer = null;

function openModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const chatBox = document.getElementById('chatBox');
  if (!modalOverlay) return;

  clearTimeout(modalTimer);

  if (chatBox) chatBox.classList.add('shifted');

  modalTimer = setTimeout(() => {
    modalOverlay.classList.add('open');
    void modalOverlay.offsetHeight;   // force reflow

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalOverlay.classList.add('animate-in');
        if (typeof updateButtons === 'function') updateButtons();
      });
    });
  }, 220);
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  const chatBox = document.getElementById('chatBox');
  if (!modalOverlay) return;

  clearTimeout(modalTimer);
  modalOverlay.classList.remove('animate-in');

  modalTimer = setTimeout(() => {
    modalOverlay.classList.remove('open');
    if (chatBox) chatBox.classList.remove('shifted');
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
  closeModal();
  setTimeout(() => {
    if (typeof goToPage === 'function') goToPage(type);
  }, 400);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.menuClick = menuClick;
console.log('✅ modal.js loaded');
