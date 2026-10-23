# Chayaksha | Virtual Photography Exhibition & Salon 🏛️📷

[![FIAP Patronage](https://img.shields.io/badge/FIAP%20Patronage-2026%2F184-f59e0b.svg)](https://www.fiap.net)
[![PSA Recognition](https://img.shields.io/badge/PSA%20Recognition-2026--412-3b82f6.svg)](https://psa-photo.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r183-black.svg)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com)

> **Chayaksha** (from Sanskrit *Chaya* — Shadow/Image, and *Aaksha* — Eye/Vision) is a high-fidelity, interactive 3D WebGL virtual photography museum designed to bridge traditional international salon exhibitions with immersive modern browser technology.

Built to host salon exhibitions following international standards (such as **FIAP** and **PSA**), Chayaksha translates the physical elegance of high-end architectural art galleries into an accessible digital sanctuary.

---

## 🏛️ Core Vision & Experience Pillars

### 1. Architectural Walkthrough & Spatial Storytelling
* **Uninterrupted Exploration**: The exhibition is designed as a continuous 3D hallway extending along the central Z-axis ($Z = 0$ to $188\text{m}$) that expands organically as categories and art pieces are installed.
* **Hero Artwork Focus**: Spatial geometry, vaulted skylights, and subtle cove downlights celebrate photography with zero physical barriers along the primary walking corridor.
* **Spatial Progression**:
  1. **Grand Entrance Foyer ($Z = 0$ to $16\text{m}$)**: Imposing double-height entryway featuring the monumental *Hero Masterpiece Wall*, salon typography, and inaugural audio triggers.
  2. **Award Winners Pavilion ($Z = 16$ to $44\text{m}$)**: Vaulted gallery bathed in warm golden spotlights ($3000\text{K}$) bouncing off brushed brass plaques honoring FIAP/PSA medalists.
  3. **Continuous Category Stalls ($Z = 44\text{m}+$ onward)**: Dedicated modular sections for *Open Monochrome*, *Nature & Wildlife*, *Photojournalism & Street*, *Architecture & Travel*, and *Creative / Altered Reality*.

### 2. Gallery Realism & High-Fidelity Curation
* **Exhibition Lighting & Distinction**: Dynamic PBR lighting differentiates works:
  * **Top Award Winners**: Warm gold spotlights on brushed brass plaques with metallic reflection and specular highlights.
  * **Salon Acceptances**: Cool neutral lighting on sleek matte slate/graphite plaques.
* **Archival High-Resolution Inspection**:
  * Clicking any artwork triggers an automated camera glide to the optimal viewing distance ($1.8\text{m}$ perpendicular).
  * Opens the deep archival inspection modal with high-fidelity zoom (up to 4x), drag-to-pan, camera EXIF extraction (Camera, Lens, Aperture, Shutter, ISO, Location, Year), and juror critiques.
* **Atmospheric Immersion**:
  * Integrated procedural Web Audio API synthesizer generating architectural room reverberation and warm evolving harmonic drones.
  * Dynamic spatial filter modulation shifts harmonic warmth as the visitor crosses between exhibition wings.

### 3. Glassmorphic Ephemeral UI
* **Non-Intrusive Interface**: Floating UI elements—such as top navigation bar, 2D architectural blueprint floor plan with real-time visitor tracking, search catalog, and visitor guestbook—use lightweight glassmorphism that sits discreetly over the 3D canvas.
* **Cross-Platform Accessibility**:
  * **Desktop**: `WASD` / Arrow keys to walk, mouse click-and-drag or pointer look, `Shift` for sprint.
  * **Mobile**: Responsive virtual thumb joystick for movement and touch-drag for camera rotation.
  * **Teleportation**: One-click quick-travel to any wing or artwork from the minimap or catalogue.

### 4. Live Collaborative Salon & Curator Portal
* **Real-time Synchronized Exhibition**: Synchronized state across tabs using `BroadcastChannel` and `localStorage` guarantees instant updates to wall arrangements and curator modifications without page refreshes.
* **Full Curator Control Suite**:
  * **Architectural Theme Switcher**: Instant live switching between 4 physical gallery themes:
    * *Minimalist Alabaster* (Museum white plaster, Carrara marble reflections, crisp daylight)
    * *Dark Noir Velvet* (Obsidian walls, dramatic gold spotlights, walnut parquet)
    * *Warm Travertine Stone* (Limestone/travertine sediment strata, warm golden hour sun)
    * *Brutalist Architectural Concrete* (Board-formed concrete, industrial slab floor)
  * **Artwork Submissions & Curation**: Add new artworks with EXIF information, award tiers, and juror statements.
  * **Catalog & JSON Export**: Export salon catalogs to JSON and restore presets.
  * **Guestbook Moderation**: Moderate visitor signatures and ledger reviews.

---

## 🕹️ Controls Guide

| Input | Desktop | Mobile / Touch |
|---|---|---|
| **Move Forward / Back** | `W` / `S` or `Up` / `Down` | Virtual Joystick (Left thumb) |
| **Strafe Left / Right** | `A` / `D` or `Left` / `Right` | Virtual Joystick (Left thumb) |
| **Look Around** | Click & Drag Mouse | Touch & Drag (Right screen) |
| **Inspect Artwork** | Click directly on artwork mesh | Tap directly on artwork |
| **Quick Teleport** | Click section in Floor Plan | Tap section in Floor Plan |
| **Return to Foyer** | `Grand Foyer` HUD Button | `Grand Foyer` HUD Button |

---

## 🛠️ Project Structure

```
chayaksha/
├── src/
│   ├── types/
│   │   └── exhibition.ts          # Type definitions (Artwork, EXIF, AwardTier, Theme)
│   ├── data/
│   │   └── salonData.ts           # Curated salon collection, FIAP/PSA metadata, wings
│   ├── audio/
│   │   └── SoundscapeEngine.ts    # Procedural Web Audio API ambient synthesizer
│   ├── store/
│   │   └── exhibitionStore.ts     # State management, persistence, cross-tab broadcast
│   ├── utils/
│   │   └── textures.ts            # Procedural canvas PBR textures (marble, stone, plaques)
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── GalleryScene.ts    # Three.js imperative engine, raycasting, render loop
│   │   │   ├── GalleryCorridor.ts # 3D architectural corridor, skylights, portals
│   │   │   ├── ArtworkMesh.ts     # Framed artwork, passe-partout, plaque, spotlight
│   │   │   ├── CameraController.ts# WASD + mouse look + mobile virtual joystick
│   │   │   ├── ThemeManager.ts    # Real-time architectural theme materials & lighting
│   │   │   └── GalleryCanvas.tsx  # React canvas container
│   │   └── ui/
│   │       ├── HeaderNavbar.tsx        # Floating glassmorphic top navigation bar
│   │       ├── FloorPlanModal.tsx      # 2D blueprint map with live visitor marker
│   │       ├── ArchivalViewerModal.tsx # Deep inspection zoom/pan viewer & EXIF card
│   │       ├── SalonCatalogueModal.tsx # Full salon search and category/award filtering
│   │       ├── GuestbookModal.tsx      # Visitor signatures ledger & signing form
│   │       ├── CuratorStudioModal.tsx  # Curator administration & theme switcher
│   │       ├── SalonInfoModal.tsx      # FIAP/PSA patronage & jury panel
│   │       ├── NavigationHUD.tsx       # Desktop keys helper & mobile joystick
│   │       └── AudioController.tsx     # Soundscape toggle & live wave visualizer
│   ├── App.tsx                    # Main exhibition application orchestrator
│   ├── index.css                  # Tailwind v4 glassmorphic styles
│   └── main.tsx                   # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### Installation & Local Development

```bash
# 1. Clone repository
git clone <repository-url>
cd "Chayaksha 26'"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📜 International Patronages & Compliance

* **FIAP**: Fédération Internationale de l'Art Photographique (Patronage 2026/184)
* **PSA**: Photographic Society of America (Recognition 2026-412)
* Conforms to FIAP & PSA salon classification rules:
  * Award hierarchy: Best of Show, FIAP/PSA Gold, Silver, Bronze, Honorable Mentions, and Salon Acceptances.
  * Preserved full EXIF technical attribution and artist biographical records.

---

Designed & Engineered for **Chayaksha Virtual Photography Exhibition**.
#   c h a y a k s h a  
 #   c h a y a k s h a  
 