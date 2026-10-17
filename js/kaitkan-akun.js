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
// 🎯 TAHAP 1: VERIFIKASI KODE
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
// 🎯 TAHAP 2: SIMPAN ID + PASSWORD
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
            
            // Clear sementara
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
// 🎯 PINDAH KE TAHAP 2
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
// 🎯 TOGGLE HINT
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
// 🎯 PESAN ERROR
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
