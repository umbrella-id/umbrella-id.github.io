const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [];
let currentIndex = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { document.getElementById('status-text').innerText = "OFFLINE"; }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    if (!slider) return;

    slider.innerHTML = ""; 

    globalData.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = isPortrait ? 'stack-card' : 'slide-card';
        if (!isPortrait) card.classList.add('card-frame-base'); // PC langsung pake frame

        card.innerHTML = isPortrait ? `
            <div class="card-frame-base">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        ` : `
            <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
            <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
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

let startY = 0;
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; }, {passive: true});
window.addEventListener('touchend', e => {
    if (window.innerWidth >= 768) return;
    const diff = e.changedTouches[0].pageY - startY;
    if (diff < -60 && currentIndex < globalData.length - 1) currentIndex++;
    else if (diff > 60 && currentIndex > 0) currentIndex--;
    updateStack();
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
