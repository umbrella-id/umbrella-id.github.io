/**
 * share.js - Brosur & Share API
 * Menggunakan data dari window.allCardData (dari app.js)
 */

const SHARE_CANVAS_WIDTH = 1080;
const SHARE_CANVAS_HEIGHT = 1350;
const SHARE_TEXT = "Ayo gabung dengan guild Umbrella! Kunjungi web kami di https://umbrella-id.github.io";

let shareCanvas = null;
let shareCtx = null;

function initShareCanvas() {
    if (shareCanvas) return;
    shareCanvas = document.createElement('canvas');
    shareCanvas.width = SHARE_CANVAS_WIDTH;
    shareCanvas.height = SHARE_CANVAS_HEIGHT;
    shareCanvas.style.position = 'fixed';
    shareCanvas.style.top = '-9999px';
    shareCanvas.style.left = '-9999px';
    shareCanvas.style.opacity = '0';
    shareCanvas.style.pointerEvents = 'none';
    document.body.appendChild(shareCanvas);
    shareCtx = shareCanvas.getContext('2d');
}

// Ambil data dari window.allCardData (tanpa fetch)
function getShareData() {
    if (!window.allCardData || !Array.isArray(window.allCardData)) {
        console.warn("allCardData belum tersedia");
        return { profil: null, openmember: null };
    }
    
    const profil = window.allCardData.find(item => item.ID && item.ID.toLowerCase() === 'profil');
    const openmember = window.allCardData.find(item => item.ID && item.ID.toLowerCase() === 'openmember');
    
    return { profil, openmember };
}

// Render logo ke canvas (dari img element)
function drawLogo(ctx, x, y, width, height) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            ctx.drawImage(img, x, y, width, height);
            resolve();
        };
        img.onerror = () => {
            console.warn("Logo tidak bisa dimuat");
            resolve();
        };
        // Coba ambil logo dari elemen yang sudah ada di halaman
        const existingLogo = document.querySelector('.logo-wrapper img');
        if (existingLogo && existingLogo.src) {
            img.src = existingLogo.src;
        } else {
            // Fallback: tidak ada logo
            resolve();
        }
    });
}

// Render brosur ke canvas
async function renderBrochureToCanvas() {
    initShareCanvas();
    if (!shareCtx) return null;
    
    const { profil, openmember } = getShareData();
    
    // 1. Clear canvas dengan background gelap
    shareCtx.fillStyle = '#030208';
    shareCtx.fillRect(0, 0, SHARE_CANVAS_WIDTH, SHARE_CANVAS_HEIGHT);
    
    // 2. Gambar logo (jika ada)
    await drawLogo(shareCtx, 60, 60, 120, 120);
    
    // 3. Brand UMBRELLA
    shareCtx.fillStyle = '#a855f7';
    shareCtx.font = 'bold 64px "Segoe UI", system-ui';
    shareCtx.textAlign = 'center';
    shareCtx.fillText("UMBRELLA", SHARE_CANVAS_WIDTH / 2, 140);
    
    // 4. Slogan (dari profil)
    if (profil && profil.Header) {
        shareCtx.fillStyle = '#cbd5e1';
        shareCtx.font = '28px "Segoe UI", system-ui';
        shareCtx.fillText(profil.Header, SHARE_CANVAS_WIDTH / 2, 210);
    }
    
    if (profil && profil.Body) {
        shareCtx.fillStyle = '#94a3b8';
        shareCtx.font = '22px "Segoe UI", system-ui';
        shareCtx.textAlign = 'left';
        // Tampilkan body profil (dibatasi)
        const profilText = profil.Body.length > 300 ? profil.Body.substring(0, 300) + '...' : profil.Body;
        wrapText(shareCtx, profilText, 80, 280, SHARE_CANVAS_WIDTH - 160, 32);
    }
    
    // 5. Konten openmember (judul + isi)
    let currentY = 280 + (profil ? 150 : 0);
    
    if (openmember) {
        if (openmember.Header) {
            shareCtx.fillStyle = '#a855f7';
            shareCtx.font = 'bold 36px "Segoe UI", system-ui';
            shareCtx.textAlign = 'left';
            shareCtx.fillText(openmember.Header, 80, currentY);
            currentY += 50;
        }
        
        if (openmember.Body) {
            shareCtx.fillStyle = '#cbd5e1';
            shareCtx.font = '22px "Segoe UI", system-ui';
            const openmemberText = openmember.Body.length > 500 ? openmember.Body.substring(0, 500) + '...' : openmember.Body;
            currentY = wrapText(shareCtx, openmemberText, 80, currentY, SHARE_CANVAS_WIDTH - 160, 32);
        }
    } else {
        shareCtx.fillStyle = '#94a3b8';
        shareCtx.font = '22px "Segoe UI", system-ui';
        shareCtx.textAlign = 'center';
        shareCtx.fillText("Informasi open member belum tersedia", SHARE_CANVAS_WIDTH / 2, currentY + 50);
    }
    
    // 6. Footer (link web)
    shareCtx.fillStyle = '#64748b';
    shareCtx.font = '18px "Segoe UI", system-ui';
    shareCtx.textAlign = 'center';
    shareCtx.fillText("https://umbrella-id.github.io", SHARE_CANVAS_WIDTH / 2, SHARE_CANVAS_HEIGHT - 50);
    
    return shareCanvas;
}

// Fungsi wrap text (sederhana)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + (line ? ' ' : '') + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line) {
            ctx.fillText(line, x, currentY);
            line = words[i];
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
}

// Konversi canvas ke blob
function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Gagal konversi canvas ke blob"));
        }, 'image/png');
    });
}

// Fungsi utama share
async function triggerShare() {
    // Cek dukungan Web Share API
    if (!navigator.share) {
        alert("Browser Anda tidak mendukung fitur share. Silakan screenshot manual.");
        return;
    }
    
    const shareBtn = document.getElementById('share-trigger');
    const originalText = shareBtn?.innerHTML;
    if (shareBtn) shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMBUAT...';
    
    try {
        const canvas = await renderBrochureToCanvas();
        if (!canvas) throw new Error("Gagal membuat brosur");
        
        const imageBlob = await canvasToBlob(canvas);
        const imageFile = new File([imageBlob], "umbrella-brosur.png", { type: "image/png" });
        
        // Cek apakah bisa share file
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
                title: "Umbrella Guild",
                text: SHARE_TEXT,
                files: [imageFile]
            });
        } else {
            // Fallback: share teks saja
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
    }
}

// Ekspos ke global
window.triggerShare = triggerShare;

console.log("✅ share.js loaded (menggunakan allCardData dari app.js)");
