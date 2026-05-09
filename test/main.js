// 1. Fungsi panggil Logo SVG
async function loadLogo() {
    const response = await fetch('logo-umbrella.svg');
    const svgText = await response.text();
    document.getElementById('logo-container').innerHTML = svgText;
}

// 2. Logika Menciut saat Scroll
window.onscroll = function() {
    const container = document.getElementById('logo-container');
    if (window.scrollY > 50) {
        container.classList.add('mini'); // Tambahkan class CSS untuk mengecil
    } else {
        container.classList.remove('mini');
    }
};

// Jalankan saat start
loadLogo();

async function muatHeadline() {
    try {
        const res = await fetch('headline.html');
        const text = await res.text();
        
        // Buat element bayangan untuk mengambil data
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        console.log("Headline Ditemukan:", judul);

        if (window.innerWidth > 1024) {
            // Mode PC: Suntik ke area atas dan bawah
            document.getElementById('headline-title').innerHTML = judul;
            document.getElementById('headline-pc-footer').innerHTML = detail;
        } else {
            // Mode HP: Masukkan ke kartu pertama
            document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
        }
    } catch (err) {
        console.error("Gagal muat headline. Pastikan file headline.html ada!", err);
    }
}

// Panggil fungsi saat halaman siap
window.addEventListener('DOMContentLoaded', () => {
    loadLogo();
    muatHeadline();
});
