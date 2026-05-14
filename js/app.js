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
 * Mengambil data dari Google Sheets dan membaginya ke variabel yang sesuai.
 */
async function init() {
    try {
        const res = await fetch(GAS_URL);
        const rawData = await res.json();
        
        // Filter Data berdasarkan kolom ID di Google Sheets
        cardData = rawData.filter(item => ["headline", "profil", "galery"].includes(item.ID.toLowerCase()));
        runningTexts = rawData.filter(item => item.ID.toLowerCase() === "running_text").map(item => item.Body);
        sosmedData = rawData.filter(item => item.ID.toLowerCase() === "sosmed");

        renderApp();
        createModal();
    } catch (e) { 
        console.error("Gagal memuat data:", e); 
    }
}

/**
 * 2. FUNGSI RENDER UTAMA
 * Menentukan apakah membangun "Kamar Mobile" atau "Kamar PC".
 */
function renderApp() {
    const container = document.getElementById('app-container'); 
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    
    // Ambil data headline di awal agar bisa dipakai di Mobile maupun PC jika perlu
    const headline = cardData.find(item => item.ID.toLowerCase() === 'headline');
    const displayCards = cardData.filter(item => item.ID.toLowerCase() !== 'headline');

    if (isMobile) {
        // --- KAMAR MOBILE (STACKER) ---
        
        // 1. Bersihkan footer PC saat di mode mobile
        const footerContainer = document.querySelector('.bottom-bar');
        if (footerContainer) footerContainer.innerHTML = '';

        container.innerHTML = `
            <div id="main-stacker">
                ${cardData.map((item, i) => `
                    <div class="stacker-card" id="card-${i}" onclick="showDetail(${i})">
                        <div class="card-header-logo">
                            <img src="logo-umbrella.svg" class="inner-card-logo">
                            <div class="header-text-group">
                                <h2 class="card-title">${item.Header}</h2>
                            </div>
                        </div>
                        
                        <div class="card-content-wrapper">
                            <div class="card-text">
                                ${item.Body.replace(/\n/g, '<br>')}
                            </div>
                        </div>

                        <div class="mobile-read-more">baca selengkapnya</div>
                    </div>`).join('')}
            </div>`;
            
    } else {
        // --- KAMAR PC (GRID SLIDER) ---
        if (headline) {
            // 1. Update Judul Atas PC
            const headerElement = document.querySelector('.pc-header-text');
            if (headerElement) headerElement.innerText = headline.Header;
        
            // 2. Update Footer PC (Gunakan Logika Potong Teks Kamu)
            const footerContainer = document.querySelector('.bottom-bar');
            if (footerContainer) {
                const headlineIndex = cardData.indexOf(headline);
                const limit = 160; 
                const fullText = headline.Body;
                
                // Eksekusi Logika Potong
                const truncatedText = fullText.length > limit 
                    ? fullText.substring(0, limit) + "... " 
                    : fullText;

                footerContainer.innerHTML = `
                    <div class="headline-body-pc">
                        ${truncatedText}
                        <span class="inline-link-text" onclick="showDetail(${headlineIndex})">
                            selengkapnya
                        </span>
                    </div>
                `;
            }
        }
    
        container.innerHTML = `
            <div id="main-slider">
                ${displayCards.map((item) => {
                    const originalIndex = cardData.findIndex(c => c === item);
                    return `
                    <div class="slider-card" onclick="showDetail(${originalIndex})" style="cursor:pointer">
                        <div class="slider-card-content">
                            <h2 class="pc-card-title">${item.Header}</h2>
                            <div class="pc-card-body">
                                ${item.Body.replace(/\n/g, '<br>')}
                            </div>
                            <div class="pc-read-more-hint">baca selengkapnya</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    }

    // Render komponen pendukung (Global)
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
    if (chatBtn) chatBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
}

/**
 * 4. FUNGSI MODAL (DETAIL TAMPILAN)
 */
function createModal() {
    if (document.getElementById('detailModal')) return;
    const modal = document.createElement('div');
    // Pastikan class ini sesuai dengan yang ada di CSS (kita pakai detail-modal)
    modal.className = 'detail-modal'; 
    modal.id = 'detailModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle"></h2>
                <i class="fa-solid fa-xmark" onclick="closeDetail()"></i>
            </div>
            <!-- Gunakan class modal-body agar mudah diatur scroll-nya di CSS -->
            <div class="modal-body" id="modalBody"></div>
        </div>`;
    document.body.appendChild(modal);
    
    // Close modal jika klik area hitam (overlay)
    modal.onclick = function(e) {
        if (e.target === modal) closeDetail();
    };
}

function showDetail(index) {
    const item = cardData[index];
    document.getElementById('modalTitle').innerText = item.Header;
    document.getElementById('modalBody').innerHTML = item.Body.replace(/\n/g, '<br>');
    document.getElementById('detailModal').style.display = 'flex';
    isModalOpen = true;
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
    isModalOpen = false;
}

/**
 * 5. FUNGSI LOGIKA STACKER (KHUSUS MOBILE)
 * Menghitung posisi Y setiap kartu berdasarkan index saat ini.
 */
function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.stacker-card');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        // Animasi halus hanya saat tidak sedang di-drag
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";
        
        if (i === currentIndex) {
            // Kartu Aktif
            card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            card.style.opacity = 1;
            card.style.zIndex = 500;
            card.style.visibility = "visible";
        } else if (i < currentIndex) {
            // Kartu yang sudah lewat (dibuang ke atas)
            card.style.transform = `translate(-50%, -${h}px)`;
            card.style.opacity = 0;
            card.style.zIndex = 1;
        } else {
            // Kartu antrian (berada di bawah)
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, ${pos}px)`;
            card.style.opacity = 1;
            card.style.zIndex = 400;
            card.style.visibility = "visible";
        }
    });
}

/**
 * 6. EVENT LISTENERS (INTERAKSI USER)
 */

// Input Sentuh (Touch)
window.addEventListener('touchstart', e => { 
    if(!isModalOpen) startY = e.touches[0].pageY; 
});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    // Ambang batas swipe (100px)
    if (deltaY < -100 && currentIndex < cardData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    
    deltaY = 0;
    updateStack(0);
});

// Input Mouse Wheel (Scroll)
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
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
