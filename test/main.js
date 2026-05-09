// --- 1. FUNGSI UNTUK LOAD LOGO ---
async function loadLogo() {
    try {
        const res = await fetch('assets/logo-umbrela.svg');
        const svg = await res.text();
        document.getElementById('logo-container').innerHTML = svg;
    } catch (e) { console.error("Logo gagal dimuat"); }
}

// --- 2. FUNGSI KHUSUS HEADLINE (Si Bunglon) ---
async function muatHeadline() {
    // ... kode fetch yang sudah ada ...
    const judul = temp.querySelector('h2').innerHTML;
    const detail = temp.querySelector('p').innerHTML;

    if (window.innerWidth > 1024) {
        // Mode PC: Suntik ke Header & Footer
        document.getElementById('headline-title').innerHTML = judul;
        document.getElementById('headline-pc-footer').innerHTML = detail;
        
        // --- JANGAN SEMBUNYIKAN KARTU PERTAMA ---
        // Suntik juga ke kartu pertama (card-headline)
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        document.getElementById('card-headline').style.display = 'block'; // Pastikan muncul
    } else {
        // Mode HP: Gabung di Kartu Pertama
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
    }
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
