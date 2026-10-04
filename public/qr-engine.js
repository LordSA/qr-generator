(function (global) {
    'use strict';

    class QREngine {
        constructor() {
            this.tempEl = document.createElement('div');
            this.tempEl.style.display = 'none';
            document.body.appendChild(this.tempEl);
        }

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

        isFinderEye(r, c, count) {
            if (r < 7 && c < 7) return 'TL';
            if (r < 7 && c >= count - 7) return 'TR';
            if (r >= count - 7 && c < 7) return 'BL';
            return null;
        }

        getLogoSafeBounds(moduleCount, logoRatio = 0.2, margin = 1) {
            const logoModules = Math.ceil(moduleCount * logoRatio);
            let start = Math.floor((moduleCount - logoModules) / 2) - margin;
            let end = Math.floor((moduleCount - logoModules) / 2) + logoModules + margin;

            start = Math.max(start, 7);
            end = Math.min(end, moduleCount - 7);

            return {
                start,
                end,
                center: (moduleCount - 1) / 2,
                radius: (end - start) / 2
            };
        }

        generateSVG(options = {}) {
            const {
                text = 'https://example.com',
                correctionLevel = 'H',
                size = 500,
                quietZone = 3,
                design = 'squares',
                colorType = 'solid',
                fgColor = '#000000',
                gradientColor1 = '#000000',
                gradientColor2 = '#333333',
                gradientAngle = 45,
                bgColor = '#ffffff',
                transparentBg = false,
                eyeStyle = 'square',
                eyeOuterColor = '',
                eyeInnerColor = '',
                logo = null
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

            const bgRect = transparentBg 
                ? '' 
                : `<rect id="Background" width="${size}" height="${size}" fill="${bgColor}" rx="12" ry="12" />`;

            const hasLogo = logo && logo.dataUrl;
            let logoBounds = null;
            if (hasLogo) {
                const ratio = Math.min(Math.max(logo.sizeRatio || 0.2, 0.12), 0.25);
                const paddingModules = (typeof logo.padding === 'number') ? logo.padding : 1;
                logoBounds = this.getLogoSafeBounds(moduleCount, ratio, paddingModules);
            }

            let modulesSVG = '';
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (this.isFinderEye(r, c, moduleCount)) continue;

                    if (hasLogo) {
                        const shape = logo.shape || 'circle';
                        if (shape === 'circle') {
                            const dist = Math.hypot(r - logoBounds.center, c - logoBounds.center);
                            if (dist <= logoBounds.radius + 0.2) continue;
                        } else {
                            if (r >= logoBounds.start && r < logoBounds.end && c >= logoBounds.start && c < logoBounds.end) {
                                continue;
                            }
                        }
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
                            modulesSVG += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(moduleSize + 0.1).toFixed(2)}" height="${(moduleSize + 0.1).toFixed(2)}" fill="${fillAttr}" />`;
                        }
                    }
                }
            }

            const outerColor = eyeOuterColor || fillAttr;
            const innerColor = eyeInnerColor || outerColor;
            let eyesSVG = this.renderSVGEyes(moduleCount, quietZone, moduleSize, eyeStyle, outerColor, innerColor, transparentBg ? '#ffffff' : bgColor);

            let logoSVG = '';
            if (hasLogo) {
                const logoScale = Math.min(Math.max(logo.sizeRatio || 0.2, 0.12), 0.25);
                const logoArea = size * logoScale;
                const logoPad = 6;
                const badgeSize = logoArea + (logoPad * 2);
                const badgeX = (size - badgeSize) / 2;
                const badgeY = (size - badgeSize) / 2;
                const logoX = (size - logoArea) / 2;
                const logoY = (size - logoArea) / 2;

                const shape = logo.shape || 'circle';
                const badgeBg = logo.bgColor || (transparentBg ? '#ffffff' : bgColor);
                const hasBorder = logo.hasBorder !== false;
                const borderStroke = hasBorder ? (logo.borderColor || 'rgba(0, 0, 0, 0.12)') : 'none';
                const borderWidth = hasBorder ? 1.5 : 0;

                let badgeShapeSVG = '';
                if (shape === 'circle') {
                    const cx = size / 2;
                    const cy = size / 2;
                    const r = badgeSize / 2;
                    badgeShapeSVG = `<circle id="Badge-Background" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${badgeBg}" stroke="${borderStroke}" stroke-width="${borderWidth}" />`;
                } else if (shape === 'square') {
                    const rx = (badgeSize * 0.18).toFixed(2);
                    badgeShapeSVG = `<rect id="Badge-Background" x="${badgeX.toFixed(2)}" y="${badgeY.toFixed(2)}" width="${badgeSize.toFixed(2)}" height="${badgeSize.toFixed(2)}" rx="${rx}" ry="${rx}" fill="${badgeBg}" stroke="${borderStroke}" stroke-width="${borderWidth}" />`;
                }

                logoSVG = `
    <g id="Logo-Badge">
      ${badgeShapeSVG}
      <image id="Logo-Image" href="${logo.dataUrl}" x="${logoX.toFixed(2)}" y="${logoY.toFixed(2)}" width="${logoArea.toFixed(2)}" height="${logoArea.toFixed(2)}" preserveAspectRatio="xMidYMid meet" />
    </g>`;
            }

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

                    if (options.logo && options.logo.dataUrl) {
                        const logoImg = new Image();
                        logoImg.onload = () => {
                            const size = canvas.width;
                            const logoScale = Math.min(Math.max(options.logo.sizeRatio || 0.2, 0.12), 0.25);
                            const logoArea = size * logoScale;
                            const logoPad = 6;
                            const badgeSize = logoArea + (logoPad * 2);
                            const badgeX = (size - badgeSize) / 2;
                            const badgeY = (size - badgeSize) / 2;
                            const logoX = (size - logoArea) / 2;
                            const logoY = (size - logoArea) / 2;

                            const shape = options.logo.shape || 'circle';
                            const badgeBg = options.logo.bgColor || (options.transparentBg ? '#ffffff' : (options.bgColor || '#ffffff'));
                            const hasBorder = options.logo.hasBorder !== false;
                            const borderColor = options.logo.borderColor || 'rgba(0, 0, 0, 0.12)';

                            if (shape === 'circle') {
                                const cx = size / 2;
                                const cy = size / 2;
                                const r = badgeSize / 2;
                                ctx.beginPath();
                                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                                ctx.fillStyle = badgeBg;
                                ctx.fill();
                                if (hasBorder) {
                                    ctx.strokeStyle = borderColor;
                                    ctx.lineWidth = 1.5;
                                    ctx.stroke();
                                }
                            } else if (shape === 'square') {
                                const rx = badgeSize * 0.18;
                                ctx.beginPath();
                                if (ctx.roundRect) {
                                    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, rx);
                                } else {
                                    ctx.rect(badgeX, badgeY, badgeSize, badgeSize);
                                }
                                ctx.fillStyle = badgeBg;
                                ctx.fill();
                                if (hasBorder) {
                                    ctx.strokeStyle = borderColor;
                                    ctx.lineWidth = 1.5;
                                    ctx.stroke();
                                }
                            }

                            ctx.drawImage(logoImg, logoX, logoY, logoArea, logoArea);
                            resolve(canvas);
                        };
                        logoImg.onerror = () => resolve(canvas);
                        logoImg.src = options.logo.dataUrl;
                    } else {
                        resolve(canvas);
                    }
                };
                img.onerror = (err) => {
                    URL.revokeObjectURL(url);
                    reject(err);
                };
                img.src = url;
            });
        }

        generatePDFBlob(canvas, title = "QR Code") {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const width = 595.28;
            const height = 841.89;
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
