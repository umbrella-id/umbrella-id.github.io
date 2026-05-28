/**
 * share.js - Brosur dengan html2canvas
 * Menampilkan semua item profil + openmember dari database
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
        
        if (line.startsWith('-')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${escapeHtml(line.substring(1).trim())}</li>`;
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

// Buat elemen brosur (HTML)
function createBrochureElement() {
    const { profilList, openmember } = getShareData();
    
    const container = document.createElement('div');
    container.className = 'brosur-container';
    container.id = 'brosur-temp';
    
    const logoImg = document.querySelector('.logo-wrapper img');
    const logoUrl = logoImg ? logoImg.src : '';
    
    // 1. HEADER
    let headerHtml = '';
    if (openmember && openmember.Header) {
        headerHtml = `<div class="brosur-header"><h1>${escapeHtml(openmember.Header)}</h1></div>`;
    }
    
    // 2. BRAND AREA
    const brandHtml = `
        <div class="brosur-brand">
            ${logoUrl ? `<img src="${logoUrl}" class="brosur-logo" alt="Logo">` : ''}
            <div class="brosur-brand-text">
                <div class="brand-name">UMBRELLA</div>
                <div class="brand-main">Tempat Kita Berteduh dan Bertumbuh</div>
                <div class="brand-sub">dari pertemuan jadi kebersamaan<br>dari serikat jadi keluarga</div>
            </div>
        </div>
    `;
    
    // 3. PROFIL (langsung, tanpa div pembungkus tambahan)
    let profilHtml = '<div class="brosur-profil">';
    for (const profil of profilList) {
        profilHtml += `
            <div class="brosur-card">
                <h2>${escapeHtml(profil.Header || 'Profil Guild')}</h2>
                <div class="brosur-card-body">
                    ${formatContentToHtml(profil.Body)}
                </div>
            </div>
        `;
    }
    // Tambahkan kartu kosong jika perlu (biar grid rapi)
    const totalCards = profilList.length;
    if (totalCards === 1) {
        profilHtml += `<div class="brosur-card-empty"></div><div class="brosur-card-empty"></div>`;
    } else if (totalCards === 2) {
        profilHtml += `<div class="brosur-card-empty"></div><div class="brosur-card-empty"></div>`;
    } else if (totalCards === 3) {
        profilHtml += `<div class="brosur-card-empty"></div>`;
    }
    profilHtml += '</div>';
    
    // 4. FOOTER
    let footerHtml = '';
    if (openmember && openmember.Body) {
        let cleanBody = openmember.Body.replace(/<br\s*\/?>|\r?\n/g, ' ');
        footerHtml = `
            <div class="brosur-footer">
                <div class="brosur-footer-text">${formatContentToHtml(cleanBody)}</div>
                <div class="brosur-link">https://umbrella-id.github.io</div>
            </div>
        `;
    } else {
        footerHtml = `
            <div class="brosur-footer">
                <div class="brosur-footer-text">Ayo bergabung dengan Umbrella!</div>
                <div class="brosur-link">https://umbrella-id.github.io</div>
            </div>
        `;
    }  
    container.innerHTML = headerHtml + brandHtml + profilHtml + footerHtml;
    
    return container;
}
// Screenshot elemen ke blob
async function elementToBlob(element) {
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

console.log("✅ share.js loaded (html2canvas version)");
