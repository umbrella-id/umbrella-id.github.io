/**
 * akun.js — Fitur Verifikasi Akun, Login, & Logout
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
    
    if (uid.endsWith('-v')) {
        openAkunSaya();
        return;
    }
    
    if (typeof closeModal === 'function') closeModal(true);
    
    const overlay = document.getElementById('kaitkanOverlay');
    if (!overlay) return;
    
    // Reset ke Tahap 1
    backToStage1();
    
    const codeInput = document.getElementById('verifyCodeInput');
    const idInput = document.getElementById('verifyIdLoginInput');
    const pwInput = document.getElementById('verifyPasswordInput');
    const hint = document.getElementById('verifyHint');
    
    if (codeInput) { codeInput.value = ''; codeInput.disabled = false; }
    if (idInput) { idInput.value = ''; idInput.disabled = false; }
    if (pwInput) { pwInput.value = ''; pwInput.disabled = false; }
    if (hint) hint.style.display = 'none';
    
    showVerifyMessage(1, '');
    showVerifyMessage(2, '');
    
    const oldNotif = document.getElementById('kaitkanSuccessNotif');
    if (oldNotif) oldNotif.remove();
    
    // Reset button Tahap 1
    const btn1 = document.getElementById('verifyStage1Btn');
    if (btn1) {
        btn1.style.display = '';
        btn1.classList.remove('loading');
        btn1.style.pointerEvents = '';
        const btnText = btn1.querySelector('.btn-teks');
        if (btnText) btnText.innerText = 'VERIFIKASI';
    }
    
    // Reset button Tahap 2
    const btn2 = document.getElementById('verifyStage2Btn');
    if (btn2) {
        btn2.style.display = '';
        btn2.classList.remove('loading');
        btn2.style.pointerEvents = '';
        const btnText = btn2.querySelector('.btn-teks');
        if (btnText) btnText.innerText = 'SIMPAN & LOGIN';
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
    const overlayChange = document.getElementById('changePasswordOverlay');
    const stage = document.getElementById('stage');
    
    if (overlay) overlay.classList.remove('open');
    if (overlayAkun) overlayAkun.classList.remove('open');
    if (overlayLogout) overlayLogout.classList.remove('open');
    if (overlayChange) overlayChange.classList.remove('open');
    
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
// TAHAP 1: VERIFIKASI KODE
// ==========================================
async function submitStage1() {
    const codeInput = document.getElementById('verifyCodeInput');
    const btn = document.getElementById('verifyStage1Btn');
    
    if (!codeInput || !btn) return;
    
    // Uppercase + trim
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code || code.length !== 8) {
        showVerifyMessage(1, 'Kode verifikasi harus 8 karakter', true);
        codeInput.focus();
        return;
    }
    
    btn.classList.add('loading');
    btn.style.pointerEvents = 'none';
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'MEMPROSES...';
    showVerifyMessage(1, '');
    
    try {
        const url = `${GAS.MAIN}?action=verifyActivationCode&code=${encodeURIComponent(code)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            // Simpan untuk Tahap 2
            window._verifyUid = data.uid;      // U_xxxx — jangkar
            window._verifyNama = data.nama;    // ign — display
            window._verifyCode = code;         // untuk debug / fallback
            
            // Pindah ke Tahap 2
            showStage2(data.nama);
        } else {
            showVerifyMessage(1, data.message || 'Kode verifikasi salah', true);
            btn.classList.remove('loading');
            btn.style.pointerEvents = '';
            if (btnText) btnText.innerText = 'VERIFIKASI';
        }
    } catch(e) {
        console.error('Verify code error:', e);
        showVerifyMessage(1, 'Koneksi gagal. Coba lagi.', true);
        btn.classList.remove('loading');
        btn.style.pointerEvents = '';
        if (btnText) btnText.innerText = 'VERIFIKASI';
    }
}

// ==========================================
// TAHAP 2: SIMPAN ID + PASSWORD
// ==========================================
async function submitStage2() {
    const idInput = document.getElementById('verifyIdLoginInput');
    const pwInput = document.getElementById('verifyPasswordInput');
    const btn = document.getElementById('verifyStage2Btn');
    
    if (!idInput || !pwInput || !btn) return;
    
    const idLogin = idInput.value.trim();
    const password = pwInput.value;
    
    // Validasi input
    if (!idLogin || idLogin.length < 3) {
        showVerifyMessage(2, 'ID Login minimal 3 karakter', true);
        idInput.focus();
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(idLogin)) {
        showVerifyMessage(2, 'ID Login hanya boleh huruf, angka, underscore', true);
        idInput.focus();
        return;
    }
    if (!password || password.length < 6) {
        showVerifyMessage(2, 'Password minimal 6 karakter', true);
        pwInput.focus();
        return;
    }
    
    // Validasi prasyarat: harus punya M-xxxxx
    const localUid = localStorage.getItem('u_uid') || '';
    if (!localUid.startsWith('M-') || localUid.endsWith('-v')) {
        showVerifyMessage(2, 
            '⚠️ Sesi tidak valid. Buka Web Internal dulu untuk verifikasi gate.', 
            true
        );
        return;
    }
    
    // Validasi jangkar uid ada
    if (!window._verifyUid) {
        showVerifyMessage(2, 'Sesi verifikasi habis. Ulangi dari awal.', true);
        backToStage1();
        return;
    }
    
    btn.classList.add('loading');
    btn.style.pointerEvents = 'none';
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'MENYIMPAN...';
    showVerifyMessage(2, '');
    
    try {
        const url = `${GAS.MAIN}?action=activateAccount` +
            `&uid=${encodeURIComponent(window._verifyUid)}` +
            `&idLogin=${encodeURIComponent(idLogin)}` +
            `&password=${encodeURIComponent(password)}` +
            `&localUid=${encodeURIComponent(localUid)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            // Update identity
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_class', 'member');
            
            if (data.ign) {
                localStorage.setItem('u_ign', data.ign);
                window.myIGN = data.ign;
            }
            window.myUID = data.webUID;
            
            saveMemberSession(data.webUID, password);
            
            window._verifyUid = null;
            window._verifyNama = null;
            window._verifyCode = null;
            
            if (typeof updateIdentityUI === 'function') updateIdentityUI();
            showKaitkanSuccess();
            
            if (typeof updateModalMenuItems === 'function') {
                setTimeout(() => updateModalMenuItems(), 500);
            }
        } else {
            showVerifyMessage(2, data.message || 'Gagal menyimpan', true);
            btn.classList.remove('loading');
            btn.style.pointerEvents = '';
            if (btnText) btnText.innerText = 'SIMPAN & LOGIN';
        }
    } catch(e) {
        console.error('Activate error:', e);
        showVerifyMessage(2, 'Koneksi gagal. Coba lagi.', true);
        btn.classList.remove('loading');
        btn.style.pointerEvents = '';
        if (btnText) btnText.innerText = 'SIMPAN & LOGIN';
    }
}

// ==========================================
// HELPER SIMPAN SESSION
// ==========================================
function saveMemberSession(uid, password) {
  if (!uid || !password) return;
  try {
    localStorage.setItem('umbrella_member_session', JSON.stringify({
      uid: uid,
      password: password,
      loggedInAt: Date.now()
    }));
  } catch(e) {
    console.warn('saveMemberSession error:', e);
  }
}

// ==========================================
// PINDAH KE TAHAP 2
// ==========================================
function showStage2(ign) {
    document.getElementById('verifyStage1').style.display = 'none';
    document.getElementById('verifyStage2').style.display = 'flex';
    
    const memberIgnEl = document.getElementById('verifyMemberIgn');
    if (memberIgnEl) memberIgnEl.textContent = ign;
    
    const idInput = document.getElementById('verifyIdLoginInput');
    if (idInput) idInput.focus();
}

// ==========================================
// 🎯 KEMBALI KE TAHAP 1
// ==========================================
function backToStage1() {
    document.getElementById('verifyStage2').style.display = 'none';
    document.getElementById('verifyStage1').style.display = 'flex';
    
    const codeInput = document.getElementById('verifyCodeInput');
    if (codeInput) codeInput.focus();
}

// ==========================================
// TOGGLE HINT
// ==========================================
function toggleHint() {
    const hint = document.getElementById('verifyHint');
    if (!hint) return;
    
    if (hint.style.display === 'none' || !hint.style.display) {
        hint.style.display = 'block';
    } else {
        hint.style.display = 'none';
    }
}

// ==========================================
// PESAN ERROR
// ==========================================
function showVerifyMessage(stage, msg, isError = false) {
    const el = document.getElementById(`verifyMessage${stage}`);
    if (!el) return;
    
    el.innerText = msg || '';
    el.classList.remove('error', 'show');
    
    if (msg) {
        el.classList.add('show');
        if (isError) el.classList.add('error');
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
    document.getElementById('verifyStage1').style.display = 'none';
    document.getElementById('verifyStage2').style.display = 'none';
    
    const oldNotif = document.getElementById('kaitkanSuccessNotif');
    if (oldNotif) oldNotif.remove();
    
    const body = document.querySelector('#kaitkanOverlay .kaitkan-body');
    if (body) {
        const notifHTML = `
            <div class="kaitkan-success-notif" id="kaitkanSuccessNotif">
                <i class="fas fa-check-circle"></i>
                Akun berhasil diverifikasi! Badge hijau + centang aktif.
            </div>
        `;
        body.insertAdjacentHTML('beforeend', notifHTML);
    }
    
    setTimeout(() => {
        if (typeof closeKaitkanAkun === 'function') {
            closeKaitkanAkun(true);
        }
    }, 2000);
}

// ==========================================
// AKUN SAYA — Ukuran Tombol Tetap
// ==========================================
async function openAkunSaya() {
    const uid = localStorage.getItem('u_uid') || '';
    const ign = localStorage.getItem('u_ign') || 'Member';
    const isVerified = uid.endsWith('-v');
    
    if (typeof closeModal === 'function') closeModal(true);
    
    const overlay = document.getElementById('kaitkanAkunSayaOverlay');
    if (!overlay) return;
    
    const bodyEl = overlay.querySelector('.kaitkan-body');
    if (!bodyEl) return;
    
    if (isVerified) {
        // ==========================================
        // VERIFIED — 2 tombol (Ganti Password + Logout)
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
            
            <p class="kaitkan-save-text">Gunakan ID Login & password untuk masuk di device lain</p>
            
            <div class="akun-btn-row">
                <div class="btn-svg akun-btn-verify" onclick="openChangePasswordForm()">
                    <div class="btn-ujung-kiri"></div>
                    <div class="btn-tengah"><span class="btn-teks">GANTI PASSWORD</span></div>
                    <div class="btn-ujung-kanan"></div>
                </div>
            </div>
            
            <div class="akun-btn-row" style="margin-top:8px;">
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
// BUKA VERIFIKASI DARI AKUN SAYA
// ==========================================
function openVerifikasiFromAkun() {
    const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
    if (overlayAkun) overlayAkun.classList.remove('open');
    
    setTimeout(() => {
        openKaitkanAkun();
    }, 200);
}

// ==========================================
// TOGGLE MODAL LOGIN
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
// BUKA MODAL LOGIN
// ==========================================
function openLoginModal() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (!overlay) return;
    
    // 🎯 Selalu buka di view login
    document.getElementById('loginViewLogin').style.display = 'flex';
    document.getElementById('loginViewLupaStep1').style.display = 'none';
    document.getElementById('loginViewLupaStep2').style.display = 'none';
    
    const idInput = document.getElementById('loginMemberIdLogin');
    const pwInput = document.getElementById('loginMemberPassword');
    const msgEl = document.getElementById('loginMemberMessage');
    
    if (idInput) idInput.value = '';
    if (pwInput) pwInput.value = '';
    if (msgEl) { 
        msgEl.innerText = ''; 
        msgEl.classList.remove('show', 'error', 'success'); 
    }
    
    const btn = document.getElementById('loginMemberSubmitBtn');
    if (btn) {
        btn.style.pointerEvents = '';
        const btnText = btn.querySelector('.btn-teks');
        if (btnText) btnText.innerText = 'LOGIN';
    }
    
    overlay.classList.add('open');
    updateGateLoginBtn(true);
    
    setTimeout(() => {
        if (idInput) idInput.focus();
    }, 300);
}

// ==========================================
// TUTUP MODAL LOGIN
// ==========================================
function closeLoginModal() {
    const overlay = document.getElementById('loginMemberOverlay');
    if (overlay) overlay.classList.remove('open');
    
    updateGateLoginBtn(false);
}

// ==========================================
// UPDATE TEKS TOMBOL GATE LOGIN
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
// SUBMIT LOGIN
// ==========================================
async function submitLoginModal() {
    const idInput = document.getElementById('loginMemberIdLogin');
    const pwInput = document.getElementById('loginMemberPassword');
    const btn = document.getElementById('loginMemberSubmitBtn');
    
    if (!idInput || !pwInput || !btn) return;
    
    const idLogin = idInput.value.trim();
    const password = pwInput.value;
    
    if (!idLogin || idLogin.length < 3) {
        showLoginMemberMessage('ID Login minimal 3 karakter', true);
        idInput.focus();
        return;
    }
    if (!password || password.length < 6) {
        showLoginMemberMessage('Password minimal 6 karakter', true);
        pwInput.focus();
        return;
    }
    
    btn.style.pointerEvents = 'none';
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'MEMPROSES...';
    showLoginMemberMessage('');
    
    try {
        const url = `${GAS.MAIN}?action=loginWithIdPassword` +
            `&idLogin=${encodeURIComponent(idLogin)}` +
            `&password=${encodeURIComponent(password)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            // Update identity
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_class', 'member');
            
            if (data.ign) {
                localStorage.setItem('u_ign', data.ign);
                window.myIGN = data.ign;
            }
            window.myUID = data.webUID;
            
            saveMemberSession(data.webUID, password);
            
            if (typeof updateIdentityUI === 'function') updateIdentityUI();
            
            showLoginMemberMessage('✅ Login berhasil!', false, true);
            
            setTimeout(() => {
                closeLoginModal();
                if (typeof closeGate === 'function') closeGate(true);
                if (typeof updateModalMenuItems === 'function') updateModalMenuItems();
            }, 800);
        } else {
            showLoginMemberMessage(data.message || 'Login gagal', true);
            btn.style.pointerEvents = '';
            if (btnText) btnText.innerText = 'LOGIN';
        }
    } catch(e) {
        console.error('Login error:', e);
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
// HANDLE TOMBOL BACK — Modal Login
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
// LOGOUT — Modal Konfirmasi
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
// KONFIRMASI LOGOUT — YES
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
// TUTUP MODAL KONFIRMASI LOGOUT
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
// LOGOUT GUEST
// ==========================================
function executeLogoutGuest() {
    localStorage.setItem('u_ign', '');
    localStorage.removeItem('umbrella_member_session');   // ← BARU (safety)
    clearUmbrellaSession();
    
    window.myIGN = '';
    
    if (typeof showToast === 'function') showToast('✅ Logout berhasil');
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

// ==========================================
// LOGOUT MEMBER
// ==========================================
function executeLogoutMember() {
    localStorage.removeItem('u_uid');
    localStorage.removeItem('u_ign');
    localStorage.removeItem('u_web_uid');
    localStorage.removeItem('u_class');
    localStorage.removeItem('u_ign_changed_at');
    localStorage.removeItem('umbrella_member_session');
    
    clearUmbrellaSession();
    
    if (typeof showToast === 'function') showToast('✅ Logout berhasil');
    
    setTimeout(() => {
        location.reload();
    }, 500);
}

// ==========================================
// HELPER
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
// FASE 4: LUPA PASSWORD
// ==========================================
function openLupaPassword() {
  // Ganti view di dalam modal login — bukan buka modal baru
  document.getElementById('loginViewLogin').style.display = 'none';
  document.getElementById('loginViewLupaStep1').style.display = 'flex';
  document.getElementById('loginViewLupaStep2').style.display = 'none';
  
  // Reset fields
  document.getElementById('lupaCodeInput').value = '';
  document.getElementById('lupaIdLoginInput').value = '';
  document.getElementById('lupaPasswordInput').value = '';
  document.getElementById('lupaConfirmInput').value = '';
  document.getElementById('lupaMemberIgn').textContent = '-';
  
  showLupaMessage(1, '');
  showLupaMessage(2, '');
  
  window._lupaUid = null;
  window._lupaCode = null;
  
  // Reset tombol
  const btn1 = document.getElementById('lupaStage1Btn');
  if (btn1) {
    btn1.style.pointerEvents = '';
    btn1.classList.remove('loading');
    const t = btn1.querySelector('.btn-teks');
    if (t) t.innerText = 'VERIFIKASI';
  }
  
  const btn2 = document.getElementById('lupaStage2Btn');
  if (btn2) {
    btn2.style.pointerEvents = '';
    btn2.classList.remove('loading');
    const t = btn2.querySelector('.btn-teks');
    if (t) t.innerText = 'SIMPAN & LOGIN';
  }
  
  setTimeout(() => document.getElementById('lupaCodeInput').focus(), 300);
}

function backToLoginView() {
  document.getElementById('loginViewLupaStep1').style.display = 'none';
  document.getElementById('loginViewLupaStep2').style.display = 'none';
  document.getElementById('loginViewLogin').style.display = 'flex';
  
  // Reset fields
  document.getElementById('lupaCodeInput').value = '';
  document.getElementById('lupaIdLoginInput').value = '';
  document.getElementById('lupaPasswordInput').value = '';
  document.getElementById('lupaConfirmInput').value = '';
  
  window._lupaUid = null;
  window._lupaCode = null;
  
  showLupaMessage(1, '');
  showLupaMessage(2, '');
  
  setTimeout(() => {
    const idInput = document.getElementById('loginMemberIdLogin');
    if (idInput) idInput.focus();
  }, 200);
}

function showLupaMessage(stage, msg, isError = false) {
  const el = document.getElementById(`lupaMessage${stage}`);
  if (!el) return;
  
  el.innerText = msg || '';
  el.classList.remove('error', 'show');
  
  if (msg) {
    el.classList.add('show');
    if (isError) el.classList.add('error');
  }
}

function backToLupaStage1() {
  document.getElementById('loginViewLupaStep2').style.display = 'none';
  document.getElementById('loginViewLupaStep1').style.display = 'flex';
  
  // Reset field step 2
  document.getElementById('lupaIdLoginInput').value = '';
  document.getElementById('lupaPasswordInput').value = '';
  document.getElementById('lupaConfirmInput').value = '';
  
  window._lupaUid = null;
  window._lupaCode = null;
  
  showLupaMessage(2, '');
  
  setTimeout(() => {
    const input = document.getElementById('lupaCodeInput');
    if (input) input.focus();
  }, 100);
}
async function submitLupaStage1() {
  const codeInput = document.getElementById('lupaCodeInput');
  const btn = document.getElementById('lupaStage1Btn');
  if (!codeInput || !btn) return;
  
  const code = codeInput.value.trim().toUpperCase();
  
  if (!code || code.length !== 8) {
    showLupaMessage(1, 'Kode verifikasi harus 8 karakter', true);
    codeInput.focus();
    return;
  }
  
  btn.classList.add('loading');
  btn.style.pointerEvents = 'none';
  btn.querySelector('.btn-teks').innerText = 'MEMPROSES...';
  showLupaMessage(1, '');
  
  try {
    const url = `${GAS.MAIN}?action=verifyActivationCode&code=${encodeURIComponent(code)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.success) {
      window._lupaUid = data.uid;
      window._lupaCode = code;
      
      document.getElementById('lupaMemberIgn').textContent = data.nama;
      document.getElementById('loginViewLupaStep1').style.display = 'none';
      document.getElementById('loginViewLupaStep2').style.display = 'flex';
      
      setTimeout(() => document.getElementById('lupaIdLoginInput').focus(), 200);
    } else {
      showLupaMessage(1, data.message || 'Kode verifikasi salah', true);
      btn.classList.remove('loading');
      btn.style.pointerEvents = '';
      btn.querySelector('.btn-teks').innerText = 'VERIFIKASI';
    }
  } catch(e) {
    console.error('Lupa stage1 error:', e);
    showLupaMessage(1, 'Koneksi gagal. Coba lagi.', true);
    btn.classList.remove('loading');
    btn.style.pointerEvents = '';
    btn.querySelector('.btn-teks').innerText = 'VERIFIKASI';
  }
}

async function submitLupaStage2() {
  const idInput = document.getElementById('lupaIdLoginInput');
  const pwInput = document.getElementById('lupaPasswordInput');
  const confirmInput = document.getElementById('lupaConfirmInput');
  const btn = document.getElementById('lupaStage2Btn');
  if (!idInput || !pwInput || !confirmInput || !btn) return;
  
  const idLogin = idInput.value.trim();
  const password = pwInput.value;
  const confirm = confirmInput.value;
  
  if (!idLogin || idLogin.length < 3) {
    showLupaMessage(2, 'ID Login minimal 3 karakter', true);
    idInput.focus();
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(idLogin)) {
    showLupaMessage(2, 'ID Login hanya boleh huruf, angka, underscore', true);
    idInput.focus();
    return;
  }
  if (!password || password.length < 6) {
    showLupaMessage(2, 'Password minimal 6 karakter', true);
    pwInput.focus();
    return;
  }
  if (password !== confirm) {
    showLupaMessage(2, 'Password tidak cocok dengan konfirmasi', true);
    confirmInput.focus();
    return;
  }
  
  if (!window._lupaUid || !window._lupaCode) {
    showLupaMessage(2, 'Sesi habis. Ulangi dari awal.', true);
    backToLupaStage1();
    return;
  }
  
  btn.classList.add('loading');
  btn.style.pointerEvents = 'none';
  btn.querySelector('.btn-teks').innerText = 'MENYIMPAN...';
  showLupaMessage(2, '');
  
  try {
    const url = `${GAS.MAIN}?action=resetMemberPassword` +
      `&uid=${encodeURIComponent(window._lupaUid)}` +
      `&code=${encodeURIComponent(window._lupaCode)}` +
      `&idLogin=${encodeURIComponent(idLogin)}` +
      `&password=${encodeURIComponent(password)}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('u_uid', data.webUID);
      localStorage.setItem('u_web_uid', data.webUID);
      localStorage.setItem('u_class', 'member');
      if (data.ign) localStorage.setItem('u_ign', data.ign);
      
      window.myUID = data.webUID;
      window.myIGN = data.ign || '';
      
      saveMemberSession(data.webUID, password);
      
      window._lupaUid = null;
      window._lupaCode = null;
      
      showLupaMessage(2, '✅ Berhasil! Login otomatis...', false);
      
      setTimeout(() => {
        closeLoginModal();  // ← close login modal, bukan close lupa password overlay
        location.reload();
      }, 1000);
    } else {
      showLupaMessage(2, data.message || 'Gagal menyimpan', true);
      btn.classList.remove('loading');
      btn.style.pointerEvents = '';
      btn.querySelector('.btn-teks').innerText = 'SIMPAN & LOGIN';
    }
  } catch(e) {
    console.error('Lupa stage2 error:', e);
    showLupaMessage(2, 'Koneksi gagal. Coba lagi.', true);
    btn.classList.remove('loading');
    btn.style.pointerEvents = '';
    btn.querySelector('.btn-teks').innerText = 'SIMPAN & LOGIN';
  }
}

// ==========================================
// FASE 4: GANTI PASSWORD
// ==========================================
function openChangePasswordForm() {
  const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
  if (overlayAkun) overlayAkun.classList.remove('open');
  
  const overlay = document.getElementById('changePasswordOverlay');
  if (!overlay) return;
  
  document.getElementById('changePwdOldInput').value = '';
  document.getElementById('changePwdNewInput').value = '';
  document.getElementById('changePwdConfirmInput').value = '';
  showChangePwdMessage('');
  
  const btn = document.getElementById('changePwdSubmitBtn');
  btn.style.pointerEvents = '';
  btn.classList.remove('loading');
  btn.querySelector('.btn-teks').innerText = 'SIMPAN';
  
  overlay.classList.add('open');
  
  const stage = document.getElementById('stage');
  if (stage) stage.classList.add('kaitkan-open');
  
  if (typeof updateButtons === 'function') updateButtons();
  
  setTimeout(() => document.getElementById('changePwdOldInput').focus(), 200);
  
  isKaitkanPopupOpen = true;
}

function closeChangePasswordForm(skipMenu = false) {
  const overlay = document.getElementById('changePasswordOverlay');
  if (!overlay) return;
  
  overlay.classList.remove('open');
  
  const stage = document.getElementById('stage');
  if (!skipMenu && stage) stage.classList.add('modal-open');
  if (stage) stage.classList.remove('kaitkan-open');
  
  isKaitkanPopupOpen = false;
  
  if (typeof updateButtons === 'function') updateButtons();
  
  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openAkunSaya === 'function') openAkunSaya();
    }, 150);
  }
}

function showChangePwdMessage(msg, isError = false) {
  const el = document.getElementById('changePwdMessage');
  if (!el) return;
  
  el.innerText = msg || '';
  el.classList.remove('error', 'show');
  
  if (msg) {
    el.classList.add('show');
    if (isError) el.classList.add('error');
  }
}

async function submitChangePassword() {
  const oldInput = document.getElementById('changePwdOldInput');
  const newInput = document.getElementById('changePwdNewInput');
  const confirmInput = document.getElementById('changePwdConfirmInput');
  const btn = document.getElementById('changePwdSubmitBtn');
  if (!oldInput || !newInput || !confirmInput || !btn) return;
  
  const oldPassword = oldInput.value;
  const newPassword = newInput.value;
  const confirm = confirmInput.value;
  
  const uid = localStorage.getItem('u_uid') || '';
  if (!uid.endsWith('-v')) {
    showChangePwdMessage('Akun tidak valid', true);
    return;
  }
  
  if (!oldPassword) { showChangePwdMessage('Password lama harus diisi', true); oldInput.focus(); return; }
  if (!newPassword || newPassword.length < 6) { showChangePwdMessage('Password baru minimal 6 karakter', true); newInput.focus(); return; }
  if (newPassword !== confirm) { showChangePwdMessage('Password baru tidak cocok dengan konfirmasi', true); confirmInput.focus(); return; }
  
  btn.classList.add('loading');
  btn.style.pointerEvents = 'none';
  btn.querySelector('.btn-teks').innerText = 'MENYIMPAN...';
  showChangePwdMessage('');
  
  try {
    const url = `${GAS.MAIN}?action=changeMemberPassword` +
      `&uid=${encodeURIComponent(uid)}` +
      `&oldPassword=${encodeURIComponent(oldPassword)}` +
      `&newPassword=${encodeURIComponent(newPassword)}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.success) {
      showChangePwdMessage('✅ Password berhasil diubah', false);
      
      saveMemberSession(uid, newPassword);
      
      setTimeout(() => {
        closeChangePasswordForm(true);
        if (typeof showToast === 'function') showToast('✅ Password berhasil diubah');
      }, 800);
    } else {
      showChangePwdMessage(data.message || 'Gagal mengubah password', true);
      btn.classList.remove('loading');
      btn.style.pointerEvents = '';
      btn.querySelector('.btn-teks').innerText = 'SIMPAN';
    }
  } catch(e) {
    console.error('Change pwd error:', e);
    showChangePwdMessage('Koneksi gagal. Coba lagi.', true);
    btn.classList.remove('loading');
    btn.style.pointerEvents = '';
    btn.querySelector('.btn-teks').innerText = 'SIMPAN';
  }
}

// ==========================================
// VALIDASI SESSION PER PAGE LOAD
// Async, tidak block render. Fail-open kalau server error.
// ==========================================
async function validateMemberSessionOnce() {
  const uid = localStorage.getItem('u_uid') || '';
  const sessionRaw = localStorage.getItem('umbrella_member_session');
  
  // Skip kalau bukan member verified
  if (!uid.endsWith('-v')) return;
  
  // Skip kalau tidak ada session tersimpan (member lama sebelum fitur ini)
  // Session akan di-set saat login/activate/reset/ganti password berikutnya
  if (!sessionRaw) return;
  
  let session;
  try {
    session = JSON.parse(sessionRaw);
  } catch(e) {
    localStorage.removeItem('umbrella_member_session');
    return;
  }
  
  // Cek konsistensi session dengan u_uid
  if (!session.uid || session.uid !== uid || !session.password) {
    localStorage.removeItem('umbrella_member_session');
    return;
  }
  
  try {
    const url = `${GAS.MAIN}?action=validateMemberSession` +
      `&uid=${encodeURIComponent(uid)}` +
      `&password=${encodeURIComponent(session.password)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.valid) {
      console.log('🔒 Member session invalid:', data.reason);
      
      // Clear semua identity & session
      localStorage.removeItem('u_uid');
      localStorage.removeItem('u_ign');
      localStorage.removeItem('u_web_uid');
      localStorage.removeItem('u_class');
      localStorage.removeItem('u_ign_changed_at');
      localStorage.removeItem('umbrella_member_session');
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('umbrella_')) sessionStorage.removeItem(key);
      });
      
      window.myUID = '';
      window.myIGN = '';
      
      if (typeof showToast === 'function') {
        const msg = data.reason === 'inactive' 
          ? 'Akun dinonaktifkan. Hubungi admin.' 
          : (data.reason === 'not_found'
              ? 'Akun tidak ditemukan. Hubungi admin.'
              : 'Password telah diubah di device lain. Silakan login ulang.');
        showToast(`🔒 ${msg}`, true);
      }
      
      setTimeout(() => location.reload(), 1500);
    } else {
      console.log('✅ Member session valid');
    }
  } catch(e) {
    // Fail-open: jangan kick kalau server error
    console.warn('validateMemberSession error (fail-open):', e);
  }
}

// Panggil setelah page fully loaded + delay 1.5s
// Total: ~2-4s setelah render → UX smooth, security tetap jalan
window.addEventListener('load', () => {
  setTimeout(validateMemberSessionOnce, 1500);
});

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
window.openLupaPassword = openLupaPassword;
window.submitLupaStage1 = submitLupaStage1;
window.submitLupaStage2 = submitLupaStage2;
window.backToLupaStage1 = backToLupaStage1;
window.openChangePasswordForm = openChangePasswordForm;
window.closeChangePasswordForm = closeChangePasswordForm;
window.submitChangePassword = submitChangePassword;
window.validateMemberSessionOnce = validateMemberSessionOnce;
window.saveMemberSession = saveMemberSession;

console.log('✅ kaitkan-akun.js loaded (V3 — Modal Konfirmasi Logout)');
