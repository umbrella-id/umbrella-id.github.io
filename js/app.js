// Gantilah dengan URL Web App (Deployment) terbaru kamu
const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; 

async function loadData() {
    try {
        console.log("Memulai penarikan data...");
        const response = await fetch(GAS_URL);
        const data = await response.json();
        console.log("Data berhasil diterima:", data);

        // 1. Render Headline (Header & Footer)
        // Kita cari baris yang ID-nya adalah 'headline'
        const headline = data.find(item => item.ID === 'headline' || item.id === 'headline');
        if (headline) {
            document.getElementById('main-headline').innerHTML = headline.Header || headline.header;
            document.getElementById('sub-headline').innerHTML = headline.Body || headline.body;
        }

        // 2. Render Slider (Profil & Galery)
        const sliderContainer = document.getElementById('main-slider');
        sliderContainer.innerHTML = ''; // Bersihkan kontainer

        // Ambil semua data yang Tipe-nya HTML (untuk profil dan galery)
        const contentCards = data.filter(item => item.ID === 'profil' || item.ID === 'galery');

        contentCards.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card-custom';
            
            // Logika untuk Galery (Jika ada gambar)
            if (item.ID === 'galery') {
                // Misal di Body tertulis link gambar: assets/img/gallery/foto1.jpg
                card.innerHTML = `
                    <div class="card-content">
                        <h3 class="glow-effect">${item.Header}</h3>
                        <div class="gallery-frame">
                            <img src="${item.Body}" alt="Gallery Image" class="gallery-img">
                        </div>
                    </div>
                `;
            } else {
                // Logika untuk Profil
                card.innerHTML = `
                    <div class="card-content">
                        <h3 class="glow-effect">${item.Header}</h3>
                        <div class="body-text">${item.Body}</div>
                    </div>
                `;
            }
            
            sliderContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Waduh, ada error pas tarik data:", error);
    }
}

window.onload = loadData;
