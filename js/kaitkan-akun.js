/**
 * kaitkan-akun.js — Fitur Kaitkan Akun untuk Member
 * 
 * Fitur:
 * - Cek status akun (verified atau belum)
 * - Popup form kaitkan akun (WA + kode)
 * - Popup sukses (tampil kode + suruh simpan)
 * - Menu "Akun Saya" setelah verified
 */

// ==========================================
// STATE
// ==========================================
let isKaitkanPopupOpen = false;

// ==========================================
// CEK STATUS AKUN (verified atau belum)
// ==========================================
async function cekStatusAkun() {
    const uUid = localStorage.getItem('u_uid') || '';
    if (!uUid) return { hasAccount: false };
    
    try {
        const url = buildGas5Url('checkAccountStatus', { uid: uUid });
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('📊 checkAccountStatus:', data);
        
        // Auto-sync u_uid kalau mismatch
        if (data.hasAccount && data.webUID && data.webUID !== uUid) {
            console.log('🔄 Auto-sync u_uid dari server:', data.webUID);
            localStorage.setItem('u_uid', data.webUID);
            window.myUID = data.webUID;
        }
        
        return data;
    } catch(e) {
        console.error('Cek status akun error:', e);
        // Fallback: cek dari localStorage
        return {
            hasAccount: uUid.endsWith('-v'),
            webUID: uUid.endsWith('-v') ? uUid : '',
            ign: localStorage.getItem('u_ign') || ''
        };
    }
}

