// --- FUNGSI UNTUK LOAD LOGO ---
async function loadLogo() {
    try {
        const res = await fetch('assets/logo-umbrela.svg');
        const svg = await res.text();
        document.getElementById('logo-container').innerHTML = svg;
    } catch (e) { console.error("Logo gagal dimuat"); }
}

// --- SAKTI: MOUSE WHEEL SCROLL ---
const panggung = document.getElementById('main-stage');
panggung.addEventListener('wheel', (evt) => {
    if (evt.deltaY !== 0) {
        evt.preventDefault();
        panggung.scrollLeft += evt.deltaY;
    }
}, { passive: false });

// --- TRIPLE SPAWN HEADLINE ---
async function muatHeadline() {
    try {
        const res = await fetch('headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        if (window.innerWidth > 1024) {
            document.getElementById('headline-title').innerHTML = judul;
            document.getElementById('headline-pc-footer').innerHTML = detail;
        }
        
        // Tetap isi kartu pertama di semua mode
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        
    } catch (e) { console.error("File headline.html gak ada!"); }
}

// Tambah fungsi suntikModul untuk Profile & Gallery seperti sebelumnya...
// ---  FUNGSI UMUM UNTUK KARTU LAIN ---
async function suntikModul(file, idSlot) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        document.getElementById(idSlot).innerHTML = html;
    } catch (e) { 
        document.getElementById(idSlot).innerHTML = "<p>Gagal memuat konten.</p>";
    }
}

// ---  JALANKAN SEMUA SAAT HALAMAN DIBUKA ---
window.addEventListener('DOMContentLoaded', () => {
    loadLogo();
    muatHeadline();
    suntikModul('profile.html', 'slot-profile');
    suntikModul('gallery.html', 'slot-gallery');
});
