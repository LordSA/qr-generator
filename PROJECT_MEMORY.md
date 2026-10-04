# PROJECT_MEMORY.md

## Project Vision & Identity
QR Studio is a zero-dependency, high-performance vector QR code studio engineered for developers and design professionals. It is built to serve two core workflows:
1. Direct vector interoperability with modern design platforms (Figma, Canva, Adobe Photoshop, Illustrator) via native vector frame clipboard generation.
2. Dual-engine deployment: 100% offline client-side generation alongside an optional serverless Python microservice (`api/index.py`).

## Core Architecture

### 1. Dual-Engine Architecture
- **Client-Side Engine (`public/qr-engine.js` + `public/qrcode.min.js`)**:
  - Operates completely in-browser with zero external network requests.
  - Computes raw Reed-Solomon matrices and renders geometric precision SVG paths.
  - Draws directly onto an off-screen HTML5 Canvas via 2D Context for raster exports (PNG/JPG) and clipboard bitmap copying.
- **Python Serverless API (`api/index.py`)**:
  - Serves as a standalone microservice or Vercel serverless function (`/api/index?url=...`).
  - Supports programmatic API consumption with CORS headers (`Access-Control-Allow-Origin: *`).
  - Also functions as a local development HTTP server serving static files from `public/` when run directly via CLI (`python api/index.py`).

### 2. Vector Compatibility & Design Tool Pipeline
- **Figma Vector Frame Import**:
  - Clipboard writes both `image/svg+xml` and `text/plain` payloads.
  - Generates structured, semantically named SVG groups (`<g id="QR-Modules">`, `<g id="Finder-Eyes">`, `<g id="Logo-Badge">`, `<g id="Background">`).
  - Strict avoidance of SVG `<clipPath>` tags inside `<image>` elements, as Figma's clipboard parser strips or breaks clipped image nodes.
- **Canvas 2D Dual Render**:
  - Browsers often taint canvases or fail to draw SVGs containing sub-images when converted via blob URLs.
  - `QREngine.renderToCanvas` composites vector modules first and then overlays logo badges via native Canvas 2D (`ctx.arc`, `ctx.roundRect`, `ctx.drawImage`). This guarantees that PNG, JPG, and PDF exports are never blank and never tainted.

### 3. Reed-Solomon Scannability & Logo Cutout Guardrails
- **Timing Track & Finder Eye Inviolability**:
  - Central logo cutouts are clamped to protect rows and columns 0–6 and `count-7..count-1`.
  - Margin calculations ensure finder eyes (7x7 corner modules) and horizontal/vertical timing tracks are never truncated.
- **Shape-Aware Radial Cutout**:
  - Circular badges calculate Euclidean radial distance `Math.hypot(r - cy, c - cx) <= radius` so modules wrap organically around circular badges rather than leaving an empty square box.
- **Error Correction Locking**:
  - Embedding a logo occludes between 12% and 25% of the QR matrix surface area.
  - Adding a logo automatically locks the error correction level to Level H (30%) and disables Low (7%) and Medium (15%) options to prevent generating unreadable QR codes.

### 4. Cross-Platform Direct File Downloads
- Direct downloads utilize off-screen anchor tags appended to `document.body` (`position: fixed; top: -9999px`) receiving `URL.createObjectURL(blob)`.
- Avoids large data URI navigation limits in modern browsers and forces direct OS-level file saves to the user's local disk.

## Directory Structure
- `public/index.html` - Studio dashboard layout (controls panel & sticky live preview).
- `public/style.css` - Dark glassmorphic design system and responsive layout tokens.
- `public/qr-engine.js` - Vector generation, matrix classifiers, shapes, and Canvas 2D renderer.
- `public/script.js` - Reactive dashboard controller, clipboard handlers, and file downloaders.
- `public/qrcode.min.js` - Offline QR matrix mathematics library.
- `api/index.py` - Python serverless endpoint and local development server.
- `vercel.json` - Vercel routing rules for static public assets and API rewrite.
- `AGENTS.md` - Engineering workflow rules, standards, and guidelines for AI and contributors.
- `DESIGN.md` - Visual aesthetics, color tokens, layout, and UX standards.
- `CHANGELOG.md` - Chronological log of releases, feature additions, and fixes.
