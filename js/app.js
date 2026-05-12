const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0, isDragging = false;

async function init() {
    if (window.innerWidth < 768) {
        const hint = document.getElementById('swipe-hint');
        setTimeout(() => {
            if(hint) {
                hint.classList.add('fade-out');
                setTimeout(() => hint.remove(), 1000);
            }
        }, 3000);
    }

    try {
        const res = await fetch(GAS_URL);
        globalData = (await res.json()).filter(item => item.ID && item.ID.trim() !== "");
        render();
    } catch (e) {
        document.getElementById('status-text').innerText = "OFFLINE";
    }
}

function render() {
    const slider = document.getElementById('main-slider');
    if (!globalData.length) return;

    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}">
            <div class="card-frame-base">
                <img src="logo-umbrella.svg" class="card-logo" alt="logo">
                <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                <div class="scroll-area">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
        </div>`).join('');
    
    requestAnimationFrame(() => updateStack(0));
}

function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s" : "none";
        card.classList.remove('is-active', 'is-next', 'is-stacked', 'on-top');
        card.style.visibility = "hidden";

        if (i === currentIndex) {
            card.classList.add('is-active');
            card.style.visibility = "visible";
            card.style.opacity = 1 - Math.abs(drag) / 1000;
            card.style.transform = `translateY(${drag * 0.2}px) scale(${1 - Math.abs(drag)/4000})`;
        } 
        else if (i === currentIndex + 1 && drag < 0) {
            card.classList.add('on-top');
            card.style.visibility = "visible";
            let progress = Math.abs(drag) / 250;
            card.style.opacity = Math.min(progress, 1);
            card.style.transform = `translateY(${h + drag}px) scale(${0.85 + (Math.min(progress, 1) * 0.15)})`;
        } 
        else if (i === currentIndex - 1 && drag > 0) {
            card.classList.add('on-top');
            card.style.visibility = "visible";
            let progress = drag / 250;
            card.style.opacity = Math.min(progress, 1);
            card.style.transform = `translateY(${-h + drag}px) scale(${0.85 + (Math.min(progress, 1) * 0.15)})`;
        }
    });
}

// LOGIKA NAVIGASI MOUSE & TOUCH
function handleStart(e) { startY = e.pageY || e.touches[0].pageY; isDragging = true; }
function handleMove(e) {
    if (!isDragging || window.innerWidth >= 768) return;
    const y = e.pageY || e.touches[0].pageY;
    deltaY = y - startY;

    const scroller = e.target.closest('.scroll-area');
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        if ((deltaY < 0 && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight) || (deltaY > 0 && scroller.scrollTop > 0)) return;
    }
    if (e.cancelable) e.preventDefault();
    updateStack(deltaY);
}
function handleEnd() {
    if (!isDragging) return;
    if (deltaY < -100 && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    deltaY = 0; isDragging = false;
    updateStack(0);
}

// SCROLL WHEEL SUPPORT
let wTime;
window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || wTime) return;
    if (Math.abs(e.deltaY) < 50) return;
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    updateStack(0);
    wTime = setTimeout(() => wTime = null, 800);
}, {passive: true});

window.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchstart', handleStart, {passive: false});
window.addEventListener('touchmove', handleMove, {passive: false});
window.addEventListener('touchend', handleEnd);
window.addEventListener('resize', () => { render(); });
document.addEventListener('DOMContentLoaded', init);
