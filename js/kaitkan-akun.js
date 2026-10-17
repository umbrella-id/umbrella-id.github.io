/**
 * kaitkan-akun.js — Fitur Verifikasi Akun, Login, & Logout
 */

let isKaitkanPopupOpen = false;

// ==========================================
// CEK STATUS AKUN
// ==========================================
async function cekStatusAkun() {
    const uUid = localStorage.getItem('u_uid') || '';
    if (!uUid) return { hasAccount: false };
    if (!uUid.startsWith('M-')) return { hasAccount: false };
    
    try {
        const url = `${GAS.MAIN}?action=checkAccountStatus&uid=${encodeURIComponent(uUid)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.hasAccount && data.webUID && data.webUID !== uUid) {
            localStorage.setItem('u_uid', data.webUID);
            window.myUID = data.webUID;
        }
        
        return data;
    } catch(e) {
        return {
            hasAccount: uUid.endsWith('-v'),
            webUID: uUid.endsWith('-v') ? uUid : '',
            ign: localStorage.getItem('u_ign') || ''
        };
    }
}

// ==========================================
// BUKA MODAL VERIFIKASI
// ==========================================
function openKaitkanAkun() {
  const uid = localStorage.getItem('u_uid') || '';
  
  // Kalau sudah verified, buka Akun Saya
  if (uid.endsWith('-v')) {
    openAkunSaya();
    return;
  }
  
  if (typeof closeModal === 'function') closeModal(true);
  
  const overlay = document.getElementById('kaitkanOverlay');
  if (!overlay) return;
  
  // Reset form
  const codeInput = document.getElementById('verifyCodeInput');
  const idLoginInput = document.getElementById('verifyIdLoginInput');
  const passwordInput = document.getElementById('verifyPasswordInput');
  const msgEl = document.getElementById('kaitkanMessage');
  
  if (codeInput) { codeInput.value = ''; codeInput.disabled = false; }
  if (idLoginInput) { idLoginInput.value = ''; idLoginInput.disabled = false; }
  if (passwordInput) { passwordInput.value = ''; passwordInput.disabled = false; }
  if (msgEl) { msgEl.innerText = ''; msgEl.classList.remove('show', 'error'); }
  
  // Hapus notif sukses lama
  const oldNotif = document.getElementById('kaitkanSuccessNotif');
  if (oldNotif) oldNotif.remove();
  
  // Reset button
  const btn = document.getElementById('kaitkanSubmitBtn');
  if (btn) {
    btn.style.display = '';
    btn.classList.remove('loading');
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'VERIFIKASI';
  }
  
  overlay.classList.add('open');
  
  const stage = document.getElementById('stage');
  if (stage) stage.classList.add('kaitkan-open');
  
  if (typeof updateButtons === 'function') updateButtons();
  
  setTimeout(() => {
    if (codeInput) codeInput.focus();
  }, 300);
  
  isKaitkanPopupOpen = true;
}

// ==========================================
// TUTUP MODAL VERIFIKASI
// ==========================================
function closeKaitkanAkun(skipMenu = false) {
    const overlay = document.getElementById('kaitkanOverlay');
    const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
    const overlayLogout = document.getElementById('logoutConfirmOverlay');
    const stage = document.getElementById('stage');
    
    if (overlay) overlay.classList.remove('open');
    if (overlayAkun) overlayAkun.classList.remove('open');
    if (overlayLogout) overlayLogout.classList.remove('open');
    
    // 🎯 Set 'modal-open' DULU (sebelum remove 'kaitkan-open')
    // Biar banner mini tidak flicker di transisi
    if (!skipMenu && stage) {
        stage.classList.add('modal-open');
    }
    
    if (stage) stage.classList.remove('kaitkan-open');
    
    isKaitkanPopupOpen = false;
    
    if (typeof updateButtons === 'function') updateButtons();
    
    if (!skipMenu) {
        setTimeout(() => {
            if (typeof openModal === 'function') openModal();
        }, 150);
    }
}

// ==========================================
// SUBMIT VERIFIKASI
// ==========================================
async function submitKaitkanAkun() {
  const codeInput = document.getElementById('verifyCodeInput');
  const idLoginInput = document.getElementById('verifyIdLoginInput');
  const passwordInput = document.getElementById('verifyPasswordInput');
  const btn = document.getElementById('kaitkanSubmitBtn');
  
  if (!codeInput || !idLoginInput || !passwordInput || !btn) return;
  
  const code = codeInput.value.trim();
  const idLogin = idLoginInput.value.trim();
  const password = passwordInput.value;
  
  // Validasi
  if (!code || code.length !== 8) {
    showKaitkanMessage('Kode verifikasi harus 8 karakter', true);
    codeInput.focus();
    return;
  }
  
  if (!idLogin || idLogin.length < 3) {
    showKaitkanMessage('ID Login minimal 3 karakter', true);
    idLoginInput.focus();
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(idLogin)) {
    showKaitkanMessage('ID Login hanya boleh huruf, angka, underscore', true);
    idLoginInput.focus();
    return;
  }
  
  if (!password || password.length < 6) {
    showKaitkanMessage('Password minimal 6 karakter', true);
    passwordInput.focus();
    return;
  }
  
  // Loading
  btn.classList.add('loading');
  btn.style.pointerEvents = 'none';
  const btnText = btn.querySelector('.btn-teks');
  if (btnText) btnText.innerText = 'MEMPROSES...';
  showKaitkanMessage('');
  
  try {
    const url = `${GAS.MAIN}?action=activateAccount&code=${encodeURIComponent(code)}&idLogin=${encodeURIComponent(idLogin)}&password=${encodeURIComponent(password)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.success) {
      // Simpan UID verified
      localStorage.setItem('u_uid', data.webUID);
      localStorage.setItem('u_web_uid', data.webUID);
      localStorage.setItem('u_class', 'member');
      
      if (data.ign) {
        localStorage.setItem('u_ign', data.ign);
        window.myIGN = data.ign;
      }
      
      window.myUID = data.webUID;
      
      if (typeof updateIdentityUI === 'function') updateIdentityUI();
      
      showKaitkanSuccess();
      
      // Update menu
      if (typeof updateModalMenuItems === 'function') {
        setTimeout(() => updateModalMenuItems(), 500);
      }
      
    } else {
      showKaitkanMessage(data.message || 'Gagal verifikasi akun', true);
      btn.classList.remove('loading');
      btn.style.pointerEvents = '';
      if (btnText) btnText.innerText = 'VERIFIKASI';
    }
  } catch(e) {
    console.error('Submit verification error:', e);
    showKaitkanMessage('Koneksi gagal. Coba lagi.', true);
    btn.classList.remove('loading');
    btn.style.pointerEvents = '';
    if (btnText) btnText.innerText = 'VERIFIKASI';
  }
}

