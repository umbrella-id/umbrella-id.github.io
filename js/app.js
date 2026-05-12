function updateStack(drag = 0) {
    if (window.innerWidth >= 768) return;
    const cards = document.querySelectorAll('.card-element');
    const h = window.innerHeight;

    cards.forEach((card, i) => {
        // Gunakan transisi halus hanya saat dilepas (drag === 0)
        card.style.transition = drag === 0 ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s" : "none";
        card.classList.remove('is-active', 'is-next', 'is-stacked', 'on-top');

        if (i === currentIndex) {
            card.classList.add('is-active');
            card.style.opacity = 1 - Math.abs(drag) / 1000; // Kartu utama memudar tipis saat ditarik
            card.style.transform = `translateY(${drag * 0.2}px) scale(${1 - Math.abs(drag)/4000})`;
            card.style.zIndex = "50";
        } 
        else if (i === currentIndex + 1) {
            card.classList.add('is-next');
            if (drag < 0) { // Menarik kartu bawah ke atas
                card.classList.add('on-top');
                let progress = Math.abs(drag) / 200; // Muncul penuh setelah tarik 200px
                card.style.opacity = Math.min(progress, 1); 
                card.style.transform = `translateY(${h + drag}px) scale(${0.8 + (Math.min(progress, 1) * 0.2)})`;
            } else {
                card.style.opacity = "0";
                card.style.transform = `translateY(40px) scale(0.8)`;
            }
        } 
        else if (i === currentIndex - 1) {
            card.classList.add('is-stacked');
            if (drag > 0) { // Menarik kartu atas ke bawah
                card.classList.add('on-top');
                let progress = drag / 200;
                card.style.opacity = Math.min(progress, 1);
                card.style.transform = `translateY(${-h + drag}px) scale(${0.8 + (Math.min(progress, 1) * 0.2)})`;
            } else {
                card.style.opacity = "0";
                card.style.transform = `translateY(-100%) scale(0.8)`;
            }
        } else {
            card.style.opacity = "0";
        }
    });
}
