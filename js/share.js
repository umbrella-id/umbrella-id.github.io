/**
 * share.js - Brosur dengan html2canvas
 */

const SHARE_TEXT = "Ayo gabung dengan guild Umbrella! Kunjungi web kami di https://umbrella-id.github.io";

// Ambil data dari window.allCardData
function getShareData() {
    if (!window.allCardData) return { profil: null, openmember: null };
    const profil = window.allCardData.find(item => item.ID?.toLowerCase() === 'profil');
    const openmember = window.allCardData.find(item => item.ID?.toLowerCase() === 'openmember');
    return { profil, openmember };
}

// Buat elemen brosur (HTML)
function createBrochureElement() {
    const { profil, openmember } = getShareData();
    
    const container = document.createElement('div');
    container.className = 'brosur-container';
    container.id = 'brosur-temp';
    
    // Header (logo + brand)
    const logoUrl = document.querySelector('.logo-wrapper img')?.src || '';
    
    container.innerHTML = `
        <div class="brosur-header">
            ${logoUrl ? `<img src="${logoUrl}" class="brosur-logo" alt="Logo">` : ''}
            <div class="brosur-brand">
                <h1>UMBRELLA</h1>
                <p>Tempat Kita Berteduh dan Bertumbuh</p>
            </div>
        </div>
        <div class="brosur-content">
            ${profil ? `
            <div class="brosur-card">
                <h2>${escapeHtml(profil.Header || 'Profil Guild')}</h2>
                <div>${formatContentToHtml(profil.Body || '')}</div>
            </div>
            ` : ''}
            ${openmember ? `
            <div class="brosur-card">
                <h2>${escapeHtml(openmember.Header || 'Open Member')}</h2>
                <div>${formatContentToHtml(openmember.Body || '')}</div>
            </div>
            ` : '<div class="brosur-card"><p>Informasi open member belum tersedia</p></div>'}
        </div>
        <div class="brosur-footer">
            https://umbrella-id.github.io
        </div>
    `;
    
    return container;
}

// Format teks ke HTML (bullet points jadi <ul><li>)
function formatContentToHtml(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let inList = false;
    let html = '';
    
    for (let line of lines) {
        line = line.trim();
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
            if (line) {
                html += `<p>${escapeHtml(line)}</p>`;
            }
        }
    }
    if (inList) html += '</ul>';
    return html;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Screenshot elemen ke blob
async function elementToBlob(element) {
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
            logging: false
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
        alert("Browser Anda tidak mendukung fitur share.");
        return;
    }
    
    const shareBtn = document.getElementById('share-trigger');
    const originalText = shareBtn?.innerHTML;
    if (shareBtn) shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMBUAT...';
    
    try {
        // Buat elemen brosur
        const brosur = createBrochureElement();
        document.body.appendChild(brosur);
        
        // Tunggu sebentar agar CSS teraplikasi
        await new Promise(r => setTimeout(r, 100));
        
        // Screenshot
        const blob = await elementToBlob(brosur);
        if (!blob) throw new Error("Gagal membuat gambar");
        
        // Hapus elemen brosur
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
    } catch (err) {
        console.error("Share error:", err);
        if (err.name !== 'AbortError') {
            alert("Gagal share: " + (err.message || "Unknown error"));
        }
    } finally {
        if (shareBtn) shareBtn.innerHTML = originalText;
        // Pastikan elemen brosur terhapus jika terjadi error
        const leftover = document.getElementById('brosur-temp');
        if (leftover) leftover.remove();
    }
}

window.triggerShare = triggerShare;

console.log("✅ share.js loaded (html2canvas version)");
