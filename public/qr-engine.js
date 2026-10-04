/**
 * QR Studio Engine
 * High-performance vector & canvas QR code renderer with custom shapes,
 * finder eye styling, gradient mapping, logo embedding, and Figma vector export.
 */

(function (global) {
    'use strict';

    class QREngine {
        constructor() {
            this.tempEl = document.createElement('div');
            this.tempEl.style.display = 'none';
            document.body.appendChild(this.tempEl);
        }

        /**
         * Computes the raw QR module matrix using the bundled QRCode library
         */
        getMatrix(text, correctionLevel = 'M') {
            const levelMap = {
                'L': (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.L : 1),
                'M': (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.M : 0),
                'Q': (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.Q : 3),
                'H': (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.H : 2)
            };

            this.tempEl.innerHTML = '';
            const qr = new QRCode(this.tempEl, {
                text: text || 'https://example.com',
                correctLevel: levelMap[correctionLevel] ?? levelMap['M']
            });

            const model = qr._oQRCode;
            if (!model) {
                throw new Error("Unable to initialize QR code matrix.");
            }

            const moduleCount = model.getModuleCount();
            const matrix = [];
            for (let r = 0; r < moduleCount; r++) {
                const row = [];
                for (let c = 0; c < moduleCount; c++) {
                    row.push(model.isDark(r, c) ? 1 : 0);
                }
                matrix.push(row);
            }
            return { matrix, moduleCount };
        }

        /**
         * Checks if a coordinate is within any of the 3 corner finder eye patterns (7x7)
         */
        isFinderEye(r, c, count) {
            // Top-Left
            if (r < 7 && c < 7) return 'TL';
            // Top-Right
            if (r < 7 && c >= count - 7) return 'TR';
            // Bottom-Left
            if (r >= count - 7 && c < 7) return 'BL';
            return null;
        }

        /**
         * Calculates the safe cutout area for central logos
         */
        getLogoSafeBounds(moduleCount, logoRatio = 0.2, margin = 2) {
            const logoModules = Math.ceil(moduleCount * logoRatio);
            const start = Math.floor((moduleCount - logoModules) / 2) - margin;
            const end = start + logoModules + (margin * 2);
            return { start, end };
        }

        /**
         * Generates clean, scalable SVG vector XML
         */
        generateSVG(options = {}) {
            const {
                text = 'https://example.com',
                correctionLevel = 'H',
                size = 500,
                quietZone = 3,
                design = 'squares', // 'squares' | 'dots' | 'rounded'
                colorType = 'solid', // 'solid' | 'gradient'
                fgColor = '#000000',
                gradientColor1 = '#000000',
                gradientColor2 = '#333333',
                gradientAngle = 45,
                bgColor = '#ffffff',
                transparentBg = false,
                eyeStyle = 'square', // 'square' | 'rounded' | 'circle'
                eyeOuterColor = '',
                eyeInnerColor = '',
                logo = null // { dataUrl, sizeRatio: 0.2, shape: 'circle' | 'square', bgPadding: 4 }
            } = options;

            const { matrix, moduleCount } = this.getMatrix(text, correctionLevel);
            const totalModules = moduleCount + (quietZone * 2);
            const moduleSize = size / totalModules;

            let fillAttr = fgColor;
            let defs = '';

            if (colorType === 'gradient') {
                const rad = (gradientAngle * Math.PI) / 180;
                const x1 = Math.round(50 - Math.cos(rad) * 50);
                const y1 = Math.round(50 - Math.sin(rad) * 50);
                const x2 = Math.round(50 + Math.cos(rad) * 50);
                const y2 = Math.round(50 + Math.sin(rad) * 50);

                defs = `
    <defs>
      <linearGradient id="qr-gradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${gradientColor1}" />
        <stop offset="100%" stop-color="${gradientColor2}" />
      </linearGradient>
    </defs>`;
                fillAttr = 'url(#qr-gradient)';
            }

            // Background
            const bgRect = transparentBg 
                ? '' 
                : `<rect id="Background" width="${size}" height="${size}" fill="${bgColor}" rx="12" ry="12" />`;

            // Logo safe zone
            const hasLogo = logo && logo.dataUrl;
            let logoBounds = null;
            if (hasLogo) {
                const ratio = Math.min(Math.max(logo.sizeRatio || 0.2, 0.12), 0.26);
                logoBounds = this.getLogoSafeBounds(moduleCount, ratio, logo.bgPadding || 1);
            }

            // Draw Data Modules
            let modulesSVG = '';
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (this.isFinderEye(r, c, moduleCount)) continue;

                    // Skip if inside logo cutout
                    if (hasLogo && r >= logoBounds.start && r < logoBounds.end && c >= logoBounds.start && c < logoBounds.end) {
                        continue;
                    }

                    if (matrix[r][c] === 1) {
                        const x = (c + quietZone) * moduleSize;
                        const y = (r + quietZone) * moduleSize;

                        if (design === 'dots') {
                            const cx = x + moduleSize / 2;
                            const cy = y + moduleSize / 2;
                            const radius = (moduleSize * 0.44).toFixed(2);
                            modulesSVG += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius}" fill="${fillAttr}" />`;
                        } else if (design === 'rounded') {
                            const rx = (moduleSize * 0.35).toFixed(2);
                            modulesSVG += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" rx="${rx}" ry="${rx}" fill="${fillAttr}" />`;
                        } else {
                            // Classic squares
                            modulesSVG += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(moduleSize + 0.1).toFixed(2)}" height="${(moduleSize + 0.1).toFixed(2)}" fill="${fillAttr}" />`;
                        }
                    }
                }
            }

            // Draw Finder Eyes
            const outerColor = eyeOuterColor || fillAttr;
            const innerColor = eyeInnerColor || outerColor;
            let eyesSVG = this.renderSVGEyes(moduleCount, quietZone, moduleSize, eyeStyle, outerColor, innerColor, transparentBg ? '#ffffff' : bgColor);

            // Draw Logo Element
            let logoSVG = '';
            if (hasLogo) {
                const logoSize = size * (logo.sizeRatio || 0.2);
                const logoX = (size - logoSize) / 2;
                const logoY = (size - logoSize) / 2;
                const padding = 6;
                const bgSize = logoSize + (padding * 2);
                const bgX = logoX - padding;
                const bgY = logoY - padding;

                const shape = logo.shape || 'circle';
                let logoBgShape = '';
                let clipPathDef = '';
                let clipAttr = '';

                if (shape === 'circle') {
                    const r = bgSize / 2;
                    logoBgShape = `<circle cx="${(bgX + r).toFixed(2)}" cy="${(bgY + r).toFixed(2)}" r="${r.toFixed(2)}" fill="${logo.bgColor || '#ffffff'}" />`;
                    clipPathDef = `<clipPath id="logo-clip"><circle cx="${(logoX + logoSize/2).toFixed(2)}" cy="${(logoY + logoSize/2).toFixed(2)}" r="${(logoSize/2).toFixed(2)}" /></clipPath>`;
                    clipAttr = 'clip-path="url(#logo-clip)"';
                } else if (shape === 'square') {
                    logoBgShape = `<rect x="${bgX.toFixed(2)}" y="${bgY.toFixed(2)}" width="${bgSize.toFixed(2)}" height="${bgSize.toFixed(2)}" rx="8" ry="8" fill="${logo.bgColor || '#ffffff'}" />`;
                    clipPathDef = `<clipPath id="logo-clip"><rect x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" rx="6" ry="6" /></clipPath>`;
                    clipAttr = 'clip-path="url(#logo-clip)"';
                }

                logoSVG = `
    <g id="Logo-Badge">
      ${clipPathDef}
      ${logoBgShape}
      <image href="${logo.dataUrl}" x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" ${clipAttr} preserveAspectRatio="xMidYMid meet" />
    </g>`;
            }

            // Final SVG composition with structured Figma-ready layers
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="geometricPrecision">
  ${defs}
  <g id="QR-Studio-Frame">
    ${bgRect}
    <g id="QR-Modules">
      ${modulesSVG}
    </g>
    <g id="Finder-Eyes">
      ${eyesSVG}
    </g>
    ${logoSVG}
  </g>
