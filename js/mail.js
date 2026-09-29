/**
 * mail.js — Form Kirim Surat
 */

let mailOpen = false;

const KATEGORI_LABEL = {
  'Umum': 'Umum / General',
  'Request Join': 'Request Join',
  'Saran': 'Saran / Masukan'
};

let kategoriTerpilih = 'Umum';

// ===== BUKA FORM =====
function openMailForm() {
  const overlay = document.getElementById('mailOverlay');
  if (!overlay) return;

  // Reset
  kategoriTerpilih = 'Umum';
  updateKategoriLabel();
  document.getElementById('mailPesan').value = '';
  document.getElementById('mailWA').value = '';
  document.getElementById('mailWA').parentElement.classList.remove('visible');
  clearMailMessage();

  mailOpen = true;
  overlay.classList.add('open');
  closeKategoriList();

  // Focus ke textarea
  setTimeout(() => {
    const ta = document.getElementById('mailPesan');
    if (ta) ta.focus();
  }, 300);
}

// ===== TUTUP FORM =====
function closeMailForm() {
  const overlay = document.getElementById('mailOverlay');
  if (!overlay) return;

  mailOpen = false;
  overlay.classList.remove('open');
  closeKategoriList();
  clearMailMessage();
}

// ===== KATEGORI =====
function toggleKategoriList() {
  const list = document.getElementById('mailKategoriList');
  if (!list) return;
  list.classList.toggle('open');
}

function closeKategoriList() {
  const list = document.getElementById('mailKategoriList');
  if (list) list.classList.remove('open');
}

function pilihKategori(val) {
  kategoriTerpilih = val;
  updateKategoriLabel();
  closeKategoriList();

  // Tampilkan / sembunyikan WA
  const waGroup = document.querySelector('.mail-group.wa-group');
  if (waGroup) {
    if (val === 'Request Join') {
      waGroup.classList.add('visible');
    } else {
      waGroup.classList.remove('visible');
    }
  }
}

function updateKategoriLabel() {
  const el = document.getElementById('mailKategoriLabel');
  if (el) el.innerText = KATEGORI_LABEL[kategoriTerpilih] || 'Umum';
}

// ===== PESAN ERROR/SUKSES =====
function showMailMessage(msg, type = 'error') {
  const el = document.getElementById('mailMessage');
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('success');
  if (type === 'success') el.classList.add('success');
  el.classList.add('show');
}

function clearMailMessage() {
  const el = document.getElementById('mailMessage');
  if (!el) return;
  el.innerText = '';
  el.classList.remove('show', 'success');
}

// ===== SANITASI (anti formula injection) =====
function sanitasiMail(text) {
  if (!text) return '';
  // Hapus karakter berbahaya di AWAL
  let cleaned = text.replace(/^[=+\-@<>]+/, '');
  return cleaned;
}

// ===== KIRIM =====
async function kirimMail() {
  const pesanEl = document.getElementById('mailPesan');
  const waEl = document.getElementById('mailWA');
  const pesan = pesanEl ? pesanEl.value.trim() : '';
  const wa = waEl ? waEl.value.trim() : '';

  // Validasi kategori WA
  if (kategoriTerpilih === 'Request Join') {
    if (!wa) {
      showMailMessage('Nomor WhatsApp wajib diisi');
      if (waEl) waEl.focus();
      return;
    }
    if (!/^\d{9,}$/.test(wa)) {
      showMailMessage('Nomor WhatsApp minimal 9 digit angka');
      if (waEl) waEl.focus();
      return;
    }
  }

  // Validasi pesan
  if (!pesan) {
    showMailMessage('Pesan tidak boleh kosong');
    if (pesanEl) pesanEl.focus();
    return;
  }

  if (pesan.length > 1000) {
    showMailMessage('Pesan maksimal 1000 karakter');
    return;
  }

  const uid = window.myUID;
  const ign = window.myIGN;
  if (!uid || !ign) {
    showMailMessage('Identitas belum diisi');
    return;
  }

  // Gabung pesan + WA (kalau ada)
  let finalMsg = sanitasiMail(pesan);
  if (kategoriTerpilih === 'Request Join' && wa) {
    finalMsg = sanitasiMail(wa) + '\n' + finalMsg;
  }

  // Disable tombol
  const btn = document.querySelector('.mail-footer .btn-svg');
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  }

  try {
    const res = await API.sendMail(uid, ign, finalMsg, kategoriTerpilih);
    console.log('✅ Surat terkirim:', res);

    if (res && res.status === 'success') {
      showMailMessage('Surat berhasil dikirim', 'success');

      // Tutup form setelah 800ms
      setTimeout(() => {
        closeMailForm();
        // Balik ke home
        if (typeof goHome === 'function') goHome();
      }, 800);
    } else {
      showMailMessage('Gagal mengirim surat');
      if (btn) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }
  } catch (err) {
    console.error('❌ Gagal kirim surat:', err);
    showMailMessage('Koneksi gagal, coba lagi');
    if (btn) {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
  }
}

// ===== ESC =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mailOpen) {
      closeMailForm();
      if (typeof goHome === 'function') goHome();
    }
  }
});

// ===== CLOSE KATEGORI SAAT KLIK DI LUAR =====
document.addEventListener('click', (e) => {
  const list = document.getElementById('mailKategoriList');
  const btn = document.querySelector('.mail-kategori-btn');
  if (!list || !btn) return;

  if (!list.contains(e.target) && !btn.contains(e.target)) {
    closeKategoriList();
  }
});

// ===== EXPOSE =====
window.openMailForm = openMailForm;
window.closeMailForm = closeMailForm;
window.toggleKategoriList = toggleKategoriList;
window.pilihKategori = pilihKategori;
window.kirimMail = kirimMail;

console.log('✅ mail.js loaded');
