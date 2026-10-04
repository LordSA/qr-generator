# QR Studio Dashboard & Vector Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the QR generator into a professional "QR Studio Dashboard" featuring:
1. **Dashboard Split-Screen Layout**: Collapsible/tabbed controls on the left, sticky live reactive preview on the right.
2. **Vector Copy for Figma & Design Tools**: Clean SVG vector clipboard copy that Figma pastes directly as native vector frames/layers (plus Canva & Photoshop support).
3. **Logo Embedding**: Upload custom logo image, adjust size ratio, safe cutout margin, and auto-elevate error correction to Level H (30%).
4. **3 Distinct QR Module Designs**: Classic Squares, Modern Dots, and Smooth Rounded/Pill modules.
5. **Full Styling & Color Control**: Solid colors, linear gradients (start/end/angle), eye outer box and inner dot custom colors.
6. **Error Correction Selector**: Low (7%), Medium (15%), Quartile (25%), High (30%).
7. **Comprehensive Exporter**: Export as PNG, pure vector SVG, JPG, PDF, plus Copy PNG & Copy SVG to clipboard.

---

## File Structure & Responsibilities

- **`public/index.html`**: Two-column dashboard interface (Left: Studio Controls Accordion/Tabs; Right: Sticky Live Preview Panel with quick action buttons).
- **`public/style.css`**: Professional studio UI design system (glassmorphism, clean typography, tabs, range sliders, color pickers, drop zones, responsive grid).
- **`public/qr-engine.js`**: Core QR vector & canvas rendering engine supporting custom shapes (Squares, Dots, Rounded), corner eye stylings, logo cutout blending, and SVG generation.
- **`public/script.js`**: Studio controller handling state management, reactive live-updating, file uploads, clipboard interactions (Figma SVG frame & PNG blob), and multi-format exports (PNG, SVG, JPG, PDF).
- **`api/index.py`**: Python serverless microservice maintaining backwards-compatible `/api/index?url=...` with full CORS support.
- **`.agents/rules/qr-design-standards.md`**: Design guardrails for scannability, contrast, and vector fidelity.

---

## Task Decomposition

### Task 1: Studio Dashboard Layout & Design System
Create the modern two-column studio UI with tabbed/accordion editing panels and a dedicated live preview card.

- [x] **Step 1.1**: Restructure `public/index.html` into a responsive dashboard grid:
  - Left column (`.studio-controls`):
    - **Tab 1: Content** (URL/Text/WiFi/Email inputs with instant clear)
    - **Tab 2: Pattern & Design** (3 styles: Classic Squares, Dots, Rounded)
    - **Tab 3: Colors & Gradient** (Solid vs Gradient, Eye color controls)
    - **Tab 4: Logo & Branding** (Drag-and-drop file upload, size slider, remove logo)
    - **Tab 5: Precision & Error Correction** (L, M, Q, H, custom size/resolution)
  - Right column (`.studio-preview`):
    - Sticky card containing live interactive SVG/Canvas preview
    - Action bar: "Copy for Figma (Vector Frame)", "Copy PNG", "Download Menu" (PNG, SVG, JPG, PDF)
- [x] **Step 1.2**: Update `public/style.css` with sleek dark glassmorphic studio styling:
  - Modern studio layout (`grid-template-columns: minmax(360px, 480px) 1fr`)
  - Styled tabs, color inputs, range sliders with live value badges, and logo dropzone
  - Responsive collapse for mobile screens (`< 860px`)
- [x] **Step 1.3**: Test dashboard responsiveness and tab navigation in browser.

---

### Task 2: Advanced Modular QR Vector & Pattern Engine (`qr-engine.js`)
Build the rendering engine that computes QR matrices and produces both standard canvas and clean, grouped SVG vector elements.

- [x] **Step 2.1**: Implement matrix generation and module classifier:
  - Distinguish regular data modules from the 3 finder patterns (top-left, top-right, bottom-left 7x7 corner eyes).
- [x] **Step 2.2**: Implement the 3 QR Pattern Renderers:
  - **Classic Squares**: Standard pixel-perfect square blocks.
  - **Modern Dots**: Circular nodes (`<circle>` or `arc()`) centered on each module.
  - **Smooth Rounded**: Rounded rectangles (`<rect rx="..." ry="...">`) or organic interconnected pills.
- [x] **Step 2.3**: Implement Eye Styling:
  - Customizable outer finder frame (square, rounded, circle) and inner pupil (square or circle) with dedicated color controls.
- [x] **Step 2.4**: Implement Gradient Support:
  - SVG linear gradient (`<defs><linearGradient>`) and Canvas `createLinearGradient()`.
- [x] **Step 2.5**: Write unit verification test checking SVG output structure and scannability.

---

### Task 3: Logo Upload, Embedding & Scannability Safeguards
Add custom logo support with safe cutout margins and automatic error-correction elevation.

- [x] **Step 3.1**: Create logo upload handling in `public/script.js`:
  - Support drag-and-drop and file input for PNG, JPEG, SVG, and WebP.
  - Provide instant image preview and "Remove Logo" button.
- [x] **Step 3.2**: Implement safe logo cutout algorithm in `qr-engine.js`:
  - Calculate central bounding box based on logo size slider (10% to 22% max area).
  - Clear modules beneath the logo with a customizable protective padding margin so scannability is never compromised.
  - Render logo in the center (with optional circular or rounded background badge).
- [x] **Step 3.3**: Auto-elevate error correction:
  - When a logo is active, automatically enforce Error Correction Level **H (30%)** or **Q (25%)** and inform the user.
- [x] **Step 3.4**: Test scanning generated QR codes with embedded logos on test images.

---

### Task 4: Vector Copy for Figma & Multi-Format Exporters
Implement Figma vector frame clipboard copy and multi-format exports (PNG, SVG, JPG, PDF).

- [x] **Step 4.1**: Implement "Copy for Figma (Vector Frame)":
  - Generate clean, standalone SVG XML with:
    - Root `<svg viewBox="0 0 size size" xmlns="http://www.w3.org/2000/svg">`
    - Named Figma layer groups: `<g id="QR-Background">`, `<g id="QR-Modules">`, `<g id="Finder-Eyes">`, `<g id="Logo">`
  - Write to clipboard using `navigator.clipboard.write()` with `image/svg+xml` and `text/plain`.
  - When pasted into Figma, it automatically instantiates as an editable vector Frame!
- [x] **Step 4.2**: Implement "Copy PNG Image":
  - Render canvas to PNG Blob and write to clipboard via `ClipboardItem({'image/png': blob})`.
- [x] **Step 4.3**: Implement Multi-Format File Downloads:
  - **Download SVG**: Pure vector `.svg` file download.
  - **Download PNG**: High-res canvas `.png` download (1000px+ option).
  - **Download JPG**: Solid background `.jpg` download.
  - **Download PDF**: Standard vector/high-res `.pdf` document with centered QR code and label.
- [x] **Step 4.4**: Test clipboard paste into Figma/Canva and verify file downloads.

---

### Task 5: End-to-End Browser Verification & Documentation
Run full browser automation testing to verify UI, responsive behavior, downloads, and vector outputs.

- [x] **Step 5.1**: Run automated browser subagent to test:
  - Inputting links and switching between the 3 QR pattern styles.
  - Toggling gradients and custom colors.
  - Uploading a sample logo and verifying clear center placement.
  - Testing PNG, SVG, JPG, and PDF downloads.
  - Testing Figma vector copy button with toast confirmation.
- [x] **Step 5.2**: Update `README.md` with features and instructions for design tool workflows.
