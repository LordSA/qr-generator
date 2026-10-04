# QR Code Generator & Studio Design Rules

## 1. QR Scannability & Error Correction Guardrails
- **Quiet Zone**: Every generated QR code must maintain a minimum quiet zone (padding) of at least 4 modules (or 2 modules for clean web presentation) so phone cameras can reliably decode it.
- **Logo Clearance**: When a logo is embedded, the error correction level MUST default or automatically elevate to **Level H (30%)** or **Level Q (25%)**.
- **Logo Area Constraint**: The central logo must never occlude more than 20% of the total QR surface area. Provide a safe padding/cutout background around the logo to prevent module interference.
- **Contrast Requirement**: Ensure sufficient luminance contrast between the foreground pattern (dark modules) and the background. Avoid low-contrast color combinations (e.g., light yellow on white).

## 2. Vector Export & Figma Compatibility Standards
- **Vector Copy for Figma**: Figma parses SVG text from the clipboard as native vector frames. The exported SVG must include:
  - Valid `xmlns="http://www.w3.org/2000/svg"`
  - Explicit `viewBox` and `width`/`height` attributes
  - Named groups (e.g. `<g id="QR-Matrix">`, `<g id="Position-Eyes">`, `<g id="Logo">`) so designers in Figma/Photoshop/Illustrator can manipulate components as organized layers.
- **Pure Vector Path Optimization**: Use clean SVG `<rect>`, `<circle>`, or combined `<path d="...">` commands rather than raster image embeddings whenever vector output is selected.

## 3. Client-Side & Backend Dual Engine Architecture
- **Offline & Client-Side First**: The dashboard must always be fully functional client-side without requiring internet connection or local python server.
- **Backend Fallback & Verification**: The Python server (`api/index.py`) remains available as a secondary microservice and for programmatic API consumers (`/api/index?url=...`).
