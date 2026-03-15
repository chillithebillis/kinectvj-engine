<div align="center">
  <img src="public/favicon.svg" alt="KinectVJ Logo" width="120" height="120" />
  <h1>KinectVJ Engine 🎛️🌌</h1>
  <p><strong>Real-time Audio-Reactive VJ & Visual Engine (Web & Desktop)</strong></p>
  <p><em>🚧 BETA VERSION 🚧 — Developed by <strong>chillibillis</strong></em></p>
</div>

<br/>

The **KinectVJ Engine** is a powerful, browser-based visual performance tool (exportable to Windows via Electron), built for streamers, VJs, and music enthusiasts. It captures audio from your microphone or system and generates psychedelic, minimalist, and beat-reactive (Kick/Bass) visuals in real time.

![KinectVJ Engine Screenshot](https://raw.githubusercontent.com/chillithebillis/kinectvj-engine/main/src/assets/hero.png) *(Drop a screenshot of your project into the src/assets folder and name it hero.png to display it here)*

## ✨ Features

*   🎚️ **Dual-Deck System (A/B):** Blend visuals smoothly using a virtual DJ-style crossfader.
    *   **Deck A (Melodic/Psychedelic):** Fluid visuals, kaleidoscope fractals, 3D galaxies, and aesthetic halftones.
    *   **Deck B (Punk/Aggressive):** Y2K Anime aesthetics, 3D oscilloscope grids, laser beams, and video overlay support.
*   🎥 **Local Video Integration:** Upload videos from your PC in real-time to Deck B and blend them with visual effects using Blend Modes (Screen, Dodge, Difference).
*   🎶 **Advanced Audio Analysis:** Pinpoint reactivity to Kick, Bass, Mid, and High frequencies for dynamic animations.
*   👁️ **Broadcast Mode (No HUD):** Press `H` or `ESC` to hide the entire UI. Perfect for clean capture in OBS Studio, Twitch, or live projectors.
*   🎞️ **Global FX:** Black & White Strobe on kick beats, Anti-exposure Trail effect, Screen Mirroring (Kaleida, 1/2 V, 1/2 H), and Auto-Hue.
*   🖥️ **Native Desktop Support:** Turn the Web visualizer into a standalone `.EXE` for Windows, requiring no internet connection.

## 🚀 How to Access / Use

### 🌐 Option 1: Web Version (Live)
Access the hosted version directly in your browser from anywhere:
👉 **[kinectvj-engine.vercel.app](https://kinectvj-engine.vercel.app)** *(Link to your live Vercel app)*

1. Click **"Capturar Stream"** (to capture PC/Browser audio) or **"Microfone Local"**.
2. Play with the Crossfader and Buttons.

### 💻 Option 2: Windows Installer (.EXE)
Download the full native version from the **Releases** tab on this GitHub.
1. Download the `KinectVJ-Windows-Portable.zip` file.
2. Extract it and run `KinectVJ Component.exe`.

---

## 🛠️ For Developers

If you want to download the source code, tweak colors, or build new visual scenes (inside the `src/main.ts` file):

### Local Installation
```bash
# Clone the repository
git clone https://github.com/chillithebillis/kinectvj-engine.git

# Enter the folder
cd kinectvj-engine

# Install dependencies
npm install

# Start the dev server (Opens in your local browser)
npm run dev
```

### Building the Windows .EXE
The project is already set up with `electron-builder`. To build an `.exe` on your machine:
```bash
# Run the build process
npm run electron:build
```
The final executable and native files will appear inside the `/release` folder.

## 🎮 Keyboard Controls (Shortcuts)
*   **1 to 5:** Switches scenes on DECK A.
*   **6 to 0:** Switches scenes on DECK B.
*   **Mouse Scroll:** Moves the Crossfader (A <-> B).
*   **Click + Drag (Screen):** Spatial Warp effect wherever the mouse points.
*   **H or ESC:** Hides the VJ Panel and UI.

---

<div align="center">
  <p>Built with ⚡ Vite, TypeScript, and the Canvas API.</p>
</div>
