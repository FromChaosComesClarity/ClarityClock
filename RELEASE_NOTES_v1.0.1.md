CafeNeurotico Clock 1.0.1

A patch release with one fix: **clicking the game name now works.**

## Fixed

- **Click-through to Cafe Neurotico / EmuLatte.** In Ken Burns and CREMA modes the game-name label under the art is meant to open that game in the app it belongs to. In 1.0.0 the label was drawn *underneath* the full-window clock layer, so every click landed on the clock instead and nothing happened. The label now sits above it and is clickable, as intended. Minimalist mode is unaffected — it never shows the label.

Nothing else changed. If you don't use the click-through, 1.0.0 and 1.0.1 are identical in every other respect.

## Install

1. Download `CafeNeuroticoClock.AppImage` below
2. `chmod +x CafeNeuroticoClock.AppImage`
3. Run it

Click-through needs **Cafe Neurotico 1.1.0** / **EmuLatte 1.1.0** or newer sitting beside the clock; without them the clock still runs and simply shows the time.
