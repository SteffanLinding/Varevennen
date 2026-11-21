// Tidies product data from Open Food Facts before the app shows it.
// Open Food Facts is written by volunteers in many languages, so the same brand can be spelled
// "rema1000", "REMA 1000" and "Rema", and amounts can say "15 eggs" or "1pcs".
// This runs once at start, on the in-memory copy. The source data is not changed.
(() => {
  const P = window.PRODUKTER; if (!P) return;
  const BRAND = {
    'coop': 'Coop', 'coop 365': 'Coop 365', 'coop 365 hverdag': 'Coop 365', 'coop 365 økologi': 'Coop 365 Økologi', 'coop økologi': 'Coop Økologi',
    'coop xtra': 'Xtra', 'xtra coop': 'Xtra', 'xtra by coop': 'Xtra', 'xtra': 'Xtra', '365': 'Coop 365',
    'rema': 'Rema 1000', 'rema1000': 'Rema 1000', 'rema 1000': 'Rema 1000', 'rama 1000': 'Rema 1000', 'rena 1000': 'Rema 1000', 'friland økologi rema': 'Friland',
    'salling': 'Salling', 'salling øko': 'Salling Øko', 'lidl': 'Lidl', 'lidl vildtrupgård': 'Vilstrupgård',
    'kims': 'KiMS', 'bähnke': 'Bähncke', 'änglemark': 'Änglamark', 'tullip': 'Tulip', 'slakteren': 'Slagteren', 'steff h': 'Steff Houlberg',
    'dr.oetker': 'Dr. Oetker', 'dr. oetker norge as': 'Dr. Oetker', 'øgo': 'Øgo', 'øko': '', 'arla foods amba': 'Arla', 'danæg products a/s': 'Danæg',
    'haugen-gruppen as': '', 'suzi wan': 'Suzi Wan', 'garden gourmet': 'Garden Gourmet', 'asian kitchen': 'Asian Kitchen', 'grøn balance': 'Grøn Balance', 'smart cooking': 'Smart Cooking', 'samsø syltefabrik': 'Samsø Syltefabrik', 'gram slot': 'Gram Slot', 'arvid nordquist': 'Arvid Nordquist', 'rice market': 'Rice Market', 'barilla norge as': 'Barilla', 'unilever norge as': 'Unilever', 'italpizza s.p.a.': '',
    'jsc "chumak"': 'Chumak', 'de danske familie gårde': 'De Danske Familiegårde', 'kykling': '', 'bami goreng': '', 'wok': '', 'scan': 'Scan',
    'nemlig basic': 'Nemlig.com', 'p&w': 'P&W'
  };
  const KEEP = new Set(['KiMS', 'P&W', 'ØGO']);
  const title = (s) => s.toLowerCase().replace(/(^|[\s\-'’.])([a-zæøåäöü])/g, (m, a, b) => a + b.toUpperCase());
  function brand(b) {
    if (!b) return '';
    const k = b.trim().toLowerCase();
    if (k in BRAND) return BRAND[k];
    if (KEEP.has(b)) return b;
    if (b === b.toLowerCase() || (b === b.toUpperCase() && b.replace(/[^A-ZÆØÅ]/g, '').length > 3)) return title(b);
    return b.replace(/\s+/g, ' ').trim();
  }
  const UNIT = { g: 'g', gr: 'g', gram: 'g', grams: 'g', kg: 'kg', l: 'l', liter: 'l', ml: 'ml', cl: 'cl', dl: 'dl', stk: 'stk', pcs: 'stk', piece: 'stk', pieces: 'stk', eggs: 'stk', egg: 'stk', stykker: 'stk' };
  function amount(a) {
    if (!a) return '';
    let s = String(a).trim();
    // egg sizes like "M/L" or "L/Xl" are not a unit
    let size = ''; s = s.replace(/\b([SMLX]{1,2})\/([SMLX]{1,2})\b/i, (m) => { size = m.toUpperCase(); return ''; }).trim();
    if (size && /^\d+$/.test(s)) s = `${s} stk`;
    s = s.replace(/^1 (\d)/, '$1');                            // "1 85g" was "85g"
    s = s.split(/\s*[\/=]\s*/)[0];                           // "200ml / 240g", "10x10 g=100g": keep the first measure
    s = s.replace(/(\d)\s*[xX×]\s*(\d)/g, '$1 × $2');
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)\b/g, (m, n, u) => { const k = UNIT[u.toLowerCase()]; return k ? `${n.replace('.', ',')} ${k}` : m; });
    s = s.replace(/^1000 g$/, '1 kg').replace(/, ca\.?.*$/, '');
    if (/^\d+$/.test(s)) s = '';                            // a bare number says nothing
    return [s, size].filter(Boolean).join(', ');
  }
  // known slips in the source data
  const WORDS = [[/\brema ?1000\b/gi, 'Rema 1000'], [/\bcoop\b/g, 'Coop'], [/\bpcs\b/gi, 'stk'], [/\bfristes\b/gi, 'frites'], [/\bproscuitto\b/gi, 'Prosciutto'], [/\btullip\b/gi, 'Tulip'], [/\bhvede mel\b/gi, 'Hvedemel'], [/\bkrydder urte\b/gi, 'Krydderurte'], [/\bsoja sauce\b/gi, 'Sojasauce'], [/\btomat ketchup\b/gi, 'Tomatketchup']];
  function name(n, b, raw) {
    if (!n) return '';
    let s = n.replace(/\s+/g, ' ').trim();
    if (raw && raw.trim() && s.toLowerCase().startsWith(raw.trim().toLowerCase() + ' ')) s = s.slice(raw.trim().length + 1);   // "Rema Rema nudler"
    s = s.replace(/(\d+(?:[.,]\d+)?)(g|kg|ml|l)\b/gi, (m, x, u) => `${x} ${u.toLowerCase()}`);
    if (s === s.toUpperCase() && /[A-ZÆØÅ]{4}/.test(s)) s = s.charAt(0) + s.slice(1).toLowerCase();
    WORDS.forEach(([re, to]) => { s = s.replace(re, to); });
    s = s.replace(/(\d)\.(\d)\s?%/g, '$1,$2 %').replace(/(\d)%/g, '$1 %');
    if (b && s.toLowerCase().startsWith(b.toLowerCase() + ' ')) s = s.slice(b.length + 1);   // "Coop Coop Pasta"
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  Object.values(P.varer).forEach((ps) => ps.forEach((p) => {
    p.raa = { navn: p.navn, maerke: p.maerke, maengde: p.maengde };
    p.maerke = brand(p.maerke);
    p.navn = name(p.navn, p.maerke, p.raa.maerke);
    p.maengde = amount(p.maengde);
  }));
})();
