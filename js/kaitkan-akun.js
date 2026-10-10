/**
 * kaitkan-akun.js — Fitur Kaitkan Akun (Web Publik)
 * Pola: sama dengan modal mail/info/tentang
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
        
        console.log('📊 checkAccountStatus:', data);
        
        if (data.hasAccount && data.webUID && data.webUID !== uUid) {
            localStorage.setItem('u_uid', data.webUID);
            window.myUID = data.webUID;
        }
        
        return data;
    } catch(e) {
        console.error('Cek status akun error:', e);
        return {
            hasAccount: uUid.endsWith('-v'),
            webUID: uUid.endsWith('-v') ? uUid : '',
            ign: localStorage.getItem('u_ign') || ''
        };
    }
}

// ==========================================
// BUKA MODAL KAITKAN AKUN
// ==========================================
function openKaitkanAkun() {
    const uid = localStorage.getItem('u_uid') || '';
    
    if (uid.endsWith('-v')) {
        openAkunSaya();
        return;
    }
    
    if (!uid.startsWith('M-')) {
        if (typeof showToast === 'function') {
            showToast('Hanya member yang bisa kaitkan akun', true);
        }
        return;
    }
    
    // Tutup modal menu kalau ada
    if (typeof closeModal === 'function') {
        closeModal(true);   // skip = true, biar modal-open tetap ada
    }
    
    const overlay = document.getElementById('kaitkanOverlay');
    if (!overlay) return;
    
    // Reset form
    const waInput = document.getElementById('kaitkanWaInput');
    const kodeInput = document.getElementById('kaitkanKodeInput');
    const msgEl = document.getElementById('kaitkanMessage');
    
    if (waInput) { waInput.value = ''; waInput.disabled = false; }
    if (kodeInput) { kodeInput.value = ''; kodeInput.disabled = false; }
    if (msgEl) {
        msgEl.innerText = '';
        msgEl.classList.remove('show', 'error');
    }
    
    // Hapus notif lama
    const oldNotif = document.getElementById('kaitkanSuccessNotif');
    if (oldNotif) oldNotif.remove();
    
    // Pastikan tombol ada
    const btn = document.getElementById('kaitkanSubmitBtn');
    if (btn) {
        btn.style.display = '';
        btn.classList.remove('loading');
        const btnText = btn.querySelector('.btn-teks');
        if (btnText) btnText.innerText = 'KAITKAN AKUN';
    } else {
        const form = document.querySelector('#kaitkanOverlay .kaitkan-form');
        if (form) {
            const btnHTML = `
                <div class="btn-svg kaitkan-submit-btn" id="kaitkanSubmitBtn" onclick="submitKaitkanAkun()">
                    <div class="btn-ujung-kiri"></div>
                    <div class="btn-tengah"><span class="btn-teks">KAITKAN AKUN</span></div>
                    <div class="btn-ujung-kanan"></div>
                </div>
            `;
            form.insertAdjacentHTML('beforeend', btnHTML);
        }
    }
    
    // Open — sama seperti modal lain
    overlay.classList.add('open');
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    
    if (typeof updateButtons === 'function') updateButtons();
    
    setTimeout(() => {
        if (waInput) waInput.focus();
    }, 300);
    
    isKaitkanPopupOpen = true;
}

// ==========================================
// TUTUP MODAL
// ==========================================
function closeKaitkanAkun(skipMenu = false) {
    const overlay = document.getElementById('kaitkanOverlay');
    const overlayAkun = document.getElementById('kaitkanAkunSayaOverlay');
    const stage = document.getElementById('stage');
    
    if (overlay) overlay.classList.remove('open');
    if (overlayAkun) overlayAkun.classList.remove('open');
    if (stage) stage.classList.remove('kaitkan-open');
    
    isKaitkanPopupOpen = false;
    
    if (typeof updateButtons === 'function') updateButtons();
    
    // Buka modal menu lagi — sama seperti modal lain
    if (!skipMenu) {
        setTimeout(() => {
            if (typeof openModal === 'function') openModal();
        }, 150);
    }
}

// ==========================================
// SUBMIT
// ==========================================
async function submitKaitkanAkun() {
    const waInput = document.getElementById('kaitkanWaInput');
    const kodeInput = document.getElementById('kaitkanKodeInput');
    const btn = document.getElementById('kaitkanSubmitBtn');
    
    if (!waInput || !kodeInput || !btn) return;
    
    let wa = waInput.value.trim().replace(/\D/g, '');
    let kode = kodeInput.value.trim();
    
    if (!wa || wa.length < 10) {
        showKaitkanMessage('Masukkan nomor WA lengkap (min 10 digit)', true);
        waInput.focus();
        return;
    }
    
    if (!kode || kode.length !== 6) {
        showKaitkanMessage('Masukkan kode 6 digit dari admin', true);
        kodeInput.focus();
        return;
    }
    
    const uid = localStorage.getItem('u_uid') || '';
    if (!uid) {
        showKaitkanMessage('Session tidak valid. Refresh halaman.', true);
        return;
    }
    
    btn.classList.add('loading');
    btn.style.pointerEvents = 'none';
    const btnText = btn.querySelector('.btn-teks');
    if (btnText) btnText.innerText = 'MEMPROSES...';
    showKaitkanMessage('');
    
    try {
        const url = `${GAS.MAIN}?action=activateAccount&uid=${encodeURIComponent(uid)}&wa=${encodeURIComponent(wa)}&code=${encodeURIComponent(kode)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('📡 activateAccount response:', data);
        
        if (data.success) {
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_web_kode', kode);
            window.myUID = data.webUID;
            
            if (typeof updateIdentityUI === 'function') {
                updateIdentityUI();
            }
            
            showKaitkanSuccess();
            
            if (typeof updateModalMenuItems === 'function') {
                setTimeout(() => updateModalMenuItems(), 500);
            }
        } else {
            showKaitkanMessage(data.message || 'Gagal mengaitkan akun', true);
            btn.classList.remove('loading');
            btn.style.pointerEvents = '';
            if (btnText) btnText.innerText = 'KAITKAN AKUN';
        }
    } catch(e) {
        console.error('Submit kaitkan error:', e);
        showKaitkanMessage('Koneksi gagal. Coba lagi.', true);
        btn.classList.remove('loading');
        btn.style.pointerEvents = '';
        if (btnText) btnText.innerText = 'KAITKAN AKUN';
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
    const waInput = document.getElementById('kaitkanWaInput');
    const kodeInput = document.getElementById('kaitkanKodeInput');
    
    if (waInput) waInput.disabled = true;
    if (kodeInput) kodeInput.disabled = true;
    
    const btn = document.getElementById('kaitkanSubmitBtn');
    if (btn) btn.style.display = 'none';
    
    const msgEl = document.getElementById('kaitkanMessage');
    if (msgEl) {
        msgEl.innerText = '';
        msgEl.classList.remove('show', 'error');
    }
    
    const oldNotif = document.getElementById('kaitkanSuccessNotif');
    if (oldNotif) oldNotif.remove();
    
    const form = document.querySelector('#kaitkanOverlay .kaitkan-form');
    if (form) {
        const notifHTML = `
            <div class="kaitkan-success-notif" id="kaitkanSuccessNotif">
                <i class="fas fa-check-circle"></i>
                Akun Berhasil Dikaitkan, simpan kode akses anda!
            </div>
        `;
        form.insertAdjacentHTML('beforeend', notifHTML);
    }
}

// ==========================================
// AKUN SAYA
// ==========================================
async function openAkunSaya() {
    const ign = localStorage.getItem('u_ign') || 'Member';
    const savedKode = localStorage.getItem('u_web_kode') || '';
    
    // Tutup modal menu kalau ada
    if (typeof closeModal === 'function') {
        closeModal(true);
    }
    
    const overlay = document.getElementById('kaitkanAkunSayaOverlay');
    if (!overlay) return;
    
    // Update isi
    const ignEl = document.getElementById('akunSayaIgn');
    if (ignEl) ignEl.innerText = ign;
    
    const kodeValueEl = document.getElementById('akunSayaKodeValue');
    const kodeBoxEl = document.getElementById('akunSayaKodeBox');
    
    if (savedKode) {
        if (kodeValueEl) kodeValueEl.innerText = savedKode;
        if (kodeBoxEl) kodeBoxEl.classList.remove('kaitkan-kode-box-empty');
    } else {
        if (kodeValueEl) kodeValueEl.innerText = '—';
        if (kodeBoxEl) kodeBoxEl.classList.add('kaitkan-kode-box-empty');
    }
    
    overlay.classList.add('open');
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    
    if (typeof updateButtons === 'function') updateButtons();
    
    isKaitkanPopupOpen = true;
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
window.cekStatusAkun = cekStatusAkun;
window.isKaitkanPopupOpen = () => isKaitkanPopupOpen;

console.log('✅ kaitkan-akun.js loaded (Web Publik — pola modal lain)');
