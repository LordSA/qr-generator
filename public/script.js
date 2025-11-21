function generateQR() {
    const url = document.getElementById('urlInput').value;
    const qrresult = document.getElementById('qr-result');
    const qrImage = document.getElementById('qrImage');
    const dl = document.getElementById('downloadLink');

    if (!url) {
        alert("Thandhayillayima kanikkaruth");
        return;
    }
    const apiUrl = `/api/index?url=${encodeURIComponent(url)}`;
    qrImage.src = apiUrl;
    dl.href = apiUrl;
    qrresult.classList.remove('hidden');
}