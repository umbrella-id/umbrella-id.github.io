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
function openMailForm(kategoriAwal = 'Umum') {
  const overlay = document.getElementById('mailOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  kategoriTerpilih = kategoriAwal;
  updateKategoriLabel();

  document.getElementById('mailPesan').value = '';
  document.getElementById('mailWA').value = '';
  document.getElementById('mailWA').parentElement.classList.remove('visible');
  clearMailMessage();

  mailOpen = true;
  overlay.classList.add('open');

  if (stage) stage.classList.add('mail-open');
  closeKategoriList();

  const waGroup = document.querySelector('.mail-group.wa-group');
  if (waGroup) {
    if (kategoriAwal === 'Request Join') {
      waGroup.classList.add('visible');
    } else {
      waGroup.classList.remove('visible');
    }
  }

  if (typeof updateButtons === 'function') updateButtons();

  setTimeout(() => {
    const ta = document.getElementById('mailPesan');
    if (ta) ta.focus();
  }, 300);
}

// ===== TUTUP FORM =====
function closeMailForm(skipMenu = false) {
  const overlay = document.getElementById('mailOverlay');
  const stage = document.getElementById('stage');
  if (!overlay) return;

  mailOpen = false;
  overlay.classList.remove('open');

  // 🎯 Kalau mau balik ke menu → tambah modal-open DULU
  if (!skipMenu && stage) {
    stage.classList.add('modal-open');
  }

  // Hapus mail-open
  if (stage) stage.classList.remove('mail-open');

  closeKategoriList();
  clearMailMessage();

  if (typeof updateButtons === 'function') updateButtons();

  if (!skipMenu) {
    setTimeout(() => {
      if (typeof openModal === 'function') openModal();
    }, 100);
  }
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

// ===== PESAN =====
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

// ===== SANITASI =====
function sanitasiMail(text) {
  if (!text) return '';
  let cleaned = text.replace(/^[=+\-@<>]+/, '');
  return cleaned;
}

// ===== KIRIM =====
async function kirimMail() {
  const pesanEl = document.getElementById('mailPesan');
  const waEl = document.getElementById('mailWA');
  const pesan = pesanEl ? pesanEl.value.trim() : '';
  const wa = waEl ? waEl.value.trim() : '';

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

  let finalMsg = sanitasiMail(pesan);
  if (kategoriTerpilih === 'Request Join' && wa) {
    finalMsg = sanitasiMail(wa) + '\n' + finalMsg;
  }

  const btn = document.querySelector('.mail-footer .btn-svg');
  if (btn) {
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
  }

  try {
    const res = await API.sendMail(uid, ign, finalMsg, kategoriTerpilih);
    console.log('✅ Surat terkirim:', res);

    if (res && res.status === 'success') {
      showMailMessage('Surat berhasil dikirim', 'success');

      setTimeout(() => {
        window._mailFromInfo = false;   // reset flag
        closeMailForm(true);
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
