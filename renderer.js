'use strict';

let settings          = { theme: 'minimalist', kenBurns: false, imageSource: 'all', alwaysOnTop: true, colorTheme: 'CREMA', showGameName: false, uiFont: 'Sora' };
let kbImages          = [];
let kbIndex           = 0;
let kbActive          = 'a';
let kbTimer           = null;
let _labelHideHandler = null;

const KB_INTERVAL = 12000;
const BASE_W = { minimalist: 400, crema: 700, kenburns: 900 };

// ── Boot ───────────────────────────────────────────────────────────────────────
async function init() {
    settings = await window.api.loadSettings();
    applyColorTheme(settings.colorTheme || 'CREMA');
    applyUiFont(settings.uiFont);
    // applyTheme already scans and starts the slideshow when the theme needs it.
    // Repeating that here walked the whole art library a second time on every launch.
    applyTheme(settings.theme);
    startClock();

    wireControls();
    setupResizeObserver();
    setupSettingListener();
}

// ── Clock ──────────────────────────────────────────────────────────────────────
function startClock() {
    tick();
    setInterval(tick, 1000);
}

function tick() {
    const now    = new Date();
    const pad    = n => String(n).padStart(2, '0');
    const DAYS   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    document.getElementById('time-main').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    document.getElementById('time-secs').textContent = `:${pad(now.getSeconds())}`;
    document.getElementById('date-line').textContent  =
        `${pad(now.getDate())} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const dayEl = document.getElementById('day-line');
    if (dayEl) dayEl.textContent = DAYS[now.getDay()];
}

// ── Dynamic font scale ─────────────────────────────────────────────────────────
function updateClockScale() {
    const w    = document.getElementById('app').offsetWidth || (BASE_W[settings.theme] || 400);
    const base = BASE_W[settings.theme] || 400;
    document.documentElement.style.setProperty('--clock-scale', (w / base).toFixed(4));
}

function setupResizeObserver() {
    const ro = new ResizeObserver(updateClockScale);
    ro.observe(document.getElementById('app'));
}

// ── Color theme ────────────────────────────────────────────────────────────────
function applyColorTheme(name) {
    const t = CN_THEMES[name];
    if (!t) return;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
    settings.colorTheme = name;
}

// ── Interface font ─────────────────────────────────────────────────────────────
function applyUiFont(name) {
    const font = CN_FONTS.some(f => f.name === name) ? name : 'Sora';
    document.documentElement.style.setProperty('--ui-font', `'${font}', sans-serif`);
    settings.uiFont = font;
}

// ── Visual theme ───────────────────────────────────────────────────────────────
function applyTheme(theme) {
    const app = document.getElementById('app');
    app.classList.remove('theme-minimalist', 'theme-crema', 'theme-kenburns');
    app.classList.add(`theme-${theme}`);
    settings.theme = theme;
    updateClockScale();

    const kbOn = theme === 'kenburns' || settings.kenBurns;
    if (kbOn && kbImages.length === 0) {
        window.api.scanImages(settings.imageSource).then(imgs => {
            kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '' })));
            // With no art on disk there is nothing to reveal, and switching the layer on
            // would lay the readability gradient over an empty background.
            setKBVisible(kbImages.length > 0);
        });
    } else {
        setKBVisible(kbOn);
    }
}

// ── Game name label ────────────────────────────────────────────────────────────
function showGameLabel(name) {
    if (!settings.showGameName || !name || /^\d+$/.test(name.trim())) return;
    const el     = document.getElementById('kb-game-label');
    const nameEl = document.getElementById('kb-game-name');
    if (!el || !nameEl) return;
    // Cancel any in-flight hide transition so it can't overwrite display:block below.
    if (_labelHideHandler) {
        el.removeEventListener('transitionend', _labelHideHandler);
        _labelHideHandler = null;
    }
    nameEl.textContent = name;
    el.style.display   = 'block';
    requestAnimationFrame(() => el.classList.add('visible'));
}

function hideGameLabel() {
    const el = document.getElementById('kb-game-label');
    if (!el) return;
    el.classList.remove('visible');
    _labelHideHandler = () => { el.style.display = 'none'; _labelHideHandler = null; };
    el.addEventListener('transitionend', _labelHideHandler, { once: true });
}

// ── Ken Burns ──────────────────────────────────────────────────────────────────
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }
function randomV()    { return `v${1 + Math.floor(Math.random() * 4)}`; }

function setKBVisible(on) {
    document.getElementById('app').classList.toggle('kb-on', on);
    if (on) { if (!kbTimer) startKB(); }
    else    { stopKB(); }
}

// Load the next image into `el`, skipping any that fail.
// Only calls `onReady(el)` once a valid image has actually loaded.
function loadNextInto(el, onReady, attempt = 0) {
    if (attempt >= kbImages.length) return; // no valid image found in full list
    const img = kbImages[kbIndex];
    kbIndex = (kbIndex + 1) % kbImages.length;

    // Hard-reset: kill transition so removing 'visible' doesn't animate
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.className        = 'kb-img';

    el.onload = () => {
        el.onload = el.onerror = null;
        el.style.transition = '';
        el.style.opacity    = '';
        el.classList.add(randomV()); // animation starts now, independent of visible
        el.dataset.name = img.name || '';
        onReady(el);
    };
    el.onerror = () => {
        el.onload = el.onerror = null;
        loadNextInto(el, onReady, attempt + 1);
    };

    el.src = img.path;
}

function startKB() {
    if (!kbImages.length) return;
    kbActive = 'a';
    loadNextInto(document.getElementById('kb-img-a'), el => {
        requestAnimationFrame(() => {
            el.classList.add('visible');
            showGameLabel(el.dataset.name);
        });
        kbTimer = setInterval(crossfadeKB, KB_INTERVAL);
    });
}

function stopKB() {
    clearInterval(kbTimer);
    kbTimer = null;
    hideGameLabel();
    ['kb-img-a', 'kb-img-b'].forEach(id => {
        const el = document.getElementById(id);
        el.onload = el.onerror = null;
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.className        = 'kb-img';
        el.src              = '';
    });
}

function crossfadeKB() {
    if (!kbImages.length) return;

    const nextActive = kbActive === 'a' ? 'b' : 'a';
    const inEl  = document.getElementById(nextActive === 'a' ? 'kb-img-a' : 'kb-img-b');
    if (inEl.onload) return; // already loading from a previous tick, skip

    const outEl = document.getElementById(kbActive === 'a' ? 'kb-img-a' : 'kb-img-b');
    kbActive = nextActive;

    loadNextInto(inEl, el => {
        requestAnimationFrame(() => {
            el.classList.add('visible');
            showGameLabel(el.dataset.name);
            // Begin fading out the old image after the new one is fully visible,
            // then hard-reset it once the CSS fade-out (1.5s) is done.
            // setTimeout is used instead of transitionend — more reliable; transitionend
            // can silently fail if the transition is interrupted, leaving a stale listener
            // that resets the element the next time its opacity transition fires.
            setTimeout(() => {
                outEl.classList.remove('visible');
                setTimeout(() => {
                    outEl.style.transition = 'none';
                    outEl.style.opacity    = '0';
                    outEl.className        = 'kb-img';
                }, 1550);
            }, 1500);
        });
    });
}

// ── Live settings from settings window ────────────────────────────────────────
function setupSettingListener() {
    window.api.onSettingChanged((key, val) => {
        if (key === 'theme') {
            applyTheme(val);
        }
        if (key === 'kenBurns') {
            settings.kenBurns = val;
            const kbOn = val || settings.theme === 'kenburns';
            if (kbOn && !kbImages.length) {
                window.api.scanImages(settings.imageSource).then(imgs => {
                    kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '' })));
                    setKBVisible(true);
                });
            } else {
                setKBVisible(kbOn);
            }
        }
        if (key === 'imageSource') {
            settings.imageSource = val;
            const kbRunning = settings.theme === 'kenburns' || settings.kenBurns;
            if (kbRunning) {
                const wasRunning = !!kbTimer;
                stopKB();
                window.api.scanImages(val).then(imgs => {
                    kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '' })));
                    kbIndex  = 0;
                    if (wasRunning || settings.theme === 'kenburns') startKB();
                });
            }
        }
        if (key === 'colorTheme') {
            applyColorTheme(val);
        }
        if (key === 'uiFont') {
            applyUiFont(val);
            updateClockScale();   // metrics differ per face; rescale to the new one
        }
        if (key === 'showGameName') {
            settings.showGameName = val;
            if (!val) {
                hideGameLabel();
            } else {
                const visEl = document.querySelector('.kb-img.visible');
                if (visEl?.dataset.name) showGameLabel(visEl.dataset.name);
            }
        }
    });
}

// ── Wire Controls ──────────────────────────────────────────────────────────────
function wireControls() {
    document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimize());
    document.getElementById('btn-close').addEventListener('click',    () => window.api.close());
    document.getElementById('btn-settings').addEventListener('click', () => window.api.openSettingsWindow());
}

init();
