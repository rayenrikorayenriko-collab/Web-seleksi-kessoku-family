/* =========================================================
   Kessoku Family — config.js
   Konfigurasi koneksi ke database (Supabase) / API milikmu.
   ---------------------------------------------------------
   CARA PAKAI DENGAN SUPABASE:
   1) Isi DUA baris di bawah ini (DEFAULT_BASE & DEFAULT_KEY),
      supaya SEMUA pengunjung otomatis tersambung (bukan cuma
      browser kamu). Kamu bisa ambil dari dashboard Supabase →
      Settings → API.
   2) Atau biarkan kosong dan isi lewat halaman Setting
      (khusus owner; tersimpan di browser itu saja).

   DEFAULT_BASE contoh: https://abcdefgh.supabase.co/rest/v1
   DEFAULT_KEY  : anon public key (aman dipublikasikan)

   Format lama (API buatan sendiri) tetap didukung:
   GET {base}/stats -> { totalMembers, generations[], hashtags[] }
   ========================================================= */
window.KSF_CONFIG = (function () {
  'use strict';

  // ==== ISI DI SINI (opsional) ====
  const DEFAULT_BASE = ''; // mis. https://abcdefgh.supabase.co/rest/v1
  const DEFAULT_KEY  = ''; // mis. eyJhbGciOi... (anon public key)
  // ================================

  const API_KEY = 'ksf_api_base_v1';   // penyimpanan base url (localStorage)
  const KEY_NAME = 'ksf_api_key_v1';   // penyimpanan anon key (localStorage)
  const REFRESH_KEY = 'ksf_refresh_ms_v1';
  const DEFAULT_REFRESH = 15000; // 15 detik

  function base() {
    const v = (localStorage.getItem(API_KEY) || '').trim();
    return (v || DEFAULT_BASE).replace(/\/+$/, '');
  }
  function setBase(url) {
    localStorage.setItem(API_KEY, (url || '').trim().replace(/\/+$/, ''));
  }
  function key() {
    return (localStorage.getItem(KEY_NAME) || DEFAULT_KEY || '').trim();
  }
  function setKey(k) {
    localStorage.setItem(KEY_NAME, (k || '').trim());
  }
  function refreshMs() {
    const v = parseInt(localStorage.getItem(REFRESH_KEY), 10);
    return (v && v >= 3000) ? v : DEFAULT_REFRESH;
  }
  function setRefreshMs(ms) {
    const v = parseInt(ms, 10);
    localStorage.setItem(REFRESH_KEY, String(v && v >= 3000 ? v : DEFAULT_REFRESH));
  }

  return { base, setBase, key, setKey, refreshMs, setRefreshMs, DEFAULT_REFRESH, API_KEY, KEY_NAME, REFRESH_KEY };
})();
