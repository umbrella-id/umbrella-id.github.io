/**
 * KONFIGURASI & VARIABEL GLOBAL
 */
const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let cardData = [], runningTexts = [], sosmedData = [];
let currentIndex = 0;
let isModalOpen = false;
let startY = 0, deltaY = 0;

/**
 * 1. FUNGSI INISIALISASI (DATA FETCHING)
 */
async function init() {
    try {
        const rawData = await window.contentPromise;
        
        // Simpan rawData global untuk akses di renderApp
        window.rawData = rawData;
        
        // Data untuk keperluan share
        window.allCardData = rawData.filter(item => ["profil", "openmember"].includes(item.ID?.toLowerCase()));
        
        // Data pendukung
        runningTexts = rawData.filter(item => item.ID?.toLowerCase() === "running_text").map(item => item.Body);
        sosmedData = rawData.filter(item => item.ID?.toLowerCase() === "sosmed");
        
        renderApp();
        createModal();
    } catch (e) { 
        console.error("Gagal memuat data:", e); 
    }
}

/**
 * 2. FUNGSI RENDER UTAMA
 */
function renderApp() {
    const container = document.getElementById('app-container'); 
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const rawData = window.rawData;
    if (!rawData) return;
    
    const headlineItem = rawData.find(item => item.ID?.toLowerCase() === 'headline');
    const openmemberItem = rawData.find(item => item.ID?.toLowerCase() === 'openmember');
    const profilList = rawData.filter(item => item.ID?.toLowerCase() === 'profil');
    const galeryList = rawData.filter(item => item.ID?.toLowerCase() === 'galery');
    
    const hasHeadline = (headlineItem && headlineItem.Header && headlineItem.Header.trim() !== "");
    const hasOpenmember = (openmemberItem && openmemberItem.Body && openmemberItem.Body.trim() !== "");
    
    // ========== BANGUN cardData SESUAI LOGIKA ==========
    let newCardData = [];
    
    if (isMobile) {
        // MOBILE MODE
        if (hasHeadline) {
            newCardData = [headlineItem, ...profilList, ...galeryList];
            if (hasOpenmember) newCardData.push(openmemberItem);
        } else if (hasOpenmember) {
            newCardData = [openmemberItem, ...profilList, ...galeryList];
        } else {
            newCardData = [...profilList, ...galeryList];
        }
    } else {
        // PC MODE
        newCardData = [...profilList, ...galeryList];
        if (hasHeadline && hasOpenmember) {
            newCardData.push(openmemberItem);
        }
    }
    
    // Update cardData GLOBAL
    cardData = newCardData;
    
    // Untuk keperluan render (headline tidak ada di cardData di PC mode)
    const headlineInCard = cardData.find(item => item.ID?.toLowerCase() === 'headline');
    const displayCards = cardData.filter(item => item.ID?.toLowerCase() !== 'headline');

    if (isMobile) {
        // --- KAMAR MOBILE (STACKER) ---
        const footerContainer = document.querySelector('.bottom-bar');
        if (footerContainer) footerContainer.innerHTML = '';

        container.innerHTML = `
            <div id="main-stacker">
                ${cardData.map((item, i) => `
                    <div class="stacker-card" id="card-${i}" onclick="showDetail(${i})">
                        <div class="card-header-logo">
                            <img src="logo-umbrella.svg" class="inner-card-logo">
                            <div class="header-text-group">
                                <h2 class="card-title">${escapeHtml(item.Header)}</h2>
                            </div>
                        </div>
                        <div class="card-content-wrapper">
                            <div class="card-text">
                                ${(item.Body || '').replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div class="mobile-read-more">baca selengkapnya</div>
                    </div>`).join('')}
            </div>`;
            
    } else {
        // --- KAMAR PC (GRID SLIDER) ---
        // Header PC (prioritas: headline → openmember → default)
        let headerText = "SELAMAT DATANG";
        if (hasHeadline && headlineItem.Header) {
            headerText = headlineItem.Header;
        } else if (hasOpenmember && openmemberItem.Header) {
            headerText = openmemberItem.Header;
        }
        
        const headerElement = document.querySelector('.pc-header-text');
        if (headerElement) headerElement.innerText = headerText;
        
        // Footer PC (prioritas: headline → openmember → kosong)
        let footerContent = null;
        let footerIndex = -1;
        
        if (hasHeadline && headlineItem.Body && headlineItem.Body.trim() !== "") {
            footerContent = headlineItem;
            footerIndex = cardData.findIndex(c => c.ID === headlineItem.ID);
        } else if (hasOpenmember && openmemberItem.Body && openmemberItem.Body.trim() !== "") {
            footerContent = openmemberItem;
            footerIndex = cardData.findIndex(c => c.ID === openmemberItem.ID);
        }
        
        const footerContainer = document.querySelector('.bottom-bar');
        if (footerContainer && footerContent) {
            const limit = 160;
            const fullText = footerContent.Body;
            const truncatedText = fullText.length > limit ? fullText.substring(0, limit) + "... " : fullText;
            
            footerContainer.innerHTML = `
                <div class="headline-body-pc">
                    ${truncatedText}
                    <span class="inline-link-text" onclick="showDetail(${footerIndex})">
                        selengkapnya
                    </span>
                </div>
            `;
        } else if (footerContainer) {
            footerContainer.innerHTML = '';
        }
    
        container.innerHTML = `
            <div id="main-slider">
                ${displayCards.map((item) => {
                    const originalIndex = cardData.findIndex(c => c === item);
                    return `
                    <div class="slider-card" onclick="showDetail(${originalIndex})" style="cursor:pointer">
                        <div class="slider-card-content">
                            <h2 class="pc-card-title">${escapeHtml(item.Header)}</h2>
                            <div class="pc-card-body">
                                ${(item.Body || '').replace(/\n/g, '<br>')}
                            </div>
                            <div class="pc-read-more-hint">baca selengkapnya</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    }

    renderRunningText();
    renderSosmed();
    updateUIElements();
    
    if (isMobile) updateStack(0);
}

/**
 * 3. FUNGSI KOMPONEN PENDUKUNG
 * Mengurus Running Text, Sosmed, dan Ikon.
 */
function renderRunningText() {
    if (runningTexts.length === 0) return;
    
    let existing = document.querySelector('.running-text-wrapper');
    if (existing) existing.remove();
    
    const marqueeCont = document.createElement('div');
    marqueeCont.className = 'running-text-wrapper';
    const textFull = runningTexts.join(' &nbsp; • &nbsp; ');
    
    // Gandakan teks agar marquee tidak putus
    marqueeCont.innerHTML = `<div class="running-text-content">${textFull} &nbsp; • &nbsp; ${textFull}</div>`;
    document.body.appendChild(marqueeCont);
}

function renderSosmed() {
    let existingSosmed = document.querySelector('.sosmed-corner');
    if (existingSosmed) existingSosmed.remove();

    const sosmedDock = document.createElement('div');
    sosmedDock.className = 'sosmed-corner';
    sosmedDock.innerHTML = sosmedData.map(s => {
        let iconClass = "fa-brands fa-discord";
        const h = s.Header.toLowerCase();
        if(h.includes('whatsapp')) iconClass = "fa-brands fa-whatsapp";
        if(h.includes('facebook')) iconClass = "fa-brands fa-facebook";
        
        return `<a href="${s.Body}" class="sosmed-link" target="_blank"><i class="${iconClass}"></i></a>`;
    }).join('');
    document.body.appendChild(sosmedDock);
}

function updateUIElements() {
    const mailBtn = document.querySelector('.mail-container');
    const chatBtn = document.querySelector('.chat-container');
    if (mailBtn) mailBtn.innerHTML = '<i class="fa-solid fa-envelope-open-text"></i> KOTAK SURAT';
    if (chatBtn) chatBtn.innerHTML = '<i class="fa-solid fa-comments"></i>';
}

/**
 * 4. FUNGSI MODAL (DETAIL TAMPILAN)
 */
function createModal() {
    if (document.getElementById('detailModal')) return;
    const modal = document.createElement('div');
    modal.className = 'detail-modal'; 
    modal.id = 'detailModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle"></h2>
                <i class="fa-solid fa-xmark" onclick="closeDetail()"></i>
            </div>
            <div class="modal-body" id="modalBody"></div>
        </div>`;
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
        if (e.target === modal) closeDetail();
    };
}

// Di akhir init() atau setelah renderApp
setTimeout(() => {
    if (typeof preloadChatData === 'function') {
        preloadChatData();
    }
}, 2000); // Tunggu 2 detik setelah halaman siap

function showDetail(index) {
    const item = cardData[index];
    if (!item) return;

    // 🎯 SUNTIKAN 1: Pasang jebakan tumpukan riwayat untuk Android saat modal mekar
    history.pushState({ boksTerbuka: "detailModal" }, "");

    document.getElementById('modalTitle').innerText = item.Header;
    document.getElementById('modalBody').innerHTML = item.Body.replace(/\n/g, '<br>');
    document.getElementById('detailModal').style.display = 'flex';
    isModalOpen = true;
}

function closeDetail() {
    // 🎯 SUNTIKAN 2: Hapus riwayat palsu dari memori browser karena ditutup manual lewat klik (X) / overlay luar
    if (history.state && history.state.boksTerbuka === "detailModal") {
        history.back();
    }

    document.getElementById('detailModal').style.display = 'none';
    isModalOpen = false;
}

// 🎯 SUNTIKAN KUSTOM NAVBAR ANDROID ONLY:
// Fungsi ini dipanggil khusus oleh satpam popstate di chat.js saat user menekan tombol Back fisik HP
function closeDetailFromNavbar() {
    const modal = document.getElementById('detailModal');
    if (!modal) return;

    // Langsung kuncupin murni visual layarnya, gak usah history.back() karena navbarnya udah otomatis mundur
    modal.style.display = 'none';
    isModalOpen = false;
    console.log("🛡️ News Modal closed safely via Android Navbar.");
}

// Expose fungsi baru ke window global agar bisa dibaca oleh file chat.js
window.closeDetailFromNavbar = closeDetailFromNavbar;

/**
 * 5. FUNGSI LOGIKA STACKER (KHUSUS MOBILE)
 * Menghitung posisi Y setiap kartu berdasarkan index saat ini.
 */
function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.stacker-card');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        // Animasi halus hanya saat tidak sedang di-drag (drag === 0)
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";
        
        if (i === currentIndex) {
            // ---- 1. KARTU UTAMA AKTIF ----
            card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            card.style.opacity = 1;
            card.style.zIndex = 500;
            card.style.visibility = "visible";

            // Trigger pemicu kilatan cahaya otomatis dari CSS
            if (!card.classList.contains('is-active')) {
                cards.forEach(c => c.classList.remove('is-active'));
                card.classList.add('is-active');
            }
            
        } else if (i === currentIndex - 1) {
            // ---- 2. KARTU TEPAT DI ATASNYA (EFEK SINKRON SWIPE DOWN) ----
            /* 🎯 KUNCI UTAMA: Jika user sedang swipe down (drag > 0), suruh kartu tepat di atas ini 
               untuk ikut meluncur turun dari langit-langit (-h) secara real-time mengikuti jari! */
            if (drag > 0) {
                let posUpper = -h + drag;
                card.style.transform = `translate(-50%, ${posUpper}px)`;
                // Opacity-nya ikut memudar masuk perlahan biar smooth gak ngagetin
                card.style.opacity = Math.min(drag / (h * 0.5), 1);
                card.style.zIndex = 600; /* Z-index taruh paling depan biar dia menimpa kartu tengah pas turun */
                card.style.visibility = "visible";
            } else {
                // Jika sedang swipe up biasa, buang jauh ke atas langit
                card.style.transform = `translate(-50%, -${h}px)`;
                card.style.opacity = 0;
                card.style.zIndex = 1;
                card.style.visibility = "hidden";
            }
            card.classList.remove('is-active');

        } else if (i < currentIndex - 1) {
            // ---- 3. KARTU LAIN YANG SUDAH LEWAD JAUH DI ATAS ----
            card.style.transform = `translate(-50%, -${h}px)`;
            card.style.opacity = 0;
            card.style.zIndex = 1;
            card.style.visibility = "hidden";
            card.classList.remove('is-active');
            
        } else {
            // ---- 4. KARTU ANTREAN DI BAWAH (EFEK SINKRON SWIPE UP) ----
            /* 🎯 SINKRON SWIPE UP: Jika sedang swipe up (drag < 0), kartu bawah ikut merayap naik.
               Jika sedang swipe down, dia diam manis di dasar layar nunggu giliran. */
            let posLower = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, ${posLower}px)`;
            card.style.opacity = 1;
            card.style.zIndex = 400;
            card.style.visibility = "visible";
            card.classList.remove('is-active');
        }
    });
}

