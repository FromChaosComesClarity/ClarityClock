<div align="center">

<img src="assets/icons/CNClock.svg" width="128" alt="Cafe Neurotico Clock"/>

<br>

# C A F E &nbsp; N E U R O T I C O &nbsp; C L O C K

**A floating desktop clock for the obsessively caffeinated.**

*Reads your game library. Wears your colors. Runs as many times as you want.*

<br>

[![Version 1.0](https://img.shields.io/badge/Version-1.0-D4A373?style=flat-square&labelColor=2C1E16)](https://github.com/shampoo-is-a-lie/CafeNeuroticoClock/releases/latest)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-8B5A2B?style=flat-square&labelColor=2C1E16)](LICENSE)
[![Platform: Linux](https://img.shields.io/badge/Platform-Linux-D4A373?style=flat-square&labelColor=2C1E16)](https://github.com/shampoo-is-a-lie)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%2041-A47148?style=flat-square&labelColor=2C1E16)](https://electronjs.org)
[![Part of CN Ecosystem](https://img.shields.io/badge/Part%20of-Cafe%20Neurotico-D4A373?style=flat-square&labelColor=432818)](https://github.com/shampoo-is-a-lie)

</div>

<br>

---

<br>

## ◈ &nbsp; What It Is

A lightweight, frameless clock widget that lives on your Linux desktop. It pulls game art directly from your **CNGM** and **EmuLatte** libraries to run as a Ken Burns slideshow backdrop, and it speaks the same visual language as the rest of the Cafe Neurotico ecosystem — 58 color palettes, warm typography, no decorations that weren't earned.

It's small enough to tuck into a corner. Beautiful enough to leave in the middle of your screen.

<br>

---

<br>

## ◈ &nbsp; Multiple Instances

> **Run as many clocks as you want, simultaneously.**

Launch the AppImage multiple times — each running instance is independent. Give each one a different visual theme, a different color palette, a different size. Park one in a corner of your main monitor showing the time in **Minimalist** mode. Open another on your secondary screen in **Ken Burns** mode cycling through game art. Stack a third in CREMA Splash if you just want something large and atmospheric.

No configuration needed. Just launch it again.

```bash
./CafeNeuroticoClock.AppImage &
./CafeNeuroticoClock.AppImage &
./CafeNeuroticoClock.AppImage &
```

Each instance has its own settings window, and changing a setting in one never disturbs the others while they're running.

> **One saved configuration, shared.** All instances read and write the same
> `GameManagerConfig/CafeNeuroticoClock/settings.json`. Your per-window arrangement lives only for
> as long as those windows do — the next launch starts every clock from whichever settings were
> written last. Arrange them freely at runtime; just don't expect the arrangement to survive a
> restart.

<br>

---

<br>

## ◈ &nbsp; Visual Themes

Three distinct presentations — each resizable, each adapting to your chosen color palette:

<br>

```
┌─────────────────────────────────────────────────────────┐
│  MINIMALIST   Small floating widget. Dashed border.     │
│               Semi-transparent bg tinted by color       │
│               theme. Stays out of your way.             │
│               400 × 160  (default)                      │
├─────────────────────────────────────────────────────────┤
│  CREMA        Full-window dark splash. A large frosted  │
│  SPLASH  ★   glass circle frames the clock, blurring   │
│               the art behind it. 700 × 700  (default)   │
├─────────────────────────────────────────────────────────┤
│  KEN BURNS    Game art fills the window. Smooth         │
│               pan-and-zoom crossfades. Clock centered   │
│               over a dark gradient overlay.             │
│               900 × 560  (default)                      │
└─────────────────────────────────────────────────────────┘
```

★ Default theme on first launch.

All windows are **freely resizable** — the clock text scales proportionally with the window.

<br>

---

<br>

## ◈ &nbsp; Color Themes

**58 palettes** organized across 7 categories. Applied live — no restart.

| Category | Themes |
|:---|:---|
| **Originals & System** | DARK GRAY · CREMA · CYBERPUNK · SNOW · MOVIESFLIX · VAPOUR OS · PSIV BLUE · GREEN BOX · WIN XP |
| **Gaming Legends** | GAME BOY DMG · PIP BOY · SEVASTOPOL · RIP AND TEAR CLASSIC · SUPER BROTHERS · GREEN HILL · NES · SNES · BLOODBORNE · METROID PRIME · SILENT HILL · DIABLO · HALF-LIFE · SHOVEL KNIGHT |
| **Aesthetics** | EARTHY & ORGANIC · DOPAMINE BRIGHTS · RETRO REVIVAL · VAPORWAVE · AURORA · NOIR · BIOLUMINESCENCE · BRUTALIST |
| **Linux Ricing** | DRACULA · GRUVBOX · NORD · SOLARIZED DARK · CATPPUCCIN (3 flavors) · TOKYO NIGHT · EVERFOREST · ROSÉ PINE · OXOCARBON · MATERIAL DARK |
| **Sci-Fi Universes** | N7 · TRON LEGACY · DEAD SPACE · COLONY SHIP · NECROMORPH |
| **Horror Realm** | CRIMSON PEAK · LAKESIDE CURSE · THE BACKROOMS |
| **PSIII Colors** | CLASSIC · RED · GREEN · BLUE · PURPLE · GOLD · SILVER |

The color theme also affects the Minimalist widget background — each palette tints the transparency to match its own `bg` color.

<br>

---

<br>

## ◈ &nbsp; Art Slideshow

When the Ken Burns effect is enabled, the clock reads images from:

- `GameManagerConfig/images/` — CNGM game art (heroes, covers, screenshots)
- `GameManagerConfig/EmuLatte/images/` — EmuLatte art, organized by platform
- `GameManagerConfig/wallpapers/` — your own wallpapers, dropped here alongside the AppImage

Images are classified by filename and directory. You can narrow the source to a single category — **Heroes**, **Covers**, **Screenshots**, or **Wallpapers** — or leave it on **All** for the full library.

Enable **Show Game Name** in settings to display a label with the game title while each image is shown.

<br>

---

<br>

## ◈ &nbsp; Installation

### From a Release

```bash
# Download CafeNeuroticoClock.AppImage from the Releases page, then:
chmod +x CafeNeuroticoClock.AppImage
./CafeNeuroticoClock.AppImage
```

Place it alongside your CNGM installation (e.g. `~/Games/CNGM/`) so it can find the game art automatically.

<br>

### Building from Source

```bash
git clone https://github.com/shampoo-is-a-lie/CafeNeuroticoClock
cd CafeNeuroticoClock
npm install
npm start          # run in development
npm run dist       # build AppImage and deploy to ~/Games/CNGM/
```

The `postdist` script deploys the AppImage to `~/Games/CNGM/` automatically.

<br>

---

<br>

## ◈ &nbsp; Settings

Open with the **⚙** button (top-right of any clock window).

| Setting | Options | Default | Description |
|:---|:---|:---|:---|
| **Visual Theme** | Minimalist · CREMA Splash · Ken Burns | CREMA Splash | Changes window layout and size |
| **Art Slideshow** | Off · On | On | Enables the KB background on Minimalist and CREMA themes |
| **Image Source** | All · Heroes · Covers · Screenshots · Wallpapers | All | Filters which images appear in the slideshow |
| **Show Game Name** | Off · On | On | Displays the game title while each image is on screen |
| **Color Theme** | 58 palettes | CREMA | Live preview — the settings window recolors itself too |

<br>

---

<br>

## ◈ &nbsp; Language

The interface is **English only**. There are perhaps thirty user-facing strings in the whole app, so a translation is cheap to add later — open an issue if you want one.

<br>

---

<br>

## ◈ &nbsp; Privacy

No network access, no telemetry, no accounts, no runtime dependencies. Fonts are bundled with the AppImage rather than fetched. The only file the clock ever writes is its own `settings.json`.

<br>

---

<br>

## ◈ &nbsp; The Cafe Neurotico Ecosystem

```
  CNGM           Central hub — PC game library, store sync, launches all companion apps
    │
    ├──▸  CREMA       Fullscreen / gamepad counterpart for CNGM + EmuLatte
    │
    ├──▸  GRINDER     GOG & Epic install engine — feeds games back into CNGM
    │
    ├──▸  EmuLatte    ROM library manager — emulation counterpart to CNGM
    │
    └──▸  CN Clock ◈  Floating desktop clock — shows art from CNGM + EmuLatte
```

CN Clock reads game art from wherever CNGM and EmuLatte store it — no extra setup if you're already in the ecosystem.

<br>

---

<br>

<div align="center">

*Built by* **Shampoo is a Lie** &nbsp;·&nbsp; GPL-3.0 &nbsp;·&nbsp; *Made for Linux desktops that take aesthetics seriously*

```
◈ ─────────────────────────────────────── ◈
```

</div>
