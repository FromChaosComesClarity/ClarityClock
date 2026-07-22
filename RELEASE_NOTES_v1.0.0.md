CafeNeurotico Clock 1.0.0

A frameless desk clock for Linux that wears your game library. It scans the art your **CNGM** and **EmuLatte** libraries already store, runs it as a slideshow behind the time, and speaks the same visual language as the rest of the Cafe Neurotico ecosystem. Fully standalone — it needs no account, makes no network calls, and works whether or not the other apps are installed.

## Install

1. Download `CafeNeuroticoClock.AppImage` below
2. `chmod +x CafeNeuroticoClock.AppImage`
3. Run it

It only ever writes one file — `GameManagerConfig/CafeNeuroticoClock/settings.json`. If you keep it beside your Cafe Neurotico / EmuLatte AppImages, it finds their art automatically.

```sh
./CafeNeuroticoClock.AppImage    # launch as many independent instances as you like
```

## What's in it

**Three visual presentations,** each freely resizable, each adapting to your colour palette:

- **Minimalist** — a small floating widget with a dashed border and a background tinted by your palette. Stays out of the way.
- **CREMA Splash** — a full-window dark splash with a large frosted-glass circle framing the clock over blurred art. The default.
- **Ken Burns** — game art fills the window with slow pan-and-zoom crossfades, the clock centred over a soft gradient.

**Click the game name to open it.** In Ken Burns and CREMA modes the label under the art is a link back to whichever app owns it — click it and **Cafe Neurotico** or **EmuLatte** opens straight to that game's page. It reads both libraries read-only to resolve art to a game, and if the app is already running the click goes to the open window rather than starting a second copy. (This needs Cafe Neurotico 1.1.0 / EmuLatte 1.1.0 or newer sitting beside the clock.)

**93 colour palettes across 10 categories** — full parity with Cafe Neurotico. Applied live from a card-grid picker that previews each palette in its own colours. The 20 **Systems** palettes each bring their own era typeface.

**Run as many as you want.** Each instance is independent — a different theme, palette and size on every one. Park a minimal clock in a corner of one monitor and a Ken Burns slideshow on another.

**Local-only. Yours.** It scans shared folders for art; it reads nothing else and sends nothing anywhere. Fonts are bundled — no network fetch on launch.

## Requirements

- A 64-bit Linux desktop, and FUSE for the AppImage
- Optional: Cafe Neurotico and/or EmuLatte beside the clock, for art and click-through. Without them the clock still runs — it simply shows the time.

## Also on the menu

[**Cafe Neurotico**](https://github.com/shampoo-is-a-lie/CafeNeurotico) — the game library suite the clock draws its art from.

[**EmuLatte**](https://github.com/shampoo-is-a-lie/EmuLatte) — the standalone emulation library, also a source of art and a click-through target.

## Tip the barista

If this earned a spot on your desktop, consider buying me a coffee. *"more caffeine is `more good`."*

- **Ko-fi (Intl):** https://ko-fi.com/cafeneurotico
- **PIX (Brazil):** `b734a9e2-e479-42f9-abd6-c88d1b8b880e`

Built by J.R.A. · GPL-3.0-or-later
