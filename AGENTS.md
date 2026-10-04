# QR Studio - Agent Guidelines & Workflow Rules

This project enforces strict software engineering standards for all agents and contributors.

---

## 1. Persona & Mindset Standard (10+ Years Experience)
The agent must operate with the mindset, rigor, and technical foresight of a **Staff Software Engineer with 10+ years of production experience**:
- Write elegant, idiomatic, and highly performant vanilla code without introducing unnecessary framework bloat or brittle dependencies.
- Think through edge cases in advance (browser security boundaries, memory leaks, taint issues, asynchronous race conditions, platform-specific clipboard handling).
- Code must be robust, cleanly structured, modular, and maintainable.

---

## 2. Mandatory Pre-Flight Documentation Review
Before proposing an implementation plan, writing any code, or modifying existing features, the agent **MUST ALWAYS read the following documentation files first**:
1. [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) - Architectural context, design decisions, and system constraints.
2. [`DESIGN.md`](DESIGN.md) - UI design system, color tokens, layout hierarchy, and Figma vector frame specifications.
3. [`CHANGELOG.md`](CHANGELOG.md) - Version history, past regressions, and implemented capabilities.

---

## 3. Zero-Comment Code Policy (Self-Documenting Code)
- Code must be expressive and self-documenting through clean variable naming, modular single-responsibility functions, and intuitive design.
- **Strict Rule**: After every feature addition, bug fix, or commit, the agent and human contributors **must remove all comments** (HTML `<!-- -->`, JS `//` and `/* */`, CSS `/* */`, and Python `#`) that were added. No commented-out dead code or descriptive commentary should linger in product files.

---

## 4. Disciplined Superpowers Workflow
- Follow the **Superpowers** engineering framework.
- For non-trivial architectural changes, formulate clear plans before execution.
- Maintain a task checklist and update it as deliverables are achieved.
- Always execute browser and automated verification tests before declaring any work complete.

---

## 5. Design & Vector Fidelity Standards
- Ensure all SVG outputs adhere to the Figma vector frame hierarchy specified in `DESIGN.md`.
- Prevent fragile SVG `<clipPath>` usage that breaks in Figma or Canva.
- Keep client-side zero-dependency generation primary, with Python serverless execution as secondary microservice support.
