/**
 * QR Studio - Interactive Dashboard Controller
 * Handles state, reactive updates, logo uploads, vector exports, and clipboard integration.
 */

(function () {
    'use strict';

    // Application State
    const state = {
        text: 'https://qr.shibili.xyz',
        design: 'squares', // 'squares' | 'dots' | 'rounded'
        eyeStyle: 'square', // 'square' | 'rounded' | 'circle'
        colorMode: 'solid', // 'solid' | 'gradient'
        fgColor: '#000000',
        gradColor1: '#000000',
        gradColor2: '#333333',
        gradAngle: 45,
        eyeOuterColor: '',
        eyeInnerColor: '',
        bgColor: '#ffffff',
        transparentBg: false,
        correctionLevel: 'H',
        exportSize: 500,
        quietZone: 3,
        logo: null // { dataUrl, fileName, sizeRatio, shape, bgPadding }
    };

    let renderTimeout = null;

    // Toast Notification System
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.className = 'toast hidden';
        }, 3200);
    }

    // Debounced Reactive QR Renderer
    function scheduleRender(delay = 30) {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderQR, delay);
    }

    async function renderQR() {
        if (typeof QREngine === 'undefined') {
            console.error('QREngine not loaded');
            return;
        }

        const svgContainer = document.getElementById('svgContainer');
        const exportCanvas = document.getElementById('exportCanvas');
        if (!svgContainer || !exportCanvas) return;

        const options = {
            text: state.text || 'https://example.com',
            correctionLevel: state.correctionLevel,
            size: state.exportSize,
            quietZone: state.quietZone,
            design: state.design,
            colorType: state.colorMode,
            fgColor: state.fgColor,
            gradientColor1: state.gradColor1,
            gradientColor2: state.gradColor2,
            gradientAngle: state.gradAngle,
            bgColor: state.bgColor,
            transparentBg: state.transparentBg,
            eyeStyle: state.eyeStyle,
            eyeOuterColor: state.eyeOuterColor,
            eyeInnerColor: state.eyeInnerColor,
            logo: state.logo
        };

        try {
            // 1. Generate SVG and mount into live preview stage
            const svgString = QREngine.generateSVG(options);
            svgContainer.innerHTML = svgString;

            // 2. Render to hidden export canvas for raster / clipboard exports
            await QREngine.renderToCanvas(exportCanvas, options);
        } catch (err) {
            console.warn('QR Render warning:', err);
            showToast('Unable to encode data. Try reducing text length or increasing correction.', 'warning');
        }
    }

    // Expose global for backward compatibility
    window.generateQR = function () {
        const input = document.getElementById('urlInput');
        if (input) state.text = input.value.trim();
        renderQR();
    };

    // Copy clean Vector SVG for Figma / Canva
    async function copyVectorForFigma() {
        if (!state.text) {
            showToast('Enter some text or a URL first.', 'warning');
            return;
        }

        try {
            const options = {
                text: state.text,
                correctionLevel: state.correctionLevel,
                size: state.exportSize,
                quietZone: state.quietZone,
                design: state.design,
                colorType: state.colorMode,
                fgColor: state.fgColor,
                gradientColor1: state.gradColor1,
                gradientColor2: state.gradColor2,
                gradientAngle: state.gradAngle,
                bgColor: state.bgColor,
                transparentBg: state.transparentBg,
                eyeStyle: state.eyeStyle,
                eyeOuterColor: state.eyeOuterColor,
                eyeInnerColor: state.eyeInnerColor,
                logo: state.logo
            };

            const svgString = QREngine.generateSVG(options);

            // Create both text/plain and image/svg+xml clipboard items
            if (navigator.clipboard && navigator.clipboard.write) {
                const textBlob = new Blob([svgString], { type: 'text/plain' });
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/plain': textBlob,
                            'image/svg+xml': svgBlob
                        })
                    ]);
                    showToast('✓ Vector Frame copied! Ready to paste into Figma / Canva.', 'success');
                    return;
                } catch {
                    // Fallback to text/plain only
                    await navigator.clipboard.writeText(svgString);
                    showToast('✓ Vector SVG copied! Paste directly into Figma canvas.', 'success');
                    return;
                }
            } else {
                await navigator.clipboard.writeText(svgString);
                showToast('✓ Vector SVG copied to clipboard.', 'success');
            }
        } catch (err) {
            console.error('Vector copy error:', err);
            showToast('Clipboard permission denied.', 'error');
        }
    }

    // Copy PNG Image to clipboard
    async function copyPNGImage() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showToast('Failed to generate image.', 'error');
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showToast('✓ PNG copied to clipboard!', 'success');
                } catch (err) {
                    console.warn('Clipboard write error:', err);
                    showToast('Unable to write image to clipboard directly.', 'warning');
                }
            }, 'image/png');
        } catch (err) {
            showToast('Unable to copy image.', 'error');
        }
    }

    // File Download Handler
    function triggerDownload(dataUrlOrBlob, filename) {
        const anchor = document.getElementById('downloadAnchor');
        if (!anchor) return;

        const isBlob = dataUrlOrBlob instanceof Blob;
        const url = isBlob ? URL.createObjectURL(dataUrlOrBlob) : dataUrlOrBlob;

        anchor.href = url;
        anchor.download = filename;
        anchor.click();

        if (isBlob) {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        showToast(`✓ Downloaded ${filename}`, 'success');
    }

    function downloadPNG() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'qr-code.png');
    }

    function downloadSVG() {
        const svgContainer = document.getElementById('svgContainer');
        if (!svgContainer) return;
        const svg = svgContainer.querySelector('svg');
        if (!svg) return;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        triggerDownload(blob, 'qr-code.svg');
    }

    function downloadJPG() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        triggerDownload(dataUrl, 'qr-code.jpg');
    }

    function downloadPDF() {
        const canvas = document.getElementById('exportCanvas');
        if (!canvas) return;
        const pdfBlob = QREngine.generatePDFBlob(canvas, state.text || "QR Code");
        // Open printable view
        const url = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            showToast('✓ PDF print view opened.', 'info');
        } else {
            triggerDownload(pdfBlob, 'qr-code-document.html');
        }
    }

    // Logo Handling & Protection
    function updateCorrectionUIForLogo(hasLogo) {
        const notice = document.getElementById('logoCorrectionNotice');
        const cardL = document.getElementById('cardL');
        const cardM = document.getElementById('cardM');
        const radioL = document.querySelector('input[name="correctionLevel"][value="L"]');
        const radioM = document.querySelector('input[name="correctionLevel"][value="M"]');
        const radioH = document.querySelector('input[name="correctionLevel"][value="H"]');

        if (hasLogo) {
            // Lock to Level H (or Q)
            if (notice) notice.classList.remove('hidden');
            if (cardL) cardL.classList.add('disabled');
            if (cardM) cardM.classList.add('disabled');
            if (radioL) radioL.disabled = true;
            if (radioM) radioM.disabled = true;

            // Ensure state is set to Level H
            state.correctionLevel = 'H';
            if (radioH) {
                radioH.checked = true;
                document.querySelectorAll('.correction-card').forEach(c => c.classList.remove('active'));
                radioH.closest('.correction-card')?.classList.add('active');
            }
        } else {
            // Restore all options
            if (notice) notice.classList.add('hidden');
            if (cardL) cardL.classList.remove('disabled');
            if (cardM) cardM.classList.remove('disabled');
            if (radioL) radioL.disabled = false;
            if (radioM) radioM.disabled = false;
        }
    }

    function handleLogoFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Please upload a valid image file (PNG, SVG, JPG, WebP).', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const sizeRatio = parseInt(document.getElementById('logoSizeRatio')?.value || '20', 10) / 100;
            const shape = document.querySelector('input[name="logoShape"]:checked')?.value || 'circle';
            const padding = parseInt(document.getElementById('logoPadding')?.value || '1', 10);
            const matchBg = document.getElementById('matchQrBg')?.checked ?? true;
            const customBg = document.getElementById('logoBgColorInput')?.value || '#ffffff';
            const hasBorder = document.getElementById('logoBorder')?.checked ?? true;

            state.logo = {
                dataUrl,
                fileName: file.name,
                sizeRatio,
                shape,
                padding,
                matchBg,
                bgColor: matchBg ? (state.transparentBg ? '#ffffff' : state.bgColor) : customBg,
                hasBorder,
                borderColor: 'rgba(0, 0, 0, 0.15)'
            };

            // Enforce Error Correction Level H (30%)
            updateCorrectionUIForLogo(true);

            // Update UI card
            const activeCard = document.getElementById('activeLogoCard');
            const logoThumb = document.getElementById('logoThumb');
            const logoName = document.getElementById('logoFileName');
            if (activeCard && logoThumb && logoName) {
                logoThumb.src = dataUrl;
                logoName.textContent = file.name;
                activeCard.classList.remove('hidden');
            }

            showToast('✓ Logo added! Error correction locked to Level H (30%) for scannability.', 'success');
            scheduleRender();
        };
        reader.readAsDataURL(file);
    }

    function removeLogo() {
        state.logo = null;
        const activeCard = document.getElementById('activeLogoCard');
        const fileInput = document.getElementById('logoFileInput');
        if (activeCard) activeCard.classList.add('hidden');
        if (fileInput) fileInput.value = '';

        // Re-enable low/medium correction
        updateCorrectionUIForLogo(false);

        showToast('Logo removed. All error correction levels restored.', 'info');
        scheduleRender();
    }

    // DOM Initialization & Event Bindings
    document.addEventListener('DOMContentLoaded', () => {
        // 1. Tab Navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) targetPanel.classList.add('active');
            });
        });

        // 2. Preset Chips
        const chips = document.querySelectorAll('.preset-chips .chip');
        const urlInput = document.getElementById('urlInput');

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const placeholder = chip.getAttribute('data-placeholder');
                if (placeholder && urlInput) {
                    urlInput.placeholder = placeholder;
                    if (chip.getAttribute('data-type') === 'url' && (!urlInput.value || urlInput.value.startsWith('http'))) {
                        urlInput.value = 'https://qr.shibili.xyz';
                    }
                    state.text = urlInput.value.trim();
                    scheduleRender();
                }
            });
        });

        // 3. Text Input & Clear Button
        const clearBtn = document.getElementById('clearBtn');
        if (urlInput) {
            urlInput.addEventListener('input', () => {
                state.text = urlInput.value.trim();
                scheduleRender(150);
            });
        }
        if (clearBtn && urlInput) {
            clearBtn.addEventListener('click', () => {
                urlInput.value = '';
                state.text = '';
                urlInput.focus();
                scheduleRender();
            });
        }

        // 4. Design Style Selector (Squares, Dots, Rounded)
        document.querySelectorAll('input[name="qrDesign"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('input[name="qrDesign"]').forEach(r => {
                    r.closest('.design-card')?.classList.remove('active');
                });
                e.target.closest('.design-card')?.classList.add('active');
                state.design = e.target.value;
                scheduleRender();
            });
        });

        // 5. Eye Style Selector
        document.querySelectorAll('input[name="eyeStyle"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('input[name="eyeStyle"]').forEach(r => {
                    r.closest('.design-card')?.classList.remove('active');
                });
                e.target.closest('.design-card')?.classList.add('active');
                state.eyeStyle = e.target.value;
                scheduleRender();
            });
        });

        // 6. Color Controls & Modes
        const solidBtn = document.getElementById('solidColorBtn');
        const gradBtn = document.getElementById('gradientColorBtn');
        const solidControls = document.getElementById('solidColorControls');
        const gradControls = document.getElementById('gradientControls');

        if (solidBtn && gradBtn && solidControls && gradControls) {
            solidBtn.addEventListener('click', () => {
                solidBtn.classList.add('active');
                gradBtn.classList.remove('active');
                solidControls.classList.remove('hidden');
                gradControls.classList.add('hidden');
                state.colorMode = 'solid';
                scheduleRender();
            });

            gradBtn.addEventListener('click', () => {
                gradBtn.classList.add('active');
                solidBtn.classList.remove('active');
                gradControls.classList.remove('hidden');
                solidControls.classList.add('hidden');
                state.colorMode = 'gradient';
                scheduleRender();
            });
        }

        const fgInput = document.getElementById('fgColorInput');
        const fgHex = document.getElementById('fgColorHex');
        if (fgInput) {
            fgInput.addEventListener('input', () => {
                state.fgColor = fgInput.value;
                if (fgHex) fgHex.textContent = fgInput.value;
                scheduleRender();
            });
        }

        const grad1Input = document.getElementById('gradColor1');
        const grad1Hex = document.getElementById('gradHex1');
        if (grad1Input) {
            grad1Input.addEventListener('input', () => {
                state.gradColor1 = grad1Input.value;
                if (grad1Hex) grad1Hex.textContent = grad1Input.value;
                scheduleRender();
            });
        }

        const grad2Input = document.getElementById('gradColor2');
        const grad2Hex = document.getElementById('gradHex2');
        if (grad2Input) {
            grad2Input.addEventListener('input', () => {
                state.gradColor2 = grad2Input.value;
                if (grad2Hex) grad2Hex.textContent = grad2Input.value;
                scheduleRender();
            });
        }

        const angleSlider = document.getElementById('gradientAngle');
        const angleVal = document.getElementById('angleVal');
        if (angleSlider) {
            angleSlider.addEventListener('input', () => {
                state.gradAngle = parseInt(angleSlider.value, 10);
                if (angleVal) angleVal.textContent = `${state.gradAngle}°`;
                scheduleRender();
            });
        }

        // Accordion for Eye Colors
        const toggleEyeBtn = document.getElementById('toggleEyeColors');
        const eyeColorBody = document.getElementById('eyeColorBody');
        if (toggleEyeBtn && eyeColorBody) {
            toggleEyeBtn.addEventListener('click', () => {
                const isHidden = eyeColorBody.classList.toggle('hidden');
                const chevron = toggleEyeBtn.querySelector('.chevron');
                if (chevron) chevron.textContent = isHidden ? '▼' : '▲';
            });
        }

        const eyeOuterInput = document.getElementById('eyeOuterColor');
        const eyeOuterHex = document.getElementById('eyeOuterHex');
        if (eyeOuterInput) {
            eyeOuterInput.addEventListener('input', () => {
                state.eyeOuterColor = eyeOuterInput.value;
                if (eyeOuterHex) eyeOuterHex.textContent = eyeOuterInput.value;
                scheduleRender();
            });
        }

        const eyeInnerInput = document.getElementById('eyeInnerColor');
        const eyeInnerHex = document.getElementById('eyeInnerHex');
        if (eyeInnerInput) {
            eyeInnerInput.addEventListener('input', () => {
                state.eyeInnerColor = eyeInnerInput.value;
                if (eyeInnerHex) eyeInnerHex.textContent = eyeInnerInput.value;
                scheduleRender();
            });
        }

        // Background Color & Transparency
        const bgInput = document.getElementById('bgColorInput');
        const bgHex = document.getElementById('bgColorHex');
        const transparentCheckbox = document.getElementById('transparentBg');

        if (bgInput) {
            bgInput.addEventListener('input', () => {
                state.bgColor = bgInput.value;
                if (bgHex) bgHex.textContent = bgInput.value;
                scheduleRender();
            });
        }

        if (transparentCheckbox) {
            transparentCheckbox.addEventListener('change', () => {
                state.transparentBg = transparentCheckbox.checked;
                scheduleRender();
            });
        }

        // 7. Logo Upload & Drag-and-drop
        const dropzone = document.getElementById('logoDropzone');
        const fileInput = document.getElementById('logoFileInput');
        const removeLogoBtn = document.getElementById('removeLogoBtn');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleLogoFile(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleLogoFile(e.target.files[0]);
                }
            });
        }

        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', removeLogo);
        }

        const logoRatioSlider = document.getElementById('logoSizeRatio');
        const logoRatioVal = document.getElementById('logoSizeVal');
        if (logoRatioSlider) {
            logoRatioSlider.addEventListener('input', () => {
                const pct = parseInt(logoRatioSlider.value, 10);
                if (logoRatioVal) logoRatioVal.textContent = `${pct}%`;
                if (state.logo) {
                    state.logo.sizeRatio = pct / 100;
                    scheduleRender();
                }
            });
        }

        document.querySelectorAll('input[name="logoShape"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('input[name="logoShape"]').forEach(r => {
                    r.closest('.design-card')?.classList.remove('active');
                });
                e.target.closest('.design-card')?.classList.add('active');
                if (state.logo) {
                    state.logo.shape = e.target.value;
                    scheduleRender();
                }
            });
        });

        // Logo Badge Background & Border Listeners
        const logoBgInput = document.getElementById('logoBgColorInput');
        const logoBgHex = document.getElementById('logoBgColorHex');
        const matchQrBgCheck = document.getElementById('matchQrBg');
        const logoBorderCheck = document.getElementById('logoBorder');
        const logoPaddingSlider = document.getElementById('logoPadding');
        const logoPaddingVal = document.getElementById('logoPaddingVal');

        if (logoBgInput) {
            logoBgInput.addEventListener('input', () => {
                if (logoBgHex) logoBgHex.textContent = logoBgInput.value;
                if (matchQrBgCheck) matchQrBgCheck.checked = false;
                if (state.logo) {
                    state.logo.matchBg = false;
                    state.logo.bgColor = logoBgInput.value;
                    scheduleRender();
                }
            });
        }

        if (matchQrBgCheck) {
            matchQrBgCheck.addEventListener('change', () => {
                if (state.logo) {
                    state.logo.matchBg = matchQrBgCheck.checked;
                    state.logo.bgColor = matchQrBgCheck.checked 
                        ? (state.transparentBg ? '#ffffff' : state.bgColor) 
                        : (logoBgInput ? logoBgInput.value : '#ffffff');
                    scheduleRender();
                }
            });
        }

        if (logoBorderCheck) {
            logoBorderCheck.addEventListener('change', () => {
                if (state.logo) {
                    state.logo.hasBorder = logoBorderCheck.checked;
                    scheduleRender();
                }
            });
        }

        if (logoPaddingSlider) {
            logoPaddingSlider.addEventListener('input', () => {
                const pad = parseInt(logoPaddingSlider.value, 10);
                if (logoPaddingVal) logoPaddingVal.textContent = `${pad} module${pad === 1 ? '' : 's'}`;
                if (state.logo) {
                    state.logo.padding = pad;
                    scheduleRender();
                }
            });
        }

        // 8. Error Correction Level with Logo Safeguard
        document.querySelectorAll('input[name="correctionLevel"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (state.logo && (e.target.value === 'L' || e.target.value === 'M')) {
                    showToast('⚠️ Low/Medium error correction is disabled to guarantee logo scannability.', 'warning');
                    const hRadio = document.querySelector('input[name="correctionLevel"][value="H"]');
                    if (hRadio) {
                        hRadio.checked = true;
                        document.querySelectorAll('.correction-card').forEach(r => r.classList.remove('active'));
                        hRadio.closest('.correction-card')?.classList.add('active');
                        state.correctionLevel = 'H';
                    }
                    return;
                }

                document.querySelectorAll('input[name="correctionLevel"]').forEach(r => {
                    r.closest('.correction-card')?.classList.remove('active');
                });
                e.target.closest('.correction-card')?.classList.add('active');
                state.correctionLevel = e.target.value;
                scheduleRender();
            });
        });

        // 9. Resolution & Margin
        const exportSelect = document.getElementById('exportSize');
        if (exportSelect) {
            exportSelect.addEventListener('change', () => {
                state.exportSize = parseInt(exportSelect.value, 10);
                scheduleRender();
            });
        }

        const quietSlider = document.getElementById('quietZone');
        const quietVal = document.getElementById('quietZoneVal');
        if (quietSlider) {
            quietSlider.addEventListener('input', () => {
                state.quietZone = parseInt(quietSlider.value, 10);
                if (quietVal) quietVal.textContent = `${state.quietZone} modules`;
                scheduleRender();
            });
        }

        // 10. Primary Action Buttons
        const copyFigmaBtn = document.getElementById('copyFigmaBtn');
        if (copyFigmaBtn) {
            copyFigmaBtn.addEventListener('click', copyVectorForFigma);
        }

        const copyPngBtn = document.getElementById('copyPngBtn');
        if (copyPngBtn) {
            copyPngBtn.addEventListener('click', copyPNGImage);
        }

        // Download Action Buttons
        const dlPngBtn = document.getElementById('dlPngBtn');
        if (dlPngBtn) dlPngBtn.addEventListener('click', downloadPNG);

        const dlSvgBtn = document.getElementById('dlSvgBtn');
        if (dlSvgBtn) dlSvgBtn.addEventListener('click', downloadSVG);

        const dlJpgBtn = document.getElementById('dlJpgBtn');
        if (dlJpgBtn) dlJpgBtn.addEventListener('click', downloadJPG);

        const dlPdfBtn = document.getElementById('dlPdfBtn');
        if (dlPdfBtn) dlPdfBtn.addEventListener('click', downloadPDF);

        // Initial First Render
        renderQR();
    });

})();