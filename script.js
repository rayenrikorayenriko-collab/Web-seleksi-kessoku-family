/* =========================================================
   Kessoku Family — script.js
   Navigasi, micro-interactions, render team & panel admin
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KSF = window.KSF || {};

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  function showToast(title, msg) {
    if (!toast) return;
    if (title) toast.querySelector('.toast__body b').textContent = title;
    if (msg) toast.querySelector('.toast__body span').textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('is-show'), 4000);
  }

  /* ---------- Util: format angka, escape, animasi angka ---------- */
  function fmt(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  // Ubah huruf/angka jadi "bold" unicode (Mathematical Sans-Serif Bold Italic)
  function toBold(str) {
    const UP = 0x1D63C, LO = 0x1D656, DG = 0x1D7EC;
    return String(str == null ? '' : str).replace(/[A-Za-z0-9]/g, (ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(UP + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(LO + c - 97);
      return String.fromCodePoint(DG + c - 48);
    });
  }
  function animateNum(el, to) {
    if (!el) return;
    to = Number(to) || 0;
    const from = Number(String(el.textContent).replace(/[^\d.-]/g, '')) || 0;
    if (reduced || from === to) { el.textContent = fmt(to); return; }
    const dur = 900, t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Logo brand (bisa diganti) ---------- */
  function applyLogo() {
    const src = KSF.logo ? KSF.logo() : '';
    $$('[data-logo]').forEach(el => {
      if (src) {
        el.classList.add('has-logo');
        el.innerHTML = `<img class="logo-img" src="${src}" alt="Logo Kessoku Family">`;
      } else {
        el.classList.remove('has-logo');
        el.textContent = el.dataset.fallback || 'KF';
      }
    });
  }

  /* ---------- Kompres gambar ---------- */
  function readImage(file, max, done) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(max / img.width, max / img.height, 1);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        done(cv.toDataURL('image/jpeg', 0.88));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Topbar / dock ---------- */
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');

  function onScroll() {
    const y = window.scrollY;
    if (toTop) toTop.classList.toggle('is-show', y > 560);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* Dock liquid glass: geser pill lalu pindah halaman (reload) */
  const dock = $('#dock');
  if (dock) {
    $$('.dock__item', dock).forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.classList.contains('is-active')) return;
        dock.style.setProperty('--i', item.dataset.i);
        setTimeout(() => { window.location.href = item.getAttribute('href'); }, 340);
      });
    });
  }

  /* ---------- Smooth scroll (data-scroll) ---------- */
  $$('[data-scroll]').forEach(a => {
    a.addEventListener('click', (e) => {
      const t = a.getAttribute('href') && $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });

  /* ---------- Ripple ---------- */
  $$('.btn, .icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (reduced) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(s);
      setTimeout(() => s.remove(), 620);
    });
  });

  /* ---------- Tilt + glow kursor ---------- */
  if (!reduced) {
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
    document.addEventListener('mousemove', (e) => {
      const m = e.target.closest('.mcard, .acard');
      if (!m) return;
      const r = m.getBoundingClientRect();
      m.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      m.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Counter ---------- */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = target + suffix; return; }
      const dur = 1500, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- Marquee hashtag (cuma 3) ---------- */
  const track = $('#marqueeTrack');
  if (track) {
    const tags = ['#kessokufamily', '#kessokuclan', '#ksf'];
    const group = tags.map(t => `<span>${t}</span><span class="sep">✦</span>`).join('');
    const content = group.repeat(5);
    track.innerHTML = content + content;
  }

  /* ---------- Home: statistik komunitas (real-time) ---------- */
  const statSection = $('#statistik');
  if (statSection && KSF.localStats) {
    const tagStats = $('#tagStats');
    const genStats = $('#genStats');
    const statFoot = $('#statFoot');
    const liveBadge = $('#liveBadge');
    let lastSig = '';

    function renderStats() {
      const s = KSF.localStats();
      $$('[data-stat="members"]').forEach(el => animateNum(el, s.totalMembers));
      $$('[data-stat="gens"]').forEach(el => animateNum(el, s.generations.length));
      $$('[data-stat="tags"]').forEach(el => animateNum(el, s.hashtags.length));

      const sig = JSON.stringify(s);
      const changed = sig !== lastSig;
      lastSig = sig;
      if (!changed) return;

      if (tagStats) {
        const max = Math.max(1, ...s.hashtags.map(t => Number(t.count) || 0));
        tagStats.innerHTML = s.hashtags.map((t, i) => `
          <article class="tagstat" style="--d:${i % 6}">
            <span class="tagstat__tag">${esc(t.tag)}</span>
            <b class="tagstat__num">0</b>
            <span class="tagstat__lbl">post di TikTok</span>
            <span class="tagstat__bar"><i style="width:${Math.round((Number(t.count) || 0) / max * 100)}%"></i></span>
          </article>`).join('');
        $$('.tagstat__num', tagStats).forEach((el, i) => animateNum(el, Number(s.hashtags[i].count) || 0));
      }

      if (genStats) {
        const max = Math.max(1, ...s.generations.map(g => Number(g.members) || 0));
        genStats.innerHTML = s.generations.map((g, i) => `
          <div class="genrow${g.active ? '' : ' is-off'}" style="--d:${i % 6}">
            <div class="genrow__top">
              <b>${esc(g.name)}</b>
              <span>${g.active ? fmt(g.members) + ' member' : 'nonaktif'}</span>
            </div>
            <span class="genrow__bar"><i style="width:${g.active ? Math.round((Number(g.members) || 0) / max * 100) : 0}%"></i></span>
            ${g.link ? `<a class="genrow__link" href="${esc(g.link)}" target="_blank" rel="noopener">Buka link grup →</a>` : ''}
          </div>`).join('');
      }

      const heroGens = $('#heroGens');
      if (heroGens) heroGens.innerHTML = s.generations.slice(0, 3).map(g => `
        <div><b>${g.active ? fmt(g.members) : 'Off'}</b><span>${esc(g.name)}</span></div>`).join('');
      const bentoGens = $('#bentoGens');
      if (bentoGens) bentoGens.innerHTML = s.generations.slice(0, 3).map(g => `
        <div class="gen"><b>${esc(g.name)}</b><span>${g.active ? fmt(g.members) + ' Member' : 'Nonaktif'}</span></div>`).join('');

      if (statFoot) statFoot.textContent = s.demo
        ? 'Mode demo: angka disimpan lokal di browser. Hubungkan API di halaman Admin untuk data real-time.'
        : 'Data real-time dari API · terakhir diperbarui ' + new Date().toLocaleTimeString('id-ID');
    }

    renderStats();
    if (liveBadge) liveBadge.hidden = !(KSF.apiConfigured && KSF.apiConfigured());

    // Real-time: perubahan gen/hashtag/total di tab lain langsung tampil di sini
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (e.key === KSF.GEN_KEY || e.key === KSF.TAG_KEY || e.key === KSF.STATS_KEY || e.key === KSF.TOTAL_KEY) renderStats();
      if (e.key === KSF.LOGO_KEY) applyLogo();
    });

    const statsMs = Math.max(3000, (window.KSF_CONFIG ? KSF_CONFIG.refreshMs() : 15000));
    const statsTick = () => {
      if (KSF.apiConfigured && KSF.apiConfigured()) {
        KSF.refreshStats().then(renderStats).catch(() => {});
      } else {
        renderStats();
      }
    };
    setInterval(statsTick, statsMs);
  }

  /* ---------- Render: Team page ---------- */
  const foundersWrap = $('#founders');
  if (foundersWrap && KSF.founders) {
    foundersWrap.innerHTML = KSF.founders.map((f, i) => `
      <article class="profile ${f.tier === 'owner' ? 'profile--owner' : ''} reveal" style="--d:${i}">
        ${f.tier === 'owner' ? '<span class="profile__badge">Owner</span>' : ''}
        ${KSF.avatarHTML(f, f.tier === 'owner' ? 'avatar--owner' : '')}
        <span class="person__role">${f.role}</span>
        <h3>${f.name}</h3>
        <p>${f.note}</p>
      </article>`).join('');
  }

  const teamGrid = $('#teamGrid');
  if (teamGrid && KSF.members) {
    teamGrid.innerHTML = KSF.members.map((m, i) => `
      <article class="mcard reveal" style="--d:${i % 6}">
        ${KSF.avatarHTML(m)}
        <b>${m.name}</b>
        <span>${m.role}</span>
      </article>`).join('');
  }

  /* ---------- Render: Admin page ---------- */
  const adminGrid = $('#adminGrid');
  if (adminGrid && KSF.all) {
    adminGrid.innerHTML = KSF.all().map((m, i) => {
      const has = !!KSF.photoOf(m.id);
      return `
      <article class="acard reveal" style="--d:${i % 6}" data-id="${m.id}">
        <div class="avatar-holder">${KSF.avatarHTML(m)}</div>
        <div class="acard__info">
          <b>${m.name}</b>
          <span>${m.role}</span>
          ${has ? '<span class="saved">✓ Foto kustom aktif</span>' : ''}
        </div>
        <div class="acard__actions">
          <button class="icon-btn icon-btn--primary" data-act="upload">
            <svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg> Ganti
          </button>
          <button class="icon-btn icon-btn--danger" data-act="remove">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg> Hapus
          </button>
        </div>
        <input type="file" accept="image/*" hidden>
      </article>`;
    }).join('');

    adminGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.icon-btn');
      if (!btn) return;
      const card = btn.closest('.acard');
      const id = card.dataset.id;
      const item = KSF.all().find(x => x.id === id);

      if (btn.dataset.act === 'upload') {
        card.querySelector('input[type=file]').click();
      } else {
        KSF.removePhoto(id);
        refreshCard(card, item);
        showToast('Foto dihapus', `Profil ${item.name} kembali ke inisial.`);
      }
    });

    adminGrid.addEventListener('change', (e) => {
      const input = e.target.closest('input[type=file]');
      if (!input || !input.files[0]) return;
      const card = input.closest('.acard');
      const id = card.dataset.id;
      const item = KSF.all().find(x => x.id === id);
      readImage(input.files[0], 420, (dataUrl) => {
        KSF.setPhoto(id, dataUrl);
        refreshCard(card, item);
        showToast('Foto tersimpan', `Foto profil ${item.name} berhasil diganti.`);
      });
      input.value = '';
    });

    function refreshCard(card, item) {
      card.querySelector('.avatar-holder').innerHTML = KSF.avatarHTML(item);
      const info = card.querySelector('.acard__info');
      const old = info.querySelector('.saved');
      if (old) old.remove();
      if (KSF.photoOf(item.id)) {
        const s = document.createElement('span');
        s.className = 'saved'; s.textContent = '✓ Foto kustom aktif';
        info.appendChild(s);
      }
    }

    const resetBtn = $('#resetPhotos');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      localStorage.removeItem(KSF.KEY);
      $$('.acard', adminGrid).forEach(card => {
        refreshCard(card, KSF.all().find(x => x.id === card.dataset.id));
      });
      showToast('Direset', 'Semua foto profil dikembalikan ke default.');
    });
  }

  /* ---------- Admin: kelola logo brand ---------- */
  const logoInput = $('#logoInput');
  if (logoInput) {
    const logoUpload = $('#logoUpload');
    const logoRemove = $('#logoRemove');
    if (logoUpload) logoUpload.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      if (!logoInput.files[0]) return;
      readImage(logoInput.files[0], 320, (dataUrl) => {
        KSF.setLogo(dataUrl);
        applyLogo();
        showToast('Logo tersimpan', 'Logo brand Kessoku Family berhasil diganti.');
      });
      logoInput.value = '';
    });
    if (logoRemove) logoRemove.addEventListener('click', () => {
      KSF.removeLogo();
      applyLogo();
      showToast('Logo dihapus', 'Logo brand kembali ke default.');
    });
  }

  /* ---------- Login gate + kelola akun (halaman setting) ---------- */
  const loginGate = $('#loginGate');
  const settingsContent = $('#settingsContent');
  if (loginGate && settingsContent && KSF.login) {
    /* ---- Kelola akun & jabatan ---- */
    const ROLE_LABEL = { owner: 'Owner', 'co-owner': 'Co-Owner', leader: 'Leader Admin', admin: 'Admin' };
    function renderAccounts() {
      const list = $('#accountList');
      if (!list || !KSF.accounts) return;
      const me = KSF.currentUser();
      const owner = KSF.isOwner ? KSF.isOwner() : false;
      const row = (a, i) => {
        const role = a.role || 'admin';
        const builtin = a.id === 'owner';
        const isMe = me && me.id === a.id;
        const canRemove = owner && !builtin;
        return `<div class="accrow accrow--${role}" style="--d:${i % 8}">
          <span class="accrow__avatar">${esc((a.name || '?').trim().charAt(0).toUpperCase())}</span>
          <span class="accrow__info"><b>${esc(a.name)}</b><small>@${esc(a.username)}${isMe ? ' · kamu' : ''}${builtin ? ' · bawaan' : ''}</small></span>
          <span class="accrow__tag accrow__tag--${role}">${ROLE_LABEL[role] || 'Admin'}</span>
          ${canRemove ? `<button class="icon-btn icon-btn--danger" type="button" data-remove="${a.id}">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg> Hapus</button>` : ''}
        </div>`;
      };
      const accs = KSF.accounts();
      const owners = accs.filter(a => (a.role || 'admin') === 'owner');
      const staff = accs.filter(a => (a.role || 'admin') !== 'owner');
      let html = '<p class="account-group"><span>Owner</span></p>' + owners.map(row).join('');
      if (staff.length) html += '<p class="account-group"><span>Admin &amp; Staff</span></p>' + staff.map(row).join('');
      list.innerHTML = html;
    }

    /* ---- Kelola generasi ---- */
    function renderGens() {
      const list = $('#genList');
      if (!list || !KSF.getGenerations) return;
      list.innerHTML = KSF.getGenerations().map(g => `
        <div class="genrow-admin${g.active ? '' : ' is-off'}" data-id="${g.id}">
          <label class="switch" title="Aktif / nonaktif">
            <input type="checkbox" data-act="toggle" ${g.active ? 'checked' : ''}>
            <span class="switch__track"><span class="switch__dot"></span></span>
          </label>
          <div class="genrow-admin__fields">
            <input class="gname" data-field="name" value="${esc(g.name)}" aria-label="Nama gen">
            <input class="glink" data-field="link" value="${esc(g.link || '')}" placeholder="Link grup (opsional)" aria-label="Link gen">
            <input class="gmem" data-field="members" type="number" min="0" value="${Number(g.members) || 0}" aria-label="Jumlah member">
          </div>
          <button class="icon-btn icon-btn--danger" type="button" data-act="del" aria-label="Hapus gen">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>`).join('');
    }

    /* ---- Kelola hashtag ---- */
    function renderTags() {
      const list = $('#tagList');
      if (!list || !KSF.getHashtags) return;
      list.innerHTML = KSF.getHashtags().map((t, i) => `
        <div class="tagrow-admin" style="--d:${i % 6}">
          <span class="tagrow-admin__tag">${esc(t.tag)}</span>
          <input class="tagrow-admin__num" type="number" min="0" value="${Number(t.count) || 0}"
            data-count="${esc(t.tag)}" aria-label="Jumlah pemakaian ${esc(t.tag)}">
          <span class="tagrow-admin__lbl">post</span>
          <button class="icon-btn icon-btn--danger" type="button" data-tag="${esc(t.tag)}" aria-label="Hapus hashtag">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>`).join('');
    }

    /* ---- Kelola CN otomatis ---- */
    function renderCNs() {
      const list = $('#cnList');
      if (!list || !KSF.getCNs) return;
      const cns = KSF.getCNs();
      if (!cns.length) {
        list.innerHTML = '<p class="cn-empty">Belum ada CN. Tambahkan minimal satu bar CN.</p>';
        return;
      }
      list.innerHTML = cns.map((c, i) => `
        <div class="cnrow" style="--d:${i}">
          <span class="cnrow__no">Bar ${i + 1}</span>
          <code class="cnrow__tpl">${esc(c.tpl)}</code>
          <button class="icon-btn icon-btn--danger" type="button" data-cn="${c.id}" aria-label="Hapus CN">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg> Hapus
          </button>
        </div>`).join('');
    }

    /* ---- API / database ---- */
    function setApiStatus(msg) {
      const el = $('#apiStatus'); if (!el) return;
      const on = KSF.apiConfigured && KSF.apiConfigured();
      if (msg) { el.textContent = msg; return; }
      el.classList.toggle('is-live', !!on);
      const key = window.KSF_CONFIG ? KSF_CONFIG.key() : '';
      const sb = KSF.isSupabase && KSF.isSupabase();
      el.textContent = on
        ? (sb ? 'Supabase' : 'API') + ' · ' + KSF_CONFIG.base()
          + (sb && !key ? ' · Anon Key belum diisi!' : '')
          + ' · refresh tiap ' + Math.round(KSF_CONFIG.refreshMs() / 1000) + 's.'
        : 'Mode demo — data lokal. Isi Base URL (dan Anon Key untuk Supabase).';
    }
    function loadApiFields() {
      const b = $('#apiBase'), k = $('#apiKey'), r = $('#apiRefresh');
      if (b) b.value = (window.KSF_CONFIG && KSF_CONFIG.base()) || '';
      if (k) k.value = window.KSF_CONFIG ? KSF_CONFIG.key() : '';
      if (r) r.value = window.KSF_CONFIG ? Math.round(KSF_CONFIG.refreshMs() / 1000) : 15;
      setApiStatus();
    }

    function pushGeneration(method, id, payload) {
      if (!(KSF.apiConfigured && KSF.apiConfigured())) return;
      const path = '/generations' + (id ? '/' + encodeURIComponent(id) : '');
      KSF.apiSend(method, path, payload).catch(() => {});
    }
    function pushHashtag(method, tag, payload) {
      if (!(KSF.apiConfigured && KSF.apiConfigured())) return;
      const path = '/hashtags' + (method === 'DELETE' ? '/' + encodeURIComponent(tag) : '');
      const body = method === 'POST' ? { tag: tag } : (payload || null);
      KSF.apiSend(method, path, body).catch(() => {});
    }
    function pushCN(method, id, payload) {
      if (!(KSF.apiConfigured && KSF.apiConfigured())) return;
      const path = '/cns' + (id ? '/' + encodeURIComponent(id) : '');
      KSF.apiSend(method, path, payload).catch(() => {});
    }

    let pollTimer = null;
    function startStatsPoll() {
      if (pollTimer) return;
      const ms = Math.max(3000, (window.KSF_CONFIG ? KSF_CONFIG.refreshMs() : 15000));
      pollTimer = setInterval(() => {
        if (!(KSF.apiConfigured && KSF.apiConfigured())) return;
        KSF.refreshStats().then(() => { renderGens(); renderTags(); }).catch(() => {});
      }, ms);
    }

    /* ---- Total member (manual) ---- */
    function renderTotal() {
      const inp = $('#totalMember'), st = $('#totalStatus');
      const apiOn = KSF.apiConfigured && KSF.apiConfigured();
      const cur = (KSF.localStats ? KSF.localStats().totalMembers : 0);
      const ov = (KSF.getTotalOverride && !apiOn) ? KSF.getTotalOverride() : null;
      if (inp) inp.value = ov == null ? '' : ov;
      if (st) {
        st.classList.remove('is-live');
        if (apiOn) st.textContent = 'Tersimpan di database · total ' + fmt(cur) + ' member.';
        else if (ov != null) st.textContent = 'Mode manual · total dipatok ' + fmt(cur) + ' member.';
        else st.textContent = 'Otomatis dari jumlah gen aktif · total ' + fmt(cur) + ' member.';
      }
    }

    function renderSession() {
      const u = KSF.currentUser();
      if (u) {
        loginGate.hidden = true;
        settingsContent.hidden = false;
        const owner = u.role === 'owner';
        $$('[data-owner]').forEach(el => { el.hidden = !owner; });
        const who = $('#whoami'); if (who) who.textContent = u.name + ' (' + (ROLE_LABEL[u.role] || u.role) + ')';
        renderCNs();
        renderGens();
        renderTags();
        renderTotal();
        if (owner) { renderAccounts(); loadApiFields(); startStatsPoll(); }
      } else {
        loginGate.hidden = false;
        settingsContent.hidden = true;
      }
      initReveal();
    }

    /* ---- Tab login: Owner / Admin (dipisah) ---- */
    let loginMode = 'owner';
    const loginTabs = $('#loginTabs');
    if (loginTabs) {
      $$('.login-tab', loginTabs).forEach((tab, i) => {
        tab.addEventListener('click', () => {
          loginMode = tab.dataset.mode;
          loginTabs.style.setProperty('--ti', i);
          $$('.login-tab', loginTabs).forEach(t => {
            const on = t === tab;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
          });
        });
      });
    }

    const loginForm = $('#loginForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const session = KSF.login($('#loginUser').value, $('#loginPass').value);
      if (!session) {
        showToast('Login gagal', 'Nama/username atau password salah.');
        const card = $('.login-card', loginGate);
        if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
        return;
      }
      // Pisahkan area Owner & Admin
      if (loginMode === 'owner' && session.role !== 'owner') {
        KSF.logout();
        showToast('Bukan akun owner', 'Akun ini bukan owner. Pilih tab Admin.');
        return;
      }
      if (loginMode === 'admin' && session.role === 'owner') {
        KSF.logout();
        showToast('Itu akun owner', 'Masuk lewat tab Owner ya.');
        return;
      }
      loginForm.reset();
      renderSession();
      showToast('Berhasil masuk', `Selamat datang, ${session.name}.`);
    });

    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      KSF.logout();
      renderSession();
      showToast('Logout', 'Kamu sudah keluar dari panel setting.');
    });

    const accountList = $('#accountList');
    if (accountList) accountList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      if (!(KSF.isOwner && KSF.isOwner())) { showToast('Tidak diizinkan', 'Hanya owner yang bisa menghapus akun.'); return; }
      const id = btn.dataset.remove;
      const acc = KSF.getAdmins().find(a => a.id === id);
      KSF.removeAdmin(id);
      renderAccounts();
      showToast('Akun dihapus', `Akun ${acc ? acc.name : ''} berhasil dihapus.`);
    });

    const addAdminForm = $('#addAdminForm');
    if (addAdminForm) addAdminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(KSF.isOwner && KSF.isOwner())) { showToast('Tidak diizinkan', 'Hanya owner yang bisa menambah akun.'); return; }
      const name = $('#adminName').value.trim();
      const username = $('#adminUser').value.trim();
      const password = $('#adminPass').value;
      if (!name || !username || !password) { showToast('Belum lengkap', 'Isi nama, username, dan password.'); return; }
      const taken = KSF.accounts().some(a => a.username.toLowerCase() === username.toLowerCase());
      if (taken) { showToast('Username dipakai', 'Gunakan username lain.'); return; }
      const roleSel = $('#adminRole');
      const role = (roleSel && roleSel.value) || 'admin';
      KSF.addAdmin({ id: 'adm_' + Date.now().toString(36), name, username, password, role: role });
      addAdminForm.reset();
      renderAccounts();
      showToast('Akun dibuat', `${name} ditambahkan sebagai ${ROLE_LABEL[role] || 'Admin'}.`);
    });

    /* ---- Handler: generasi ---- */
    const genList = $('#genList');
    if (genList) {
      genList.addEventListener('change', (e) => {
        const row = e.target.closest('.genrow-admin'); if (!row) return;
        const id = row.dataset.id;
        const g = KSF.getGenerations().find(x => x.id === id);
        if (e.target.dataset.act === 'toggle') {
          KSF.updateGeneration(id, { active: e.target.checked });
          row.classList.toggle('is-off', !e.target.checked);
          pushGeneration('PUT', id, g ? Object.assign({}, g, { active: e.target.checked }) : null);
          showToast(e.target.checked ? 'Gen diaktifkan' : 'Gen dinonaktifkan', 'Total member komunitas diperbarui.');
        } else if (e.target.dataset.field) {
          const field = e.target.dataset.field;
          const val = field === 'members' ? (Number(e.target.value) || 0) : e.target.value;
          KSF.updateGeneration(id, { [field]: val });
          pushGeneration('PUT', id, g ? Object.assign({}, g, { [field]: val }) : null);
        }
      });
      genList.addEventListener('click', (e) => {
        const del = e.target.closest('[data-act="del"]'); if (!del) return;
        const row = del.closest('.genrow-admin');
        KSF.removeGeneration(row.dataset.id);
        renderGens();
        pushGeneration('DELETE', row.dataset.id, null);
        showToast('Gen dihapus', 'Generasi berhasil dihapus.');
      });
    }

    const addGenForm = $('#addGenForm');
    if (addGenForm) addGenForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#genName').value.trim();
      const link = $('#genLink').value.trim();
      const members = Number($('#genMembers').value) || 0;
      if (!name) { showToast('Belum lengkap', 'Isi nama gen dulu.'); return; }
      const id = 'gen_' + Date.now().toString(36);
      KSF.addGeneration({ id, name, link, members, active: true });
      pushGeneration('POST', null, { id, name, link, members, active: true });
      addGenForm.reset();
      $('#genMembers').value = 0;
      renderGens();
      showToast('Gen ditambahkan', `${name} berhasil dibuat.`);
    });

    /* ---- Handler: hashtag ---- */
    const tagList = $('#tagList');
    if (tagList) tagList.addEventListener('click', (e) => {
      const del = e.target.closest('[data-tag]'); if (!del) return;
      KSF.removeHashtag(del.dataset.tag);
      renderTags();
      pushHashtag('DELETE', del.dataset.tag);
      showToast('Hashtag dihapus', `${del.dataset.tag} tidak lagi dipantau.`);
    });
    // Ubah jumlah pemakaian manual
    if (tagList) tagList.addEventListener('change', (e) => {
      const inp = e.target.closest('.tagrow-admin__num');
      if (!inp || !(KSF.updateHashtag)) return;
      const val = Number(inp.value) || 0;
      KSF.updateHashtag(inp.dataset.count, { count: val });
      pushHashtag('PUT', inp.dataset.count, { count: val });
      showToast('Jumlah diperbarui', `${inp.dataset.count} = ${fmt(val)} post (manual).`);
    });

    const addTagForm = $('#addTagForm');
    if (addTagForm) addTagForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tag = $('#tagInput').value.trim();
      if (!tag) return;
      KSF.addHashtag(tag);
      addTagForm.reset();
      renderTags();
      pushHashtag('POST', tag.charAt(0) === '#' ? tag : '#' + tag);
      showToast('Hashtag ditambah', 'Hashtag akan dipantau dari API.');
    });

    /* ---- Handler: total member (manual) ---- */
    function applyTotal(val) {
      const apiOn = KSF.apiConfigured && KSF.apiConfigured();
      if (val == null) {
        KSF.clearTotalOverride();
        if (apiOn && KSF.clearRemoteTotal) {
          KSF.clearRemoteTotal().then(() => KSF.refreshStats()).then(renderTotal).catch(() => renderTotal());
        }
        showToast('Total member otomatis', 'Dihitung dari jumlah gen aktif.');
      } else {
        if (apiOn && KSF.pushTotal) {
          KSF.pushTotal(val).then(() => KSF.refreshStats()).then(renderTotal).catch(() => renderTotal());
        } else {
          KSF.setTotalOverride(val);
        }
        showToast('Total member disimpan', 'Total dipatok ' + fmt(val) + ' member.');
      }
      renderTotal();
    }
    const totalSave = $('#totalSave');
    if (totalSave) totalSave.addEventListener('click', () => {
      const inp = $('#totalMember');
      const raw = inp ? inp.value.trim() : '';
      applyTotal(raw === '' ? null : Math.max(0, Number(raw) || 0));
    });
    const totalAuto = $('#totalAuto');
    if (totalAuto) totalAuto.addEventListener('click', () => { applyTotal(null); });

    /* ---- Handler: CN otomatis ---- */
    const cnList = $('#cnList');
    if (cnList) cnList.addEventListener('click', (e) => {
      const del = e.target.closest('[data-cn]'); if (!del) return;
      if (!window.confirm('Hapus bar CN ini?')) return;
      KSF.removeCN(del.dataset.cn);
      renderCNs();
      pushCN('DELETE', del.dataset.cn);
      showToast('CN dihapus', 'Bar CN sudah dihapus dari halaman daftar.');
    });

    const addCnForm = $('#addCnForm');
    if (addCnForm) addCnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tpl = $('#cnTpl').value.trim();
      if (!tpl) return;
      if (!/name/i.test(tpl)) {
        showToast('Format salah', 'Wajib pakai kata "name" sebagai nama pendaftar.');
        return;
      }
      if (!window.confirm('Tambah bar CN ini?\n\n' + tpl)) return;
      const before = KSF.getCNs().length;
      const l = KSF.addCN(tpl);
      addCnForm.reset();
      renderCNs();
      pushCN('POST', null, { id: l[l.length - 1].id, tpl: tpl });
      showToast('CN ditambah', 'CN ke-' + (before + 1) + ' langsung muncul di halaman daftar (real-time).');
    });

    /* ---- Handler: API config ---- */
    const apiSave = $('#apiSave');
    if (apiSave) apiSave.addEventListener('click', () => {
      if (!window.KSF_CONFIG) return;
      KSF_CONFIG.setBase($('#apiBase').value);
      if ($('#apiKey')) KSF_CONFIG.setKey($('#apiKey').value);
      KSF_CONFIG.setRefreshMs((Number($('#apiRefresh').value) || 15) * 1000);
      setApiStatus();
      showToast('Disimpan', KSF.apiConfigured() ? 'Konfigurasi database disimpan.' : 'Kembali ke mode demo.');
      renderSession();
      if (KSF.apiConfigured && KSF.apiConfigured()) {
        KSF.refreshStats().then(() => { renderGens(); renderTags(); setApiStatus(); }).catch(() => {});
      }
    });
    const apiTest = $('#apiTest');
    if (apiTest) apiTest.addEventListener('click', () => {
      if (!(KSF.apiConfigured && KSF.apiConfigured())) { setApiStatus('Isi Base URL dulu, lalu tes koneksi.'); return; }
      setApiStatus('Menguji koneksi...');
      KSF.refreshStats()
        .then(() => { renderGens(); renderTags(); renderTotal(); setApiStatus('Koneksi berhasil · data dimuat dari database.'); showToast('Koneksi berhasil', 'Data berhasil dimuat dari database.'); })
        .catch((err) => setApiStatus('Gagal terhubung. Cek URL, Anon Key, nama tabel, dan policy RLS. (' + (err && err.message ? err.message : '') + ')'));
    });

    renderSession();
  }

  /* ---------- Form registrasi ---------- */
  const form = $('#regForm');
  if (form) {
    // Isi pilihan Gen dari data setting (nama + link grup)
    const genSel = $('#gen');
    function fillGenSelect() {
      if (!genSel || !KSF.getGenerations) return;
      const prev = genSel.value;
      let gens = KSF.getGenerations();
      // Jaga-jaga: bila belum ada gen sama sekali, tetap sediakan satu opsi
      if (!gens.length) gens = [{ id: 'umum', name: 'Umum', active: true }];
      genSel.innerHTML = '<option value="" disabled hidden></option>' +
        gens.map(g => `<option value="${esc(g.id)}">${esc(g.name)}${g.active ? '' : ' (Coming Soon)'}</option>`).join('');
      genSel.value = (prev && gens.some(g => g.id === prev)) ? prev : '';
    }
    fillGenSelect();
    // Real-time: gen ditambah/diubah di tab lain -> perbarui pilihan di sini
    window.addEventListener('storage', (e) => { if (e.key === KSF.GEN_KEY) fillGenSelect(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('input[required], select[required], textarea[required]', form).forEach(el => {
        const field = el.closest('.field');
        let valid = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
        if (el.type === 'email') valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (field) field.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      const check = $('.check');
      if (check) check.classList.toggle('is-invalid', !$('#setuju').checked);
      if (!ok) { showToast('Belum lengkap', 'Lengkapi semua data dengan benar dulu ya.'); return; }

      const btn = $('#submitBtn');
      const label = btn.querySelector('span');
      btn.disabled = true; label.textContent = 'Mengirim...';

      // Simpan data pendaftaran untuk dipakai di halaman CN (page 4)
      const gens = (KSF.getGenerations ? KSF.getGenerations() : []) || [];
      const genId = genSel ? genSel.value : '';
      const genObj = gens.find(g => g.id === genId) || null;
      const val = (id) => { const el = $('#' + id); return el ? el.value.trim() : ''; };
      const reg = {
        nama: val('nama'),
        tiktok: val('tt'),
        email: val('email'),
        genId: genObj ? genObj.id : genId,
        genName: genObj ? genObj.name : genId,
        alasan: val('alasan'),
        at: Date.now()
      };
      try {
        sessionStorage.setItem('ksf_reg_v1', JSON.stringify(reg));
        sessionStorage.setItem('ksf_join_access_v1', '1');
      } catch (err) { /* abaikan */ }

      // Kirim juga lewat URL sebagai cadangan bila storage diblokir
      const qs = new URLSearchParams({
        nama: reg.nama, tt: reg.tiktok, gen: reg.genId, gname: reg.genName
      }).toString();

      showToast('Registrasi terkirim!', 'Lanjut bikin CN dan gabung grup...');
      setTimeout(() => { window.location.href = 'join.html?' + qs; }, 700);
    });
    $$('input, select, textarea', form).forEach(el => {
      el.addEventListener('input', () => {
        const f = el.closest('.field');
        if (f) f.classList.remove('is-invalid');
      });
    });
  }

  // Klik tombol "Daftar" -> buka akses ke halaman CN (page 4)
  $$('[data-join]').forEach(el => el.addEventListener('click', () => {
    try { sessionStorage.setItem('ksf_join_access_v1', '1'); } catch (e) { /* abaikan */ }
  }));

  /* ---------- Page 4: bikin CN & gabung grup ---------- */
  const joinApp = $('#joinApp');
  if (joinApp) {
    let access = false, reg = null;
    try {
      access = sessionStorage.getItem('ksf_join_access_v1') === '1';
      reg = JSON.parse(sessionStorage.getItem('ksf_reg_v1')) || null;
    } catch (e) { /* abaikan */ }

    // Cadangan: ambil data dari URL (mis. bila storage diblokir)
    const qp = new URLSearchParams(location.search);
    if (!reg && (qp.get('tt') || qp.get('nama'))) {
      reg = {
        nama: qp.get('nama') || '',
        tiktok: qp.get('tt') || '',
        email: '',
        genId: qp.get('gen') || '',
        genName: qp.get('gname') || qp.get('gen') || '',
        alasan: '',
        at: Date.now()
      };
    }

    // Halaman ini hanya bisa dibuka lewat proses daftar
    if (!access && !reg) {
      window.location.replace('index.html#daftar');
      return;
    }

    let cnList = [];

    // Bangun daftar CN dari template di Setting (keyword `name` -> nama pendaftar)
    function buildCN(name) {
      const b = toBold(name);
      const cns = (KSF.getCNs ? KSF.getCNs() : []) || [];
      return cns.map(c => String(c.tpl == null ? '' : c.tpl).replace(/name/gi, b));
    }

    const $cnBlock = $('#cnBlock');
    const $cnBars = $('#cnBars');
    const $cnName = $('#cnName');
    const $joinGenName = $('#joinGenName');
    const $joinCta = $('#joinCta');

    if ($joinCta) $joinCta.hidden = true;
    if ($joinGenName) $joinGenName.textContent = reg && reg.genName ? reg.genName : '—';
    if ($cnName && reg) $cnName.value = (reg.tiktok || reg.nama || '').trim();

    function renderBars(name) {
      cnList = buildCN(name);
      if (!cnList.length) {
        $cnBars.innerHTML = '<p class="cn-empty">Admin belum membuat bar CN. Coba lagi nanti ya.</p>';
        return;
      }
      $cnBars.innerHTML = cnList.map((t, i) => `
        <article class="cnbar" style="--d:${i}">
          <span class="cnbar__no">Bar ${i + 1}</span>
          <p class="cnbar__text">${esc(t)}</p>
          <button type="button" class="icon-btn icon-btn--primary cnbar__copy" data-copy="${esc(t)}">
            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg> Copy
          </button>
        </article>`).join('');
    }

    const cnForm = $('#cnForm');
    if (cnForm) cnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $cnName.value.trim();
      if (!name) {
        $cnName.closest('.field').classList.add('is-invalid');
        showToast('Nickname kosong', 'Tulis nickname TikTok kamu dulu.');
        return;
      }
      renderBars(name);
      $cnBlock.hidden = false;
      if ($joinCta) $joinCta.hidden = false;   // tombol bergabung muncul setelah CN dibuat
      $$('.reveal', $cnBlock).forEach(el => el.classList.add('is-in'));
      showToast('CN siap!', 'Copy salah satu CN di bawah, lalu gabung grup.');
      setTimeout(() => $cnBlock.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 80);
    });
    if ($cnName) $cnName.addEventListener('input', () => {
      const f = $cnName.closest('.field'); if (f) f.classList.remove('is-invalid');
      if (!$cnBlock.hidden && $cnName.value.trim()) renderBars($cnName.value.trim());
    });

    // Real-time: kalau admin nambah/hapus CN di tab lain, bar CN ikut berubah
    window.addEventListener('storage', (e) => {
      if (e.key === KSF.CN_KEY) {
        const name = ($cnName && $cnName.value || '').trim();
        if (name && !$cnBlock.hidden) renderBars(name);
      }
    });

    // Copy CN
    if ($cnBars) $cnBars.addEventListener('click', (e) => {
      const btn = e.target.closest('.cnbar__copy');
      if (!btn) return;
      const text = btn.dataset.copy;
      const done = () => {
        const old = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = '✓ Tersalin';
        showToast('CN disalin', 'CN berhasil dicopy ke clipboard.');
        setTimeout(() => { btn.innerHTML = old; btn.classList.remove('is-copied'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          const ta = document.createElement('textarea'); ta.value = text;
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (err) { showToast('Gagal menyalin', 'Copy manual ya.'); }
          ta.remove();
        });
      } else {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { showToast('Gagal menyalin', 'Copy manual ya.'); }
        ta.remove();
      }
    });

    // Bergabung: buka link grup gen + kirim data ke API/bot
    const joinBtn = $('#joinBtn');
    if (joinBtn) joinBtn.addEventListener('click', () => {
      const name = ($cnName.value || (reg && (reg.tiktok || reg.nama)) || '').trim();
      if (!name) { showToast('Nickname kosong', 'Bikin CN dulu sebelum bergabung.'); return; }
      if (!cnList.length) { cnList = buildCN(name); }
      if (!cnList.length) { showToast('Belum ada CN', 'Admin belum membuat bar CN. Coba lagi nanti ya.'); return; }

      const gens = (KSF.getGenerations ? KSF.getGenerations() : []) || [];
      const gen = gens.find(g => reg && g.id === reg.genId) || null;
      const link = gen && gen.link;

      const payload = {
        nama: reg ? reg.nama : '',
        tiktok: reg ? reg.tiktok : '',
        email: reg ? reg.email : '',
        gen: reg ? reg.genName : '',
        alasan: reg ? reg.alasan : '',
        cns: cnList.slice(),
        cn1: cnList[0] || '', cn2: cnList[1] || '', cn3: cnList[2] || '',
        joinedAt: Date.now()
      };

      // Buka grup sesuai gen yang dipilih (link diisi dari Setting)
      if (link) {
        window.open(link, '_blank', 'noopener');
      } else {
        showToast('Link grup belum diisi', 'Admin belum mengisi link gen ini. Hubungi admin.');
      }

      // Kirim otomatis ke database/bot lewat API
      const note = $('#joinNote');
      if (KSF.apiConfigured && KSF.apiConfigured()) {
        if (note) note.textContent = 'Mengirim datamu ke admin...';
        KSF.apiSend('POST', '/join', payload)
          .then(() => { if (note) note.textContent = 'Data sudah terkirim ke admin. Selamat bergabung!'; showToast('Terkirim', 'Data & CN kamu terkirim ke admin.'); })
          .catch(() => { if (note) note.textContent = 'Gagal kirim otomatis. Salin pesan manual di bawah.'; copyFallback(payload); });
      } else {
        // Mode demo: salin pesan agar bisa dikirim manual ke grup
        copyFallback(payload);
        if (note) note.textContent = 'Mode demo: pesan datamu disalin, kirim ke grup/owner.';
      }
    });

    function copyFallback(p) {
      const lines = [
        'Pendaftaran Kessoku Family',
        'Nama: ' + (p.nama || '-'),
        'TikTok: ' + (p.tiktok || '-'),
        'Email: ' + (p.email || '-'),
        'Gen: ' + (p.gen || '-'),
        'Alasan: ' + (p.alasan || '-')
      ];
      (p.cns || [p.cn1, p.cn2, p.cn3]).forEach((c, i) => { if (c) lines.push('CN ' + (i + 1) + ': ' + c); });
      const msg = lines.join('\n');
      try { navigator.clipboard.writeText(msg); } catch (e) { /* abaikan */ }
      showToast('Pesan disalin', 'Data & CN disalin — kirim ke grup/owner.');
    }
  }

  /* ---------- Init ---------- */
  applyLogo();
  initReveal();
  initCounters();
  onScroll();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
