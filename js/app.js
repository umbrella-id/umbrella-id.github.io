const GAS_URL = "https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec"; // Pastikan ini URL /exec terbaru

async function loadData() {
    try {
        console.log("1. Memulai koneksi ke Server...");
        const response = await fetch(GAS_URL);
        
        if (!response.ok) throw new Error("Gagal terhubung ke URL GAS");
        
        const data = await response.json();
        console.log("2. Data mentah diterima dari GAS:", data);

        // --- RENDER HEADLINE ---
        console.log("3. Mencari ID: headline...");
        const headline = data.find(item => item.ID === 'headline');
        
        if (headline) {
            document.getElementById('main-headline').textContent = headline.Header;
            document.getElementById('sub-headline').textContent = headline.Body;
            console.log("   ✅ Headline berhasil dimuat.");
        } else {
            console.warn("   ⚠️ ID 'headline' tidak ditemukan.");
        }

        // --- RENDER SLIDER (CARD & GALERY) ---
        const slider = document.getElementById('main-slider');
        if (!slider) {
            console.error("❌ Elemen 'main-slider' tidak ditemukan di HTML!");
            return;
        }
        slider.innerHTML = ''; 

        console.log("4. Memulai filter ID: card & galery...");
        const cards = data.filter(item => item.ID === 'card' || item.ID === 'galery');
        console.log(`   Ditemukan ${cards.length} kartu.`);

        cards.forEach((item, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-custom';
            
            // Konversi enter (\n) menjadi baris baru (<br>)
            const bodyContent = (item.Body || "").replace(/\n/g, '<br>');

            cardDiv.innerHTML = `
                <h3 class="glow-effect">${item.Header}</h3>
                <div class="card-body-text">${bodyContent}</div>
            `;
            
            slider.appendChild(cardDiv);
            console.log(`   ✅ Kartu ke-${index + 1} (${item.Header}) berhasil dirender.`);
        });

        console.log("5. Semua proses selesai.");

    } catch (error) {
        console.error("❌ TERJADI ERROR:", error.message);
    }
}

// Jalankan fungsi saat halaman siap
window.onload = loadData;