// ==========================================
// BUKA POPUP FORM KAITKAN AKUN
// ==========================================
function openKaitkanAkun() {
    const uid = localStorage.getItem('u_uid') || '';
    
    // Cek dulu — kalau sudah verified, jangan buka form
    if (uid.endsWith('-v')) {
        openAkunSaya();
        return;
    }
    
    const popupHTML = `
        <div class="kaitkan-overlay" id="kaitkanOverlay">
            <div class="kaitkan-popup">
                <button class="kaitkan-close" onclick="closeKaitkanAkun()">✕</button>
                
                <div class="kaitkan-header">
                    <div class="kaitkan-icon">
                        <i class="fas fa-link"></i>
                    </div>
                    <h2>Kaitkan Akun</h2>
                    <p>Kaitkan akun agar bisa login dari device lain tanpa verifikasi ulang.</p>
                </div>
                
                <div class="kaitkan-info">
                    <div class="kaitkan-info-title">
                        <i class="fas fa-info-circle"></i> Cara Mendapat Kode
                    </div>
                    <ol class="kaitkan-info-list">
                        <li>Hubungi admin via WA / DM / game</li>
                        <li>Konfirmasi identitas Anda</li>
                        <li>Admin akan kirimkan kode unik</li>
                    </ol>
                </div>
                
                <div class="kaitkan-form">
                    <div class="kaitkan-form-group">
                        <label><i class="fas fa-phone"></i> Nomor WA</label>
                        <input type="tel" 
                               id="kaitkanWaInput" 
                               placeholder="628123456789"
                               inputmode="numeric"
                               pattern="[0-9]*"
                               autocomplete="off">
                        <small>Gunakan nomor yang terdaftar di member list</small>
                    </div>
                    
                    <div class="kaitkan-form-group">
                        <label><i class="fas fa-key"></i> Kode Unik</label>
                        <input type="tel" 
                               id="kaitkanKodeInput" 
                               placeholder="123456"
                               maxlength="6"
                               inputmode="numeric"
                               pattern="[0-9]*"
                               autocomplete="off">
                        <small>6 digit dari admin</small>
                    </div>
                    
                    <div id="kaitkanMessage" class="kaitkan-message"></div>
                    
                    <button class="kaitkan-btn" id="kaitkanSubmitBtn" onclick="submitKaitkanAkun()">
                        <i class="fas fa-link"></i> KAITKAN AKUN
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    isKaitkanPopupOpen = true;
    
    // Push state untuk back button
    history.pushState({ kaitkan: true }, null, '#kaitkan');
    
    // Focus input
    setTimeout(() => {
        const input = document.getElementById('kaitkanWaInput');
        if (input) input.focus();
    }, 300);
}

// ==========================================
// TUTUP POPUP KAITKAN AKUN
// ==========================================
function closeKaitkanAkun() {
    const overlay = document.getElementById('kaitkanOverlay');
    if (overlay) overlay.remove();
    isKaitkanPopupOpen = false;
}

// ==========================================
// SUBMIT KAITKAN AKUN
// ==========================================
async function submitKaitkanAkun() {
    const waInput = document.getElementById('kaitkanWaInput');
    const kodeInput = document.getElementById('kaitkanKodeInput');
    const btn = document.getElementById('kaitkanSubmitBtn');
    
    if (!waInput || !kodeInput || !btn) return;
    
    let wa = waInput.value.trim().replace(/\D/g, '');
    let kode = kodeInput.value.trim();
    
    // Validasi
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
    
    // Loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...';
    showKaitkanMessage('');
    
    try {
        const url = `${UM_CONFIG.GAS5_URL}?action=activateAccount&uid=${encodeURIComponent(uid)}&wa=${encodeURIComponent(wa)}&code=${encodeURIComponent(kode)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('📡 activateAccount response:', data);
        
        if (data.success) {
            // Update localStorage
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_web_kode', kode);  // ← simpan kode
            window.myUID = data.webUID;
            
            // Tutup form, buka popup sukses
            closeKaitkanAkun();
            setTimeout(() => {
                showKaitkanSukses(data.webUID, data.ign || localStorage.getItem('u_ign'), kode);
            }, 300);
            
            // Rebuild menu
            if (typeof buildMenu === 'function') {
                setTimeout(() => buildMenu(), 500);
            }
        } else {
            showKaitkanMessage(data.message || 'Gagal mengaitkan akun', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-link"></i> KAITKAN AKUN';
        }
    } catch(e) {
        console.error('Submit kaitkan error:', e);
        showKaitkanMessage('Koneksi gagal. Coba lagi.', true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-link"></i> KAITKAN AKUN';
    }
}

// ==========================================
// PESAN ERROR/INFO
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
// POPUP SUKSES (tampil kode + suruh simpan)
// ==========================================
function showKaitkanSukses(webUID, ign, kode) {
    const popupHTML = `
        <div class="kaitkan-overlay" id="kaitkanOverlay">
            <div class="kaitkan-popup kaitkan-sukses">
                <div class="kaitkan-header">
                    <div class="kaitkan-icon kaitkan-icon-sukses">
                        <i class="fas fa-check"></i>
                    </div>
                    <h2>Akun Berhasil Dikaitkan!</h2>
                </div>
                
                <div class="kaitkan-sukses-info">
                    <div class="kaitkan-sukses-row">
                        <span>IGN:</span>
                        <strong>${escapeHtmlKaitkan(ign)}</strong>
                    </div>
                </div>
                
                <div class="kaitkan-sukses-box">
                    <div class="kaitkan-sukses-label">🔑 Kode Akses Anda</div>
                    <div class="kaitkan-sukses-value">${escapeHtmlKaitkan(kode)}</div>
                    <button class="kaitkan-copy-btn" onclick="copyKodeAkses('${escapeHtmlKaitkan(kode)}')">
                        <i class="fas fa-copy"></i> Copy Kode
                    </button>
                </div>
                
                <div class="kaitkan-sukses-warning">
                    <div class="kaitkan-sukses-warning-title">
                        <i class="fas fa-exclamation-triangle"></i> PENTING!
                    </div>
                    <div class="kaitkan-sukses-warning-body">
                        <strong>Simpan kode ini!</strong><br>
                        Gunakan untuk login di device lain (bersama nomor WA Anda).<br>
                        Jika lupa, minta kode baru ke admin.
                    </div>
                </div>
                
                <button class="kaitkan-btn" onclick="closeKaitkanAkun()">
                    <i class="fas fa-check"></i> SAYA SUDAH SIMPAN
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    isKaitkanPopupOpen = true;
    
    history.pushState({ kaitkanSukses: true }, null, '#kaitkan-sukses');
}

// ==========================================
// COPY KODE AKSES
// ==========================================
function copyKodeAkses(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => showKaitkanToast('✅ Kode dicopy'))
            .catch(() => fallbackCopyKodeAkses(text));
    } else {
        fallbackCopyKodeAkses(text);
    }
}

function fallbackCopyKodeAkses(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showKaitkanToast('✅ Kode dicopy');
    } catch(e) {
        showKaitkanToast('❌ Gagal copy', true);
    }
    document.body.removeChild(textarea);
}

// ==========================================
// POPUP AKUN SAYA (setelah verified)
// ==========================================
async function openAkunSaya() {
    const ign = localStorage.getItem('u_ign') || 'Member';
    const savedKode = localStorage.getItem('u_web_kode') || '';
    
    let kodeSectionHTML = '';
    if (savedKode) {
        kodeSectionHTML = `
            <div class="kaitkan-sukses-box">
                <div class="kaitkan-sukses-label">🔑 Kode Akses Anda</div>
                <div class="kaitkan-sukses-value">${escapeHtmlKaitkan(savedKode)}</div>
                <button class="kaitkan-copy-btn" onclick="copyKodeAkses('${escapeHtmlKaitkan(savedKode)}')">
                    <i class="fas fa-copy"></i> Copy Kode
                </button>
            </div>
        `;
    } else {
        kodeSectionHTML = `
            <div class="kaitkan-sukses-box kaitkan-sukses-box-empty">
                <div class="kaitkan-sukses-label">🔑 Kode Akses</div>
                <div class="kaitkan-sukses-empty-text">
                    Kode tidak tersimpan di device ini.<br>
                    Minta kode baru ke admin jika perlu login device lain.
                </div>
            </div>
        `;
    }
    
    const popupHTML = `
        <div class="kaitkan-overlay" id="kaitkanOverlay">
            <div class="kaitkan-popup">
                <button class="kaitkan-close" onclick="closeKaitkanAkun()">✕</button>
                
                <div class="kaitkan-header">
                    <div class="kaitkan-icon kaitkan-icon-sukses">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <h2>Akun Saya</h2>
                    <p>Akun Anda sudah terkait dengan web.</p>
                </div>
                
                <div class="kaitkan-sukses-info">
                    <div class="kaitkan-sukses-row">
                        <span>IGN:</span>
                        <strong>${escapeHtmlKaitkan(ign)}</strong>
                    </div>
                    <div class="kaitkan-sukses-row">
                        <span>Status:</span>
                        <strong style="color: #4ade80;">✅ Terkait</strong>
                    </div>
                </div>
                
                ${kodeSectionHTML}
                
                <div class="kaitkan-sukses-hint">
                    <i class="fas fa-info-circle"></i>
                    Login device baru: gunakan <strong>nomor WA + kode di atas</strong>.
                </div>
                
                <button class="kaitkan-btn" onclick="closeKaitkanAkun()">
                    <i class="fas fa-times"></i> TUTUP
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    isKaitkanPopupOpen = true;
    
    history.pushState({ akunSaya: true }, null, '#akun-saya');
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

function showKaitkanToast(msg, isError = false) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    
    toast.innerText = msg;
    toast.style.borderColor = isError ? '#ff4444' : 'var(--color-primary)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// BACK BUTTON HANDLER
// ==========================================
window.addEventListener('popstate', function(e) {
    if (isKaitkanPopupOpen) {
        const overlay = document.getElementById('kaitkanOverlay');
        if (overlay) {
            overlay.remove();
            isKaitkanPopupOpen = false;
            e.preventDefault();
            return;
        }
    }
});

// ==========================================
// EXPOSE
// ==========================================
window.openKaitkanAkun = openKaitkanAkun;
window.closeKaitkanAkun = closeKaitkanAkun;
window.submitKaitkanAkun = submitKaitkanAkun;
window.openAkunSaya = openAkunSaya;
window.copyKodeAkses = copyKodeAkses;
window.cekStatusAkun = cekStatusAkun;
window.isKaitkanPopupOpen = () => isKaitkanPopupOpen;

console.log('✅ kaitkan-akun.js loaded');
