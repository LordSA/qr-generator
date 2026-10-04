let qrcodeInstance = null;

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.className = 'toast hidden';
    }, 3000);
}

function generateQR() {
    const input = document.getElementById('urlInput');
    const text = input ? input.value.trim() : '';
    const qrResult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qrImage');
    const dl = document.getElementById('downloadLink');
    const qrContainer = document.getElementById('qrContainer');

    if (!text) {
        showToast('Please enter a URL or text to generate a QR code.', 'warning');
        if (input) input.focus();
        return;
    }

    const fgColor = document.getElementById('fgColor')?.value || '#000000';
    const bgColor = document.getElementById('bgColor')?.value || '#ffffff';
    const size = parseInt(document.getElementById('qrSize')?.value || '240', 10);

    // Create a temporary hidden container for QRCodejs rendering
    let tempDiv = document.getElementById('qrcode-temp');
    if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = 'qrcode-temp';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
    }
    tempDiv.innerHTML = '';

    try {
        if (typeof QRCode !== 'undefined') {
            qrcodeInstance = new QRCode(tempDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: fgColor,
                colorLight: bgColor,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Wait a tick for canvas rendering
            setTimeout(() => {
                const canvas = tempDiv.querySelector('canvas');
                const img = tempDiv.querySelector('img');
                let dataUrl = '';

                if (canvas) {
                    dataUrl = canvas.toDataURL('image/png');
                } else if (img && img.src) {
                    dataUrl = img.src;
                }

                if (dataUrl) {
                    qrImage.src = dataUrl;
                    dl.href = dataUrl;
                    dl.download = 'qrcode.png';
                    qrResult.classList.remove('hidden');
                    qrResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    showToast('QR Code generated successfully!', 'success');
                } else {
                    fallbackToBackend(text);
                }
            }, 50);
        } else {
            fallbackToBackend(text);
        }
    } catch (err) {
        console.error('Client-side QR generation error:', err);
        fallbackToBackend(text);
    }
}

function fallbackToBackend(text) {
    const qrResult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qrImage');
    const dl = document.getElementById('downloadLink');

    const apiUrl = `/api/index?url=${encodeURIComponent(text)}`;
    qrImage.onerror = () => {
        showToast('Failed to generate QR code. Make sure server is running.', 'error');
    };
    qrImage.onload = () => {
        showToast('QR Code generated via Python backend!', 'success');
    };
    qrImage.src = apiUrl;
    dl.href = apiUrl;
    dl.download = 'qrcode.png';
    qrResult.classList.remove('hidden');
}

// Copy QR Image to clipboard
async function copyQRImage() {
    const qrImage = document.getElementById('qrImage');
    if (!qrImage || !qrImage.src) {
        showToast('No QR code to copy.', 'warning');
        return;
    }

    try {
        const res = await fetch(qrImage.src);
        const blob = await res.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type || 'image/png']: blob })
        ]);
        showToast('QR Code copied to clipboard!', 'success');
    } catch (err) {
        console.warn('Clipboard write failed:', err);
        try {
            await navigator.clipboard.writeText(document.getElementById('urlInput').value);
            showToast('Link copied to clipboard!', 'info');
        } catch {
            showToast('Unable to copy to clipboard.', 'error');
        }
    }
}

// Test backend API route
async function testBackendAPI() {
    const text = document.getElementById('urlInput')?.value.trim() || 'https://example.com';
    const apiUrl = `/api/index?url=${encodeURIComponent(text)}`;
    showToast('Testing Python backend API...', 'info');

    try {
        const response = await fetch(apiUrl);
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            document.getElementById('qrImage').src = objectUrl;
            document.getElementById('downloadLink').href = objectUrl;
            document.getElementById('qr-result').classList.remove('hidden');
            showToast('Backend API verified and working!', 'success');
        } else {
            showToast('Backend API responded with error status: ' + response.status, 'warning');
        }
    } catch (err) {
        showToast('Backend API is not reachable locally. (Client-side engine is active)', 'info');
    }
}

// DOM Setup
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const clearBtn = document.getElementById('clearBtn');
    const toggleOptions = document.getElementById('toggleOptions');
    const optionsPanel = document.getElementById('optionsPanel');
    const copyBtn = document.getElementById('copyBtn');
    const testApiBtn = document.getElementById('testApiBtn');
    const chips = document.querySelectorAll('.chip');

    // Enter key submits
    if (urlInput) {
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                generateQR();
            }
        });
        urlInput.addEventListener('input', () => {
            if (clearBtn) {
                clearBtn.style.visibility = urlInput.value ? 'visible' : 'hidden';
            }
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (urlInput) {
                urlInput.value = '';
                urlInput.focus();
                clearBtn.style.visibility = 'hidden';
            }
        });
    }

    // Toggle options
    if (toggleOptions && optionsPanel) {
        toggleOptions.addEventListener('click', () => {
            const isHidden = optionsPanel.classList.toggle('hidden');
            const chevron = toggleOptions.querySelector('.chevron');
            if (chevron) chevron.textContent = isHidden ? '▼' : '▲';
        });
    }

    // Auto-update if options change when QR is already visible
    ['fgColor', 'bgColor', 'qrSize'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                const qrResult = document.getElementById('qr-result');
                if (qrResult && !qrResult.classList.contains('hidden')) {
                    generateQR();
                }
            });
        }
    });

    // Quick chips
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            if (urlInput) {
                const placeholder = chip.getAttribute('data-placeholder');
                if (placeholder) urlInput.placeholder = placeholder;
                urlInput.focus();
            }
        });
    });

    // Copy button
    if (copyBtn) {
        copyBtn.addEventListener('click', copyQRImage);
    }

    // Test API button
    if (testApiBtn) {
        testApiBtn.addEventListener('click', testBackendAPI);
    }
});