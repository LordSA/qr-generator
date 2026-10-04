# QR Studio - Agent Guidelines & Workflow Rules

This project follows the **Superpowers** engineering framework.

## Core Rules for Agents & Contributors

1. **Disciplined Workflow (Superpowers Framework)**:
   - For creative or architectural feature additions, invoke `superpowers:brainstorming` and `superpowers:writing-plans`.
   - Never write code before establishing an agreed-upon implementation plan.
   - Keep tasks right-sized with verifiable deliverables at every step.
   - Run browser and automated tests before marking tasks as complete (`superpowers:verification-before-completion`).

2. **Frontend Architecture & UX**:
   - Modern, high-performance vanilla JavaScript and CSS without heavy framework bloat.
   - Dark/cyberpunk neon aesthetic with glassmorphic dashboard controls.
   - Dual-engine architecture: Zero-dependency client-side execution + optional Python API serverless microservice.

3. **Figma & Design Tool Interoperability**:
   - SVG vector generation must produce clean XML compatible with Figma clipboard vector frame import, Canva, and Adobe Photoshop/Illustrator.
