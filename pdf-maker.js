// Builds the shopping list PDF in the phone, from the week's real list (with quantities).
// Needs pdf-lib (vendored as pdf-lib.min.js, loaded on demand). Helvetica covers æ ø å and ×.
// Each item gets a one-choice field: prio 1 / 2 / 3 / ikke fundet, drawn as the app's prio marks.
(() => {
  const MM = 72 / 25.4;
  const SIZES = { a4: [210, 297], telefon: [100, 200] };

  async function makeListPdf(data, fmt) {
    const { PDFDocument, StandardFonts, rgb, PDFName, drawEllipse } = window.PDFLib;
    const ink = rgb(0.08, 0.06, 0.08), soft = rgb(0.33, 0.3, 0.33), rule = rgb(0.85, 0.83, 0.85), paper = rgb(0.973, 0.965, 0.973);
    const [wmm, hmm] = SIZES[fmt] || SIZES.a4;
    const W = wmm * MM, H = hmm * MM, pad = (fmt === 'telefon' ? 7 : 14) * MM;
    const small = fmt === 'telefon';
    const pdf = await PDFDocument.create();
    pdf.setTitle(data.title); pdf.setLanguage('da-DK'); pdf.setCreator('Vareven');
    const reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const form = pdf.getForm();
    let page, y;
    const newPage = () => { page = pdf.addPage([W, H]); page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper }); y = H - pad; };
    const text = (t, x, size, font = reg, color = ink, maxW = W - pad - x) => {
      // wrap on spaces
      const words = String(t).split(' '); let line = ''; const lines = [];
      words.forEach((w) => { const tryL = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(tryL, size) > maxW && line) { lines.push(line); line = w; } else line = tryL; });
      if (line) lines.push(line);
      lines.forEach((l) => { y -= size * 1.25; page.drawText(l, { x, y, size, font, color }); });
      return lines.length;
    };
    const need = (h) => { if (y - h < pad + 14) { footer(); newPage(); } };
    let pageNo = 0;
    const footer = () => { pageNo++; page.drawText(`Vareven, ${data.week}`, { x: pad, y: pad - 4, size: 7, font: reg, color: soft }); page.drawText(`Side ${pageNo}`, { x: W - pad - 30, y: pad - 4, size: 7, font: reg, color: soft }); };
    const box = (x, yy, s, p) => {
      const o = { x, y: yy, width: s, height: s, borderColor: p === 4 ? soft : ink, borderWidth: p === 1 ? 2 : 1.2 };
      if (p === 3) o.borderDashArray = [2.5, 2]; if (p === 4) o.borderDashArray = [0.8, 1.6];
      page.drawRectangle(o);
      const lbl = String(p); const fs = s * 0.55;
      page.drawText(lbl, { x: x + (s - bold.widthOfTextAtSize(lbl, fs)) / 2, y: yy + s * 0.27, size: fs, font: bold, color: p === 4 ? soft : ink });
    };

    newPage();
    text(data.title, pad, small ? 18 : 24, bold);
    y -= 4;
    if (data.dishes.length) { text(`Retter: ${data.dishes.join(', ')}`, pad, small ? 8 : 10, reg, soft); }
    text('Sæt kryds ved det, du fandt: 1 den rigtige, 2 godkendt, 3 nødløsning, 4 ikke fundet.', pad, small ? 7 : 8.5, reg, soft);
    y -= 6;
    page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.6, color: rule });

    const s = small ? 15 : 18, gap = small ? 3 : 5, colW = 4 * s + 3 * gap;
    const ellipse = (w, h) => pdf.context.register(pdf.context.formXObject(drawEllipse({ x: w / 2, y: h / 2, xScale: Math.min(w, h) * 0.26, yScale: Math.min(w, h) * 0.26, color: ink, borderWidth: 0 }), { BBox: [0, 0, w, h], Resources: {} }));
    const blankAp = (w, h) => pdf.context.register(pdf.context.formXObject([], { BBox: [0, 0, w, h], Resources: {} }));
    let lastCat = null; let n = 0;
    for (const r of data.rows) {
      need(small ? 46 : 40);
      if (r.cat !== lastCat) { y -= 6; text(r.cat, pad, small ? 7.5 : 8.5, bold, soft); lastCat = r.cat; }
      const top = y; y -= 4;
      const nameW = W - pad * 2 - colW - 8;
      text(`${r.qty > 1 ? r.qty + ' × ' : ''}${r.name}`, pad, small ? 10 : 11, bold, ink, nameW);
      if (r.want) text(r.want, pad, small ? 7.5 : 8.5, reg, soft, nameW);
      if (r.price) text(r.price, pad, small ? 7 : 8, reg, soft, nameW);
      const by = top - 6 - s;
      const g = form.createRadioGroup(`${++n}. ${r.name}`);
      [1, 2, 3, 4].forEach((p, k) => {
        const x = W - pad - colW + k * (s + gap); box(x, by, s, p);
        g.addOptionToPage(p === 4 ? 'ikke fundet' : `prio ${p}`, page, { x, y: by, width: s, height: s, borderWidth: 0 });
      });
      y = Math.min(y, by) - 6;
      page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.6, color: rule });
    }
    if (data.total) { need(30); y -= 6; text(data.total, pad, small ? 9 : 10.5, bold); if (data.totalNote) text(data.totalNote, pad, small ? 7 : 8, reg, soft); }
    footer();
    // own appearance: nothing when off (the printed mark shows), a dot when chosen
    form.getFields().forEach((f) => f.acroField.getWidgets().forEach((w) => {
      const r = w.getRectangle(); const N = pdf.context.obj({}); N.set(PDFName.of('Off'), blankAp(r.width, r.height)); N.set(w.getOnValue(), ellipse(r.width, r.height));
      w.setNormalAppearance(N); w.setAppearanceState(PDFName.of('Off'));
      const mk = w.getAppearanceCharacteristics(); if (mk) { mk.dict.delete(PDFName.of('BG')); mk.dict.delete(PDFName.of('BC')); }
    }));
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), pdf.context.obj(false));
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  window.makeListPdf = async (data, fmt) => {
    if (!window.PDFLib) await new Promise((ok, bad) => { const sc = document.createElement('script'); sc.src = './pdf-lib.min.js'; sc.onload = ok; sc.onerror = () => bad(new Error('PDF-værktøjet kunne ikke indlæses.')); document.head.append(sc); });
    return makeListPdf(data, fmt);
  };
})();
