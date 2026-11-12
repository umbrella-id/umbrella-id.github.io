/**
 * api.js — Wrapper Google Apps Script
 */

const GAS = {
  MAIN:  'https://script.google.com/macros/s/AKfycbyv6cBEWlT9JsprJqdRVG2EiqRYrNlyu6uHxH6xuFG9PRXSwkO6aKi8-EHXm99puRQX/exec',
  READ:  'https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec',
  WRITE: 'https://script.google.com/macros/s/AKfycbxe0DmHOend34kDDFxsgdxG0swUoSxFI_J9okcqa8D15GjKhFYbpdFkfm8As8CaYelJ8w/exec',

  CONTENT: 'https://script.google.com/macros/s/AKfycbzlxIQc75KaCjn_05YhbQP3VMzP4W0NqpuJrGk8Vjm0F81NixhQ6RE_g55wMq_vf8cPVw/exec',
  AUTH:    'https://script.google.com/macros/s/AKfycbx4ma7rYWN0UZLS-2yl649qNVxQaIkVxpaZuOhL59yku1ldB2cFrAyaplwDU1M6h_xdCg/exec'
};

let _contentCache = null;
let _contentPromise = null;

const API = {

  async getContent() {
    if (_contentCache) return _contentCache;
    if (_contentPromise) return _contentPromise;
    _contentPromise = fetch(GAS.MAIN)
      .then(res => res.json())
      .then(data => {
        _contentCache = data;
        _contentPromise = null;
        return data;
      })
      .catch(err => {
        _contentPromise = null;
        throw err;
      });
    return _contentPromise;
  },

  async refreshContent() {
    _contentCache = null;
    _contentPromise = null;
    return this.getContent();
  },

  async createGuestSession(userAgent) {
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'createGuestSession', userAgent: userAgent })
    });
    return res.json();
  },

  async validateGuestSession(uid, token) {
    const res = await fetch(GAS.MAIN, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'validateGuestSession', uid: uid, token: token })
    });
    return res.json();
  },

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

  async getChats(uid, ign, isMuted = false, muteExpiry = 0) {
    const token = localStorage.getItem('umbrella_session_token') || '';
    const ua = (navigator.userAgent || 'unknown').substring(0, 100);
    const res = await fetch(GAS.READ, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getChats',
        uid: uid,
        ign: ign,
        isMuted: isMuted,
        muteExpiry: muteExpiry,
        token: token,
        userAgent: ua
      })
    });
    return res.json();
  },

  async sendChat(uid, ign, msg, type = 'msg') {
    const token = localStorage.getItem('umbrella_session_token') || '';
    const ua = (navigator.userAgent || 'unknown').substring(0, 100);
    const res = await fetch(GAS.WRITE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        uid: uid,
        ign: ign,
        msg: msg,
        type: type,
        token: token,
        userAgent: ua
      })
    });
    return res.json();
  }
};

window.GAS = GAS;
window.API = API;
console.log('✅ api.js loaded');
