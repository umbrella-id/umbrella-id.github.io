const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

// 1. INISIALISASI DATA
async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        // Filter data kosong
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { 
        console.error("Gagal memuat data:", e);
        const status = document.getElementById('status-text');
        if(status) status.innerText = "ERROR LOAD DATA"; 
    }
}

// 2. RENDER HTML (Sinkron dengan CSS Stacking)
function render() {
    const isMobile = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    
    if (!globalData.length) return;

    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}">
            <!-- LOGO SEBAGAI IDENTITAS/CAP DI DALAM KARTU -->
            <div class="card-header-logo">
                <img src="logo-umbrella.svg" class="inner-card-logo" alt="Logo">
            </div>

            <div class="card-content-wrapper">
                <h2 class="card-title">${item.Header || 'INFO'}</h2>
                <div class="card-text">
                    ${(item.Body || "").replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>`).join('');

    if (isMobile) {
        updateStack(0);
    } else {
        const allCards = document.querySelectorAll('.card-element');
        allCards.forEach(c => {
            c.style.opacity = "1";
            c.style.visibility = "visible";
        });
    }
}
    
    // Pastikan posisi logo benar setelah render
    updateLogoPosition();
}

// 3. LOGIKA STACKING (SWIPE UP/DOWN)
function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.card-element');
    if (cards.length === 0) return;
    
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        // Transisi halus saat tidak sedang ditarik
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s" : "none";

        if (i === currentIndex) {
            card.classList.add('is-active');
            // Efek mengecil saat ditarik (visual feedback)
            let scale = 1 - Math.abs(drag) / 3000;
            card.style.transform = `translate(-50%, calc(-50% + ${drag}px)) scale(${scale})`;
            card.style.opacity = 1 - Math.abs(drag) / 1500;
            card.style.zIndex = 100;
        } 
        else if (i === currentIndex + 1) {
            // Kartu selanjutnya (berada di bawah layar menunggu di-swipe up)
            card.classList.remove('is-active');
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, calc(-50% + ${pos}px))`;
            card.style.opacity = "1";
            card.style.visibility = "visible";
            card.style.zIndex = 90;
        }
        else {
            card.classList.remove('is-active');
            card.style.opacity = "0";
            card.style.visibility = "hidden";
            card.style.zIndex = 1;
        }
    });
}

// 4. LOGIKA PINDAH LOGO (Satu Logo Banyak Kartu)
function updateLogoPosition() {
    const logo = document.getElementById('main-logo');
    const logoWrapper = document.querySelector('.logo-wrapper');
    const activeCard = document.querySelector('.card-element.is-active');
    
    if (!logo || !logoWrapper) return;

    // Di mobile, pastikan wrapper logo ada di kasta tertinggi
    if (window.innerWidth <= 767) {
        logoWrapper.style.zIndex = "1000";
    }
}

// 5. EVENT LISTENERS (TOUCH & MOUSE)
window.addEventListener('touchstart', e => { 
    startY = e.touches[0].pageY; 
}, {passive: false});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    deltaY = e.touches[0].pageY - startY;
    
    // Batasi tarikan agar tidak melampaui batas data
    if (currentIndex === 0 && deltaY > 0) deltaY /= 3; 
    if (currentIndex === globalData.length - 1 && deltaY < 0) deltaY /= 3;

    if (e.cancelable) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    const threshold = 100; // Sensitivitas swipe

    if (deltaY < -threshold && currentIndex < globalData.length - 1) {
        currentIndex++;
    } else if (deltaY > threshold && currentIndex > 0) {
        currentIndex--;
    }
    
    deltaY = 0;
    updateStack(0);
    // Jalankan update logo tiap ganti kartu
    setTimeout(updateLogoPosition, 300);
}, {passive: true});

// Support Wheel (Scroll Mouse)
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    if (Math.abs(e.deltaY) < 50) return; // Debounce scroll
    
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    
    updateStack(0);
    setTimeout(updateLogoPosition, 300);
}, {passive: true});

// Handle Resize
window.addEventListener('resize', () => {
    render();
    updateLogoPosition();
});

// Start App
document.addEventListener('DOMContentLoaded', init);
