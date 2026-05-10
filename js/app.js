const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; // Pastikan ini URL /exec terbaru

async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        
        // 1. FILTER DATA (Hanya ambil yang ada ID-nya)
        const validData = data.filter(item => item.ID && item.ID !== "");

        // 2. RENDER HEADLINE (Header & Footer)
        const headline = validData.find(item => item.ID === 'headline');
        if (headline) {
            document.getElementById('main-headline').innerHTML = headline.Header;
            document.getElementById('sub-headline').innerHTML = headline.Body;
        }

        // 3. RENDER SLIDER (Card & Galery)
        const slider = document.getElementById('main-slider');
        slider.innerHTML = ''; // Bersihkan loading

        // Filter khusus untuk ID 'card' dan 'galery'
        const cards = validData.filter(item => item.ID === 'card' || item.ID === 'galery');

        cards.forEach(item => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-custom';
            
            // Cek apakah ini Galery (nanti kita urus logikanya) atau Card biasa
            if (item.ID === 'galery') {
                cardDiv.innerHTML = `
                    <h3 class="glow-effect">${item.Header}</h3>
                    <div class="gallery-content">${item.Body}</div>
                `;
            } else {
                // Card Profil (Buff, Fasilitas, dll)
                // Menggunakan replace(/\n/g, '<br>') agar baris baru di Sheet terbaca di HTML
                const bodyHTML = item.Body.replace(/\n/g, '<br>');
                cardDiv.innerHTML = `
                    <h3 class="glow-effect">${item.Header}</h3>
                    <div class="card-body-text">${bodyHTML}</div>
                `;
            }
            
            slider.appendChild(cardDiv);
        });

        console.log("Render Berhasil!");

    } catch (error) {
        console.error("Gagal Render:", error);
    }
}

window.onload = loadData;
