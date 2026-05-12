const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0, isDragging = false;

async function init() {
    if (window.innerWidth < 768) {
        setTimeout(() => {
            const hint = document.getElementById('swipe-hint');
            if(hint) hint.classList.add('fade-out');
        }, 2500);
    }
    try {
        const res = await fetch(GAS_URL);
        globalData = (await res.json()).filter(item => item.ID && item.ID.trim() !== "");
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
    updateStack(0);
}

function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.6s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.5s, filter 0.5s" : "none";
        card.classList.remove('is-active', 'is-next', 'is-stacked', 'on-top');

        if (i === currentIndex) {
            card.classList.add('is-active');
            // Jika ditarik, kartu aktif mengecil sedikit
            card.style.transform = `translateY(${drag * 0.2}px) scale(${1 - Math.abs(drag)/3000})`;
            card.style.opacity = 1 - Math.abs(drag)/1500;
        } 
        else if (i === currentIndex + 1) {
            card.classList.add('is-next');
            if (drag < 0) { // Swipe UP (Membuka kartu bawah)
                card.classList.add('on-top');
                let pos = h + drag;
                let s = 0.85 + (Math.abs(drag)/h) * 0.15;
                card.style.transform = `translateY(${pos}px) scale(${s})`;
            } else {
                card.style.transform = `translateY(30px) scale(0.85)`;
            }
        } 
        else if (i === currentIndex - 1) {
            card.classList.add('is-stacked');
            if (drag > 0) { // Swipe DOWN (Menarik kartu atas kembali)
                card.classList.add('on-top');
                let pos = -h + drag;
                let s = 0.85 + (Math.abs(drag)/h) * 0.15;
                card.style.transform = `translateY(${pos}px) scale(${s})`;
            } else {
                card.style.transform = `translateY(-100%) scale(0.8)`;
            }
        }
    });
}

// NAVIGATION ENGINE
function start(e) {
    startY = e.pageY || e.touches[0].pageY;
    isDragging = true;
}

function move(e) {
    if (!isDragging || window.innerWidth >= 768) return;
    const y = e.pageY || e.touches[0].pageY;
    deltaY = y - startY;

    // Cek jika sedang scroll teks di dalam kartu
    const scroller = e.target.closest('.scroll-area');
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        if ((deltaY < 0 && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight) || 
            (deltaY > 0 && scroller.scrollTop > 0)) {
            return; // Biarkan scroll teks jalan
        }
    }

    if (e.cancelable) e.preventDefault();
    updateStack(deltaY);
}

function end() {
    if (!isDragging) return;
    if (deltaY < -100 && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    
    deltaY = 0;
    isDragging = false;
    updateStack(0);
}

// EVENTS
window.addEventListener('mousedown', start);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);
window.addEventListener('touchstart', start, {passive: false});
window.addEventListener('touchmove', move, {passive: false});
window.addEventListener('touchend', end);

// WHEEL SUPPORT
let wheelTimeout;
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || wheelTimeout) return;
    if (Math.abs(e.deltaY) < 40) return;

    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    
    updateStack(0);
    wheelTimeout = setTimeout(() => wheelTimeout = null, 700);
}, {passive: true});

window.addEventListener('resize', () => render());
document.addEventListener('DOMContentLoaded', init);
