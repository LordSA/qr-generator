# CHANGELOG.md

All notable changes to the QR Studio project will be documented in this file.

## [2.1.0] - 2026-10-05

### Added
- Direct file download engine for PNG, SVG, JPG, and PDF using off-screen anchor triggers and direct blob streams.
- Dynamic badge background color picker with auto-match QR background option.
- Badge outline border toggle to ensure high contrast in print and vector workflows.
- Radial Euclidean cutout algorithm for circular logo badges, keeping modules neatly wrapped around circular boundaries.
- Mandatory Error Correction Level H (30%) lock when custom logos are embedded to guarantee physical camera readability.
- `PROJECT_MEMORY.md`, `DESIGN.md`, and updated `AGENTS.md` governing senior developer standards.

### Changed
- Default live preview colors initialized to classic high-contrast Black (#000000) on White (#ffffff).
- Default module pattern set to Squares with Square finder eyes.
- Removed legacy logo image and engine status badge from the header navigation bar.
- Replaced fragile SVG `<clipPath>` tags with native vector shapes to ensure 100% layer fidelity in Figma, Canva, and Illustrator.
- Stripped all inline comments across the codebase for clean, self-documenting production code.

## [2.0.0] - 2026-10-04

### Added
- Full QR Studio dashboard layout with 2-column split view (Controls Panel and Sticky Live Preview).
- Modular QR rendering engine supporting 3 module patterns: Squares, Dots, and Rounded.
- Custom corner finder eye stylings (Square, Smooth Rounded, Circle).
- Solid and Linear Gradient color engines with angle slider (0°–360°).
- Multi-format exporter: Copy for Figma (Vector Frame), Copy PNG, Download PNG, SVG, JPG, PDF.
- Integrated Superpowers framework and engineering rules.

## [1.0.0] - 2025-11-21

### Added
- Initial project creation with basic Python serverless function and HTML/CSS/JS frontend.
- Vercel deployment configuration.
