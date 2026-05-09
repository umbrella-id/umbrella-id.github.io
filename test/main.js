async function loadLogo() {
    console.log("Mencoba memanggil logo...");
    try {
        // Pastikan path-nya benar. Jika main.js ada di root, pakai 'assets/...'
        const res = await fetch('assets/logo-umbrella.svg'); 
        if (!res.ok) throw new Error("File SVG tidak ditemukan di folder assets");
        
        const svg = await res.text();
        const container = document.getElementById('logo-container');
        
        if (container) {
            container.innerHTML = svg;
            console.log("Logo Berhasil Disuntik!");
        }
    } catch (e) {
        console.error("EROR LOGO:", e.message);
        // Emergency Fallback: Jika SVG gagal, tampilkan teks dulu biar gak kosong
        document.getElementById('logo-container').innerHTML = "<h1 style='color:white'>UMBRELLA</h1>";
    }
}

// Panggil fungsi saat web siap
window.addEventListener('DOMContentLoaded', () => {
    loadLogo();
    muatHeadline();
    // ... panggil fungsi lainnya
});

// Fungsi Scroll Mouse (Wajib ada biar nyaman)
const panggung = document.getElementById('main-stage');
panggung.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
        e.preventDefault();
        panggung.scrollLeft += e.deltaY;
    }
}, { passive: false });

async function muatHeadline() {
    try {
        const res = await fetch('headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        // PC Mode Injeksi
        if (window.innerWidth > 1024) {
            const hTitle = document.getElementById('headline-title');
            const hFooter = document.getElementById('headline-pc-footer');
            if (hTitle) hTitle.innerHTML = judul;
            if (hFooter) hFooter.innerHTML = detail;
        }
        
        // Kartu Pertama Tetap Muncul
        const cardH = document.getElementById('card-headline');
        if (cardH) cardH.innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        
    } catch (e) { console.error("headline.html belum ada!"); }
}

window.onload = () => {
    loadLogo();
    muatHeadline();
    // suntik modul lainnya...
};
