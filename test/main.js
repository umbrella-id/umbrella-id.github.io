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
        const svgText = await res.text();
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = svgText;
            const svg = container.querySelector('svg');
            if (svg) {
                // BUANG SEMUA ATRIBUT YANG BIKIN RAKSASA
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.maxWidth = '100%';
                svg.style.maxHeight = '100%';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        }
    } catch (e) { console.error(e); }
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
