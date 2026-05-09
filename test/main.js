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
        // Karena logo ada di folder yang sama dengan main.js (di dalam /test/)
        // Kita cukup panggil nama filenya saja tanpa 'assets/'
        const res = await fetch('./logo-umbrella.svg'); 
        
        if (!res.ok) throw new Error("File SVG tidak ditemukan di folder test");
        
        const svg = await res.text();
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = svg;
            console.log("Logo Berhasil Tampil!");
        }
    } catch (e) {
        console.error("Logo Error:", e);
        // Fallback teks jika SVG tetap ngadat
        document.getElementById('logo-container').innerHTML = "<h1 style='color:white'>UMBRELLA</h1>";
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
    // Tambahkan ./ agar dia cari di folder yang sama (folder /test/)
    suntikKartu('./profile.html', 'slot-profile');
    suntikKartu('./gallery.html', 'slot-gallery');
};
