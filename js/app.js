const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec";

let currentIdx = 0;
let startY = 0;
let diffY = 0;
let isMoving = false;
let wheelLocked = false;

async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        const validData = data.filter(item => item.ID && item.ID !== "");

        // Headline & Footer (Universal)
        const headline = validData.find(item => item.ID === 'headline');
        if (headline) {
            if (document.getElementById('main-headline')) document.getElementById('main-headline').innerHTML = headline.Header;
            if (document.getElementById('sub-headline')) document.getElementById('sub-headline').innerHTML = headline.Body;
        }

        const slider = document.getElementById('main-slider');
        if (slider) {
            slider.innerHTML = '';
            // Ambil headline sebagai kartu pertama, lalu kartu lainnya
            const allCards = validData.filter(item => item.ID === 'headline' || item.ID === 'card' || item.ID === 'galery');

            allCards.forEach((item, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-custom';
                const formattedBody = (item.Body || "").replace(/\n/g, '<br>');

                cardDiv.innerHTML = `
                    <div class="card-content">
                        <h3 class="glow-effect">${item.Header}</h3>
                        <div class="card-body-text">${formattedBody}</div>
                        
                        <div class="floating-chat-portrait" onclick="openPopup('${item.Header}', '${formattedBody}')">
                            <svg style="width:25px;fill:white" viewBox="0 0 24 24"><path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2,-0.9,2,-2V4C22,2.9,21.1,2,20,2z"/></svg>
                        </div>
                        ${index === 0 ? '<div class="hint-portrait">SWIPE UP ▲</div>' : ''}
                    </div>
                `;
                slider.appendChild(cardDiv);
            });
        }
        renderPortraitStack();
    } catch (error) { console.error("Fetch failed:", error); }
}

function renderPortraitStack() {
    const cards = document.querySelectorAll('.card-custom');
    const brand = document.getElementById('brand-area');
    const isPortrait = window.innerHeight > window.innerWidth;

    if (!isPortrait) return;

    cards.forEach((card, i) => {
        card.style.transition = isMoving ? "none" : "transform 0.6s cubic-bezier(0.2, 1, 0.3, 1), filter 0.5s ease";
        
        if (i < currentIdx) {
            let pullDown = (i === currentIdx - 1 && diffY > 0) ? (diffY * 0.4) - 40 : -40;
            card.className = "card-custom is-stacked";
            card.style.transform = `scale(0.92) translateY(${pullDown}px)`;
        } else if (i === currentIdx) {
            let move = (diffY < 0) ? diffY : 0;
            card.className = "card-custom";
            card.style.transform = `translateY(${move}px)`;
        } else {
            card.className = "card-custom is-next";
            card.style.transform = `translateY(100%)`;
        }
    });

    if (currentIdx > 0 || (currentIdx === 0 && diffY < -100)) brand.classList.add('active');
    else brand.classList.remove('active');
}

// Event Listeners
window.addEventListener('touchstart', e => { startY = e.touches[0].pageY; isMoving = true; });
window.addEventListener('touchmove', e => { diffY = e.touches[0].pageY - startY; renderPortraitStack(); });
window.addEventListener('touchend', () => {
    isMoving = false;
    const threshold = window.innerHeight * 0.2;
    const cards = document.querySelectorAll('.card-custom');
    if (diffY < -threshold && currentIdx < cards.length - 1) currentIdx++;
    else if (diffY > threshold && currentIdx > 0) currentIdx--;
    diffY = 0; renderPortraitStack();
});

window.addEventListener('wheel', e => {
    if (wheelLocked || window.innerWidth > window.innerHeight) return;
    if (Math.abs(e.deltaY) > 30) {
        wheelLocked = true;
        const cards = document.querySelectorAll('.card-custom');
        if (e.deltaY > 0 && currentIdx < cards.length - 1) currentIdx++;
        else if (e.deltaY < 0 && currentIdx > 0) currentIdx--;
        renderPortraitStack();
        setTimeout(() => { wheelLocked = false; }, 800);
    }
});

function openPopup(title, content) {
    const modal = document.getElementById('popup-modal');
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-content').innerHTML = content;
    modal.style.display = 'flex';
}

function closePopup() { document.getElementById('popup-modal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', loadData);
