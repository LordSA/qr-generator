# DESIGN.md - QR Studio Design System & UX Specification

## 1. Visual Theme & Philosophy
QR Studio utilizes a dark-mode cyberpunk glassmorphism aesthetic tailored for creative developers and digital designers. The interface balances high technical precision with low visual clutter.

## 2. Color Palette & Design Tokens
```css
--bg-main: #050811;               /* Deep void background */
--card-bg: rgba(13, 20, 36, 0.75); /* Translucent glass card */
--card-border: rgba(56, 189, 248, 0.12);
--accent: #00d2ff;                /* Neon electric cyan */
--accent-glow: 0 0 25px rgba(0, 210, 255, 0.35);
--figma-accent: #a259ff;          /* Figma purple */
--figma-glow: 0 0 20px rgba(162, 89, 255, 0.4);
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-muted: #64748b;
--surface-1: #090e1a;
--surface-2: #111a2e;
--surface-3: #1a2744;
--input-border: #223254;
--success: #10b981;
```

## 3. Typography
- **Primary Interface**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Headers: 700 / 800 Weight with subtle negative letter spacing (`-0.02em`).
  - Section Labels: 600 Weight, uppercase (`letter-spacing: 0.05em`).
- **Technical & Data Values**: `'JetBrains Mono', monospace`
  - Color hex values, slider readings, module measurements, and code snippets.

## 4. Layout Architecture
- **Desktop (> 900px)**:
  - 2-Column Dashboard Grid: `grid-template-columns: minmax(380px, 480px) 1fr`.
  - Left Column: Studio controls divided into organized tabs (`Content`, `Design`, `Colors`, `Logo`, `Settings`).
  - Right Column: Sticky live preview panel with high-contrast stage and quick action buttons.
- **Mobile (< 900px)**:
  - Single column stack layout.
  - Sticky preview relaxes into static flow to optimize vertical scrolling.

## 5. QR Code Module & Eye Styling
1. **Module Designs**:
   - `Squares`: Classic sharp pixel-perfect geometric boxes.
   - `Dots`: Circular nodes centered on each module with proportional radius (`moduleSize * 0.44`).
   - `Rounded`: Pill/rounded rectangle modules with smooth corner radius (`moduleSize * 0.35`).
2. **Finder Eye Styles**:
   - `Square`: Sharp outer 7x7 box and inner 3x3 pupil.
   - `Smooth`: Rounded outer frame (`rx = moduleSize * 1.8`) and smooth rounded pupil.
   - `Circle`: Concentric vector circle rings and centered circular pupil.

## 6. Figma Vector Frame Standard
Exported SVGs must follow strict structural hierarchy:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <g id="QR-Studio-Frame">
    <rect id="Background" width="500" height="500" fill="#ffffff" />
    <g id="QR-Modules">
      <!-- Data modules -->
    </g>
    <g id="Finder-Eyes">
      <!-- Outer frames and inner pupils -->
    </g>
    <g id="Logo-Badge">
      <!-- Badge background vector and centered image -->
    </g>
  </g>
</svg>
```
This enables Figma to import the QR code as a fully editable vector Frame with discrete, selectable components rather than a flattened raster bitmap.
