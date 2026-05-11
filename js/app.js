const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, currentY = 0, deltaY = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { console.error("GAS Error"); }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    slider.innerHTML = globalData.map((item, i) => `
        <div class="stack-card ${isPortrait ? '' : 'slide-card'}" id="card-${i}">
            <div class="card-frame-base">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>
    `).join('');
    if (isPortrait) updateStack(0);
}

function updateStack(dragOffset = 0) {
    const cards = document.querySelectorAll('.stack-card');
    const isDragging = dragOffset !== 0;

    cards.forEach((card, i) => {
        card.classList.remove('is-active', 'is-stacked', 'is-next', 'is-dragging');
        
        if (i === currentIndex) {
            card.classList.add('is-active');
            if (isDragging) {
                card.classList.add('is-dragging');
                // Kartu aktif ikut bergeser sedikit (efek elastis)
                card.style.transform = `translateY(${dragOffset * 0.3}px)`;
            } else { card.style.transform = ""; }
        } 
        else if (i === currentIndex + 1) {
            card.classList.add('is-next');
            if (isDragging && dragOffset < 0) {
                card.classList.add('is-dragging');
                // Kartu antrean di bawah ikut naik menutup kartu atas
                card.style.transform = `translateY(${window.innerHeight + dragOffset}px)`;
            } else { card.style.transform = ""; }
        }
        else if (i < currentIndex) {
            card.classList.add('is-stacked');
            card.style.transform = "";
        }
        else {
            card.classList.add('is-next');
            card.style.transform = "";
        }
    });
}

// INTERACTIVE GESTURE ENGINE
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, {passive: false});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    currentY = e.touches[0].pageY;
    deltaY = currentY - startY;

    // Paksa kartu mengikuti jari
    updateStack(deltaY);
    
    if (e.cancelable) e.preventDefault(); // Matikan refresh halaman
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;

    // KALKULASI SETELAH DILEPAS
    if (deltaY < -120 && currentIndex < globalData.length - 1) {
        currentIndex++; // Pindah kartu berikutnya
    } else if (deltaY > 120 && currentIndex > 0) {
        currentIndex--; // Kembali ke kartu sebelumnya
    }

    // Reset posisi dengan animasi halus CSS
    deltaY = 0;
    updateStack(0);
}, {passive: true});

// MOUSE WHEEL (Simulation)
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    if (Math.abs(e.deltaY) < 30) return;

    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
