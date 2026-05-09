// --- 1. FUNGSI UNTUK LOAD LOGO ---
async function loadLogo() {
    try {
        const res = await fetch('assets/logo-umbrela.svg');
        const svg = await res.text();
        document.getElementById('logo-container').innerHTML = svg;
    } catch (e) { console.error("Logo gagal dimuat"); }
}

// --- 2. FUNGSI KHUSUS HEADLINE (Si Bunglon) ---
// Fungsi Scroll Samping pakai Mouse Wheel
const panggung = document.getElementById('main-stage');
panggung.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    panggung.scrollLeft += evt.deltaY; // Ubah scroll atas-bawah jadi kiri-kanan
}, { passive: false });

async function muatHeadline() {
    try {
        const res = await fetch('headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        // 1. Suntik ke Atas (Header PC)
        document.getElementById('headline-title').innerHTML = judul;
        // 2. Suntik ke Bawah (Footer PC)
        document.getElementById('headline-pc-footer').innerHTML = detail;
        // 3. Suntik ke Kartu (Panggung) - TETAP MUNCUL DI PC
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        
    } catch (e) { console.error("Cek apakah file headline.html ada di GitHub!"); }
}

// --- 3. FUNGSI UMUM UNTUK KARTU LAIN ---
async function suntikModul(file, idSlot) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        document.getElementById(idSlot).innerHTML = html;
    } catch (e) { 
        document.getElementById(idSlot).innerHTML = "<p>Gagal memuat konten.</p>";
    }
}

// --- 4. JALANKAN SEMUA SAAT HALAMAN DIBUKA ---
window.addEventListener('DOMContentLoaded', () => {
    loadLogo();
    muatHeadline();
    suntikModul('profile.html', 'slot-profile');
    suntikModul('gallery.html', 'slot-gallery');
});
