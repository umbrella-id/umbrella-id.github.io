// 1. Fungsi Scroll Mouse Wheel
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

// 2. Fungsi Load Logo
async function loadLogo() {
    try {
        const res = await fetch('./logo-umbrella.svg'); 
        if (!res.ok) throw new Error("File SVG tidak ditemukan di path yang benar");
        
        const svgText = await res.text();
        const container = document.getElementById('logo-container');
        
        if (container) {
            container.innerHTML = svgText;
            
            // --- LOGIKA PAWANG SVG MULAI DI SINI ---
            const svgElement = container.querySelector('svg');
            
            if (svgElement) {
                // 1. BUANG instruksi lebar/tinggi asli file SVG (Penyebab Offside)
                svgElement.removeAttribute('width');
                svgElement.removeAttribute('height');
                
                // 2. PAKSA pakai CSS Master 100% dari box container
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                
                // 3. Jaga aspect ratio agar logo tidak gepeng
                svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                
                console.log("Logo Umbrella berhasil dijinakkan oleh Pawang JS!");
            }
        }
    } catch (e) {
        console.error("Logo Ngadat:", e);
        // Fallback teks jika SVG tetap ngadat
        document.getElementById('logo-container').innerHTML = "<h1 style='color:white'>UMBRELLA</h1>";
    }
}

// 3. Fungsi Suntik Kartu (Otomatis)
async function suntikKartu(file, idSlot) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Gagal ambil ${file}`);
        const html = await res.text();
        const target = document.getElementById(idSlot);
        if (target) target.innerHTML = html;
    } catch (e) {
        console.error(`Kartu ${idSlot} Error:`, e);
    }
}

// 4. Fungsi Khusus Headline (Triple Spawn)
async function muatHeadline() {
    try {
        const res = await fetch('./headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        // 1. Suntik ke Atas (Headline Title)
        document.getElementById('headline-title').innerHTML = judul;
        
        // 2. Suntik ke Bawah (Footer Detail)
        document.getElementById('headline-pc-footer').innerHTML = detail;
        
        // 3. Suntik ke Kartu Panggung (Opsional)
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
    } catch (e) { console.error("Gagal muat data headline", e); }
}

// JALANKAN SEMUA SAAT WINDOW LOAD
window.onload = () => {
    loadLogo();
    muatHeadline();
    // Tambahkan ./ agar dia cari di folder yang sama (folder /test/)
    suntikKartu('./profile.html', 'slot-profile');
    suntikKartu('./gallery.html', 'slot-gallery');
};
