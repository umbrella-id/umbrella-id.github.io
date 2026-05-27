/**
 * share.js - Brosur dengan html2canvas (Grid 3 kolom)
 */

const SHARE_TEXT = "Ayo gabung dengan guild Umbrella! Kunjungi web kami di https://umbrella-id.github.io";

// Ambil data dari window.allCardData
function getShareData() {
    if (!window.allCardData || !Array.isArray(window.allCardData)) {
        console.warn("allCardData belum tersedia");
        return { profilList: [], openmember: null };
    }
    
    const profilList = window.allCardData.filter(item => item.ID?.toLowerCase() === 'profil');
    const openmember = window.allCardData.find(item => item.ID?.toLowerCase() === 'openmember');
    
    console.log(`📦 Share data: ${profilList.length} profil, openmember: ${openmember ? 'ada' : 'tidak ada'}`);
    
    return { profilList, openmember };
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Format teks ke HTML (bullet points jadi <ul><li>)
function formatContentToHtml(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let inList = false;
    let html = '';
    
    for (let line of lines) {
        line = line.trim();
        if (line === '') continue;
        
        if (line.startsWith('-') || line.startsWith('•')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            let content = line.substring(1).trim();
            html += `<li>${escapeHtml(content)}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${escapeHtml(line)}</p>`;
        }
    }
    if (inList) html += '</ul>';
    return html;
}

// Batasi panjang teks
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Buat elemen brosur (HTML)
function createBrochureElement() {
    const { profilList, openmember } = getShareData();
    
    const container = document.createElement('div');
    container.className = 'brosur-container';
    container.id = 'brosur-temp';
    
    // Ambil logo dari halaman
    const logoImg = document.querySelector('.logo-wrapper img');
    const logoUrl = logoImg ? logoImg.src : '';
    
    // 1. HEADER (dari openmember.Header)
    let headerHtml = '';
    if (openmember && openmember.Header) {
        headerHtml = `
            <div class="brosur-header">
                <h1>${escapeHtml(openmember.Header)}</h1>
            </div>
        `;
    }
    
    // 2. BRAND AREA (logo + UMBRELLA + slogan)
    const brandHtml = `
        <div class="brosur-brand">
            ${logoUrl ? `<img src="${logoUrl}" class="brosur-logo" alt="Logo">` : ''}
            <div class="brosur-brand-text">
                <h2>UMBRELLA</h2>
                <p>Tempat Kita Berteduh dan Bertumbuh<br>dari pertemuan jadi kebersamaan, dari serikat jadi keluarga</p>
            </div>
        </div>
    `;
    
    // 3. GRID 3 KOLOM UNTUK PROFIL
    let profilGridHtml = '<div class="brosur-profil-grid">';
    
    for (let i = 0; i < profilList.length; i++) {
        const profil = profilList[i];
        profilGridHtml += `
            <div class="brosur-card">
                <h3>${escapeHtml(profil.Header || 'Profil')}</h3>
                <div class="brosur-card-body">
                    ${formatContentToHtml(truncateText(profil.Body || '', 800))}
                </div>
            </div>
        `;
    }
    
    // Jika profil kurang dari 3, tambahkan card kosong
    for (let i = profilList.length; i < 3; i++) {
        profilGridHtml += `<div class="brosur-card brosur-card-empty">−</div>`;
    }
    
    profilGridHtml += '</div>';
    
    // 4. FOOTER (dari openmember.Body, dipotong)
    let footerHtml = '';
    if (openmember && openmember.Body) {
        footerHtml = `
            <div class="brosur-footer">
                ${escapeHtml(truncateText(openmember.Body, 400))}
                <br><br>
                https://umbrella-id.github.io
            </div>
        `;
    } else {
        footerHtml = `
            <div class="brosur-footer">
                Ayo bergabung dengan Umbrella!<br>
                https://umbrella-id.github.io
            </div>
        `;
    }
    
    // Susun semua
    container.innerHTML = headerHtml + brandHtml + profilGridHtml + footerHtml;
    
    return container;
}

// Screenshot elemen ke blob
async function elementToBlob(element) {
    if (typeof html2canvas === 'undefined') {
        console.error("html2canvas tidak ditemukan");
        return null;
    }
    
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
            logging: false,
            allowTaint: false
        });
        return new Promise((resolve) => {
            canvas.toBlob(blob => resolve(blob), 'image/png');
        });
    } catch (err) {
        console.error("html2canvas error:", err);
        return null;
    }
}

// Fungsi utama share
async function triggerShare() {
    if (!navigator.share) {
        alert("Browser Anda tidak mendukung fitur share. Silakan screenshot manual.");
        return;
    }
    
    const shareBtn = document.getElementById('share-trigger');
    const originalText = shareBtn?.innerHTML;
    if (shareBtn) shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMBUAT...';
    
    try {
        const brosur = createBrochureElement();
        document.body.appendChild(brosur);
        
        await new Promise(r => setTimeout(r, 200));
        
        const blob = await elementToBlob(brosur);
        if (!blob) throw new Error("Gagal membuat gambar brosur");
        
        brosur.remove();
        
        const imageFile = new File([blob], "umbrella-brosur.png", { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
                title: "Umbrella Guild",
                text: SHARE_TEXT,
                files: [imageFile]
            });
        } else {
            await navigator.share({
                title: "Umbrella Guild",
                text: SHARE_TEXT
            });
        }
        
        console.log("✅ Share berhasil");
        
    } catch (err) {
        console.error("Share error:", err);
        if (err.name !== 'AbortError') {
            alert("Gagal share: " + (err.message || "Terjadi kesalahan"));
        }
    } finally {
        if (shareBtn) shareBtn.innerHTML = originalText;
        const leftover = document.getElementById('brosur-temp');
        if (leftover) leftover.remove();
    }
}

window.triggerShare = triggerShare;

console.log("✅ share.js loaded (Grid 3 kolom)");
