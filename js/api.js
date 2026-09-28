/**
 * api.js — Wrapper Google Apps Script
 * Semua akses GAS lewat sini.
 */

const GAS = {
  MAIN:  'https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec',
  READ:  'https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec',
  WRITE: 'https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec'
};

const API = {
  // === KONTEN ===
  async getContent() {
    const res = await fetch(GAS.MAIN);
    return res.json();
  },

  // === MAIL ===
  async sendMail(uid, ign, msg, category) {
    const url = `${GAS.MAIN}?type=mail`
      + `&uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&msg=${encodeURIComponent(msg)}`
      + `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    return res.json();
  },

  // === CHAT READ + PRESENCE ===
  async getChats(uid, ign, isMuted = false, muteExpiry = 0) {
    const url = `${GAS.READ}?uid=${encodeURIComponent(uid)}`
      + `&ign=${encodeURIComponent(ign)}`
      + `&isMuted=${isMuted}`
      + `&muteExpiry=${muteExpiry}`;
    const res = await fetch(url);
    return res.json();
  },

  // === CHAT WRITE ===
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
