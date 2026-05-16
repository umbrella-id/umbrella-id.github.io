/**
 * chat.js - Umbrella Chat Engine
 * Fokus: Sinkronisasi Chat & Logika Mute (Link to Identity System)
 */

const URL_READ  = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec"; 
const URL_WRITE = "https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec";

// Variabel State
let isMuted = false, lastChatCount = 0, chatTimer = null;

// 1. FUNGSI TOGGLE (Membuka/Tutup Chat)
function toggleChat() {
    const popup = document.getElementById('chat-popup');
    if(!popup) return;
    
    popup.classList.toggle('show');
    
    if(popup.classList.contains('show')) {
        fastScroll();
        setTimeout(() => {
            const input = document.getElementById('msg-input');
            if(input) input.focus();
        }, 300);
    }
}

// 2. INSTANT SCROLL
function fastScroll() {
    const b = document.getElementById('chat-logs');
    if(b) b.scrollTop = b.scrollHeight;
}

// 3. SYNC CHAT (Mengambil data berdasarkan Identity Global)
function syncChat() {
    // Pastikan identity.js sudah siap menyediakan data
    if (!window.myUID || !window.myIGN) return;

    fetch(`${URL_READ}?uid=${window.myUID}&ign=${window.myIGN}`)
    .then(res => res.json())
    .then(data => {
        if (data.logs.length === lastChatCount) return;
        lastChatCount = data.logs.length;

        const lb = document.getElementById('chat-logs');
        lb.innerHTML = ''; 

        data.logs.forEach(msg => {
            // Logika Mute otomatis per UID
            if (msg.type.startsWith('MUTE|') && msg.type.includes(window.myUID)) activateMute();
            
            const d = document.createElement('div');
            d.className = 'chat-row';
            d.style.cssText = "margin-bottom:6px; font-size:13px;";
            
            if (msg.uid === 'ADMIN_CMD') {
                // Admin CMD menggunakan warna primary Umbrella
                d.innerHTML = `<center><span style="color:var(--color-primary);font-style:italic;font-weight:bold;">${msg.message}</span></center>`;
            } else {
                d.innerHTML = `<span style="color:${getHashColor(msg.uid)};font-weight:bold;">${msg.username}:</span> <span style="color:#eee;">${msg.message}</span>`;
            }
            lb.appendChild(d);
        });
        fastScroll();
    });
}

// 4. SEND MESSAGE (Menggunakan Identitas dari window)
function sendMessage() {
    if (isMuted) return;
    const input = document.getElementById('msg-input');
    const msg = input.value.trim();
    if (!msg) return;

    // TAMPILKAN INSTAN (Optimistic UI)
    const lb = document.getElementById('chat-logs');
    const t = document.createElement('div');
    t.className = 'chat-row';
    t.style.cssText = "margin-bottom:6px; font-size:13px; opacity:0.7;";
    t.innerHTML = `<span style="color:${getHashColor(window.myUID)};font-weight:bold;">${window.myIGN}:</span> <span style="color:#eee;">${msg}</span>`;
    lb.appendChild(t);
    fastScroll();

    input.value = '';

    // TEMBAK KE SERVER
    fetch(`${URL_WRITE}?uid=${window.myUID}&ign=${window.myIGN}&msg=${encodeURIComponent(msg)}`)
    .then(() => setTimeout(syncChat, 500));
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

function handleEnter(e) { 
    if (e.key === 'Enter') sendMessage(); 
}

// 6. LIFECYCLE (Jaga Kuota Google Apps Script)
function start() { 
    if(!chatTimer) { 
        syncChat(); 
        chatTimer = setInterval(syncChat, 4000); 
    } 
}

function stop() { 
    clearInterval(chatTimer); 
    chatTimer = null; 
}

// Event Listeners (Hemat kuota saat tab tidak aktif)
document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
window.onfocus = start; 
window.onblur = stop;

// Daftarkan syncChat ke window agar bisa dipanggil saat ganti nama di identity.js
window.syncChat = syncChat;

// Jalankan Mesin
start();
