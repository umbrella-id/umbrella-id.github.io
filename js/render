/**
 * Umbrella Guild - UI Processor (Renderer)
 */

function renderHome(data) {
    // 1. Render Headline & Footer
    const headline = data.find(item => item.ID === 'headline');
    if (headline) {
        document.getElementById('main-headline').innerHTML = headline.Header;
        document.getElementById('sub-headline').innerHTML = headline.Body;
    }

    // 2. Render Slider Cards
    const slider = document.getElementById('main-slider');
    if (!slider) return;

    slider.innerHTML = '';
    const cards = data.filter(item => item.ID === 'card' || item.ID === 'galery');

    cards.forEach(item => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-custom';
        
        const formattedBody = (item.Body || "").replace(/\n/g, '<br>');

        cardDiv.innerHTML = `
            <div class="card-content">
                <h3 class="glow-effect">${item.Header}</h3>
                <div class="card-body-text">${formattedBody}</div>
            </div>
        `;

        // Pasang fungsi klik untuk Pop-up (Fungsi ada di bawah)
        cardDiv.onclick = () => uiTogglePopup(item.Header, formattedBody);

        slider.appendChild(cardDiv);
    });
}

/**
 * Logika UI untuk Pop-up (Gaming HUD)
 */
function uiTogglePopup(title, content) {
    const modal = document.getElementById('popup-modal');
    if (!modal) return;

    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-content').innerHTML = content;
    modal.style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup-modal').style.display = 'none';
}

// Tutup modal jika klik di area luar frame HUD
window.onclick = (e) => {
    const modal = document.getElementById('popup-modal');
    if (e.target === modal) closePopup();
};
