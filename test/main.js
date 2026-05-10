// 1. Scroll Wheel
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

// 2. Load Logo
async function loadLogo() {
    try {
        const res = await fetch('./logo-umbrella2.svg');
        const data = await res.text();
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = data;
            const svg = container.querySelector('svg');
            if(svg) {
                // Bersihkan dimensi bawaan file SVG
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                // Biarkan CSS max-width/max-height yang bekerja
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        }
    } catch (e) { console.error("Logo Error:", e); }
}

// 3. Suntik Kartu & Headline
async function suntikKartu(file, idSlot) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        const target = document.getElementById(idSlot);
        if (target) target.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function muatHeadline() {
    try {
        const res = await fetch('./headline.html');
        const text = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = text;
        const judul = temp.querySelector('h2').innerHTML;
        const detail = temp.querySelector('p').innerHTML;
        document.getElementById('headline-title').innerHTML = judul;
        document.getElementById('headline-pc-footer').innerHTML = detail;
        document.getElementById('card-headline').innerHTML = `<h2>${judul}</h2><p>${detail}</p>`;
    } catch (e) { console.error(e); }
}

window.onload = () => {
    loadLogo();
    muatHeadline();
    suntikKartu('./profile.html', 'slot-profile');
    suntikKartu('./gallery.html', 'slot-gallery');
};
