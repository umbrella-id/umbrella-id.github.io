/**
 * identity.js — Identity Gate + UID/IGN + Ganti Nama (Cooldown 24 jam)
 */

// ===== KONFIG =====
const NAMA_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_UID = 'u_uid';
const STORAGE_IGN = 'u_ign';
const STORAGE_LAST_CHANGE = 'u_ign_changed_at';

// ===== INISIALISASI =====
window.myUID = localStorage.getItem(STORAGE_UID) || 'U-' + Math.random().toString(36).substring(2, 11);
window.myIGN = localStorage.getItem(STORAGE_IGN) || '';
localStorage.setItem(STORAGE_UID, window.myUID);

let gateMode = 'first';   // 'first' | 'change'

// ===== UI =====
function updateIdentityUI() {
  const display = document.getElementById('current-ign-display');
  if (display) display.innerText = window.myIGN || 'Guest';
}

function showGateMessage(msg, type = 'error') {
  const el = document.getElementById('gateMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('success');
  if (type === 'success') el.classList.add('success');
  el.classList.add('show');
}

function clearGateMessage() {
  const el = document.getElementById('gateMessage');
  if (!el) return;
  el.innerText = '';
  el.classList.remove('show', 'success');
}

// ===== COOLDOWN =====
function cekCooldownGantiNama() {
  const lastChange = parseInt(localStorage.getItem(STORAGE_LAST_CHANGE)) || 0;
  if (lastChange === 0) return { bisa: true, sisaMs: 0 };

  const elapsed = Date.now() - lastChange;
  const sisaMs = NAMA_COOLDOWN_MS - elapsed;

  if (sisaMs <= 0) return { bisa: true, sisaMs: 0 };
  return { bisa: false, sisaMs: sisaMs };
}

function formatSisaWaktu(ms) {
  const totalMenit = Math.ceil(ms / 60000);
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (jam > 0) return `${jam} jam ${menit} menit`;
  return `${menit} menit`;
}

// ===== BUKA GATE =====
function openGate(mode = 'first') {
  gateMode = mode;

  const gate = document.getElementById('gatekeeper');
  const input = document.getElementById('gate-input');
  const label = document.querySelector('.gate-label');
  const stage = document.getElementById('stage');
  if (!gate || !input) return;

  clearGateMessage();

  // Kelola class di stage
  if (stage) {
    stage.classList.remove('gate-first', 'gate-edit-mode');

    if (mode === 'change') {
      stage.classList.add('gate-edit-mode');
    } else {
      stage.classList.add('gate-first');
    }
  }

  if (mode === 'change') {
    const cd = cekCooldownGantiNama();
    if (!cd.bisa) {
      if (label) label.innerText = 'Ganti Nama';
      input.value = window.myIGN || '';
      input.disabled = true;
      showGateMessage('Kamu hanya bisa ganti nama 1× per 24 jam. Sisa: ' + formatSisaWaktu(cd.sisaMs));
      gate.classList.add('open');
      if (typeof updateButtons === 'function') updateButtons();
      return;
    }

    if (label) label.innerText = 'Ganti Nama Anda';
    input.value = window.myIGN || '';
    input.disabled = false;
  } else {
    if (label) label.innerText = 'Masukan Nama Anda';
    input.value = '';
    input.disabled = false;
  }

  gate.classList.add('open');

  if (typeof updateButtons === 'function') updateButtons();

  if (input && !input.disabled && window.innerWidth >= 768) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 300);
  }
}

// ===== SIMPAN IDENTITY =====
function saveIdentity() {
  const input = document.getElementById('gate-input');
  if (!input) return;

  clearGateMessage();

  let rawValue = input.value.trim();
  rawValue = rawValue.replace(/^[=+\-@]+/, '');

  if (rawValue === '') {
    input.focus();
    input.style.color = '#ff6666';
    setTimeout(() => input.style.color = '', 800);
    showGateMessage('Nama tidak boleh kosong');
    return;
  }

  rawValue = rawValue.substring(0, 15);

  if (gateMode === 'change' && rawValue === window.myIGN) {
    showGateMessage('Nama baru sama dengan nama lama');
    return;
  }

  window.myIGN = rawValue;
  localStorage.setItem(STORAGE_IGN, window.myIGN);

  if (gateMode === 'change') {
    localStorage.setItem(STORAGE_LAST_CHANGE, Date.now().toString());
  }

  updateIdentityUI();
  closeGate(true);   // ← SELESAI → skip menu, balik home

  // 🎭 Load NPC setelah gate tutup
  setTimeout(() => {
      if (typeof window.loadNpc === 'function') window.loadNpc();
  }, 500);
}

// ===== TUTUP GATE =====
// skipMenu = true  → langsung balik home (dari SELESAI)
// skipMenu = false → balik ke menu (dari tombol BACK)
function closeGate(skipMenu = false) {
  const gate = document.getElementById('gatekeeper');
  const stage = document.getElementById('stage');
  if (!gate) return;

  // Mode first: wajib isi nama
  if (gateMode === 'first' && !window.myIGN) {
    const input = document.getElementById('gate-input');
    if (input) {
      input.focus();
      input.style.color = '#ff6666';
      setTimeout(() => input.style.color = '', 800);
    }
    return;
  }

  const wasEditMode = (gateMode === 'change');

  gate.classList.remove('open');
  clearGateMessage();

  const input = document.getElementById('gate-input');
  if (input) input.disabled = false;

  // 🎯 Kalau edit mode & mau balik ke menu → tambah modal-open DULU
  if (wasEditMode && !skipMenu && stage) {
    stage.classList.add('modal-open');
  }

  if (stage) stage.classList.remove('gate-edit-mode', 'gate-first');

  gateMode = 'first';

  if (typeof updateButtons === 'function') updateButtons();

  // Setelah gate tutup → tampilkan headline
  if (!wasEditMode) {
    if (typeof initHeadlineDisplay === 'function') {
      setTimeout(() => {
        initHeadlineDisplay();
      }, 300);
    }
  }

  if (wasEditMode) {
    if (skipMenu) {
      if (typeof goHome === 'function') goHome();
    } else {
      setTimeout(() => {
        if (typeof openModal === 'function') openModal();
      }, 100);
    }
  }
  // 🎭 Load NPC setelah gate tutup
  setTimeout(() => {
      if (typeof window.loadNpc === 'function') window.loadNpc();
  }, 500);
}

// ===== INISIALISASI =====
document.addEventListener('DOMContentLoaded', () => {
  if (!window.myIGN) {
    openGate('first');
  } else {
    updateIdentityUI();
  }

  const input = document.getElementById('gate-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveIdentity();
    });
  }
});

// ===== EXPOSE =====
window.openGate = openGate;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
window.updateIdentityUI = updateIdentityUI;
window.cekCooldownGantiNama = cekCooldownGantiNama;
window.clearGateMessage = clearGateMessage;

console.log('✅ identity.js loaded');
