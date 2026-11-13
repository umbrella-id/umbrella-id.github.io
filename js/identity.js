/**
 * identity.js — Identity Gate + UID/IGN + Ganti Nama (Cooldown 24 jam)
 * V2 — Prefix G- untuk Guest + Sanitasi IGN
 */

// ===== KONFIG =====
const NAMA_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_UID = 'u_uid';
const STORAGE_IGN = 'u_ign';
const STORAGE_LAST_CHANGE = 'u_ign_changed_at';

// ===== INISIALISASI =====
window.myUID = localStorage.getItem(STORAGE_UID) || '';
window.myIGN = localStorage.getItem(STORAGE_IGN) || '';
// Note: Guest UID sekarang dibuat server-side via ensureGuestSession()

let gateMode = 'first';

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

// ===== VALIDASI IGN =====
function sanitizeIGN(raw) {
  if (!raw) return '';
  
  let value = raw.trim();
  
  value = value.replace(/[\[\]]/g, '');
  value = value.replace(/^[=+\-@]+/, '');
  value = value.replace(/\s+/g, ' ').trim();
  
  if (/admin/i.test(value)) {
    return { error: 'Nama tidak boleh mengandung kata "admin"' };
  }
  
  if (value.length > 15) {
    value = value.substring(0, 15);
  }
  
  if (value === '') {
    return { error: 'Nama tidak boleh kosong' };
  }
  
  return { value: value };
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

// ===== CEK APAKAH MEMBER =====
function isMember() {
  const uid = localStorage.getItem('u_uid') || '';
  return uid.startsWith('M-');
}

// ===== BUKA GATE =====
function openGate(mode = 'first') {
  gateMode = mode;

  // 🎯 Safety: kalau headline popup somehow sudah terbuka, tutup dulu
  const headlineOverlay = document.getElementById('headlineOverlay');
  if (headlineOverlay && headlineOverlay.classList.contains('open')) {
    if (typeof closeHeadlinePopup === 'function') closeHeadlinePopup();
  }

  const gate = document.getElementById('gatekeeper');
  const input = document.getElementById('gate-input');
  const label = document.querySelector('.gate-label');
  const stage = document.getElementById('stage');
  if (!gate || !input) return;

  clearGateMessage();

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

  const result = sanitizeIGN(input.value);
  
  if (result.error) {
    input.focus();
    input.style.color = '#ff6666';
    setTimeout(() => input.style.color = '', 800);
    showGateMessage(result.error);
    return;
  }

  const newIgn = result.value;

  if (gateMode === 'change' && newIgn === window.myIGN) {
    showGateMessage('Nama baru sama dengan nama lama');
    return;
  }

  window.myIGN = newIgn;
  localStorage.setItem(STORAGE_IGN, window.myIGN);

  if (gateMode === 'change') {
    localStorage.setItem(STORAGE_LAST_CHANGE, Date.now().toString());
  }

  updateIdentityUI();
  closeGate(true);

  setTimeout(() => {
      if (typeof window.loadNpc === 'function') window.loadNpc();
  }, 500);
}

// ===== TUTUP GATE =====
function closeGate(skipMenu = false) {
  const gate = document.getElementById('gatekeeper');
  const stage = document.getElementById('stage');
  if (!gate) return;

  // Reset login state kalau ada
  if (typeof loginModalPreviousState !== 'undefined') {
      if (window.loginModalPreviousState) {
          window.loginModalPreviousState = null;
      }
  }

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

  if (wasEditMode && !skipMenu && stage) {
    stage.classList.add('modal-open');
  }

  if (stage) stage.classList.remove('gate-edit-mode', 'gate-first');

  gateMode = 'first';

  if (typeof updateButtons === 'function') updateButtons();

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

  if (typeof cekStatusAkun === 'function') {
    setTimeout(() => {
      const result = cekStatusAkun();  // sekarang sinkron
      if (result.hasAccount && result.webUID) {
        const currentUid = localStorage.getItem('u_uid');
        if (result.webUID !== currentUid) {
          if (typeof updateModalMenuItems === 'function') updateModalMenuItems();
        }
      }
    }, 600);
  }
  
  setTimeout(() => {
      if (typeof window.loadNpc === 'function') window.loadNpc();
  }, 500);
}

// ==========================================
// 🎯 PURGE FULL USER LOCAL STATE
// Dipanggil saat token invalid — hapus SEMUA jejak user,
// bukan hanya uid + token. User baru tidak boleh lihat data lama.
// ==========================================
function purgeUserLocalState(oldUid) {
  // === localStorage: user-scoped ===
  localStorage.removeItem('u_uid');
  localStorage.removeItem('u_ign');
  localStorage.removeItem('u_web_uid');
  localStorage.removeItem('u_class');
  localStorage.removeItem('u_ign_changed_at');
  localStorage.removeItem('umbrella_session_token');
  localStorage.removeItem('umbrella_member_session');
  localStorage.removeItem('umbrella_mute_expiry');
  
  // Per-uid mail read marker
  if (oldUid) {
    localStorage.removeItem('umbrella_mail_read_' + oldUid);
  }
  
  // === In-memory ===
  window.myUID = '';
  window.myIGN = '';
  
  // === sessionStorage: semua umbrella_* ===
  // (chat cache, mail cache, stamp, headline seen, mute notif, dll)
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('umbrella_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('🧹 Purge local state (oldUid=' + (oldUid || 'none') + ')');
}

window.purgeUserLocalState = purgeUserLocalState;

// ==========================================
// 🎯 ENSURE GUEST SESSION (server-issued via GAS1)
// ==========================================
let __guestSessionPromise = null;

function ensureGuestSession() {
  if (__guestSessionPromise) return __guestSessionPromise;
  
  __guestSessionPromise = (async () => {
    const token = localStorage.getItem('umbrella_session_token');
    const uid = localStorage.getItem('u_uid');
    
    // === M- SESSION (member verified) ===
    if (uid && uid.startsWith('M-') && token) {
      try {
        const data = await API.validateGuestSession(uid, token);
        if (data.valid) {
          window.myUID = uid;
          return { uid, token };
        }
      } catch(e) {
        console.warn('Session validation error (M-):', e);
      }
      // Token invalid / expired → purge full
      purgeUserLocalState(uid);
    }
    
    // === G- SESSION (guest) ===
    if (uid && uid.startsWith('G-') && token) {
      try {
        const data = await API.validateGuestSession(uid, token);
        if (data.valid) {
          window.myUID = uid;
          console.log('✅ Guest session valid:', uid);
          return { uid, token };
        }
      } catch(e) {
        console.warn('Session validation error (G-):', e);
      }
      // Token invalid / expired → purge full
      purgeUserLocalState(uid);
    }
    
    // === CREATE FRESH GUEST SESSION ===
    try {
      const ua = (navigator.userAgent || 'unknown').substring(0, 100);
      const data = await API.createGuestSession(ua);
      
      if (data.status === 'success' && data.uid && data.sessionToken) {
        localStorage.setItem('u_uid', data.uid);
        localStorage.setItem('umbrella_session_token', data.sessionToken);
        window.myUID = data.uid;
        console.log('✅ Guest session created:', data.uid);
        return { uid: data.uid, token: data.sessionToken };
      }
      
      if (data.status === 'rate_limited') {
        console.warn('⚠️ Rate limited:', data.message);
      } else {
        console.error('Guest session failed:', data.message || data);
      }
    } catch(e) {
      console.error('Guest session creation error:', e);
    }
    
    return null;
  })();
  
  return __guestSessionPromise;
}

// ===== INISIALISASI =====
document.addEventListener('DOMContentLoaded', async () => {
  // ==========================================
  // 1. GATE STATE — SYNCHRONOUS (no network wait)
  // ==========================================
  if (!window.myIGN) {
    // First timer → buka gate INSTAN
    // gate-first dari HTML tetap aktif → semua element hidden
    openGate('first');
  } else {
    // Return user → remove gate-first → semua element muncul
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('gate-first');
    updateIdentityUI();
  }
  
  // ==========================================
  // 2. INPUT HANDLER — SYNCHRONOUS
  // ==========================================
  const input = document.getElementById('gate-input');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveIdentity();
    });
  }
  
  // ==========================================
  // 3. GUEST SESSION — BACKGROUND (no await blocking UI)
  // ==========================================
  const session = await ensureGuestSession();
  if (!session) {
    console.error('❌ Tidak bisa membuat sesi. Guest tidak bisa chat/mail.');
    // User tetap bisa lihat UI + gate. Chat/mail akan fail dengan aman
    // via requireSession() — chat-input.js & mail.js sudah handle
  } else {
    console.log('✅ Session siap:', session.uid);
  }
});

// ===== EXPOSE =====
window.openGate = openGate;
window.saveIdentity = saveIdentity;
window.closeGate = closeGate;
window.updateIdentityUI = updateIdentityUI;
window.cekCooldownGantiNama = cekCooldownGantiNama;
window.clearGateMessage = clearGateMessage;
window.isMember = isMember;
window.sanitizeIGN = sanitizeIGN;
window.ensureGuestSession = ensureGuestSession;

console.log('✅ identity.js loaded (V2 — Prefix G- + Sanitasi IGN)');
