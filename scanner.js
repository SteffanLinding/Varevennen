// Barcode scanning with the phone camera.
// Uses the browser's own BarcodeDetector where it exists (Android Chrome) and otherwise
// ZXing (zxing.min.js, @zxing/library 0.21.3, Apache-2.0), loaded the first time it is needed.
// Reading is made forgiving: high resolution, continuous focus, our own fast frame loop that tries the
// whole frame and the centre band, both binarizers and "try harder". A code counts as soon as its check
// digit is right (a wrong read almost never passes it). A photo of the code can be read too.
(() => {
  const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  let stream = null, raf = 0, timer = 0, stopped = true, track = null;

  const loadZxing = () => window.ZXing ? Promise.resolve() : new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = './zxing.min.js'; s.onload = ok;
    s.onerror = () => bad(new Error('Stregkodelæseren kunne ikke indlæses.')); document.head.append(s);
  });

  async function nativeDetector() {
    if (!('BarcodeDetector' in window)) return null;
    try { const ok = await window.BarcodeDetector.getSupportedFormats(); if (!FORMATS.some((f) => ok.includes(f))) return null; return new window.BarcodeDetector({ formats: FORMATS.filter((f) => ok.includes(f)) }); } catch (e) { return null; }
  }

  // EAN-13 / EAN-8 / UPC-A check digit
  const valid = (s) => { if (!/^\d{8}$|^\d{12,13}$/.test(s)) return false; const d = s.split('').map(Number); const chk = d.pop(); const sum = d.reverse().reduce((a, n, i) => a + n * (i % 2 ? 1 : 3), 0); return (10 - (sum % 10)) % 10 === chk; };

  // ---- ZXing on a canvas: several attempts per frame
  let mfr = null, mfrHard = null;
  function readers() {
    if (mfr) return;
    const Z = window.ZXing; const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    mfr = new Z.MultiFormatReader(); mfr.setHints(hints);
  }
  function decodeCanvas(cv) {
    const Z = window.ZXing; readers();
    for (const B of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) {
      try {
        const bmp = new Z.BinaryBitmap(new B(new Z.HTMLCanvasElementLuminanceSource(cv)));
        const r = mfr.decode(bmp); const t = r && r.getText(); if (t) return t;
      } catch (e) { /* not found in this attempt */ }
    }
    return '';
  }
  const work = document.createElement('canvas');
  // scale = max width to draw at; up = allow enlarging (small or blurred codes read better bigger)
  function drawFrame(src, x, y, cw, ch, maxW, up) {
    const k = up ? maxW / cw : Math.min(1, maxW / cw); work.width = Math.max(8, Math.round(cw * k)); work.height = Math.max(8, Math.round(ch * k));
    const g = work.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(src, x, y, cw, ch, 0, 0, work.width, work.height);
    return work;
  }
  // levels: stretch the grey range (bad light, low contrast); sharp: a light 3x3 sharpen (soft focus)
  function enhance(cv, sharp) {
    const g = cv.getContext('2d', { willReadFrequently: true }); const w = cv.width, h = cv.height; const im = g.getImageData(0, 0, w, h); const d = im.data;
    const hist = new Uint32Array(256); for (let i = 0; i < d.length; i += 4) hist[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++;
    const tot = w * h; let lo = 0, hi = 255, acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > tot * 0.02) { lo = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > tot * 0.02) { hi = v; break; } }
    const span = Math.max(40, hi - lo); const grey = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) grey[j] = ((((d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8) - lo) * 255) / span;
    if (sharp >= 3) { // soft focus / motion blur along the line: sharpen across the bars only
      const r = sharp === 3 ? 3 : 6, amt = sharp === 3 ? 2.5 : 4; const o2 = new Uint8ClampedArray(w * h);
      for (let y = 0; y < h; y++) { const row = y * w; let sum = 0; for (let x = 0; x < r; x++) sum += grey[row + x]; for (let x = 0; x < w; x++) { const a = x + r, b = x - r - 1; if (a < w) sum += grey[row + a]; if (b >= 0) sum -= grey[row + b]; const n = Math.min(w - 1, x + r) - Math.max(0, x - r) + 1; o2[row + x] = grey[row + x] + amt * (grey[row + x] - sum / n); } }
      for (let i = 0, j = 0; i < d.length; i += 4, j++) { d[i] = d[i + 1] = d[i + 2] = o2[j]; } g.putImageData(im, 0, 0); return cv;
    }
    const out = sharp ? new Uint8ClampedArray(w * h) : grey;
    if (sharp) for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const o = y * w + x; out[o] = 5 * grey[o] - grey[o - 1] - grey[o + 1] - grey[o - w] - grey[o + w]; }
    for (let i = 0, j = 0; i < d.length; i += 4, j++) { d[i] = d[i + 1] = d[i + 2] = out[j]; }
    g.putImageData(im, 0, 0); return cv;
  }
  // the attempts, in turn: whole frame, centre band, tight band enlarged, then the same with contrast/sharpening
  // [x, y, w, h (fractions of the frame), draw width, enlarge, enhance 0-4]
  // The code can be anywhere in the frame, so the whole frame is covered in bands (top, middle, bottom).
  const PLANS = [
    [0, 0, 1, 1, 1280, 0, 0], [0, 0.3, 1, 0.4, 1600, 0, 0], [0, 0.3, 1, 0.4, 1600, 0, 1],
    [0, 0.55, 1, 0.4, 1600, 0, 0], [0, 0.55, 1, 0.4, 1600, 0, 1], [0, 0.05, 1, 0.4, 1600, 0, 0], [0, 0.05, 1, 0.4, 1600, 0, 1],
    [0.1, 0.35, 0.8, 0.3, 1800, 1, 0], [0.25, 0.38, 0.5, 0.24, 1800, 1, 0], [0, 0.55, 1, 0.4, 2000, 1, 0], [0, 0.3, 1, 0.4, 2000, 1, 0], [0, 0.05, 1, 0.4, 2000, 1, 0], [0, 0.3, 1, 0.4, 1600, 0, 3], [0, 0.55, 1, 0.4, 1600, 0, 3], [0, 0.05, 1, 0.4, 1600, 0, 3],
    [0, 0.3, 1, 0.4, 2000, 1, 4], [0, 0.55, 1, 0.4, 2000, 1, 4], [0, 0.05, 1, 0.4, 2000, 1, 4],
    [0.25, 0.38, 0.5, 0.24, 1800, 1, 2], [0.25, 0.38, 0.5, 0.24, 1800, 1, 4]
  ];
  function decodeSource(src, sw, sh, attempt) {
    const [fx, fy, fw, fh, mw, up, enh] = PLANS[attempt % PLANS.length];
    const cv = drawFrame(src, sw * fx, sh * fy, sw * fw, sh * fh, mw, up);
    if (enh) enhance(cv, enh);
    return decodeCanvas(cv);
  }

  // start(video, onCode, onError): shows the camera in <video> and calls onCode(ean) once
  async function start(video, onCode, onError) {
    stop(); stopped = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { onError(new Error('nocamera')); return; }
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 }, advanced: [{ focusMode: 'continuous' }] }, audio: false });
      } catch (e) {
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw e;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
    } catch (e) { onError(e); return; }
    if (stopped) { stop(); return; }
    track = stream.getVideoTracks()[0] || null;
    try { // continuous focus and a little zoom where the phone allows it (helps with small codes)
      const cap = track && track.getCapabilities ? track.getCapabilities() : {}; const adv = {};
      if (cap.focusMode && cap.focusMode.includes('continuous')) adv.focusMode = 'continuous';
      if (cap.zoom && cap.zoom.max >= 2) adv.zoom = Math.min(2, cap.zoom.max);
      if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
    } catch (e) { /* not supported */ }
    video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
    try { await video.play(); } catch (e) { /* autoplay can wait for the first frame */ }
    const done = (code) => { if (stopped || !valid(code)) return false; const c = code.length === 12 ? '0' + code : code; stop(); onCode(c); return true; };
    const det = await nativeDetector();
    let n = 0;
    if (det) {
      const loop = async () => { if (stopped) return; try { if (video.readyState >= 2) { const r = await det.detect(video); for (const b of r) if (done(b.rawValue)) return; } } catch (e) {} raf = requestAnimationFrame(loop); };
      loop(); return;
    }
    try { await loadZxing(); } catch (e) { onError(e); return; }
    if (stopped) return;
    const tick = () => {
      if (stopped) return;
      if (video.readyState >= 2 && video.videoWidth) { try { const t = decodeSource(video, video.videoWidth, video.videoHeight, n++); if (t && done(t)) return; } catch (e) {} }
      timer = setTimeout(tick, 20);
    };
    tick();
  }

  // read a still photo of a barcode (the phone's own camera focuses far better than a live preview)
  async function readFile(file) {
    await loadZxing();
    let bmp; try { bmp = await createImageBitmap(file); } catch (e) { bmp = await new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = URL.createObjectURL(file); }); }
    const sw = bmp.width, sh = bmp.height;
    const rot = (cv) => { const r = document.createElement('canvas'); r.width = cv.height; r.height = cv.width; const g = r.getContext('2d', { willReadFrequently: true }); g.translate(r.width, 0); g.rotate(Math.PI / 2); g.drawImage(cv, 0, 0); return r; };
    for (let i = 0; i < PLANS.length * 2; i++) {
      const [fx, fy, fw, fh, mw, up, enh] = PLANS[i % PLANS.length]; const big = i < PLANS.length;
      const cv = drawFrame(bmp, sw * fx, sh * fy, sw * fw, sh * fh, big ? Math.max(mw, 2000) : mw * 0.6, up);
      if (enh) enhance(cv, enh);
      let t = decodeCanvas(cv); if (valid(t)) return t.length === 12 ? '0' + t : t;
      t = decodeCanvas(rot(cv)); if (valid(t)) return t.length === 12 ? '0' + t : t; // sideways
    }
    return '';
  }

  // torch, where the phone has one
  const torchOk = () => { try { const c = track && track.getCapabilities && track.getCapabilities(); return !!(c && c.torch); } catch (e) { return false; } };
  async function torch(on) { try { await track.applyConstraints({ advanced: [{ torch: !!on }] }); return true; } catch (e) { return false; } }

  function stop() {
    stopped = true; cancelAnimationFrame(raf); clearTimeout(timer);
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } track = null;
  }

  window.Scanner = { start, stop, valid, readFile, torchOk, torch };
})();
