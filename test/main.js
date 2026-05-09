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

// 2. Fungsi Load Logo (Double Check Path)
async function loadLogo() {
    try {
        const res = await fetch('assets/logo-umbrella.svg');
        if (!res.ok) throw new Error("File SVG tidak ditemukan");
        const svg = await res.text();
        document.getElementById('logo-container').innerHTML = svg;
    } catch (e) {
        console.error("Logo Error:", e);
        // Fallback: Tampilkan teks jika SVG gagal
        document.getElementById('logo-container').innerHTML = "<h1 style='color:white; font-family:serif; font-size:3rem;'>UMBRELLA</h1>";
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
        const res = await fetch('headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2') ? temp.querySelector('h2').innerHTML : "No Title";
        const detail = temp.querySelector('p') ? temp.querySelector('p').innerHTML : "No Detail";

        // Suntik ke Header PC & Footer
        if (document.getElementById('headline-title')) {
            document.getElementById('headline-title').innerHTML = judul;
        }
        if (document.getElementById('headline-pc-footer')) {
            document.getElementById('headline-pc-footer').innerHTML = detail;
        }
        // Suntik ke Kartu Panggung
        if (document.getElementById('card-headline')) {
            document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        }
    } catch (e) { console.error("Headline Error:", e); }
}

// JALANKAN SEMUA SAAT WINDOW LOAD
window.onload = () => {
    loadLogo();
    muatHeadline();
    suntikKartu('profile.html', 'slot-profile');
    suntikKartu('gallery.html', 'slot-gallery');
};
