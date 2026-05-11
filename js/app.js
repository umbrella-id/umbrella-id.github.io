const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, currentDeltaY = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        globalData = (await res.json()).filter(item => item.ID);
        render();
    } catch (e) { console.error("Error"); }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    slider.innerHTML = globalData.map((item, i) => `
        <div class="stack-card ${isPortrait ? '' : 'slide-card card-frame-base'}" id="card-${i}">
            <div class="card-frame-base">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>`).join('');
    if (isPortrait) updateStack();
}

function updateStack(offset = 0) {
    const cards = document.querySelectorAll('.stack-card');
    cards.forEach((card, i) => {
        card.classList.remove('is-active', 'is-stacked', 'is-next', 'is-dragging');
        
        if (i === currentIndex) {
            card.classList.add('is-active');
            if (offset !== 0) {
                card.classList.add('is-dragging');
                // Kartu aktif bisa digeser sedikit
                card.style.transform = `translateY(${offset * 0.2}px) scale(${1 - Math.abs(offset)/2000})`;
            } else { card.style.transform = ''; }
        } 
        else if (i === currentIndex + 1) {
            card.classList.add('is-next');
            if (offset < 0) { // Jika swipe ke atas (Next)
                card.classList.add('is-dragging');
                card.style.transform = `translateY(${window.innerHeight + offset}px)`;
            } else { card.style.transform = ''; }
        }
        else if (i < currentIndex) { card.classList.add('is-stacked'); card.style.transform = ''; }
        else { card.classList.add('is-next'); card.style.transform = ''; }
    });
}

// GESTURE ENGINE
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, {passive: false});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    currentDeltaY = e.touches[0].pageY - startY;
    
    // Mencegah Refresh Halaman
    if (e.cancelable) e.preventDefault();
    
    updateStack(currentDeltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    
    if (currentDeltaY < -100 && currentIndex < globalData.length - 1) {
        currentIndex++; // Commit ke kartu berikutnya
    } else if (currentDeltaY > 100 && currentIndex > 0) {
        currentIndex--; // Rollback
    }
    
    currentDeltaY = 0;
    updateStack(0); // Reset posisi dengan animasi CSS
}, {passive: true});

// MOUSE WHEEL (Debounced)
let wheelTimeout;
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || wheelTimeout) return;
    if (Math.abs(e.deltaY) < 30) return;

    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    
    updateStack(0);
    wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 800);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
