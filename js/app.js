const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [];
let currentIndex = 0;
let isAnimating = false;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { console.error("Data Error"); }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    if (!slider) return;
    slider.innerHTML = ""; 

    globalData.forEach((item, i) => {
        const card = document.createElement('div');
        
        if (isPortrait) {
            // MODE MOBILE: Gunakan stack-card, frame dimasukkan di dalam
            card.className = 'stack-card';
            card.innerHTML = `
                <div class="card-frame-base">
                    <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                    <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
                </div>
            `;
        } else {
            // MODE PC: Gunakan slide-card, frame adalah kartu itu sendiri
            card.className = 'slide-card card-frame-base';
            card.innerHTML = `
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            `;
        }
        
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
    
    isAnimating = true;
    setTimeout(() => { isAnimating = false; }, 800); 
}

// Navigasi Universal
function handleNav(diff) {
    if (isAnimating) return;
    const threshold = 40;
    if (diff < -threshold && currentIndex < globalData.length - 1) currentIndex++;
    else if (diff > threshold && currentIndex > 0) currentIndex--;
    updateStack();
}

// Touch
let startY = 0;
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; }, {passive: true});
window.addEventListener('touchend', e => {
    if (window.innerWidth >= 768) return;
    handleNav(e.changedTouches[0].pageY - startY);
}, {passive: true});

// Wheel
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    handleNav(-e.deltaY);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
