const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { execFile, spawn } = require('child_process');

let baseDir = process.env.APPIMAGE ? path.dirname(process.env.APPIMAGE) : __dirname;

const settingsDir  = path.join(baseDir, 'GameManagerConfig', 'ClarityClock');
const settingsFile = path.join(settingsDir, 'settings.json');

const DEFAULTS = {
    theme:        'couch',
    kenBurns:     true,
    imageSource:  'all',
    alwaysOnTop:  true,
    colorTheme:   'Couch Mode',
    showGameName: true,
    uiFont:       'Sora',
};

const THEME_SIZES = {
    minimalist: { w: 400,  h: 160 },
    couch:      { w: 700,  h: 700 },
    kenburns:   { w: 900,  h: 560 },
};

function readSettings() {
    try {
        if (fs.existsSync(settingsFile))
            return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
    } catch {}
    return { ...DEFAULTS };
}

function writeSettings(s) {
    fs.mkdirSync(settingsDir, { recursive: true });
    fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
}

let win;
let settingsWin;

function createWindow() {
    const s = readSettings();
    const sz = THEME_SIZES[s.theme] || THEME_SIZES.minimalist;

    win = new BrowserWindow({
        width:       sz.w,
        height:      sz.h,
        minWidth:    260,
        minHeight:   100,
        frame:       false,
        transparent: true,
        alwaysOnTop: s.alwaysOnTop,
        resizable:   true,
        skipTaskbar: false,
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('load-settings', () => readSettings());

ipcMain.handle('get-app-version', () => { try { return app.getVersion(); } catch { return ''; } });

ipcMain.handle('set-theme-size', (_, theme) => {
    const sz = THEME_SIZES[theme] || THEME_SIZES.minimalist;
    if (win) win.setSize(sz.w, sz.h, true);
});

ipcMain.handle('set-always-on-top', (_, v) => {
    if (win) win.setAlwaysOnTop(v);
});

ipcMain.handle('apply-setting-live', (_, key, val) => {
    const s = readSettings();
    s[key] = val;
    writeSettings(s);

    if (key === 'theme') {
        const sz = THEME_SIZES[val] || THEME_SIZES.minimalist;
        if (win) win.setSize(sz.w, sz.h, true);
    }
    if (key === 'alwaysOnTop') {
        if (win) win.setAlwaysOnTop(val);
    }

    if (win) win.webContents.send('setting-applied', key, val);
});

// Add a launcher to the XDG application menu, mirroring Clarity's install-to-menu.
function installToMenu() {
    try {
        // Icon= cannot point inside the asar, so write a real file next to the AppImage.
        const iconsDir = path.join(baseDir, 'icons');
        fs.mkdirSync(iconsDir, { recursive: true });
        const iconPath = path.join(iconsDir, 'ClarityClock.svg');
        fs.writeFileSync(iconPath, fs.readFileSync(path.join(__dirname, 'assets', 'icons', 'ClarityClock.svg')));

        // Prefer the running AppImage; fall back to one sitting beside us.
        let exec = process.env.APPIMAGE;
        if (!exec) {
            const found = fs.readdirSync(baseDir).find(f => /^ClarityClock.*\.AppImage$/i.test(f));
            exec = found ? path.join(baseDir, found) : null;
        }
        if (!exec) return { success: false, message: 'ClarityClock.AppImage not found beside the app.' };
        try { fs.chmodSync(exec, 0o755); } catch {}

        const appsDir = path.join(os.homedir(), '.local', 'share', 'applications');
        fs.mkdirSync(appsDir, { recursive: true });
        fs.writeFileSync(path.join(appsDir, 'clarity-clock.desktop'),
            `[Desktop Entry]\nVersion=1.0\nType=Application\nName=Clarity Clock\n` +
            `Comment=A desk clock with taste — shows art from Clarity and EmuLatte.\n` +
            `Exec="${exec}"\nIcon=${iconPath}\nTerminal=false\nCategories=Utility;\n` +
            `Keywords=clock;time;desktop;widget;clarity;\nStartupWMClass=clarity_clock\n`);

        execFile('update-desktop-database', [appsDir], () => {});
        return { success: true, message: 'Added to your application menu.' };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

ipcMain.handle('install-to-menu', installToMenu);

ipcMain.on('open-settings-window', () => {
    if (settingsWin) { settingsWin.focus(); return; }

    settingsWin = new BrowserWindow({
        width:       560,
        height:      720,
        frame:       false,
        transparent: true,
        resizable:   false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload:          path.join(__dirname, 'settings-preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
        },
    });
    settingsWin.loadFile('settings.html');
    settingsWin.on('closed', () => { settingsWin = null; });
});

// Let the window's own 'closed' event be the only thing that clears settingsWin.
// Nulling it eagerly here opened a race: between close() and 'closed' firing, the guard
// in 'open-settings-window' saw null and built a second window, which the late 'closed'
// then orphaned — leaving a frameless, taskbar-less window whose Done and ✕ both
// no-op'd on a null reference, so it could not be closed at all.
ipcMain.on('settings-win-close', () => settingsWin?.close());

ipcMain.on('win-minimize', () => win?.minimize());
ipcMain.on('win-close',    () => win?.close());

// Convert any absolute path to a safe file:// URL (mirrors Couch Mode's convertSafePath).
// Electron can serve asar-bundled files only when addressed via file://.
function toFileUrl(p) {
    const normalized = p.replace(/\\/g, '/');
    const abs = normalized.startsWith('/') ? normalized : '/' + normalized;
    return 'file://' + encodeURI(abs).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

// Open a game in the app that owns it. Both apps take --game=<id>; each already holds a
// single-instance lock, so a second launch is forwarded to the running window rather
// than starting a rival copy. Requires the sibling AppImage to sit beside ours.
ipcMain.handle('open-game', (_, app_, id) => {
    const pattern = app_ === 'emulatte' ? /^EmuLatte.*\.AppImage$/i : /^Clarity(?!Clock).*\.AppImage$/i;
    let file;
    try { file = fs.readdirSync(baseDir).find(f => pattern.test(f)); } catch {}
    if (!file) return { success: false, message: `${app_ === 'emulatte' ? 'EmuLatte' : 'Clarity'} not found beside the clock.` };

    const target = path.join(baseDir, file);
    try { fs.chmodSync(target, 0o755); } catch {}
    try {
        const child = spawn(target, id != null ? [`--game=${id}`] : [], { detached: true, stdio: 'ignore' });
        child.unref();
        return { success: true };
    } catch (err) {
        return { success: false, message: err.message };
    }
});

// ── Resolving art back to a game ──────────────────────────────────────────────
// Art filenames already identify the game: EmuLatte writes every file as
// <romId>_<type>, and Clarity uses either <gameId>_<store>_<type>_<stamp> or the game's
// own title with the characters its getBeautifulName() strips. We read both databases
// *read-only*, purely to turn that into a real title and an id the owning app can open.
// Both are optional — a clock sitting on its own has neither, and simply shows no label.
const CLARITY_DB = () => path.join(baseDir, 'GameManagerConfig', 'games.db');
const EMU_DB  = () => path.join(baseDir, 'GameManagerConfig', 'EmuLatte', 'emulatte.db');

let _maps = null;

// Clarity strips these when naming art; mirror it so titles match back.
const beautify = s => s.replace(/[\\/:*?"<>|#]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

function readGameMaps() {
    if (_maps) return _maps;
    _maps = { clarityById: new Map(), clarityByName: new Map(), emuById: new Map() };

    let DatabaseSync;
    try { ({ DatabaseSync } = require('node:sqlite')); } catch { return _maps; }

    const load = (file, sql, onRow) => {
        if (!fs.existsSync(file)) return;
        let db;
        try {
            db = new DatabaseSync(file, { readOnly: true });
            for (const row of db.prepare(sql).all()) onRow(row);
        } catch {
            // Locked, mid-write or an unexpected schema — labels are a nicety, never fatal.
        } finally {
            try { db?.close(); } catch {}
        }
    };

    load(CLARITY_DB(), 'SELECT id, Game FROM games WHERE Game IS NOT NULL', r => {
        _maps.clarityById.set(Number(r.id), r.Game);
        _maps.clarityByName.set(beautify(String(r.Game)), Number(r.id));
    });
    load(EMU_DB(), 'SELECT id, title FROM games WHERE title IS NOT NULL', r => {
        _maps.emuById.set(Number(r.id), r.title);
    });

    return _maps;
}

// Returns { app, id, name } — name '' when nothing matched, so the label stays hidden.
function resolveGame(stem, src) {
    const m = readGameMaps();

    if (src === 'emulatte') {
        // <romId>_<type>, or a bare <romId>.
        const lead = stem.match(/^(\d+)(?:_|$)/);
        const id   = lead ? Number(lead[1]) : null;
        const name = id !== null ? m.emuById.get(id) : null;
        return name ? { app: 'emulatte', id, name } : { app: 'emulatte', id: null, name: '' };
    }

    // Clarity: <gameId>_<store>_<type>_<stamp> is exact. The trailing underscore matters —
    // without it a title like "1000xRESIST" would be read as game id 1000.
    const lead = stem.match(/^(\d+)_/);
    if (lead && m.clarityById.has(Number(lead[1]))) {
        const id = Number(lead[1]);
        return { app: 'clarity', id, name: m.clarityById.get(id) };
    }

    // Strip the type suffix and any scraper tag the type regex leaves behind.
    const base  = stem.replace(/[\s_-]*(cover|hero|screen(?:shot)?|logo)[\s_\d-]*$/i, '');
    const title = base.replace(/[_-]+/g, ' ').replace(/\s+(sgdb|custom)$/i, '').replace(/\s+/g, ' ').trim();
    const id    = m.clarityByName.get(beautify(title));
    if (id !== undefined) return { app: 'clarity', id, name: m.clarityById.get(id) };

    // No match — art for a game that was renamed or removed. Still label it from the
    // filename so it can be clicked; without an id the click just opens the library.
    return { app: 'clarity', id: null, name: title };
}

function scanImages(source) {
    const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    const imgs = [];

    const walk = (dir, src) => {
        if (!fs.existsSync(dir)) return;
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                walk(full, src);
            } else if (EXTS.has(path.extname(e.name).toLowerCase())) {
                const parent = path.basename(dir).toLowerCase();
                const name   = e.name.toLowerCase();
                if (name.includes('_p8_')) continue;
                const typeFromDir  = parent.includes('cover')     ? 'covers'
                                   : parent.includes('hero')      ? 'heroes'
                                   : parent.includes('screen')    ? 'screenshots'
                                   : parent.includes('logo')      ? 'logos'
                                   : parent.includes('wallpaper') ? 'wallpapers'
                                   : null;
                const typeFromFile = name.includes('cover')    ? 'covers'
                                   : name.includes('hero')     ? 'heroes'
                                   : name.includes('screen')   ? 'screenshots'
                                   : name.includes('logo')     ? 'logos'
                                   : 'other';
                const type = typeFromDir || typeFromFile;

                // The owning app's database gives the real title and the id it can open.
                const stem = path.basename(e.name, path.extname(e.name));
                const g    = src === 'wallpapers'
                    ? { app: null, id: null, name: '' }
                    : resolveGame(stem, src);

                imgs.push({ path: toFileUrl(full), type, name: g.name, app: g.app, gameId: g.id });
            }
        }
    };

    // Clarity: flat images dir, all types mixed
    walk(path.join(baseDir, 'GameManagerConfig', 'images'), 'clarity');
    // EmuLatte: structured subdirs
    walk(path.join(baseDir, 'GameManagerConfig', 'EmuLatte', 'images'), 'emulatte');
    // User-provided wallpapers alongside the AppImage
    walk(path.join(baseDir, 'GameManagerConfig', 'wallpapers'), 'wallpapers');

    if (source && source !== 'all')
        return imgs.filter(x => x.type === source);

    // "all" = game art only; logos and wallpapers are opt-in via their own buttons
    return imgs.filter(x => x.type !== 'logos' && x.type !== 'wallpapers');
}

ipcMain.handle('scan-images', (_, source) => scanImages(source));
