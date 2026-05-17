/**
 * chat.js - Umbrella Chat Engine (Final Gold - Gatekeeper Sleep Edition)
 * Fitur: Polling 4.5s Mandiri, Text-Stamp, Presence Admin, Mute Logic, UID-Match, Absolute Gatekeeper Sleep.
 * Integrasi: Mailbox Unified System (Optimistic UI & Game Toast Control)
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";
const URL_MAIL  = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; 

// State System Engine
let isMuted = false, lastChatStamp = "", isSending = false, isSendingMail = false; 

function fastScroll() {
    const lb = document.getElementById('chat-logs');
    if (lb) lb.scrollTop = lb.scrollHeight;
}

// 2. TOGGLE POPUP (UX Fisik: Auto-close Mailbox jika chatbox dibuka)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    const mailModal = document.getElementById('mail-modal');
    if (!popup) return;
    
    // Jika kotak surat lagi mekar, paksa tutup dulu
    if (mailModal && mailModal.classList.contains('show')) {
        mailModal.classList.remove('show');
    }

    popup.classList.toggle('show');
    
    if (popup.classList.contains('show')) {
        fastScroll();
        setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
        syncChat(true); 
    }
}

// ==========================================
// [3] PENARIKAN IDENTITAS (DENGAN SKEMA ANONIM SARAN)
// ==========================================
function dapatkanIdentitasAman() {
    const categoryEl = document.getElementById('mail-category');
    
    // 🎯 DETEKSI MODE STANDALONE: Jika kategori dikunci di 'Saran' (disabled)
    if (categoryEl && categoryEl.value === 'Saran' && categoryEl.disabled === true) {
        // Buat UID acak unik berbasis waktu agar tidak bentrok di database
        const randomID = "ANON-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        return { uid: randomID, ign: "Member" };
    }
    
    // Jalur Normal (Untuk Chatbox atau Request Join / Umum)
    let uid = window.myUID || localStorage.getItem('UG_ID') || "GUEST_TMP";
    let ign = window.myIGN || localStorage.getItem('UG_NAME') || "Guest";
    return { uid: uid, ign: ign };
}

// 4. SINKRONISASI UTAMA (Dengan Penjaga Gerbang Fisik Popup)
function syncChat(force = false) {
    // --- [ 🔒 GEMBOK HULU: PENGHEMAT KUOTA POSISI TERTUTUP ] ---
    const popup = document.getElementById('chat-popup');
    
    if (!force && (!popup || !popup.classList.contains('show'))) {
        console.log("💤 Chatbox tertutup. Detak interval dilewati murni (Kuota GAS Aman).");
        return; 
    }

    const user = dapatkanIdentitasAman();

    fetch(`${URL_READ}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}`)
    .then(res => res.json())
    .then(data => {
        if (!data) return;

        // BONCENGAN STATUS ADMIN
        const statusEl = document.querySelector('#admin-status b');
        if (statusEl) {
            const onlineStatus = (data.adminOnline !== undefined) ? data.adminOnline : (data.adminStatus === "ONLINE");
            statusEl.className = onlineStatus ? "status-online" : "status-offline";
            statusEl.innerText = onlineStatus ? "ONLINE" : "OFFLINE";
        }

        const arrayChat = data.logs || data.chats || [];
        if (!Array.isArray(arrayChat)) return;

        // PENGHEMAT RENDERING (TEXT STAMP)
        const currentStamp = JSON.stringify(arrayChat);
        if (!force && currentStamp === lastChatStamp) {
            // Logs skip render
        } else {
            lastChatStamp = currentStamp;
            const lb = document.getElementById('chat-logs');
            if (lb) {
                lb.innerHTML = ''; 
                arrayChat.forEach(msg => {
                    try {
                        const msgUID  = msg.uid || msg[2] || '';
                        const msgName = msg.username || msg[3] || 'Anon';
                        const msgText = msg.message || msg[4] || '';
                        const msgRole = msg.role || msg[5] || '';
                        const msgType = msg.type || '';

                        if (msgType && msgType.startsWith('MUTE|') && msgType.includes(user.uid)) {
                            isMuted = true;
                            const input = document.getElementById('msg-input');
                            if (input) { input.disabled = true; input.placeholder = "ACCESS RESTRICTED"; }
                        }
                        
                        const d = document.createElement('div');
                        const isMe = msgUID === user.uid;
                        const isAdmin = msgUID === 'ADMIN_CMD' || msgRole === 'Admin';

                        if (isAdmin) {
                            d.className = 'chat-row admin-msg';
                            d.innerHTML = `<center><span>${msgText}</span></center>`;
                        } else if (isMe) {
                            d.className = 'chat-row me';
                            d.innerHTML = `<b>${msgName}</b><span class="msg-text">${msgText}</span>`;
                        } else {
                            d.className = 'chat-row other';
                            d.innerHTML = `<b style="color:${getHashColor(msgUID)}">${msgName}</b><span class="msg-text">${msgText}</span>`;
                        }
                        lb.appendChild(d);
                    } catch (e) { console.error("Error baris:", e); }
                });
                fastScroll();
            }
        }
    })
    .catch(err => console.error("Koneksi Pipa GAS 2 Terputus:", err));
}

// 5. KIRIM PESAN
function sendMessage() {
    if (isMuted || isSending) return;
    const input = document.getElementById('msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    const user = dapatkanIdentitasAman();
    isSending = true;
    const lb = document.getElementById('chat-logs');
    
    const t = document.createElement('div');
    t.className = 'chat-row me';
    t.style.opacity = "0.9";
    t.innerHTML = `<b>${user.ign}</b><span class="msg-text">${msg}</span>`;
    if (lb) lb.appendChild(t);
    fastScroll();

    input.value = '';

    fetch(`${URL_WRITE}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}`)
    .then(() => { 
        isSending = false; 
        setTimeout(() => { syncChat(true); }, 500);
    })
    .catch(() => { isSending = false; });
}

function getHashColor(u) {
    if (!u) return '#ccc';
    let h = 0;
    for (let i = 0; i < u.length; i++) h = u.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 75%, 75%)`;
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }


// ==========================================
// [6] INTERFASE KOTAK SURAT (MAILBOX ENGINE)
// ==========================================

// 🎯 KOREKSI 1: Kembalikan fungsi pengatur layout dinamis WA yang hilang
function aturFormMailbox() {
    const categoryEl = document.getElementById('mail-category');
    const waGroup = document.getElementById('wa-group');
    const labelPesan = document.getElementById('mail-label-pesan');
    const textarea = document.getElementById('mail-message');
    
    if (!categoryEl) return;
    const kategori = categoryEl.value;

    if (kategori === "Request Join") {
        if (waGroup) waGroup.style.display = "flex";
        if (labelPesan) labelPesan.innerText = "Alasan / Biodata Join :";
        if (textarea) textarea.placeholder = "Sebutkan Level, Job Utama, dan alasan kamu ingin bergabung...";
    } else {
        if (waGroup) waGroup.style.display = "none";
        if (labelPesan) labelPesan.innerText = "Pesan Anda :";
        if (textarea) textarea.placeholder = "Tulis pesan atau laporan untuk Admin Umbrella...";
    }
}

// Fungsi Buka-Tutup Modal Surat (UX Fisik: Auto-close chatbox)
function toggleMail() {
    const mailModal = document.getElementById('mail-modal');
    const chatPopup = document.getElementById('chat-popup');
    if (!mailModal) return;

    // Jika obrolan sedang mekar, paksa tutup dulu (Memicu Gembok Hulu Aktif)
    if (chatPopup && chatPopup.classList.contains('show')) {
        chatPopup.classList.remove('show');
    }

    mailModal.classList.toggle('show');
    
    if (mailModal.classList.contains('show')) {
        const textarea = document.getElementById('mail-message');
        const inputWA = document.getElementById('mail-wa');
        if (textarea) { textarea.value = ''; textarea.disabled = false; }
        if (inputWA) { 
            inputWA.value = ''; 
            inputWA.disabled = false; 
            inputWA.placeholder = "Contoh: 08xxxxxxxxxx"; 
        }
        aturFormMailbox();
        setTimeout(() => {
            const visibleInput = inputWA && document.getElementById('wa-group').style.display !== "none" ? inputWA : textarea;
            if (visibleInput) visibleInput.focus();
        }, 300);
    }
}

// Notifikasi Kustom ala Game
function tampilkanToast(pesan) {
    const toast = document.getElementById('mail-toast');
    if (!toast) return;
    
    toast.innerText = pesan;
    toast.classList.add('muncul');
    
    setTimeout(() => {
        toast.classList.remove('muncul');
    }, 3000);
}

// Fungsi Mengirim Surat ke GAS Pipa 1
function sendMail() {
    if (isSendingMail) return; 
    
    const categoryEl = document.getElementById('mail-category');
    const selectedCategory = categoryEl ? categoryEl.value : 'Umum';

    const textarea = document.getElementById('mail-message');
    let msg = textarea ? textarea.value.trim() : '';
    
    const inputWA = document.getElementById('mail-wa');
    const waValue = inputWA ? inputWA.value.trim() : '';

    // Deteksi apakah sedang dalam mode standalone saran
    const isStandaloneMode = document.body.classList.contains('standalone-saran-mode');

    // VALIDASI KOLOM
    if (selectedCategory === "Request Join") {
        if (!waValue) { tampilkanToast("⚠️ Nomor WhatsApp wajib diisi!"); if (inputWA) inputWA.focus(); return; }
        if (!msg) { tampilkanToast("⚠️ Alasan/Biodata Join tidak boleh kosong!"); if (textarea) textarea.focus(); return; }
        msg = `${waValue}\n${msg}`;
    } else {
        if (!msg) { tampilkanToast("⚠️ Pesan surat tidak boleh kosong!"); if (textarea) textarea.focus(); return; }
    }
    
    const user = dapatkanIdentitasAman();
    isSendingMail = true;
    
    const sendBtn = document.querySelector('.mail-send-btn');
    if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMPROSES...';
    if (textarea) textarea.disabled = true;
    if (inputWA) inputWA.disabled = true;
    if (categoryEl) categoryEl.disabled = true;

    // 🎯 KONDISI 1: JALUR NORMAL (Buka dari web) -> LANGSUNG TUTUP INSTAN BIAR RESPONSIF
    if (!isStandaloneMode) {
        toggleMail();
    }

    fetch(`${URL_MAIL}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}&category=${encodeURIComponent(selectedCategory)}&type=mail`)
    .then(res => res.json())
    .then(data => {
        isSendingMail = false;
        
        // Kembalikan teks tombol asli jika sewaktu-waktu modal dibuka lagi di jalur normal
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';

        if (data.status === "success") {
            if (isStandaloneMode) {
                // 🎯 KONDISI 2: JALUR STANDALONE -> SULAP JADI NOTIFIKASI SUKSES KARENA GAK BISA CLOSE
                const modalBody = document.querySelector('.mail-modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div style="text-align: center; padding: 30px 10px; color: #fff; animation: mekarHalus 0.3s ease-out;">
                            <i class="fa-solid fa-circle-check" style="font-size: 3.5rem; color: var(--color-primary); margin-bottom: 15px; text-shadow: 0 0 15px rgba(192, 132, 252, 0.4);"></i>
                            <h4 style="margin: 0 0 10px 0; letter-spacing: 1px; font-size: 1.1rem;">SURAT TERKIRIM</h4>
                            <p style="font-size: 0.8rem; color: #888; line-height: 1.5; margin: 0;">
                                Terima kasih! Pesan Anda telah berhasil dienkripsi dan dicatat ke dalam database Admin Umbrella.
                            </p>
                        </div>
                    `;
                }
            }
            // Toast universal tetap muncul manis di bawah layar
            tampilkanToast("📬 Surat berhasil dikirim!");
        } else {
            tampilkanToast("⚠️ Gagal: " + (data.message || "Sistem error."));
            // Jika jalur normal gagal di server, buka kembali boksnya agar teks ketikan gak ilang
            if (!isStandaloneMode) toggleMail();
            if (textarea) textarea.disabled = false;
            if (inputWA) inputWA.disabled = false;
            if (categoryEl) categoryEl.disabled = false;
        }
    })
    .catch(err => {
        isSendingMail = false;
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';
        tampilkanToast("🚨 Koneksi terputus! Gagal mengirim.");
        
        if (!isStandaloneMode) toggleMail();
        if (textarea) textarea.disabled = false;
        if (inputWA) inputWA.disabled = false;
        if (categoryEl) categoryEl.disabled = false;
        console.error("Pipa GAS 1 Terputus:", err);
    });
}
// Tutup modal otomatis jika user klik area luar kotak hitam (Overlay)
window.addEventListener('click', function(e) {
    const mailModal = document.getElementById('mail-modal');
    if (e.target === mailModal) {
        mailModal.classList.remove('show');
    }
});


// ==========================================
// [7] DETEKSI DEEP LINKING KOTAK SARAN STANDALONE
// ==========================================
// Deep link detektor saran internal (Dynamic CSS Injection Edition)
// Deep link detektor saran internal (Pure Standalone + Text Customizer Edition)
function cekLinkSaranStandalone() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('page') || urlParams.get('mode') || urlParams.get('kategori');
    
    if (mode && mode.toLowerCase() === 'saran') {
        // Suntik CSS khusus standalone secara otomatis ke head
        const linkCSS = document.createElement('link');
        linkCSS.rel = 'stylesheet';
        linkCSS.href = 'css/standalone.css'; 
        document.head.appendChild(linkCSS);

        // Tambahkan tanda pengenal di body
        document.body.classList.add('standalone-saran-mode');

        // Kunci nilai dropdown ke kategori Saran di balik layar (Meskipun elemennya disembunyikan CSS)
        const categoryEl = document.getElementById('mail-category');
        if (categoryEl) {
            categoryEl.value = 'Saran'; 
            categoryEl.disabled = true; 
        }
        
        // 🎯 KUSTOMISASI TEKS KHUSUS UNTUK KOTAK SARAN INTERNAL
        const labelPesan = document.getElementById('mail-label-pesan');
        const textarea = document.getElementById('mail-message');
        
        if (labelPesan) {
            labelPesan.innerText = "Saran / Masukan Anda :";
        }
        if (textarea) {
            textarea.placeholder = "Tulis aspirasi, ide, kritik, atau saran jujur Anda untuk perkembangan guild Umbrella...";
        }
        
        // Tampilkan modal secara instan
        const mailModal = document.getElementById('mail-modal');
        if (mailModal) mailModal.classList.add('show');
        
        console.log("🛡️ Standalone Loaded: Dropdown lenyap, teks disesuaikan murni untuk Kotak Saran.");
    }
}

// ==========================================
// 🎯 KOREKSI 2: Pintu Gerbang Global Expose (Wajib)
// ==========================================
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.syncChat = syncChat;

window.toggleMail = toggleMail;
window.sendMail = sendMail;
window.aturFormMailbox = aturFormMailbox;


// ==========================================
// [9] MESIN PENGASUH INTERVAL UTAMA
// ==========================================
setInterval(() => {
    syncChat(false);
}, 4500);

window.addEventListener('DOMContentLoaded', cekLinkSaranStandalone);

console.log("🛡️ Umbrella Chat Engine: Semua Komponen Terintegrasi Sempurna!");
