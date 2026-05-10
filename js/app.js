/**
 * Umbrella Guild - Main Data Controller
 * Fungsi: Menarik data dari Google Sheets via GAS dan merender ke Grid Layout
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; // Link Deployment /exec

// --- 1. FUNGSI UTAMA (FETCHER) ---
async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        const validData = data.filter(item => item.ID && item.ID !== "");

        const headline = validData.find(item => item.ID === 'headline');
        if (headline) {
            if (document.getElementById('main-headline')) document.getElementById('main-headline').innerHTML = headline.Header;
            if (document.getElementById('sub-headline')) document.getElementById('sub-headline').innerHTML = headline.Body;
        }

        // Masukkan ini di dalam loadData(), tepat setelah bagian Headline
        const runTextData = validData.find(item => item.ID === 'running_text');
        const runTextElement = document.getElementById('running-text');
        if (runTextData && runTextElement) {
            // Gabungkan Header dan Body jika perlu, atau salah satu saja
            runTextElement.innerHTML = `${runTextData.Header}: ${runTextData.Body}`;
        }

        const slider = document.getElementById('main-slider');
        if (slider) {
            slider.innerHTML = ''; 
            const cards = validData.filter(item => item.ID === 'card' || item.ID === 'galery');

            cards.forEach(item => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-custom';
                
                const bodyText = item.Body || "";
                const formattedBody = bodyText.split('\n').join('<br>');

                cardDiv.innerHTML = `
                    <div class="card-content">
                        <h3 class="glow-effect">${item.Header}</h3>
                        <div class="card-body-text">${formattedBody}</div>
                    </div>
                `;

                // Ini yang tadi error, sekarang dia akan memanggil fungsi di bawah
                cardDiv.onclick = function() {
                    openPopup(item.Header, formattedBody);
                };

                slider.appendChild(cardDiv);
            });
        }
    } catch (error) {
        console.error("Data fetch failed:", error);
    }
}

// --- 2. FUNGSI POPUP (WAJIB DI LUAR loadData AGAR GLOBAL) ---

function openPopup(title, content) {
    const modal = document.getElementById('popup-modal');
    const mTitle = document.getElementById('modal-title');
    const mContent = document.getElementById('modal-content');

    if (modal && mTitle && mContent) {
        mTitle.innerHTML = title;
        mContent.innerHTML = content;
        modal.style.display = 'flex'; 
    } else {
        console.error("Elemen Modal tidak ditemukan di HTML!");
    }
}

function closePopup() {
    const modal = document.getElementById('popup-modal');
    if (modal) modal.style.display = 'none';
}

// Menutup modal saat klik area luar (overlay)
window.onclick = function(event) {
    const modal = document.getElementById('popup-modal');
    if (event.target == modal) {
        closePopup();
    }
};



// --- 3. EKSEKUSI ---
document.addEventListener('DOMContentLoaded', loadData);
