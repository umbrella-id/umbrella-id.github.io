const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) { 
        console.error("Gagal memuat data:", e);
        const status = document.getElementById('status-text');
        if(status) status.innerText = "ERROR LOAD DATA"; 
    }
}

function render() {
    const isMobile = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    
    if (!globalData.length) return;

    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}">
            <div class="card-header-logo">
                <img src="logo-umbrella.svg" class="inner-card-logo" alt="Logo">
            </div>
            <div class="card-content-wrapper">
                <h2 class="card-title">${item.Header || 'INFO'}</h2>
                <div class="card-text">
                    ${(item.Body || "").replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>`).join('');

    if (isMobile) {
        updateStack(0);
    } else {
        const allCards = document.querySelectorAll('.card-element');
        allCards.forEach(c => {
            c.style.opacity = "1";
            c.style.visibility = "visible";
            c.style.position = "relative";
            c.style.transform = "none";
        });
    }
}

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.card-element');
    if (cards.length === 0) return;
    
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s" : "none";

        if (i === currentIndex) {
            card.classList.add('is-active');
            let scale = 1 - Math.abs(drag) / 3000;
            card.style.transform = `translate(-50%, calc(-50% + ${drag}px)) scale(${scale})`;
            card.style.opacity = 1 - Math.abs(drag) / 1500;
            card.style.zIndex = 100;
        } 
        else if (i === currentIndex + 1) {
            card.classList.remove('is-active');
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, calc(-50% + ${pos}px))`;
            card.style.opacity = "1";
            card.style.visibility = "visible";
            card.style.zIndex = 90;
        }
        else {
            card.classList.remove('is-active');
            card.style.opacity = "0";
            card.style.visibility = "hidden";
            card.style.zIndex = 1;
        }
    });
}

window.addEventListener('touchstart', e => { 
    startY = e.touches[0].pageY; 
}, {passive: false});

window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    deltaY = e.touches[0].pageY - startY;
    
    if (currentIndex === 0 && deltaY > 0) deltaY /= 3; 
    if (currentIndex === globalData.length - 1 && deltaY < 0) deltaY /= 3;

    if (e.cancelable) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    const threshold = 100;

    if (deltaY < -threshold && currentIndex < globalData.length - 1) {
        currentIndex++;
    } else if (deltaY > threshold && currentIndex > 0) {
        currentIndex--;
    }
    
    deltaY = 0;
    updateStack(0);
}, {passive: true});

window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768) return;
    if (Math.abs(e.deltaY) < 50) return;
    
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
