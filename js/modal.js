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

  if (chatBox) chatBox.classList.add('shifted');
  if (stage) stage.classList.add('modal-open');   // sembunyikan banner

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

// skipModalOpenClass = true → JANGAN hapus modal-open
//                       (untuk transisi ke halaman/modal lain)
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

    // 🎯 Cuma hapus modal-open kalau tidak skip
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

  // 🎯 closeModal dengan skip=TRUE → modal-open tetap ada
  closeModal(true);

  setTimeout(() => {
    // Pindah halaman / buka modal lain
    if (type === 'ganti') {
      if (typeof openGate === 'function') openGate('change');
    } else if (type === 'kirim') {
      if (typeof openMailForm === 'function') openMailForm();
    } else if (type === 'info') {
      if (typeof openInfoModal === 'function') openInfoModal();
    } else {
      if (typeof goToPage === 'function') goToPage(type);
    }

    // 🎯 Sekarang baru hapus modal-open
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('modal-open');

    if (typeof updateButtons === 'function') updateButtons();
  }, 400);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.menuClick = menuClick;
console.log('✅ modal.js loaded');
