/**
 * modal.js — Modal Menu Logic
 */

const modalOverlay2 = document.getElementById('modalOverlay');
let modalTimer = null;

function openModal() {
  clearTimeout(modalTimer);
  const chatBox = document.getElementById('chatBox');
  if (chatBox) chatBox.classList.add('shifted');

  modalTimer = setTimeout(() => {
    modalOverlay2.classList.add('open');
    void modalOverlay2.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalOverlay2.classList.add('animate-in');
        updateButtons();
      });
    });
  }, 220);
}

function closeModal() {
  clearTimeout(modalTimer);
  modalOverlay2.classList.remove('animate-in');

  modalTimer = setTimeout(() => {
    modalOverlay2.classList.remove('open');
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.classList.remove('shifted');
    updateButtons();
  }, 350);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalOverlay2.classList.contains('open')) closeModal();
  }
});

function menuClick(type) {
  console.log('Menu dipilih:', type);
  closeModal();
  setTimeout(() => goToPage(type), 400);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.menuClick = menuClick;
console.log('✅ modal.js loaded');
