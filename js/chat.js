/**
 * chat.js - Umbrella Chat Engine (Optimized - No Duplicate Render)
 * Fitur: Polling 4.5s Mandiri, Text-Stamp, Presence Admin, Mute Logic, UID-Match
 * Optimasi: Reusable render function, dead code removed
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";
const URL_MAIL  = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; 

// STATE
let isMuted = false, isSending = false, isSendingMail = false; 
let muteExpiryTime = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
let lastChatStamp = sessionStorage.getItem('umbrella_last_chat_stamp') || '';

// ==========================================
// FUNGSI RENDER REUSABLE (CORE)
// ==========================================
function renderChatMessages(container, messages, currentUserUid, currentUserIgn) {
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const msg of messages) {
        let msgType = msg.type || 'msg';
        let msgUID = msg.uid || msg[2] || '';
        let msgName = msg.username || msg[3] || 'Anon';
        let msgText = msg.message || msg[4] || '';
        let msgRole = msg.role || msg[5] || '';
        
        let isSystem = false;
        let isMuteCommand = false;
        let muteTargetUID = null;
        let muteDurasi = null;
        
        // Proses command MUTE/UNMUTE
        if (msgType === 'command') {
            if (msgText.startsWith('MUTE_')) {
                const parts = msgText.split('_');
                muteTargetUID = parts[1];
                muteDurasi = parts[2] || '?';
                const targetIGN = parts[3] || 'Seseorang';
                msgText = `🔇 ${targetIGN} dibisukan selama ${muteDurasi} menit.`;
                isSystem = true;
                isMuteCommand = true;
            } else if (msgText.startsWith('UNMUTE_')) {
                const parts = msgText.split('_');
                muteTargetUID = parts[1];
                const targetIGN = parts[2] || 'Seseorang';
                msgText = `🔊 Bisuan ${targetIGN} telah dibuka.`;
                isSystem = true;
                isMuteCommand = true;
            } else {
                continue;
            }
        }
        
        if (msgType !== 'msg' && !isSystem) continue;
        
        const isMe = msgUID === currentUserUid;
        const isAdmin = (typeof msgUID === 'string' && msgUID.startsWith('ADMIN_')) || msgRole === 'Admin';
        const isDeleted = (msgType === 'msg' && msgText === '[deleted by admin]');
        
        const d = document.createElement('div');
        
        if (isSystem) {
            d.className = 'chat-row system-message';
            d.innerHTML = `<div class="system-text">${msgText}</div>`;
        } else if (isDeleted) {
            d.className = `chat-row ${isMe ? 'me' : 'other'} deleted`;
            d.innerHTML = `<b>${msgName}</b><div class="msg-text">🗑️ Pesan dihapus oleh admin</div>`;
        } else if (isAdmin) {
            d.className = 'chat-row admin-msg';
            d.innerHTML = `<b>ADMIN-${msgName}</b><div class="admin-bubble-box"><span>${msgText}</span></div>`;
        } else if (isMe) {
            d.className = 'chat-row me';
            d.innerHTML = `<b>${msgName}</b><span class="msg-text">${msgText}</span>`;
        } else {
            d.className = 'chat-row other';
            d.innerHTML = `<b style="color:${getHashColor(msgUID)}">${msgName}</b><span class="msg-text">${msgText}</span>`;
        }
        
        container.appendChild(d);
        
        // Update mute status jika command mengenai user ini
        if (isMuteCommand && muteTargetUID === currentUserUid) {
            const input = document.getElementById('msg-input');
            if (msgText.startsWith('🔇')) {
                const expiry = Date.now() + (parseInt(muteDurasi) * 60 * 1000);
                muteExpiryTime = expiry;
                localStorage.setItem('umbrella_mute_expiry', expiry);
                if (input) {
                    input.disabled = true;
                    input.placeholder = `MUTED (${muteDurasi}m)`;
                }
            } else if (msgText.startsWith('🔊')) {
                muteExpiryTime = 0;
                localStorage.removeItem('umbrella_mute_expiry');
                if (input) {
                    input.disabled = false;
                    input.placeholder = "Ketik pesan...";
                }
            }
        }
    }
    
    // Auto scroll ke bawah
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

// ==========================================
// FAST SCROLL
// ==========================================
function fastScroll() {
    const lb = document.getElementById('chat-logs'); 
    if (lb) {
        setTimeout(() => {
            lb.scrollTop = lb.scrollHeight;
        }, 50);
    }
}

// ==========================================
// TOGGLE CHAT
// ==========================================
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    const mailModal = document.getElementById('mail-modal');
    if (!popup) return;
    
    if (mailModal && mailModal.classList.contains('show')) {
        mailModal.classList.remove('show');
        if (history.state && history.state.boksTerbuka === "mailbox") history.back();
    }

    const isOpening = !popup.classList.contains('show');
    popup.classList.toggle('show');
    
    if (isOpening) {
        history.pushState({ boksTerbuka: "chat" }, "");

        // Render dari cache dulu (cepat)
        const cached = sessionStorage.getItem('umbrella_cached_chat_logs');
        if (cached && document.getElementById('chat-logs')) {
            try {
                const user = dapatkanIdentitasAman();
                renderChatMessages(
                    document.getElementById('chat-logs'), 
                    JSON.parse(cached), 
                    user.uid, 
                    user.ign
                );
            } catch(e) { console.error("Cache render error:", e); }
        }
        
        if (window.innerWidth >= 768) {
            setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
        }
        
        // Fetch data terbaru
        syncChat(true);
    } else {
        if (history.state && history.state.boksTerbuka === "chat") history.back();
    }
}

// ==========================================
// POPSTATE HANDLER (SATU-SATUNYA)
// ==========================================
window.addEventListener('popstate', function (event) {
    const popup = document.getElementById('chat-popup');
    const mailModal = document.getElementById('mail-modal');
    const gate = document.getElementById('site-gatekeeper');
    const detailModal = document.getElementById('detailModal');

    if (popup && popup.classList.contains('show')) popup.classList.remove('show');
    if (mailModal && mailModal.classList.contains('show')) mailModal.classList.remove('show');
    
    if (gate && (gate.style.display === 'flex' || gate.style.opacity === '1')) {
        if (typeof window.closeGateFromNavbar === "function") window.closeGateFromNavbar(); 
    }
    if (detailModal && detailModal.style.display === 'flex') {
        if (typeof window.closeDetailFromNavbar === "function") {
            window.closeDetailFromNavbar(); 
        } else {
            detailModal.style.display = 'none'; 
        }
    }
});

// ==========================================
// IDENTITAS
// ==========================================
function dapatkanIdentitasAman() {
    let uid = window.myUID || localStorage.getItem('u_uid') || "GUEST_TMP";
    let ign = window.myIGN || localStorage.getItem('u_ign') || "Guest";
    return { uid: uid, ign: ign };
}

// ==========================================
// SYNC CHAT (CORE POLLING)
// ==========================================
function syncChat(force = false) {
    const popup = document.getElementById('chat-popup');
    
    if (!force && (!popup || !popup.classList.contains('show'))) {
        return; 
    }

    const user = dapatkanIdentitasAman();
    const input = document.getElementById('msg-input');
    
    // Cek masa mute
    if (muteExpiryTime > 0) {
        if (Date.now() >= muteExpiryTime) {
            muteExpiryTime = 0;
            localStorage.removeItem('umbrella_mute_expiry');
            if (input) { 
                input.disabled = false; 
                input.placeholder = "Ketik pesan..."; 
            }
        } else {
            if (input && !input.disabled) {
                input.disabled = true;
                const sisaMenit = Math.ceil((muteExpiryTime - Date.now()) / 60000);
                input.placeholder = `Bisu (${sisaMenit}m)`;
            }
        }
    }

    const muteExpiry = parseInt(localStorage.getItem('umbrella_mute_expiry')) || 0;
    const isMutedFlag = Date.now() < muteExpiry;
    
    fetch(`${URL_READ}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&isMuted=${isMutedFlag}&muteExpiry=${muteExpiry}`)
    .then(res => res.json())
    .then(data => {
        if (!data) return;

        // Update status admin di header chat
        const statusEl = document.querySelector('#admin-status b');
        if (statusEl) {
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

        const currentStamp = JSON.stringify(arrayChat);

        if (currentStamp !== lastChatStamp) {
            lastChatStamp = currentStamp;
            sessionStorage.setItem('umbrella_last_chat_stamp', currentStamp);
            sessionStorage.setItem('umbrella_cached_chat_logs', currentStamp);

            // Render jika chatbox terbuka
            const lb = document.getElementById('chat-logs');
            if (lb && popup && popup.classList.contains('show')) {
                renderChatMessages(lb, arrayChat, user.uid, user.ign);
            }
        }
    })
    .catch(err => console.error("Koneksi Pipa GAS 2 Terputus:", err));
}

// ==========================================
// SEND MESSAGE
// ==========================================
function sendMessage() {
    if (Date.now() < muteExpiryTime) {
        const sisaDetik = Math.ceil((muteExpiryTime - Date.now()) / 1000);
        tampilkanToast(`Chat terkunci. Sisa waktu bisu: ${sisaDetik} detik.`);
        return; 
    }
    
    if (isSending) return;
    const input = document.getElementById('msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    const user = dapatkanIdentitasAman();
    isSending = true;
    const lb = document.getElementById('chat-logs');
    
    // Optimistic UI: tampilkan pesan dulu
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

// ==========================================
// UTILITY
// ==========================================
function getHashColor(uid) {
    if (!uid) return '#ccc';
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 75%, 75%)`;
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

// ==========================================
// MAILBOX ENGINE
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
        if (history.state && history.state.boksTerbuka === "chat") history.back(); 
    }

    const isOpeningMail = !mailModal.classList.contains('show');
    mailModal.classList.toggle('show');
    
    if (mailModal.classList.contains('show')) {
        const textarea = document.getElementById('mail-message');
        const inputWA = document.getElementById('mail-wa');
        
        if (textarea) { textarea.value = ''; textarea.disabled = false; }
        if (inputWA) { inputWA.value = ''; inputWA.disabled = false; }
        
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

    if (selectedCategory === "Request Join") {
        if (!waValue) { tampilkanToast("⚠️ Nomor WhatsApp wajib diisi"); if (inputWA) inputWA.focus(); return; }
        if (!msg) { tampilkanToast("⚠️ Alasan atau biodata join tidak boleh kosong"); if (textarea) textarea.focus(); return; }
        msg = `${waValue}\n${msg}`;
    } else {
        if (!msg) { tampilkanToast("⚠️ Pesan surat tidak boleh kosong"); if (textarea) textarea.focus(); return; }
    }
    
    const user = dapatkanIdentitasAman();
    isSendingMail = true;
    
    const sendBtn = document.querySelector('.mail-send-btn');
    if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMPROSES...';
    if (textarea) textarea.disabled = true;
    if (inputWA) inputWA.disabled = true;

    toggleMail();

    fetch(`${URL_MAIL}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}&category=${encodeURIComponent(selectedCategory)}&type=mail`)
    .then(res => res.json())
    .then(data => {
        isSendingMail = false;
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';

        if (data.status === "success") {
            tampilkanToast("✉️ Surat berhasil dikirim");
        } else {
            tampilkanToast("⚠️ Gagal: " + (data.message || "Sistem error."));
            toggleMail();
            if (textarea) textarea.disabled = false;
            if (inputWA) inputWA.disabled = false;
        }
    })
    .catch(err => {
        isSendingMail = false;
        if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> KIRIM SEKARANG';
        tampilkanToast("🚨 Koneksi terputus. Gagal mengirim.");
        toggleMail();
        if (textarea) textarea.disabled = false;
        if (inputWA) inputWA.disabled = false;
        console.error("Pipa GAS 1 Terputus:", err);
    });
}

// ==========================================
// PRELOAD CHAT DATA
// ==========================================
async function preloadChatData() {
    const user = dapatkanIdentitasAman();
    if (!user) return;
    
    const url = `${URL_READ}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.logs) {
            const stamp = JSON.stringify(data.logs);
            sessionStorage.setItem('umbrella_cached_chat_logs', stamp);
            sessionStorage.setItem('umbrella_last_chat_stamp', stamp);
        }
    } catch(e) {
        console.error("Preload chat error:", e);
    }
}

// ==========================================
// CLICK OUTSIDE MAIL MODAL
// ==========================================
window.addEventListener('click', function(e) {
    const mailModal = document.getElementById('mail-modal');
    if (e.target === mailModal) {
        toggleMail(); 
    }
});

// ==========================================
// EXPOSE GLOBAL FUNCTIONS
// ==========================================
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.syncChat = syncChat;
window.toggleMail = toggleMail;
window.sendMail = sendMail;
window.aturFormMailbox = aturFormMailbox;
window.preloadChatData = preloadChatData;

// Start polling interval
setInterval(() => {
    syncChat(false);
}, 4500);
