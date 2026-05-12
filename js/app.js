const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;
let isModalOpen = false;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
        createModal();
        updateMailIcon();
    } catch (e) { console.error(e); }
}

function render() {
    const slider = document.getElementById('main-slider');
    if (!globalData.length) return;

    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}">
            <div class="card-header-logo">
                <img src="logo-umbrella.svg" class="inner-card-logo">
                <div class="header-text-group">
                    <h2 class="card-title">${item.Header || 'MEMBER'}</h2>
                    <span style="font-size:0.6rem; opacity:0.5; letter-spacing:1px">PRESS FOR DETAIL</span>
                </div>
            </div>
            <div class="card-content-wrapper">
                <div class="card-text">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
            <div class="read-more-btn" onclick="showDetail(${i})">BACA SELENGKAPNYA</div>
        </div>`).join('');

    updateStack(0);
}

function updateMailIcon() {
    const mailBtn = document.querySelector('.mail-container');
    const chatBtn = document.querySelector('.chat-container');
    if (mailBtn) mailBtn.innerHTML = '<i class="fa-solid fa-envelope-open-text"></i> KOTAK SURAT';
    if (chatBtn) chatBtn.innerHTML = '<div class="chat-icon"><i class="fa-solid fa-comment-dots"></i></div>';
}

function createModal() {
    if(document.getElementById('detailModal')) return;
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.id = 'detailModal';
    modal.addEventListener('touchstart', e => e.stopPropagation(), {passive: true});
    
    modal.innerHTML = `
        <div class="modal-content">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:10px">
                <h2 id="modalTitle" style="color:var(--color-primary); margin:0; font-size:1.2rem"></h2>
                <i class="fa-solid fa-circle-xmark" onclick="closeDetail()" style="color:#ef4444; font-size:1.5rem; cursor:pointer"></i>
            </div>
            <div class="modal-scroll" id="modalBody"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showDetail(index) {
    const item = globalData[index];
    document.getElementById('modalTitle').innerText = item.Header;
    document.getElementById('modalBody').innerHTML = (item.Body || "").replace(/\n/g, '<br>');
    document.getElementById('detailModal').style.display = 'flex';
    isModalOpen = true;
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
    isModalOpen = false;
}

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;
    const isMobileView = window.innerWidth < 768;

    cards.forEach((card, i) => {
        if (!isMobileView) {
            card.style.transform = "none";
            card.style.position = "relative";
            card.style.opacity = "1";
            card.style.visibility = "visible";
            return;
        }

        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";

        if (i === currentIndex) {
            card.classList.add('is-active');
            card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            card.style.opacity = 1;
            card.style.zIndex = 500;
        } else if (i < currentIndex) {
            card.style.transform = `translate(-50%, -${h}px)`; 
            card.style.opacity = 0;
            card.style.zIndex = 1;
        } else {
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, ${pos}px)`;
            card.style.opacity = 1;
            card.style.zIndex = 400;
        }
    });
}

window.addEventListener('touchstart', e => { if(!isModalOpen) startY = e.touches[0].pageY; });
window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    if (deltaY < -100 && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
});

window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    if (Math.abs(e.deltaY) < 30) return;
    if (e.deltaY > 0 && currentIndex < globalData.length - 1) currentIndex++;
    else if (e.deltaY < 0 && currentIndex > 0) currentIndex--;
    updateStack(0);
}, {passive: true});

window.addEventListener('resize', render);
document.addEventListener('DOMContentLoaded', init);
