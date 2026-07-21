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
    // `font` is not a colour token — the Systems palettes carry their era typeface here.
    // Setting it blindly would create a useless --font and never apply the face.
    Object.entries(t).forEach(([k, v]) => { if (k !== 'font') root.style.setProperty(`--${k}`, v); });
    settings.colorTheme = name;
    applyUiFont(settings.uiFont);   // re-resolve: an era font wins while its palette is active
}

// ── Interface font ─────────────────────────────────────────────────────────────
// The picker's choice is what gets stored; a Systems palette's era face overrides it
// on screen for as long as that palette is selected.
function applyUiFont(name) {
    const font      = CN_FONTS.some(f => f.name === name) ? name : 'Sora';
    const themeFont = (CN_THEMES[settings.colorTheme] || {}).font;
    document.documentElement.style.setProperty('--ui-font', `'${themeFont || font}', sans-serif`);
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
            kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '', app: x.app || '', gameId: x.gameId })));
            // With no art on disk there is nothing to reveal, and switching the layer on
            // would lay the readability gradient over an empty background.
            setKBVisible(kbImages.length > 0);
        });
    } else {
        setKBVisible(kbOn);
    }
}

// ── Game name label ────────────────────────────────────────────────────────────
function showGameLabel(name, app, gameId) {
    if (!settings.showGameName || !name || /^\d+$/.test(name.trim())) return;
    const el     = document.getElementById('kb-game-label');
    const nameEl = document.getElementById('kb-game-name');
    if (!el || !nameEl) return;
    // Remembered here so a click always refers to the image currently on screen.
    el.dataset.app    = app || '';
    el.dataset.gameId = gameId == null ? '' : String(gameId);
    el.title = app === 'emulatte' ? `Open ${name} in EmuLatte` : `Open ${name} in Cafe Neurotico`;
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
        el.dataset.name   = img.name || '';
        el.dataset.app    = img.app || '';
        el.dataset.gameId = img.gameId == null ? '' : String(img.gameId);
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
            showGameLabel(el.dataset.name, el.dataset.app, el.dataset.gameId);
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
            showGameLabel(el.dataset.name, el.dataset.app, el.dataset.gameId);
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
                    kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '', app: x.app || '', gameId: x.gameId })));
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
                    kbImages = shuffle(imgs.map(x => ({ path: x.path, name: x.name || '', app: x.app || '', gameId: x.gameId })));
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
                if (visEl?.dataset.name) showGameLabel(visEl.dataset.name, visEl.dataset.app, visEl.dataset.gameId);
            }
        }
    });
}

// ── Wire Controls ──────────────────────────────────────────────────────────────
function wireControls() {
    document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimize());
    document.getElementById('btn-close').addEventListener('click',    () => window.api.close());
    document.getElementById('btn-settings').addEventListener('click', () => window.api.openSettingsWindow());

    // Click the game name to open it where it lives. Without a resolved id the app
    // still opens, just at its library.
    document.getElementById('kb-game-label').addEventListener('click', async () => {
        const el  = document.getElementById('kb-game-label');
        const app = el.dataset.app;
        if (!app) return;
        const id  = el.dataset.gameId === '' ? null : Number(el.dataset.gameId);
        const res = await window.api.openGame(app, id);
        if (!res?.success) {
            // The sibling AppImage isn't beside us — say so on the label itself rather
            // than failing silently, then put the name back.
            const nameEl = document.getElementById('kb-game-name');
            const prev   = nameEl.textContent;
            nameEl.textContent = res?.message || 'Could not open';
            setTimeout(() => { nameEl.textContent = prev; }, 2600);
        }
    });
}

init();
