/**
 * kaitkan-akun.js — Fitur Kaitkan Akun (Web Publik)
 * Gaya: konsisten dengan modal web publik (mail/info/tentang)
 */

// ==========================================
// STATE
// ==========================================
let isKaitkanPopupOpen = false;

// ==========================================
// CEK STATUS AKUN
// ==========================================
async function cekStatusAkun() {
    const uUid = localStorage.getItem('u_uid') || '';
    if (!uUid) return { hasAccount: false };
    
    if (!uUid.startsWith('M-')) {
        return { hasAccount: false };
    }
    
    try {
        const url = `${GAS.MAIN}?action=checkAccountStatus&uid=${encodeURIComponent(uUid)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('📊 checkAccountStatus:', data);
        
        if (data.hasAccount && data.webUID && data.webUID !== uUid) {
            console.log('🔄 Auto-sync u_uid dari server:', data.webUID);
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
// BUKA POPUP FORM KAITKAN AKUN
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
    
    // Update header modal global
    const modalHeader = document.querySelector('#kaitkanOverlay .kaitkan-modal-header');
    
    const popupHTML = `
        <div class="kaitkan-overlay open" id="kaitkanOverlay">
            <div class="kaitkan-modal">
                
                <!-- Bingkai ornamen -->
                <div class="modal-frame">
                    <div class="frame-h atas">
                        <div class="pojok"></div>
                        <div class="garis-h"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-h bawah">
                        <div class="pojok"></div>
                        <div class="garis-h"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-v kiri">
                        <div class="pojok"></div>
                        <div class="garis-v"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-v kanan">
                        <div class="pojok"></div>
                        <div class="garis-v"></div>
                        <div class="pojok"></div>
                    </div>
                </div>
                
                <!-- Header -->
                <div class="kaitkan-modal-header">KAITKAN AKUN</div>
                
                <!-- Body -->
                <div class="kaitkan-modal-body" id="kaitkanModalBody">
                    
                    <div class="kaitkan-icon-wrap">
                        <i class="fas fa-link"></i>
                    </div>
                    
                    <p class="kaitkan-desc">
                        Kaitkan akun agar bisa login dari device lain tanpa verifikasi ulang.
                    </p>
                    
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
                        
                        <!-- Tombol pakai btn-svg -->
                        <div class="btn-svg kaitkan-submit-btn" id="kaitkanSubmitBtn" onclick="submitKaitkanAkun()">
                            <div class="btn-ujung-kiri"></div>
                            <div class="btn-tengah"><span class="btn-teks">KAITKAN AKUN</span></div>
                            <div class="btn-ujung-kanan"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    isKaitkanPopupOpen = true;
    
    history.pushState({ kaitkan: true }, null, '#kaitkan');
    
    // Update tombol menu stage (back + home)
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    if (typeof updateButtons === 'function') updateButtons();
    
    setTimeout(() => {
        const input = document.getElementById('kaitkanWaInput');
        if (input) input.focus();
    }, 300);
}

// ==========================================
// TUTUP POPUP
// ==========================================
function closeKaitkanAkun() {
    const overlay = document.getElementById('kaitkanOverlay');
    if (overlay) overlay.remove();
    isKaitkanPopupOpen = false;
    
    // Hapus class dari stage
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('kaitkan-open');
    if (typeof updateButtons === 'function') updateButtons();
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
    
    // Loading state
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
            // Update localStorage
            localStorage.setItem('u_uid', data.webUID);
            localStorage.setItem('u_web_uid', data.webUID);
            localStorage.setItem('u_web_kode', kode);
            window.myUID = data.webUID;
            
            if (typeof updateIdentityUI === 'function') {
                updateIdentityUI();
            }
            
            showKaitkanSuccessInModal();
            
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
// SUKSES — Form disabled, tombol hilang, notif muncul
// ==========================================
function showKaitkanSuccessInModal() {
    // 1. Disable input
    const waInput = document.getElementById('kaitkanWaInput');
    const kodeInput = document.getElementById('kaitkanKodeInput');
    
    if (waInput) waInput.disabled = true;
    if (kodeInput) kodeInput.disabled = true;
    
    // 2. Hapus tombol submit
    const btn = document.getElementById('kaitkanSubmitBtn');
    if (btn) btn.remove();
    
    // 3. Hapus pesan error
    const msgEl = document.getElementById('kaitkanMessage');
    if (msgEl) msgEl.remove();
    
    // 4. Tambah notif sukses (style chat system message)
    const form = document.querySelector('.kaitkan-form');
    if (form) {
        const notifHTML = `
            <div class="kaitkan-success-notif" id="kaitkanSuccessNotif">
                <i class="fas fa-check-circle"></i>
                Akun Berhasil Dikaitkan, simpan kode akses anda!
            </div>
        `;
        form.insertAdjacentHTML('beforeend', notifHTML);
        
        setTimeout(() => {
            const notifEl = document.getElementById('kaitkanSuccessNotif');
            if (notifEl) notifEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// ==========================================
// POPUP AKUN SAYA
// ==========================================
async function openAkunSaya() {
    const ign = localStorage.getItem('u_ign') || 'Member';
    const savedKode = localStorage.getItem('u_web_kode') || '';
    
    let kodeSectionHTML = '';
    if (savedKode) {
        kodeSectionHTML = `
            <div class="kaitkan-kode-box">
                <div class="kaitkan-kode-label">🔑 Kode Akses Anda</div>
                <div class="kaitkan-kode-value">${escapeHtmlKaitkan(savedKode)}</div>
            </div>
        `;
    } else {
        kodeSectionHTML = `
            <div class="kaitkan-kode-box kaitkan-kode-box-empty">
                <div class="kaitkan-kode-label">🔑 Kode Akses</div>
                <div class="kaitkan-kode-empty">
                    Kode tidak tersimpan di device ini.<br>
                    Minta kode baru ke admin jika perlu login device lain.
                </div>
            </div>
        `;
    }
    
    const popupHTML = `
        <div class="kaitkan-overlay open" id="kaitkanOverlay">
            <div class="kaitkan-modal">
                
                <div class="modal-frame">
                    <div class="frame-h atas">
                        <div class="pojok"></div>
                        <div class="garis-h"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-h bawah">
                        <div class="pojok"></div>
                        <div class="garis-h"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-v kiri">
                        <div class="pojok"></div>
                        <div class="garis-v"></div>
                        <div class="pojok"></div>
                    </div>
                    <div class="frame-v kanan">
                        <div class="pojok"></div>
                        <div class="garis-v"></div>
                        <div class="pojok"></div>
                    </div>
                </div>
                
                <div class="kaitkan-modal-header">AKUN SAYA</div>
                
                <div class="kaitkan-modal-body">
                    
                    <div class="kaitkan-icon-wrap kaitkan-icon-success">
                        <i class="fas fa-user-check"></i>
                    </div>
                    
                    <p class="kaitkan-desc">Akun Anda sudah terkait dengan web.</p>
                    
                    <div class="kaitkan-info-row">
                        <span class="kaitkan-info-label">IGN:</span>
                        <strong class="kaitkan-info-value">${escapeHtmlKaitkan(ign)}</strong>
                    </div>
                    
                    <div class="kaitkan-info-row">
                        <span class="kaitkan-info-label">Status:</span>
                        <strong class="kaitkan-info-value kaitkan-status-verified">✅ Terkait</strong>
                    </div>
                    
                    ${kodeSectionHTML}
                    
                    <div class="kaitkan-hint">
                        <i class="fas fa-info-circle"></i>
                        Login device baru: gunakan <strong>nomor WA + kode di atas</strong>.
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    isKaitkanPopupOpen = true;
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.add('kaitkan-open');
    if (typeof updateButtons === 'function') updateButtons();
    
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

// ==========================================
// BACK BUTTON HANDLER
// ==========================================
window.addEventListener('popstate', function(e) {
    if (isKaitkanPopupOpen) {
        closeKaitkanAkun();
        e.preventDefault();
        return;
    }
});

// ==========================================
// EXPOSE
// ==========================================
window.openKaitkanAkun = openKaitkanAkun;
window.closeKaitkanAkun = closeKaitkanAkun;
window.submitKaitkanAkun = submitKaitkanAkun;
window.openAkunSaya = openAkunSaya;
window.cekStatusAkun = cekStatusAkun;
window.isKaitkanPopupOpen = () => isKaitkanPopupOpen;

console.log('✅ kaitkan-akun.js loaded (Web Publik — konsisten tema)');
