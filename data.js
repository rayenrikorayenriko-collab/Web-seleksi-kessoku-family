/* =========================================================
   Kessoku Family — data.js
   Data member + foto profil + akun/login (localStorage)
   Dipakai bersama oleh: team.html & admin.html
   ========================================================= */
window.KSF = (function () {
  'use strict';

  const KEY = 'ksf_avatars_v1';
  const LOGO_KEY = 'ksf_logo_v1';
  const ADMINS_KEY = 'ksf_admins_v1';
  const SESSION_KEY = 'ksf_session_v1';
  const GEN_KEY = 'ksf_gens_v1';
  const TAG_KEY = 'ksf_tags_v1';
  const STATS_KEY = 'ksf_stats_cache_v1';
  const CN_KEY = 'ksf_cns_v1';
  const TOTAL_KEY = 'ksf_total_v1';
  const GEN_PHOTO_KEY = 'ksf_gen_photos_v1';
  const CUSTOM_LINKS_KEY = 'ksf_custom_links_v1';
  const CUSTOM_LINK_PHOTO_KEY = 'ksf_custom_link_photos_v1';

  // Data bawaan (dipakai sampai database/API kamu tersambung)
  const DEFAULT_GENS = [
    { id: 'genv1', name: 'GenV1', link: '', members: 166, active: true },
    { id: 'genv2', name: 'GenV2', link: '', members: 210, active: true },
    { id: 'genv3', name: 'GenV3', link: '', members: 0,   active: false }
  ];
  const DEFAULT_TAGS = [
    { tag: '#kessokufamily', count: 128400 },
    { tag: '#kessokuclan',   count: 76500  },
    { tag: '#KSF',           count: 42100  }
  ];

  // Akun owner utama (bawaan)
  const OWNER = { id: 'owner', name: 'RAYENRIKO', username: 'RAYENRIKO', password: 'RAYENRIKO1', role: 'owner' };

  const TEAM_KEY = 'ksf_team_v1';

  // Data team bawaan (bisa diubah/dihapus lewat Setting)
  const DEFAULT_FOUNDERS = [
    { id: 'nino',  name: 'Nino',  role: 'Leader Admin', note: 'Mengatur koordinasi tim dan menjaga komunikasi antaranggota tetap lancar.', tier: 'lead' },
    { id: 'ridhz', name: 'RIDHZ', role: 'Owner',        note: 'Mengembangkan arah Kessoku Family dan membuka ruang kolaborasi untuk para kreator.', tier: 'owner' },
    { id: 'zell',  name: 'Zell',  role: 'Co-owner',     note: 'Mendampingi pengelolaan komunitas dan membantu setiap program berjalan konsisten.', tier: 'lead' }
  ];

  const DEFAULT_MEMBERS = [
    { id: 'zenn',   name: 'Zenn',   role: 'Sesepuh ML' },
    { id: 'xyzoo',  name: 'Xyzoo',  role: 'Admin Website' },
    { id: 'reyy',   name: 'Reyy',   role: 'Admin Bot' },
    { id: 'nazz',   name: 'Nazz',   role: 'Admin Meme' },
    { id: 'karumi', name: 'Karumi', role: 'Admin Collab' },
    { id: 'men',    name: 'Men',    role: 'Leader Admin' },
    { id: 'shin',   name: 'Shin',   role: 'Seleksi' },
    { id: 'nuna',   name: 'Nuna',   role: 'Live' },
    { id: 'knox',   name: 'Knox',   role: 'Meme' },
    { id: 'nino2',  name: 'Nino',   role: 'Leader Admin' },
    { id: 'keichi', name: 'Keichi', role: 'Seleksi' },
    { id: 'jelz',   name: 'Jelz',   role: 'Live' }
  ];

  const cloneFounders = () => DEFAULT_FOUNDERS.map(f => Object.assign({}, f));
  const cloneMembers = () => DEFAULT_MEMBERS.map(m => Object.assign({}, m));

  function getTeam() {
    let raw = null;
    try { raw = localStorage.getItem(TEAM_KEY); } catch (e) { /* abaikan */ }
    if (raw !== null) {
      try {
        const v = JSON.parse(raw);
        if (v && typeof v === 'object') {
          const noteUpdates = {
            'Leader Admin Kessoku Family.': 'Mengatur koordinasi tim dan menjaga komunikasi antaranggota tetap lancar.',
            'Pemegang kekuasaan tertinggi Kessoku Family.': 'Mengembangkan arah Kessoku Family dan membuka ruang kolaborasi untuk para kreator.',
            'Co-owner Kessoku Family.': 'Mendampingi pengelolaan komunitas dan membantu setiap program berjalan konsisten.'
          };
          return {
            founders: Array.isArray(v.founders)
              ? v.founders.map(f => Object.assign({}, f, { note: noteUpdates[f.note] || f.note }))
              : cloneFounders(),
            members: Array.isArray(v.members) ? v.members : cloneMembers()
          };
        }
      } catch (e) { /* abaikan */ }
    }
    return { founders: cloneFounders(), members: cloneMembers() };
  }
  function saveTeam(t) { try { localStorage.setItem(TEAM_KEY, JSON.stringify(t)); } catch (e) { /* abaikan */ } }
  function getFounders() { return getTeam().founders; }
  function getMembers() { return getTeam().members; }
  function all() { const t = getTeam(); return t.founders.concat(t.members); }

  // ---- Manajemen Team (tambah / hapus / ubah keterangan) ----
  function addTeamMember(item) {
    const t = getTeam();
    const group = item.group === 'founders' ? 'founders' : 'members';
    const base = {
      id: item.id || ('tm_' + Date.now().toString(36)),
      name: String(item.name || '').trim(),
      role: String(item.role || '').trim() || 'Admin'
    };
    if (group === 'founders') {
      t.founders.push(Object.assign({
        tier: item.tier || 'lead',
        note: item.note || 'Mendorong kolaborasi dan pengembangan karya di Kessoku Family.'
      }, base));
    } else {
      t.members.push(base);
    }
    saveTeam(t); return t;
  }
  function removeTeamMember(id) {
    const t = getTeam();
    t.founders = t.founders.filter(x => x.id !== id);
    t.members = t.members.filter(x => x.id !== id);
    saveTeam(t); return t;
  }
  function updateTeamMember(id, patch) {
    const t = getTeam();
    const apply = (x) => x.id === id ? Object.assign({}, x, patch) : x;
    t.founders = t.founders.map(apply);
    t.members = t.members.map(apply);
    saveTeam(t); return t;
  }
  function resetTeam() { try { localStorage.removeItem(TEAM_KEY); } catch (e) { /* abaikan */ } return getTeam(); }

  function getPhotos() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function photoOf(id) { return getPhotos()[id] || ''; }
  function setPhoto(id, dataUrl) {
    const p = getPhotos(); p[id] = dataUrl;
    localStorage.setItem(KEY, JSON.stringify(p));
  }
  function removePhoto(id) {
    const p = getPhotos(); delete p[id];
    localStorage.setItem(KEY, JSON.stringify(p));
  }

  // Logo brand marga
  function logo() { return localStorage.getItem(LOGO_KEY) || ''; }
  function setLogo(dataUrl) { localStorage.setItem(LOGO_KEY, dataUrl); }
  function removeLogo() { localStorage.removeItem(LOGO_KEY); }

  // ---- Generasi (angkatan) ----
  function getGenerations() {
    try {
      const l = JSON.parse(localStorage.getItem(GEN_KEY));
      return Array.isArray(l) ? l : DEFAULT_GENS.slice();
    } catch (e) { return DEFAULT_GENS.slice(); }
  }
  function saveGenerations(list) { localStorage.setItem(GEN_KEY, JSON.stringify(list)); }
  function addGeneration(g) { const l = getGenerations(); l.push(g); saveGenerations(l); return l; }
  function updateGeneration(id, patch) {
    const l = getGenerations().map(x => x.id === id ? Object.assign({}, x, patch) : x);
    saveGenerations(l); return l;
  }
  function removeGeneration(id) {
    const l = getGenerations().filter(x => x.id !== id);
    saveGenerations(l); return l;
  }

  // Foto gen disimpan lokal pada browser yang mengelola halaman.
  function getGenPhotos() {
    try { return JSON.parse(localStorage.getItem(GEN_PHOTO_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function genPhoto(id) { return getGenPhotos()[id] || ''; }
  function setGenPhoto(id, dataUrl) {
    const photos = getGenPhotos(); photos[id] = dataUrl;
    localStorage.setItem(GEN_PHOTO_KEY, JSON.stringify(photos));
  }
  function removeGenPhoto(id) {
    const photos = getGenPhotos(); delete photos[id];
    localStorage.setItem(GEN_PHOTO_KEY, JSON.stringify(photos));
  }
  function getCustomLinkPhotos() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_LINK_PHOTO_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function customLinkPhoto(id) { return getCustomLinkPhotos()[id] || ''; }
  function setCustomLinkPhoto(id, dataUrl) {
    const photos = getCustomLinkPhotos(); photos[id] = dataUrl;
    localStorage.setItem(CUSTOM_LINK_PHOTO_KEY, JSON.stringify(photos));
  }
  function removeCustomLinkPhoto(id) {
    const photos = getCustomLinkPhotos(); delete photos[id];
    localStorage.setItem(CUSTOM_LINK_PHOTO_KEY, JSON.stringify(photos));
  }

  // Bar tautan komunitas yang dapat diberi foto dan tujuan URL.
  function getCustomLinks() {
    try {
      const links = JSON.parse(localStorage.getItem(CUSTOM_LINKS_KEY));
      return Array.isArray(links) ? links : [];
    } catch (e) { return []; }
  }
  function saveCustomLinks(links) { localStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(links)); }
  function addCustomLink(link) {
    const links = getCustomLinks();
    links.push({
      id: link.id || ('link_' + Date.now().toString(36)),
      title: String(link.title || '').trim(),
      url: String(link.url || '').trim()
    });
    saveCustomLinks(links); return links;
  }
  function updateCustomLink(id, patch) {
    const links = getCustomLinks().map(x => x.id === id ? Object.assign({}, x, patch) : x);
    saveCustomLinks(links); return links;
  }
  function removeCustomLink(id) {
    const links = getCustomLinks().filter(x => x.id !== id);
    saveCustomLinks(links);
    removeCustomLinkPhoto(id);
    return links;
  }

  async function pushSetting(key, value) {
    if (!apiConfigured() || !isSupabase()) return null;
    const r = await fetch(window.KSF_CONFIG.base() + '/app_settings', {
      method: 'POST',
      headers: Object.assign(apiHeaders(true), { Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ key, value })
    });
    if (!r.ok) throw new Error('http ' + r.status);
    try { return await r.json(); } catch (e) { return null; }
  }

  // ---- Hashtag TikTok ----
  function getHashtags() {
    try {
      const l = JSON.parse(localStorage.getItem(TAG_KEY));
      return Array.isArray(l) ? l : DEFAULT_TAGS.slice();
    } catch (e) { return DEFAULT_TAGS.slice(); }
  }
  function saveHashtags(list) { localStorage.setItem(TAG_KEY, JSON.stringify(list)); }
  function addHashtag(tag) {
    tag = (tag || '').trim();
    if (!tag) return getHashtags();
    if (tag.charAt(0) !== '#') tag = '#' + tag;
    const l = getHashtags();
    if (!l.some(x => String(x.tag).toLowerCase() === tag.toLowerCase())) l.push({ tag: tag, count: 0 });
    saveHashtags(l); return l;
  }
  function removeHashtag(tag) {
    const l = getHashtags().filter(x => String(x.tag).toLowerCase() !== String(tag).toLowerCase());
    saveHashtags(l); return l;
  }
  // Perbarui manual (mis. jumlah pemakaian) tanpa menghapus hashtag
  function updateHashtag(tag, patch) {
    const l = getHashtags().map(x => String(x.tag).toLowerCase() === String(tag).toLowerCase()
      ? Object.assign({}, x, patch) : x);
    saveHashtags(l); return l;
  }

  // ---- Total member (manual / otomatis) ----
  // Jika diisi manual lewat setting, angka ini yang dipakai.
  // Kalau kosong, total = jumlah member dari gen yang aktif.
  function getTotalOverride() {
    const v = localStorage.getItem(TOTAL_KEY);
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function setTotalOverride(n) { localStorage.setItem(TOTAL_KEY, String(Number(n) || 0)); }
  function clearTotalOverride() { localStorage.removeItem(TOTAL_KEY); }

  function totalMembers() {
    const ov = getTotalOverride();
    if (ov != null) return ov;
    return getGenerations()
      .filter(g => g.active)
      .reduce((s, g) => s + (Number(g.members) || 0), 0);
  }

  // Snapshot statistik (untuk render pertama, sinkron/offline)
  function localStats() {
    const gens = getGenerations();
    const tags = getHashtags();
    // Mode lokal: manual (override) > jumlah gen aktif.
    // Mode API: angka total dari server (cache) yang menang.
    let total = totalMembers();
    if (apiConfigured()) {
      try {
        const c = JSON.parse(localStorage.getItem(STATS_KEY));
        if (c && typeof c.totalMembers === 'number') total = c.totalMembers;
      } catch (e) { /* abaikan */ }
    }
    return { generations: gens, hashtags: tags, totalMembers: total, demo: !apiConfigured() };
  }

  // ---- Integrasi API (Supabase / API buatan sendiri) ----
  function apiConfigured() {
    return !!(window.KSF_CONFIG && window.KSF_CONFIG.base());
  }
  function apiKey() {
    return (window.KSF_CONFIG && window.KSF_CONFIG.key) ? window.KSF_CONFIG.key() : '';
  }
  // Deteksi apakah base url menuju Supabase (PostgREST)
  function isSupabase() {
    const b = (window.KSF_CONFIG && window.KSF_CONFIG.base()) || '';
    return /supabase\.(co|in)/i.test(b);
  }
  function apiHeaders(json) {
    const h = { Accept: 'application/json' };
    if (json) h['Content-Type'] = 'application/json';
    const k = apiKey();
    if (k) { h['apikey'] = k; h['Authorization'] = 'Bearer ' + k; }
    return h;
  }
  // Ubah path gaya REST -> endpoint PostgREST Supabase
  //   /generations/{id}  -> PATCH/DELETE /generations?id=eq.{id}
  //   /hashtags/{tag}    -> PATCH/DELETE /hashtags?tag=eq.{tag}
  //   /join              -> POST /registrations
  function sbEndpoint(method, path) {
    const parts = String(path).replace(/^\/+/, '').split('/');
    let table = parts[0];
    const id = parts[1] ? decodeURIComponent(parts[1]) : '';
    if (table === 'join') table = 'registrations';
    let m = method, q = '';
    if (id) {
      const col = (table === 'hashtags') ? 'tag' : 'id';
      q = '?' + col + '=eq.' + encodeURIComponent(id);
      if (m === 'PUT') m = 'PATCH';
    }
    return { method: m, table, url: '/' + table + q };
  }
  function sbBody(table, body) {
    if (!body) return body;
    if (table === 'registrations') {
      const b = Object.assign({}, body);
      const at = b.joinedAt; delete b.joinedAt;
      b.joined_at = new Date(Number(at) || Date.now()).toISOString();
      if (b.cns && !Array.isArray(b.cns)) b.cns = [b.cns];
      return b;
    }
    return body;
  }
  async function apiGet(path) {
    if (!apiConfigured()) throw new Error('no-api');
    const r = await fetch(window.KSF_CONFIG.base() + path, { headers: apiHeaders() });
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  async function apiSend(method, path, body) {
    if (!apiConfigured()) throw new Error('no-api');
    let url = window.KSF_CONFIG.base() + path;
    let m = method;
    let payload = body;
    const headers = apiHeaders(true);
    if (isSupabase()) {
      const ep = sbEndpoint(method, path);
      m = ep.method;
      url = window.KSF_CONFIG.base() + ep.url;
      payload = sbBody(ep.table, body);
      headers['Prefer'] = 'return=representation';
    }
    const r = await fetch(url, {
      method: m,
      headers: headers,
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!r.ok) throw new Error('http ' + r.status);
    if (r.status === 204) return null;
    try { return await r.json(); } catch (e) { return null; }
  }
  // Simpan total member manual ke Supabase (tabel app_settings)
  async function pushTotal(n) {
    if (!apiConfigured() || !isSupabase()) return null;
    const r = await fetch(window.KSF_CONFIG.base() + '/app_settings', {
      method: 'POST',
      headers: Object.assign(apiHeaders(true), { Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ key: 'total_members', value: Number(n) || 0 })
    });
    if (!r.ok) throw new Error('http ' + r.status);
    try { return await r.json(); } catch (e) { return null; }
  }
  // Hapus total manual -> kembali menghitung dari jumlah gen aktif
  async function clearRemoteTotal() {
    if (!apiConfigured() || !isSupabase()) return null;
    const r = await fetch(window.KSF_CONFIG.base() + '/app_settings?key=eq.total_members', {
      method: 'DELETE',
      headers: Object.assign(apiHeaders(), { Prefer: 'return=representation' })
    });
    if (!r.ok) throw new Error('http ' + r.status);
    return null;
  }
  // Tarik data terbaru dari API lalu simpan ke cache lokal
  async function refreshStats() {
    if (isSupabase()) {
      const gens = await apiGet('/generations?select=*&order=name.asc');
      const tags = await apiGet('/hashtags?select=*&order=tag.asc');
      const generations = Array.isArray(gens) ? gens.map(g => ({
        id: g.id, name: g.name, link: g.link || '', members: Number(g.members) || 0, active: !!g.active
      })) : [];
      const hashtags = Array.isArray(tags)
        ? tags.map(t => ({ tag: t.tag, count: Number(t.count) || 0 })) : [];
      saveGenerations(generations);
      saveHashtags(hashtags);
      let total = generations.filter(g => g.active).reduce((s, g) => s + g.members, 0);
      try {
        const rows = await apiGet('/app_settings?select=key,value');
        (Array.isArray(rows) ? rows : []).forEach(row => {
          if (row.key === 'total_members' && row.value != null && Number.isFinite(Number(row.value))) {
            total = Number(row.value);
          } else if (row.key === 'generation_photos' && row.value && typeof row.value === 'object') {
            localStorage.setItem(GEN_PHOTO_KEY, JSON.stringify(row.value));
          } else if (row.key === 'custom_links' && Array.isArray(row.value)) {
            localStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(row.value));
          } else if (row.key === 'custom_link_photos' && row.value && typeof row.value === 'object') {
            localStorage.setItem(CUSTOM_LINK_PHOTO_KEY, JSON.stringify(row.value));
          } else if (row.key === 'team_data' && row.value && typeof row.value === 'object') {
            localStorage.setItem(TEAM_KEY, JSON.stringify(row.value));
          } else if (row.key === 'team_photos' && row.value && typeof row.value === 'object') {
            localStorage.setItem(KEY, JSON.stringify(row.value));
          }
        });
      } catch (e) { /* pengaturan tambahan bersifat opsional */ }
      localStorage.setItem(STATS_KEY, JSON.stringify({ totalMembers: total, at: Date.now() }));
      return { generations, hashtags, totalMembers: total };
    }
    const data = await apiGet('/stats');
    if (Array.isArray(data.generations)) saveGenerations(data.generations);
    if (Array.isArray(data.hashtags)) saveHashtags(data.hashtags);
    if (typeof data.totalMembers === 'number') {
      localStorage.setItem(STATS_KEY, JSON.stringify({ totalMembers: data.totalMembers, at: Date.now() }));
    }
    return data;
  }

  // ---- Manajemen CN (bar CN di halaman daftar) ----
  // Kata kunci `name` pada template akan diganti nama pendaftar secara otomatis.
  const DEFAULT_CNS = [
    { id: 'cn1', tpl: '{{name}} | KSF' },
    { id: 'cn2', tpl: '{{name}} 〆 KSF' },
    { id: 'cn3', tpl: 'KSF • {{name}}' }
  ];
  function getCNs() {
    const raw = localStorage.getItem(CN_KEY);
    if (raw === null) return DEFAULT_CNS.map(c => ({ ...c }));
    try {
      const v = JSON.parse(raw);
      if (!Array.isArray(v)) return DEFAULT_CNS.map(c => ({ ...c }));
      const legacy = {
        'name 𝖋𝖙`𝙆𝙎𝙁᭄': DEFAULT_CNS[0].tpl,
        'name〆`𝙆𝙎𝙁': DEFAULT_CNS[1].tpl,
        'ケ-name': DEFAULT_CNS[2].tpl
      };
      return v.map(c => Object.assign({}, c, { tpl: legacy[c.tpl] || c.tpl }));
    }
    catch (e) { return DEFAULT_CNS.map(c => ({ ...c })); }
  }
  function saveCNs(list) { localStorage.setItem(CN_KEY, JSON.stringify(list)); }
  function addCN(tpl) {
    const l = getCNs();
    const item = { id: 'cn_' + Date.now().toString(36), tpl: String(tpl || '').trim() };
    l.push(item); saveCNs(l); return l;
  }
  function removeCN(id) { const l = getCNs().filter(x => x.id !== id); saveCNs(l); return l; }

  // ---- Manajemen akun admin ----
  function getAdmins() {
    try { return JSON.parse(localStorage.getItem(ADMINS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveAdmins(list) { localStorage.setItem(ADMINS_KEY, JSON.stringify(list)); }
  function addAdmin(a) { const l = getAdmins(); l.push(a); saveAdmins(l); return l; }
  function removeAdmin(id) { const l = getAdmins().filter(x => x.id !== id); saveAdmins(l); return l; }
  function accounts() { return [OWNER].concat(getAdmins()); }

  // ---- Sesi / login ----
  function currentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }
  function login(username, password) {
    const u = (username || '').trim().toLowerCase();
    const acc = accounts().find(a => a.username.toLowerCase() === u && a.password === password);
    if (!acc) return null;
    const session = { id: acc.id, name: acc.name, username: acc.username, role: acc.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  function logout() { sessionStorage.removeItem(SESSION_KEY); }
  function isOwner() { const u = currentUser(); return !!u && u.role === 'owner'; }

  // Avatar: pakai foto bila ada, kalau tidak tampilkan inisial nama
  function avatarHTML(item, cls) {
    const src = photoOf(item.id);
    const initial = (item.name || '?').trim().charAt(0).toUpperCase();
    return `<div class="avatar ${cls || ''} ${src ? 'has-photo' : ''}" data-initial="${initial}">
      ${src ? `<img class="avatar__img" src="${src}" alt="Foto ${item.name}">` : ''}
    </div>`;
  }

  return {
    getTeam, getFounders, getMembers, all,
    addTeamMember, removeTeamMember, updateTeamMember, resetTeam,
    getPhotos, photoOf, setPhoto, removePhoto, avatarHTML,
    logo, setLogo, removeLogo,
    getGenerations, addGeneration, updateGeneration, removeGeneration,
    getGenPhotos, genPhoto, setGenPhoto, removeGenPhoto,
    getCustomLinkPhotos, customLinkPhoto, setCustomLinkPhoto, removeCustomLinkPhoto,
    getCustomLinks, addCustomLink, updateCustomLink, removeCustomLink,
    getHashtags, addHashtag, removeHashtag, updateHashtag,
    getCNs, addCN, removeCN, DEFAULT_CNS,
    totalMembers, localStats, getTotalOverride, setTotalOverride, clearTotalOverride,
    apiConfigured, apiGet, apiSend, refreshStats, isSupabase, pushTotal, clearRemoteTotal, pushSetting,
    getAdmins, addAdmin, removeAdmin, accounts, login, logout, currentUser, isOwner, OWNER,
    KEY, LOGO_KEY, ADMINS_KEY, SESSION_KEY, GEN_KEY, TAG_KEY, STATS_KEY, CN_KEY, TOTAL_KEY, TEAM_KEY,
    GEN_PHOTO_KEY, CUSTOM_LINKS_KEY, CUSTOM_LINK_PHOTO_KEY
  };
})();
