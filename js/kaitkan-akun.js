/**
 * kaitkan-akun.js — Fitur Kaitkan Akun (Web Publik)
 * Style: konsisten dengan mail/info/tentang
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
    
    // Hapus dulu kalau ada (anti double)
    const existing = document.getElementById('kaitkanOverlay');
    if (existing) existing.remove();
    
    // 🎯 Modal di-inject KE DALAM STAGE (bukan body)
    const stage = document.getElementById('stage');
    if (!stage) {
        console.error('Stage tidak ditemukan');
        return;
    }
    
    const modalHTML = `
        <div class="kaitkan-overlay" id="kaitkanOverlay">
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
                <div class="kaitkan-header">KAITKAN AKUN</div>
                
                <!-- Body -->
                <div class="kaitkan-body">
                    
                    <p class="kaitkan-desc">
                        Kaitkan akun anda untuk mendapatkan menu lainnya
                    </p>
                    
                    <div class="kaitkan-form">
                        <div class="kaitkan-form-group">
                            <label><i class="fas fa-phone"></i> NOMOR WA</label>
                            <input type="tel" 
                                   id="kaitkanWaInput" 
                                   placeholder="628xxxxxxxxx"
                                   inputmode="numeric"
                                   pattern="[0-9]*"
                                   autocomplete="off">
                            <small>Gunakan kode negara, bukan nol</small>
                        </div>
                        
                        <div class="kaitkan-form-group">
                            <label><i class="fas fa-key"></i> KODE UNIK</label>
                            <input type="tel" 
                                   id="kaitkanKodeInput" 
                                   placeholder="123456"
                                   maxlength="6"
                                   inputmode="numeric"
                                   pattern="[0-9]*"
                                   autocomplete="off">
                            <small>Kode ini diperoleh dari admin</small>
                        </div>
                        
                        <div id="kaitkanMessage" class="kaitkan-message"></div>
                        
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
    
    // 🎯 Inject ke stage (bukan body)
    stage.insertAdjacentHTML('beforeend', modalHTML);
    
    // Open dengan animasi
    setTimeout(() => {
        const overlay = document.getElementById('kaitkanOverlay');
        if (overlay) overlay.classList.add('open');
    }, 20);
    
    isKaitkanPopupOpen = true;
    
    // Class di stage
    stage.classList.add('kaitkan-open');
    
    // Update tombol menu
    if (typeof updateButtons === 'function') updateButtons();
    
    // Push history
    history.pushState({ kaitkan: true }, null, '#kaitkan');
    
    setTimeout(() => {
        const input = document.getElementById('kaitkanWaInput');
        if (input) input.focus();
    }, 300);
}

// ==========================================
// TUTUP MODAL
// ==========================================
function closeKaitkanAkun() {
    const overlay = document.getElementById('kaitkanOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
    isKaitkanPopupOpen = false;
    
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('kaitkan-open');
    if (typeof updateButtons === 'function') updateButtons();
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
    if (btn) btn.remove();
    
    const msgEl = document.getElementById('kaitkanMessage');
    if (msgEl) msgEl.remove();
    
    const form = document.querySelector('.kaitkan-form');
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
    
    const existing = document.getElementById('kaitkanOverlay');
    if (existing) existing.remove();
    
    const stage = document.getElementById('stage');
    if (!stage) return;
    
    let kodeSectionHTML = '';
    if (savedKode) {
        kodeSectionHTML = `
            <div class="kaitkan-kode-box">
                <div class="kaitkan-kode-label">KODE AKSES ANDA</div>
                <div class="kaitkan-kode-value">${escapeHtmlKaitkan(savedKode)}</div>
            </div>
        `;
    } else {
        kodeSectionHTML = `
            <div class="kaitkan-kode-box kaitkan-kode-box-empty">
                <div class="kaitkan-kode-label">KODE AKSES</div>
                <div class="kaitkan-kode-empty">
                    Kode tidak tersimpan di device ini.<br>
                    Minta kode baru ke admin jika perlu login device lain.
                </div>
            </div>
        `;
    }
    
    const modalHTML = `
        <div class="kaitkan-overlay" id="kaitkanOverlay">
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
                
                <div class="kaitkan-header">AKUN SAYA</div>
                
                <div class="kaitkan-body">
                    
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
    
    stage.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        const overlay = document.getElementById('kaitkanOverlay');
        if (overlay) overlay.classList.add('open');
    }, 20);
    
    isKaitkanPopupOpen = true;
    stage.classList.add('kaitkan-open');
    
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

console.log('✅ kaitkan-akun.js loaded (Web Publik — konsisten modal lain)');
