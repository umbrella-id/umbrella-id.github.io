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
        if (!res.ok) throw new Error("File SVG tidak ditemukan");
        
        const svgText = await res.text();
        const container = document.getElementById('logo-container');
        
        if (container) {
            container.innerHTML = svgText;
            
            const svgElement = container.querySelector('svg');
            if (svgElement) {
                // 1. BUANG DIMENSI STATIS (Penyebab Offside)
                svgElement.removeAttribute('width');
                svgElement.removeAttribute('height');
                
                // 2. PAKSA DIMENSI FLEXIBEL
                svgElement.style.width = "100%";
                svgElement.style.height = "100%";
                svgElement.style.maxWidth = "100%";
                svgElement.style.maxHeight = "100%";
                svgElement.style.display = "block";

                // 3. JAGA ASPECT RATIO ASLI
                if (!svgElement.getAttribute('viewBox')) {
                    // Jika SVG tidak punya viewbox, kita beri fallback agar tidak gepeng
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
            }
        }
    } catch (e) {
        console.error("Logo Error:", e);
        document.getElementById('logo-container').innerHTML = "<h1>UMBRELLA</h1>";
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
