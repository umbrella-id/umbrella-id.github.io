const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, distY = 0, startTime = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        globalData = (await res.json()).filter(item => item.ID);
        render();
    } catch (e) { console.error("Data Error"); }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    slider.innerHTML = globalData.map((item, i) => `
        <div class="stack-card" id="sc-${i}">
            <div class="card-frame-base">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>`).join('');
    updateStack();
}

function updateStack() {
    const cards = document.querySelectorAll('.stack-card');
    cards.forEach((card, i) => {
        card.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s";
        card.classList.remove('is-active', 'is-stacked', 'is-next', 'is-waiting');
        
        if (i < currentIndex) card.classList.add('is-stacked');
        else if (i === currentIndex) card.classList.add('is-active');
        else if (i === currentIndex + 1) card.classList.add('is-next');
        else card.classList.add('is-waiting');
    });
}

// LOGIKA GERAKAN RESPONSIF
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
    startTime = new Date().getTime();
}, {passive: true});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    distY = e.touches[0].pageY - startY;
    
    const activeCard = document.querySelector('.stack-card.is-active');
    const nextCard = document.querySelector('.stack-card.is-next');

    // Animasi Real-time saat ditarik
    if (distY < 0 && activeCard) { // Tarik ke atas
        activeCard.style.transition = "none";
        activeCard.style.transform = `translateY(${distY}px) scale(${1 - Math.abs(distY)/2000}) rotate(${distY/50}deg)`;
        activeCard.style.opacity = 1 - Math.abs(distY)/window.innerHeight;
    }
    if (distY > 0 && nextCard) { // Tarik ke bawah
        nextCard.style.transition = "none";
        nextCard.style.transform = `translateY(${window.innerHeight + distY}px)`;
    }
}, {passive: true});

window.addEventListener('touchend', e => {
    if (window.innerWidth >= 768) return;
    const duration = new Date().getTime() - startTime;
    const velocity = Math.abs(distY) / duration; // Hitung kecepatan swipe

    // Jika swipe cepat (flick) atau jarak jauh (>100px)
    if ((Math.abs(distY) > 100 || velocity > 0.5)) {
        if (distY < 0 && currentIndex < globalData.length - 1) currentIndex++;
        else if (distY > 0 && currentIndex > 0) currentIndex--;
    }

    distY = 0;
    updateStack();
}, {passive: true});

// MOUSE WHEEL (Lebih Cepat)
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    if (Math.abs(e.deltaY) < 20) return;
    
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    
    updateStack();
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
