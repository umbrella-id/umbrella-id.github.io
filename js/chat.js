/**
 * chat.js - Umbrella Chat Engine (Final Gold - Verified Patch V2.1)
 * Fitur: Polling 4.5s Mandiri, Text-Stamp, Presence Admin, Mute Logic, UID-Match, Absolute Gatekeeper Sleep.
 * Integrasi: Mailbox Unified System (Optimistic UI & Game Toast Control - No Lock Bug)
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";
const URL_MAIL  = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; 

// 🎯 STATE SYSTEM ENGINE (Urutan Diperbaiki & Kunci Disamakan)
let isMuted = false, lastChatStamp = "", isSending = false, isSendingMail = false; 
let muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;

function fastScroll() {
    const lb = document.getElementById('chat-logs');
    if (lb) lb.scrollTop = lb.scrollHeight;
}

// 2. TOGGLE POPUP (UX Android Native Navbar Back Button Support)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    const mailModal = document.getElementById('mail-modal');
    if (!popup) return;
    
    if (mailModal && mailModal.classList.contains('show')) {
        mailModal.classList.remove('show');
    }

    const isOpening = !popup.classList.contains('show');
    popup.classList.toggle('show');
    
    if (isOpening) {
        history.pushState({ boksTerbuka: "chat" }, "");
        fastScroll();
        if (window.innerWidth >= 768) {
            setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
        }
        syncChat(true); 
    } else {
        if (history.state && history.state.boksTerbuka === "chat") {
            history.back();
        }
    }
}

// ==========================================
// 🚨 SATPAM PENJAGA TOMBOL BACK NAVBAR ANDROID
// ==========================================
window.addEventListener('popstate', function (event) {
    const popup = document.getElementById('chat-popup');
    const mailModal = document.getElementById('mail-modal');
    const gate = document.getElementById('site-gatekeeper');
    const detailModal = document.getElementById('detailModal');

    if (popup && popup.classList.contains('show')) {
        popup.classList.remove('show');
        console.log("🛡️ Navbar Back detected: Closing Chatbox successfully.");
    }
        
    if (mailModal && mailModal.classList.contains('show')) {
        mailModal.classList.remove('show');
        console.log("🛡️ Navbar Back detected: Closing Mailbox successfully.");
    }
    if (gate && (gate.style.display === 'flex' || gate.style.opacity === '1')) {
        if (typeof window.closeGateFromNavbar === "function") {
            window.closeGateFromNavbar(); 
        }
    }
    if (detailModal && detailModal.style.display === 'flex') {
        if (typeof window.closeDetailFromNavbar === "function") {
            window.closeDetailFromNavbar(); 
        } else {
            detailModal.style.display = 'none'; 
            isModalOpen = false;
        }
    }
});

// ==========================================
// [3] PENARIKAN IDENTITAS (DENGAN SKEMA ANONIM SARAN)
// ==========================================
function dapatkanIdentitasAman() {
    const isStandaloneMode = document.body.classList.contains('standalone-saran-mode');
    
    if (isStandaloneMode) {
        const randomID = "ANON-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        return { uid: randomID, ign: "Member" };
    }
    
    let uid = window.myUID || localStorage.getItem('u_uid') || "GUEST_TMP";
    let ign = window.myIGN || localStorage.getItem('u_ign') || "Guest";
    return { uid: uid, ign: ign };
}

function syncChat(force = false) {
    const popup = document.getElementById('chat-popup');
    
    if (!force && (!popup || !popup.classList.contains('show'))) {
        console.log("💤 Chatbox tertutup. Detak interval dilewati murni (Kuota GAS Aman).");
        return; 
    }

    const user = dapatkanIdentitasAman();

    // --- LOGIKA UNMUTE OTOMATIS JIKA DURASI SUDAH HABIS ---
    const input = document.getElementById('msg-input');
    if (muteExpiryTime > 0) {
        if (Date.now() >= muteExpiryTime) {
            muteExpiryTime = 0;
            localStorage.removeItem('umbrella_mute_expiry');
            if (input) { 
                input.disabled = false; 
                input.placeholder = "Ketik pesan..."; 
            }
            console.log("🔓 Masa hukuman mute berakhir. Akses chat dipulihkan.");
        } else {
            if (input && !input.disabled) {
                input.disabled = true;
                const sisaMenit = Math.ceil((muteExpiryTime - Date.now()) / 60000);
                input.placeholder = `MUTED (${sisaMenit}m)`;
            }
        }
    }

    fetch(`${URL_READ}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}`)
    .then(res => res.json())
    .then(data => {
        if (!data) return;

        // ==========================================
        // 🟢 PERBAIKAN: BONCENGAN STATUS ADMIN (3 MODE: ONLINE, STANDBY, OFFLINE)
        // ==========================================
        const statusEl = document.querySelector('#admin-status b');
        if (statusEl) {
            // Ambil string status murni dari server GAS Pipa 2, paksa ke huruf besar (Uppercase)
            const adminState = (data.adminStatus || "").toUpperCase();
        
            if (adminState === "ONLINE") {
                statusEl.className = "status-online";
                statusEl.innerText = "ONLINE";
            } else if (adminState === "STANDBY") {
                statusEl.className = "status-standby";
                statusEl.innerText = "STANDBY";
            } else {
                statusEl.className = "status-offline";
                statusEl.innerText = "OFFLINE";
            }
        }

        const arrayChat = data.logs || data.chats || [];
        if (!Array.isArray(arrayChat)) return;

        // ==========================================
        // 🛡️ REVISI SINKRONISASI GERBANG COMMAND MUTE (GAS 4 MATCH)
        // ==========================================
        arrayChat.forEach(msg => {
            const msgType = msg.type || '';
            const msgText = msg.message || '';
            const msgTimestamp = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
        
            // 1. Deteksi Sinyal Pembungkaman (Format GAS 4: MUTE_UID_DURASI)
            if (msgType === 'command' && msgText.startsWith('MUTE_')) {
                const parts = msgText.split('_'); // Memecah menjadi ["MUTE", "UID", "DURASI"]
                const targetUID = parts[1];
                const durasiMenit = parseInt(parts[2]) || 0;
        
                // Cocokkan apakah korbannya adalah UID user ini
                if (targetUID === user.uid && durasiMenit > 0) {
                    // Hitung target waktu kapan hukuman berakhir berdasarkan waktu baris disuntikkan
                    const hitungMundurTarget = msgTimestamp + (durasiMenit * 60 * 1000);
                    
                    // Jika waktu sekarang masih di bawah target hitung mundur, kunci!
                    if (Date.now() < hitungMundurTarget) {
                        muteExpiryTime = hitungMundurTarget;
                        localStorage.setItem('umbrella_mute_expiry', hitungMundurTarget);
                        if (input) { 
                            input.disabled = true; 
                            const sisaMenit = Math.ceil((hitungMundurTarget - Date.now()) / 60000);
                            input.placeholder = `ACCESS RESTRICTED (${sisaMenit}m)`; 
                        }
                    }
                }
            }
        
            // 2. Deteksi Sinyal Pembebasan (Format GAS 4 masa depan: UNMUTE_UID)
            if (msgType === 'command' && msgText.startsWith('UNMUTE_')) {
                const parts = msgText.split('_');
                const targetUID = parts[1];
        
                if (targetUID === user.uid) {
                    muteExpiryTime = 0;
                    localStorage.removeItem('umbrella_mute_expiry');
                    if (input) { 
                        input.disabled = false; 
                        input.placeholder = "Ketik pesan..."; 
                    }
                }
            }
        });

        // JALUR RENDER VISUAL BUBBLE OBROLAN
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
                        const msgType = msg.type || 'msg';

                        // 🔴 Saring ketat! Selain tipe 'msg', dilarang mencemari chatbox publik.
                        if (msgType !== 'msg') return; 

                        const msgUID  = msg.uid || msg[2] || '';
                        const msgName = msg.username || msg[3] || 'Anon';
                        const msgText = msg.message || msg[4] || '';
                        const msgRole = msg.role || msg[5] || '';
                        
                        const d = document.createElement('div');
                        const isMe = msgUID === user.uid;

                        // 🟢 Admin dideteksi fleksibel jika UID diawali dengan "ADMIN_"
                        const isAdmin = (typeof msgUID === 'string' && msgUID.startsWith('ADMIN_')) || msgRole === 'Admin';

                        if (isAdmin) {
                            d.className = 'chat-row admin-msg';
                            d.innerHTML = `<div class="admin-bubble-box"><b>⚡ [ADMIN] ${msgName}:</b> <span>${msgText}</span></div>`;
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

// Fungsi untuk menjatuhkan hukuman mute (Sinkron ke laci penyimpanan yang sama)
function applyMute(durationMinutes) {
    const expiry = Date.now() + (durationMinutes * 60 * 1000);
    muteExpiryTime = expiry;
    localStorage.setItem('umbrella_mute_expiry', expiry);
    tampilkanToast(`Anda dibisukan selama ${durationMinutes} menit.`);
}

// Fungsi Unmute untuk membebaskan user seketika
function applyUnmute() {
    muteExpiryTime = 0;
    localStorage.removeItem('umbrella_mute_expiry');
    tampilkanToast("Akses chat Anda telah dipulihkan.");
}

// Validasi di dalam fungsi sendMessage() sebelum menembak ke URL_WRITE
function sendMessage() {
    if (Date.now() < muteExpiryTime) {
        const sisaDetik = Math.ceil((muteExpiryTime - Date.now()) / 1000);
        tampilkanToast(`Chat dikunci. Sisa waktu bisu: ${sisaDetik} detik.`);
        return; 
    }
    
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

function getHashColor(uid) {
    if (!uid) return '#ccc';
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 75%, 75%)`;
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }


// ==========================================
// [6] INTERFASE KOTAK SURAT (MAILBOX ENGINE)
// ==========================================

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

function toggleMail() {
    const mailModal = document.getElementById('mail-modal');
    const chatPopup = document.getElementById('chat-popup');
    if (!mailModal) return;

    if (chatPopup && chatPopup.classList.contains('show')) {
        chatPopup.classList.remove('show');
    }

    const isOpeningMail = !mailModal.classList.contains('show');
    mailModal.classList.toggle('show');
    
    if (mailModal.classList.contains('show')) {
        const categoryEl = document.getElementById('mail-category'); 
        const textarea = document.getElementById('mail-message');
        const inputWA = document.getElementById('mail-wa');
        
        if (textarea) { textarea.value = ''; textarea.disabled = false; }
        if (inputWA) { inputWA.value = ''; inputWA.disabled = false; inputWA.placeholder = "Contoh: 08xxxxxxxxxx"; }
        
        const isStandaloneMode = document.body.classList.contains('standalone-saran-mode');

        if (categoryEl && isStandaloneMode) {
            categoryEl.value = 'Saran';
        }
        
        if (typeof aturFormMailbox === "function") aturFormMailbox();
        
        if (isOpeningMail) {
            history.pushState({ boksTerbuka: "mailbox" }, "");
        }
        
        if (window.innerWidth >= 768) {
            setTimeout(() => {
                const visibleInput = inputWA && document.getElementById('wa-group').style.display !== "none" ? inputWA : textarea;
                if (visibleInput) visibleInput.focus();
            }, 300);
        }
    } else {
        if (history.state && history.state.boksTerbuka === "mailbox") {
            history.back();
        }
    }
}

function tampilkanToast(pesan) {
    const toast = document.getElementById('mail-toast');
    if (!toast) return;
    
    toast.innerText = pesan;
    toast.classList.add('muncul');
    
    setTimeout(() => {
        toast.classList.remove('muncul');
    }, 3000);
}

function sendMail() {
    if (isSendingMail) return; 
    
    const categoryEl = document.getElementById('mail-category');
    const selectedCategory = categoryEl ? categoryEl.value : 'Umum';

    const textarea = document.getElementById('mail-message');
    let msg = textarea ? textarea.value.trim() : '';
    const inputWA = document.getElementById('mail-wa');
    const waValue = inputWA ? inputWA.value.trim() : '';

    const isStandaloneMode = document.body.classList.contains('standalone-saran-mode');

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

    if (!isStandaloneMode) {
        if (history.state && history.state.boksTerbuka === "mailbox") {
            history.back();
        }
        toggleMail();
    }

    fetch(`${URL_MAIL}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}&category=${encodeURIComponent(selectedCategory)}&type=mail`)
    .then(res => res.json())
    .then(data => {
        isSendingMail = false;
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';

        if (data.status === "success") {
            if (isStandaloneMode) {
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
            tampilkanToast("✉️ Surat berhasil dikirim!");
        } else {
            tampilkanToast("⚠️ Gagal: " + (data.message || "Sistem error."));
            if (!isStandaloneMode) toggleMail();
            if (textarea) textarea.disabled = false;
            if (inputWA) inputWA.disabled = false;
        }
    }
    )
    .catch(err => {
        isSendingMail = false;
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';
        tampilkanToast("🚨 Koneksi terputus! Gagal mengirim.");
        if (!isStandaloneMode) toggleMail();
        if (textarea) textarea.disabled = false;
        if (inputWA) inputWA.disabled = false;
        console.error("Pipa GAS 1 Terputus:", err);
    });
}

window.addEventListener('click', function(e) {
    const mailModal = document.getElementById('mail-modal');
    if (e.target === mailModal) {
        toggleMail(); 
    }
});

function cekLinkSaranStandalone() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('page') || urlParams.get('mode') || urlParams.get('kategori');
    
    if (mode && mode.toLowerCase() === 'saran') {
        const linkCSS = document.createElement('link');
        linkCSS.id = 'standalone-css-pack';
        linkCSS.rel = 'stylesheet';
        linkCSS.href = 'css/standalone.css'; 
        document.head.appendChild(linkCSS);

        document.body.classList.add('standalone-saran-mode');

        const categoryEl = document.getElementById('mail-category');
        if (categoryEl) {
            categoryEl.value = 'Saran'; 
        }
        
        const labelPesan = document.getElementById('mail-label-pesan');
        const textarea = document.getElementById('mail-message');
        if (labelPesan) labelPesan.innerText = "Saran / Masukan Anda :";
        if (textarea) textarea.placeholder = "Tulis aspirasi, ide, kritik, atau saran jujur Anda untuk perkembangan guild Umbrella...";
        
        const mailModal = document.getElementById('mail-modal');
        if (mailModal) mailModal.classList.add('show');
    } else {
        document.body.classList.remove('standalone-saran-mode');
        const sisaCSS = document.getElementById('standalone-css-pack');
        if (sisaCSS) sisaCSS.remove();
    }
}

// 🎯 Pintu Gerbang Global Expose
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.syncChat = syncChat;
window.toggleMail = toggleMail;
window.sendMail = sendMail;
window.aturFormMailbox = aturFormMailbox;

// [9] MESIN PENGASUH INTERVAL UTAMA
setInterval(() => {
    syncChat(false);
}, 4500);

window.addEventListener('DOMContentLoaded', cekLinkSaranStandalone);
console.log("🛡️ Umbrella Chat Engine: Semua Komponen Terintegrasi Sempurna!");
