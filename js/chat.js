/**
 * chat.js - Umbrella Chat Engine (Final Optimized)
 * Fokus: Sinkronisasi Chat, Status Admin Jujur (Boncengan), & Mute Logic.
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";

// Variabel State
let isMuted = false, lastChatCount = 0, chatTimer = null;
let isSending = false; 

// 1. FUNGSI TOGGLE (Buka/Tutup Chat)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    if(!popup) return;
    popup.classList.toggle('show');
    if(popup.classList.contains('show')) {
        fastScroll();
        setTimeout(() => document.getElementById('msg-input')?.focus(), 300);
    }
}

// 2. INSTANT SCROLL
function fastScroll() {
    const b = document.getElementById('chat-logs');
    if(b) b.scrollTop = b.scrollHeight;
}

// 3. SYNC CHAT (Force Mode & Status Admin Boncengan)
function syncChat(force = false) {
    if (!window.myUID || !window.myIGN) return;

    fetch(`${URL_READ}?uid=${window.myUID}&ign=${window.myIGN}`)
    .then(res => res.json())
    .then(data => {
        
        // --- [ LOGIKA BONCENGAN STATUS ADMIN ] ---
        // Header akan berubah otomatis setiap kali refresh chat
        const statusEl = document.querySelector('#admin-status b');
        if (statusEl && data.admin_online !== undefined) {
            statusEl.className = data.admin_online ? "status-online" : "status-offline";
            statusEl.innerText = data.admin_online ? "ONLINE" : "OFFLINE";
        }

        // --- [ LOGIKA HEMAT KUOTA ] ---
        // Jika tidak dipaksa DAN jumlah pesan sama, abaikan refresh chat logs
        if (!force && data.logs.length === lastChatCount) return;
        
        lastChatCount = data.logs.length;
        const lb = document.getElementById('chat-logs');
        lb.innerHTML = ''; 

        data.logs.forEach(msg => {
            // Logika Mute otomatis
            if (msg.type.startsWith('MUTE|') && msg.type.includes(window.myUID)) activateMute();
            
            const d = document.createElement('div');
            
            if (msg.uid === 'ADMIN_CMD') {
                d.className = 'chat-row admin-msg';
                d.innerHTML = `<center><span>${msg.message}</span></center>`;
            } else if (msg.uid === window.myUID) {
                d.className = 'chat-row me';
                d.innerHTML = `<b>ANDA</b><span class="msg-text">${msg.message}</span>`;
            } else {
                d.className = 'chat-row other';
                d.innerHTML = `<b style="color:${getHashColor(msg.uid)}">${msg.username}</b><span class="msg-text">${msg.message}</span>`;
            }
            lb.appendChild(d);
        });
        fastScroll();
    })
    .catch(err => console.error("Sync Error:", err));
}

// 4. SEND MESSAGE (Optimistic UI)
function sendMessage() {
    if (isMuted || isSending) return;
    const input = document.getElementById('msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    isSending = true; 
    const lb = document.getElementById('chat-logs');

    // Tampilkan Pesan Sementara (Optimistic)
    const t = document.createElement('div');
    t.className = 'chat-row me temp-msg';
    t.style.opacity = "0.5";
    t.innerHTML = `<b>ANDA</b><span class="msg-text">${msg}</span>`;
    lb.appendChild(t);
    fastScroll();

    input.value = '';

    // Kirim ke server
    fetch(`${URL_WRITE}?uid=${window.myUID}&ign=${window.myIGN}&msg=${encodeURIComponent(msg)}`)
    .then(() => {
        // Beri waktu napas 500ms lalu PAKSA sync agar pesan redup jadi terang
        setTimeout(() => {
            isSending = false;
            syncChat(true); 
        }, 500);
    })
    .catch(() => {
        isSending = false;
        t.innerHTML = `<b>ANDA</b><span class="msg-text" style="background:red;color:#fff;">Gagal mengirim!</span>`;
    });
}

// 5. UTILITIES
function getHashColor(u) {
    if (u === 'ADMIN_CMD') return 'var(--color-primary)';
    let h = 0;
    for (let i = 0; i < u.length; i++) h = u.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 75%, 75%)`;
}

function activateMute() {
    isMuted = true;
    const input = document.getElementById('msg-input');
    if(input) {
        input.disabled = true;
        input.placeholder = "ACCESS RESTRICTED";
    }
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

// 6. LIFECYCLE (Jaga Kuota GAS)
function start() { 
    if(!chatTimer) { 
        syncChat(); 
        chatTimer = setInterval(() => syncChat(false), 4000); 
    } 
}

function stop() { 
    clearInterval(chatTimer); 
    chatTimer = null; 
}

document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
window.onfocus = start; 
window.onblur = stop;
window.syncChat = syncChat;

start();
