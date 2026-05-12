const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let globalData = [], currentIndex = 0;
let startY = 0, deltaY = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const data = await res.json();
        globalData = data.filter(item => item.ID && item.ID.trim() !== "");
        render();
        createModal();
        updateMailIcon(); // Set ikon Font Awesome
    } catch (e) { console.error(e); }
}

function render() {
    const isMobile = window.innerWidth < 768;
    const slider = document.getElementById('main-slider');
    if (!globalData.length) return;

    slider.innerHTML = globalData.map((item, i) => `
        <div class="card-element" id="card-${i}" onclick="showDetail(${i})">
            <div class="card-header-logo">
                <img src="logo-umbrella.svg" class="inner-card-logo">
                <span style="font-size:0.7rem; opacity:0.6; letter-spacing:1px"><i class="fa-solid fa-hand-pointer"></i> TAP TO READ</span>
            </div>
            <div class="card-content-wrapper">
                <h2 class="card-title" style="color:var(--color-primary); margin-bottom:10px">${item.Header || 'INFO'}</h2>
                <div class="card-text">${(item.Body || "").replace(/\n/g, '<br>')}</div>
            </div>
            <div class="read-more-btn">BACA SELENGKAPNYA</div>
        </div>`).join('');

    if (isMobile) updateStack(0);
}

function updateMailIcon() {
    const mailBtn = document.querySelector('.mail-container');
    const chatBtn = document.querySelector('.chat-container');
    if (mailBtn) mailBtn.innerHTML = '<i class="fa-solid fa-envelope"></i> KOTAK SURAT';
    if (chatBtn) chatBtn.innerHTML = '<div class="chat-icon"><i class="fa-solid fa-comments"></i></div>';
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.id = 'detailModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeDetail()">&times;</span>
            <h2 id="modalTitle" style="color:var(--color-primary)"></h2>
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
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
}

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";

        if (i === currentIndex) {
            card.classList.add('is-active');
            card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            card.style.opacity = 1;
            card.style.zIndex = 500;
        } 
        else if (i < currentIndex) {
            // KARTU YANG SUDAH LEWAT: Dibuang jauh ke atas
            card.classList.remove('is-active');
            card.style.transform = `translate(-50%, -${h + 100}px)`; 
            card.style.opacity = 0;
        } 
        else {
            // KARTU ANTRIAN: Menunggu di bawah layar
            card.classList.remove('is-active');
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, ${pos}px)`;
            card.style.opacity = 1;
        }
    });
}

// TOUCH EVENTS
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; });
window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768) return;
    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768) return;
    const threshold = 100;
    if (deltaY < -threshold && currentIndex < globalData.length - 1) currentIndex++;
    else if (deltaY > threshold && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
});

document.addEventListener('DOMContentLoaded', init);
