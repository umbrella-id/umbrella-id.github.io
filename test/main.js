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

// 1. Horizontal Scroll 
const panggung = document.getElementById('main-stage');
if (panggung) {
    panggung.addEventListener('wheel', (evt) => {
        if (evt.deltaY !== 0) {
            evt.preventDefault();
            panggung.scrollLeft += evt.deltaY;
        }
    }, { passive: false });
}

// 2. Fetcher Kartu
async function loadKartuToStage(file, slotId) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error('Network error');
        const html = await res.text();
        const slot = document.getElementById(slotId);
        if (slot) {
            slot.innerHTML = html;
            // Penting: Hapus padding bawaan HTML aslinya agar flex kartu yang handle
            const cardInner = slot.querySelector('div');
            if (cardInner) cardInner.style.padding = '0';
        }
    } catch (e) { console.error("Gagal load:", file, e); }
}

// 3. System Modal 
async function openModal(file) {
    try {
        const res = await fetch(file);
        if (!res.ok) throw new Error('File not found');
        const modalHtml = await res.text();
        
        let container = document.getElementById('system-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'system-modal-container';
            document.body.appendChild(container);
        }
        
        container.innerHTML = modalHtml;
        container.style.display = 'block';
        
        // Nonaktifkan scroll di body utama
        document.body.style.overflow = 'hidden';
    } catch (e) { console.error("Modal Error:", e); }
}

function closeModal() {
    const container = document.getElementById('system-modal-container');
    if (container) container.style.display = 'none';
    // Aktifkan kembali scroll body
    document.body.style.overflow = 'auto';
}

// 4. Initial Spawn (System Boot)
window.onload = () => {
    // Sesuai rumus final Master
    loadKartuToStage('./headline_card.html', 'slot-headline');
    loadKartuToStage('./guild_profile.html', 'slot-profile');
    loadKartuToStage('./gallery_card.html', 'slot-gallery');
};

// --- HEADER HEADLINE - PC VIEW ---
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
