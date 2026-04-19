<div align="center">

# GrainLab

**Film Photography Effect Simulator**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/seamys/grainlab)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://seamys.github.io/grainlab/)

**[🌐 Live Demo](https://seamys.github.io/grainlab/) · [中文文档](README.zh-CN.md)**

Give your digital photos the authentic look and feel of classic analog film — right in your browser. No installation, no account, completely free.

</div>

---

![GrainLab main interface](docs/images/main.png)

### 🎬 Demo

![GrainLab Demo](docs/demo.gif)

---

## ✨ Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎞️ **11 Film Presets** | One-click simulation of iconic film stocks (Kodak Portra, Fuji Velvia, CineStill 800T, and more) |
| 🎛️ **8 Adjustable Effects** | Grain, color grading, vignette, light leak, fade, halation, bloom, tone curve |
| 🖼️ **Before / After** | Draggable split-view comparison at any time |
| 📦 **Batch Export** | Apply a preset to multiple images and download as a ZIP |
| 💾 **Gallery Persistence** | IndexedDB automatically saves your work across browser sessions |
| 🌍 **9 Languages** | EN / 简中 / 繁中 / 日 / 한 / FR / DE / ES / PT |
| 🌙 **Dark / Light Theme** | One-click toggle |

---

## 🚀 Getting Started

Open the live app — no installation needed:

**[https://seamys.github.io/grainlab/](https://seamys.github.io/grainlab/)**

---

## 📖 How to Use

### 1. Load an Image

- **Drag and drop** a photo anywhere onto the canvas, or
- Press **Ctrl + O** (macOS: **⌘ + O**) to open the file picker.

Supported formats: JPG · PNG · GIF · WebP · BMP · TIFF

> A built-in example image loads automatically if your gallery is empty — you can start experimenting immediately.

---

### 2. Apply a Film Preset

![Presets panel](docs/images/presets.png)

Click the **Presets** tab on the left panel to browse 11 carefully crafted film simulations. Hover over any preset to read its description, then click to apply it instantly.

| Preset | Character |
|--------|-----------|
| Kodak Portra 400 | Warm portrait tones, soft highlights |
| Kodak Gold 200 | Vibrant warm tones, great for travel |
| Kodak Ektar 100 | Ultra-vivid colors, fine grain |
| Kodak Tri-X 400 | High-contrast B&W, coarse grain |
| Fuji Superia 400 | Fresh greens, balanced color |
| Fuji C200 | Cool, subtle, low contrast |
| Fuji Velvia 50 | Extreme saturation, deep blues/greens |
| Fuji Eterna 500 | Cinematic low-saturation, soft shadows |
| Ilford HP5 Plus | Classic B&W, strong grain |
| CineStill 800T | Cool tungsten tones, red halation |
| Agfa Vista 200 | Warm vintage, magenta shadows |

---

### 3. Fine-Tune Effects

![Effects control panel](docs/images/effects.png)

The **Adjustments** tab exposes 8 independent effect layers. Toggle **Simple / Advanced** mode at the top to show or hide per-channel controls.

| Effect | Key Controls |
|--------|-------------|
| **Color Grading** | Exposure · Temperature · Tint · Saturation · Contrast · Highlights · Shadows |
| **Film Grain** | Intensity · Size · Color Variance · Shadow Boost · Highlight Reduction |
| **Vignette** | Intensity · Radius · Feather · Color (black→white) |
| **Light Leak** | Intensity · Color (Warm/Cool/Vintage) · Position (4 corners) |
| **Fade** | Intensity — lifts blacks for a washed vintage look |
| **Halation** | Intensity · Color (Red/Warm/Gold) · Radius |
| **Bloom** | Intensity · Threshold · Radius |
| **Tone Curve** | Shadows · Midtones · Highlights (5-point spline) |

Switch to **Advanced** mode to unlock **Color Toning Wheels** — three separate RGB color pickers for shadows, midtones, and highlights, giving you fine-grained creative control over the overall mood of the photo.

![Advanced mode — Color Toning Wheels](docs/images/advanced.png)

---

### 4. Before / After Comparison

![Before/After comparison view](docs/images/before-after.png)

Click the **compare button** in the toolbar (or the icon next to the zoom controls) to switch to split-view mode. Drag the divider left or right to reveal as much of the original or processed image as you like.

---

### 5. Export a Single Image

![Export dialog](docs/images/export.png)

1. Click **Export** (or press **Ctrl + S** / **⌘ + S**).
2. Choose **JPEG** (with quality slider 1–100%) or **PNG** (lossless).
3. Click **Download** — the file saves as `{original_name}_film.jpg/png`.

---

### 6. Batch Processing

![Batch processing panel](docs/images/batch.png)

1. Open the **Batch** panel from the toolbar.
2. Select the images you want to process (from your gallery).
3. Choose a preset and export format.
4. Click **Export All** — a `film_batch.zip` is downloaded containing all processed images.

---

### 7. Gallery & Session Persistence

The **Film Strip** at the bottom of the screen shows thumbnails of all loaded images. Click any thumbnail to switch to that image. Your entire gallery — including images and per-image settings — is automatically saved in your browser's IndexedDB and restored the next time you open the app.

To add more images, click **＋** in the film strip.  
To remove an image, click the **✕** button on its thumbnail.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + O` | Open / import image(s) |
| `Ctrl + S` | Export current image |
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Reset zoom to fit |

> macOS: substitute **⌘** for **Ctrl**

---

## 🌍 Supported Languages

GrainLab automatically detects your browser language. You can also change it manually in the top-right language selector.

English · 简体中文 · 繁體中文 · 日本語 · 한국어 · Français · Deutsch · Español · Português

---

## 🛠️ Tech Stack (for developers)

| Technology | Role |
|-----------|------|
| Vue 3 + TypeScript | UI framework |
| Vite | Build tool |
| Pinia | State management |
| Vue I18n | Internationalization |
| Web Workers | Non-blocking filter processing |
| IndexedDB | Gallery persistence |
| JSZip | Batch ZIP export |

### Local Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

---

## 📄 License

[MIT](LICENSE) © GrainLab