// ==========================================
// PESAN
// ==========================================
function showKaitkanMessage(msg, isError = false) {
    const el = document.getElementById('kaitkanMessage');
    if (!el) return;
    
    el.innerText = msg || '';
    el.classList.remove('error', 'success');
    if (isError) el.classList.add('error');
    if (msg) el.classList.add('show');
    else el.classList.remove('show');
}

// ==========================================
// SUKSES
// ==========================================
function showKaitkanSuccess() {
  const codeInput = document.getElementById('verifyCodeInput');
  const idLoginInput = document.getElementById('verifyIdLoginInput');
  const passwordInput = document.getElementById('verifyPasswordInput');
  
  if (codeInput) codeInput.disabled = true;
  if (idLoginInput) idLoginInput.disabled = true;
  if (passwordInput) passwordInput.disabled = true;
  
  const btn = document.getElementById('kaitkanSubmitBtn');
  if (btn) btn.style.display = 'none';
  
  const msgEl = document.getElementById('kaitkanMessage');
  if (msgEl) { msgEl.innerText = ''; msgEl.classList.remove('show', 'error'); }
  
  const oldNotif = document.getElementById('kaitkanSuccessNotif');
  if (oldNotif) oldNotif.remove();
  
  const form = document.querySelector('#kaitkanOverlay .kaitkan-form');
  if (form) {
    const notifHTML = `
      <div class="kaitkan-success-notif" id="kaitkanSuccessNotif">
        <i class="fas fa-check-circle"></i>
        Akun berhasil diverifikasi! Badge hijau + centang aktif.
      </div>
    `;
    form.insertAdjacentHTML('beforeend', notifHTML);
  }
  
  // Auto-close setelah 2 detik
  setTimeout(() => {
    if (typeof closeKaitkanAkun === 'function') {
      closeKaitkanAkun(true);
    }
  }, 2000);
}