/**
 * 6. EVENT LISTENERS (INTERAKSI USER)
 */

// Input Sentuh (Touch Mobile)
window.addEventListener('touchstart', e => { 
    // Ambil elemen chatbox
    const popup = document.getElementById('chat-popup');
    const isChatOpen = popup ? popup.classList.contains('show') : false;

    // Jika modal berita ATAU chatbox lagi kebuka, kunci koordinat awal agar stacker diam
    if (!isModalOpen && !isChatOpen) startY = e.touches[0].pageY; 
});

window.addEventListener('touchmove', e => {
    // 🎯 AMBIL STATUS POPUP CHAT
    const popup = document.getElementById('chat-popup');
    const isChatOpen = popup ? popup.classList.contains('show') : false;

    // 🎯 KATUP PENGAMAN MUTLAK: Jika PC (>=768px), modal berita terbuka, ATAU chatbox lagi mekar, DETAK GOSOKAN DIHENTIKAN!
    if (window.innerWidth >= 768 || isModalOpen || isChatOpen) return;

    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    const popup = document.getElementById('chat-popup');
    const isChatOpen = popup ? popup.classList.contains('show') : false;

    // Jika chatbox lagi kebuka, cuekin fungsi pelepasan swipe
    if (window.innerWidth >= 768 || isModalOpen || isChatOpen) return;

    // Ambang batas swipe (100px)
    if (deltaY < -100 && currentIndex < cardData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    
    deltaY = 0;
    updateStack(0);
});

// Input Mouse Wheel (Scroll PC / Cadangan)
window.addEventListener('wheel', e => {
    const popup = document.getElementById('chat-popup');
    const isChatOpen = popup ? popup.classList.contains('show') : false;

    // Jika chatbox mekar, jangan biarkan scroll mouse menggerakkan kartu stacker di latar belakang
    if (window.innerWidth >= 768 || isModalOpen || isChatOpen) return;

    if (e.deltaY > 50 && currentIndex < cardData.length - 1) currentIndex++;
    else if (e.deltaY < -50 && currentIndex > 0) currentIndex--;
    updateStack(0);
}, {passive: true});

// Pantau Perubahan Ukuran Layar (Auto-Switch Mode)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderApp, 250); 
});

window.addEventListener("orientationchange", () => {
    setTimeout(renderApp, 300);
});

// Jalankan aplikasi saat HTML selesai dimuat
document.addEventListener('DOMContentLoaded', init);

