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
    const res = await fetch('headline.html');
    const text = await res.text();
    const temp = document.createElement('div');
    temp.innerHTML = text;

    const judul = temp.querySelector('h2').innerText;
    const detail = temp.querySelector('p').innerText;

    if (window.innerWidth > 1024) {
        // Mode PC: Judul ke ATAS, Detail ke BAWAH
        document.getElementById('headline-title').innerText = judul;
        document.getElementById('headline-pc-footer').innerText = detail;
    } else {
        // Mode HP: Semua masuk ke kartu pertama
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
    }
}
