// Load Logo 
async function loadLogo() {
    try {
        const res = await fetch('./logo-umbrella.svg');
        const data = await res.text();
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = data;
            const svg = container.querySelector('svg');
            if(svg) {
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        }
    } catch (e) { console.error("Logo Error:", e); }
}

//--- ZONA KARTU ---

// Horizontal Scroll 
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

// Sinkronisasi Headline Card ke Header PC (Iklan Banner)
async function muatHeadline() {
    try {
        const res = await fetch('./headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;
        
        const judul = temp.querySelector('h2').innerHTML;
        const infoPenting = temp.querySelector('p').innerHTML;

        // Taruh di Header sebagai Banner Iklan
        document.getElementById('headline-title').innerHTML = judul;
        // Taruh di Footer sebagai info berjalan/tambahan
        document.getElementById('headline-pc-footer').innerHTML = infoPenting;
        // Taruh di Kartu Pertama (Stage)
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${infoPenting}</p>`;
        
    } catch (e) { console.error("Headline Sync Gagal", e); }
}

// Fungsi Klik Kartu (Sederhana: Toggle Zoom/Highlight)
function setupCardInteractions() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.onclick = () => {
            // Master bisa menambahkan fungsi popup beneran di sini 
            // atau biarkan efek CSS :active yang bekerja
            console.log("Card " + card.id + " terpilih");
        };
    });
}

// Fungsi Load Card 
async function LoadCard(file, idSlot) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        const target = document.getElementById(idSlot);
        if (target) target.innerHTML = html;
    } catch (e) { console.error(e); }
}
window.onload = () => {
    muatHeadline(); // Load kartu lainnya tetap pakai cara Master
    LoadCard('./profile.html', 'slot-profile');
    LoadCard('./gallery.html', 'slot-gallery');
};

