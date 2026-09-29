/**
 * identity.js — Identity Gate + UID/IGN + Ganti Nama (Cooldown 24 jam)
 */

// ===== KONFIG =====
const NAMA_COOLDOWN_MS = 24 * 60 * 60 * 1000;   // 24 jam
const STORAGE_UID = 'u_uid';
const STORAGE_IGN = 'u_ign';
const STORAGE_LAST_CHANGE = 'u_ign_changed_at';

// ===== INISIALISASI =====
window.myUID = localStorage.getItem(STORAGE_UID) || 'U-' + Math.random().toString(36).substring(2, 11);
window.myIGN = localStorage.getItem(STORAGE_IGN) || '';
localStorage.setItem(STORAGE_UID, window.myUID);

// Mode gate: 'first' (pertama kali) atau 'change' (ganti nama)
let gateMode = 'first';

// ===== UI =====
function updateIdentityUI() {
  const display = document.getElementById('current-ign-display');
  if (display) display.innerText = window.myIGN || 'Guest';
}

// ===== CEK COOLDOWN =====
function cekCooldownGantiNama() {
  const lastChange = parseInt(localStorage.getItem(STORAGE_LAST_CHANGE)) || 0;
  if (lastChange === 0) return { bisa: true, sisaMs: 0 };

  const elapsed = Date.now() - lastChange;
  const sisaMs = NAMA_COOLDOWN_MS - elapsed;

  if (sisaMs <= 0) return { bisa: true, sisaMs: 0 };
  return { bisa: false, sisaMs: sisaMs };
}

// Format sisa waktu "X jam Y menit"
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
  if (!gate || !input) return;

  // Kalau mode 'change', cek cooldown dulu
  if (mode === 'change') {
    const cd = cekCooldownGantiNama();
    if (!cd.bisa) {
      alert('Kamu hanya bisa ganti nama 1× per 24 jam.\nSisa: ' + formatSisaWaktu(cd.sisaMs));
      return;
    }
    if (label) label.innerText = 'Ganti Nama Anda';
    input.value = window.myIGN || '';
  } else {
    if (label) label.innerText = 'Masukan Nama Anda';
    input.value = '';
  }

  gate.classList.add('open');

  if (input && window.innerWidth >= 768) {
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

  let rawValue = input.value.trim();
  rawValue = rawValue.replace(/^[=+\-@]+/, '');

  if (rawValue === '') {
    input.focus();
    input.style.color = '#ff6666';
    setTimeout(() => input.style.color = '', 800);
    return;
  }

  rawValue = rawValue.substring(0, 15);

  // Kalau mode 'change' dan nama baru SAMA dengan yang lama → tolak
  if (gateMode === 'change' && rawValue === window.myIGN) {
    alert('Nama baru sama dengan nama lama.');
    return;
  }

  window.myIGN = rawValue;
  localStorage.setItem(STORAGE_IGN, window.myIGN);

  // Kalau mode 'change', catat timestamp
  if (gateMode === 'change') {
    localStorage.setItem(STORAGE_LAST_CHANGE, Date.now().toString());
  }

  updateIdentityUI();
  closeGate();
}

// ===== TUTUP GATE =====
function closeGate() {
  const gate = document.getElementById('gatekeeper');
  if (!gate) return;

  // Gate WAJIB diisi — kalau kosong, jangan tutup
  if (gateMode === 'first' && !window.myIGN) {
    const input = document.getElementById('gate-input');
    if (input) {
      input.focus();
      input.style.color = '#ff6666';
      setTimeout(() => input.style.color = '', 800);
    }
    return;
  }

  gate.classList.remove('open');
  gateMode = 'first';
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

console.log('✅ identity.js loaded');
