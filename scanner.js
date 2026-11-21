// Barcode scanning with the phone camera.
// Uses the browser's own BarcodeDetector where it exists (Android Chrome) and otherwise
// ZXing (zxing.min.js, @zxing/library 0.21.3, Apache-2.0), loaded the first time it is needed.
(() => {
  const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  let stream = null, raf = 0, reader = null, stopped = true;

  const loadZxing = () => window.ZXing ? Promise.resolve() : new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = './zxing.min.js'; s.onload = ok;
    s.onerror = () => bad(new Error('Stregkodelæseren kunne ikke indlæses.')); document.head.append(s);
  });

  async function nativeDetector() {
    if (!('BarcodeDetector' in window)) return null;
    try { const ok = await window.BarcodeDetector.getSupportedFormats(); if (!FORMATS.some((f) => ok.includes(f))) return null; return new window.BarcodeDetector({ formats: FORMATS.filter((f) => ok.includes(f)) }); } catch (e) { return null; }
  }

  // start(video, onCode, onError): shows the camera in <video> and calls onCode(ean) once
  async function start(video, onCode, onError) {
    stop(); stopped = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { onError(new Error('nocamera')); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch (e) { onError(e); return; }
    if (stopped) { stop(); return; }
    video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
    try { await video.play(); } catch (e) { /* autoplay can wait for the first frame */ }
    let last = '', seen = 0;
    // a code must be read twice in a row before it counts, to avoid misreads
    const hit = (code) => { if (stopped || !/^\d{8,14}$/.test(code)) return; if (code === last) seen++; else { last = code; seen = 1; } if (seen >= 2) { const c = code.length === 12 ? '0' + code : code; stop(); onCode(c); } };
    const det = await nativeDetector();
    if (det) {
      const loop = async () => { if (stopped) return; try { if (video.readyState >= 2) { const r = await det.detect(video); if (r[0]) hit(r[0].rawValue); } } catch (e) {} raf = requestAnimationFrame(loop); };
      loop(); return;
    }
    try { await loadZxing(); } catch (e) { onError(e); return; }
    if (stopped) return;
    const Z = window.ZXing; const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
    reader = new Z.BrowserMultiFormatReader(hints, 250);
    reader.decodeFromStream(stream, video, (res) => { if (res) hit(res.getText()); }).catch(() => {});
  }

  function stop() {
    stopped = true; cancelAnimationFrame(raf);
    if (reader) { try { reader.reset(); } catch (e) {} reader = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  }

  // EAN-13 / EAN-8 / UPC check digit, for codes typed by hand
  const valid = (s) => { if (!/^\d{8}$|^\d{12,13}$/.test(s)) return false; const d = s.split('').map(Number); const chk = d.pop(); const sum = d.reverse().reduce((a, n, i) => a + n * (i % 2 ? 1 : 3), 0); return (10 - (sum % 10)) % 10 === chk; };

  window.Scanner = { start, stop, valid };
})();
