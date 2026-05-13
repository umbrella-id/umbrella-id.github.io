const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";
let cardData = [], runningTexts = [], sosmedData = [];
let currentIndex = 0;
let isModalOpen = false;
let startY = 0, deltaY = 0;

async function init() {
    try {
        const res = await fetch(GAS_URL);
        const rawData = await res.json();
        
        // Filter Data
        cardData = rawData.filter(item => ["headline", "profil", "galery"].includes(item.ID.toLowerCase()));
        runningTexts = rawData.filter(item => item.ID.toLowerCase() === "running_text").map(item => item.Body);
        sosmedData = rawData.filter(item => item.ID.toLowerCase() === "sosmed");

        renderApp();
        createModal();
    } catch (e) { console.error(e); }
}

function renderApp() {
    // 1. Render stacker
    const stacker = document.getElementById('main-stacker');
    stacker.innerHTML = cardData.map((item, i) => `
        <div class="stack-card" id="card-${i}">
            <div class="card-header-logo">
                <img src="logo-umbrella.svg" class="inner-card-logo">
                <div class="header-text-group">
                    <h2 class="card-title">${item.Header}</h2>
                    <span style="font-size:0.5rem; opacity:0.5; letter-spacing:1px">SECURE_LINK: ONLINE</span>
                </div>
            </div>
            <div class="card-content-wrapper">
                <div class="card-text">${item.Body.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="read-more-btn" onclick="showDetail(${i})">BACA SELENGKAPNYA</div>
        </div>`).join('');

    // 2. Render Running Text (Faded Marquee)
    if (runningTexts.length > 0) {
        let existing = document.querySelector('.running-text-wrapper');
        if(existing) existing.remove();
        
        const marqueeCont = document.createElement('div');
        marqueeCont.className = 'running-text-wrapper';
        const textFull = runningTexts.join(' &nbsp; • &nbsp; ');
        marqueeCont.innerHTML = `<div class="running-text-content">${textFull} &nbsp; • &nbsp; ${textFull}</div>`;
        document.body.appendChild(marqueeCont);
    }

    // 3. Render Sosmed (Bottom Left)
    let existingSosmed = document.querySelector('.sosmed-corner');
    if(existingSosmed) existingSosmed.remove();

    const sosmedDock = document.createElement('div');
    sosmedDock.className = 'sosmed-corner';
    sosmedDock.innerHTML = sosmedData.map(s => {
        let iconClass = "fa-brands fa-discord";
        const h = s.Header.toLowerCase();
        if(h.includes('whatsapp')) iconClass = "fa-brands fa-whatsapp";
        if(h.includes('facebook')) iconClass = "fa-brands fa-facebook";
        if(h.includes('discord')) iconClass = "fa-brands fa-discord";
        
        return `<a href="${s.Body}" class="sosmed-link" target="_blank"><i class="${iconClass}"></i></a>`;
    }).join('');
    document.body.appendChild(sosmedDock);

    updateMailIcon();
    updateStack(0);
}

function updateMailIcon() {
    const mailBtn = document.querySelector('.mail-container');
    const chatBtn = document.querySelector('.chat-container');
    if (mailBtn) mailBtn.innerHTML = '<i class="fa-solid fa-envelope-open-text"></i> KOTAK SURAT';
    if (chatBtn) chatBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
}

function createModal() {
    if(document.getElementById('detailModal')) return;
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.id = 'detailModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 id="modalTitle" style="color:var(--color-primary); margin:0; font-size:1.1rem"></h2>
                <i class="fa-solid fa-xmark" onclick="closeDetail()" style="font-size:1.5rem"></i>
            </div>
            <div class="modal-scroll" id="modalBody"></div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('touchstart', e => e.stopPropagation());
}

function showDetail(index) {
    const item = cardData[index];
    document.getElementById('modalTitle').innerText = item.Header;
    document.getElementById('modalBody').innerHTML = item.Body.replace(/\n/g, '<br>');
    document.getElementById('detailModal').style.display = 'flex';
    isModalOpen = true;
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
    isModalOpen = false;
}

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.stack-card');
    const h = window.innerHeight;
    if (window.innerWidth >= 768) return;

    cards.forEach((card, i) => {
        card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";
        if (i === currentIndex) {
            card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            card.style.opacity = 1;
            card.style.zIndex = 500;
            card.style.visibility = "visible";
        } else if (i < currentIndex) {
            card.style.transform = `translate(-50%, -${h}px)`;
            card.style.opacity = 0;
            card.style.zIndex = 1;
        } else {
            let pos = h + (drag < 0 ? drag : 0);
            card.style.transform = `translate(-50%, ${pos}px)`;
            card.style.opacity = 1;
            card.style.zIndex = 400;
            card.style.visibility = "visible";
        }
    });
}

// Events
window.addEventListener('touchstart', e => { if(!isModalOpen) startY = e.touches[0].pageY; });
window.addEventListener('touchmove', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    deltaY = e.touches[0].pageY - startY;
    if (Math.abs(deltaY) > 5) e.preventDefault();
    updateStack(deltaY);
}, {passive: false});

window.addEventListener('touchend', () => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    if (deltaY < -100 && currentIndex < cardData.length - 1) currentIndex++;
    else if (deltaY > 100 && currentIndex > 0) currentIndex--;
    deltaY = 0;
    updateStack(0);
});

window.addEventListener('wheel', e => {
    if (window.innerWidth >= 768 || isModalOpen) return;
    if (e.deltaY > 50 && currentIndex < cardData.length - 1) currentIndex++;
    else if (e.deltaY < -50 && currentIndex > 0) currentIndex--;
    updateStack(0);
}, {passive: true});

document.addEventListener('DOMContentLoaded', init);

function updateStack(drag = 0) {
    const cards = document.querySelectorAll('.stack-card');
    const isMobile = window.innerWidth < 768;

    cards.forEach((card, i) => {
        card.classList.remove('is-active');
        
        if (isMobile) {
            // Logika Mobile (Vertikal)
            card.style.transition = drag === 0 ? "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s" : "none";
            if (i === currentIndex) {
                card.classList.add('is-active');
                card.style.transform = `translate(-50%, ${drag}px) scale(1)`;
            } else {
                // ... sisa logika mobile kamu ...
            }
        } else {
            // Logika PC (Fade / Horizontal)
            card.style.transition = "all 0.6s ease";
            if (i === currentIndex) {
                card.classList.add('is-active');
                card.style.opacity = "1";
                card.style.visibility = "visible";
            } else {
                card.style.opacity = "0";
                card.style.visibility = "hidden";
            }
        }
    });
}

// Tambahan Navigasi Keyboard untuk PC
window.addEventListener('keydown', (e) => {
    if (window.innerWidth >= 768) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            if (currentIndex < cardData.length - 1) { currentIndex++; updateStack(); }
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            if (currentIndex > 0) { currentIndex--; updateStack(); }
        }
    }
});
