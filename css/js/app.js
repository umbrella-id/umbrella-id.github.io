const GAS_URL = "https://script.google.com/macros/s/AKfycbzTP1-9KuQ2iz4ffTfhujqkSIQqQxXWMXY-BHljCVU_Zzm0Ept8j4AJUCBHqB-ZSZk/exec"; // Ganti dengan URL Web App Apps Script

async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();

        // 1. Isi Header & Footer
        const headline = data.find(item => item.ID === 'headline');
        if(headline) {
            document.getElementById('main-headline').innerHTML = headline.Header;
            document.getElementById('sub-headline').innerHTML = headline.Body;
        }

        // 2. Isi Slider (Profil & Galery)
        const slider = document.getElementById('main-slider');
        const cards = data.filter(item => item.ID === 'profil' || item.ID === 'galery');

        cards.forEach(item => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-custom';
            
            if(item.ID === 'galery') {
                // Logika jika ada gambar
                cardElement.innerHTML = `<h3>${item.Header}</h3><div class="img-placeholder"></div><p>${item.Body}</p>`;
            } else {
                cardElement.innerHTML = `<h3>${item.Header}</h3><div>${item.Body}</div>`;
            }
            
            slider.appendChild(cardElement);
        });

    } catch (error) {
        console.error("Gagal memuat data:", error);
    }
}

window.onload = loadData;
