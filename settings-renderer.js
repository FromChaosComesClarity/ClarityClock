'use strict';

let settings = {};

async function init() {
    settings = await window.api.loadSettings();
    applyColorTheme(settings.colorTheme || 'CREMA');
    syncUI();
    buildThemePicker();
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

// ── Color theme accordion with swatches ────────────────────────────────────────
function buildThemePicker() {
    const picker   = document.getElementById('theme-picker');
    const active   = settings.colorTheme || 'CREMA';
    picker.innerHTML = '';

    Object.entries(CN_THEME_CATEGORIES).forEach(([cat, themes]) => {
        const hasActive = themes.includes(active);

        const header = document.createElement('button');
        header.className = `theme-acc-header${hasActive ? ' has-active' : ''}`;
        header.innerHTML = `<span>${cat}</span><span class="theme-acc-chevron">▶</span>`;

        const body = document.createElement('div');
        body.className = `theme-acc-body${hasActive ? ' open' : ''}`;
        if (hasActive) header.classList.add('open');

        themes.forEach(name => {
            const t   = CN_THEMES[name];
            const btn = document.createElement('button');
            btn.className = `theme-name-btn${name === active ? ' active' : ''}`;
            btn.dataset.theme = name;

            const swatch = document.createElement('span');
            swatch.className = 'theme-swatch';
            swatch.style.background  = t.bg;
            swatch.style.borderColor = t.accent;

            const label = document.createElement('span');
            label.textContent = name;

            btn.append(swatch, label);
            btn.addEventListener('click', () => {
                settings.colorTheme = name;
                applyColorTheme(name);
                window.api.applySettingLive('colorTheme', name);
                picker.querySelectorAll('.theme-name-btn').forEach(b => b.classList.remove('active'));
                picker.querySelectorAll('.theme-acc-header').forEach(h => {
                    h.classList.remove('has-active');
                    h.querySelector('span:first-child').style.color = '';
                });
                btn.classList.add('active');
                header.classList.add('has-active');
            });
            body.appendChild(btn);
        });

        header.addEventListener('click', () => {
            const isOpen = body.classList.contains('open');
            // Close all
            picker.querySelectorAll('.theme-acc-body').forEach(b => b.classList.remove('open'));
            picker.querySelectorAll('.theme-acc-header').forEach(h => h.classList.remove('open'));
            if (!isOpen) {
                body.classList.add('open');
                header.classList.add('open');
            }
        });

        picker.appendChild(header);
        picker.appendChild(body);
    });
}

// ── Wire controls ──────────────────────────────────────────────────────────────
function wireControls() {
    document.getElementById('btn-close').addEventListener('click', () => window.api.closeSettings());
    document.getElementById('btn-done').addEventListener('click',  () => window.api.closeSettings());

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