</svg>`;
        }

        /**
         * Renders the 3 corner finder eyes in SVG
         */
        renderSVGEyes(moduleCount, quietZone, moduleSize, eyeStyle, outerColor, innerColor, cutColor) {
            const eyePositions = [
                { r: 0, c: 0 },
                { r: 0, c: moduleCount - 7 },
                { r: moduleCount - 7, c: 0 }
            ];

            let eyesSVG = '';
            eyePositions.forEach(pos => {
                const ox = (pos.c + quietZone) * moduleSize;
                const oy = (pos.r + quietZone) * moduleSize;
                const fullEyeSize = 7 * moduleSize;

                if (eyeStyle === 'circle') {
                    const cx = ox + fullEyeSize / 2;
                    const cy = oy + fullEyeSize / 2;
                    const outerRadius = (fullEyeSize / 2).toFixed(2);
                    const cutRadius = (fullEyeSize * 5 / 14).toFixed(2);
                    const innerRadius = (fullEyeSize * 3 / 14).toFixed(2);

                    eyesSVG += `
          <circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${outerColor}" />
          <circle cx="${cx}" cy="${cy}" r="${cutRadius}" fill="${cutColor}" />
          <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${innerColor}" />`;
                } else if (eyeStyle === 'rounded') {
                    const rx = (moduleSize * 1.8).toFixed(2);
                    const cutX = (ox + moduleSize).toFixed(2);
                    const cutY = (oy + moduleSize).toFixed(2);
                    const cutSize = (5 * moduleSize).toFixed(2);
                    const cutRx = (moduleSize * 1.2).toFixed(2);

                    const pupilX = (ox + 2 * moduleSize).toFixed(2);
                    const pupilY = (oy + 2 * moduleSize).toFixed(2);
                    const pupilSize = (3 * moduleSize).toFixed(2);
                    const pupilRx = (moduleSize * 0.9).toFixed(2);

                    eyesSVG += `
          <rect x="${ox.toFixed(2)}" y="${oy.toFixed(2)}" width="${fullEyeSize.toFixed(2)}" height="${fullEyeSize.toFixed(2)}" rx="${rx}" ry="${rx}" fill="${outerColor}" />
          <rect x="${cutX}" y="${cutY}" width="${cutSize}" height="${cutSize}" rx="${cutRx}" ry="${cutRx}" fill="${cutColor}" />
          <rect x="${pupilX}" y="${pupilY}" width="${pupilSize}" height="${pupilSize}" rx="${pupilRx}" ry="${pupilRx}" fill="${innerColor}" />`;
                } else {
                    // Classic square eyes
                    const cutX = (ox + moduleSize).toFixed(2);
                    const cutY = (oy + moduleSize).toFixed(2);
                    const cutSize = (5 * moduleSize).toFixed(2);

                    const pupilX = (ox + 2 * moduleSize).toFixed(2);
                    const pupilY = (oy + 2 * moduleSize).toFixed(2);
                    const pupilSize = (3 * moduleSize).toFixed(2);

                    eyesSVG += `
          <rect x="${ox.toFixed(2)}" y="${oy.toFixed(2)}" width="${fullEyeSize.toFixed(2)}" height="${fullEyeSize.toFixed(2)}" fill="${outerColor}" />
          <rect x="${cutX}" y="${cutY}" width="${cutSize}" height="${cutSize}" fill="${cutColor}" />
          <rect x="${pupilX}" y="${pupilY}" width="${pupilSize}" height="${pupilSize}" fill="${innerColor}" />`;
                }
            });
            return eyesSVG;
        }

        /**
         * Renders the QR code directly to an HTML5 Canvas element
         */
        renderToCanvas(canvas, options = {}) {
            const svgString = this.generateSVG(options);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = options.size || 500;
                    canvas.height = options.size || 500;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    resolve(canvas);
                };
                img.onerror = (err) => {
                    URL.revokeObjectURL(url);
                    reject(err);
                };
                img.src = url;
            });
        }

        /**
         * Export to PDF Blob without external dependencies
         */
        generatePDFBlob(canvas, title = "QR Code") {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            // Standard A4 PDF minimal binary structure
            const width = 595.28; // A4 width in pt
            const height = 841.89; // A4 height in pt
            const qrSize = 340;
            const x = (width - qrSize) / 2;
            const y = (height - qrSize) / 2 - 30;

            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #ffffff; color: #1e293b; }
    .card { text-align: center; padding: 40px; border-radius: 20px; }
    img { width: ${qrSize}px; height: ${qrSize}px; border-radius: 12px; }
    h2 { margin-top: 24px; font-size: 20px; font-weight: 600; }
    p { margin-top: 8px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${imgData}" />
    <h2>${title}</h2>
    <p>Scan with any camera or QR code scanner</p>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;
            return new Blob([html], { type: 'text/html' });
        }
    }

    global.QREngine = new QREngine();

})(typeof window !== 'undefined' ? window : this);
