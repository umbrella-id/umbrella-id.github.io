const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [];
let currentIndex = 0;

async function loadData() {
    try {
        const res = await fetch(GAS_URL);
        globalData = (await res.json()).filter(item => item.ID && item.ID.trim() !== "");
        renderUI();
    } catch (e) { console.error("Error:", e); }
}

function renderUI() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const slider = document.getElementById('main-slider');
    slider.innerHTML = ''; // Cuma bersihkan area slider

    globalData.forEach((item, i) => {
        const card = document.createElement('div');
        // Tentukan class berdasarkan mode
        card.className = isPortrait ? 'stack-card' : 'slide-card';
        card.classList.add('card-frame-base');
        
        card.innerHTML = `
            <h3 class="card-title">${item.Header}</h3>
            <div style="flex:1; overflow-y:auto;">${item.Body.replace(/\n/g, '<br>')}</div>
        `;
        slider.appendChild(card);
    });

    if (isPortrait) updateStack();
}

function updateStack() {
    const cards = document.querySelectorAll('.stack-card');
    cards.forEach((card, i) => {
        card.classList.remove('is-active', 'is-stacked', 'is-next');
        if (i < currentIndex) card.classList.add('is-stacked');
        else if (i === currentIndex) card.classList.add('is-active');
        else card.classList.add('is-next');
    });
}

// Swipe Detector Mobile
let startY = 0;
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; });
window.addEventListener('touchend', e => {
    if (window.innerWidth > window.innerHeight) return;
    let diff = e.changedTouches[0].pageY - startY;
    if (diff < -50 && currentIndex < globalData.length - 1) currentIndex++;
    if (diff > 50 && currentIndex > 0) currentIndex--;
    updateStack();
});

window.addEventListener('resize', renderUI);
document.addEventListener('DOMContentLoaded', loadData);