// ==========================================
// 🎯 AKUN SAYA — Ukuran Tombol Tetap
// ==========================================
async function openAkunSaya() {
    const uid = localStorage.getItem('u_uid') || '';
    const ign = localStorage.getItem('u_ign') || 'Member';
    const savedKode = localStorage.getItem('u_web_kode') || '';
    const isVerified = uid.endsWith('-v');
    
    if (typeof closeModal === 'function') closeModal(true);
    
    const overlay = document.getElementById('kaitkanAkunSayaOverlay');
    if (!overlay) return;
    
    const bodyEl = overlay.querySelector('.kaitkan-body');
    if (!bodyEl) return;
    
    if (isVerified) {
        // ==========================================
        // VERIFIED — 1 tombol
        // ==========================================
        bodyEl.innerHTML = `
            <p class="kaitkan-desc">Akun Anda sudah terverifikasi</p>
            
            <div class="kaitkan-info-row">
                <span class="kaitkan-info-label">IGN:</span>
                <strong class="kaitkan-info-value">${escapeHtmlKaitkan(ign)}</strong>
            </div>
            
            <div class="kaitkan-info-row">
                <span class="kaitkan-info-label">Status:</span>
                <strong class="kaitkan-info-value" style="color:#4ade80;">Terverifikasi</strong>
            </div>
            
            <div class="kaitkan-info-row">
                <span class="kaitkan-info-label">Kode:</span>
                <strong class="kaitkan-info-value" style="color:#4ade80; font-family:monospace; letter-spacing:3px;">${savedKode ? escapeHtmlKaitkan(savedKode) : '—'}</strong>
            </div>
            
            <p class="kaitkan-save-text">Simpan kode ini untuk login</p>
            
            <div class="akun-btn-row">
                <div class="btn-svg akun-btn-logout" onclick="logoutAccount()">
                    <div class="btn-ujung-kiri"></div>
                    <div class="btn-tengah"><span class="btn-teks">LOGOUT</span></div>
                    <div class="btn-ujung-kanan"></div>
                </div>
            </div>
        `;
    } else {
        // ==========================================
        // BELUM VERIFIED — 2 tombol
        // ==========================================
        bodyEl.innerHTML = `
            <p class="kaitkan-desc">Akun Anda belum diverifikasi</p>
            
            <div class="kaitkan-info-row">
                <span class="kaitkan-info-label">IGN:</span>
                <strong class="kaitkan-info-value">${escapeHtmlKaitkan(ign)}</strong>
            </div>
            
            <div class="kaitkan-info-row">
                <span class="kaitkan-info-label">Status:</span>
                <strong class="kaitkan-info-value" style="color:#f59e0b;">Belum Verifikasi</strong>
            </div>
            
            <p class="kaitkan-verify-hint">
                Verifikasi akun diperlukan untuk login multi device.
            </p>
            
            <div class="akun-btn-row">
                <div class="btn-svg akun-btn-verify" onclick="openVerifikasiFromAkun()">
                    <div class="btn-ujung-kiri"></div>
                    <div class="btn-tengah"><span class="btn-teks">VERIFIKASI</span></div>
                    <div class="btn-ujung-kanan"></div>
                </div>
                
                <div class="btn-svg akun-btn-logout" onclick="logoutAccount()">
                    <div class="btn-ujung-kiri"></div>
                    <div class="btn-tengah"><span class="btn-teks">LOGOUT</span></div>
                    <div class="btn-ujung-kanan"></div>
                </div>
            </div>
        `;
    }
    
    overlay.classList.add('open');
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    
    if (typeof updateButtons === 'function') updateButtons();
    
    isKaitkanPopupOpen = true;
}

// ==========================================
// 🎯 BUKA VERIFIKASI DARI AKUN SAYA
// ==========================================
function openVerifikasiFromAkun() {
    const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
    if (overlayAkun) overlayAkun.classList.remove('open');
    
    setTimeout(() => {
        openKaitkanAkun();
    }, 200);
}

// ==========================================
// 🎯 TOGGLE MODAL LOGIN
// ==========================================
function toggleLoginModal() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('open')) {
        closeLoginModal();
    } else {
        openLoginModal();
    }
}

