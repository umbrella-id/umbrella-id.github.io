/**
 * chat.js - Umbrella Chat Engine (Final Gold - Gatekeeper Sleep Edition)
 * Fitur: Polling 4.5s Mandiri, Text-Stamp, Presence Admin, Mute Logic, UID-Match, Absolute Gatekeeper Sleep.
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";

// State System Engine
let isMuted = false, lastChatStamp = "", isSending = false;

function fastScroll() {
    const lb = document.getElementById('chat-logs');
    if (lb) lb.scrollTop = lb.scrollHeight;
}

// 2. TOGGLE POPUP (Hanya urusan CSS & Focus saja, tidak mengutak-atik timer)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    if (!popup) return;
    
    popup.classList.toggle('show');
    
    if (popup.classList.contains('show')) {
        fastScroll();
        setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
        // Paksa tarik data instan begitu dibuka agar chat tidak kosong/delay
        syncChat(true); 
    }
}

function dapatkanIdentitasAman() {
    let uid = window.myUID || localStorage.getItem('UG_ID') || "GUEST_TMP";
    let ign = window.myIGN || localStorage.getItem('UG_NAME') || "Guest";
    return { uid: uid, ign: ign };
}

// 4. SINKRONISASI UTAMA (Dengan Penjaga Gerbang Fisik Popup)
function syncChat(force = false) {
    // --- [ 🔒 GEMBOK HULU: PENGHEMAT KUOTA POSISI TERTUTUP ] ---
    const popup = document.getElementById('chat-popup');
    
    // Jika popup tidak ditemukan, atau popup TIDAK memiliki class 'show', 
    // JANGAN tembak fetch ke GAS! Langsung stop di gerbang paling depan.
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
    t.style.opacity = "0.5";
    t.innerHTML = `<b>${user.ign}</b><span class="msg-text">${msg}</span>`;
    if (lb) lb.appendChild(t);
    fastScroll();

    input.value = '';

    fetch(`${URL_WRITE}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}`)
    .then(() => { 
        isSending = false; 
        setTimeout(() => { syncChat(true); }, 500); // Action Trigger (Diberi akses tembus 'force' agar langsung tampil)
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

// Global Expose
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
window.syncChat = syncChat;

// ==========================================
// [7] MESIN PENGASUH UTAMA (FORCE-LOOP INDEPENDEN)
// ==========================================
// Nyalakan interval abadi 4.5 detik sejak halaman load.
// Interval ini tidak akan pernah dibongkar pasang, jadi sangat aman dan stabil.
setInterval(() => {
    syncChat(false);
}, 4500);

console.log("🛡️ Umbrella Chat Engine: Gembok Hulu Posisi Tertutup Berhasil Diaktifkan!");
