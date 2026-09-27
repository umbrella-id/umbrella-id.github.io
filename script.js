/* ============================================
   AUTO SCALE STAGE
   ============================================ */
const BASE_HEIGHT = 300;

function resizeStage() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = vh / BASE_HEIGHT;
  const stageWidth = vw / scale;
  stage.style.width = stageWidth + 'px';
  stage.style.height = BASE_HEIGHT + 'px';
  stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
}

window.addEventListener('load', resizeStage);
window.addEventListener('resize', resizeStage);
window.addEventListener('orientationchange', resizeStage);

/* ============================================
   CHAT DRAG + SNAP
   ============================================ */
const chatBox = document.getElementById('chatBox');
const chatDrag = document.getElementById('chatDrag');

let isDragging = false;
let startY = 0;
let startHeight = 0;

const DEFAULT_PERCENT = 25;
const SNAP_THRESHOLD = 90;
const FULL_PERCENT = 100;
const MIN_PERCENT = 3;

function getY(e) {
  return e.clientY || (e.touches && e.touches[0].clientY) || 0;
}

function onDown(e) {
  isDragging = true;
  startY = getY(e);
  startHeight = chatBox.getBoundingClientRect().height;
  chatBox.classList.add('dragging');
  e.preventDefault();
}

function onMove(e) {
  if (!isDragging) return;
  const currentY = getY(e);
  const deltaY = startY - currentY;
  const vh = window.innerHeight;
  const newHeight = startHeight + deltaY;
  const percent = (newHeight / vh) * 100;
  const clamped = Math.max(MIN_PERCENT, Math.min(FULL_PERCENT, percent));
  chatBox.style.height = clamped + '%';
  e.preventDefault();
}

function onUp() {
  if (!isDragging) return;
  isDragging = false;
  chatBox.classList.remove('dragging');
  const vh = window.innerHeight;
  const h = chatBox.getBoundingClientRect().height;
  const p = (h / vh) * 100;
  chatBox.style.height = (p > SNAP_THRESHOLD ? FULL_PERCENT : DEFAULT_PERCENT) + '%';
}

chatDrag.addEventListener('mousedown', onDown);
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
chatDrag.addEventListener('touchstart', onDown, { passive: false });
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('touchend', onUp);

/* ============================================
   MODAL
   ============================================ */
const modalOverlay = document.getElementById('modalOverlay');

function openModal(type) {
  modalOverlay.classList.add('open');
  // Nanti bisa customize per type
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

// Klik overlay = close
modalOverlay.addEventListener('click', function(e) {
  if (e.target === modalOverlay) closeModal();
});

// ESC = close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
