/**
 * tentang.js — Modal Tentang Kami (dari file .txt)
 */

let tentangOpen = false;
let tentangData = null;

const TENTANG_FILE = 'Assets/tentang-kami.txt';

// ===== PRELOAD =====
async function preloadTentangData() {
  if (tentangData) {
    console.log('✅ Tentang Kami sudah di-cache');
    return;
  }

  try {
    console.log('📥 Preload Tentang Kami...');
    const res = await fetch(TENTANG_FILE);
    if (!res.ok) throw new Error('File not found: ' + TENTANG_FILE);

    tentangData = await res.text();
    console.log('✅ Tentang Kami preloaded (' + tentangData.length + ' chars)');
  } catch (err) {
    console.error('❌ Preload Tentang Kami gagal:', err);
    tentangData = null;
  }
}

// ===== BUKA MODAL =====
function openTentangModal() {
  const overlay = document.getElementById('tentangOverlay');
  const stage = document.getElementById('stage');
  const body = document.getElementById('tentangBody');
  if (!overlay || !body) return;

  tentangOpen = true;
  overlay.classList.add('open');
  if (stage) stage.classList.add('tentang-open');

  if (typeof updateButtons === 'function') updateButtons();

  if (tentangData) {
    body.innerHTML = formatTentangText(tentangData);
  } else {
    body.innerHTML = '<div class="tentang-loading">Memuat...</div>';
    fetchTentangData();
  }

  body.scrollTop = 0;
}

// ===== TUTUP MODAL =====
function closeTentangModal(skipMenu = false) {
  const overlay = document.getElementById('tentangOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  tentangOpen = false;
  overlay.classList.remove('open');

  // 🎯 Kalau mau balik ke menu → tambah modal-open DULU
  if (!skipMenu && stage) {
    stage.classList.add('modal-open');
  }

  // Hapus tentang-open
  if (stage) stage.classList.remove('tentang-open');

  if (typeof updateButtons === 'function') updateButtons();

  // Balik ke menu (kecuali skipMenu)
  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openModal === 'function') openModal();
    }, 100);
  }
}

// ===== FETCH (fallback) =====
async function fetchTentangData() {
  const body = document.getElementById('tentangBody');
  if (!body) return;

  try {
    const res = await fetch(TENTANG_FILE);
    if (!res.ok) throw new Error('File not found');

    tentangData = await res.text();
    body.innerHTML = formatTentangText(tentangData);
  } catch (err) {
    console.error('❌ Fetch Tentang Kami gagal:', err);
    body.innerHTML = '<div class="tentang-empty">Belum ada konten.</div>';
  }
}

// ===== FORMAT TEKS =====
function formatTentangText(text) {
  if (!text) return '<div class="tentang-empty">Belum ada konten.</div>';

  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${escapeTentang(line.substring(4))}</h3>`;
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${escapeTentang(line.substring(3))}</h2>`;
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h1>${escapeTentang(line.substring(2))}</h1>`;
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${escapeTentang(line.substring(2))}</li>`;
      continue;
    }

    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${escapeTentang(line)}</p>`;
  }

  if (inList) html += '</ul>';
  return html;
}

// ===== ESCAPE =====
function escapeTentang(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
}

// ===== ESC =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('tentangOverlay');
    if (overlay && overlay.classList.contains('open')) {
      closeTentangModal();
    }
  }
});

// ===== EXPOSE =====
window.openTentangModal = openTentangModal;
window.closeTentangModal = closeTentangModal;
window.preloadTentangData = preloadTentangData;

console.log('✅ tentang.js loaded');
