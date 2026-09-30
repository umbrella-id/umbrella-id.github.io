/**
 * api.js — Wrapper Google Apps Script (dengan cache)
 */

const GAS = {
  MAIN:  'https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec',
  READ:  'https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec',
  WRITE: 'https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec'
};

// ===== CACHE UNTUK KONTEN =====
let _contentCache = null;          // data konten
let _contentPromise = null;        // promise fetch (buat hindari double-fetch paralel)

const API = {

  /* ==========================================
     KONTEN (PIPE 1) — dengan cache
     ========================================== */
  async getContent() {
    // 1. Cache udah ada → langsung return
    if (_contentCache) {
      console.log('💾 Konten dari cache');
      return _contentCache;
    }

    // 2. Promise fetch udah ada → tunggu promise yang sama
    //    (cegah double-fetch kalau 2 pemanggil barengan)
    if (_contentPromise) {
      console.log('⏳ Nunggu fetch konten yang sedang jalan...');
      return _contentPromise;
    }

    // 3. Belum ada → fetch
    console.log('📥 Fetch konten dari GAS...');
    _contentPromise = fetch(GAS.MAIN)
      .then(res => res.json())
      .then(data => {
        _contentCache = data;      // simpan cache
        _contentPromise = null;    // clear promise
        console.log('✅ Konten tersimpan di cache');
        return data;
      })
      .catch(err => {
        _contentPromise = null;
        console.error('❌ Gagal fetch konten:', err);
        throw err;
      });

    return _contentPromise;
  },

  // Force refresh cache (kalau butuh data baru)
  async refreshContent() {
    _contentCache = null;
    _contentPromise = null;
    return this.getContent();
  },

  /* ==========================================
     MAIL (PIPE 1)
     ========================================== */
  async sendMail(uid, ign, msg, category) {
    const url = `${GAS.MAIN}?type=mail`
      + `&uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&msg=${encodeURIComponent(msg)}`
      + `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    return res.json();
  },

  /* ==========================================
     CHAT READ + PRESENCE (PIPE 2)
     ========================================== */
  async getChats(uid, ign, isMuted = false, muteExpiry = 0) {
    const url = `${GAS.READ}?uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&isMuted=${isMuted}`
      + `&muteExpiry=${muteExpiry}`;
    const res = await fetch(url);
    return res.json();
  },

  /* ==========================================
     CHAT WRITE (PIPE 3)
     ========================================== */
  async sendChat(uid, ign, msg, type = 'msg') {
    const url = `${GAS.WRITE}?uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&msg=${encodeURIComponent(msg)}`
      + `&type=${encodeURIComponent(type)}`;
    const res = await fetch(url);
    return res.json();
  }
};

window.GAS = GAS;
window.API = API;
console.log('✅ api.js loaded');
