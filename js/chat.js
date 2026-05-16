/**
 * chat.js - Umbrella Chat Engine (Blueprint Compliant - Final Gold Edition)
 * Arsitektur: Sesuai Master Blueprint Portal Umbrella (Quad-Pipe GAS)
 * Fitur: Polling 4.5s Mandiri, Penghemat Kuota (Text-Stamp), Presence Admin, Mute Logic, UID-Match.
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";

// State System Engine
let isMuted = false, lastChatStamp = "", isSending = false;

// 1. INSTANT SCROLL (UX No. 1 Blueprint)
function fastScroll() {
    const lb = document.getElementById('chat-logs');
    if (lb) lb.scrollTop = lb.scrollHeight;
}

// 2. TOGGLE POPUP (Pemicu Bukaan Chat)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    if (!popup) return;
    popup.classList.toggle('show');
    if (popup.classList.contains('show')) {
        fastScroll();
        setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
    }
}

// 3. LOGIKA PENCOCOKAN IDENTITAS
function dapatkanIdentitasAman() {
    let uid = window.myUID || localStorage.getItem('UG_ID') || "GUEST_TMP";
    let ign = window.myIGN || localStorage.getItem('UG_NAME') || "Guest";
    return { uid: uid, ign: ign };
}

// 4. SINKRONISASI UTAMA (Lurus Tanpa Interupsi Return di Tengah Fungsi)
function syncChat(force = false) {
    const user = dapatkanIdentitasAman();

    fetch(`${URL_READ}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}`)
    .then(res => res.json())
    .then(data => {
        if (!data) return;

        // --- [ 🟢 PEMBETULAN INDIKATOR STATUS ADMIN ] ---
        const statusEl = document.querySelector('#admin-status b');
        if (statusEl) {
            // Membaca properti "adminOnline" sesuai dengan paketan asli JSON dari GAS kamu
            const rawStatus = data.adminOnline ?? data.admin_online ?? data.adminStatus ?? false;
            
            // Konversi nilai menjadi Boolean murni
            const isOnline = (rawStatus === true || String(rawStatus).toUpperCase().trim() === "ONLINE" || String(rawStatus) === "1");
            
            // Suntikkan perubahan class CSS dan Teks ke Elemen HTML
            statusEl.className = isOnline ? "status-online" : "status-offline";
            statusEl.innerText = isOnline ? "ONLINE" : "OFFLINE";
            
            console.log(`[Presence Admin] Data Server: ${rawStatus} -> Hasil Kesimpulan: ${isOnline ? 'ONLINE (HIJAU)' : 'OFFLINE (MERAH)'}`);
        }

        const arrayChat = data.logs || data.chats || [];
        if (!Array.isArray(arrayChat)) return;

        // --- [ FITUR PENGHEMAT KUOTA (TEXT STAMP) ] ---
        const currentStamp = JSON.stringify(arrayChat);
        if (!force && currentStamp === lastChatStamp) {
            // Data chat sama, logs skip render demi hemat baterai & RAM client
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
                    } catch (e) { console.error("Error baris chat:", e); }
                });
                fastScroll();
            }
        }
    })
    .catch(err => console.error("Koneksi Pipa GAS 2 Terputus:", err));
}

// 5. KIRIM PESAN (Optimistic UI & Action Trigger)
function sendMessage() {
    if (isMuted || isSending) return;
    const input = document.getElementById('msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    const user = dapatkanIdentitasAman();
    isSending = true;
    
    const lb = document.getElementById('chat-logs');
    
    // Optimistic UI sementara (Nama tetap nama profil asli kamu, di sebelah kanan)
    const t = document.createElement('div');
    t.className = 'chat-row me';
    t.style.opacity = "0.5";
    t.innerHTML = `<b>${user.ign}</b><span class="msg-text">${msg}</span>`;
    if (lb) lb.appendChild(t);
    fastScroll();

    input.value = '';

    // Kirim Tulis ke Pipa GAS 3 (Messenger)
    fetch(`${URL_WRITE}?uid=${user.uid}&ign=${encodeURIComponent(user.ign)}&msg=${encodeURIComponent(msg)}`)
    .then(() => { 
        isSending = false; 
        // --- [ ACTION TRIGGER BLUEPRINT POIN 4 ] ---
        // Menunggu 500ms jeda server menulis, lalu PAKSA eksekusi syncChat(true) 
        // agar status paksa (force) tembus tanpa terhadang filter hemat kuota
        setTimeout(() => { syncChat(true); }, 500); 
    })
    .catch(() => { 
        isSending = false; 
        t.innerHTML = `<b>${user.ign}</b><span class="msg-text" style="background:#e74c3c;color:#fff;">Gagal mengirim!</span>`;
    });
}

// 6. UTILITIES (Pewarnaan Khas Nama Pengguna)
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
syncChat();

// Polling harian stabil dikunci di angka 4.5 detik sesuai spesifikasi baku blueprint.
setInterval(() => {
    syncChat(false);
}, 4500);

console.log("🛡️ Umbrella Chat Engine: Sistem Berhasil Dikembalikan ke Tujuan Utama!");
