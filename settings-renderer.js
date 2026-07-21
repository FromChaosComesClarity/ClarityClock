'use strict';

let settings = {};

async function init() {
    settings = await window.api.loadSettings();
    applyColorTheme(settings.colorTheme || 'CREMA');
    applyUiFont(settings.uiFont);
    syncUI();
    syncThemeTrigger();
    buildThemeModal();
    buildFontModal();
    wireControls();
    showVersion();
    if (settings.imageSource === 'wallpapers') checkWallpapers();
}

// ── About ──────────────────────────────────────────────────────────────────────
async function showVersion() {
    const v = await window.api.getAppVersion();
    document.getElementById('about-version').textContent = v ? `VERSION ${v}` : '';
}

// ── Color theme ────────────────────────────────────────────────────────────────
function applyColorTheme(name) {
    const t = CN_THEMES[name];
    if (!t) return;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
}

// ── Sync button states ─────────────────────────────────────────────────────────
function syncUI() {
    ['minimalist', 'crema', 'kenburns'].forEach(t =>
        document.getElementById(`s-theme-${t}`)?.classList.toggle('active', settings.theme === t));

    const isKbTheme = settings.theme === 'kenburns';
    document.getElementById('s-kb-row').style.opacity = isKbTheme ? '0.45' : '1';
    document.getElementById('s-kb-off')?.classList.toggle('active', !settings.kenBurns && !isKbTheme);
    document.getElementById('s-kb-on')?.classList.toggle('active',  settings.kenBurns || isKbTheme);

    ['all', 'heroes', 'covers', 'screenshots', 'wallpapers'].forEach(src =>
        document.getElementById(`s-src-${src}`)?.classList.toggle('active', settings.imageSource === src));

    document.getElementById('s-gamename-off')?.classList.toggle('active', !settings.showGameName);
    document.getElementById('s-gamename-on')?.classList.toggle('active',   settings.showGameName);
}

// ── Wallpapers hint ────────────────────────────────────────────────────────────
async function checkWallpapers() {
    const hint = document.getElementById('wallpapers-hint');
    const imgs  = await window.api.scanImages('wallpapers');
    hint.style.display = imgs.length ? 'none' : 'block';
}

// ── Interface font ─────────────────────────────────────────────────────────────
function applyUiFont(name) {
    const font = CN_FONTS.some(f => f.name === name) ? name : 'Raleway';
    document.documentElement.style.setProperty('--ui-font', `'${font}', sans-serif`);
    settings.uiFont = font;
    const label = document.getElementById('font-open-name');
    if (label) {
        label.textContent = font;
        label.style.fontFamily = `'${font}', sans-serif`;   // trigger previews the choice
    }
}

// ── Modal plumbing ─────────────────────────────────────────────────────────────
// Every close path — ✕, backdrop, Escape — goes through closeModal so a modal can
// never be left half-open with its overlay still swallowing clicks.
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function topmostModal()  {
    const open = [...document.querySelectorAll('.cn-modal.active')];
    return open.length ? open[open.length - 1].id : null;
}

