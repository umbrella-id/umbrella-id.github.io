// --- SAKTI: MOUSE WHEEL SCROLL ---
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

async function loadLogo() {
    try {
        const res = await fetch('assets/logo-umbrella.svg');
        if (!res.ok) throw new Error();
        const svg = await res.text();
        document.getElementById('logo-container').innerHTML = svg;
    } catch (e) {
        console.error("Logo SVG gak ketemu di folder assets/");
    }
}

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
