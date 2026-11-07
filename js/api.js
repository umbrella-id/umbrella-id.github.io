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
    const token = localStorage.getItem('umbrella_session_token') || '';
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sendMail', uid, ign, msg, category, token })
    });
    return res.json();
  },
  
  async getMailList(uid, token) {
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getMailList', uid, token })
    });
    return res.json();
  },
  
  async getMailHistory(uid, token) {
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getMailHistory', uid, token })
    });
    return res.json();
  },
  
  async checkAccountStatus(uid) {
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'checkAccountStatus', uid })
    });
    return res.json();
  },
  
  async sendChat(uid, ign, msg, type = 'msg') {
    const token = localStorage.getItem('umbrella_session_token') || '';
    const ua = (navigator.userAgent || 'unknown').substring(0, 100);   // ← BARU
    const url = `${GAS.WRITE}?uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&msg=${encodeURIComponent(msg)}`
      + `&type=${encodeURIComponent(type)}`
      + `&token=${encodeURIComponent(token)}`
      + `&userAgent=${encodeURIComponent(ua)}`;                          // ← BARU
    const res = await fetch(url);
    return res.json();
  }
};

window.GAS = GAS;
window.API = API;
console.log('✅ api.js loaded');