// ── Color theme modal ──────────────────────────────────────────────────────────
function buildThemeModal() {
    const cats = document.getElementById('theme-cats');
    cats.innerHTML = '';

    const filters = ['All', ...Object.keys(CN_THEME_CATEGORIES)];
    filters.forEach((cat, i) => {
        const chip = document.createElement('button');
        chip.className = `cn-chip${i === 0 ? ' active' : ''}`;
        chip.textContent = cat;
        chip.addEventListener('click', () => {
            cats.querySelectorAll('.cn-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderThemeCards(cat);
        });
        cats.appendChild(chip);
    });

    renderThemeCards('All');
}

function renderThemeCards(cat) {
    const grid   = document.getElementById('theme-grid');
    const active = settings.colorTheme || 'CREMA';
    const names  = cat === 'All'
        ? Object.values(CN_THEME_CATEGORIES).flat()
        : (CN_THEME_CATEGORIES[cat] || []);

    grid.innerHTML = '';
    document.getElementById('theme-count').textContent =
        `${names.length} palette${names.length === 1 ? '' : 's'}`;

    names.forEach(name => {
        const t = CN_THEMES[name];
        if (!t) return;

        // Each card previews the palette using the palette's own colours.
        const card = document.createElement('div');
        card.className = `theme-card${name === active ? ' active' : ''}`;
        card.title = name;

        const inner = document.createElement('div');
        inner.className = 'theme-card-inner';
        inner.style.background = t.bg;

        const bar = document.createElement('div');
        bar.className = 'theme-card-bar';
        bar.style.background  = t.bg_menu;
        bar.style.borderColor = t.border_solid;

        const label = document.createElement('div');
        label.className = 'theme-card-name';
        label.style.color = t.accent;
        label.textContent = name;
        bar.appendChild(label);

        const row = document.createElement('div');
        row.className = 'theme-card-row';
        const dot = document.createElement('span');
        dot.className = 'theme-card-dot';
        dot.style.background = t.accent;
        const aa = document.createElement('span');
        aa.style.cssText = `font-size:9px; color:${t.text_sec};`;
        aa.textContent = 'Aa';
        const bb = document.createElement('span');
        bb.style.cssText = `font-size:9px; margin-left:auto; color:${t.text_dim};`;
        bb.textContent = 'Bb';
        row.append(dot, aa, bb);

        inner.append(bar, row);
        card.appendChild(inner);

        card.addEventListener('click', () => {
            settings.colorTheme = name;
            applyColorTheme(name);
            window.api.applySettingLive('colorTheme', name);
            grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            syncThemeTrigger();
        });

        grid.appendChild(card);
    });
}

function syncThemeTrigger() {
    const name = settings.colorTheme || 'CREMA';
    const t    = CN_THEMES[name];
    document.getElementById('theme-open-name').textContent = name;
    const sw = document.getElementById('theme-open-swatch');
    // Split chip: a dark palette's bg alone would read as an empty box, so show
    // the accent alongside it.
    if (t) {
        sw.style.background  = `linear-gradient(135deg, ${t.bg} 0 50%, ${t.accent} 50% 100%)`;
        sw.style.borderColor = t.border_solid;
    }
}

// ── Interface font modal ───────────────────────────────────────────────────────
function buildFontModal() {
    const list = document.getElementById('font-list');
    list.innerHTML = '';

    CN_FONTS.forEach(f => {
        const card = document.createElement('button');
        card.className = `font-card${f.name === settings.uiFont ? ' active' : ''}`;
        card.style.fontFamily = `'${f.name}', sans-serif`;   // preview in its own face

        const name = document.createElement('span');
        name.className = 'font-card-name';
        name.textContent = f.label;

        const sample = document.createElement('span');
        sample.className = 'font-card-sample';
        sample.textContent = '00:00 · 21 JUL';

        card.append(name, sample);
        card.addEventListener('click', () => {
            applyUiFont(f.name);
            window.api.applySettingLive('uiFont', f.name);
            list.querySelectorAll('.font-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });

        list.appendChild(card);
    });
}

// ── Wire controls ──────────────────────────────────────────────────────────────
function wireControls() {
    document.getElementById('btn-close').addEventListener('click', () => window.api.closeSettings());
    document.getElementById('btn-done').addEventListener('click',  () => window.api.closeSettings());

    // Pickers — open, close by ✕, and close by clicking the backdrop (but not the box).
    document.getElementById('btn-theme-open').addEventListener('click', () => openModal('modal-themes'));
    document.getElementById('btn-font-open').addEventListener('click',  () => openModal('modal-fonts'));
    document.getElementById('btn-close-themes').addEventListener('click', () => closeModal('modal-themes'));
    document.getElementById('btn-close-fonts').addEventListener('click',  () => closeModal('modal-fonts'));
    ['modal-themes', 'modal-fonts'].forEach(id => {
        const overlay = document.getElementById(id);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(id); });
    });

    // Escape closes the topmost open picker; only if none is open does it close the window.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const top = topmostModal();
        if (top) closeModal(top);
        else window.api.closeSettings();
    });

    ['minimalist', 'crema', 'kenburns'].forEach(t =>
        document.getElementById(`s-theme-${t}`)?.addEventListener('click', () => {
            settings.theme = t;
            window.api.applySettingLive('theme', t);
            syncUI();
        }));

    document.getElementById('s-kb-off')?.addEventListener('click', () => {
        if (settings.theme === 'kenburns') return;
        settings.kenBurns = false;
        window.api.applySettingLive('kenBurns', false);
        syncUI();
    });

    document.getElementById('s-kb-on')?.addEventListener('click', () => {
        if (settings.theme === 'kenburns') return;
        settings.kenBurns = true;
        window.api.applySettingLive('kenBurns', true);
        syncUI();
    });

    ['all', 'heroes', 'covers', 'screenshots', 'wallpapers'].forEach(src =>
        document.getElementById(`s-src-${src}`)?.addEventListener('click', async () => {
            settings.imageSource = src;
            window.api.applySettingLive('imageSource', src);
            syncUI();
            if (src === 'wallpapers') checkWallpapers();
            else document.getElementById('wallpapers-hint').style.display = 'none';
        }));

    document.getElementById('s-gamename-off')?.addEventListener('click', () => {
        settings.showGameName = false;
        window.api.applySettingLive('showGameName', false);
        syncUI();
    });

    document.getElementById('s-gamename-on')?.addEventListener('click', () => {
        settings.showGameName = true;
        window.api.applySettingLive('showGameName', true);
        syncUI();
    });
}

init();
