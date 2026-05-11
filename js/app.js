const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

async function init() {
    // Sembunyikan hint setelah 3 detik
    setTimeout(() => {
        const hint = document.getElementById('swipe-hint');
        if(hint) hint.classList.add('fade-out');
    }, 3000);

    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { console.error("Sync Error"); }
}

function render() {
    const isPortrait = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    slider.innerHTML = globalData.map((item, i) => `
        <div class="stack-card ${isPortrait ? '' : 'slide-card card-frame-base'}" id="sc-${i}">
            <div class="card-frame-base">
                <img src="logo-umbrella.svg" class="card-logo" alt="logo">
                <h2 style="color:var(--color-primary);margin-bottom:10px;text-transform:uppercase;">${item.Header || 'MEMBER'}</h2>
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
            let s = 1 - Math.abs(drag) / 5000;
            card.style.transform = `translateY(0px) scale(${s})`;
            card.style.opacity = 1 - Math.abs(drag) / 2000;
        } 
        else if (i === currentIndex + 1) {
            card.className = 'stack-card is-next';
            if (drag < 0) { // Swipe Up
                let pos = h + drag;
                let s = 0.85 + (Math.abs(drag) / h) * 0.15;
                card.style.transform = `translateY(${pos}px) scale(${s})`;
                card.style.opacity = 0.6 + (Math.abs(drag) / h) * 0.4;
                card.style.zIndex = "100";
            } else {
                card.style.transform = `translateY(20px) scale(0.85)`;
                card.style.opacity = "0.6";
                card.style.zIndex = "20";
            }
        } 
        else if (i === currentIndex - 1) {
            card.className = 'stack-card is-stacked';
            if (drag > 0) { // Swipe Down
                let pos = -h + drag;
                let s = 0.85 + (Math.abs(drag) / h) * 0.15;
                card.style.transform = `translateY(${pos}px) scale(${s})`;
                card.style.opacity = Math.abs(drag) / h;
                card.style.zIndex = "100";
            } else {
                card.style.transform = `translateY(-100%) scale(0.85)`;
                card.style.opacity = "0";
            }
        } 
        else {
            card.className = 'stack-card';
            card.style.transform = i < currentIndex ? `translateY(-100%) scale(0.85)` : `translateY(100%) scale(0.85)`;
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
    if (deltaY < -130 && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > 130 && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
