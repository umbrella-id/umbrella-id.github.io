// 1. Fungsi panggil Logo SVG
async function loadLogo() {
    const response = await fetch('logo-umbrela.svg');
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
