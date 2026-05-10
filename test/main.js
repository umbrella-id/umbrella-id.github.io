// 1. Fungsi Scroll Mouse Wheel (Panggung)
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

// 2. Fungsi Load Logo (Pawang SVG)
async function loadLogo() {
    try {
        const res = await fetch('./logo-umbrella.html');
        if (!res.ok) throw new Error("logo.html tidak ditemukan");
        const data = await res.text();
        
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = data;
            const svg = container.querySelector('svg');
            if(svg) {
                // Matikan ego dimensi asli SVG agar nurut CSS
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
            console.log("Logo Umbrella: Berhasil Dimasukkan");
        }
    } catch (e) { console.error("Logo Error:", e); }
}

// 3. Fungsi Suntik Kartu Otomatis (Profile & Gallery)
async function suntikKartu(file, idSlot) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Gagal ambil ${file}`);
        const html = await res.text();
        const target = document.getElementById(idSlot);
        if (target) target.innerHTML = html;
    } catch (e) { console.error(`Kartu ${idSlot} Error:`, e); }
}

// 4. Fungsi Headline Triple Spawn
async function muatHeadline() {
    try {
        const res = await fetch('./headline.html');
        if (!res.ok) return;
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;

        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;

        // Suntik ke 3 lokasi sekaligus
        if(document.getElementById('headline-title')) 
            document.getElementById('headline-title').innerHTML = judul;
        
        if(document.getElementById('headline-pc-footer')) 
            document.getElementById('headline-pc-footer').innerHTML = detail;
            
        if(document.getElementById('card-headline')) 
            document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
            
    } catch (e) { console.error("Gagal muat headline:", e); }
}

// Jalankan Semua Saat Load
window.onload = () => {
    loadLogo();
    muatHeadline();
    suntikKartu('./profile.html', 'slot-profile');
    suntikKartu('./gallery.html', 'slot-gallery');
};
