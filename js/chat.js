/**
 * chat.js — Chat Box (Log Only) + Drag + Snap
 */

const chatBox = document.getElementById('chatBox');
const chatDrag = document.getElementById('chatDrag');

let isDragging = false;
let startPointer = { x: 0, y: 0 };
let startChatHeightPct = 25;
let currentChatHeightPct = 25;
let hasMoved = false;

const DEFAULT_PERCENT = 25;
const SNAP_THRESHOLD = 90;
const FULL_PERCENT = 100;
const MIN_PERCENT = 3;
const MOVE_THRESHOLD = 3;

function getPointer(e) {
  if (e.touches && e.touches.length) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function getVisualVH() {
  return isPortrait() ? window.innerWidth : window.innerHeight;
}

function onDown(e) {
  isDragging = true;
  hasMoved = false;
  startPointer = getPointer(e);
  startChatHeightPct = currentChatHeightPct;
  chatBox.classList.add('dragging');
  if (e.type === 'mousedown') e.preventDefault();
}
function onMove(e) {
  if (!isDragging) return;
  const pointer = getPointer(e);
  const dx = pointer.x - startPointer.x;
  const dy = pointer.y - startPointer.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!hasMoved && distance < MOVE_THRESHOLD) return;
  hasMoved = true;

  let movement;
  if (isPortrait()) {
    movement = dx;
  } else {
    movement = -dy;
  }

  const vh = getVisualVH();
  const percent = startChatHeightPct + (movement / vh) * 100;
  const clamped = Math.max(MIN_PERCENT, Math.min(FULL_PERCENT, percent));
  currentChatHeightPct = clamped;
  chatBox.style.height = clamped + '%';
  e.preventDefault();
}
function onUp() {
  if (!isDragging) return;
  isDragging = false;
  chatBox.classList.remove('dragging');
  if (!hasMoved) return;
  if (currentChatHeightPct > SNAP_THRESHOLD) {
    chatBox.style.height = FULL_PERCENT + '%';
    currentChatHeightPct = FULL_PERCENT;
  } else {
    chatBox.style.height = DEFAULT_PERCENT + '%';
    currentChatHeightPct = DEFAULT_PERCENT;
  }
}

chatDrag.addEventListener('mousedown', onDown);
document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
chatDrag.addEventListener('touchstart', onDown, { passive: true });
document.addEventListener('touchmove', onMove, { passive: false });
document.addEventListener('touchend', onUp);

console.log('✅ chat.js loaded');
