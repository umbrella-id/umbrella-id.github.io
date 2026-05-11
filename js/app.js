const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [];
let currentIndex = 0;

async function initSystem() {
    const statusText = document.getElementById('status-text');
    try {
        statusText.innerText = "LOADING DATA...";
        const response = await fetch(GAS_URL);
        const data = await response.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        
        statusText.innerText = "SYSTEM READY";
        renderInterface();
    } catch (err) {
        statusText.innerText = "CONNECTION ERROR";
        console.error(err);
    }
}

function renderInterface() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    if (!slider) return;

    slider.innerHTML = ""; // Bersihkan konten lama

    globalData.forEach((item, i) => {
        const card = document.createElement('div');
        // Gunakan nama class sesuai usulmu: stack-card atau slide-card
        card.className = isPortrait ? 'stack-card' : 'slide-card';
        card.classList.add('card-frame-base');

        card.innerHTML = `
            <h2 class="card-title">${item.Header || 'Untitled'}</h2>
            <div class="scroll-area">
                ${(item.Body || "").replace(/\n/g, '<br>')}
            </div>
        `;
        slider.appendChild(card);
    });

    if (isPortrait) updateStackPositions();
}

function updateStackPositions() {
    const cards = document.querySelectorAll('.stack-card');
    cards.forEach((card, i) => {
        card.classList.remove('is-active', 'is-stacked', 'is-next');
        if (i < currentIndex) {
            card.classList.add('is-stacked');
        } else if (i === currentIndex) {
            card.classList.add('is-active');
        } else {
            card.classList.add('is-next');
        }
    });
}

// Mobile Interaction Logic
let startY = 0;
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; }, {passive: true});
window.addEventListener('touchend', e => {
    if (window.innerWidth >= 768) return;
    const diffY = e.changedTouches[0].pageY - startY;

    if (diffY < -60 && currentIndex < globalData.length - 1) {
        currentIndex++; // Swipe Up -> Next
    } else if (diffY > 60 && currentIndex > 0) {
        currentIndex--; // Swipe Down -> Prev
    }
    updateStackPositions();
}, {passive: true});

// Re-render saat layar diputar/diubah ukurannya
window.addEventListener('resize', () => {
    renderInterface();
});

document.addEventListener('DOMContentLoaded', initSystem);