// ==========================================
// 🎯 BUKA MODAL LOGIN
// ==========================================
function openLoginModal() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (!overlay) return;
    
    const waInput = document.getElementById('loginMemberWa');
    const kodeInput = document.getElementById('loginMemberKode');
    const msgEl = document.getElementById('loginMemberMessage');
    
    if (waInput) waInput.value = '';
    if (kodeInput) kodeInput.value = '';
    if (msgEl) { msgEl.innerText = ''; msgEl.classList.remove('show', 'error', 'success'); }
    
    const btn = document.getElementById('loginMemberSubmitBtn');
    if (btn) {
        btn.style.pointerEvents = '';
        const btnText = btn.querySelector('.btn-teks');
        if (btnText) btnText.innerText = 'LOGIN';
    }
    
    overlay.classList.add('open');
    
    updateGateLoginBtn(true);
    
    setTimeout(() => {
        if (waInput) waInput.focus();
    }, 300);
}

// ==========================================
// 🎯 TUTUP MODAL LOGIN
// ==========================================
function closeLoginModal() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (overlay) overlay.classList.remove('open');
    
    updateGateLoginBtn(false);
}

// ==========================================
// 🎯 UPDATE TEKS TOMBOL GATE LOGIN
// ==========================================
function updateGateLoginBtn(isOpen) {
    const btnText = document.getElementById('gateLoginBtnText');
    const btnIcon = document.querySelector('#gateLoginBtn i');
    
    if (!btnText) return;
    
    if (isOpen) {
        btnText.innerText = 'TUTUP';
        if (btnIcon) btnIcon.className = 'fas fa-times';
    } else {
        btnText.innerText = 'LOGIN';
        if (btnIcon) btnIcon.className = 'fas fa-sign-in-alt';
    }
}

