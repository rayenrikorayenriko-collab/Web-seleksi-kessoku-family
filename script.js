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
  function safeExternalUrl(raw) {
    try {
      let value = String(raw || '').trim();
      if (!value) return '';
      if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (e) { return ''; }
  }
  function verifiedBadge() {
    return `<span class="verified-badge" role="img" aria-label="Tim Kessoku Family terverifikasi">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.2 10.2 3.1 3.1 6.6-6.6"/></svg>
    </span>`;
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

  /* ---------- Tema warna global ---------- */
  function initThemePicker() {
    const themes = [
      { id: 'red', label: 'Merah', color: '#e0121f' },
      { id: 'blue', label: 'Biru', color: '#0960bf' },
      { id: 'pink', label: 'Pink', color: '#c02168' },
      { id: 'yellow', label: 'Kuning', color: '#c08a0a' }
    ];
    const stored = localStorage.getItem('ksf_theme_v1') || 'red';
    document.body.dataset.theme = themes.some(t => t.id === stored) ? stored : 'red';
    document.body.insertAdjacentHTML('beforeend', `
      <div class="theme-switcher">
        <button class="theme-switcher__toggle" id="themeToggle" type="button" aria-label="Ganti warna tema" aria-expanded="false">
          <span aria-hidden="true">◐</span>
        </button>
        <div class="theme-picker" id="themePicker" hidden aria-label="Pilih warna tema">
          ${themes.map(t => `<button type="button" class="theme-swatch theme-swatch--${t.id}" data-theme-choice="${t.id}" aria-label="Tema ${t.label}" title="${t.label}"></button>`).join('')}
        </div>
      </div>
      <div class="theme-notice" id="themeNotice" role="status" aria-live="polite"></div>`);
    const toggle = $('#themeToggle'), picker = $('#themePicker'), notice = $('#themeNotice');
    const meta = $('meta[name="theme-color"]');
    function setTheme(id, announce) {
      const theme = themes.find(t => t.id === id) || themes[0];
      document.body.dataset.theme = theme.id;
      localStorage.setItem('ksf_theme_v1', theme.id);
      if (meta) meta.content = theme.color;
      if (announce && notice) {
        notice.textContent = 'Tema ' + theme.label + ' diterapkan';
        notice.classList.add('is-show');
        clearTimeout(setTheme._timer);
        setTheme._timer = setTimeout(() => notice.classList.remove('is-show'), 2200);
      }
    }
    if (meta) meta.content = (themes.find(t => t.id === document.body.dataset.theme) || themes[0]).color;
    if (toggle) toggle.addEventListener('click', () => {
      const opening = picker.hidden;
      picker.hidden = !opening;
      toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });
    if (picker) picker.addEventListener('click', e => {
      const swatch = e.target.closest('[data-theme-choice]');
      if (!swatch) return;
      setTheme(swatch.dataset.themeChoice, true);
      picker.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
    window.addEventListener('storage', e => { if (e.key === 'ksf_theme_v1') setTheme(e.newValue, false); });
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

  /* ---------- Ripple sentuh/klik ---------- */
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn, .icon-btn, .theme-switcher__toggle');
    if (!btn || btn.disabled || reduced) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  }, { passive: true });

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

      const sig = JSON.stringify({
        stats: s,
        photos: s.generations.map(g => {
          const p = KSF.genPhoto ? KSF.genPhoto(g.id) : '';
          return [g.id, p.length, p.slice(0, 32), p.slice(-32)];
        }),
        links: KSF.getCustomLinks ? KSF.getCustomLinks() : [],
        linkPhotos: KSF.getCustomLinks ? KSF.getCustomLinks().map(link => {
          const p = KSF.customLinkPhoto ? KSF.customLinkPhoto(link.id) : '';
          return [link.id, p.length, p.slice(0, 32), p.slice(-32)];
        }) : []
      });
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
          </div>`).join('');
      }

      const heroGens = $('#heroGens');
      if (heroGens) heroGens.innerHTML = s.generations.slice(0, 3).map(g => `
        <div><b>${g.active ? fmt(g.members) : '—'}</b><span>${esc(g.name)}</span></div>`).join('');

      const genPreview = $('#generationPreview');
      if (genPreview) {
        genPreview.innerHTML = s.generations.map((g, i) => {
          const photo = KSF.genPhoto ? KSF.genPhoto(g.id) : '';
          return `<article class="gen-preview reveal" style="--d:${i % 6}">
            <div class="gen-preview__photo">${photo
              ? `<img src="${esc(photo)}" alt="Foto ${esc(g.name)}">`
              : `<span>${esc(g.name)}</span>`}</div>
            <div class="gen-preview__body">
              <span class="gen-preview__eyebrow">ANGKATAN KESSOKU</span>
              <div class="gen-preview__title"><h3>${esc(g.name)}</h3><span class="gen-state${g.active ? ' is-active' : ''}">${g.active ? 'Aktif' : 'Segera dibuka'}</span></div>
              <p><b>${g.active ? fmt(g.members) : '—'}</b> member</p>
            </div>
          </article>`;
        }).join('');
        initReveal();
      }

      const linksSection = $('#customLinksSection');
      const linksGrid = $('#customLinksGrid');
      if (linksSection && linksGrid && KSF.getCustomLinks) {
        const links = KSF.getCustomLinks();
        linksSection.hidden = !links.length;
        linksGrid.innerHTML = links.map(link => {
          const href = safeExternalUrl(link.url);
          const photo = KSF.customLinkPhoto ? KSF.customLinkPhoto(link.id) : '';
          if (!href) return '';
          return `<a class="custom-link-bar reveal" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
            <span class="custom-link-bar__photo">${photo ? `<img src="${esc(photo)}" alt="">` : `<span>${esc((link.title || '?').trim().charAt(0).toUpperCase())}</span>`}</span>
            <b>${esc(link.title)}</b><span class="custom-link-bar__arrow" aria-hidden="true">↗</span>
          </a>`;
        }).join('');
        initReveal();
      }

      if (statFoot) statFoot.textContent = s.demo
        ? 'Rekap anggota dan hashtag mengikuti pembaruan data komunitas setiap Senin.'
        : 'Data KSF dari database · jadwal rekap setiap Senin · diperiksa ' + new Date().toLocaleTimeString('id-ID');
    }

    renderStats();
    if (liveBadge) liveBadge.hidden = false;

    // Real-time: perubahan gen/hashtag/total di tab lain langsung tampil di sini
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (e.key === KSF.GEN_KEY || e.key === KSF.TAG_KEY || e.key === KSF.STATS_KEY || e.key === KSF.TOTAL_KEY) renderStats();
      if (e.key === KSF.GEN_PHOTO_KEY || e.key === KSF.CUSTOM_LINKS_KEY || e.key === KSF.CUSTOM_LINK_PHOTO_KEY) {
        lastSig = ''; renderStats();
      }
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
    statsTick();
    setInterval(statsTick, statsMs);
  }

  /* ---------- Render: Team page ---------- */
  function renderTeamPage() {
    const foundersWrap = $('#founders');
    if (foundersWrap && KSF.getFounders) {
      const fs = KSF.getFounders();
      foundersWrap.innerHTML = fs.length ? fs.map((f, i) => `
      <article class="profile profile--${esc(f.tier || 'lead')} reveal" style="--d:${i}">
        <span class="profile__badge">${esc(f.role)}</span>
        <div class="profile__visual">${KSF.avatarHTML(f, f.tier === 'owner' ? 'avatar--owner' : '')}
          <span class="profile__stamp">${esc(f.tier === 'owner' ? 'PENGARAH KSF' : 'TIM INTI')}</span>
        </div>
        <div class="profile__content">
          <span class="person__role">${esc(f.role)}</span>
          <h3>${esc(f.name)} ${verifiedBadge()}</h3>
          <p>${esc(f.note || '')}</p>
          <span class="profile__signature">KESSOKU FAMILY · TEAM</span>
        </div>
      </article>`).join('') : '<p class="cn-empty">Belum ada pendiri.</p>';
    }

    const teamGrid = $('#teamGrid');
    if (teamGrid && KSF.getMembers) {
      const ms = KSF.getMembers();
      teamGrid.innerHTML = ms.length ? ms.map((m, i) => `
      <article class="mcard reveal" style="--d:${i % 6}">
        <div class="mcard__photo">${KSF.avatarHTML(m)}</div>
        <div class="mcard__info">
          <b>${esc(m.name)} ${verifiedBadge()}</b>
          <span>${esc(m.role)}</span>
          <small>Admin terverifikasi · Kessoku Family</small>
        </div>
        <span class="mcard__mark" aria-hidden="true">KSF</span>
      </article>`).join('') : '<p class="cn-empty">Belum ada admin. Tambahkan lewat halaman Admin.</p>';
    }
    initReveal();
  }
  if ($('#founders') || $('#teamGrid')) {
    renderTeamPage();
    if (KSF.apiConfigured && KSF.apiConfigured()) KSF.refreshStats().then(renderTeamPage).catch(() => {});
    // Real-time: perubahan team di tab lain langsung tampil
    window.addEventListener('storage', (e) => {
      if (e.key === KSF.TEAM_KEY || e.key === KSF.KEY) renderTeamPage();
    });
  }

  /* ---------- Render: Admin page ---------- */
  const adminGrid = $('#adminGrid');
  if (adminGrid && KSF.all) {
    function renderAdminGrid() {
      adminGrid.innerHTML = KSF.all().map((m, i) => {
        const has = !!KSF.photoOf(m.id);
        return `
      <article class="acard reveal" style="--d:${i % 6}" data-id="${esc(m.id)}">
        <div class="avatar-holder">${KSF.avatarHTML(m)}</div>
        <div class="acard__info">
          <b>${esc(m.name)} ${verifiedBadge()}</b>
          <span>${esc(m.role)}</span>
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
      initReveal();
    }
    renderAdminGrid();
    window.addEventListener('ksf:team-updated', renderAdminGrid);
    window.addEventListener('ksf:remote-data-updated', renderAdminGrid);

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
        if (KSF.pushSetting) KSF.pushSetting('team_photos', KSF.getPhotos()).catch(() => {});
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
        if (KSF.pushSetting) KSF.pushSetting('team_photos', KSF.getPhotos()).catch(() => {});
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
      if (KSF.pushSetting) KSF.pushSetting('team_photos', {}).catch(() => {});
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
      list.innerHTML = KSF.getGenerations().map(g => {
        const photo = KSF.genPhoto ? KSF.genPhoto(g.id) : '';
        return `
        <div class="genrow-admin${g.active ? '' : ' is-off'}" data-id="${g.id}">
          <label class="switch" title="Aktif / nonaktif">
            <input type="checkbox" data-act="toggle" ${g.active ? 'checked' : ''}>
            <span class="switch__track"><span class="switch__dot"></span></span>
          </label>
          <span class="genrow-admin__photo">${photo ? `<img src="${esc(photo)}" alt="Foto ${esc(g.name)}">` : esc((g.name || '?').slice(0, 1).toUpperCase())}</span>
          <div class="genrow-admin__fields">
            <input class="gname" data-field="name" value="${esc(g.name)}" aria-label="Nama gen">
            <input class="glink" data-field="link" value="${esc(g.link || '')}" placeholder="Link grup (opsional)" aria-label="Link gen">
            <input class="gmem" data-field="members" type="number" min="0" value="${Number(g.members) || 0}" aria-label="Jumlah member">
          </div>
          <label class="icon-btn icon-btn--primary gen-photo-upload">
            <input class="gen-photo-input" type="file" accept="image/*" hidden>
            <svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg> Foto
          </label>
          ${photo ? `<button class="icon-btn gen-photo-remove" type="button" data-act="photo-remove" aria-label="Hapus foto gen">×</button>` : ''}
          <button class="icon-btn icon-btn--danger" type="button" data-act="del" aria-label="Hapus gen">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>`;
      }).join('');
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
        KSF.refreshStats().then(() => {
          renderGens(); renderTags(); renderTeamAdmin(); renderCustomLinkAdmin();
          window.dispatchEvent(new Event('ksf:remote-data-updated'));
        }).catch(() => {});
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
        else if (ov != null) st.textContent = 'Angka pengelola · total ' + fmt(cur) + ' member.';
        else st.textContent = 'Mengikuti jumlah gen aktif · total ' + fmt(cur) + ' member.';
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
        renderTeamAdmin();
        renderCustomLinkAdmin();
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

    /* ---- Kelola team (admin/keterangan yang tampil di halaman Team) ---- */
    function renderTeamAdmin() {
      const list = $('#teamAdminList');
      if (!list || !KSF.getTeam) return;
      const t = KSF.getTeam();
      const row = (m, group, i) => `
        <div class="teamrow" style="--d:${i % 8}" data-id="${esc(m.id)}">
          <span class="teamrow__avatar">${esc((m.name || '?').trim().charAt(0).toUpperCase())}</span>
          <span class="teamrow__info"><b>${esc(m.name)}</b><small>${group === 'founders' ? 'Pendiri' : 'Admin / Staff'}</small></span>
          <input class="teamrow__role" data-role value="${esc(m.role || '')}" placeholder="Keterangan (mis. Admin Live)" aria-label="Keterangan ${esc(m.name)}">
          <button class="icon-btn icon-btn--danger" type="button" data-team-del="${esc(m.id)}" aria-label="Hapus ${esc(m.name)}">
            <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg> Hapus
          </button>
        </div>`;
      let html = '';
      if (t.founders.length) html += '<p class="account-group"><span>Pendiri</span></p>' + t.founders.map((m, i) => row(m, 'founders', i)).join('');
      if (t.members.length) html += '<p class="account-group"><span>Admin &amp; Staff</span></p>' + t.members.map((m, i) => row(m, 'members', i)).join('');
      list.innerHTML = html || '<p class="cn-empty">Belum ada anggota team. Tambahkan lewat form di atas.</p>';
    }

    const teamAdminList = $('#teamAdminList');
    if (teamAdminList) {
      // Ubah keterangan (jabatan) langsung
      teamAdminList.addEventListener('change', (e) => {
        const inp = e.target.closest('.teamrow__role'); if (!inp) return;
        const rowEl = inp.closest('.teamrow');
        const nameEl = rowEl && rowEl.querySelector('.teamrow__info b');
        const val = inp.value.trim() || 'Admin';
        KSF.updateTeamMember(rowEl.dataset.id, { role: val });
        if (KSF.pushSetting) KSF.pushSetting('team_data', KSF.getTeam()).catch(() => {});
        window.dispatchEvent(new Event('ksf:team-updated'));
        showToast('Keterangan diperbarui', `${nameEl ? nameEl.textContent : ''} → ${val}.`);
      });
      // Hapus anggota team
      teamAdminList.addEventListener('click', (e) => {
        const del = e.target.closest('[data-team-del]'); if (!del) return;
        const rowEl = del.closest('.teamrow');
        const nameEl = rowEl && rowEl.querySelector('.teamrow__info b');
        if (!window.confirm('Hapus ' + (nameEl ? nameEl.textContent : 'anggota ini') + ' dari halaman Team?')) return;
        KSF.removeTeamMember(del.dataset.teamDel);
        if (KSF.pushSetting) KSF.pushSetting('team_data', KSF.getTeam()).catch(() => {});
        window.dispatchEvent(new Event('ksf:team-updated'));
        del.dataset.teamDel = '';
        renderTeamAdmin();
        showToast('Dihapus', `${nameEl ? nameEl.textContent : 'Anggota'} dihapus dari Team.`);
      });
    }

    const addTeamForm = $('#addTeamForm');
    if (addTeamForm) addTeamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!(KSF.addTeamMember)) return;
      const name = $('#teamName').value.trim();
      const role = $('#teamRole').value.trim();
      const section = ($('#teamSection') && $('#teamSection').value) || 'members';
      if (!name) { showToast('Belum lengkap', 'Isi nama anggota dulu.'); return; }
      KSF.addTeamMember({ name, role: role || 'Admin', group: section });
      if (KSF.pushSetting) KSF.pushSetting('team_data', KSF.getTeam()).catch(() => {});
      window.dispatchEvent(new Event('ksf:team-updated'));
      addTeamForm.reset();
      renderTeamAdmin();
      showToast('Ditambahkan', `${name} sekarang tampil di halaman Team.`);
    });

    /* ---- Kelola bar tautan Home ---- */
    function syncCustomLinks() {
      if (!KSF.pushSetting) return;
      KSF.pushSetting('custom_links', KSF.getCustomLinks()).catch(() => {});
      KSF.pushSetting('custom_link_photos', KSF.getCustomLinkPhotos()).catch(() => {});
    }
    function renderCustomLinkAdmin() {
      const list = $('#customLinkAdminList');
      if (!list || !KSF.getCustomLinks) return;
      const links = KSF.getCustomLinks();
      list.innerHTML = links.length ? links.map(link => `
        <div class="custom-link-admin-row" data-id="${esc(link.id)}">
          <span class="custom-link-admin-row__photo">${KSF.customLinkPhoto(link.id)
            ? `<img src="${esc(KSF.customLinkPhoto(link.id))}" alt="Foto ${esc(link.title)}">`
            : esc((link.title || '?').trim().charAt(0).toUpperCase())}</span>
          <input type="text" data-custom-field="title" value="${esc(link.title)}" aria-label="Nama bar">
          <input type="text" inputmode="url" data-custom-field="url" value="${esc(link.url)}" aria-label="URL tujuan">
          <label class="icon-btn icon-btn--primary">
            <input type="file" data-custom-photo hidden accept="image/*">
            <svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg> Foto
          </label>
          <button type="button" class="icon-btn icon-btn--danger" data-custom-remove aria-label="Hapus bar">Hapus</button>
        </div>`).join('') : '<p class="cn-empty">Belum ada bar tautan.</p>';
    }
    const customLinkAdminList = $('#customLinkAdminList');
    if (customLinkAdminList) {
      customLinkAdminList.addEventListener('change', e => {
        const row = e.target.closest('.custom-link-admin-row');
        if (!row) return;
        const photoInput = e.target.closest('[data-custom-photo]');
        if (photoInput && photoInput.files && photoInput.files[0]) {
          readImage(photoInput.files[0], 360, dataUrl => {
            KSF.setCustomLinkPhoto(row.dataset.id, dataUrl);
            syncCustomLinks();
            renderCustomLinkAdmin();
            showToast('Foto bar diperbarui', 'Foto tautan akan tampil di Home.');
          });
          photoInput.value = '';
          return;
        }
        const field = e.target.dataset.customField;
        if (!field) return;
        const value = e.target.value.trim();
        if (field === 'url' && !safeExternalUrl(value)) {
          showToast('Tautan tidak valid', 'Masukkan URL web yang valid, misalnya www.tiktok.com/@akun.');
          renderCustomLinkAdmin();
          return;
        }
        KSF.updateCustomLink(row.dataset.id, { [field]: field === 'url' ? safeExternalUrl(value) : value });
        syncCustomLinks();
        showToast('Bar diperbarui', 'Perubahan akan tampil di Home.');
      });
      customLinkAdminList.addEventListener('click', e => {
        const remove = e.target.closest('[data-custom-remove]');
        if (!remove) return;
        const row = remove.closest('.custom-link-admin-row');
        KSF.removeCustomLink(row.dataset.id);
        syncCustomLinks();
        renderCustomLinkAdmin();
        showToast('Bar dihapus', 'Tautan sudah dihapus dari Home.');
      });
    }
    const addCustomLinkForm = $('#addCustomLinkForm');
    if (addCustomLinkForm) addCustomLinkForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = $('#customLinkTitle').value.trim();
      const url = $('#customLinkUrl').value.trim();
      const normalizedUrl = safeExternalUrl(url);
      if (!title || !normalizedUrl) {
        showToast('Data belum valid', 'Isi nama bar dan URL web yang valid.');
        return;
      }
      KSF.addCustomLink({ title, url: normalizedUrl });
      addCustomLinkForm.reset();
      syncCustomLinks();
      renderCustomLinkAdmin();
      showToast('Bar ditambahkan', `${title} siap tampil di Home.`);
    });

    const genList = $('#genList');
    if (genList) {
      genList.addEventListener('change', (e) => {
        const photoInput = e.target.closest('.gen-photo-input');
        const row = e.target.closest('.genrow-admin'); if (!row) return;
        const id = row.dataset.id;
        if (photoInput && photoInput.files && photoInput.files[0]) {
          readImage(photoInput.files[0], 360, (dataUrl) => {
            KSF.setGenPhoto(id, dataUrl);
            if (KSF.pushSetting) KSF.pushSetting('generation_photos', KSF.getGenPhotos()).catch(() => {});
            renderGens();
            showToast('Foto gen diperbarui', 'Preview generasi di Home sudah diperbarui.');
          });
          photoInput.value = '';
          return;
        }
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
        const photoRemove = e.target.closest('[data-act="photo-remove"]');
        if (photoRemove) {
          const photoRow = photoRemove.closest('.genrow-admin');
          KSF.removeGenPhoto(photoRow.dataset.id);
          if (KSF.pushSetting) KSF.pushSetting('generation_photos', KSF.getGenPhotos()).catch(() => {});
          renderGens();
          showToast('Foto gen dihapus', 'Preview kembali memakai inisial generasi.');
          return;
        }
        const del = e.target.closest('[data-act="del"]'); if (!del) return;
        const row = del.closest('.genrow-admin');
        KSF.removeGeneration(row.dataset.id);
        KSF.removeGenPhoto(row.dataset.id);
        if (KSF.pushSetting) KSF.pushSetting('generation_photos', KSF.getGenPhotos()).catch(() => {});
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
      if (KSF.pushSetting) KSF.pushSetting('generation_photos', KSF.getGenPhotos()).catch(() => {});
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
      showToast('Jumlah diperbarui', `${inp.dataset.count} = ${fmt(val)} post.`);
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
        showToast('Total mengikuti gen', 'Jumlah dihitung dari gen yang aktif.');
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
    const genPicker = $('#genPicker');
    function fillGenSelect() {
      if (!genSel || !KSF.getGenerations) return;
      const prev = genSel.value;
      let gens = KSF.getGenerations();
      // Jaga-jaga: bila belum ada gen sama sekali, tetap sediakan satu opsi
      if (!gens.length) gens = [{ id: 'umum', name: 'Umum', active: true }];
      const selected = prev && gens.some(g => g.id === prev && g.active) ? prev : '';
      genSel.value = selected;
      if (genPicker) {
        genPicker.innerHTML = gens.map((g, i) => `
          <button type="button" class="gen-choice${selected === g.id ? ' is-selected' : ''}" data-gen-choice="${esc(g.id)}"
            aria-pressed="${selected === g.id}" ${g.active ? '' : 'disabled'} style="--d:${i % 6}">
            <span class="gen-choice__mark" aria-hidden="true">${selected === g.id ? '✓' : 'G'}</span>
            <span class="gen-choice__copy"><b>${esc(g.name)}</b><small>${g.active ? `${fmt(g.members || 0)} member` : 'Segera dibuka'}</small></span>
            <span class="gen-choice__arrow" aria-hidden="true">›</span>
          </button>`).join('');
      }
    }
    fillGenSelect();
    if (genPicker) genPicker.addEventListener('click', e => {
      const choice = e.target.closest('[data-gen-choice]');
      if (!choice || choice.disabled) return;
      genSel.value = choice.dataset.genChoice;
      $$('.gen-choice', genPicker).forEach(button => {
        const selected = button === choice;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        const mark = $('.gen-choice__mark', button);
        if (mark) mark.textContent = selected ? '✓' : 'G';
      });
      const field = genSel.closest('.field');
      if (field) field.classList.remove('is-invalid');
    });
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
    let selectedCN = '';

    // Tebalkan huruf/angka nama; simbol dan glyph lain pada template tetap utuh.
    function buildCN(name) {
      const cleanName = String(name || '').trim();
      const styledName = toBold(cleanName);
      const cns = (KSF.getCNs ? KSF.getCNs() : []) || [];
      return cns.map(c => String(c.tpl == null ? '' : c.tpl)
        .replace(/\{\{\s*name\s*\}\}/gi, styledName)
        .replace(/\bname\b/gi, styledName));
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
      if (!cnList.includes(selectedCN)) selectedCN = cnList[0] || '';
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
      selectedCN = text;
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

    // Buka undangan gen dan siapkan ringkasan untuk ditempel oleh pengguna.
    const joinBtn = $('#joinBtn');
    if (joinBtn) joinBtn.addEventListener('click', () => {
      const name = ($cnName.value || (reg && (reg.tiktok || reg.nama)) || '').trim();
      if (!name) { showToast('Nickname kosong', 'Bikin CN dulu sebelum bergabung.'); return; }
      if (!cnList.length) { cnList = buildCN(name); }
      if (!cnList.length) { showToast('Belum ada CN', 'Admin belum membuat bar CN. Coba lagi nanti ya.'); return; }

      const gens = (KSF.getGenerations ? KSF.getGenerations() : []) || [];
      const gen = gens.find(g => reg && g.id === reg.genId) || null;
      if (!gen || !gen.active) {
        showToast('Gen belum tersedia', 'Pilih gen yang sedang dibuka dari halaman Home.');
        return;
      }
      const link = safeExternalUrl(gen.link);
      if (!link) {
        showToast('Undangan belum tersedia', 'Link grup untuk gen ini belum diatur.');
        return;
      }

      const payload = {
        nama: reg ? reg.nama : '',
        tiktok: name,
        email: reg ? reg.email : '',
        gen: gen.name,
        alasan: reg ? reg.alasan : '',
        cns: cnList.slice(),
        cn1: cnList[0] || '', cn2: cnList[1] || '', cn3: cnList[2] || '',
        joinedAt: Date.now()
      };

      // Membuka undangan tidak dapat menekan tombol Join di WhatsApp untuk pengguna.
      window.open(link, '_blank', 'noopener,noreferrer');
      const message = [
        'Pendaftaran Kessoku Family',
        'Nama: ' + (payload.nama || '-'),
        'Akun: ' + (payload.tiktok || '-'),
        'Gen: ' + payload.gen,
        'Alasan: ' + (payload.alasan || '-'),
        'CN: ' + (selectedCN || payload.cn1 || '-')
      ].join('\n');
      const note = $('#joinNote');
      const copyResult = copyRegistrationMessage(message);
      const apiResult = KSF.apiConfigured && KSF.apiConfigured()
        ? KSF.apiSend('POST', '/join', payload).then(() => true).catch(() => false)
        : Promise.resolve(null);
      Promise.all([copyResult, apiResult]).then(([copied, stored]) => {
        let status = copied
          ? 'Undangan grup dibuka. Ringkasan tersalin; tempel di WhatsApp. Konfirmasi Join dilakukan di WhatsApp.'
          : 'Undangan grup dibuka. Salin ringkasan dari kotak yang muncul, lalu tempel di WhatsApp.';
        if (stored === true) status += ' Data formulir juga tercatat di database.';
        if (stored === false) status += ' Data belum tercatat di database.';
        if (note) note.textContent = status;
        showToast(copied ? 'Ringkasan disalin' : 'Undangan dibuka', copied
          ? 'Tempel pesan di WhatsApp untuk mengirimkannya.'
          : 'Salin ringkasan pendaftaran lalu tempel di WhatsApp.');
      });
    });

    async function copyRegistrationMessage(message) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(message); return true; } catch (e) { /* fallback */ }
      }
      const ta = document.createElement('textarea');
      ta.value = message; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (e) { /* fallback */ }
      ta.remove();
      if (!copied) window.prompt('Salin ringkasan ini untuk ditempel di WhatsApp:', message);
      return copied;
    }
  }

  /* ---------- Init ---------- */
  initThemePicker();
  applyLogo();
  initReveal();
  initCounters();
  onScroll();
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
