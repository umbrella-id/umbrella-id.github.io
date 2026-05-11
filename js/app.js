const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

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

    slider.innerHTML = globalData.map((item, i) => `
        <div class="stack-card ${isPortrait ? '' : 'slide-card card-frame-base'}" id="sc-${i}">
            <div class="card-frame-base">
                <img src="logo-umbrella.svg" class="card-logo" alt="logo">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>`).join('');
    if (isPortrait) updateStack(0);
}

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.stack-card');
    if (cards.length === 0) return;
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.4s" : "none";

        if (i === currentIndex) {
            card.classList.add('is-active');
            let scale = 1 - Math.abs(drag) / 4000;
            card.style.transform = `translateY(0px) scale(${scale})`;
            card.style.opacity = 1 - Math.abs(drag) / 2000;
        } 
        else if (i === currentIndex + 1) {
            card.className = 'stack-card is-next';
            // Preview Naik dari Bawah (Hanya jika swipe up)
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translateY(${pos}px)`;
        } 
        else if (i === currentIndex - 1) {
            card.className = 'stack-card is-stacked';
            // Preview Turun dari Atas (Hanya jika swipe down)
            let pos = -h + (drag > 0 ? drag : 0);
            card.style.transform = `translateY(${pos}px)`;
        } 
        else {
            card.className = 'stack-card';
            card.style.transform = i < currentIndex ? `translateY(-100%)` : `translateY(100%)`;
        }
    });
}

window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; }, {passive: false});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    deltaY = e.touches[0].pageY - startY;
    if (e.cancelable) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    const threshold = 130;
    if (deltaY < -threshold && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > threshold && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
}, {passive: true});

window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
