/**
 * Umbrella Guild - Main Data Controller
 * Fungsi: Menarik data dari Google Sheets via GAS dan merender ke Grid Layout
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; // Link Deployment /exec

async function loadData() {
    try {
        // Mengambil data JSON dari server
        const response = await fetch(GAS_URL);
        const data = await response.json();

        // Membersihkan data dari baris kosong (Data Guard)
        const validData = data.filter(item => item.ID && item.ID !== "");

        // --- 1. Fungsi Render Headline & Footer ---
        const headline = validData.find(item => item.ID === 'headline');
        if (headline) {
            const h1 = document.getElementById('main-headline');
            const sub = document.getElementById('sub-headline');
            if (h1) h1.innerHTML = headline.Header;
            if (sub) sub.innerHTML = headline.Body;
        }

        // --- 2. Fungsi Render Slider Cards (Profil & Galery) ---
        const slider = document.getElementById('main-slider');
        if (slider) {
            slider.innerHTML = ''; // Membersihkan kontainer sebelum render

            // Filter data yang masuk ke kategori kartu
            const cards = validData.filter(item => item.ID === 'card' || item.ID === 'galery');

            cards.forEach(item => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-custom';
                
                // Konversi newline dari Sheet menjadi tag HTML Break
                const formattedBody = (item.Body || "").replace(/\n/g, '<br>');

                // Template isi kartu
                cardDiv.innerHTML = `
                    <div class="card-content">
                        <h3 class="glow-effect">${item.Header}</h3>
                        <div class="card-body-text">${formattedBody}</div>
                    </div>
                `;

                // Listener untuk fitur Pop-up Detail (akan diproses di tahap final)
                cardDiv.onclick = () => {
                    openPopup(item.Header, formattedBody);
                };

                slider.appendChild(cardDiv);
            });
        }

    } catch (error) {
        // Penanganan error sederhana jika koneksi gagal
        console.error("Data fetch failed.");
    }
}

/ Inisialisasi fungsi saat seluruh struktur DOM selesai dimuat
document.addEventListener('DOMContentLoaded', loadData);
