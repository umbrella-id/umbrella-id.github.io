const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

async function init() {
    // Jalankan hint hanya jika di layar mobile
    if (window.innerWidth < 768) {
        setTimeout(() => {
            const hint = document.getElementById('swipe-hint');
            if(hint) hint.classList.add('fade-out');
        }, 2500);
    }

    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { document.getElementById('status-text').innerText = "OFFLINE"; }
}

function render() {
    const slider = document.getElementById('main-slider');
    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}">
            <div class="card-frame-base">
                <img src="logo-umbrella.svg" class="card-logo" alt="logo">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>`).join('');
    
    if (window.innerWidth < 768) updateStack(0);
}

function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.4s, filter 0.4s" : "none";

        if (i === currentIndex) {
            card.className = 'card-element is-active';
            let s = 1 - Math.abs(drag) / 4000;
            card.style.transform = `translateY(${drag * 0.1}px) scale(${s})`;
            card.style.filter = `brightness(${1 - Math.abs(drag)/1500})`;
        } 
        else if (i === currentIndex + 1) {
            card.className = 'card-element is-next';
            if (drag < 0) {
                let s = 0.85 + (Math.abs(drag) / h) * 0.15;
                card.style.transform = `translateY(${h + drag}px) scale(${s})`;
                card.style.filter = `brightness(${0.4 + (Math.abs(drag)/h)*0.6})`;
            } else {
                card.style.transform = `translateY(20px) scale(0.85)`;
                card.style.filter = "brightness(0.4)";
            }
        } 
        else if (i === currentIndex - 1) {
            card.className = 'card-element is-stacked';
            if (drag > 0) {
                let s = 0.85 + (Math.abs(drag) / h) * 0.15;
                card.style.transform = `translateY(${-h + drag}px) scale(${s})`;
                card.style.filter = `brightness(${0.4 + (Math.abs(drag)/h)*0.6})`;
            } else {
                card.style.transform = `translateY(-100%) scale(0.85)`;
                card.style.filter = "brightness(0.4)";
            }
        } 
        else {
            card.className = 'card-element';
            card.style.transform = i < currentIndex ? `translateY(-100%) scale(0.85)` : `translateY(100%) scale(0.85)`;
        }
    });
}

window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; }, {passive: false});
window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    const isScrollArea = e.target.closest('.scroll-area');
    if (isScrollArea) {
        if (isScrollArea.scrollTop > 0 && (isScrollArea.scrollTop + isScrollArea.offsetHeight < isScrollArea.scrollHeight)) return;
    }
    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) {
        if (e.cancelable) e.preventDefault();
        updateStack(deltaY);
    }
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    if (deltaY < -120 && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > 120 && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', () => { render(); });
document.addEventListener('DOMContentLoaded', init);
