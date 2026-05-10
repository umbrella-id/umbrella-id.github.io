async function loadLogo() {
    try {
        const res = await fetch('./logo-umbrella.svg');
        const data = await res.text();
        const container = document.getElementById('logo-container');
        if (container) {
            container.innerHTML = data;
            const svg = container.querySelector('svg');
            if(svg) {
                svg.removeAttribute('width'); svg.removeAttribute('height');
                svg.style.width = '100%'; svg.style.height = '100%';
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        }
    } catch (e) { console.error("Logo Error:", e); }
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

async function suntikKartu(file, idSlot) {
    try {
        const res = await fetch(file);
        const html = await res.text();
        const target = document.getElementById(idSlot);
        if (target) {
            // Kita pastikan membungkus isi file dengan class .card 
            // agar stylenya seragam di panggung
            target.innerHTML = `<div class="card">${html}</div>`;
        }
    } catch (e) { console.error(e); }
}

window.onload = () => {
    loadLogo();
    muatHeadline();
    suntikKartu('./profile.html', 'slot-profile');
    suntikKartu('./gallery.html', 'slot-gallery');
};