// ==========================================
// 🎯 SUBMIT LOGIN
// ==========================================
async function submitLoginModal() {
    const waInput = document.getElementById('loginMemberWa');
    const kodeInput = document.getElementById('loginMemberKode');
    const btn = document.getElementById('loginMemberSubmitBtn');
    
    if (!waInput || !kodeInput || !btn) return;
    
    let wa = waInput.value.trim().replace(/\D/g, '');
    let kode = kodeInput.value.trim();
    
    if (!wa || wa.length < 10) {
        showLoginMemberMessage('Masukkan nomor WA lengkap', true);
        waInput.focus();
        return;
    }
    
    if (!kode || kode.length !== 6) {
        showLoginMemberMessage('Masukkan kode 6 digit', true);
        kodeInput.focus();
        return;
    }
    
    btn.style.pointerEvents = 'none';
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'MEMPROSES...';
    showLoginMemberMessage('');
    
    try {
        const url = `${GAS.MAIN}?action=loginVerified&wa=${encodeURIComponent(wa)}&code=${encodeURIComponent(kode)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_ign', data.ign);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_web_kode', kode);
            localStorage.setItem('u_class', 'member');
            
            window.myUID = data.webUID;
            window.myIGN = data.ign;
            
            if (typeof updateIdentityUI === 'function') updateIdentityUI();
            
            showLoginMemberMessage('✅ Login berhasil!', false, true);
            
            setTimeout(() => {
                closeLoginModal();
                if (typeof closeGate === 'function') closeGate(true);
                if (typeof buildMenu === 'function') setTimeout(() => buildMenu(), 300);
                if (typeof cekStatusAkun === 'function') setTimeout(() => cekStatusAkun(), 500);
            }, 800);
        } else {
            showLoginMemberMessage(data.message || 'Login gagal', true);
            btn.style.pointerEvents = '';
            if (btnText) btnText.innerText = 'LOGIN';
        }
    } catch(e) {
        showLoginMemberMessage('Koneksi gagal. Coba lagi.', true);
        btn.style.pointerEvents = '';
        if (btnText) btnText.innerText = 'LOGIN';
    }
}

function showLoginMemberMessage(msg, isError = false, isSuccess = false) {
    const el = document.getElementById('loginMemberMessage');
    if (!el) return;
    
    el.innerText = msg || '';
    el.classList.remove('error', 'success');
    if (isError) el.classList.add('error');
    if (isSuccess) el.classList.add('success');
}

// ==========================================
// 🎯 HANDLE TOMBOL BACK — Modal Login
// ==========================================
function handleLoginModalBack() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (!overlay) return false;
    
    if (overlay.classList.contains('open')) {
        closeLoginModal();
        return true;
    }
    
    return false;
}

document.addEventListener('click', function(e) {
    const overlay = document.getElementById('loginMemberOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('open') && e.target === overlay) {
        closeLoginModal();
    }
});

// ==========================================
// 🎯 LOGOUT — Modal Konfirmasi
// ==========================================
function logoutAccount() {
    const overlay = document.getElementById('logoutConfirmOverlay');
    if (!overlay) {
        console.warn('Modal logout tidak ditemukan');
        return;
    }
    
    // Tutup modal menu (kalau terbuka)
    if (typeof closeModal === 'function') closeModal(true);
    
    // 🎯 Tutup modal Akun Saya (kalau terbuka)
    const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
    if (overlayAkun) overlayAkun.classList.remove('open');
    
    // Tutup modal Verifikasi (kalau terbuka)
    const overlayVerif = document.getElementById('kaitkanOverlay');
    if (overlayVerif) overlayVerif.classList.remove('open');
    
    // Buka modal konfirmasi logout
    overlay.classList.add('open');
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    
    if (typeof updateButtons === 'function') updateButtons();
    
    isKaitkanPopupOpen = true;
}

// ==========================================
// 🎯 KONFIRMASI LOGOUT — YES
// ==========================================
function confirmLogoutYes() {
    const uid = localStorage.getItem('u_uid') || '';
    const isGuest = uid.startsWith('G-') || !uid;
    const isMember = uid.startsWith('M-');
    
    closeLogoutConfirm();
    
    if (isMember) {
        executeLogoutMember();
    } else if (isGuest) {
        executeLogoutGuest();
    }
}

// ==========================================
// 🎯 TUTUP MODAL KONFIRMASI LOGOUT
// ==========================================
function closeLogoutConfirm(skipMenu = false) {
    const overlay = document.getElementById('logoutConfirmOverlay');
    if (overlay) overlay.classList.remove('open');
    
    isKaitkanPopupOpen = false;
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('kaitkan-open');
    
    if (typeof updateButtons === 'function') updateButtons();
}

// ==========================================
// 🎯 LOGOUT GUEST
// ==========================================
function executeLogoutGuest() {
    localStorage.setItem('u_ign', '');
    clearUmbrellaSession();
    
    window.myIGN = '';
    
    if (typeof showToast === 'function') showToast('✅ Logout berhasil');
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

// ==========================================
// 🎯 LOGOUT MEMBER
// ==========================================
function executeLogoutMember() {
    localStorage.removeItem('u_uid');
    localStorage.removeItem('u_ign');
    localStorage.removeItem('u_web_uid');
    localStorage.removeItem('u_web_kode');
    localStorage.removeItem('u_class');
    localStorage.removeItem('u_ign_changed_at');
    
    clearUmbrellaSession();
    
    if (typeof showToast === 'function') showToast('✅ Logout berhasil');
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

// ==========================================
// 🎯 HELPER
// ==========================================
function clearUmbrellaSession() {
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('umbrella_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// ==========================================
// UTILITY
// ==========================================
function escapeHtmlKaitkan(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#39;';
        return m;
    });
}

// ==========================================
// EXPOSE
// ==========================================
window.openKaitkanAkun = openKaitkanAkun;
window.closeKaitkanAkun = closeKaitkanAkun;
window.submitKaitkanAkun = submitKaitkanAkun;
window.openAkunSaya = openAkunSaya;
window.openVerifikasiFromAkun = openVerifikasiFromAkun;
window.cekStatusAkun = cekStatusAkun;
window.toggleLoginModal = toggleLoginModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.submitLoginModal = submitLoginModal;
window.handleLoginModalBack = handleLoginModalBack;
window.logoutAccount = logoutAccount;
window.confirmLogoutYes = confirmLogoutYes;
window.closeLogoutConfirm = closeLogoutConfirm;
window.executeLogoutMember = executeLogoutMember;
window.executeLogoutGuest = executeLogoutGuest;
window.isKaitkanPopupOpen = () => isKaitkanPopupOpen;

console.log('✅ kaitkan-akun.js loaded (V3 — Modal Konfirmasi Logout)');
