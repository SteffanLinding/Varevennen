(() => {
  const S = window.SEED;
  const main = document.getElementById('main');
  const statusEl = document.getElementById('status');
  const KEY = 'drv-design-v1';
  // ISO week helpers: the app always opens on the current week, and each week has its own list
  const isoWeek = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); return `${y}-W${String(w).padStart(2, '0')}`; };
  const CUR_WEEK = isoWeek(new Date());
  const weekStart = (key) => { const [y, w] = key.split('-W').map(Number); const jan4 = new Date(Date.UTC(y, 0, 4)); const mon = new Date(jan4); mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7); return mon; };
  const shiftWeek = (key, n) => { const d = weekStart(key); d.setUTCDate(d.getUTCDate() + 7 * n + 3); return isoWeek(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
  const weekNo = (key) => +key.split('-W')[1];
  const weekRange = (key) => { const m = weekStart(key); const s2 = new Date(m); s2.setUTCDate(m.getUTCDate() + 6); const f = (d) => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', timeZone: 'UTC' }); return m.getUTCMonth() === s2.getUTCMonth() ? `${m.getUTCDate()}.\u2013${f(s2)}` : `${f(m)}\u2013${f(s2)}`; };

  // ---------- store ----------
  const blankWeek = () => ({ dishes: [], extra: {}, qty: {}, skip: {}, ticks: {}, cardOv: {}, opt: {}, note: {}, plan: {}, thawed: {} });
  const blank = () => ({
    v: 3,
    weeks: { [CUR_WEEK]: { ...blankWeek(), dishes: S.start.slice(), ticks: {} } },
    cards: {
      'Hakket svinekød': { p1: S.kort['Hakket svinekød'].p1, p2: S.kort['Hakket svinekød'].p2, p3: S.kort['Hakket svinekød'].p3, rule: 'spoerg_foerst', max: S.kort['Hakket svinekød'].maks_pris, store: S.kort['Hakket svinekød'].butik, note: S.kort['Hakket svinekød'].note },
      'Mælk': { p1: 'Arla letmælk 1,5 %, 1 L', ean1: '5700426101217', p2: '', p3: '', rule: 'naermeste', max: '', store: '', note: '' }
    }
  });
  let db;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    const base = blank();
    db = raw && typeof raw === 'object' ? { ...base, ...raw, cards: { ...base.cards, ...(raw.cards || {}) } } : base;
    // v2 kept one list at the top level: move it into the current week
    if (raw && !raw.weeks) { db.weeks = { [CUR_WEEK]: { ...blankWeek(), dishes: Array.isArray(raw.dishes) ? raw.dishes : S.start.slice(), ticks: raw.ticks || {}, extra: raw.extra || {}, qty: raw.qty || {}, skip: raw.skip || {} } }; ['dishes', 'ticks', 'extra', 'qty', 'skip'].forEach((k) => delete db[k]); }
    Object.values(db.weeks).forEach((w) => { Object.assign(w, { ...blankWeek(), ...w }); w.dishes = (w.dishes || []).filter((d) => S.retter[d]); });
  } catch (e) { db = blank(); }
  db.v = 3;
  db.week = CUR_WEEK;  // always open on this week
  const W = () => (db.weeks[db.week] ||= blankWeek());
  const weekLabel = () => `uge ${weekNo(db.week)}`;
  let undo = null;
  const viewP = {}; let qtyOpen = null;   // which prio a row shows after a swipe, and which row has the quantity bar open
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch (e) { return false; } };

  const RULES = {
    spring_over: ['Spring over', 'Køb ingenting af denne vare.'],
    billigste: ['Køb billigste variant', 'Tag den billigste af samme slags.'],
    spoerg_foerst: ['Spørg hjemme først', 'Send et spørgsmål, før du køber noget andet.'],
    naermeste: ['Køb nærmeste alternativ', 'Tag det, der ligner prio 1 mest.']
  };
  const catOf = Object.fromEntries(S.varer.map((v) => [v.navn, v.kategori]));
  const BANK = window.OPSKRIFTSBANK || { kategorier: [], nyeVarer: {}, opskrifter: {} };
  Object.assign(catOf, BANK.nyeVarer, db.egne || {});  // items from the recipe bank, and items the household typed in themselves
  const askOf = Object.fromEntries(S.varer.map((v) => [v.navn, v.afklar]));
  const slug = (s) => encodeURIComponent(s);
  const nb = (s) => esc(s).replace(/(\d) ?(%|g|kg|L|l|liter|stk\.?)(?=[\s,.]|$)/g, '$1&nbsp;$2').replace(/(\S*\d-\d\S*)/g, '<span class="nowrap">$1</span>');
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const lower1 = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const buzz = () => { try { navigator.vibrate?.(10); } catch (e) {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ---------- profile: allergies and items the household never buys ----------
  // varer: items that ARE the allergen and leave the list. tags: Open Food Facts allergen tags that hide a product.
  const ALLERGENER = [
    { id: 'gluten', navn: 'Gluten', varer: ['Hvedemel', 'Rasp', 'Pasta', 'Lasagneplader', 'Nudler', 'Tarteletter', 'Hotdogbrød', 'Pitabrød'], tags: /gluten|wheat|hvede|durum|rye|rug|barley|byg|oat|havre|spelt|小/i },
    { id: 'maelk', navn: 'Mælk', varer: ['Mælk', 'Smør', 'Revet ost'], tags: /milk|mælk|maelk|lactose|laktose|ost|whey|valle/i },
    { id: 'aeg', navn: 'Æg', varer: ['Æg'], tags: /egg|æg|aeg/i },
    { id: 'fisk', navn: 'Fisk', varer: ['Fiskefilet', 'Laks'], tags: /fish|fisk/i },
    { id: 'skaldyr', navn: 'Skaldyr og bløddyr', varer: [], tags: /crustacean|mollusc|skaldyr|rejer|shrimp/i },
    { id: 'noedder', navn: 'Nødder', varer: [], tags: /^nuts|tree-nut|nødder|hasselnød|mandel|almond|walnut|cashew/i },
    { id: 'jordnoedder', navn: 'Jordnødder', varer: [], tags: /peanut|jordnød/i },
    { id: 'soja', navn: 'Soja', varer: ['Soyasauce'], tags: /soy|soja|soya/i },
    { id: 'selleri', navn: 'Selleri', varer: [], tags: /celery|selleri/i },
    { id: 'sennep', navn: 'Sennep', varer: ['Sennep'], tags: /mustard|sennep/i },
    { id: 'sesam', navn: 'Sesam', varer: [], tags: /sesame|sesam/i },
    { id: 'lupin', navn: 'Lupin', varer: [], tags: /lupin/i },
    { id: 'sulfit', navn: 'Sulfit', varer: [], tags: /sulphur|sulfit|sulfite/i }
  ];
  const prof = () => (db.profil ||= { allergi: [], aldrig: [] });
  const myAllergies = () => ALLERGENER.filter((a) => prof().allergi.includes(a.id));
  // why an item is off the list, or null
  const blockOf = (v) => { if (prof().aldrig.includes(v)) return 'I køber den aldrig'; const a = myAllergies().find((x) => x.varer.includes(v)); return a ? `Allergi: ${lower1(a.navn)}` : null; };
  // which of the household's allergies a product has, from Open Food Facts (contains or may contain traces)
  const prodAllergy = (p) => { if (!p) return []; const tags = [...(p.allergener || []), ...(p.spor || [])]; return myAllergies().filter((a) => tags.some((t) => a.tags.test(t))).map((a) => a.navn); };
  const needOf = (d) => (S.retter[d] || []).filter((v) => !blockOf(v) && !(W().skip && W().skip[d] && W().skip[d].includes(v)));
  const fromDishes = () => new Set(W().dishes.flatMap(needOf));
  const listItems = () => [...new Set([...fromDishes(), ...Object.keys(W().extra || {})])];
  const qtyOf = (v) => (W().qty && W().qty[v]) || 1;
  const onList = (v) => listItems().includes(v);
  // − n + : extra items can go to 0 (off the list); items from a dish stay at 1 or more
  const stepper = (v, ctx) => { const on = onList(v); const q = qtyOf(v); const fromDish = fromDishes().has(v);
    if (!on) return `<button class="btn btn--quiet btn--s addbtn" type="button" data-qty="${esc(v)}" data-d="1" aria-label="Læg ${esc(v)} på listen">${icon.plus}<span>${ctx === 'kort' ? 'Læg på listen' : 'Tilføj'}</span></button>`;
    return `<span class="stepper" role="group" aria-label="Antal ${esc(v)}"><button class="iconbtn" type="button" data-qty="${esc(v)}" data-d="-1" aria-label="${q === 1 && !fromDish ? `Fjern ${esc(v)} fra listen` : `Færre ${esc(v)}`}" ${q === 1 && fromDish ? 'disabled' : ''}>${icon.minus}</button><output class="stepper__n" aria-live="polite">${q}</output><button class="iconbtn" type="button" data-qty="${esc(v)}" data-d="1" aria-label="Flere ${esc(v)}">${icon.plus}</button></span>`; };
  const stdCard = (v) => db.cards[v];
  const card = (v) => { const base = db.cards[v]; const ov = W().cardOv && W().cardOv[v]; return ov ? { ...(base || {}), ...ov } : base; };
  const hasOv = (v) => !!(W().cardOv && W().cardOv[v]);
  const ovCard = (v) => { const base = db.cards[v] || {}; const o = (W().cardOv[v] ||= {}); [1, 2, 3].forEach((n) => ['p', 'ean', 'foto'].forEach((k) => { if (!(k + n in o)) o[k + n] = base[k + n] || ''; })); return o; };
  const filled = (v) => !!(card(v) && card(v).p1);
  const mark = (p, cls = '', label) => `<span class="mark ${cls}" data-p="${p}" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${p === 0 ? '' : p === 'ok' ? icon.check : p === 'x' ? icon.cross : p === 'want' ? 1 : p}</span>`;
  const icon = {
    dice: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15Z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
    pot: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M9 7c0-1.5 1-2 1-3.5M14 7c0-1.5 1-2 1-3.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5.5v13l10.5-6.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
    scan: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3M8 9v6M11 9v6M14 9v6M17 9v6"/></svg>',
    cross: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>'
  };
  const back = (href, label) => `<a class="back" href="${href}" data-back>${icon.back}${esc(label)}</a>`;
  const FOUND = { 1: 'prio 1', 2: 'prio 2', 3: 'prio 3', 4: 'ikke fundet' };
  const PR = (window.PRODUKTER && window.PRODUKTER.varer) || {};
  const RB = window.RETTER_BILLEDER || {};
  // own photos win over product photos and stock photos
  const imgOf = (c, n) => c && c['foto' + n] ? { billede: c['foto' + n], own: true } : prodOf(c, n);
  // a ready meal has no photo of its own: show the pack of the first item
  const dishImg = (d) => (db.dishFoto && db.dishFoto[d]) || (RB[d] && RB[d].src) || (window.BANK_BILLEDER && window.BANK_BILLEDER[d] && window.BANK_BILLEDER[d].src) || ((window.FAERDIG_RETTER || []).includes(d) && S.retter[d] && S.retter[d][0] && (itemImg(S.retter[d][0]) || {}).src) || '';
  const photoPick = (kind, key, n, has, label) => `<label class="btn btn--quiet btn--s photo-pick">${icon.camera}<span>${has ? 'Skift foto' : label || 'Eget foto'}</span><input type="file" accept="image/*" class="visually-hidden" data-photo="${kind}" data-key="${esc(key)}" data-n="${n}" aria-label="${has ? 'Skift eget foto' : 'Tag eller vælg eget foto'}"></label>${has ? `<button class="btn btn--quiet btn--s" type="button" data-photo-del="${kind}" data-key="${esc(key)}" data-n="${n}">Fjern foto</button>` : ''}`;
  const byEan = {};
  Object.values(PR).forEach((list) => list.forEach((p) => { byEan[p.ean] = p; }));
  const CHAINS = ['Netto', 'Føtex', 'Bilka', 'Rema 1000', 'Lidl', 'Coop 365', 'Kvickly', 'SuperBrugsen', 'Meny', 'Spar', 'Løvbjerg'];
  const prodOf = (c, n) => c && c['ean' + n] ? byEan[c['ean' + n]] : null;
  const prodLabel = (p) => [p.maerke, p.navn].filter(Boolean).join(' ').replace(/^(\S+) \1 /i, '$1 ') + (p.maengde ? `, ${p.maengde}` : '');
  // where a product is known: 'ja' seen in the shop, 'nej' known elsewhere only, 'ukendt' no shop data
  const seenIn = (p, shop) => !p || !shop ? 'ukendt' : !Object.keys(p.butikker || {}).length ? 'ukendt' : p.butikker[shop] ? 'ja' : 'nej';
  const seenText = (st, shop) => st === 'ja' ? `Set i ${shop}` : st === 'nej' ? `Ikke set i ${shop}` : 'Butik ukendt';
  const thumb = (p, cls = 'thumb') => p && p.billede ? `<img class="${cls}" src="${esc(p.billede)}" alt="" width="400" height="400" loading="lazy">` : `<span class="${cls} ${cls}--none" aria-hidden="true"></span>`;
  const OFF_CREDIT = 'Produktdata og billeder: Open Food Facts-bidragydere (ODbL, CC BY-SA).';
  const weekNav = () => `<div class="weeknav no-print" role="group" aria-label="Vælg uge"><button class="iconbtn" type="button" data-week="-1" aria-label="Uge ${weekNo(shiftWeek(db.week, -1))}">${icon.back}</button><p class="weeknav__lbl"><b>Uge ${weekNo(db.week)}</b><span class="meta">${weekRange(db.week)}</span></p><button class="iconbtn" type="button" data-week="1" aria-label="Uge ${weekNo(shiftWeek(db.week, 1))}">${icon.fwd}</button><button class="btn btn--quiet btn--s weeknav__now" type="button" data-week="0" aria-pressed="${db.week === CUR_WEEK}">${db.week === CUR_WEEK ? icon.check : ''}<span>Denne uge</span></button></div>`;
  const SLOT = ['p', 'ean', 'foto'];
  const clearSlot = (c, n) => SLOT.forEach((k) => { c[k + n] = ''; });
  const copySlot = (c, from, to) => SLOT.forEach((k) => { c[k + to] = c[k + from] || ''; });
  // put a product at prio n: an existing copy is moved, the others slide down, and prio 3 can fall off
  function placeAt(c, n, p) {
    const at = [1, 2, 3].find((k) => c['ean' + k] === p.ean);
    if (at === n) return null;
    if (at) { for (let k = at; k < 3; k++) copySlot(c, k + 1, k); clearSlot(c, 3); }
    const dropped = c.p3 && c.ean3 !== p.ean ? c.p3 : null;
    for (let k = 3; k > n; k--) copySlot(c, k - 1, k);
    clearSlot(c, n); c['p' + n] = prodLabel(p); c['ean' + n] = p.ean;
    for (let k = 1; k <= 2; k++) if (!c['p' + k] && c['p' + (k + 1)]) { copySlot(c, k + 1, k); clearSlot(c, k + 1); }
    return at ? null : dropped;
  }
  // a few good starting points: one per brand, with picture, the household's shop first, then common types
  function suggest(v, max = 6) {
    const all = (PR[v] || []).filter((p) => p.billede && p.maerke && !prodAllergy(p).length);
    const typeCount = {}; all.forEach((p) => { typeCount[p.type] = (typeCount[p.type] || 0) + 1; });
    // Danish brands and Danish product names first; foreign-only labels last
    const DK = /^(arla|thise|løgismose|lurpak|kærgården|naturmælk|salling|rema ?1000|coop|änglamark|xtra|365|netto|føtex|bilka|first price|steff|tulip|gøl|danish crown|rose|dansk kylling|hk|3-stjernet|pålægskompagniet|kohberg|schulstad|bakersfield|bähncke|k-salat|beauvais|graasten|kelsen|urtekram|lidl|engvang|harvest basket|gram slot|hjem-is|frisko|sun lolly|nakskov|møllerens|valsemøllen|amo|lantmännen|knorr|dr\. oetker|grandiosa|kokkens)/i;
    const dkName = (p) => /[æøå]/i.test(p.navn) || DK.test(p.maerke || '');
    const foreign = /\b(korv|sausages?|with|und|mit|avec|wurst|bratwurst|grobe|franks|saucisse|fleisch|kött|ekologisk)\b/i;
    const score = (p) => (db.shop && seenIn(p, db.shop) === 'ja' ? 100 : 0) + (DK.test(p.maerke || '') ? 40 : 0) + (dkName(p) ? 20 : 0) - (foreign.test(p.navn) ? 50 : 0) + (Object.keys(p.butikker || {}).length ? 5 : 0) + (typeCount[p.type] || 0);
    const seen = new Set(); const out = [];
    [...all].sort((a, b) => score(b) - score(a)).forEach((p) => { const b = p.maerke.toLowerCase().replace(/\W/g, ''); if (!seen.has(b) && out.length < max) { seen.add(b); out.push(p); } });
    return out;
  }
  function autofill() {
    db.autofilled ||= [];
    S.varer.forEach(({ navn: v }) => {
      const c = db.cards[v];
      // an unreviewed suggestion whose product left the catalogue is made again
      const stale = c && c.auto && [1, 2, 3].some((n) => c['ean' + n] && !byEan[c['ean' + n]]);
      if (db.autofilled.includes(v) && !stale) return;
      if (!db.autofilled.includes(v)) db.autofilled.push(v);
      if (c && c.p1 && !stale) return;
      if (stale) ['p', 'ean', 'foto'].forEach((k) => [1, 2, 3].forEach((n) => delete c[k + n]));
      let list = suggest(v, 3);
      if (!list.length) list = (PR[v] || []).filter((p) => p.maerke).slice(0, 3);
      const nc = { ...(c || {}), rule: (c && c.rule) || 'naermeste', auto: true };
      if (list.length) list.forEach((p, k) => { nc['p' + (k + 1)] = prodLabel(p); nc['ean' + (k + 1)] = p.ean; });
      else nc.p1 = `${v}, almindelig`;
      db.cards[v] = nc;
    });
  }
  const short = (c, n) => { const p = prodOf(c, n); return p ? (p.maerke || p.navn) : (c['p' + n] || '').split(/[ ,]/)[0]; };
  // scope 'week' edits this week's list only; 'std' edits the standard in Mine varer
  const prioStrip = (v, scope, size = '') => { const c = scope === 'std' ? (stdCard(v) || {}) : (card(v) || {});
    return `<ol class="strip ${size}" data-strip="${esc(v)}" data-scope="${scope}" aria-label="${esc(v)}, prio 1 til 3. Træk eller brug piletasterne for at bytte.">${[1, 2, 3].map((n) => { const im = imgOf(c, n); const has = !!c['p' + n];
      return `<li><button type="button" class="tile${has ? '' : ' tile--empty'}" data-pslot="${n}" aria-label="Prio ${n}: ${has ? esc(c['p' + n]) : 'tom'}${has ? '. Træk for at flytte' : '. Tryk for at vælge'}">${mark(n)}${im && im.billede ? `<img src="${esc(im.billede)}" alt="" width="400" height="400" loading="lazy" draggable="false">` : `<span class="tile__none" aria-hidden="true">${has ? '' : icon.plus}</span>`}<span class="tile__lbl">${has ? esc(short(c, n)) : 'Vælg'}</span></button></li>`; }).join('')}</ol>`; };
  const suggestBlock = (v, c) => { const list = suggest(v); if (!list.length) return ''; const slotOf = (ean) => [1, 2, 3].find((n) => c && c['ean' + n] === ean);
    return `<section class="section sugg" aria-labelledby="sg"><h2 id="sg">Forslag til at starte med</h2><p class="meta">Tryk 1, 2 eller 3 for at lægge mærket ind som prio. ${db.shop ? `Set i ${esc(db.shop)} står først.` : 'Vælg butik under Indkøb, så står dens mærker først.'}</p>
      <ul class="sugg__list">${list.map((p) => { const at = slotOf(p.ean); const st = Object.keys(p.butikker || {}); return `<li class="sugg__item">${thumb(p, 'sugg__img')}<span class="sugg__txt"><b>${esc(p.maerke)}</b><span>${nb(p.navn + (p.maengde ? ', ' + p.maengde : ''))}</span><span class="meta">${esc(p.type)}${st.length ? '. Set i ' + esc(st.slice(0, 3).join(', ')) + (st.length > 3 ? ' m.fl.' : '') : ''}</span></span>
        <span class="sugg__to" role="group" aria-label="Læg ${esc(p.maerke)} ind som prio">${[1, 2, 3].map((n) => `<button type="button" class="slotbtn" data-sugg="${esc(p.ean)}" data-to="${n}" data-vare="${esc(v)}" aria-pressed="${at === n}" aria-label="Prio ${n}">${mark(n)}</button>`).join('')}</span></li>`; }).join('')}</ul>
      <p class="meta"><a class="link link--block" href="#/vaelg/${slug(v)}?prio=${c && c.p1 ? (c.p2 ? 3 : 2) : 1}" data-keepform>Se alle ${pl((PR[v] || []).length, 'produkt', 'produkter')}</a></p></section>`; };
  const swapPrio = (c, a, b) => { ['p', 'ean', 'foto'].forEach((k) => { const t = c[k + a]; c[k + a] = c[k + b] || ''; c[k + b] = t || ''; }); };
  const setStatus = (t, state) => { statusEl.textContent = t || ''; statusEl.dataset.state = state || ''; };
  // price per unit: own price first, then the prio 1 product's last price in Open Prices, then a typical price for the item
  const PZ = window.PRISER || { ean: {}, typisk: {} };
  const kr = (n) => `${n.toFixed(2).replace('.', ',').replace(',00', '')} kr`;
  function priceOf(v) {
    const own = (db.prices || []).filter((p) => p.vare === v).pop();
    if (own) return { n: own.price, kind: 'egen', label: `din pris${own.store ? ', ' + own.store : ''}` };
    const c = card(v); const e = c && PZ.ean[c.ean1];
    if (e) return { n: e.pris, kind: 'vare', label: `${e.butik || 'Open Prices'}${e.tilbud ? ', tilbud' : ''}` };
    const t = PZ.typisk[v];
    if (t) return { n: t.median, kind: 'ca', label: `typisk pris, ${t.antal} målinger` };
    return null;
  }
  function priceSum(items) {
    let sum = 0, n = 0;
    items.forEach((v) => { const p = priceOf(v); if (p) { sum += p.n * qtyOf(v); n++; } });
    return { sum, n, of: items.length };
  }
  const sumLine = (ps) => ps.n ? `Ca. ${kr(Math.round(ps.sum))} for ${ps.n} af ${pl(ps.of, 'vare', 'varer')}` : '';

  // ---------- add field: type, pick, or dictate ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const composer = () => `<div class="composer no-print"><div class="composer__in">
    <ul id="addlist" class="addlist" role="listbox" aria-label="Forslag" hidden></ul>
    <form class="composer__row" id="addform" autocomplete="off" novalidate>
      <label class="composer__field"><span class="visually-hidden">Tilføj vare</span>${icon.search}<input id="addq" name="q" type="text" placeholder="Tilføj vare…" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" role="combobox" aria-autocomplete="list" aria-controls="addlist" aria-expanded="false"></label>
      ${SR ? `<button class="iconbtn iconbtn--round" type="button" data-dictate aria-label="Sig hvad du skal have">${icon.mic}</button>` : ''}
      <a class="iconbtn iconbtn--round iconbtn--accent" href="#/scan" aria-label="Scan en vare">${icon.scan}</a>
    </form></div></div>`;
  const norm = (t) => String(t).toLowerCase().normalize('NFC').replace(/[^a-zæøå0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const allItems = () => [...S.varer.map((x) => x.navn), ...Object.keys(db.egne || {})];
  // a word as Danish shoppers say it: "æg", "æggene", "avocadoer", "løget" all point at the item
  const stem = (w) => w.replace(/(erne|ene|ene|en|et|er|e|r)$/, '');
  function findItems(text, max = 6) {
    const q = norm(text); if (!q) return [];
    const words = q.split(' ');
    const score = (v) => { const n = norm(v); if (n === q) return 100; if (n.startsWith(q)) return 80; if (n.split(' ').some((w) => w.startsWith(q))) return 60; if (words.every((w) => n.includes(stem(w)) || stem(n).includes(stem(w)))) return 40; return 0; };
    return [...new Set([...allItems(), ...Object.keys(BANK.nyeVarer)])].map((v) => [v, score(v)]).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'da')).slice(0, max).map(([v]) => v);
  }
  let lastAdd = null; let pendingPhoto = null; let importData = null;
  // shared into the app from another app (installed PWA share target)
  { const sp = new URLSearchParams(location.search); if (sp.get('tekst') || sp.get('link') || sp.get('titel')) { importData = { title: sp.get('titel') || '', text: sp.get('tekst') || '', url: sp.get('link') || (/(https?:\/\/\S+)/.exec(sp.get('tekst') || '') || [])[1] || '' }; history.replaceState(null, '', location.pathname + '#/ny-opskrift'); } }
  // set: the number was said or typed ("to mælk"), so it is the total; otherwise one more
  function addItem(v, n = 1, set = false) {
    W().extra ||= {}; W().qty ||= {};
    const was = onList(v); const before = { v, was, q: qtyOf(v), extra: !!W().extra[v] };
    if (!was) { W().extra[v] = true; W().qty[v] = n; } else W().qty[v] = set ? Math.max(qtyOf(v), n) : qtyOf(v) + n;
    lastAdd = lastAdd && Date.now() - lastAdd.at < 4000 ? { list: [...lastAdd.list, before], at: Date.now() } : { list: [before], at: Date.now() };
    return was;
  }
  function newItem(name) {
    const v = name.trim().replace(/^./, (c) => c.toUpperCase());
    db.egne ||= {}; if (!catOf[v]) { db.egne[v] = 'Andet'; catOf[v] = 'Andet'; }
    return v;
  }
  function toast(text, withUndo) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    el.innerHTML = `<span>${esc(text)}</span>${withUndo ? '<button type="button" class="toast__undo" data-toast-undo>Fortryd</button>' : ''}`;
    el.classList.add('is-on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('is-on'), 4000);
  }
  function addAndShow(entries, set = false) {
    const said = entries.map(([v, n]) => { const was = addItem(v, n, set); return was ? `${lower1(v)}, nu ${qtyOf(v)}` : `${n > 1 ? n + ' × ' : ''}${lower1(v)}`; });
    save(); buzz(); rerender();
    const inp = document.getElementById('addq'); if (inp) inp.focus({ preventScroll: true });
    toast(`Lagt på listen: ${said.join(', ')}`, true);
    const row = main.querySelector(`[data-tick="${CSS.escape(entries[entries.length - 1][0])}"]`); row?.closest('.row')?.classList.add('is-new'); row?.scrollIntoView({ block: 'nearest' });
  }
  function renderAddList(q) {
    const list = document.getElementById('addlist'); const inp = document.getElementById('addq'); if (!list) return;
    const hits = q.trim() ? findItems(q) : habits(6); const exact = hits.some((v) => norm(v) === norm(q));
    const opts = hits.map((v) => { const im = itemImg(v); return `<li role="option" id="opt-${esc(slug(v))}" data-add="${esc(v)}" aria-selected="false">${im ? `<img src="${esc(im.src)}" alt="" width="40" height="40">` : '<span class="addlist__blank" aria-hidden="true"></span>'}<span><b>${esc(v)}</b><small>${onList(v) ? `På listen, ${qtyOf(v)} stk. Tryk for én mere` : esc(catOf[v] || '')}${blockOf(v) ? `. ${esc(blockOf(v))}` : ''}</small></span></li>`; });
    if (q.trim() && !exact) opts.push(`<li role="option" id="opt-new" data-add-new="${esc(q.trim())}" aria-selected="false"><span class="addlist__blank addlist__plus" aria-hidden="true">${icon.plus}</span><span><b>Tilføj “${esc(q.trim())}”</b><small>Som ny vare, uden varekort</small></span></li>`);
    if (!q.trim() && opts.length) opts.unshift('<li class="addlist__head" role="presentation">I plejer at købe</li>');
    list.innerHTML = opts.join(''); list.hidden = !opts.length; inp.setAttribute('aria-expanded', String(!list.hidden)); inp.removeAttribute('aria-activedescendant');
  }
  // "to liter mælk og tre avocadoer" -> [[Mælk, 2], [Avocado..., 3]]
  const NUM = { en: 1, et: 1, én: 1, ét: 1, to: 2, tre: 3, fire: 4, fem: 5, seks: 6, syv: 7, otte: 8, ni: 9, ti: 10, elleve: 11, tolv: 12, halv: 1, par: 2 };
  const UNITS = /^(liter|l|stk|stykker|styk|pakker|pakke|poser|pose|dåser|dåse|kilo|kg|gram|g|bakker|bakke|flasker|flaske|glas|ruller|rulle|bundter|bundt|af|med|noget|nogle|lidt|frisk|friske)$/;
  function parseSpoken(text) {
    const parts = norm(text).replace(/\b(og så|og|samt|plus|så)\b/g, ',').split(',').map((x) => x.trim()).filter(Boolean);
    const out = []; const unknown = [];
    parts.forEach((part) => {
      let ws = part.split(' ').filter((w) => !/^(øh|øhm|vi|skal|have|bruge|købe|lige|også|nej|vent|du|kan|jeg|tage|med|hjem)$/.test(w)); let n = 1;
      const num = ws.findIndex((w) => /^\d+$/.test(w) || NUM[w]); if (num > -1) { n = /^\d+$/.test(ws[num]) ? +ws[num] : NUM[ws[num]]; ws.splice(num, 1); }
      ws = ws.filter((w) => !UNITS.test(w)); const phrase = ws.join(' '); if (!phrase) return;
      const hit = findItems(phrase, 1)[0] || findItems(ws[ws.length - 1], 1)[0];
      if (hit) { const prev = out.find((o) => o[0] === hit); if (prev) prev[1] = n; else out.push([hit, n]); } else unknown.push(phrase);
    });
    return { out, unknown };
  }
  let rec = null;
  function dictate(btn) {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'da-DK'; rec.interimResults = true; rec.continuous = false;
    const inp = document.getElementById('addq'); let final = '';
    btn.classList.add('is-on'); btn.setAttribute('aria-label', 'Stop'); inp.placeholder = 'Jeg lytter…';
    rec.onresult = (e) => { let t = ''; for (const r of e.results) { t += r[0].transcript; if (r.isFinal) final = t; } inp.value = t; };
    rec.onerror = (e) => { toast(e.error === 'not-allowed' ? 'Appen må ikke bruge mikrofonen. Giv lov i telefonens indstillinger.' : 'Jeg hørte ikke noget. Prøv igen.'); };
    rec.onend = () => {
      rec = null; btn.classList.remove('is-on'); btn.setAttribute('aria-label', 'Sig hvad du skal have'); inp.placeholder = 'Tilføj vare…';
      const said = final || inp.value; if (!said.trim()) return;
      const { out, unknown } = parseSpoken(said);
      if (out.length) { inp.value = unknown.join(', '); addAndShow(out, true); if (unknown.length) { const i2 = document.getElementById('addq'); i2.value = unknown.join(', '); renderAddList(unknown[0]); toast(`Lagt på listen. Kender ikke: ${unknown.join(', ')}`, true); } }
      else { renderAddList(said); }
    };
    try { rec.start(); } catch (e) { rec = null; btn.classList.remove('is-on'); }
  }

  // ---------- habits: what the household usually buys, from earlier weeks ----------
  function habits(max = 8) {
    const cnt = {};
    Object.entries(db.weeks).forEach(([k, w]) => { if (k === db.week) return; const on = new Set([...(w.dishes || []).flatMap((d) => (S.retter[d] || [])), ...Object.keys(w.extra || {})]); on.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1 + (w.ticks && w.ticks[v] >= 1 && w.ticks[v] <= 3 ? 1 : 0); }); });
    return Object.entries(cnt).filter(([v]) => catOf[v] && !onList(v) && !blockOf(v)).sort((a, b) => b[1] - a[1]).slice(0, max).map(([v]) => v);
  }
  // ---------- route: the order the household walks a store, learned from the ticks ----------
  function learnRoute(v) {
    if (!db.shop) return;
    const items = listItems(); const found = items.filter((x) => x !== v && W().ticks[x] >= 1 && W().ticks[x] <= 3).length;
    const pos = items.length > 1 ? found / (items.length - 1) : 0;
    const r = ((db.route ||= {})[db.shop] ||= {}); const e = (r[v] ||= { p: pos, n: 0 });
    e.p = (e.p * e.n + pos) / (e.n + 1); e.n = Math.min(e.n + 1, 5);
  }
  const routeOf = () => (db.shop && db.route && db.route[db.shop]) || null;
  const routeReady = () => { const r = routeOf(); return !!r && Object.keys(r).length >= 5; };
  // ---------- portions: amounts in a recipe scaled to the number of people ----------
  function scaleAmt(t, f) {
    if (f === 1) return t;
    const fmt = (x) => { const r = Math.round(x * 4) / 4; const whole = Math.floor(r); const frac = r - whole; const fr = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[frac] || ''; return whole ? `${whole}${fr ? ' ' + fr : ''}` : (fr || String(Math.round(x * 10) / 10).replace('.', ',')); };
    const big = (x) => (x >= 20 ? String(Math.round(x / 5) * 5) : fmt(x));
    return String(t).replace(/(\d+)\s*\/\s*(\d+)|(\d+(?:,\d+)?)(?:\s*-\s*(\d+(?:,\d+)?))?/g, (m, a, b, n1, n2) => {
      if (a) return fmt((+a / +b) * f);
      const x1 = parseFloat(n1.replace(',', '.')) * f; if (!n2) return big(x1);
      return `${big(x1)}-${big(parseFloat(n2.replace(',', '.')) * f)}`;
    });
  }
  // ---------- nutrition (optional, off by default): from products, else a typical value ----------
  const NAE = window.NAERING || { typisk: {}, vaegt: {}, enhed: {}, kodvarer: [] };
  const nutOn = () => !!(db.profil && db.profil.naering);
  const KOST = { vegetar: 'Vegetar', let: 'Let, under 600 kcal', protein: 'Mere protein', lowcarb: 'Færre kulhydrater' };
  function nutOf(v) {
    const c = stdCard(v); const p = c && prodOf(c, 1);
    if (p && p.naering) return { ...p.naering, src: 'produkt' };
    const ps = (PR[v] || []).filter((x) => x.naering);
    if (ps.length >= 2) { const med = (k) => { const a = ps.map((x) => x.naering[k]).filter((x) => x != null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; }; return { kcal: med('kcal'), protein: med('protein'), kulh: med('kulh'), fedt: med('fedt'), src: 'typisk' }; }
    const t = NAE.typisk[v]; return t ? { kcal: t[0], protein: t[1], kulh: t[2], fedt: t[3], src: 'typisk' } : null;
  }
  // "500 g", "2 dåser", "1/4 hoved", "8-12 stk", "2,5 dl" -> grams of the item
  function gramsOf(amt, v) {
    const s = String(amt || '').toLowerCase().replace(',', '.');
    const m = s.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?(?:\s*-\s*(\d+(?:\.\d+)?))?\s*([a-zæøå]+)?/);
    if (!m) return null;
    let n = +m[1]; if (m[2]) n = n / +m[2]; if (m[3]) n = (n + +m[3]) / 2;
    const u = m[4] || 'stk';
    if (u === 'g' || u === 'gram') return n; if (u === 'kg') return n * 1000;
    if (u === 'dl') return n * 100; if (u === 'l' || u === 'liter') return n * 1000; if (u === 'ml') return n;
    if (u === 'spsk') return n * (/mel|rasp|sukker/i.test(v) ? 10 : 15); if (u === 'tsk') return n * 4;
    if (NAE.vaegt[v] && ['stk', 'hoved', 'pakke', 'pakker', 'pose', 'poser', 'bakke', 'bakker', 'dåse', 'dåser'].includes(u)) return n * NAE.vaegt[v];
    if (u === 'stk' || u === 'hoved') return n * (NAE.vaegt[v] || 100);
    if (NAE.vaegt[v] && !NAE.enhed[u]) return n * NAE.vaegt[v];
    return n * (NAE.enhed[u] || NAE.vaegt[v] || 100);
  }
  // per person, for a dish in the cookbook or in the recipe bank
  function dishNut(d) {
    const o = OP[d]; const b = BANK.opskrifter[d];
    const pairs = o && o.maengder ? Object.entries(o.maengder).map(([v, a]) => [v, a]) : b ? b.ing.map(([a, v]) => [v, a]) : [];
    if (!pairs.length) return null;
    const per = (o && o.personer) || 4; const tot = { kcal: 0, protein: 0, kulh: 0, fedt: 0 }; const missing = [];
    pairs.forEach(([v, a]) => { const n = nutOf(v); const g = gramsOf(a, v); if (!n || g == null) { missing.push(v); return; } ['kcal', 'protein', 'kulh', 'fedt'].forEach((k) => { tot[k] += (n[k] || 0) * g / 100; }); });
    const r = {}; Object.keys(tot).forEach((k) => { r[k] = Math.round(tot[k] / per); }); r.missing = missing; return r;
  }
  const fmtN = (x) => (x == null ? '–' : Number(x).toLocaleString('da-DK', { maximumFractionDigits: 1 }));
  const nutLine = (n) => n ? `ca. ${n.kcal} kcal pr. person` : '';
  const nutBlock = (n) => n ? `<div class="nutri" role="group" aria-label="Næring pr. person"><span><b>ca. ${n.kcal}</b> kcal</span><span><b>${n.protein} g</b> protein</span><span><b>${n.kulh} g</b> kulhydrat</span><span><b>${n.fedt} g</b> fedt</span></div>${n.missing.length ? `<p class="meta">Uden ${esc(n.missing.map(lower1).join(', '))}, som appen ikke har tal for.</p>` : ''}` : '';
  // the household's food profile filters the cookbook
  function kostOk(d) {
    const k = (nutOn() && db.profil.kost) || []; if (!k.length) return true;
    const vs = BANK.opskrifter[d] ? BANK.opskrifter[d].ing.map((x) => x[1]) : (S.retter[d] || []);
    if (k.includes('vegetar') && vs.some((v) => NAE.kodvarer.includes(v))) return false;
    const n = dishNut(d); if (!n || !n.kcal) return true;
    if (k.includes('let') && n.kcal > 600) return false;
    if (k.includes('protein') && (n.protein * 4) / n.kcal < 0.22) return false;
    if (k.includes('lowcarb') && (n.kulh * 4) / n.kcal > 0.3) return false;
    return true;
  }
  const kostNote = () => { const k = (nutOn() && db.profil.kost) || []; return k.length ? `<p class="meta kostnote">Viser kun: ${k.map((x) => KOST[x].toLowerCase()).join(', ')}. <a class="link" href="#/profil?vis=p-naering">Ret</a></p>` : ''; };
  const nutriBadge = (g) => g ? `<span class="nscore" data-g="${esc(g)}" title="Nutri-Score ${esc(g.toUpperCase())}">${esc(g.toUpperCase())}</span>` : '';

  // ---------- plan the days, and remind about taking the meat out ----------
  const DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
  const TOEKOED = ['Hakket svinekød', 'Hakket oksekød', 'Kylling', 'Pølser', 'Fiskefilet', 'Svinekoteletter', 'Flæsk i skiver', 'Suppehøne', 'Laks', 'Flæskesteg', 'Kyllingespyd'];
  const remCfg = () => ({ on: true, dag: 'foer', tid: '18:00', ...((db.profil && db.profil.paamind) || {}) });
  const dayDate = (wk, idx) => { const m = weekStart(wk); return new Date(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() + idx); };
  const shortDate = (wk, idx) => dayDate(wk, idx).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  const needOfW = (w, d) => (S.retter[d] || []).filter((v) => !blockOf(v) && !(w.skip && w.skip[d] && w.skip[d].includes(v)));
  const meatOf = (w, d) => needOfW(w, d).filter((v) => TOEKOED.includes(v));
  function remindAt(wk, idx) { const c = remCfg(); const [hh, mm] = c.tid.split(':').map(Number); const d = dayDate(wk, idx); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (c.dag === 'foer' ? 1 : 0), hh || 0, mm || 0); }
  const dayEnd = (wk, idx) => { const d = dayDate(wk, idx); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); };
  function dueReminders(now = new Date()) {
    if (!remCfg().on) return [];
    const out = [];
    Object.entries(db.weeks).forEach(([wk, w]) => Object.entries(w.plan || {}).forEach(([dish, idx]) => {
      if (!S.retter[dish] || !(w.dishes || []).includes(dish) || (w.thawed && w.thawed[dish])) return;
      if (now < remindAt(wk, idx) || now > dayEnd(wk, idx)) return;
      const meats = meatOf(w, dish); if (!meats.length) return;
      out.push({ wk, dish, idx, meats, bought: meats.filter((v) => w.ticks && w.ticks[v] >= 1 && w.ticks[v] <= 3) });
    }));
    return out.sort((a, b) => a.idx - b.idx);
  }
  function whenWord(wk, idx, now = new Date()) { const d = dayDate(wk, idx); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const diff = Math.round((d - t0) / 864e5); return diff === 0 ? 'i dag' : diff === 1 ? 'i morgen' : DAYS[idx].toLowerCase(); }
  function thawBanner() {
    const due = dueReminders(); if (!due.length) return '';
    return `<section class="remind" role="region" aria-labelledby="rmh"><h2 id="rmh">${icon.bell}<span>Tag kødet op</span></h2><ul>${due.map((r) => { const notBought = r.meats.filter((v) => !r.bought.includes(v)); return `<li><div><b>${esc(r.meats.map(lower1).join(', '))}</b><span class="meta">til ${esc(r.dish)} ${esc(whenWord(r.wk, r.idx))}${notBought.length ? `. Ikke markeret som købt: ${esc(notBought.map(lower1).join(', '))}` : ''}</span></div><button class="btn btn--quiet btn--s" type="button" data-thawed="${esc(r.wk + '|' + r.dish)}">Taget op</button></li>`; }).join('')}</ul></section>`;
  }
  const dayOptions = (wk, cur) => `<option value="">Ingen dag</option>${DAYS.map((x, i) => { const d = dayDate(wk, i); return `<option value="${i}" ${cur === i ? 'selected' : ''}>${x} ${d.getDate()}/${d.getMonth() + 1}</option>`; }).join('')}`;
  function freeDays() { const used = new Set(Object.values(W().plan || {})); const start = db.week === CUR_WEEK ? (new Date().getDay() + 6) % 7 : 0; const out = []; for (let i = start; i < 7; i++) if (!used.has(i)) out.push(i); return out; }
  function autoPlan(names) { W().plan ||= {}; const free = freeDays(); names.filter((n) => W().plan[n] == null).forEach((n) => { if (free.length) W().plan[n] = free.shift(); }); }
  function planBlock(sel) {
    if (!sel.size) return '';
    const any = [...sel].some((d) => W().plan && W().plan[d] != null);
    return `<details class="plan no-print"${any ? ' open' : ''}><summary>Hvilken dag laver I hvad? <small>valgfrit</small></summary>
      <p class="meta">Vælg en dag til hver ret, så kan appen minde jer om at tage kødet op.</p>
      <ul class="plan__list">${[...sel].map((d) => `<li><label for="pl-${esc(slug(d))}">${esc(d)}</label><select class="input" id="pl-${esc(slug(d))}" data-plan="${esc(d)}">${dayOptions(db.week, W().plan ? W().plan[d] : undefined)}</select></li>`).join('')}</ul>
      <div class="actions"><button class="btn btn--quiet" type="button" data-plan-auto>Fordel på dagene</button><button class="btn btn--quiet" type="button" data-ics>${icon.bell}<span>Påmindelser i kalenderen</span></button></div>
      <p class="help" id="plan-help" aria-live="polite"></p></details>`;
  }
  const icsFold = (line) => { const enc = new TextEncoder(); let out = '', cur = '', bytes = 0; for (const ch of line) { const b = enc.encode(ch).length; if (bytes + b > 72) { out += cur + '\r\n '; cur = ''; bytes = 1; } cur += ch; bytes += b; } return out + cur; };
  function icsText() {
    const w = W(); const wk = db.week; const e2 = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    const nowU = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Varevennen//DA', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']; let n = 0;
    Object.entries(w.plan || {}).forEach(([dish, idx]) => {
      if (!(w.dishes || []).includes(dish)) return; const meats = meatOf(w, dish); if (!meats.length) return;
      const at = remindAt(wk, idx); n++;
      L.push('BEGIN:VEVENT', `UID:${wk}-${idx}-${n}@varevennen`, `DTSTAMP:${nowU}`, `DTSTART:${f(at)}`, `DTEND:${f(new Date(at.getTime() + 15 * 60000))}`, `SUMMARY:${e2('Tag kødet op: ' + meats.map(lower1).join(', '))}`, `DESCRIPTION:${e2(`Til ${dish} ${DAYS[idx].toLowerCase()}. Tag det op af fryseren, hvis I har købt det.`)}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e2('Tag kødet op til ' + dish)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR'); return { n, text: L.map(icsFold).join('\r\n') + '\r\n' };
  }

  // ---------- "Vælg en ret for mig" ----------
  const SAESON_ORD = { vinter: 'vinteren', 'forår': 'foråret', sommer: 'sommeren', 'efterår': 'efteråret' };
  const mins = (t) => { const x = String(t || ''); const h = /(\d+)\s*t/.exec(x); const m = /(\d+)\s*min/.exec(x); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || null; };
  const IKKE_AFTENSMAD = ['Rabarbergrød med fløde', 'Koldskål med kammerjunkere'];
  const FILT = [['hurtig', 'Hurtig, under 30 min'], ['veg', 'Vegetar'], ['saeson', 'Passer til årstiden'], ['egne', 'Jeres egne'], ['nyt', 'Noget nyt'], ['faerdig', 'Færdigretter']];
  let chooser = { mode: 'en', f: new Set(), items: [], seen: new Set(), n: 5, added: {}, empty: false };
  let prevRoute = '';
  function dishPool() {
    const out = [];
    Object.keys(S.retter).forEach((n) => { const r = BANK.opskrifter[n] || null; const o = OP[n] || {}; out.push({ n, src: 'egen', r, tidTxt: o.tid || (r && r.tid) || '', tid: mins(o.tid || (r && r.tid)), ings: S.retter[n], saeson: (r && r.saeson) || [] }); });
    Object.entries(BANK.opskrifter).forEach(([n, r]) => { if (!S.retter[n]) out.push({ n, src: 'nyt', r, tidTxt: r.tid, tid: mins(r.tid), ings: r.ing.map((x) => x[1]), saeson: r.saeson || [] }); });
    return out;
  }
  const recentDishes = () => { const set = new Set(); Object.entries(db.weeks).filter(([k]) => weekStart(k) < weekStart(db.week)).sort((a, b) => weekStart(b[0]) - weekStart(a[0])).slice(0, 2).forEach(([, w]) => (w.dishes || []).forEach((d) => set.add(d))); return set; };
  const hasHistory = () => Object.keys(db.weeks).some((k) => weekStart(k) < weekStart(db.week) && (db.weeks[k].dishes || []).length);
  function eligible(d, f) {
    if (W().dishes.includes(d.n)) return false;
    if ((d.r && d.r.kategori === 'Bagning') || IKKE_AFTENSMAD.includes(d.n)) return false;   // baking and puddings are not dinner
    if (d.ings.some((v) => blockOf(v))) return false;
    if (!kostOk(d.n)) return false;
    if (f.has('hurtig') && !(d.tid && d.tid <= 30)) return false;
    if (f.has('veg') && d.ings.some((v) => TOEKOED.includes(v) || ['Kyllingenuggets', 'Frysepizza', 'Forårsruller'].includes(v))) return false;
    if (f.has('saeson') && !d.saeson.includes(nowSeason())) return false;
    if (f.has('egne') && d.src !== 'egen') return false;
    if (f.has('nyt') && d.src !== 'nyt') return false;
    if (f.has('faerdig') && !FAERDIG.includes(d.n)) return false;
    return true;
  }
  const catOfDish = (d) => (d.r ? d.r.kategori : emneOf(d.n));
  function pickDishes(count, exclude = new Set(), keep = []) {
    const rec = recentDishes(); const pool = dishPool().filter((d) => eligible(d, chooser.f) && !exclude.has(d.n) && !keep.some((k) => k.n === d.n)); const out = [];
    while (out.length < count && pool.length) {
      const used = [...keep, ...out];
      const w = pool.map((d) => { let x = 1; if (d.saeson.includes(nowSeason())) x *= 2; if (rec.has(d.n)) x *= 0.25; if (FAERDIG.includes(d.n) && !chooser.f.has('faerdig')) x *= 0.35; if (used.some((u) => u.ings[0] === d.ings[0])) x *= 0.15; if (used.some((u) => catOfDish(u) === catOfDish(d))) x *= 0.5; return x; });
      let t = Math.random() * w.reduce((a, b) => a + b, 0); let i = 0; for (; i < pool.length - 1; i++) { t -= w[i]; if (t <= 0) break; }
      out.push(pool[i]); pool.splice(i, 1);
    }
    return out;
  }
  function fillChooser() {
    const c = chooser; c.added = {};
    if (c.mode === 'en') { let r = pickDishes(1, c.seen); if (!r.length && c.seen.size) { c.seen.clear(); r = pickDishes(1, c.seen); } c.items = r; r.forEach((d) => c.seen.add(d.n)); }
    else c.items = pickDishes(c.n);
    c.empty = !c.items.length;
  }
  const whyOf = (d) => { const w = []; if (d.saeson.includes(nowSeason())) w.push(`Passer til ${SAESON_ORD[nowSeason()]}`); if (d.src === 'nyt') w.push('Ny for jer'); else if (hasHistory() && !recentDishes().has(d.n)) w.push('Ikke lavet for nylig'); if (d.tid && d.tid <= 30) w.push(`Klar på ${d.tid} min`); return w.slice(0, 3); };
  const dishMeta = (d) => [d.tidTxt, pl(d.ings.length, 'ingrediens', 'ingredienser'), nutOn() && dishNut(d.n) ? `ca. ${dishNut(d.n).kcal} kcal` : ''].filter(Boolean).join(' · ');
  const dishHref = (d) => (d.src === 'egen' ? `#/ret/${slug(d.n)}` : `#/bank/${slug(d.n)}`);
  const dishPic = (d, cls) => { const im = d.r ? bankImg(d.r, d.n) : dishImg(d.n); return im ? `<img class="${cls}" src="${esc(im)}" alt="" width="600" height="450">` : `<span class="${cls} ${cls}--none" aria-hidden="true">${icon.pot}</span>`; };
  function addDish(n) { if (BANK.opskrifter[n] && !S.retter[n]) takeRecipe(n); if (!W().dishes.includes(n)) W().dishes.push(n); }
  function vaelgRet() {
    const c = chooser; if (!c.items.length && !c.empty) fillChooser();
    const head = `${back('#/retter', 'Retter')}<div class="screen-head"><h1 tabindex="-1">Vælg en ret for mig</h1><p class="lead">Appen vælger ud fra jeres allergier, årstiden og det, I ikke har lavet for nylig.</p></div>
      <nav class="seg no-print" aria-label="Hvad skal jeg vælge?"><button type="button" data-vmode="en" ${c.mode === 'en' ? 'aria-current="page"' : ''}>En ret</button><button type="button" data-vmode="uge" ${c.mode === 'uge' ? 'aria-current="page"' : ''}>Hele ugen</button></nav>
      <div class="chips chips--wrap pickf" role="group" aria-label="Hvad skal den være?">${FILT.map(([k, l]) => `<button type="button" class="chip" data-vf="${k}" aria-pressed="${c.f.has(k)}">${c.f.has(k) ? icon.check : ''}${esc(l)}</button>`).join('')}</div>`;
    if (c.empty) return head + `<div class="empty"><h2>Ingen retter passer</h2><p class="lead">Fjern et af valgene ovenfor, så finder appen noget. Der er også ryddet for retter, I allerede har på listen i ${weekLabel()}.</p></div>`;
    if (c.mode === 'en') {
      const d = c.items[0]; const added = !!c.added[d.n]; const day = W().plan ? W().plan[d.n] : undefined;
      return head + `<article class="pick"><a class="pick__pic" href="${dishHref(d)}" tabindex="-1" aria-hidden="true">${dishPic(d, 'pick__img')}</a><div class="pick__body"><h2 class="pick__name"><a href="${dishHref(d)}">${esc(d.n)}</a></h2><p class="meta">${esc(dishMeta(d))}</p><ul class="pick__why">${whyOf(d).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></article>
        ${added ? `<p class="pick__done" role="status">${icon.check}<span>${esc(d.n)} er på listen i ${weekLabel()}</span></p>
          <p class="label" id="pdh">Hvilken dag? <small class="meta">valgfrit</small></p><div class="chips chips--wrap" role="group" aria-labelledby="pdh">${DAYS.map((x, i) => `<button type="button" class="chip" data-pickday="${i}" aria-pressed="${day === i}">${x.slice(0, 3)}</button>`).join('')}</div>
          <div class="actions"><a class="btn btn--primary" href="#/indkob">Til listen</a><button class="btn btn--quiet" type="button" data-pick-again>Vælg en ret mere</button></div>`
        : `<div class="actions"><button class="btn btn--primary" type="button" data-pick-add>Læg på listen i ${weekLabel()}</button><button class="btn btn--quiet" type="button" data-pick-again>${icon.dice}<span>Prøv en anden</span></button></div>`}`;
    }
    return head + `<ol class="pickweek">${c.items.map((d, i) => `<li><a class="pickweek__open" href="${dishHref(d)}">${dishPic(d, 'pickweek__img')}<span class="row__txt"><span class="row__name">${esc(d.n)}</span><span class="row__want">${esc(dishMeta(d))}</span></span></a><button class="iconbtn" type="button" data-pickswap="${i}" aria-label="Skift ${esc(d.n)} ud med en anden">${icon.dice}</button></li>`).join('')}</ol>
      <div class="pickn no-print"><span class="label" id="pnh">Antal retter</span><span class="stepper" role="group" aria-labelledby="pnh"><button class="iconbtn" type="button" data-pickn="-1" aria-label="Færre retter" ${c.n <= 2 ? 'disabled' : ''}>${icon.minus}</button><output class="stepper__n">${c.n}</output><button class="iconbtn" type="button" data-pickn="1" aria-label="Flere retter" ${c.n >= 7 ? 'disabled' : ''}>${icon.plus}</button></span></div>
      <div class="actions"><button class="btn btn--primary" type="button" data-pick-addall>Læg alle ${c.items.length} på listen i ${weekLabel()}</button><button class="btn btn--quiet" type="button" data-pick-again>${icon.dice}<span>Foreslå en ny uge</span></button></div>
      <p class="meta">Retterne fordeles på dagene fra i dag, så appen kan minde jer om at tage kødet op. Det kan I ændre under Retter.</p>`;
  }

  // ---------- recipe book: every dish sits in a chapter ----------
  const EMNE_STD = {
    'Boller i karry': 'Klassikere', 'Frikadeller med grøntsager og pasta': 'Klassikere', 'Karbonader med sovs og pasta': 'Klassikere', 'Stegt flæsk': 'Klassikere', 'Hønsekødssuppe': 'Klassikere', 'Tarteletter': 'Klassikere', 'Biksemad': 'Klassikere',
    'Lasagne med råkost': 'Pasta og ovnretter', 'Pasta og kødsauce': 'Pasta og ovnretter', 'Lasagnette': 'Pasta og ovnretter',
    'Pølser og ris': 'Hurtigt i hverdagen', 'Koteletter og ris': 'Hurtigt i hverdagen', 'Fisk med frosne grøntsager og pasta': 'Hurtigt i hverdagen', 'Stegt kylling med grøntsager og pasta': 'Hurtigt i hverdagen', 'Kylling og pommes/pasta': 'Hurtigt i hverdagen', 'Bami goreng': 'Hurtigt i hverdagen',
    'Hotdog': 'Fredag og hygge', 'Frysepizza og nuggets': 'Fredag og hygge', 'Pitabrød': 'Fredag og hygge', 'Forårsruller': 'Fredag og hygge'
  };
  const EMNE_ORDER = ['Klassikere', 'Hurtigt i hverdagen', 'Pasta og ovnretter', 'Fredag og hygge', 'Færdigretter'];
  const FAERDIG = window.FAERDIG_RETTER || [];
  const emneOf = (d) => (db.emne && db.emne[d]) || (FAERDIG.includes(d) ? 'Færdigretter' : '') || (db.opskrifter && db.opskrifter[d] && db.opskrifter[d].emne) || EMNE_STD[d] || 'Andre retter';
  const emner = () => [...new Set([...EMNE_ORDER, ...Object.keys(S.retter).map(emneOf)])].filter((e) => Object.keys(S.retter).some((d) => emneOf(d) === e));

  // ---------- own recipes live next to the built-in ones ----------
  function mergeOwn() {
    Object.entries(db.opskrifter || {}).forEach(([d, o]) => { S.retter[d] = o.varer; OP[d] = o; });
  }
  // a pasted recipe: lines that start with an amount, or are short, are ingredients; sentences are steps
  function splitRecipe(text) {
    const lines = String(text).split('\n').map((l) => l.replace(/^[\s•*·\-–]+|\s+$/g, '').replace(/^\d+[.)]\s+(?=[A-ZÆØÅ])/, '')).filter(Boolean);
    let name = ''; const ing = []; const steps = []; let mode = '';
    lines.forEach((l, i) => {
      const low = l.toLowerCase();
      if (/^(ingredienser|du skal bruge|indkøb)\b/.test(low)) { mode = 'ing'; return; }
      if (/^(fremgangsmåde|sådan gør (du|i)|tilberedning|metode)\b/.test(low)) { mode = 'steps'; return; }
      if (/^(\d+ ?(personer|pers)|tid:|forberedelse|portioner)/.test(low)) return;
      const amount = /^(ca\.?\s*)?[\d½¼¾]/.test(l); const words = l.split(/\s+/).length;
      if (!name && i === 0 && !amount && words <= 8) { name = l; return; }
      if (mode === 'steps' || (!amount && (words > 6 || /[.!]$/.test(l)))) steps.push(l); else ing.push(l);
    });
    return { name, ing, steps };
  }
  function parseIngredients(text) {
    const out = []; const maengder = {};
    String(text).split(/\n|;/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const m = line.match(/^((?:ca\.?\s*)?[\d½¼¾][\d.,/½¼¾\s-]*\s*(?:g|kg|gram|dl|l|ml|liter|spsk|tsk|stk|dåser?|pakker?|poser?|bdt|bundt|fed|skiver?|knivspids)?\.?)\s+(.+)$/i);
      const amt = m ? m[1].trim() : ''; let name = (m ? m[2] : line).replace(/\s*\(.*\)\s*$/, '').trim();
      const hit = findItems(name, 1)[0];
      const v = hit && (norm(hit) === norm(name) || norm(name).includes(norm(hit)) || norm(hit).includes(stem(norm(name)))) ? hit : newItem(name);
      if (!out.includes(v)) out.push(v); if (amt) maengder[v] = amt;
    });
    return { varer: out, maengder };
  }

  // ---------- notes and "kan undværes" (filler) on the week's list ----------
  const isOpt = (v) => !!(W().opt && W().opt[v]);
  const noteOf = (v) => (W().note && W().note[v]) || '';
  const extraOf = (v) => [isOpt(v) ? 'kan undværes' : '', noteOf(v)].filter(Boolean).join(', ');
  const FR = window.FRISK || { varer: {}, kategorier: [], datoer: [], generel: {} };
  const extraPanel = (v) => `<div class="rowextra no-print"><button type="button" class="chip" data-opt="${esc(v)}" aria-pressed="${isOpt(v)}">${isOpt(v) ? icon.check : ''}Kan undværes</button><label class="rowextra__note"><span class="visually-hidden">Note til ${esc(v)}</span><input class="input" type="text" maxlength="80" data-note="${esc(v)}" value="${esc(noteOf(v))}" placeholder="Note, fx kun hvis den er billig" enterkeyhint="done" autocomplete="off"></label>${FR.varer[v] ? `<a class="link rowextra__frisk" href="#/frisk?v=${slug(v)}">Er den frisk? Sådan vælger du</a>` : ''}</div>`;
  const friskBlock = (v) => { const f = FR.varer[v]; if (!f) return ''; return `<section class="section frisk" aria-labelledby="fh"><h2 id="fh">Er den frisk?</h2>
      <p class="frisk__h">Køb den, hvis</p><ul class="frisk__yes">${f.godt.map((x) => `<li>${icon.check}<span>${esc(x)}</span></li>`).join('')}</ul>
      <p class="frisk__h">Lad den ligge, hvis</p><ul class="frisk__no">${f.undgaa.map((x) => `<li>${icon.cross}<span>${esc(x)}</span></li>`).join('')}</ul>
      ${f.tip ? `<p class="meta">${esc(f.tip)}</p>` : ''}<p class="meta"><a class="link" href="#/frisk">Se alle varer og datoer på pakken</a></p></section>`; };
  function frisk(q) {
    const open = q.get('v'); const kats = FR.kategorier;
    return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Er den frisk?</h1><p class="lead">Sådan ser du forskel på en god vare og en, der skal blive liggende. Søg på en vare.</p></div>
      <div class="field minesearch"><label class="visually-hidden" for="frq">Søg efter en vare</label><span class="composer__field">${icon.search}<input id="frq" type="search" placeholder="fx kartofler" autocomplete="off" data-frsearch></span></div>
      <p class="meta" id="fr-none" hidden>Ingen vejledning for den vare endnu.</p>
      <div id="frlist">${kats.map((k) => { const vs = Object.entries(FR.varer).filter(([, f]) => f.kat === k); return vs.length ? `<section class="group" data-kat="${esc(k)}"><h2>${esc(k)}</h2><ul class="help-list">${vs.map(([v, f]) => `<li data-q="${esc(norm(v + ' ' + f.godt.join(' ') + ' ' + f.undgaa.join(' ')))}"><details${open === v ? ' open' : ''}><summary>${esc(v)}</summary><p class="frisk__h">Køb den, hvis</p><ul class="frisk__yes">${f.godt.map((x) => `<li>${icon.check}<span>${esc(x)}</span></li>`).join('')}</ul><p class="frisk__h">Lad den ligge, hvis</p><ul class="frisk__no">${f.undgaa.map((x) => `<li>${icon.cross}<span>${esc(x)}</span></li>`).join('')}</ul>${f.tip ? `<p>${esc(f.tip)}</p>` : ''}</details></li>`).join('')}</ul></section>` : ''; }).join('')}</div>
      <section class="section" aria-labelledby="dh"><h2 id="dh">Datoer på pakken</h2><ul class="help-list">${FR.datoer.map((d) => `<li><details><summary>${esc(d.h)}</summary><p>${esc(d.t)}</p></details></li>`).join('')}</ul></section>
      <p class="meta section">Det er almindelige råd og ingen garanti. Er du i tvivl om en vare, så lad den ligge.</p>`;
  }

  // ---------- screens ----------
  function indkob(q) {
    const items = listItems();
    const state = q.get('state');
    if (state === 'offline') setStatus('Offline, 3 ændringer venter', 'offline');
    const req = items.filter((v) => !isOpt(v)); const nOpt = items.length - req.length;
    const done = req.filter((v) => W().ticks[v] >= 1 && W().ticks[v] <= 3).length;
    const missing = req.filter((v) => W().ticks[v] === 4).length;
    const shopSel = `<div class="field shop no-print"><label for="shop">Jeg handler i</label><select class="input" id="shop" data-shop>${['', ...CHAINS].map((c) => `<option value="${esc(c)}" ${db.shop === c ? 'selected' : ''}>${c || 'Alle butikker'}</option>`).join('')}</select></div>`;
    const titleRow = `<div class="titlerow"><h1 tabindex="-1">Indkøb</h1><span class="titlerow__act no-print"><a class="iconbtn iconbtn--plain" href="#/overblik" aria-label="Overblik med pris og butik">${icon.list}</a><a class="iconbtn iconbtn--plain" href="#/del" aria-label="Del listen">${icon.share}</a></span></div>`;
    const head = `<div class="screen-head">${titleRow}${weekNav()}</div>
      <section class="summary" aria-label="Status for ${weekLabel()}"><p class="progress"><b>${done}</b><span class="meta">af ${pl(req.length, 'vare', 'varer')} fundet${missing ? `, ${missing} ikke fundet` : ''}${nOpt ? `, ${nOpt} kan undværes` : ''}</span></p>
      <div class="bar" role="progressbar" aria-label="Fundet" aria-valuemin="0" aria-valuemax="${req.length}" aria-valuenow="${done}" aria-valuetext="${done} af ${req.length} fundet"><span style="--p:${req.length ? done / req.length : 0}"></span></div>${items.length && priceSum(items).n ? `<p class="total"><span class="num">${sumLine(priceSum(items))}</span> <a class="link total__link" href="#/del?vis=priser">Hvor priserne kommer fra</a></p>` : ''}${shopSel}<p class="summary__more no-print"><a class="btn btn--quiet btn--s" href="#/overblik">${icon.list}<span>Overblik med pris og butik</span></a><a class="btn btn--quiet btn--s" href="#/lister">Faste lister</a><a class="btn btn--quiet btn--s" href="#/frisk">Er den frisk?</a></p></section>`;
    if (state === 'loading') return head.replace(/<b>\d+<\/b>/, '<b>0</b>').replace(/--p:[\d.]+/, '--p:0') + `<div aria-busy="true" aria-label="Henter listen">${'<span class="skel"><i></i><i></i></span>'.repeat(6)}</div>`;
    if (state === 'empty' || !items.length) return `<div class="screen-head">${titleRow}${weekNav()}</div><div class="empty"><h2>Listen er tom${db.week !== CUR_WEEK ? ` for ${weekLabel()}` : ''}</h2><p class="lead">Vælg ugens retter, så bygger listen sig selv. Eller skriv en vare i feltet nederst.</p><div class="actions"><a class="btn btn--primary" href="#/retter">Vælg retter</a><a class="btn btn--quiet" href="#/vaelg-ret">${icon.dice}<span>Vælg en ret for mig</span></a>${Object.keys(db.lister || {}).slice(0, 3).map((n) => `<button class="btn btn--quiet" type="button" data-loadlist="${esc(n)}">Brug ${esc(n)}</button>`).join('')}${Object.keys(db.lister || {}).length ? '' : '<a class="btn btn--quiet" href="#/lister">Lav en fast liste</a>'}</div></div>${composer()}`;
    const undoLine = undo ? `<p class="undo" role="status">${esc(undo.v)}: markering fjernet. <button class="link" type="button" data-undo>Fortryd</button></p>` : '';
    const err = state === 'offline' ? `<div class="notice" role="status"><p><b>Ingen forbindelse.</b> Dine flueben gemmes på telefonen og sendes, når der er net igen.</p></div>` : '';
    let groups = {};
    const byRoute = routeReady() && !q.has('kategori');
    if (byRoute) { const r = routeOf(); const known = items.filter((v) => r[v]).sort((a, b) => r[a].p - r[b].p); const rest = items.filter((v) => !r[v]); groups = { [`Sådan går I i ${db.shop}`]: known }; if (rest.length) groups['Ikke placeret endnu'] = rest; }
    else items.forEach((v) => (groups[catOf[v]] ||= []).push(v));
    const routeNote = db.shop ? `<p class="meta routenote no-print">${byRoute ? `Sorteret efter jeres vej gennem ${esc(db.shop)}. <a class="link" data-replace href="#/indkob?kategori=1">Sortér efter kategori</a>` : routeReady() ? `<a class="link" data-replace href="#/indkob">Sortér efter jeres vej gennem ${esc(db.shop)}</a>` : `Sæt flueben i den rækkefølge, du finder varerne, så lærer appen jeres vej gennem ${esc(db.shop)}.`}</p>` : '';
    const rows = routeNote + Object.entries(groups).map(([cat, vs]) => `<section class="group"><h2>${esc(cat)}</h2><ul class="rows">${vs.slice().sort((a, b) => isOpt(a) - isOpt(b)).map((v) => {
      const t = W().ticks[v] || 0; const c = card(v);
      const hasCard = !!(c && c.p1);
      let best = 1;
      if (hasCard && db.shop) { const hit = [1, 2, 3].find((n) => c['p' + n] && seenIn(prodOf(c, n), db.shop) === 'ja'); if (hit) best = hit; }
      const prios = hasCard ? [1, 2, 3].filter((n) => c['p' + n]) : [];
      if (viewP[v] && prios.includes(viewP[v])) best = viewP[v];
      const dots = prios.length > 1 ? `<span class="pdots" aria-hidden="true">${prios.map((n) => `<i${n === best ? ' data-on' : ''}>${n}</i>`).join('')}</span>` : '';
      const want = hasCard ? `<span class="row__want">${viewP[v] && viewP[v] > 1 ? `Prio ${best}: ` : best > 1 ? `I ${esc(db.shop)}: prio ${best}, ` : ''}${nb(c['p' + best])}</span>${dots}` : `<span class="row__want row__want--none">Intet varekort endnu</span>`;
      const shown = t ? (!hasCard && t !== 4 ? 'ok' : t) : (hasCard ? 'want' : 0);
      const ghost = best;
      const label = t ? `${esc(v)}, registreret: ${hasCard ? FOUND[t] : (t === 4 ? 'ikke fundet' : 'fundet')}. Tryk for at fjerne markeringen.` : `${esc(v)}, ikke markeret. Tryk når ${hasCard ? `prio ${best} er` : 'den er'} i kurven.`;
      const q = qtyOf(v); const open = qtyOpen === v; const fromD = fromDishes().has(v);
      return `<li class="row${open ? ' is-qty' : ''}${isOpt(v) ? ' is-opt' : ''}"${t ? ' data-done' : ''}>
        <button class="row__tick no-print" type="button" data-tick="${esc(v)}" data-p="${best}" aria-label="${label}">${shown === 'want' ? `<span class="mark" data-p="want" aria-hidden="true">${ghost}</span>` : mark(shown)}</button>
        <a class="row__open" draggable="false" href="#/kort/${slug(v)}" data-swipe="${esc(v)}" data-prios="${prios.join(',')}"${prios.length > 1 ? ` aria-describedby="swipe-help"` : ''}>${hasCard ? thumb(imgOf(c, best), 'row__img') : itemImg(v, true) ? `<img class="row__img" src="${esc(itemImg(v, true).src)}" alt="" width="400" height="400" loading="lazy">` : ''}<span class="row__txt"><span class="row__name">${esc(v)}${qtyOf(v) > 1 ? `<span class="qty"> × ${qtyOf(v)}</span>` : ''}</span>${want}${!fromDishes().has(v) ? '<span class="row__want">Ekstra vare</span>' : ''}${isOpt(v) ? '<span class="badge badge--opt">Kan undværes</span>' : ''}${noteOf(v) ? `<span class="row__note">${esc(noteOf(v))}</span>` : ''}</span>${priceOf(v) ? `<span class="row__price num" title="${esc(priceOf(v).label)}">${priceOf(v).kind === 'ca' ? 'ca. ' : ''}${kr(priceOf(v).n * qtyOf(v))}</span>` : ''}</a>
        <button class="row__qty no-print" type="button" data-qtyopen="${esc(v)}" aria-expanded="${open}" aria-label="Antal ${esc(v)}: ${q}. Tryk for at ændre">${q > 1 ? `× ${q}` : q}</button>
        ${open ? `<div class="qtybar no-print" role="group" aria-label="Vælg antal ${esc(v)}"><button type="button" data-setqty="${q - 1}" data-vare="${esc(v)}" aria-label="Én mindre, ${q - 1}" ${q <= 1 && fromD ? 'disabled' : ''}>${icon.minus}</button>${[...(fromD ? [] : [0]), 1, 2, 3, 4].map((n) => `<button type="button" data-setqty="${n}" data-vare="${esc(v)}" aria-pressed="${n === q}">${n === 0 ? 'Fjern' : n}</button>`).join('')}<button type="button" data-setqty="${q + 1}" data-vare="${esc(v)}" aria-label="Én mere, ${q + 1}">${icon.plus}</button></div>${extraPanel(v)}` : ''}
        <span class="ticks print-only" aria-hidden="true">${[1, 2, 3, 4].map((p) => `<span class="mark" data-p="${p}">${p}</span>`).join('')}</span>
      </li>`; }).join('')}</ul></section>`).join('');
    const hb = habits(6);
    const LN = Object.keys(db.lister || {});
    const fixedRow = LN.length ? `<section class="habits no-print" aria-labelledby="flh"><h2 id="flh">Faste lister</h2><ul class="habits__list">${LN.map((n) => `<li><button type="button" class="habit" data-loadlist="${esc(n)}" aria-label="Hent ${esc(n)} ind i ${weekLabel()}">${icon.plus}<span>${esc(n)}${db.lister[n].butik ? ` <small>${esc(db.lister[n].butik)}</small>` : ''}</span></button></li>`).join('')}</ul></section>` : '';
    const habitRow = fixedRow + (hb.length ? `<section class="habits no-print" aria-labelledby="hbh"><h2 id="hbh">I plejer også at købe</h2><ul class="habits__list">${hb.map((v) => { const im = itemImg(v); return `<li><button type="button" class="habit" data-add="${esc(v)}" aria-label="Læg ${esc(v)} på listen">${im ? `<img src="${esc(im.src)}" alt="" width="40" height="40">` : ''}<span>${esc(v)}</span>${icon.plus}</button></li>`; }).join('')}</ul></section>` : '');
    return head + thawBanner() + habitRow + err + undoLine + rows + `<p class="visually-hidden" id="swipe-help">Brug piletasterne for at se prio 2 og 3.</p>` + composer();
  }

  function kort(v) {
    const c = card(v);
    const t = W().ticks[v] || 0;
    if (!c || !c.p1) {
      return `${back('#/indkob', 'Indkøb')}<div class="card-head"><h1 tabindex="-1">${esc(v)}</h1></div>
        <div class="qtyrow no-print"><span class="label">${onList(v) ? 'Antal på listen' : 'Ikke på listen'}</span>${stepper(v, 'kort')}</div>${onList(v) ? extraPanel(v) : ''}
        <div class="empty"><h2>Ingen har skrevet, hvilken det skal være</h2><p class="lead">Det skal I afklare: ${esc(askOf[v] || 'hvilken variant I plejer at købe')}</p>
        <div class="actions"><a class="btn btn--primary" href="#/spoerg/${slug(v)}">Spørg hjemme</a><a class="btn btn--quiet" href="#/kort/${slug(v)}/rediger">Udfyld kortet</a></div></div>
        ${suggest(v).length ? suggestBlock(v, c) + `<p class="credit">${OFF_CREDIT}</p>` : ILL[v] ? `<figure class="p1__photo"><img src="${esc(ILL[v].src)}" alt="Illustration af ${esc(lower1(v))}" width="400" height="400"><figcaption class="meta">Illustration. Foto: ${esc(ILL[v].credit)}</figcaption></figure>` : ''}
        <section class="decide dock no-print" aria-labelledby="dh"><div class="dock__col"><h2 id="dh" class="visually-hidden">Hvad fandt du?</h2>
        <div class="found found--2">${[['ok', 'Fundet', 1], [4, 'Ikke fundet', 4]].map(([m, l, val]) => `<button type="button" data-found="${val}" aria-pressed="${t === val}">${mark(m)}${l}</button>`).join('')}</div>
        <p class="decide__help" aria-live="polite">${t ? `Registreret: ${t === 4 ? 'ikke fundet' : 'fundet'}.` : 'Tryk når varen er i kurven.'}</p></div></section>`;
    }
    const where = (n) => db.shop ? `<span class="seen seen--${seenIn(prodOf(c, n), db.shop)}">${seenText(seenIn(prodOf(c, n), db.shop), db.shop)}</span>` : '';
    const alts = [2, 3].filter((p) => c['p' + p]).map((p) => `<li data-seen="${db.shop ? seenIn(prodOf(c, p), db.shop) : ''}">${mark(p, 'mark--l', 'Prio ' + p)}<span class="desc">${nb(c['p' + p])}${where(p)}</span>${imgOf(c, p) && imgOf(c, p).billede ? thumb(imgOf(c, p), 'alt__img') : ''}</li>`).join('');
    const p1p = imgOf(c, 1);
    const anyImg = [1, 2, 3].some((n) => !(c['foto' + n]) && prodOf(c, n) && prodOf(c, n).billede);
    const rule = RULES[c.rule] || RULES.spring_over;
    const ruleAct = c.rule === 'spoerg_foerst' ? `<a class="link link--block" href="#/spoerg/${slug(v)}">Spørg hjemme</a>` : '';
    const facts = [c.max ? `<div><dt>Maks pris</dt><dd>${esc(c.max)} kr</dd></div>` : '', c.store ? `<div><dt>Plejer at købe i</dt><dd>${esc(c.store)}</dd></div>` : ''].join('');
    const opts = [[1, 'Prio 1'], [2, 'Prio 2'], [3, 'Prio 3'], [4, 'Ikke fundet']];
    return `${back('#/indkob', 'Indkøb')}
      <div class="card-head"><h1 tabindex="-1">${esc(v)}</h1><p class="meta">${esc(catOf[v] || '')}</p></div>
      <div class="qtyrow no-print"><span class="label">${onList(v) ? 'Antal på listen' : 'Ikke på listen'}</span>${stepper(v, 'kort')}</div>${onList(v) ? extraPanel(v) : ''}
      <div class="p1">${mark(1, 'mark--xl', 'Prio 1')}<div class="p1__text"><p class="p1__desc">${nb(c.p1)}</p>${where(1)}${c.ean1 ? `<p class="ean">Stregkode ${esc(c.ean1)}</p>` : ''}</div></div>
      <p class="no-print"><a class="btn btn--quiet btn--s" href="#/scan?vare=${slug(v)}">${icon.scan}<span>Scan og tjek varen</span></a></p>
      ${p1p && p1p.billede ? `<figure class="p1__photo"><img src="${esc(p1p.billede)}" alt="Pakken: ${esc(p1p.own ? c.p1 : prodLabel(p1p))}" width="400" height="400">${p1p.own ? '<figcaption class="meta">Eget foto</figcaption>' : ''}</figure><p class="photo-row no-print">${photoPick('card', v, 1, !!c.foto1)}</p>` : ''}
      ${(() => { const al = prodAllergy(prodOf(c, 1)); const bl = blockOf(v); return al.length ? `<p class="notice notice--warn" role="note"><b>Indeholder ${esc(al.map(lower1).join(' og '))}</b> ifølge Open Food Facts. Vælg en anden prio 1, eller tjek pakken.</p>` : bl ? `<p class="notice notice--warn" role="note"><b>${esc(bl)}.</b> Varen kommer ikke på listen fra retterne. <a class="link" href="#/profil">Ret i profilen</a></p>` : ''; })()}
      ${c.note ? `<p class="husk"><b>Husk:</b> ${nb(c.note)}</p>` : ''}
      ${alts ? `<ul class="alts" aria-label="Godkendte alternativer">${alts}</ul><p class="meta hint">Finder du ikke 1, må du tage 2. Er 2 der heller ikke, så tag 3.</p>` : ''}
      <div class="rule">${mark(4, 'mark--l', 'Prio 4, hvis ingen findes')}<div class="rule__text"><b>${esc(rule[0])}</b><p class="meta">${esc(rule[1])}</p>${ruleAct}</div></div>
      ${stdCard(v) && stdCard(v).auto ? `<div class="notice autonote no-print"><p><b>Forslag, ikke valgt af jer.</b> Mærkerne er sat ind ud fra hvad der findes. Ret dem til eller godkend dem.</p><p class="photo-row"><button class="btn btn--quiet btn--s" type="button" data-approve="${esc(v)}">Godkend</button><a class="btn btn--quiet btn--s" href="#/mine?q=${encodeURIComponent(v)}">Ret i Mine varer</a></p></div>` : ''}
      <section class="weekstrip no-print" aria-labelledby="ws"><h2 id="ws">Rækkefølgen i ${weekLabel()}</h2><p class="meta">Træk billederne for at bytte om. Det ændrer kun denne uges liste.</p>${prioStrip(v, 'week')}
        ${hasOv(v) ? `<p class="photo-row"><button class="btn btn--quiet btn--s" type="button" data-ov-save="${esc(v)}">Gem som standard</button><button class="btn btn--quiet btn--s" type="button" data-ov-reset="${esc(v)}">Brug standard</button></p>` : ''}</section>
      ${facts ? `<dl class="facts">${facts}</dl>` : ''}
      ${friskBlock(v)}
      ${nutOn() ? (() => { const n = nutOf(v); const p1 = prodOf(c, 1); return n ? `<section class="section" aria-labelledby="nh"><h2 id="nh">Næring pr. 100 g ${nutriBadge(n.nutri)}</h2><div class="nutri"><span><b>${fmtN(n.kcal)}</b> kcal</span><span><b>${fmtN(n.protein)} g</b> protein</span><span><b>${fmtN(n.kulh)} g</b> kulhydrat</span><span><b>${fmtN(n.fedt)} g</b> fedt</span>${n.sukker != null ? `<span><b>${fmtN(n.sukker)} g</b> sukker</span>` : ''}${n.salt != null ? `<span><b>${fmtN(n.salt)} g</b> salt</span>` : ''}</div><p class="meta">${n.src === 'produkt' ? `For ${esc(prodLabel(p1))}, fra Open Food Facts.` : 'Typisk værdi for varen, ikke for et bestemt produkt.'}</p></section>` : ''; })() : ''}
      <p class="no-print linkrow"><a class="link link--block" href="#/priser/${slug(v)}">Priser og tilbud</a><a class="link link--block" href="#/kort/${slug(v)}/rediger">Ret kortet</a></p>
      ${p1p && p1p.billede ? '' : `<div class="nophoto no-print"><p class="meta">Intet billede endnu. Tag et foto af pakken, eller vælg produktet, så kommer billedet med.</p><p class="photo-row">${photoPick('card', v, 1, false, 'Tag foto')}<a class="btn btn--quiet btn--s" href="#/vaelg/${slug(v)}?prio=1">Vælg produkt</a></p></div>`}
      ${(() => { const cur = new Set([1, 2, 3].map((n) => c['ean' + n]).filter(Boolean)); const alt = suggest(v, 10).filter((p) => !cur.has(p.ean)).slice(0, 8); return alt.length ? `<section class="section switch no-print" aria-labelledby="sw"><h2 id="sw">Skift til en anden ${esc(lower1(v))}</h2><p class="meta">Tryk for at gøre den til prio 1 i ${weekLabel()}. De andre rykker ned.</p><ul class="switch__list">${alt.map((p) => `<li><button type="button" class="switch__btn" data-swap="${esc(p.ean)}" data-vare="${esc(v)}">${thumb(p, 'switch__img')}<span class="meta"><b>${esc(p.maerke)}</b> ${nb(p.navn)}</span></button></li>`).join('')}</ul><p><a class="link link--block" href="#/vaelg/${slug(v)}?prio=1">Se alle ${pl((PR[v] || []).length, 'produkt', 'produkter')}</a></p></section>` : ''; })()}
      ${anyImg ? `<p class="credit">${OFF_CREDIT}</p>` : ''}
      <section class="decide dock no-print" aria-labelledby="dh"><div class="dock__col"><h2 id="dh" class="visually-hidden">Hvad fandt du?</h2>
        <div class="found">${opts.map(([p, l]) => `<button type="button" data-found="${p}" aria-pressed="${t === p}">${mark(p)}${l}</button>`).join('')}</div>
        <p class="decide__help" id="found-help" aria-live="polite">${t ? `Registreret: ${FOUND[t]}.` : 'Hvad fandt du? Tryk på det, der kom i kurven.'}</p>
      </div></section>`;
  }

  function rediger(v) {
    const c = stdCard(v) || { p1: '', p2: '', p3: '', rule: 'spring_over', max: '', store: '', note: '' };
    const moves = (p) => `<span class="moves">${p > 1 ? `<button class="iconbtn" type="button" data-move="${p}>${p - 1}" aria-label="Ryk prio ${p} op til prio ${p - 1}">${icon.up}</button>` : ''}${p < 3 ? `<button class="iconbtn" type="button" data-move="${p}>${p + 1}" aria-label="Ryk prio ${p} ned til prio ${p + 1}">${icon.down}</button>` : ''}${p > 1 ? `<button class="btn btn--quiet btn--s" type="button" data-move="${p}>1">Gør til 1</button>` : ''}</span>`;
    const picked = (p) => { const pr = prodOf(c, p); return `<div class="picked">${thumb(imgOf(c, p))}<div class="picked__txt">${pr ? `<b>${nb(prodLabel(pr))}</b><span class="meta">${esc(pr.type)}${Object.keys(pr.butikker || {}).length ? ', set i ' + esc(Object.keys(pr.butikker).join(', ')) : ''}</span>` : `<span class="meta">${c['foto' + p] ? 'Eget foto' + (c['p' + p] ? ', beskrivelse skrevet selv' : '') : c['p' + p] ? 'Skrevet selv, intet produkt valgt' : 'Intet valgt endnu'}</span>`}</div><span class="picked__acts"><a class="btn btn--quiet btn--s" href="#/vaelg/${slug(v)}?prio=${p}" data-keepform>${pr ? 'Skift' : 'Vælg produkt'}</a>${photoPick('card', v, p, !!c['foto' + p])}</span></div>`; };
    const prio = (p, req) => `<fieldset class="prio-set" id="prio-${p}"><legend><span>${p === 1 ? 'Prio 1, den rigtige' : p === 2 ? 'Prio 2, godkendt alternativ' : 'Prio 3, nødløsning'}</span>${moves(p)}</legend>${mark(p, 'mark--l')}<div class="prio-set__fields">${picked(p)}
      <div class="field"><label for="p${p}">Beskrivelse${req ? ' (skal udfyldes)' : ''}</label><textarea class="input input--grow" rows="2" maxlength="120" id="p${p}" name="p${p}" autocomplete="off" ${req ? 'aria-required="true"' : ''} aria-describedby="p${p}-help">${esc(c['p' + p])}</textarea><p class="help" id="p${p}-help">${p === 1 ? 'Mærke, variant og størrelse, fx fedtprocent og vægt.' : ''}</p></div>
      <div class="field"><label for="e${p}">Stregkode</label><div class="inline"><input class="input" id="e${p}" name="e${p}" value="${esc(c['ean' + p])}" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="13 cifre"><button class="btn btn--quiet" type="button" data-scanfield="e${p}">${icon.scan}Scan</button></div></div>
    </div></fieldset>`;
    return `${back('#/kort/' + slug(v), v)}
      <div class="screen-head"><h1 tabindex="-1">Ret kortet</h1><p class="lead">${esc(askOf[v] || '')}</p><p class="help" id="move-help" aria-live="polite"></p></div>
      ${suggestBlock(v, c)}
      <form class="form" id="cardform" novalidate data-vare="${esc(v)}">
        ${prio(1, true)}${prio(2)}${prio(3)}
        <fieldset class="prio-set"><legend>Prio 4, hvis ingen af de tre findes</legend>${mark(4, 'mark--l')}<div class="choices prio-set__fields">
          ${Object.entries(RULES).map(([k, [l, d]]) => `<div class="choice"><input type="radio" name="rule" id="r-${k}" value="${k}" ${c.rule === k ? 'checked' : ''}><label for="r-${k}">${esc(l)}<small>${esc(d)}</small></label></div>`).join('')}
        </div></fieldset>
        <div class="split"><div class="field"><label for="max">Maks pris (kr)</label><input class="input" id="max" name="max" inputmode="decimal" value="${esc(c.max)}" autocomplete="off"></div>
        <div class="field"><label for="store">Plejer at købe i</label><input class="input" id="store" name="store" value="${esc(c.store)}" maxlength="40" autocomplete="off"></div></div>
        <div class="field"><label for="note">Husk</label><textarea class="input" id="note" name="note" maxlength="200">${esc(c.note)}</textarea></div>
        <div><button class="btn btn--primary btn--wide" type="submit">Gem kortet</button><p class="help" id="save-help" aria-live="polite"></p></div>
      </form>`;
  }

  function vaelg(v, q) {
    const prio = +(q.get('prio') || 1);
    const shop = q.has('butik') ? q.get('butik') : (db.shop || '');
    const type = q.get('type') || '';
    const brand = q.get('maerke') || '';
    const showUnknown = q.get('alle') === '1';
    const all = PR[v] || [];
    const c = stdCard(v) || {};
    const base = (o) => { const u = new URLSearchParams({ prio, butik: shop, type, maerke: brand, alle: showUnknown ? '1' : '0', ...o }); [...u.keys()].forEach((k) => { if (!u.get(k) || u.get(k) === '0') u.delete(k); }); return `#/vaelg/${slug(v)}?${u}`; };
    const head = `${back('#/kort/' + slug(v) + '/rediger', 'Ret kortet')}<div class="screen-head"><h1 tabindex="-1">Vælg prio ${prio}: ${esc(lower1(v))}</h1></div>`;
    if (!all.length) return head + `<div class="empty"><h2>Ingen produkter hentet for ${esc(lower1(v))} endnu</h2><p class="lead">Open Food Facts har ikke danske produkter i den kategori, eller de er ikke hentet. Skriv varianten selv på kortet.</p><a class="btn btn--primary" href="#/kort/${slug(v)}/rediger">Skriv selv</a></div>`;
    const inShop = (p) => !shop || seenIn(p, shop) === 'ja' || (showUnknown && seenIn(p, shop) === 'ukendt');
    const hiddenAllergy = all.filter((p) => prodAllergy(p).length).length;
    const pool = all.filter((p) => inShop(p) && !prodAllergy(p).length);
    const types = [...new Set(all.map((p) => p.type))];
    const brands = [...new Set(pool.filter((p) => !type || p.type === type).map((p) => p.maerke).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'da'));
    const list = pool.filter((p) => (!type || p.type === type) && (!brand || p.maerke === brand));
    const shops = CHAINS.filter((ch) => all.some((p) => p.butikker && p.butikker[ch]));
    const chip = (href, on, label, extra = '') => `<a class="chip" data-replace href="${href}" ${on ? 'aria-current="true"' : ''}>${label}${extra}</a>`;
    const slotOf = (ean) => [1, 2, 3].find((n) => c['ean' + n] === ean);
    const unknownN = all.filter((p) => shop && seenIn(p, shop) === 'ukendt').length;
    return head + `
      <div class="filters">
        <div class="field"><span class="label" id="fb">Butik</span><div class="chips chips--scroll" role="group" aria-labelledby="fb">${chip(base({ butik: '', maerke: '' }), !shop, 'Alle')}${shops.map((ch) => chip(base({ butik: ch, maerke: '' }), shop === ch, esc(ch))).join('')}</div></div>
        ${types.length > 1 ? `<div class="field"><span class="label" id="ft">Type</span><div class="chips chips--scroll" role="group" aria-labelledby="ft">${chip(base({ type: '', maerke: '' }), !type, 'Alle')}${types.map((t) => chip(base({ type: t, maerke: '' }), type === t, esc(t))).join('')}</div></div>` : ''}
        ${brands.length > 1 ? `<div class="field"><span class="label" id="fm">Mærke</span><div class="chips chips--scroll" role="group" aria-labelledby="fm">${chip(base({ maerke: '' }), !brand, 'Alle')}${brands.map((b) => chip(base({ maerke: b }), brand === b, esc(b))).join('')}</div></div>` : ''}
        ${shop && unknownN ? `<label class="toggle"><input type="checkbox" data-unknown="${esc(base({ alle: showUnknown ? '0' : '1' }))}" ${showUnknown ? 'checked' : ''}> Vis også ${pl(unknownN, 'produkt', 'produkter')} uden butiksoplysninger</label>` : ''}
      </div>
      <p class="meta" role="status">${pl(list.length, 'produkt', 'produkter')}${shop ? ` set i ${esc(shop)}` : ''}${hiddenAllergy ? `. ${hiddenAllergy} skjult pga. jeres allergier (<a class="link" href="#/profil">Profil</a>)` : ''}</p>
      ${list.length ? `<ul class="prods">${list.map((p) => { const at = slotOf(p.ean); const st = Object.keys(p.butikker || {}); return `<li><button type="button" class="prod" data-pick="${esc(p.ean)}" aria-label="Vælg ${esc(prodLabel(p))} som prio ${prio}${at ? `, er nu prio ${at}` : ''}">
        ${thumb(p, 'prod__img')}<span class="prod__txt"><b>${esc(p.maerke || 'Ukendt mærke')}</b><span>${nb(p.navn + (p.maengde ? ', ' + p.maengde : ''))}</span><span class="meta">${esc(p.type)}${p.oeko ? ', økologisk' : ''}${st.length ? `. Set i ${esc(st.join(', '))}` : '. Butik ukendt'}</span></span>
        ${at ? `<span class="mark" data-p="${at}" aria-hidden="true">${at}</span>` : ''}</button></li>`; }).join('')}</ul>`
      : `<div class="empty"><h2>Intet passer</h2><p class="lead">${shop ? `Ingen af de hentede produkter er set i ${esc(shop)}.` : 'Prøv et andet filter.'}</p><a class="btn btn--quiet" data-replace href="${base({ butik: '', type: '', maerke: '' })}">Nulstil filtre</a></div>`}
      <p class="credit">${OFF_CREDIT} Butikker kommer fra Open Food Facts og fra kædernes egne mærker, og listen er ikke komplet.</p>`;
  }

  const OP = (window.OPSKRIFTER && window.OPSKRIFTER.opskrifter) || {};
  const OPBASE = { ...OP }; const RETBASE = Object.fromEntries(Object.keys(S.retter).map((d) => [d, S.retter[d]]));
  const ILL = window.ILLUSTRATIONER || {};
  // picture for an item: the card's own choice first, then an example product, then a stock illustration
  const itemImg = (v, noBrands) => { const c = card(v); const own = imgOf(c, 1); if (own && own.billede) return { src: own.billede, kind: 'kort' }; if (!noBrands) { const p = (PR[v] || []).find((x) => x.billede); if (p) return { src: p.billede, kind: 'eksempel' }; } return ILL[v] ? { src: ILL[v].src, kind: 'illustration' } : null; };
  const kindText = { eksempel: 'Eksempel på produkt', illustration: 'Illustration' };
  function ret(d) {
    const o = OP[d]; const items = S.retter[d] || [];
    const basePers = (o && o.personer) || 4; const persons = (db.port && db.port[d]) || basePers; const f = persons / basePers; const skip = new Set((W().skip && W().skip[d]) || []); const on = W().dishes.includes(d);
    if (!items.length) return `${back('#/retter', 'Retter')}<div class="empty"><h2>Retten findes ikke</h2><a class="btn btn--primary" href="#/retter">Til retterne</a></div>`;
    const buy = items.filter((v) => !skip.has(v)).length;
    const img = dishImg(d);
    return `${back('#/retter', 'Retter')}
      ${img ? `<figure class="dish__hero"><img src="${esc(img)}" alt="${esc(d)}" width="500" height="375"></figure>` : ''}
      <div class="screen-head"><h1 tabindex="-1">${esc(d)}</h1>${o ? `<div class="portions"><span class="label">Personer</span><span class="stepper" role="group" aria-label="Antal personer"><button class="iconbtn" type="button" data-port="-1" data-dish-name="${esc(d)}" aria-label="Færre personer" ${persons <= 1 ? 'disabled' : ''}>${icon.minus}</button><output class="stepper__n" aria-live="polite">${persons}</output><button class="iconbtn" type="button" data-port="1" data-dish-name="${esc(d)}" aria-label="Flere personer" ${persons >= 20 ? 'disabled' : ''}>${icon.plus}</button></span>${o.tid ? `<span class="meta">${esc(o.tid)}</span>` : ''}</div>` : ''}${W().dishes.includes(d) ? `<div class="chaptersel no-print"><label for="daysel">Dag i ${weekLabel()}</label><select class="input" id="daysel" data-plan="${esc(d)}">${dayOptions(db.week, W().plan ? W().plan[d] : undefined)}</select></div>` : ''}<div class="chaptersel no-print"><label for="emnesel">Kapitel</label><select class="input" id="emnesel" data-emne="${esc(d)}">${emner().map((e) => `<option ${emneOf(d) === e ? 'selected' : ''}>${esc(e)}</option>`).join('')}</select></div>${o ? `<p><a class="link" href="#/ny-opskrift?ret=${slug(d)}">${db.opskrifter && db.opskrifter[d] ? 'Ret opskriften' : 'Lav jeres egen udgave'}</a></p>` : ''}</div>
      <p class="photo-row no-print">${photoPick('dish', d, 0, !!(db.dishFoto && db.dishFoto[d]), 'Eget foto af retten')}</p>
      ${nutOn() && dishNut(d) ? `<section class="section" aria-label="Næring">${nutBlock(dishNut(d))}</section>` : ''}
      <section class="section" aria-labelledby="ing"><h2 id="ing">Det skal I bruge</h2><p class="meta">Fjern fluebenet ved det, I har hjemme. Træk mærkerne for at bytte om i ${weekLabel()}.</p>
        <ul class="ings">${items.map((v, k) => { const im = itemImg(v); const c = card(v); const bl = blockOf(v); if (bl) return `<li class="ing--off"><span class="dish__tick" aria-hidden="true"></span><a class="ing__open" href="#/kort/${slug(v)}"><span class="ing__img ing__img--none" aria-hidden="true"></span><span class="row__txt"><span class="row__name">${esc(v)}</span><span class="row__want">Ikke på listen. ${esc(bl)}</span></span></a></li>`; return `<li><input type="checkbox" id="i${k}" data-ing="${esc(v)}" ${skip.has(v) ? '' : 'checked'} aria-label="Køb ${esc(v)}"><label for="i${k}" class="dish__tick"><span class="box" aria-hidden="true">${icon.check}</span></label>
          <a class="ing__open" href="#/kort/${slug(v)}">${im ? `<img class="ing__img" src="${esc(im.src)}" alt="" width="400" height="400" loading="lazy">` : '<span class="ing__img ing__img--none" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(v)}${o && o.maengder[v] ? `<span class="amt">, ${esc(scaleAmt(o.maengder[v], f))}</span>` : ''}</span><span class="row__want">${c && c.p1 ? nb(c.p1) : im && kindText[im.kind] ? `${kindText[im.kind]}. Intet varekort endnu` : 'Intet varekort endnu'}</span></span></a>${c && c.p1 ? `<div class="ing__strip">${prioStrip(v, 'week', 'strip--s')}</div>` : ''}</li>`; }).join('')}</ul>
        ${window.OPSKRIFTER ? `<p class="meta">Fra skabet: ${esc(window.OPSKRIFTER.skab.join(', '))}.</p>` : ''}</section>
      ${o ? `<section class="section" aria-labelledby="how"><h2 id="how">Sådan gør I</h2>${(() => { const pre = Object.entries(TK).filter(([, x]) => x.alle && items.some((v) => x.alle.test(v))); return pre.length ? `<p class="pre">Før I går i gang: ${pre.map(([id, x]) => `<a class="howto" href="#/teknik/${id}?fra=${slug(d)}">${icon.play}${esc(x.navn)}</a>`).join(' ')}</p>` : ''; })()}<ol class="steps">${o.trin.map((t) => { const hit = Object.entries(TK).filter(([, x]) => x.match && x.match.test(t)).slice(0, 4); return `<li><span>${esc(t)}</span>${hit.length ? `<span class="howtos">${hit.map(([id, x]) => `<a class="howto" href="#/teknik/${id}?fra=${slug(d)}" aria-label="Se hvordan: ${esc(x.navn)}">${icon.play}${esc(x.navn)}</a>`).join('')}</span>` : ''}</li>`; }).join('')}</ol><p class="meta">Forslag til en almindelig opskrift. Skriv jeres egen version herunder.</p></section>` : ''}
      <div class="field section"><label for="dnote">Jeres noter til retten</label><textarea class="input" id="dnote" data-dnote="${esc(d)}" maxlength="600" placeholder="fx dobbelt portion, eller uden løg">${esc((db.dnote && db.dnote[d]) || '')}</textarea><p class="help" id="dnote-help" aria-live="polite"></p></div>
      ${img && !(db.dishFoto && db.dishFoto[d]) && (RB[d] || BB[d]) ? `<p class="credit">Foto: ${esc((RB[d] || BB[d]).credit)}</p>` : ''}
      <div class="dock no-print"><div class="dock__in"><button class="btn btn--primary" type="button" data-addish="${esc(d)}" ${buy ? '' : 'disabled'}>${on ? `Opdater listen, ${pl(buy, 'vare', 'varer')}` : `Læg på listen, ${pl(buy, 'vare', 'varer')}`}</button>${on ? `<button class="btn btn--quiet" type="button" data-rmdish="${esc(d)}">Fjern fra ugen</button>` : ''}</div></div>`;
  }

  // Mine varer: pick a category, then a product; one item at a time instead of one long list
  function mine(q) {
    const v = q.get('v');
    if (v && catOf[v]) return mineItem(v);
    const f = q.get('f') || ''; const term = q.get('q') || '';
    const all = S.varer.map((x) => x.navn).concat(Object.keys(db.egne || {}));
    const autos = all.filter((x) => stdCard(x) && stdCard(x).auto);
    const cats = [...new Set(all.map((x) => catOf[x]))];
    const kat = f === 'forslag' ? '' : (cats.includes(q.get('kat')) ? q.get('kat') : (cats.includes(db.mineKat) ? db.mineKat : cats[0]));
    const shown = (x) => (f === 'forslag' ? autos.includes(x) : catOf[x] === kat);
    const chip = (href, on, label) => `<a class="chip" data-replace href="${href}" ${on ? 'aria-current="true"' : ''}>${label}</a>`;
    const row = (x) => { const c = stdCard(x) || {}; const im = imgOf(c, 1); return `<li data-name="${esc(norm(x))}" ${shown(x) ? '' : 'hidden'}><a class="pvare" href="#/mine?v=${slug(x)}">${im && im.billede ? `<img class="row__img" src="${esc(im.billede)}" alt="" width="400" height="400" loading="lazy">` : '<span class="row__img row__img--blank" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(x)}${c.auto ? ' <span class="badge">Forslag</span>' : ''}</span><span class="row__want">${blockOf(x) ? esc(blockOf(x)) : c.p1 ? nb(c.p1) : 'Intet valgt endnu'}</span></span>${icon.fwd}</a></li>`; };
    return `<div class="screen-head"><h1 tabindex="-1">Mine varer</h1><p class="lead">Jeres faste valg for alle uger. Vælg en kategori og derefter en vare.</p></div>
      <div class="field minesearch"><label class="visually-hidden" for="minesq">Søg i jeres varer</label><span class="composer__field">${icon.search}<input id="minesq" type="search" placeholder="Søg i ${pl(all.length, 'vare', 'varer')}…" value="${esc(term)}" autocomplete="off" data-minesearch></span></div>
      <div class="chips chips--scroll minecats" role="group" aria-label="Kategori">${autos.length ? chip('#/mine?f=forslag', f === 'forslag', `Forslag at se igennem <span class="badge">${autos.length}</span>`) : ''}${cats.map((k) => chip(`#/mine?kat=${slug(k)}`, f !== 'forslag' && k === kat, `${esc(k)} <small>${all.filter((x) => catOf[x] === k).length}</small>`)).join('')}</div>
      <ul class="pvarer minelist">${all.map(row).join('')}</ul>
      <p class="meta" id="mine-none" hidden>Ingen varer hedder det. Tilføj den fra Indkøb.</p>
      ${f === 'forslag' && !autos.length ? `<div class="empty"><h2>Alt er set igennem</h2><p class="lead">Alle varer har jeres eget valg.</p></div>` : ''}`;
  }
  function mineItem(v) {
    const c = stdCard(v) || {}; const kat = catOf[v];
    const alts = suggest(v, 8).filter((p) => ![c.ean1, c.ean2, c.ean3].includes(p.ean)).slice(0, 6);
    return `${back(`#/mine?kat=${slug(kat)}`, 'Mine varer')}<div class="screen-head"><h1 tabindex="-1">${esc(v)}</h1><p class="meta">${esc(kat)}</p></div>
      ${c.auto ? `<div class="autonote"><p><b>Forslag, ikke valgt af jer.</b> Godkend det, eller vælg et andet herunder.</p><button class="btn btn--quiet btn--s" type="button" data-approve="${esc(v)}">Godkend</button></div>` : ''}
      <section class="section" aria-labelledby="mrk"><h2 id="mrk">Jeres rækkefølge</h2><p class="meta">Træk billederne for at bytte om. Tryk på et for at vælge et andet produkt.</p>${prioStrip(v, 'std')}</section>
      ${alts.length ? `<section class="section switch" aria-labelledby="sw"><h2 id="sw">Gør en anden til prio 1</h2><ul class="switch__list">${alts.map((p) => `<li><button type="button" class="switch__btn" data-stdswap="${esc(p.ean)}" data-vare="${esc(v)}">${p.billede ? `<img class="switch__img" src="${esc(p.billede)}" alt="" width="400" height="400" loading="lazy">` : ''}<span><b>${esc(p.maerke || '')}</b> ${nb(p.navn)}</span></button></li>`).join('')}</ul><p class="credit">${OFF_CREDIT}</p></section>` : ''}
      <p class="section"><a class="btn btn--quiet" href="#/kort/${slug(v)}/rediger">Hele varekortet</a></p>`;
  }

  function retter(q) {
    const sel = new Set(W().dishes);
    const n = [...new Set([...sel].flatMap(needOf))].length;
    const em = q && q.get('emne'); const chapters = emner();
    const names = Object.keys(S.retter).filter((d) => (!em || emneOf(d) === em) && (kostOk(d) || sel.has(d))).sort((a, b) => (chapters.indexOf(emneOf(a)) - chapters.indexOf(emneOf(b))) || (S.start.includes(b) - S.start.includes(a)) || a.localeCompare(b, 'da'));
    const bookNav = `<nav class="chips chips--scroll booknav" aria-label="Kapitler i opskriftsbogen"><a class="chip" data-replace href="#/retter" ${!em ? 'aria-current="true"' : ''}>Alle <small>${Object.keys(S.retter).length}</small></a>${chapters.map((e) => `<a class="chip" data-replace href="#/retter?emne=${slug(e)}" ${em === e ? 'aria-current="true"' : ''}>${esc(e)} <small>${Object.keys(S.retter).filter((d) => emneOf(d) === e).length}</small></a>`).join('')}</nav>`;
    return `${thawBanner()}${segNav('uge')}<div class="screen-head"><h1 tabindex="-1">Hvad skal vi spise i ${weekLabel()}?</h1>${weekNav()}<p class="lead">Sæt flueben ved ugens retter. Tryk på en ret for at se opskriften og vælge, hvad der skal købes.</p><p class="retter__links"><a class="howto" href="#/vaelg-ret">${icon.dice}Vælg en ret for mig</a><a class="howto" href="#/kogebog">${icon.search}Find flere retter</a><a class="howto" href="#/ny-opskrift">${icon.plus}Skriv jeres egen</a><a class="howto" href="#/teknikker">${icon.play}Sådan gør du</a></p></div>
      ${nutOn() ? (() => { const ns = [...sel].map(dishNut).filter((x) => x && x.kcal); if (!ns.length) return ''; const avg = (k) => Math.round(ns.reduce((a, x) => a + x[k], 0) / ns.length); return `<section class="summary weeknut" aria-label="Ugens aftensmad"><p class="progress"><b>ca. ${avg('kcal')}</b><span class="meta">kcal pr. person i gennemsnit for ${pl(ns.length, 'ret', 'retter')} i ${weekLabel()}</span></p><p class="meta">${avg('protein')} g protein, ${avg('kulh')} g kulhydrat og ${avg('fedt')} g fedt pr. portion. Regnet ud fra opskrifterne, ikke fra hvad I har spist.</p></section>`; })() : ''}
      ${planBlock(sel)}
      ${bookNav}<fieldset><legend class="visually-hidden">Retter</legend><ul class="dishes">${names.map((d, i) => (i === 0 || emneOf(names[i - 1]) !== emneOf(d) ? `<li class="chapter"><h2>${esc(emneOf(d))}</h2></li>` : '') + `<li><input type="checkbox" id="d${i}" data-dish="${esc(d)}" ${sel.has(d) ? 'checked' : ''} aria-label="Vælg ${esc(d)} til ${weekLabel()}"><label for="d${i}" class="dish__tick"><span class="box" aria-hidden="true">${icon.check}</span></label><a class="dish__open" href="#/ret/${slug(d)}">${dishImg(d) ? `<img class="dish__img" src="${esc(dishImg(d))}" alt="" width="500" height="375" loading="lazy">` : '<span class="dish__img dish__img--none" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(d)}</span><span class="row__want">${sel.has(d) && W().plan && W().plan[d] != null ? `<b>${DAYS[W().plan[d]]}</b>, ` : ''}${nutOn() && dishNut(d) ? `ca. ${dishNut(d).kcal} kcal, ` : ''}${pl(needOf(d).length, 'vare', 'varer')}${needOf(d).length < S.retter[d].length ? ` (${S.retter[d].length - needOf(d).length} har I)` : ''}${S.start.includes(d) ? ', startret' : ''}${db.dishFoto && db.dishFoto[d] ? ', eget foto' : ''}</span></span></a><label class="iconbtn dish__cam" title="Eget foto">${icon.camera}<input type="file" accept="image/*" class="visually-hidden" data-photo="dish" data-key="${esc(d)}" data-n="0" aria-label="Eget foto af ${esc(d)}"></label></li>`).join('')}</ul></fieldset>
      ${Object.keys(RB).length ? `<details class="credits"><summary>Fotokreditering</summary><ul>${names.filter((d) => RB[d] && !(db.dishFoto && db.dishFoto[d])).map((d) => `<li>${esc(d)}: ${esc(RB[d].credit)}</li>`).join('')}</ul></details>` : ''}
      <div class="dock"><div class="dock__in"><button class="btn btn--primary" type="button" id="build" ${sel.size ? '' : 'disabled'}>Byg listen, ${pl(n, 'vare', 'varer')}</button></div></div>`;
  }

  function katalog(q) {
    const f = q.get('f') || 'alle';
    const term = q.get('q') || '';
    const startItems = new Set(S.start.flatMap((d) => S.retter[d]));
    let vs = S.varer.map((v) => v.navn);
    if (f === 'mangler') vs = vs.filter((v) => !filled(v));
    if (f === 'start') vs = vs.filter((v) => startItems.has(v));
    const chips = [['alle', 'Alle'], ['mangler', 'Mangler kort'], ['start', 'Startpakke']];
    const head = `<div class="screen-head"><h1 tabindex="-1">Katalog, ${S.varer.length} varer</h1><p class="lead">${S.varer.filter((v) => filled(v.navn)).length} har et udfyldt kort. ${listItems().length} står på listen. Tryk Tilføj for at lægge en enkelt vare på listen.</p></div>
      <div class="field search"><label for="find">Søg i varerne</label><input class="input" type="search" id="find" name="q" value="${esc(term)}" placeholder="fx mælk eller fedt%" autocomplete="off" enterkeyhint="search" aria-describedby="find-help"><p class="help" id="find-help" aria-live="polite"></p></div>
      <div class="chips" role="group" aria-label="Filter" style="margin-bottom: var(--space-lg)">${chips.map(([k, l]) => `<a class="chip" href="#/katalog?f=${k}${term ? '&q=' + encodeURIComponent(term) : ''}" data-replace ${f === k ? 'aria-current="true"' : ''}>${l}</a>`).join('')}</div>`;
    if (f === 'tilbud') return head + `<div class="empty"><h2>Ingen tilbud hentet endnu</h2><p class="lead">Tilbud vises her, når den første priskilde er koblet på. Indtil da kan du skrive en pris ind på varekortet.</p><a class="btn btn--primary" href="#/priser/${slug('Hakket svinekød')}">Se priser for hakket svinekød</a></div>`;
    const groups = {};
    vs.forEach((v) => (groups[catOf[v]] ||= []).push(v));
    const shopLine = (v) => { const ps = PR[v] || []; if (!ps.length) return ''; const here = db.shop ? ps.filter((p) => seenIn(p, db.shop) === 'ja') : ps; const br = [...new Set(here.map((p) => p.maerke).filter(Boolean))]; return `<span class="q shopline">${db.shop ? `I ${esc(db.shop)}: ` : ''}${here.length ? `${pl(here.length, 'produkt', 'produkter')}${br.length ? ` (${esc(br.slice(0, 4).join(', '))}${br.length > 4 ? ' m.fl.' : ''})` : ''}` : 'ingen set endnu'}</span>`; };
    const cats = Object.keys(groups); katSel = f === 'alle' && !term ? (cats.includes(q.get('kat')) ? q.get('kat') : (cats.includes(db.katKat) ? db.katKat : cats[0])) : '';
    if (q.get('kat')) { db.katKat = q.get('kat'); save(); }
    const catChips = katSel ? `<nav class="chips chips--scroll minecats" aria-label="Kategori">${cats.map((k) => `<a class="chip" data-replace href="#/katalog?kat=${slug(k)}" ${k === katSel ? 'aria-current="true"' : ''}>${esc(k)} <small>${groups[k].length}</small></a>`).join('')}</nav>` : '';
    const shopSel = `<div class="field shop"><label for="shop">Vis produkter i</label><select class="input" id="shop" data-shop>${['', ...CHAINS].map((c) => `<option value="${esc(c)}" ${db.shop === c ? 'selected' : ''}>${c || 'Alle butikker'}</option>`).join('')}</select></div>`;
    return head + shopSel + catChips + Object.entries(groups).map(([cat, list]) => `<section class="group" data-cat="${esc(cat)}"><h2>${esc(cat)}</h2><ul class="cat">${list.map((v) => `<li class="cat__row${onList(v) ? ' is-on' : ''}" data-find="${esc((v + ' ' + (filled(v) ? card(v).p1 : askOf[v] || '')).toLowerCase())}"><a href="#/kort/${slug(v)}">${itemImg(v) ? `<img class="cat__img" src="${esc(itemImg(v).src)}" alt="" width="400" height="400" loading="lazy">` : '<span class="cat__img cat__img--none" aria-hidden="true"></span>'}<span class="row__name">${esc(v)}</span><span class="state ${filled(v) ? '' : 'state--todo'}">${filled(v) ? 'Klar' : 'Mangler kort'}</span>${filled(v) ? `<span class="q">${esc(card(v).p1)}</span>` : `<span class="q">${esc(askOf[v])}</span>`}${shopLine(v)}</a><span class="cat__ctl">${stepper(v)}</span></li>`).join('')}</ul></section>`).join('');
  }

  // what a scanned barcode means for the list. target = the item the person is looking for, if any
  function scanVerdict(ean, target) {
    const items = target ? [target] : listItems();
    for (const v of items) { const c = card(v); if (!c) continue; const n = [1, 2, 3].find((k) => c['ean' + k] === ean); if (n) return { kind: 'prio', v, n, c }; }
    // known product, but not on this card: which item does it belong to?
    const owner = Object.keys(PR).find((v) => PR[v].some((p) => p.ean === ean));
    const p = byEan[ean];
    if (target) return { kind: 'wrong', v: target, c: card(target), p, owner };
    if (owner && onList(owner)) return { kind: 'wrong', v: owner, c: card(owner), p, owner };
    return { kind: 'unknown', p, owner };
  }
  function scan(q) {
    const target = q.get('vare') || ''; const ean = q.get('ean') || '';
    const backTo = target ? ['#/kort/' + slug(target), target] : ['#/indkob', 'Indkøb'];
    const head = `${back(...backTo)}<h1 class="visually-hidden" tabindex="-1">Scan ${target ? esc(lower1(target)) : 'en vare'}</h1>`;
    const manual = `<form class="form scan__manual" id="eanform" novalidate data-vare="${esc(target)}"><div class="field"><label for="ean">Eller skriv stregkoden</label><input class="input" id="ean" name="ean" inputmode="numeric" autocomplete="off" maxlength="14" pattern="[0-9]*" aria-describedby="ean-help" value="${esc(ean)}"></div><div><button class="btn btn--quiet btn--wide" type="submit">Tjek stregkoden</button><p class="help" id="ean-help" aria-live="polite"></p></div></form>`;
    if (!ean) {
      return head + `<div class="scan">
        <div class="viewfinder" id="viewfinder"><video id="camvid" muted playsinline aria-hidden="true"></video><div class="viewfinder__frame"><p id="cam-msg">Starter kameraet…</p></div></div>
        <p class="lead">${target ? `Hold stregkoden på ${esc(lower1(target))} foran kameraet.` : 'Hold stregkoden foran kameraet. Appen finder selv varen på listen.'}</p>
        <p class="help" id="cam-help" aria-live="polite"></p>
        ${manual}</div>`;
    }
    const r = scanVerdict(ean, target);
    const pName = r.p ? prodLabel(r.p) : `Stregkode ${ean}`;
    const again = `<a class="btn btn--quiet" data-replace href="#/scan${target ? `?vare=${slug(target)}` : ''}">Scan igen</a>`;
    let m, say, sub, act, about = r.v || '';
    if (r.kind === 'prio') {
      m = mark(r.n, 'mark--xl', `Prio ${r.n}`);
      say = r.n === 1 ? 'Prio 1. Den er rigtig.' : r.n === 2 ? 'Prio 2. Godkendt.' : 'Prio 3. Nødløsning.';
      sub = r.n === 1 ? r.c.p1 : `${r.c['p' + r.n]}. Prio 1 er ${r.c.p1}.`;
      act = `<button class="btn btn--primary" type="button" data-found-scan="${r.n}" data-vare="${esc(r.v)}">${r.n === 1 ? 'Læg i kurven' : 'Tag den'}</button>`;
    } else if (r.kind === 'wrong') {
      m = mark('x', 'mark--xl', 'Forkert vare'); say = 'Ikke den her.';
      const c = r.c || {};
      sub = c.p1 ? `${pName} står ikke på kortet. Find ${lower1(c.p1)}.${c.rule ? ` Findes ingen af de tre: ${lower1(RULES[c.rule][0])}.` : ''}` : `Der er intet varekort for ${lower1(r.v)} endnu.`;
      act = `<a class="btn btn--primary" href="#/spoerg/${slug(r.v)}">Spørg hjemme</a>`;
    } else {
      m = mark('x', 'mark--xl', 'Ukendt'); say = r.owner ? 'Ikke på listen.' : 'Kender den ikke.';
      sub = r.owner ? `${pName} er ${lower1(r.owner)}, som ikke står på listen for ${weekLabel()}.` : `${pName} er ikke på nogen af jeres varekort.`;
      act = r.owner ? `<a class="btn btn--primary" href="#/kort/${slug(r.owner)}">Se varekortet</a>` : '';
    }
    // teach mode: an unknown or wrong code can become a prio on the card right here
    const tv = target || r.owner || '';
    const teach = r.kind !== 'prio' && tv ? `<section class="section" aria-labelledby="th"><h2 id="th">Er det jeres vare?</h2><p class="meta">Gem stregkoden på kortet for ${esc(lower1(tv))}, så kender appen den næste gang.</p><div class="sugg__to" role="group" aria-labelledby="th">${[1, 2, 3].map((n) => `<button type="button" class="slotbtn" data-teach="${n}" data-vare="${esc(tv)}" data-ean="${esc(ean)}" aria-label="Gem som prio ${n}">${mark(n)}</button>`).join('')}</div></section>` : '';
    return head + `<div class="scan">
      ${r.p && r.p.billede ? `<img class="scan__img" src="${esc(r.p.billede)}" alt="" width="400" height="400">` : ''}
      <div class="verdict" role="status">${m}<div class="verdict__text"><p class="verdict__say">${esc(say)}</p><p class="meta">${esc(about || pName)}</p></div></div>
      ${nutOn() ? (() => { const n = (r.p && r.p.naering) || (r.v && nutOf(r.v)); return n ? `<p class="scan__nut">${nutriBadge(n.nutri)} ${fmtN(n.kcal)} kcal pr. 100 g, ${fmtN(n.protein)} g protein</p>` : ''; })() : ''}
      <p>${esc(sub)}</p>
      <div class="actions">${act}${again}</div>
      ${teach}
      <p class="meta">Stregkode ${esc(ean)}</p></div>`;
  }

  function spoerg(v) {
    const c = card(v) || {};
    const text = c.p1 ? `${c.store || 'Butikken'} har ingen af de tre: ${[c.p1, c.p2, c.p3].filter(Boolean).join(', ')}. Hvad gør jeg?` : `Hvilken ${lower1(v)} skal jeg tage? ${askOf[v] || ''}`.trim();
    return `${back('#/kort/' + slug(v), v)}<div class="screen-head"><h1 tabindex="-1">Spørg hjemme</h1><p class="lead">${c.p1 ? 'Kortet siger: spørg først. ' : ''}Send beskeden som sms eller i jeres beskedapp.</p></div>
      <form class="form" id="askform" novalidate>
        <div class="field"><label for="msg">Besked</label><textarea class="input" id="msg" name="msg" maxlength="300">${esc(text)}</textarea><p class="help">Du kan rette teksten, før du sender.</p></div>
        <div><button class="btn btn--primary btn--wide" type="submit">Send beskeden</button><p class="help" id="ask-help" aria-live="polite"></p></div>
      </form>
`;
  }

  function svar(v) {
    const c = card(v) || {};
    return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Spørgsmål fra butikken</h1></div>
      <div class="bubble"><b>${esc(v)}</b><p>${esc(c.store || 'Butikken')} har ingen af de tre: ${nb([c.p1, c.p2, c.p3].filter(Boolean).join(', '))}. Hvad gør jeg?</p></div>
      <form class="section" data-endpoint="" id="answerform"><h2 id="ah">Svar med ét tryk</h2>
        <div class="answers" role="group" aria-labelledby="ah">
          <button class="btn btn--quiet btn--wide" type="submit" value="spring_over">Spring over</button>
          <button class="btn btn--quiet btn--wide" type="submit" value="billigste">Køb billigste variant</button>
          <button class="btn btn--quiet btn--wide" type="submit" value="naermeste">Køb nærmeste alternativ</button>
        </div><p class="help" id="answer-help" aria-live="polite"></p></form>`;
  }

  function priser(v) {
    const c = card(v) || {};
    const own = (db.prices || []).filter((p) => p.vare === v).slice(-5).reverse();
    const ownTable = own.length ? `<table class="section"><caption>Dine egne registreringer</caption><thead><tr><th scope="col">Butik</th><th scope="col">Dato</th><th scope="col" class="r">Pris</th></tr></thead><tbody>${own.map((p) => `<tr><td>${esc(p.store || 'Ukendt butik')}</td><td>${new Date(p.at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</td><td class="r num">${p.price.toFixed(2).replace('.', ',')} kr</td></tr>`).join('')}</tbody></table>` : '';
    return `${back('#/kort/' + slug(v), v)}<div class="screen-head"><h1 tabindex="-1">Priser, ${esc(lower1(v))}</h1><p class="lead">Hver pris har en kilde og en dato. Gamle priser står nedtonet.</p></div>
      ${(() => { const rows = [1, 2, 3].map((n) => ({ n, e: c['ean' + n] && PZ.ean[c['ean' + n]] })).filter((r) => r.e); const t = PZ.typisk[v];
        if (!rows.length && !t) return `<p class="notice">Open Prices har ingen danske priser på ${esc(lower1(v))} endnu. Skriv jeres egen pris ind nedenfor.</p>`;
        return `<table><caption>Fra Open Prices, fotograferet i butikken af brugere</caption><thead><tr><th scope="col">Butik</th><th scope="col">Variant</th><th scope="col" class="r">Pris</th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td>${esc(r.e.butik || 'Ukendt butik')}<small>${r.e.tilbud ? 'Tilbud, ' : ''}${new Date(r.e.dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</small></td><td>Prio ${r.n}</td><td class="r num">${kr(r.e.pris)}</td></tr>`).join('')}
          ${t ? `<tr><td>Typisk pris<small>${t.antal} målinger, ${kr(t.fra)} til ${kr(t.til)}${t.tilbud ? `, ${t.tilbud} på tilbud` : ''}</small></td><td>Alle</td><td class="r num">ca. ${kr(t.median)}</td></tr>` : ''}
        </tbody></table>`; })()}
      ${ownTable}
      ${c.max ? `<dl class="facts section"><div><dt>Maks pris på kortet</dt><dd>${esc(c.max)} kr</dd></div><div><dt>Plejer at købe i</dt><dd>${esc(c.store || 'ikke valgt')}</dd></div></dl>` : ''}
      <form class="form section" id="priceform" novalidate data-vare="${esc(v)}"><h2>Skriv en pris ind</h2>
        <div class="split"><div class="field"><label for="pstore">Butik</label><input class="input" id="pstore" name="pstore" value="${esc(c.store || '')}" maxlength="40" autocomplete="off"></div>
        <div class="field"><label for="pprice">Pris (kr)</label><input class="input" id="pprice" name="pprice" inputmode="decimal" autocomplete="off" aria-describedby="price-help"></div></div>
        <div><button class="btn btn--primary btn--wide" type="submit">Gem prisen</button><p class="help" id="price-help" aria-live="polite"></p></div>
      </form>
      <div class="health"><p class="meta">Data: Open Prices, Open Database License, hentet ${esc(PZ.hentet || '')}. De fleste danske priser er tilbudspriser fra september 2026.</p></div>`;
  }

  // what the week's list looks like as data, used by the share text and the PDF
  function weekData() {
    const items = listItems(); const order = S.varer.map((x) => x.navn);
    items.sort((a, b) => (order.indexOf(a) - order.indexOf(b)));
    const rows = items.map((v) => { const c = card(v); const p = priceOf(v); return { name: v, cat: catOf[v] || 'Andet', qty: qtyOf(v), want: c && c.p1 ? c.p1 : '', extra: !fromDishes().has(v), opt: isOpt(v), note: extraOf(v), price: p ? `${p.kind === 'ca' ? 'ca. ' : ''}${kr(p.n * qtyOf(v))}${qtyOf(v) > 1 ? ` (${kr(p.n)} stk.)` : ''}` : '' }; });
    const ps = priceSum(items);
    return { week: weekLabel(), title: `Indkøb, ${weekLabel()}`, dishes: W().dishes.slice(), rows, ps, total: sumLine(ps), totalNote: ps.n ? 'Priser fra Open Prices (ODbL) og jeres egne. De fleste er tilbudspriser fra efteråret, så regn med lidt mere.' : '' };
  }
  function shareText(d, withWant) {
    const L = [];
    const both = d.rows.filter((r) => !r.extra), extra = d.rows.filter((r) => r.extra);
    if (d.dishes.length) {
      L.push(`Retterne i ${d.week} består af:`); d.dishes.forEach((x) => L.push(`- ${x}`)); L.push('');
      L.push('Til det skal der bruges:');
    } else L.push(`Indkøb i ${d.week}:`);
    const line = (r) => `- ${r.qty} × ${lower1(r.name)}${withWant && r.want ? ` (${r.want})` : ''}${r.note ? ` – ${r.note}` : ''}`;
    both.forEach((r) => L.push(line(r)));
    if (extra.length) { if (d.dishes.length) { L.push(''); L.push('Og derudover:'); } extra.forEach((r) => L.push(line(r))); }
    if (d.total) { L.push(''); L.push(`${d.total}.`); }
    return L.join('\n');
  }
  function del(q) {
    const d = weekData();
    if (!d.rows.length) return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Del listen, ${weekLabel()}</h1>${weekNav()}</div><div class="empty"><h2>Der er intet at dele endnu</h2><p class="lead">Vælg retter eller enkelte varer til ${weekLabel()} først.</p><div class="actions"><a class="btn btn--primary" href="#/retter">Vælg retter</a></div></div>`;
    const want = q.get('maerker') !== '0';
    const t = shareText(d, want);
    const pz = d.ps;
    return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Del listen, ${weekLabel()}</h1>${weekNav()}<p class="lead">Send listen som tekst til den, der handler, eller lav en PDF at krydse af på.</p></div>
      <section class="section" aria-labelledby="sh"><h2 id="sh">Som tekst</h2>
        <div class="choice choice--inline"><input type="checkbox" id="withwant" data-withwant ${want ? 'checked' : ''}><label for="withwant">Skriv prio 1 ved hver vare<small>Fx "Arla letmælk 1,5 %, 1 L"</small></label></div>
        <pre class="sharetext" id="sharetext" tabindex="0" aria-label="Teksten der bliver delt">${esc(t)}</pre>
        <div class="actions"><button class="btn btn--primary" type="button" data-share>Del</button><button class="btn btn--quiet" type="button" data-copy>Kopiér</button></div>
        <p class="help" id="share-help" aria-live="polite"></p></section>
      <form class="form section" id="pdfform" novalidate><h2>Som PDF</h2>
        <fieldset><legend class="label"><b>Indhold</b></legend><div class="choices" style="margin-top: var(--space-sm)">
          <div class="choice"><input type="radio" name="what" id="w1" value="liste" checked><label for="w1">Listen for ${weekLabel()}<small>${pl(d.rows.length, 'vare', 'varer')} med antal, prio 1 og felter at krydse af</small></label></div>
          <div class="choice"><input type="radio" name="what" id="w3" value="tjek"><label for="w3">Tom butikstjekliste<small>Til at undersøge hvad butikken har, med felter til hyldepris</small></label></div>
        </div></fieldset>
        <fieldset><legend class="label"><b>Format</b></legend><div class="choices" style="margin-top: var(--space-sm)">
          <div class="choice"><input type="radio" name="fmt" id="f1" value="telefon" checked><label for="f1">Telefon<small>Smal side, til at bladre på skærmen</small></label></div>
          <div class="choice"><input type="radio" name="fmt" id="f2" value="a4"><label for="f2">A4<small>Til print, virker i sort/hvid</small></label></div>
        </div></fieldset>
        <div><button class="btn btn--quiet btn--wide" type="submit">Lav PDF</button><p class="help" id="pdf-help" aria-live="polite">Krydsfelterne kan udfyldes i fx Adobe Acrobat Reader og Preview på Mac. På iPhone virker de ikke altid.</p></div>
      </form>
      <section class="section" id="priser" aria-labelledby="ph"><h2 id="ph">Hvor priserne kommer fra</h2>
        <p>${pz.n ? `Der er en pris på ${pz.n} af ${pl(pz.of, 'vare', 'varer')}. ` : 'Der er ingen priser på varerne endnu. '}Først bruges den pris, I selv har skrevet ind på varekortet. Så den seneste pris på jeres prio 1 i Open Prices, og ellers en typisk pris for varen.</p>
        <p class="meta">Open Prices er priser, folk selv har fotograferet i butikken. De fleste danske er tilbudspriser fra september 2026, så den rigtige pris er nok lidt højere. Data: Open Prices, Open Database License. Hentet ${esc(PZ.hentet || '')}.</p></section>`;
  }

  // ---------- profile ----------
  function profil() {
    const pf = prof(); const n = pf.allergi.length;
    const off = S.varer.map((x) => x.navn).filter((v) => blockOf(v));
    const groups = {}; S.varer.forEach(({ navn: v }) => (groups[catOf[v]] ||= []).push(v));
    const withData = Object.values(PR).flat().filter((p) => (p.allergener || []).length || (p.spor || []).length).length;
    const allP = Object.values(PR).flat().length;
    return `<div class="screen-head"><h1 tabindex="-1">Profil og indstillinger</h1><p class="lead">Det her gælder hele husstanden, og det gemmes på telefonen.</p></div>
      <nav class="toc" aria-label="På siden"><a class="chip" href="#/profil?vis=p-allergi" data-replace>Allergier</a><a class="chip" href="#/profil?vis=p-aldrig" data-replace>Varer I aldrig køber</a><a class="chip" href="#/profil?vis=p-butik" data-replace>Butik</a><a class="chip" href="#/profil?vis=p-naering" data-replace>Næring</a><a class="chip" href="#/profil?vis=p-paamind" data-replace>Påmindelser</a><a class="chip" href="#/profil?vis=p-data" data-replace>Data</a><a class="chip" href="#/hjaelp">Hjælp</a><a class="chip" href="#/profil?vis=p-varer" data-replace>Jeres varer</a><a class="chip" href="#/teknikker">Sådan gør du</a></nav>
      <section class="section" id="p-allergi" aria-labelledby="pa"><h2 id="pa">Allergier</h2>
        <p class="meta">Varer, der selv er allergenet, tages af listen, fx æg ved æggeallergi. Produkter, der indeholder det eller kan have spor af det, skjules i forslag og når I vælger produkt.</p>
        <div class="chips chips--wrap" role="group" aria-label="Allergier">${ALLERGENER.map((a) => `<button type="button" class="chip" data-allergi="${a.id}" aria-pressed="${pf.allergi.includes(a.id)}">${pf.allergi.includes(a.id) ? icon.check : ''}${esc(a.navn)}</button>`).join('')}</div>
        <p class="help" id="allergi-help" aria-live="polite">${n ? `${pl(n, 'allergi', 'allergier')} valgt.` : 'Ingen valgt.'}</p>
        <p class="meta">Pas på: kun ${withData} af ${allP} produkter har allergenoplysninger i Open Food Facts. Et produkt uden oplysninger er ikke nødvendigvis fri for allergenet. Tjek altid pakken.</p></section>
      <section class="section" id="p-aldrig" aria-labelledby="pn"><h2 id="pn">Varer I aldrig køber</h2>
        <p class="meta">Slå en vare fra, så kommer den ikke på listen fra retterne. ${off.length ? `Lige nu er ${pl(off.length, 'vare', 'varer')} taget af listen: ${esc(off.join(', '))}.` : ''}</p>
        ${Object.entries(groups).map(([cat, vs]) => `<details class="never"${vs.some((v) => pf.aldrig.includes(v)) ? ' open' : ''}><summary>${esc(cat)}<span class="meta">${vs.filter((v) => blockOf(v)).length ? `${vs.filter((v) => blockOf(v)).length} fra` : ''}</span></summary><ul class="never__list">${vs.map((v, k) => { const al = myAllergies().find((a) => a.varer.includes(v)); return `<li><input type="checkbox" id="nv-${esc(slug(v))}" data-aldrig="${esc(v)}" ${blockOf(v) ? '' : 'checked'} ${al ? 'disabled' : ''}><label for="nv-${esc(slug(v))}"><span class="box" aria-hidden="true">${icon.check}</span><span>${esc(v)}${al ? `<small>Fra pga. allergi: ${esc(lower1(al.navn))}</small>` : ''}</span></label></li>`; }).join('')}</ul></details>`).join('')}</section>
      <section class="section" id="p-butik" aria-labelledby="pb"><h2 id="pb">Butik</h2>
        <div class="field"><label for="pshop">Jeres foretrukne butik</label><select class="input" id="pshop" data-shop>${['', ...CHAINS].map((c) => `<option value="${esc(c)}" ${db.shop === c ? 'selected' : ''}>${c || 'Ingen bestemt'}</option>`).join('')}</select></div>
        <p class="meta">Produkter, der er set i butikken, står først i forslagene, og på listen ser I, hvilken prio butikken har.</p></section>
      <section class="section" id="p-naering" aria-labelledby="pn2"><h2 id="pn2">Næring</h2>
        <div class="choice choice--inline"><input type="checkbox" id="nutsw" data-nutsw ${nutOn() ? 'checked' : ''}><label for="nutsw">Vis næring og kalorier<small>På varekort, retter, opskrifter og når I scanner. Ingen dagbog, ingen mål.</small></label></div>
        ${nutOn() ? `<p class="label" id="kosth" style="margin-top: var(--space-md)">Jeres kost</p><div class="chips chips--wrap" role="group" aria-labelledby="kosth">${Object.entries(KOST).map(([k, l]) => `<button type="button" class="chip" data-kost="${k}" aria-pressed="${(db.profil.kost || []).includes(k)}">${(db.profil.kost || []).includes(k) ? icon.check : ''}${esc(l)}</button>`).join('')}</div><p class="meta">Kogebogen viser kun retter, der passer. Kalorier er regnet ud fra opskrifternes mængder og produkternes tal, så de er et skøn.</p>` : ''}</section>
      <section class="section" id="p-paamind" aria-labelledby="pp"><h2 id="pp">Påmindelser</h2>
        <div class="choice choice--inline"><input type="checkbox" id="remsw" data-remsw ${remCfg().on ? 'checked' : ''}><label for="remsw">Mind mig om at tage kødet op<small>Når en ret med kød har fået en dag under Retter. Vises øverst på Indkøb og Retter.</small></label></div>
        ${remCfg().on ? `<div class="split"><div class="field"><label for="remdag">Hvornår</label><select class="input" id="remdag" data-remdag><option value="foer" ${remCfg().dag === 'foer' ? 'selected' : ''}>Dagen før</option><option value="samme" ${remCfg().dag === 'samme' ? 'selected' : ''}>Samme dag</option></select></div><div class="field"><label for="remtid">Klokken</label><input class="input" type="time" id="remtid" data-remtid value="${esc(remCfg().tid)}"></div></div>` : ''}
        <p class="meta">En app kan ikke selv ringe, når den er lukket. Under Retter kan I lægge påmindelserne i telefonens kalender, så får I en rigtig alarm.</p></section>
      <section class="section" id="p-data" aria-labelledby="pd"><h2 id="pd">Jeres data</h2>
        <p class="meta">Alt ligger kun på denne telefon. Tag en kopi, så I ikke mister varekort, lister og opskrifter, eller send kopien til den anden telefon og hent den ind der.</p>
        <div class="actions"><button class="btn btn--quiet" type="button" data-export>Gem en kopi</button><label class="btn btn--quiet">Hent en kopi ind<input type="file" accept="application/json,.json" class="visually-hidden" data-import></label></div>
        <p class="help" id="data-help" aria-live="polite"></p></section>
      <section class="section" id="p-varer" aria-labelledby="pv"><h2 id="pv">Jeres varer</h2>
        <p class="meta">Prio 1 for hver vare. Tryk på en vare for at ændre kortet, eller træk rundt i <a class="link" href="#/mine">Mine varer</a>.</p>
        <ul class="pvarer">${S.varer.map(({ navn: v }) => { const c = stdCard(v) || {}; const im = imgOf(c, 1); const al = prodAllergy(prodOf(c, 1)); return `<li><a class="pvare" href="#/kort/${slug(v)}/rediger">${im && im.billede ? `<img class="row__img" src="${esc(im.billede)}" alt="" width="400" height="400" loading="lazy">` : '<span class="row__img row__img--blank" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(v)}${c.auto ? ' <span class="badge">Forslag</span>' : ''}</span><span class="row__want">${blockOf(v) ? esc(blockOf(v)) : c.p1 ? nb(c.p1) : 'Intet valgt'}${al.length ? `. <b>Indeholder ${esc(al.map(lower1).join(' og '))}</b>` : ''}</span></span>${icon.fwd}</a></li>`; }).join('')}</ul></section>`;
  }

  // ---------- how-to: techniques with a little film, a free video where one exists, and your own ----------
  const TK = window.TEKNIKKER || {};
  const VID = window.VIDEOER || {};
  const dishesUsing = (id) => Object.keys(OP).filter((d) => { const x = TK[id]; return x.match ? OP[d].trin.some((t) => x.match.test(t)) : (S.retter[d] || []).some((v) => x.alle.test(v)); });
  function teknikker() {
    return `${back('#/retter', 'Retter')}<div class="screen-head"><h1 tabindex="-1">Sådan gør du</h1><p class="lead">Små film til de ting, opskrifterne går ud fra, at man kan. Tryk i et opskriftstrin for at komme hertil.</p></div>
      <ul class="tk">${Object.entries(TK).map(([id, x]) => { const n = dishesUsing(id).length; const own = (db.ownVideo || []).includes(id); return `<li><a class="tk__item" href="#/teknik/${id}"><span class="tk__play">${icon.play}</span><span class="row__txt"><span class="row__name">${esc(x.navn)}</span><span class="row__want">${esc(x.kort)}</span><span class="meta">${pl(x.trin.length, 'trin', 'trin')}${x.video ? ', video' : ''}${own ? ', jeres egen video' : ''}${n ? `, bruges i ${pl(n, 'ret', 'retter')}` : ''}</span></span></a></li>`; }).join('')}</ul>`;
  }
  function teknik(id, q) {
    const x = TK[id];
    if (!x) return `${back('#/teknikker', 'Sådan gør du')}<div class="empty"><h2>Den findes ikke</h2><a class="btn btn--primary" href="#/teknikker">Se alle</a></div>`;
    const from = q.get('fra');
    const ds = dishesUsing(id);
    const frames = x.trin.map((f, i) => { const im = f.vare ? itemImg(f.vare) : null; return `<li class="film__frame" data-i="${i}" ${i ? 'hidden' : ''}>${im ? `<img src="${esc(im.src)}" alt="" width="400" height="400">` : `<span class="film__n" aria-hidden="true">${i + 1}</span>`}<p><b>${i + 1}.</b> ${esc(f.t)}</p></li>`; }).join('');
    const vids = (x.video || []).map((k) => VID[k]).filter(Boolean);
    return `${back(from ? '#/ret/' + slug(from) : '#/teknikker', from || 'Sådan gør du')}<div class="screen-head"><h1 tabindex="-1">${esc(x.navn)}</h1><p class="lead">${esc(x.kort)}</p></div>
      <div id="ownvid" class="ownvid" hidden></div>
      <section class="film" data-film aria-roledescription="film" aria-label="Trin for trin">
        <ol class="film__frames">${frames}</ol>
        <div class="film__bar" aria-hidden="true">${x.trin.map((_, i) => `<span data-seg="${i}"><i></i></span>`).join('')}</div>
        <div class="film__ctl"><button type="button" class="iconbtn" data-film-step="-1" aria-label="Forrige trin">${icon.back}</button><button type="button" class="btn btn--primary" data-film-play aria-pressed="false">${icon.play}<span>Afspil</span></button><button type="button" class="iconbtn" data-film-step="1" aria-label="Næste trin">${icon.fwd}</button></div>
        <p class="visually-hidden" aria-live="polite" id="film-live"></p>
      </section>
      ${x.tip ? `<p class="husk"><b>Tip:</b> ${esc(x.tip)}</p>` : ''}
      ${vids.map((v) => `<figure class="section vid"><video controls preload="metadata" playsinline width="640" height="360" ${v.poster ? `poster="${esc(v.poster)}"` : ''}>${v.filer.mp4 ? `<source src="${esc(v.filer.mp4)}" type="video/mp4">` : ''}${v.filer.webm ? `<source src="${esc(v.filer.webm)}" type="video/webm">` : ''}</video><figcaption class="meta">${esc(v.om)}${v.sprog ? ` På ${esc(v.sprog)}.` : ''}${v.sek ? ` ${v.sek} sek.` : ''}</figcaption><p class="credit">Video: "${esc(v.titel)}" af ${esc(v.af)}, ${esc(v.licens)}, via <a class="link" href="${esc(v.side)}" rel="noopener" target="_blank">Wikimedia Commons</a>.</p></figure>`).join('')}
      <section class="section" aria-labelledby="ov"><h2 id="ov">Jeres egen video</h2>
        <p class="meta">Optag det selv én gang, fx når den, der kan, laver det. Så ligger den her næste gang. Videoen bliver på telefonen.</p>
        <p class="actions"><label class="btn btn--quiet">${icon.camera}<span>${(db.ownVideo || []).includes(id) ? 'Optag en ny' : 'Optag eller vælg video'}</span><input type="file" accept="video/*" capture="environment" class="visually-hidden" data-ownvid="${esc(id)}"></label>${(db.ownVideo || []).includes(id) ? `<button type="button" class="btn btn--quiet" data-ownvid-del="${esc(id)}">Slet jeres video</button>` : ''}</p>
        <p class="help" id="ownvid-help" aria-live="polite"></p></section>
      ${ds.length ? `<section class="section" aria-labelledby="ud"><h2 id="ud">Bruges i</h2><ul class="links">${ds.map((d) => `<li><a class="link link--block" href="#/ret/${slug(d)}">${esc(d)}</a></li>`).join('')}</ul></section>` : ''}`;
  }
  // own videos live in IndexedDB (too big for localStorage)
  const idb = () => new Promise((ok, bad) => { const r = indexedDB.open('drv-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('video'); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
  const vidGet = (id) => idb().then((d) => new Promise((ok) => { const r = d.transaction('video').objectStore('video').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }));
  const vidPut = (id, blob) => idb().then((d) => new Promise((ok, bad) => { const t = d.transaction('video', 'readwrite'); t.objectStore('video').put(blob, id); t.oncomplete = ok; t.onerror = () => bad(t.error); }));
  const vidDel = (id) => idb().then((d) => new Promise((ok) => { const t = d.transaction('video', 'readwrite'); t.objectStore('video').delete(id); t.oncomplete = ok; t.onerror = ok; }));
  let ownUrl = null;
  function showOwn(id) {
    const box = document.getElementById('ownvid'); if (!box) return;
    vidGet(id).then((b) => { if (!b || !document.getElementById('ownvid')) return; if (ownUrl) URL.revokeObjectURL(ownUrl); ownUrl = URL.createObjectURL(b); box.innerHTML = `<figure class="vid"><video controls playsinline src="${ownUrl}"></video><figcaption class="meta">Jeres egen video</figcaption></figure>`; box.hidden = false; }).catch(() => {});
  }
  // the little film: one frame at a time, auto-advancing while playing
  let filmTimer = null;
  function filmGo(i, play) {
    const film = main.querySelector('[data-film]'); if (!film) return;
    const fr = [...film.querySelectorAll('.film__frame')]; const n = fr.length;
    i = Math.max(0, Math.min(n - 1, i)); film.dataset.i = i;
    fr.forEach((f, k) => { f.hidden = k !== i; });
    film.querySelectorAll('[data-seg]').forEach((sg, k) => { sg.dataset.state = k < i ? 'done' : k === i ? (play ? 'run' : 'now') : ''; });
    document.getElementById('film-live').textContent = fr[i].querySelector('p').textContent;
    clearTimeout(filmTimer);
    const btn = film.querySelector('[data-film-play]'); btn.setAttribute('aria-pressed', play ? 'true' : 'false'); btn.innerHTML = play ? `${icon.pause}<span>Pause</span>` : `${icon.play}<span>${i === n - 1 && film.dataset.ended ? 'Se igen' : 'Afspil'}</span>`;
    if (play) { delete film.dataset.ended; filmTimer = setTimeout(() => { if (i < n - 1) filmGo(i + 1, true); else { film.dataset.ended = '1'; filmGo(i, false); } }, Math.max(3500, fr[i].textContent.length * 70)); }
  }

  function startCamera(target) {
    const vid = document.getElementById('camvid'); const msg = document.getElementById('cam-msg'); const help = document.getElementById('cam-help');
    if (!vid || !window.Scanner) return;
    Scanner.start(vid, (ean) => { buzz(); location.replace(`#/scan?ean=${ean}${target ? `&vare=${slug(target)}` : ''}`); }, (err) => {
      document.getElementById('viewfinder')?.classList.add('is-off');
      if (msg) msg.textContent = 'Intet kamera';
      if (help) help.textContent = err && err.name === 'NotAllowedError' ? 'Appen må ikke bruge kameraet. Giv lov i telefonens indstillinger, eller skriv stregkoden herunder.' : err && err.message === 'nocamera' ? 'Kameraet virker kun, når appen er åbnet over https. Skriv stregkoden herunder.' : 'Kameraet kunne ikke starte. Skriv stregkoden herunder.';
    });
    vid.addEventListener('playing', () => { if (msg) msg.textContent = 'Hold stregkoden her'; document.getElementById('viewfinder')?.classList.add('is-live'); }, { once: true });
  }

  function nyOpskrift(q) {
    const edit = q.get('ret');
    const own = edit && db.opskrifter && db.opskrifter[edit];
    const o = own || (edit && OP[edit] ? { varer: S.retter[edit] || [], maengder: OP[edit].maengder || {}, trin: OP[edit].trin || [], tid: OP[edit].tid, personer: OP[edit].personer || 4 } : null);
    const imp = importData; importData = null;
    const ingText = o ? o.varer.map((v) => `${o.maengder[v] ? o.maengder[v] + ' ' : ''}${lower1(v)}`).join('\n') : '';
    return `${back(edit ? '#/ret/' + slug(edit) : '#/retter', edit || 'Retter')}<div class="screen-head"><h1 tabindex="-1">${o ? 'Ret opskriften' : 'Ny opskrift'}</h1><p class="lead">Skriv eller indsæt jeres egen. Ingredienserne kobles til jeres varekort, så de kommer på listen.</p></div>
      ${o ? '' : `<details class="paste section" ${imp ? 'open' : ''}><summary>Indsæt en hel opskrift</summary><div class="field"><label for="rall">Kopiér opskriften fra en hjemmeside, en besked eller dine noter, og sæt den ind her</label><textarea class="input" id="rall" rows="7">${esc(imp ? [imp.title, imp.text].filter(Boolean).join('\n') : '')}</textarea></div><button class="btn btn--quiet" type="button" data-splitrecipe>Del den op i felterne</button><p class="help" id="rall-help" aria-live="polite">${imp && imp.url && !imp.text ? 'Der kom kun et link med. Åbn siden, kopiér opskriften, og sæt den ind her.' : ''}</p></details>`}
      <form class="form" id="recipeform" novalidate data-edit="${esc(edit || '')}">
        <div class="field"><label for="rn">Navn på retten</label><input class="input" id="rn" name="rn" maxlength="60" value="${esc(edit || (imp && imp.title) || '')}" autocomplete="off" aria-describedby="rn-help"><p class="help" id="rn-help"></p></div>
        ${imp && imp.url ? `<p class="meta">Kilde: <a class="link" href="${esc(imp.url)}" rel="noopener" target="_blank">${esc(imp.url.replace(/^https?:\/\//, '').slice(0, 50))}</a></p><input type="hidden" name="rsrc" value="${esc(imp.url)}">` : ''}
        <div class="field"><label for="re">Kapitel i opskriftsbogen</label><input class="input" id="re" name="re" list="emneliste" maxlength="30" value="${esc(o ? emneOf(edit) : (q.get('emne') || ''))}" placeholder="fx Klassikere" autocomplete="off"><datalist id="emneliste">${emner().map((e) => `<option value="${esc(e)}"></option>`).join('')}</datalist><p class="help">Vælg et kapitel, eller skriv et nyt.</p></div>
        <div class="field"><span class="label">Billede af retten</span><div id="rf-prev" class="rf-prev" ${edit && db.dishFoto && db.dishFoto[edit] ? '' : 'hidden'}>${edit && db.dishFoto && db.dishFoto[edit] ? `<img src="${esc(db.dishFoto[edit])}" alt="Det nuværende billede" width="500" height="375">` : ''}</div><label class="btn btn--quiet">${icon.camera}<span>Tag eller vælg billede</span><input type="file" accept="image/*" id="rf" class="visually-hidden"></label></div>
        <div class="split"><div class="field"><label for="rp">Til antal personer</label><input class="input" id="rp" name="rp" inputmode="numeric" maxlength="2" value="${esc((o && o.personer) || 4)}"></div><div class="field"><label for="rt">Tid</label><input class="input" id="rt" name="rt" maxlength="20" placeholder="fx 30 min" value="${esc((o && o.tid) || '')}"></div></div>
        <div class="field"><label for="ri">Ingredienser, én pr. linje</label><textarea class="input" id="ri" name="ri" rows="8" placeholder="500 g hakket oksekød&#10;1 løg&#10;2 dåser hakkede tomater&#10;250 g pasta" aria-describedby="ri-help">${esc(ingText)}</textarea><p class="help" id="ri-help">Mængden først, så varen. Varer, appen ikke kender, bliver oprettet som nye.</p></div>
        <div class="field"><label for="rs">Sådan gør I, ét trin pr. linje</label><textarea class="input" id="rs" name="rs" rows="6">${esc(o ? o.trin.join('\n') : '')}</textarea></div>
        <div class="actions"><button class="btn btn--primary btn--wide" type="submit">Gem opskriften</button>${own && !OPBASE[edit] ? `<button class="btn btn--quiet btn--wide" type="button" data-delrecipe="${esc(edit)}">Slet opskriften</button>` : ''}${own && OPBASE[edit] ? `<button class="btn btn--quiet btn--wide" type="button" data-resetrecipe="${esc(edit)}">Brug den oprindelige opskrift igen</button>` : ''}</div>
        <p class="help" id="recipe-help" aria-live="polite"></p>
      </form>`;
  }
  // ---------- recipe bank: many recipes in categories, taken into the household's own cookbook ----------
  // a photo of the dish (Wikimedia Commons), else the main ingredient, never a side ingredient
  const BB = window.BANK_BILLEDER || {};
  const bankImg = (r, n) => { if (db.dishFoto && db.dishFoto[n]) return db.dishFoto[n]; if (n && BB[n]) return BB[n].src; const im = itemImg(r.ing[0][1]); return im ? im.src : ''; };
  const SAESONER = BANK.saesoner || {};
  const nowSeason = () => { const m = new Date().getMonth() + 1; return Object.keys(SAESONER).find((k) => SAESONER[k].includes(m)) || 'efterår'; };
  const segNav = (on) => `<nav class="seg no-print" aria-label="Retter og kogebog"><a href="#/retter" ${on === 'uge' ? 'aria-current="page"' : ''}>Ugens retter</a><a href="#/kogebog" ${on === 'bog' ? 'aria-current="page"' : ''}>Kogebog</a></nav>`;
  const rcard = (n, r) => { if (!kostOk(n)) return ''; const mine = !!S.retter[n]; const im = r ? bankImg(r, n) : dishImg(n); const href = mine ? `#/ret/${slug(n)}` : `#/bank/${slug(n)}`;
    return `<li class="rcard" data-q="${esc(norm(n + ' ' + (r ? r.ing.map((x) => x[1]).join(' ') : (S.retter[n] || []).join(' '))))}"><a href="${href}">${im ? `<img class="rcard__img" src="${esc(im)}" alt="" width="600" height="450" loading="lazy">` : `<span class="rcard__img rcard__img--none" aria-hidden="true">${icon.pot}</span>`}<span class="rcard__name">${esc(n)}</span><span class="rcard__meta">${r ? esc(r.tid) : pl((S.retter[n] || []).length, 'vare', 'varer')}${nutOn() && dishNut(n) ? ` · ca. ${dishNut(n).kcal} kcal` : ''}${mine ? ' · <span class="badge">Gemt</span>' : ''}</span></a></li>`; };
  function kogebog(q) {
    const sz = q.get('saeson'); const now = nowSeason();
    const bank = Object.entries(BANK.opskrifter);
    const shelf = (title, items, more) => (items = items.filter(Boolean)).length ? `<section class="shelf" aria-labelledby="sh-${esc(slug(title))}"><div class="shelf__head"><h2 id="sh-${esc(slug(title))}">${title}</h2>${more ? `<a class="link" href="${more}">Se alle</a>` : ''}</div><ul class="shelf__row">${items.join('')}</ul></section>` : '';
    const search = `<div class="field minesearch"><label class="visually-hidden" for="bogsq">Søg efter ret eller ingrediens</label><span class="composer__field">${icon.search}<input id="bogsq" type="search" placeholder="Søg på ret eller ingrediens, fx laks" autocomplete="off" data-bogsearch></span></div>`;
    const seasonChips = `<nav class="chips chips--scroll booknav" aria-label="Årstider">${Object.keys(SAESONER).map((k) => `<a class="chip" data-replace href="#/kogebog?saeson=${slug(k)}" ${sz === k ? 'aria-current="true"' : ''}>${k.charAt(0).toUpperCase() + k.slice(1)}${k === now ? ' <small>nu</small>' : ''}</a>`).join('')}</nav>`;
    const head = `${segNav('bog')}<div class="screen-head"><h1 tabindex="-1">Kogebog</h1><p class="lead">Gå på opdagelse. Gem det, I kan lide, og ret det til på jeres måde.</p><p><a class="howto" href="#/vaelg-ret">${icon.dice}Vælg en ret for mig</a></p></div>${search}${seasonChips}${kostNote()}`;
    const results = `<ul class="rgrid" id="bogresults" hidden>${[...Object.keys(S.retter).filter((d) => !BANK.opskrifter[d]).map((d) => rcard(d, null)), ...bank.map(([n, r]) => rcard(n, r))].join('')}</ul><p class="meta" id="bog-none" hidden>Ingen retter passer. Prøv en ingrediens, fx kylling.</p>`;
    if (sz && SAESONER[sz]) {
      const list = bank.filter(([, r]) => (r.saeson || []).includes(sz));
      return head + results + `<div id="bogshelves"><h2 class="shelf__title">${sz.charAt(0).toUpperCase() + sz.slice(1)}</h2><ul class="rgrid">${list.map(([n, r]) => rcard(n, r)).join('')}</ul><p class="section"><a class="link" data-replace href="#/kogebog">Tilbage til hele kogebogen</a></p></div>`;
    }
    const own = Object.keys(S.retter);
    const credits = bank.filter(([n]) => BB[n]).map(([n]) => `<li>${esc(n)}: ${esc(BB[n].credit)}</li>`).join('');
    return head + results + `<div id="bogshelves">
      ${shelf(`Lige nu: ${now}`, bank.filter(([, r]) => (r.saeson || []).includes(now)).map(([n, r]) => rcard(n, r)), `#/kogebog?saeson=${slug(now)}`)}
      ${shelf('Færdigretter', FAERDIG.map((d) => rcard(d, null)), '#/retter?emne=F%C3%A6rdigretter')}
      ${shelf('Gemte retter', own.filter((d) => !FAERDIG.includes(d)).map((d) => rcard(d, BANK.opskrifter[d] || null)), '#/retter')}
      ${BANK.kategorier.map((k) => shelf(esc(k), bank.filter(([, r]) => r.kategori === k).map(([n, r]) => rcard(n, r)), `#/find-opskrifter?kat=${slug(k)}`)).join('')}
      <p class="section"><a class="btn btn--quiet" href="#/ny-opskrift">${icon.plus}<span>Skriv jeres egen opskrift</span></a></p>
      ${credits ? `<details class="credits"><summary>Fotokreditering</summary><ul>${credits}</ul></details>` : ''}</div>`;
  }
  function takeRecipe(navn) {
    const r = BANK.opskrifter[navn]; if (!r) return;
    db.egne ||= {}; r.ing.forEach(([, v]) => { if (!S.varer.some((x) => x.navn === v) && !db.egne[v]) db.egne[v] = BANK.nyeVarer[v] || 'Andet'; });
    (db.opskrifter ||= {})[navn] = { fra: 'opskriftsbank', emne: r.kategori, personer: 4, tid: r.tid, varer: r.ing.map(([, v]) => v), maengder: Object.fromEntries(r.ing.map(([a, v]) => [v, a])), trin: r.trin.slice() };
    mergeOwn();
  }
  function findOpskrifter(q) {
    const kat = BANK.kategorier.includes(q.get('kat')) ? q.get('kat') : BANK.kategorier[0];
    const list = Object.entries(BANK.opskrifter).filter(([n, r]) => r.kategori === kat && kostOk(n));
    return `${back('#/retter', 'Retter')}<div class="screen-head"><h1 tabindex="-1">Find opskrifter</h1><p class="lead">Almindelige opskrifter i kategorier. Gem dem, så kan I rette dem til jeres egen måde.</p></div>
      <nav class="chips chips--scroll booknav" aria-label="Kategorier">${BANK.kategorier.map((k) => `<a class="chip" data-replace href="#/find-opskrifter?kat=${slug(k)}" ${k === kat ? 'aria-current="true"' : ''}>${esc(k)}</a>`).join('')}</nav>
      <ul class="bank">${list.map(([n, r]) => { const im = bankImg(r); const has = !!(db.opskrifter && db.opskrifter[n]); return `<li class="bank__card"><a class="bank__open" href="#/bank/${slug(n)}">${im ? `<img class="bank__img" src="${esc(im)}" alt="" width="400" height="400" loading="lazy">` : `<span class="bank__img bank__img--none" aria-hidden="true">${icon.pot}</span>`}<span class="row__txt"><span class="row__name">${esc(n)}</span><span class="row__want">${esc(r.tid)}, ${pl(r.ing.length, 'ingrediens', 'ingredienser')}</span></span></a>${has ? `<span class="badge bank__has">Gemt</span>` : `<button class="btn btn--quiet btn--s" type="button" data-take="${esc(n)}" aria-label="Gem ${esc(n)}">${icon.plus}<span>Gem</span></button>`}</li>`; }).join('')}</ul>`;
  }
  function bankRet(n) {
    const r = BANK.opskrifter[n];
    if (!r) return `${back('#/find-opskrifter', 'Find opskrifter')}<div class="empty"><h2>Opskriften findes ikke</h2></div>`;
    const has = !!(db.opskrifter && db.opskrifter[n]);
    return `${back('#/kogebog', 'Kogebog')}${BB[n] ? `<figure class="dish__hero"><img src="${esc(BB[n].src)}" alt="${esc(n)}" width="600" height="450"></figure>` : ''}<div class="screen-head"><h1 tabindex="-1">${esc(n)}</h1><p class="meta">${esc(r.kategori)}, ${esc(r.tid)}, til 4 personer${(r.saeson || []).length ? `, ${esc(r.saeson.join(' og '))}` : ''}</p></div>
      <section class="section" aria-labelledby="bi"><h2 id="bi">Det skal I bruge</h2><ul class="pvarer minelist">${r.ing.map(([a, v]) => { const im = itemImg(v); return `<li class="lrow">${im ? `<img class="row__img" src="${esc(im.src)}" alt="" width="400" height="400" loading="lazy">` : '<span class="row__img row__img--blank" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(v)}</span><span class="row__want">${esc(a)}</span></span></li>`; }).join('')}</ul><p class="meta">Fra skabet: salt, peber og olie.</p>${nutOn() ? `<h3 class="nutri__h">Næring</h3>${nutBlock(dishNut(n))}` : ''}</section>${BB[n] ? `<p class="credit section">Foto: ${esc(BB[n].credit)}</p>` : ''}
      <section class="section" aria-labelledby="bs"><h2 id="bs">Sådan gør I</h2><ol class="steps">${r.trin.map((t) => { const hit = Object.entries(TK).filter(([, x]) => x.match && x.match.test(t)).slice(0, 3); return `<li><span>${esc(t)}</span>${hit.length ? `<span class="howtos">${hit.map(([id, x]) => `<a class="howto" href="#/teknik/${id}">${icon.play}${esc(x.navn)}</a>`).join('')}</span>` : ''}</li>`; }).join('')}</ol></section>
      <div class="dock no-print"><div class="dock__in">${W().dishes.includes(n) ? `<a class="btn btn--primary" href="#/indkob">${icon.check}<span>På listen i ${weekLabel()}</span></a><a class="btn btn--quiet" href="#/ret/${slug(n)}">Åbn opskriften</a>` : has ? `<button class="btn btn--primary" type="button" data-take="${esc(n)}" data-then="uge">Læg på listen i ${weekLabel()}</button><a class="btn btn--quiet" href="#/ret/${slug(n)}">Åbn opskriften</a>` : `<button class="btn btn--primary" type="button" data-take="${esc(n)}" data-then="uge">Læg på listen i ${weekLabel()}</button><button class="btn btn--quiet" type="button" data-take="${esc(n)}">Gem til senere</button>`}</div></div>`;
  }

  // fixed lists: the things the household always buys, often in one store
  const listCount = (x) => new Set([...x.dishes.flatMap((d) => S.retter[d] || []), ...Object.keys(x.extra || {})]).size;
  function lister() {
    const L = db.lister || {}; const names = Object.keys(L);
    const items = listItems();
    return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Faste lister</h1><p class="lead">De ting, I altid køber, fx "Basis i Netto". Lav listen én gang, og hent den ind i en hvilken som helst uge.</p></div>
      ${names.length ? `<ul class="savedlists">${names.map((n) => { const x = L[n]; return `<li><a class="savedlists__txt" href="#/liste/${slug(n)}"><b>${esc(n)}</b><span class="meta">${pl(listCount(x), 'vare', 'varer')}${x.butik ? `, ${esc(x.butik)}` : ''}</span></a><button class="btn btn--quiet btn--s" type="button" data-loadlist="${esc(n)}">Brug i ${weekLabel()}</button></li>`; }).join('')}</ul>` : '<p class="meta">Ingen faste lister endnu.</p>'}
      <form class="form section" id="newlistform" novalidate><h2>Ny fast liste</h2>
        <div class="split"><div class="field"><label for="nln">Navn</label><input class="input" id="nln" name="nln" maxlength="40" autocomplete="off" placeholder="fx Basis"></div>
        <div class="field"><label for="nlb">Butik</label><select class="input" id="nlb" name="nlb">${['', ...CHAINS].map((c) => `<option value="${esc(c)}" ${db.shop === c ? 'selected' : ''}>${c || 'Ingen bestemt'}</option>`).join('')}</select></div></div>
        <div class="choice choice--inline"><input type="checkbox" id="nlw" name="nlw" ${items.length ? '' : 'disabled'}><label for="nlw">Start med listen for ${weekLabel()}<small>${items.length ? pl(items.length, 'vare', 'varer') : 'Listen er tom'}</small></label></div>
        <div><button class="btn btn--primary btn--wide" type="submit">Opret listen</button><p class="help" id="nl-help" aria-live="polite"></p></div></form>`;
  }
  function liste(n) {
    const x = db.lister && db.lister[n];
    if (!x) return `${back('#/lister', 'Faste lister')}<div class="empty"><h2>Listen findes ikke</h2><a class="btn btn--primary" href="#/lister">Til listerne</a></div>`;
    const extra = Object.keys(x.extra || {});
    return `${back('#/lister', 'Faste lister')}<div class="screen-head"><h1 tabindex="-1">${esc(n)}</h1><p class="meta">${pl(listCount(x), 'vare', 'varer')}</p></div>
      <div class="field"><label for="lsb">Butik</label><select class="input" id="lsb" data-listshop="${esc(n)}">${['', ...CHAINS].map((c) => `<option value="${esc(c)}" ${x.butik === c ? 'selected' : ''}>${c || 'Ingen bestemt'}</option>`).join('')}</select><p class="help">Når I henter listen, skifter appen til den butik.</p></div>
      <form class="form section" id="listaddform" data-liste="${esc(n)}" novalidate autocomplete="off"><label for="lsa">Tilføj vare</label><div class="inline"><input class="input" id="lsa" name="lsa" list="alle-varer" placeholder="fx kaffe"><button class="btn btn--quiet" type="submit">Tilføj</button></div><datalist id="alle-varer">${allItems().map((v) => `<option value="${esc(v)}"></option>`).join('')}</datalist><p class="help" id="lsa-help" aria-live="polite"></p></form>
      ${extra.length ? `<ul class="pvarer minelist section">${extra.map((v) => { const im = itemImg(v); const q2 = (x.qty && x.qty[v]) || 1; return `<li class="lrow">${im ? `<img class="row__img" src="${esc(im.src)}" alt="" width="400" height="400" loading="lazy">` : '<span class="row__img row__img--blank" aria-hidden="true"></span>'}<span class="row__txt"><span class="row__name">${esc(v)}</span><span class="row__want">${card(v) && card(v).p1 ? nb(card(v).p1) : ''}</span></span><span class="stepper" role="group" aria-label="Antal ${esc(v)}"><button class="iconbtn" type="button" data-lq="${esc(v)}" data-liste="${esc(n)}" data-d="-1" aria-label="${q2 === 1 ? `Fjern ${esc(v)}` : `Færre ${esc(v)}`}">${q2 === 1 ? icon.cross : icon.minus}</button><output class="stepper__n">${q2}</output><button class="iconbtn" type="button" data-lq="${esc(v)}" data-liste="${esc(n)}" data-d="1" aria-label="Flere ${esc(v)}">${icon.plus}</button></span></li>`; }).join('')}</ul>` : '<p class="meta section">Ingen enkelte varer endnu.</p>'}
      ${x.dishes.length ? `<section class="section" aria-labelledby="lr"><h2 id="lr">Retter på listen</h2><ul class="chips chips--wrap">${x.dishes.map((d) => `<li><button class="chip" type="button" data-lrmdish="${esc(d)}" data-liste="${esc(n)}" aria-label="Fjern ${esc(d)} fra listen">${esc(d)} ${icon.cross}</button></li>`).join('')}</ul></section>` : ''}
      <div class="actions section"><button class="btn btn--primary btn--wide" type="button" data-loadlist="${esc(n)}">Brug i ${weekLabel()}</button><button class="btn btn--quiet btn--wide" type="button" data-dellist="${esc(n)}">Slet listen</button></div>`;
  }

  // the week's list at a glance: what, how many, which product, where and what it costs
  function storeOf(v) {
    const c = card(v); const p = c && prodOf(c, 1);
    if (db.shop && p && seenIn(p, db.shop) === 'ja') return db.shop;
    if (c && c.store) return c.store;
    if (db.shop) return db.shop;
    const st = p && Object.keys(p.butikker || {}); if (st && st.length) return st[0];
    return 'Hvor som helst';
  }
  function overblik() {
    const items = listItems(); const order = S.varer.map((x) => x.navn);
    if (!items.length) return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><h1 tabindex="-1">Overblik</h1>${weekNav()}</div><div class="empty"><h2>Listen er tom</h2><a class="btn btn--primary" href="#/indkob">Til Indkøb</a></div>`;
    const by = {}; items.forEach((v) => (by[storeOf(v)] ||= []).push(v));
    const shops = Object.keys(by).sort((a, b) => (a === 'Hvor som helst') - (b === 'Hvor som helst') || by[b].length - by[a].length);
    const all = priceSum(items);
    return `${back('#/indkob', 'Indkøb')}<div class="screen-head"><div class="titlerow"><h1 tabindex="-1">Overblik</h1><a class="iconbtn iconbtn--plain no-print" href="#/del" aria-label="Del listen">${icon.share}</a></div>${weekNav()}</div>
      <section class="summary"><p class="progress"><b>${items.length}</b><span class="meta">${items.length === 1 ? 'vare' : 'varer'} i ${pl(shops.length, 'butik', 'butikker')}</span></p>${all.n ? `<p class="total"><span class="num">${sumLine(all)}</span></p>` : ''}</section>
      ${shops.map((sh) => { const vs = by[sh].sort((a, b) => order.indexOf(a) - order.indexOf(b)); const ps = priceSum(vs); return `<section class="group"><h2>${esc(sh)}${ps.n ? `<span class="group__sum num">ca. ${kr(Math.round(ps.sum))}</span>` : ''}</h2><table class="ov"><caption class="visually-hidden">Varer i ${esc(sh)}</caption><tbody>${vs.map((v) => { const c = card(v); const p = priceOf(v); const t = W().ticks[v]; return `<tr${t >= 1 && t <= 3 ? ' class="is-done"' : ''}><td class="ov__q num">${qtyOf(v)} ×</td><td><a class="ov__name" href="#/kort/${slug(v)}">${esc(v)}</a><span class="ov__p">${c && c.p1 ? nb(c.p1) : 'Intet varekort'}${t >= 1 && t <= 3 ? `, fundet (prio ${t})` : t === 4 ? ', ikke fundet' : ''}</span>${extraOf(v) ? `<span class="ov__p">${esc(extraOf(v))}</span>` : ''}</td><td class="ov__pr num">${p ? `${p.kind === 'ca' ? 'ca. ' : ''}${kr(p.n * qtyOf(v))}` : '–'}</td></tr>`; }).join('')}</tbody></table></section>`; }).join('')}
      <p class="meta section">Butikken er den, hvor jeres prio 1 er set, eller den, der står på varekortet. Priser: ${esc(PZ.kilde || 'Open Prices')}, og jeres egne.</p>`;
  }

  // swipe a row on Indkøb to see prio 2 and 3 (arrow keys do the same)
  let sw = null, swiped = false; const preloaded = new Set();
  const swipeTo = (el, dir) => { const v = el.dataset.swipe; const ps = (el.dataset.prios || '').split(',').filter(Boolean).map(Number); if (ps.length < 2) return false; const cur = viewP[v] || ps[0]; const i = ps.indexOf(cur); const nx = ps[Math.max(0, Math.min(ps.length - 1, i + dir))]; if (nx === cur) { el.animate?.([{ transform: `translateX(${dir * -8}px)` }, { transform: 'none' }], { duration: 160 }); return false; } viewP[v] = nx; buzz(); rerender(); const n = main.querySelector(`[data-swipe="${CSS.escape(v)}"]`); n?.focus({ preventScroll: true }); n?.classList.add(dir > 0 ? 'from-right' : 'from-left'); alertLine(`${v}: prio ${nx}.`); return true; };
  main.addEventListener('dragstart', (e) => { if (e.target.closest && e.target.closest('[data-swipe]')) e.preventDefault(); });
  main.addEventListener('pointerdown', (e) => { const el = e.target.closest('[data-swipe]'); if (!el || e.button > 0) return; sw = { el, x: e.clientX, y: e.clientY, on: false }; });
  main.addEventListener('pointermove', (e) => { if (!sw) return; const dx = e.clientX - sw.x; const dy = e.clientY - sw.y; if (!sw.on && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) sw.on = true; if (sw.on) sw.el.style.transform = `translateX(${Math.max(-80, Math.min(80, dx * 0.6))}px)`; });
  const swEnd = (e) => { if (!sw) return; const { el, x, on } = sw; sw = null; el.style.transform = ''; if (!on) return; swiped = true; setTimeout(() => { swiped = false; }, 350); const dx = e.clientX - x; if (Math.abs(dx) > 45) swipeTo(el, dx < 0 ? 1 : -1); };
  main.addEventListener('pointerup', swEnd); main.addEventListener('pointercancel', (e) => { if (sw) { sw.el.style.transform = ''; sw = null; } });
  main.addEventListener('click', (e) => { if (swiped && e.target.closest('[data-swipe]')) { e.preventDefault(); e.stopPropagation(); } }, true);
  main.addEventListener('keydown', (e) => { const el = e.target.closest && e.target.closest('[data-swipe]'); if (el && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); swipeTo(el, e.key === 'ArrowRight' ? 1 : -1); } });

  // ---------- help: search "how do I…", and a short intro the first time ----------
  const HELP = window.HJAELP || [];
  function hjaelp(q) {
    const t = q.get('q') || '';
    return `<div class="screen-head"><h1 tabindex="-1">Hjælp</h1><p class="lead">Søg på det, du vil gøre, fx "antal", "scan" eller "allergi".</p></div>
      <p><button class="btn btn--quiet btn--s" type="button" data-intro>${icon.play}<span>Se introduktionen igen</span></button> <button class="btn btn--quiet btn--s" type="button" data-nyt>${icon.play}<span>Nyt i appen</span></button></p>
      <div class="field minesearch"><label class="visually-hidden" for="helpq">Søg i hjælpen</label><span class="composer__field">${icon.search}<input id="helpq" type="search" placeholder="Hvad vil du gøre?" value="${esc(t)}" autocomplete="off" data-helpsearch></span></div>
      <ul class="help-list">${HELP.map((h, i) => `<li data-q="${esc(norm(h.q + ' ' + h.a + ' ' + h.ord))}"><details${t && i === 0 ? ' open' : ''}><summary>${esc(h.q)}</summary><p>${esc(h.a)}</p><p><a class="btn btn--quiet btn--s" href="${h.link}">${esc(h.knap)}</a></p></details></li>`).join('')}</ul>
      <p class="meta" id="help-none" hidden>Intet svar på det. Prøv et andet ord, eller se introduktionen igen øverst.</p>`;
  }
  const INTRO = [
    { h: 'Velkommen til Varevennen', p: 'Appen sørger for, at den, der handler, kommer hjem med præcis den vare, I plejer at købe. Ikke bare "mælk", men jeres mælk.' },
    { h: 'Hver vare har et varekort', p: 'Prio 1 er den rigtige. Prio 2 er godkendt. Prio 3 er en nødløsning. Ret dem under Mine varer.', marks: true },
    { h: 'I butikken', p: 'Tryk på mærket, når varen er i kurven. Swipe en vare til siden for at se prio 2 og 3. Tryk på tallet til højre for at ændre antal. Scan en vare for at tjekke, at den er rigtig.' },
    { h: 'Retter og kogebog', p: 'Vælg ugens retter under Retter, så bygger listen sig selv. I Kogebogen finder I flere opskrifter. Er du i tvivl, så tryk på spørgsmålstegnet øverst.' }
  ];
  function showIntro() {
    let i = 0; const dlg = document.createElement('dialog'); dlg.className = 'intro'; dlg.setAttribute('aria-labelledby', 'intro-h');
    const draw = () => { const s = INTRO[i]; dlg.innerHTML = `<div class="intro__in"><p class="intro__step meta">${i + 1} af ${INTRO.length}</p><h2 id="intro-h">${esc(s.h)}</h2>${s.marks ? `<div class="intro__marks">${[1, 2, 3].map((n) => `<span>${mark(n)}<small>${['Den rigtige', 'Godkendt', 'Nødløsning'][n - 1]}</small></span>`).join('')}</div>` : ''}<p>${esc(s.p)}</p><div class="intro__dots" aria-hidden="true">${INTRO.map((_, k) => `<i${k === i ? ' data-on' : ''}></i>`).join('')}</div><div class="intro__act">${i > 0 ? `<button class="btn btn--quiet" type="button" data-intro-back>Tilbage</button>` : `<button class="btn btn--quiet" type="button" data-intro-skip>Spring over</button>`}${i < INTRO.length - 1 ? `<button class="btn btn--primary" type="button" data-intro-next>Næste</button>` : `<button class="btn btn--primary" type="button" data-intro-skip>Kom i gang</button>`}</div><p class="intro__hint meta">Swipe for at bladre.</p></div>`; dlg.querySelector('[data-intro-next], [data-intro-skip]:last-child')?.focus(); };
    const go = (d) => { const n = i + d; if (n < 0 || n >= INTRO.length) return; i = n; draw(); const inn = dlg.querySelector('.intro__in'); inn.classList.add(d > 0 ? 'from-right' : 'from-left'); (dlg.querySelector('[data-intro-next]') || dlg.querySelector('[data-intro-skip]'))?.focus(); };
    dlg.addEventListener('click', (e) => { if (e.target.closest('[data-intro-next]')) go(1); else if (e.target.closest('[data-intro-back]')) go(-1); else if (e.target.closest('[data-intro-skip]')) dlg.close(); });
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    let sx = null, sy = 0;
    dlg.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    dlg.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1); });
    dlg.addEventListener('pointercancel', () => { sx = null; });
    dlg.addEventListener('close', () => { db.introSet = true; if (NYT[0] && !db.nytSet) db.nytSet = NYT[0].id; save(); dlg.remove(); });
    document.body.append(dlg); draw(); dlg.showModal(); dlg.querySelector('[data-intro-next]')?.focus();
  }
  // ---------- nyt i appen (vises én gang efter en opdatering) ----------
  const NYT = window.NYT || [];
  function showNyt(all) {
    const list = all ? NYT.slice(0, 3) : NYT.filter((n) => n.id > (db.nytSet || '')).slice(0, 3);
    if (!list.length) return;
    const dlg = document.createElement('dialog'); dlg.className = 'intro nyt'; dlg.setAttribute('aria-labelledby', 'nyt-h');
    dlg.innerHTML = `<div class="intro__in"><p class="intro__step meta">Nyt i appen</p><h2 id="nyt-h">${esc(list[0].titel)}</h2>${list.map((n, k) => `${k ? `<h3 class="nyt__old">${esc(n.titel)} <span class="meta">${esc(n.dato)}</span></h3>` : ''}<ul class="nyt__list">${n.punkter.map((x) => `<li><strong>${esc(x.h)}</strong><span>${esc(x.p)}</span>${x.href ? `<a href="${x.href}" data-nyt-go>Se det</a>` : ''}</li>`).join('')}</ul>`).join('')}<div class="intro__act"><button class="btn btn--primary" type="button" data-nyt-ok>Forstået</button></div></div>`;
    dlg.addEventListener('click', (e) => { if (e.target.closest('[data-nyt-ok],[data-nyt-go]')) dlg.close(); });
    dlg.addEventListener('close', () => { if (NYT[0]) db.nytSet = NYT[0].id; save(); dlg.remove(); });
    document.body.append(dlg); dlg.showModal(); dlg.querySelector('[data-nyt-ok]')?.focus({ preventScroll: true });
  }
  main.addEventListener('input', (e) => { if (!e.target.matches('[data-helpsearch]')) return; const t = norm(e.target.value); let n = 0; main.querySelectorAll('.help-list > li').forEach((li) => { const hit = !t || t.split(' ').every((w) => li.dataset.q.includes(w) || li.dataset.q.includes(stem(w))); li.hidden = !hit; n += hit; }); document.getElementById('help-none').hidden = !!n; const first = main.querySelector('.help-list > li:not([hidden]) details'); if (t && n <= 2 && first) first.open = true; });

  // ---------- router ----------
  function render() {
    const raw = location.hash.replace(/^#\/?/, '') || 'indkob';
    const [path, qs] = raw.split('?');
    const q = new URLSearchParams(qs || '');
    const parts = path.split('/').map(decodeURIComponent);
    setStatus('');
    let html, tab = 'indkob', title = 'Indkøb';
    document.body.classList.remove('has-dock');
    if (parts[0] === 'vaelg-ret' && prevRoute !== 'vaelg-ret') { chooser.items = []; chooser.empty = false; chooser.seen = new Set(); chooser.added = {}; if (q.get('mode') === 'uge' || q.get('mode') === 'en') chooser.mode = q.get('mode'); }
    prevRoute = parts[0];
    switch (parts[0]) {
      case 'ret': html = ret(parts[1]); tab = 'retter'; title = parts[1]; document.body.classList.add('has-dock'); break;
      case 'retter': html = retter(q); tab = 'retter'; title = 'Retter'; document.body.classList.add('has-dock'); break;
      case 'katalog': html = katalog(q); tab = 'katalog'; title = 'Katalog'; break;
      case 'mine': html = mine(q); tab = 'mine'; title = q.get('v') || 'Mine varer'; if (q.get('kat')) { db.mineKat = q.get('kat'); save(); } break;
      case 'profil': html = profil(); tab = 'profil'; title = 'Profil'; break;
      case 'hjaelp': html = hjaelp(q); tab = 'hjaelp'; title = 'Hjælp'; break;
      case 'frisk': html = frisk(q); tab = 'hjaelp'; title = 'Er den frisk?'; break;
      case 'ny-opskrift': html = nyOpskrift(q); tab = 'retter'; title = 'Ny opskrift'; break;
      case 'lister': html = lister(); tab = 'indkob'; title = 'Faste lister'; break;
      case 'find-opskrifter': html = findOpskrifter(q); tab = 'retter'; title = 'Find opskrifter'; break;
      case 'kogebog': html = kogebog(q); tab = 'retter'; title = 'Kogebog'; break;
      case 'vaelg-ret': html = vaelgRet(); tab = 'retter'; title = 'Vælg en ret for mig'; break;
      case 'bank': html = bankRet(parts[1]); tab = 'retter'; title = parts[1]; document.body.classList.add('has-dock'); break;
      case 'liste': html = liste(parts[1]); tab = 'indkob'; title = parts[1]; break;
      case 'overblik': html = overblik(); tab = 'indkob'; title = 'Overblik'; break;
      case 'teknikker': html = teknikker(); tab = 'retter'; title = 'Sådan gør du'; break;
      case 'teknik': html = teknik(parts[1], q); tab = 'retter'; title = TK[parts[1]] ? TK[parts[1]].navn : 'Sådan gør du'; break;
      case 'kort': html = parts[2] === 'rediger' ? rediger(parts[1]) : kort(parts[1]); tab = 'indkob'; title = parts[1]; if (parts[2] !== 'rediger' && filled(parts[1])) document.body.classList.add('has-dock'); break;
      case 'vaelg': html = vaelg(parts[1], q); tab = 'indkob'; title = 'Vælg produkt'; break;
      case 'scan': html = scan(q); title = 'Scan'; break;
      case 'spoerg': html = spoerg(parts[1]); title = 'Spørg hjemme'; break;
      case 'svar': html = svar(parts[1]); title = 'Svar'; break;
      case 'priser': html = priser(parts[1]); tab = 'indkob'; title = 'Priser'; break;
      case 'pdf': case 'del': html = del(q); title = 'Del listen'; break;
      default: html = indkob(q); document.body.classList.add('has-dock');
    }
    clearTimeout(filmTimer);
    if (window.Scanner) Scanner.stop();
    if (parts[0] !== 'indkob' && parts[0] !== '') qtyOpen = null;
    main.innerHTML = html;
    if (parts[0] === 'scan' && !q.get('ean')) startCamera(q.get('vare') || '');
    if (!parts[0] || parts[0] === 'indkob') { const pre = () => listItems().forEach((v) => { const c = card(v); if (c) [1, 2, 3].forEach((n) => { const im = imgOf(c, n); if (im && im.billede && !preloaded.has(im.billede)) { preloaded.add(im.billede); const i = new Image(); i.decoding = 'async'; i.src = im.billede; } }); }); if (window.requestIdleCallback) requestIdleCallback(pre, { timeout: 1500 }); else setTimeout(pre, 300); }
    if (parts[0] === 'teknik') { filmGo(0, false); showOwn(parts[1]); }
    if (parts[0] === 'katalog') applyFind();
    if (q.get('vis')) requestAnimationFrame(() => document.getElementById(q.get('vis'))?.scrollIntoView({ block: 'start' }));
    main.querySelectorAll('.chips--scroll [aria-current]').forEach((el) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    const h1 = main.querySelector('h1');
    if (focusNext && h1) h1.focus({ preventScroll: true });
    focusNext = true;
    document.title = `${title}, Varevennen`;
    document.querySelectorAll('[data-tab]').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }

  let katSel = '';
  function applyFind() {
    const inp = main.querySelector('#find'); if (!inp) return;
    const t = inp.value.trim().toLowerCase();
    let shown = 0;
    main.querySelectorAll('[data-find]').forEach((li) => { const hit = !t || li.dataset.find.includes(t); li.hidden = !hit; if (hit) shown++; });
    main.querySelectorAll('.group').forEach((g) => { g.hidden = !g.querySelector('[data-find]:not([hidden])') || (!t && katSel && g.dataset.cat !== katSel); });
    main.querySelector('.minecats')?.toggleAttribute('hidden', !!t);
    const help = main.querySelector('#find-help');
    if (help) help.textContent = t ? (shown ? `${pl(shown, 'vare', 'varer')} passer.` : `Ingen varer passer til "${inp.value.trim()}". Prøv et kortere ord.`) : '';
  }
  main.addEventListener('input', (e) => {
    if (e.target.id !== 'find') return;
    applyFind();
    const [path, qs] = location.hash.split('?'); const q = new URLSearchParams(qs || '');
    if (e.target.value.trim()) q.set('q', e.target.value.trim()); else q.delete('q');
    history.replaceState(null, '', `${path}${q.toString() ? '?' + q : ''}`);
  });

  // keep unsaved editor text when moving prios or going to the picker
  function syncDraft(form) {
    const v = form.dataset.vare; const c = db.cards[v] ||= { rule: 'spring_over' };
    [1, 2, 3].forEach((n) => { c['p' + n] = form['p' + n].value.trim(); c['ean' + n] = form['e' + n].value.trim(); });
    c.rule = form.rule.value || c.rule; c.max = form.max.value.trim(); c.store = form.store.value.trim(); c.note = form.note.value.trim();
    return c;
  }
  function shrink(file, max = 600) {
    return new Promise((ok, bad) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => { const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', 0.8)); };
      im.onerror = () => { URL.revokeObjectURL(url); bad(new Error('Billedet kunne ikke læses.')); };
      im.src = url;
    });
  }
  function setPhoto(kind, key, n, data) {
    if (kind === 'dish') { db.dishFoto ||= {}; if (data) db.dishFoto[key] = data; else delete db.dishFoto[key]; }
    else { const c = db.cards[key] ||= { rule: 'spring_over' }; if (data) c['foto' + n] = data; else delete c['foto' + n]; }
  }
  // ---------- drag the prio pictures (pointer for touch and mouse, arrow keys for keyboard) ----------
  let drag = null, dragJustEnded = false;
  function swapIn(strip, a, b) {
    if (a === b) return;
    const v = strip.dataset.strip; const std = strip.dataset.scope === 'std';
    const c = std ? (db.cards[v] ||= {}) : ovCard(v);
    swapPrio(c, a, b); for (let k = 1; k <= 2; k++) if (!c['p' + k] && c['p' + (k + 1)]) swapPrio(c, k, k + 1);
    if (std) delete c.auto;
    save(); buzz(); rerender();
    alertLine(`${v}: prio ${a} og ${b} har byttet plads${std ? '' : ` i ${weekLabel()}`}.`);
    document.querySelector(`[data-strip="${CSS.escape(v)}"][data-scope="${strip.dataset.scope}"] [data-pslot="${b}"]`)?.focus({ preventScroll: true });
  }
  main.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('.tile'); if (!tile || tile.classList.contains('tile--empty') || e.button > 0) return;
    drag = { tile, strip: tile.closest('[data-strip]'), x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
  });
  main.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on && Math.hypot(dx, dy) > 8) { if (Math.abs(dy) > Math.abs(dx) * 1.5) { drag = null; return; } drag.on = true; drag.tile.classList.add('is-drag'); drag.tile.setPointerCapture(e.pointerId); }
    if (drag.on) { e.preventDefault(); drag.tile.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`; const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile'); drag.strip.querySelectorAll('.tile').forEach((t) => t.classList.toggle('is-over', t === over && t !== drag.tile)); }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.on) return;
    d.tile.style.transform = ''; d.tile.classList.remove('is-drag');
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile');
    dragJustEnded = true; setTimeout(() => { dragJustEnded = false; }, 50);
    if (over && over !== d.tile && d.strip.contains(over)) swapIn(d.strip, +d.tile.dataset.pslot, +over.dataset.pslot);
    else d.strip.querySelectorAll('.tile').forEach((t) => t.classList.remove('is-over'));
  };
  main.addEventListener('pointerup', endDrag); main.addEventListener('pointercancel', endDrag);
  main.addEventListener('keydown', (e) => {
    const tile = e.target.closest('.tile'); if (!tile || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const a = +tile.dataset.pslot; const b = a + (e.key === 'ArrowLeft' ? -1 : 1); if (b < 1 || b > 3) return;
    const c = tile.closest('[data-strip]').dataset.scope === 'std' ? (stdCard(tile.closest('[data-strip]').dataset.strip) || {}) : (card(tile.closest('[data-strip]').dataset.strip) || {});
    if (!c['p' + a] || !c['p' + b]) return;
    e.preventDefault(); swapIn(tile.closest('[data-strip]'), a, b);
  });

  main.addEventListener('input', (e) => { if (e.target.id === 'addq') renderAddList(e.target.value); });
  main.addEventListener('input', (e) => {
    if (!e.target.matches('[data-bogsearch]')) return;
    const t = norm(e.target.value); const res = document.getElementById('bogresults'); const sh = document.getElementById('bogshelves');
    res.hidden = !t; sh.hidden = !!t; let n = 0;
    if (t) res.querySelectorAll('.rcard').forEach((li) => { const hit = t.split(' ').every((w) => li.dataset.q.includes(w) || li.dataset.q.includes(stem(w))); li.hidden = !hit; n += hit; });
    document.getElementById('bog-none').hidden = !t || !!n;
  });
  main.addEventListener('input', (e) => {
    if (!e.target.matches('[data-minesearch]')) return;
    const t = norm(e.target.value); const rows = [...main.querySelectorAll('.minelist li')];
    if (!t) { rerender(); document.getElementById('minesq')?.focus({ preventScroll: true }); return; }
    let n = 0; rows.forEach((li) => { const hit = li.dataset.name.includes(t) || stem(li.dataset.name).includes(stem(t)); li.hidden = !hit; n += hit; });
    main.querySelectorAll('.minecats .chip').forEach((c) => c.removeAttribute('aria-current'));
    document.getElementById('mine-none').hidden = !!n;
  });
  main.addEventListener('focusin', (e) => { if (e.target.id === 'addq' && !e.target.value) renderAddList(''); });
  document.addEventListener('pointerdown', (e) => { const l = document.getElementById('addlist'); if (l && !l.hidden && !e.target.closest('.composer')) { l.hidden = true; document.getElementById('addq')?.setAttribute('aria-expanded', 'false'); } });
  main.addEventListener('keydown', (e) => {
    if (e.target.id !== 'addq') return;
    const list = document.getElementById('addlist'); const opts = [...list.querySelectorAll('[role=option]')]; if (!opts.length || list.hidden) return;
    const cur = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const nx = e.key === 'ArrowDown' ? Math.min(opts.length - 1, cur + 1) : Math.max(0, cur - 1); opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === nx))); e.target.setAttribute('aria-activedescendant', opts[nx].id); opts[nx].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Escape') { list.hidden = true; e.target.setAttribute('aria-expanded', 'false'); }
  });
  main.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-note]')) { e.preventDefault(); e.target.blur(); } });
  main.addEventListener('input', (e) => {
    if (!e.target.matches('[data-frsearch]')) return;
    const t = norm(e.target.value); let n = 0;
    main.querySelectorAll('#frlist [data-q]').forEach((li) => { const hit = !t || t.split(' ').every((w) => li.dataset.q.includes(w) || li.dataset.q.includes(stem(w))); li.hidden = !hit; n += hit; const d = li.querySelector('details'); if (t && hit && d) d.open = true; });
    main.querySelectorAll('#frlist .group').forEach((g) => { g.hidden = !g.querySelector('[data-q]:not([hidden])'); });
    document.getElementById('fr-none').hidden = !!n;
  });
  main.addEventListener('change', async (e) => {
    if (e.target.matches('[data-plan]')) { const d = e.target.dataset.plan; W().plan ||= {}; if (e.target.value === '') delete W().plan[d]; else W().plan[d] = +e.target.value; save(); rerender(); return; }
    if (e.target.matches('[data-remsw]')) { db.profil ||= {}; db.profil.paamind = { ...remCfg(), on: e.target.checked }; save(); rerender(); document.getElementById('remsw')?.focus({ preventScroll: true }); return; }
    if (e.target.matches('[data-remdag]')) { db.profil ||= {}; db.profil.paamind = { ...remCfg(), dag: e.target.value, tid: e.target.value === 'samme' && remCfg().tid >= '12:00' ? '07:00' : e.target.value === 'foer' && remCfg().tid < '12:00' ? '18:00' : remCfg().tid }; save(); rerender(); return; }
    if (e.target.matches('[data-remtid]')) { if (!e.target.value) return; db.profil ||= {}; db.profil.paamind = { ...remCfg(), tid: e.target.value }; save(); toast(`Påmindelsen kommer kl. ${e.target.value}.`); return; }
    if (e.target.matches('[data-note]')) {
      const v = e.target.dataset.note; const val = e.target.value.trim(); W().note ||= {}; if (val) W().note[v] = val; else delete W().note[v]; save();
      const li = e.target.closest('.row'); if (li) { let el = li.querySelector('.row__note'); if (val) { if (!el) { el = document.createElement('span'); el.className = 'row__note'; li.querySelector('.row__txt').append(el); } el.textContent = val; } else el?.remove(); }
      return;
    }
    const ing = e.target.closest('input[data-ing]');
    if (ing) { const d = decodeURIComponent(location.hash.split('/')[2]); W().skip ||= {}; const set = new Set(W().skip[d] || []); ing.checked ? set.delete(ing.dataset.ing) : set.add(ing.dataset.ing); W().skip[d] = [...set]; save(); rerender(); document.querySelector(`[data-ing="${CSS.escape(ing.dataset.ing)}"]`)?.focus({ preventScroll: true }); return; }
    const dn = e.target.closest('[data-dnote]');
    if (dn) { db.dnote ||= {}; db.dnote[dn.dataset.dnote] = dn.value.trim(); const h = document.getElementById('dnote-help'); if (h) h.textContent = save() ? 'Gemt på telefonen.' : 'Kunne ikke gemme.'; return; }
    const inp = e.target.closest('input[data-photo]');
    if (inp && inp.files && inp.files[0]) {
      const { photo: kind, key, n } = inp.dataset; const form = inp.closest('form#cardform'); if (form) syncDraft(form);
      try {
        const data = await shrink(inp.files[0]); setPhoto(kind, key, n, data);
        if (!save()) { setPhoto(kind, key, n, null); alertLine('Der er ikke plads til flere fotos på telefonen. Fjern et andet foto først.'); return; }
        buzz(); rerender(); alertLine(kind === 'dish' ? `Foto gemt til ${key}.` : `Foto gemt til prio ${n}.`);
      } catch (err) { alertLine(err.message); }
      return;
    }
    if (e.target.matches('[data-aldrig]')) { const v = e.target.dataset.aldrig; const pf = prof(); pf.aldrig = e.target.checked ? pf.aldrig.filter((x) => x !== v) : [...new Set([...pf.aldrig, v])]; save(); rerender(); document.getElementById(`nv-${slug(v)}`)?.focus({ preventScroll: true }); alertLine(e.target.checked ? `${v} kommer på listen igen.` : `${v} er taget af listen.`); return; }
    if (e.target.matches('[data-ownvid]') && e.target.files && e.target.files[0]) {
      const id = e.target.dataset.ownvid; const f = e.target.files[0]; const h = document.getElementById('ownvid-help');
      if (f.size > 200 * 1024 * 1024) { h.textContent = 'Videoen er for stor. Optag en kortere, under et par minutter.'; return; }
      h.textContent = 'Gemmer videoen…';
      vidPut(id, f).then(() => { db.ownVideo = [...new Set([...(db.ownVideo || []), id])]; save(); rerender(); const hh = document.getElementById('ownvid-help'); if (hh) hh.textContent = 'Videoen er gemt på telefonen.'; }).catch(() => { h.textContent = 'Telefonen ville ikke gemme videoen. Der er måske ikke plads.'; });
      return;
    }
    if (e.target.matches('[data-emne]')) { (db.emne ||= {})[e.target.dataset.emne] = e.target.value; save(); toast(`Flyttet til ${e.target.value}.`); return; }
    if (e.target.matches('[data-listshop]')) { db.lister[e.target.dataset.listshop].butik = e.target.value; save(); toast(e.target.value ? `Listen er til ${e.target.value}.` : 'Listen er ikke bundet til en butik.'); return; }
    if (e.target.matches('#rf') && e.target.files && e.target.files[0]) { shrink(e.target.files[0]).then((d) => { pendingPhoto = d; const pv = document.getElementById('rf-prev'); if (pv) { pv.innerHTML = `<img src="${d}" alt="Det valgte billede" width="500" height="375">`; pv.hidden = false; } }).catch((er) => alertLine(er.message)); return; }
    if (e.target.matches('[data-import]') && e.target.files && e.target.files[0]) {
      const h = document.getElementById('data-help');
      e.target.files[0].text().then((t) => { const d = JSON.parse(t); if (!d || !d.weeks || !d.cards) throw new Error('bad');
        if (!confirm('Erstat alt på denne telefon med kopien?')) return; localStorage.setItem(KEY, JSON.stringify(d)); location.reload(); })
        .catch(() => { h.textContent = 'Filen kunne ikke læses. Vælg en kopi, der er gemt fra Varevennen.'; });
      return;
    }
    if (e.target.matches('[data-nutsw]')) { prof().naering = e.target.checked; save(); rerender(); document.getElementById('nutsw')?.focus({ preventScroll: true }); toast(e.target.checked ? 'Næring er slået til.' : 'Næring er slået fra.'); return; }
    if (e.target.matches('[data-withwant]')) { const t = document.getElementById('sharetext'); if (t) t.textContent = shareText(weekData(), e.target.checked); return; }
    if (e.target.matches('[data-shop]')) { db.shop = e.target.value; save(); rerender(); document.getElementById('shop')?.focus({ preventScroll: true }); return; }
    if (e.target.matches('[data-unknown]')) { location.replace(e.target.dataset.unknown); }
  });

  // ---------- events ----------
  let focusNext = false;
  // redraw the same screen in place: keep the scroll position, never jump
  const rerender = () => { const y = window.scrollY; focusNext = false; render(); window.scrollTo(0, y); };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    if (a.hasAttribute('data-replace')) { e.preventDefault(); location.replace(a.getAttribute('href')); return; }
    if (a.hasAttribute('data-back') && trail.length > 1 && trail[trail.length - 2] === a.getAttribute('href')) { e.preventDefault(); history.back(); }
  });
  function alertLine(t) { let el = document.getElementById('photo-status'); if (!el) { el = document.createElement('p'); el.id = 'photo-status'; el.className = 'visually-hidden'; el.setAttribute('role', 'status'); document.body.append(el); } el.textContent = ''; setTimeout(() => { el.textContent = t; }, 50); const vis = main.querySelector('#move-help, #save-help, [data-photo-help]'); if (vis) vis.textContent = t; }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-toast-undo]') && lastAdd) {
      lastAdd.list.reverse().forEach((b) => { if (!b.was) { delete W().extra[b.v]; delete W().qty[b.v]; } else { W().qty[b.v] = b.q; if (!b.extra) delete W().extra[b.v]; } });
      lastAdd = null; save(); rerender(); toast('Fortrudt.'); return;
    }
  });
  main.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-add], [data-add-new]');
    if (opt) { const v = opt.dataset.add || newItem(opt.dataset.addNew); addAndShow([[v, 1]]); return; }
    const pb = e.target.closest('[data-port]');
    if (pb) { const d = pb.dataset.dishName; const o = OP[d]; const base = (o && o.personer) || 4; db.port ||= {}; db.port[d] = Math.max(1, Math.min(20, ((db.port[d]) || base) + +pb.dataset.port)); save(); rerender(); main.querySelector(`[data-port="${pb.dataset.port}"]:not([disabled])`)?.focus({ preventScroll: true }); alertLine(`${db.port[d]} personer.`); return; }
    const ll = e.target.closest('[data-loadlist]');
    if (ll) { const x = db.lister[ll.dataset.loadlist]; if (x.butik) db.shop = x.butik; W().dishes = [...new Set([...W().dishes, ...x.dishes.filter((d) => S.retter[d])])]; W().extra ||= {}; W().qty ||= {}; Object.keys(x.extra || {}).forEach((v) => { W().extra[v] = true; }); Object.entries(x.qty || {}).forEach(([v, n]) => { W().qty[v] = Math.max(W().qty[v] || 1, n); }); Object.entries(x.skip || {}).forEach(([d, l]) => { (W().skip ||= {})[d] = l; }); Object.assign(W().opt ||= {}, x.opt || {}); Object.assign(W().note ||= {}, x.note || {}); save(); if (location.hash.split('?')[0] === '#/indkob') rerender(); else location.hash = '#/indkob'; setTimeout(() => toast(`${ll.dataset.loadlist} er hentet ind i ${weekLabel()}.`), 50); return; }
    const dl = e.target.closest('[data-dellist]');
    if (dl) { if (!confirm(`Slet listen ${dl.dataset.dellist}?`)) return; delete db.lister[dl.dataset.dellist]; save(); if (location.hash.startsWith('#/liste/')) location.hash = '#/lister'; else rerender(); toast(`${dl.dataset.dellist} er slettet.`); return; }
    const lq = e.target.closest('[data-lq]');
    if (lq) { const x = db.lister[lq.dataset.liste]; const v = lq.dataset.lq; x.qty ||= {}; const nq = ((x.qty[v]) || 1) + +lq.dataset.d; if (nq <= 0) { delete x.extra[v]; delete x.qty[v]; } else x.qty[v] = nq; save(); rerender(); (main.querySelector(`[data-lq="${CSS.escape(v)}"][data-d="${lq.dataset.d}"]`) || main.querySelector('#lsa'))?.focus({ preventScroll: true }); alertLine(nq <= 0 ? `${v} er fjernet.` : `${v}: ${nq}.`); return; }
    const lrd = e.target.closest('[data-lrmdish]');
    if (lrd) { const x = db.lister[lrd.dataset.liste]; x.dishes = x.dishes.filter((d) => d !== lrd.dataset.lrmdish); save(); rerender(); toast(`${lrd.dataset.lrmdish} er fjernet fra listen.`); return; }
    const dr = e.target.closest('[data-delrecipe]');
    if (dr) { const d = dr.dataset.delrecipe; if (!confirm(`Slet opskriften ${d}?`)) return; delete db.opskrifter[d]; delete S.retter[d]; delete OP[d]; Object.values(db.weeks).forEach((w) => { w.dishes = w.dishes.filter((x) => x !== d); }); save(); location.hash = '#/retter'; return; }
    const ssw = e.target.closest('[data-stdswap]');
    if (ssw) { const v = ssw.dataset.vare; const p = byEan[ssw.dataset.stdswap]; const c = (db.cards[v] ||= { rule: 'naermeste' }); placeAt(c, 1, p); delete c.auto; save(); buzz(); rerender(); toast(`${prodLabel(p)} er nu prio 1.`); return; }
    const tk = e.target.closest('[data-take]');
    if (tk) { const n = tk.dataset.take; takeRecipe(n); if (tk.dataset.then === 'uge' && !W().dishes.includes(n)) W().dishes.push(n); save(); buzz();
      if (tk.dataset.then === 'ret') location.hash = `#/ret/${slug(n)}`; else if (tk.dataset.then === 'uge') { location.hash = '#/indkob'; setTimeout(() => toast(`${n} er på listen i ${weekLabel()}.`), 50); } else { rerender(); toast(`${n} er gemt under ${BANK.opskrifter[n].kategori}.`); }
      return; }
    const spl = e.target.closest('[data-splitrecipe]');
    if (spl) { const r = splitRecipe(document.getElementById('rall').value); const f = document.getElementById('recipeform'); const h = document.getElementById('rall-help');
      if (!r.ing.length && !r.steps.length) { h.textContent = 'Der var ikke noget at dele op. Sæt opskriften ind først.'; return; }
      if (r.name && !f.rn.value) f.rn.value = r.name; f.ri.value = r.ing.join('\n'); f.rs.value = r.steps.join('\n');
      h.textContent = `${pl(r.ing.length, 'ingrediens', 'ingredienser')} og ${pl(r.steps.length, 'trin', 'trin')}. Tjek felterne herunder, før du gemmer.`; f.rn.focus(); return; }
    const rr = e.target.closest('[data-resetrecipe]');
    if (rr) { const d = rr.dataset.resetrecipe; if (!confirm(`Brug den oprindelige opskrift for ${d}? Jeres ændringer forsvinder.`)) return; delete db.opskrifter[d]; OP[d] = OPBASE[d]; S.retter[d] = RETBASE[d]; save(); location.hash = `#/ret/${slug(d)}`; return; }
    if (e.target.closest('[data-export]')) {
      const name = `varevennen-kopi-${new Date().toISOString().slice(0, 10)}.json`; const file = new File([JSON.stringify(db)], name, { type: 'application/json' });
      const h = document.getElementById('data-help');
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Varevennen, kopi' }).then(() => { h.textContent = 'Kopien er sendt.'; }).catch(() => {});
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove(); h.textContent = `Kopien er gemt som ${name}.`; }
      return;
    }
    const dic = e.target.closest('[data-dictate]');
    if (dic) { dictate(dic); return; }
    const shareHelp = (t) => { const h = document.getElementById('share-help'); if (h) h.textContent = t; };
    const copyText = (t) => (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : Promise.reject(new Error('no clipboard'))).then(() => shareHelp('Kopieret. Sæt den ind i en besked.')).catch(() => { const r = document.createRange(); const el = document.getElementById('sharetext'); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); shareHelp('Teksten er markeret. Kopiér den med telefonens menu.'); });
    if (e.target.closest('[data-copy]')) { copyText(document.getElementById('sharetext').textContent); return; }
    if (e.target.closest('[data-share]')) {
      const text = document.getElementById('sharetext').textContent;
      if (navigator.share) navigator.share({ title: `Indkøb, ${weekLabel()}`, text }).then(() => shareHelp('Delt.')).catch((err) => { if (err.name !== 'AbortError') copyText(text); });
      else copyText(text);
      return;
    }
    if (e.target.closest('[data-sharepdf]') && window.__lastPdf) { navigator.share({ files: [window.__lastPdf], title: `Indkøb, ${weekLabel()}` }).catch(() => {}); return; }
    if (e.target.closest('[data-intro]')) { showIntro(); return; }
    if (e.target.closest('[data-nyt]')) { showNyt(true); return; }
    const ko = e.target.closest('[data-kost]');
    if (ko) { const pf = prof(); const k = ko.dataset.kost; pf.kost = (pf.kost || []).includes(k) ? pf.kost.filter((x) => x !== k) : [...(pf.kost || []), k]; save(); rerender(); main.querySelector(`[data-kost="${k}"]`)?.focus({ preventScroll: true }); return; }
    const al = e.target.closest('[data-allergi]');
    if (al) { const id = al.dataset.allergi; const pf = prof(); pf.allergi = pf.allergi.includes(id) ? pf.allergi.filter((x) => x !== id) : [...pf.allergi, id]; save(); rerender(); main.querySelector(`[data-allergi="${id}"]`)?.focus({ preventScroll: true }); const a = ALLERGENER.find((x) => x.id === id); const gone = a.varer.filter((v) => blockOf(v)); alertLine(pf.allergi.includes(id) ? `${a.navn} valgt.${gone.length ? ` Taget af listen: ${gone.join(', ')}.` : ''}` : `${a.navn} fjernet.`); return; }
    const fp = e.target.closest('[data-film-play]');
    if (fp) { const film = main.querySelector('[data-film]'); const i = +film.dataset.i; const n = film.querySelectorAll('.film__frame').length; if (fp.getAttribute('aria-pressed') === 'true') filmGo(i, false); else filmGo(film.dataset.ended ? 0 : i, true); return; }
    const fst = e.target.closest('[data-film-step]');
    if (fst) { const film = main.querySelector('[data-film]'); filmGo(+film.dataset.i + +fst.dataset.filmStep, false); return; }
    const od = e.target.closest('[data-ownvid-del]');
    if (od) { const id = od.dataset.ownvidDel; vidDel(id).then(() => { db.ownVideo = (db.ownVideo || []).filter((x) => x !== id); save(); rerender(); alertLine('Jeres video er slettet.'); }); return; }
    const ad = e.target.closest('[data-addish]');
    if (ad) { const d = ad.dataset.addish; if (!W().dishes.includes(d)) W().dishes.push(d); save(); buzz(); location.hash = '#/indkob'; return; }
    const rd = e.target.closest('[data-rmdish]');
    if (rd) { W().dishes = W().dishes.filter((x) => x !== rd.dataset.rmdish); if (W().plan) delete W().plan[rd.dataset.rmdish]; save(); rerender(); alertLine(`${rd.dataset.rmdish} er fjernet fra ugen.`); return; }
    const ap = e.target.closest('[data-approve]');
    if (ap) { const v = ap.dataset.approve; if (db.cards[v]) delete db.cards[v].auto; save(); rerender(); alertLine(`${v} er godkendt.`); return; }
    const os_ = e.target.closest('[data-ov-save]');
    if (os_) { const v = os_.dataset.ovSave; const o = W().cardOv[v]; const c = db.cards[v] ||= {}; [1, 2, 3].forEach((n) => ['p', 'ean', 'foto'].forEach((k) => { c[k + n] = o[k + n] || ''; })); delete c.auto; delete W().cardOv[v]; save(); rerender(); alertLine(`Rækkefølgen er gemt som standard for ${v}.`); return; }
    const or_ = e.target.closest('[data-ov-reset]');
    if (or_) { delete W().cardOv[or_.dataset.ovReset]; save(); rerender(); alertLine('Tilbage til standarden.'); return; }
    const sw = e.target.closest('[data-swap]');
    if (sw) { const v = sw.dataset.vare; const p = byEan[sw.dataset.swap]; const dropped = placeAt(ovCard(v), 1, p); save(); buzz(); rerender(); window.scrollTo(0, 0); alertLine(`${p.maerke} er prio 1 i ${weekLabel()}.${dropped ? ` ${dropped} faldt ud.` : ''}`); return; }
    const tile = e.target.closest('.tile');
    if (tile) {
      if (dragJustEnded) return;
      const strip = tile.closest('[data-strip]'); const v = strip.dataset.strip; const n = +tile.dataset.pslot;
      if (strip.dataset.scope === 'std') location.hash = `#/vaelg/${slug(v)}?prio=${n}`;
      else if (!location.hash.startsWith('#/kort/')) location.hash = `#/kort/${slug(v)}`;
      return;
    }
    const wk = e.target.closest('[data-week]');
    if (wk) { const n = +wk.dataset.week; db.week = n ? shiftWeek(db.week, n) : CUR_WEEK; undo = null; rerender(); alertLine(`Uge ${weekNo(db.week)}${db.week === CUR_WEEK ? ', denne uge' : ''}.`); main.querySelector(`[data-week="${n}"]`)?.focus({ preventScroll: true }); return; }
    const qb = e.target.closest('[data-qty]');
    if (qb) {
      const v = qb.dataset.qty; const d = +qb.dataset.d; W().extra ||= {}; W().qty ||= {};
      const was = onList(v); const fromDish = fromDishes().has(v);
      if (!was) { W().extra[v] = true; W().qty[v] = 1; }
      else { const n = qtyOf(v) + d; if (n <= 0) { if (!fromDish) { delete W().extra[v]; delete W().qty[v]; } } else W().qty[v] = n; }
      save(); buzz(); rerender();
      alertLine(!onList(v) ? `${v} er fjernet fra listen.` : !was ? `${v} er lagt på listen.` : `${v}: ${qtyOf(v)} på listen.`);
      (main.querySelector(`[data-qty="${CSS.escape(v)}"][data-d="${d}"]:not([disabled])`) || main.querySelector(`[data-qty="${CSS.escape(v)}"]`))?.focus({ preventScroll: true });
      return;
    }
    const sg = e.target.closest('[data-sugg]');
    if (sg) {
      const v = sg.dataset.vare; const n = +sg.dataset.to; const form = main.querySelector('form#cardform'); if (form) syncDraft(form);
      const c = db.cards[v] ||= { rule: 'spring_over' }; const p = byEan[sg.dataset.sugg]; const dropped = placeAt(c, n, p); delete c.auto;
      save(); buzz(); rerender();
      alertLine(`${p.maerke} er nu prio ${n}.${dropped ? ` ${dropped} faldt ud af prio 3.` : ''}${form ? ' Husk at gemme kortet.' : ''}`);
      main.querySelector(`[data-sugg="${CSS.escape(p.ean)}"][data-to="${n}"]`)?.focus({ preventScroll: true });
      return;
    }
    const pd = e.target.closest('[data-photo-del]');
    if (pd) { const form = pd.closest('form#cardform'); if (form) syncDraft(form); setPhoto(pd.dataset.photoDel, pd.dataset.key, pd.dataset.n, null); save(); rerender(); alertLine('Eget foto fjernet.'); return; }
    const mv = e.target.closest('[data-move]');
    if (mv) {
      const form = mv.closest('form'); const c = syncDraft(form); const [a, b] = mv.dataset.move.split('>').map(Number);
      if (b === 1 && a === 3) { swapPrio(c, 3, 2); swapPrio(c, 2, 1); } else swapPrio(c, a, b);
      save(); rerender(); buzz();
      const h = document.getElementById('move-help'); if (h) h.textContent = `Prio ${a} er nu prio ${b}. Husk at gemme kortet.`;
      document.querySelector(`#prio-${b} [data-move]`)?.focus({ preventScroll: true }); document.getElementById('prio-' + b)?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const kf = e.target.closest('[data-keepform]');
    if (kf) { const form = kf.closest('form'); if (form) { syncDraft(form); save(); } return; }
    const pk = e.target.closest('[data-pick]');
    if (pk) {
      const parts = location.hash.split('?')[0].split('/'); const v = decodeURIComponent(parts[2]); const prio = +(new URLSearchParams(location.hash.split('?')[1] || '').get('prio') || 1);
      const c = db.cards[v] ||= { rule: 'spring_over' }; const p = byEan[pk.dataset.pick];
      const at = [1, 2, 3].find((n) => c['ean' + n] === p.ean);
      if (at && at !== prio) swapPrio(c, at, prio); else { c['p' + prio] = prodLabel(p); c['ean' + prio] = p.ean; }
      delete c.auto; save(); buzz();
      if (trail.length > 1) history.back(); else location.replace(`#/kort/${slug(v)}/rediger`);
      return;
    }
    const u = e.target.closest('[data-undo]');
    if (u && undo) { W().ticks[undo.v] = undo.t; const v = undo.v; undo = null; save(); rerender(); document.querySelector(`[data-tick="${CSS.escape(v)}"]`)?.focus({ preventScroll: true }); return; }
    const vm = e.target.closest('[data-vmode]');
    if (vm) { chooser.mode = vm.dataset.vmode; chooser.items = []; chooser.empty = false; chooser.seen = new Set(); rerender(); main.querySelector(`[data-vmode="${vm.dataset.vmode}"]`)?.focus({ preventScroll: true }); return; }
    const vf = e.target.closest('[data-vf]');
    if (vf) { const k = vf.dataset.vf; if (chooser.f.has(k)) chooser.f.delete(k); else { chooser.f.add(k); if (k === 'egne') chooser.f.delete('nyt'); if (k === 'nyt') chooser.f.delete('egne'); } chooser.items = []; chooser.empty = false; chooser.seen = new Set(); rerender(); main.querySelector(`[data-vf="${k}"]`)?.focus({ preventScroll: true }); return; }
    if (e.target.closest('[data-pick-again]')) { chooser.items = []; chooser.empty = false; rerender(); buzz(); return; }
    if (e.target.closest('[data-pick-add]')) { const d = chooser.items[0]; addDish(d.n); save(); buzz(); chooser.added[d.n] = true; rerender(); alertLine(`${d.n} er på listen i ${weekLabel()}.`); return; }
    const pdy = e.target.closest('[data-pickday]');
    if (pdy) { const d = chooser.items[0]; W().plan ||= {}; if (W().plan[d.n] === +pdy.dataset.pickday) delete W().plan[d.n]; else W().plan[d.n] = +pdy.dataset.pickday; save(); rerender(); main.querySelector(`[data-pickday="${pdy.dataset.pickday}"]`)?.focus({ preventScroll: true }); return; }
    const psw = e.target.closest('[data-pickswap]');
    if (psw) { const i = +psw.dataset.pickswap; const keep = chooser.items.filter((_, k) => k !== i); const ex = new Set(chooser.items.map((x) => x.n)); const r = pickDishes(1, ex, keep); if (r.length) chooser.items[i] = r[0]; else toast('Der er ikke flere retter, der passer.'); rerender(); main.querySelector(`[data-pickswap="${i}"]`)?.focus({ preventScroll: true }); return; }
    const pn = e.target.closest('[data-pickn]');
    if (pn) { chooser.n = Math.max(2, Math.min(7, chooser.n + +pn.dataset.pickn)); chooser.items = []; chooser.empty = false; rerender(); main.querySelector(`[data-pickn="${pn.dataset.pickn}"]:not([disabled])`)?.focus({ preventScroll: true }); return; }
    if (e.target.closest('[data-pick-addall]')) { const names = chooser.items.map((x) => x.n); names.forEach(addDish); const had = Object.keys(W().plan || {}).length; autoPlan(names); const planned = Object.keys(W().plan || {}).length - had; save(); buzz(); location.hash = '#/indkob'; setTimeout(() => toast(`${pl(names.length, 'ret', 'retter')} er på listen${planned ? ` og ${planned === names.length ? 'fordelt på dagene' : `${pl(planned, 'fik', 'fik')} en dag`}` : ''}.`), 50); return; }
    if (e.target.closest('[data-plan-auto]')) { autoPlan(W().dishes); save(); rerender(); const h = document.getElementById('plan-help'); if (h) h.textContent = 'Retterne er fordelt på dagene. Ret dem, hvis I vil.'; return; }
    const th = e.target.closest('[data-thawed]');
    if (th) { const [wk, dish] = th.dataset.thawed.split('|'); if (db.weeks[wk]) { (db.weeks[wk].thawed ||= {})[dish] = true; } save(); rerender(); toast(`${dish}: kødet er taget op.`); return; }
    if (e.target.closest('[data-ics]')) {
      const h = document.getElementById('plan-help'); const { n, text } = icsText();
      if (!n) { if (h) h.textContent = 'Ingen retter med kød har fået en dag endnu. Vælg en dag til retten først.'; return; }
      const name = `varevennen-paamindelser-${weekLabel().replace(' ', '')}.ics`; const file = new File([text], name, { type: 'text/calendar' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Påmindelser fra Varevennen' }).catch(() => {});
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove(); }
      if (h) h.textContent = `${pl(n, 'påmindelse', 'påmindelser')} er lavet. Åbn filen, så lægges de i kalenderen.`; return;
    }
    const ot = e.target.closest('[data-opt]');
    if (ot) { const v = ot.dataset.opt; W().opt ||= {}; if (W().opt[v]) delete W().opt[v]; else W().opt[v] = true; save(); buzz(); rerender(); main.querySelector(`[data-opt="${CSS.escape(v)}"]`)?.focus({ preventScroll: true }); toast(isOpt(v) ? `${v} kan undværes.` : `${v} skal med.`); return; }
    const qo = e.target.closest('[data-qtyopen]');
    if (qo) { qtyOpen = qtyOpen === qo.dataset.qtyopen ? null : qo.dataset.qtyopen; rerender(); (main.querySelector('.qtybar [aria-pressed="true"]') || main.querySelector(`[data-qtyopen="${CSS.escape(qo.dataset.qtyopen)}"]`))?.focus({ preventScroll: true }); return; }
    const sq = e.target.closest('[data-setqty]');
    if (sq) { const v = sq.dataset.vare; const n = +sq.dataset.setqty; W().extra ||= {}; W().qty ||= {};
      if (n <= 0) { delete W().extra[v]; delete W().qty[v]; qtyOpen = null; } else { if (!onList(v)) W().extra[v] = true; W().qty[v] = n; if (sq.getAttribute('aria-label') === null) qtyOpen = null; }
      save(); buzz(); rerender(); alertLine(n <= 0 ? `${v} er fjernet fra listen.` : `${v}: ${n}.`);
      (main.querySelector('.qtybar [aria-pressed="true"]') || main.querySelector(`[data-qtyopen="${CSS.escape(v)}"]`))?.focus({ preventScroll: true }); return; }
    const t = e.target.closest('[data-tick]');
    if (t) {
      const v = t.dataset.tick;
      if (W().ticks[v]) { undo = { v, t: W().ticks[v] }; W().ticks[v] = 0; } else { undo = null; learnRoute(v); W().ticks[v] = +t.dataset.p || 1; buzz(); }
      save(); rerender(); document.querySelector(`[data-tick="${CSS.escape(v)}"]`)?.focus({ preventScroll: true }); return;
    }
    const ph = e.target.closest('[data-photo]');
    if (ph) { const h = main.querySelector('[data-photo-help]'); if (h) h.textContent = 'Kameraet er ikke koblet på endnu i prototypen.'; return; }
    const f = e.target.closest('[data-found]');
    if (f) { const v = decodeURIComponent(location.hash.split('/')[2]); W().ticks[v] = +f.dataset.found; undo = null; buzz(); save(); rerender(); document.querySelector(`[data-found="${f.dataset.found}"]`)?.focus({ preventScroll: true }); return; }
    const fs = e.target.closest('[data-found-scan]');
    if (fs) { const v = fs.dataset.vare; W().ticks[v] = +fs.dataset.foundScan; if (!onList(v)) { W().extra[v] = 1; } buzz(); save(); location.hash = '#/indkob'; return; }
    const tch = e.target.closest('[data-teach]');
    if (tch) { const v = tch.dataset.vare; const n = +tch.dataset.teach; const c = (db.cards[v] ||= { rule: 'naermeste' }); const p = byEan[tch.dataset.ean];
      [1, 2, 3].forEach((k) => { if (c['ean' + k] === tch.dataset.ean) { c['ean' + k] = ''; c['p' + k] = ''; } });
      placeAt(c, n, p || { navn: `Scannet vare, stregkode ${tch.dataset.ean}`, ean: tch.dataset.ean }); delete c.auto; save(); buzz();
      const to = `#/scan?ean=${tch.dataset.ean}&vare=${slug(v)}`; if (location.hash === to) rerender(); else location.replace(to); alertLine(`Gemt som prio ${n} for ${v}.`); return; }
    const d = e.target.closest('input[data-dish]');
    if (d) { const set = new Set(W().dishes); set.has(d.dataset.dish) ? set.delete(d.dataset.dish) : set.add(d.dataset.dish); W().dishes = [...set]; if (!set.has(d.dataset.dish) && W().plan) delete W().plan[d.dataset.dish]; save(); rerender(); document.querySelector(`[data-dish="${CSS.escape(d.dataset.dish)}"]`)?.focus({ preventScroll: true }); return; }
    if (e.target.closest('#build')) { location.hash = '#/indkob'; return; }
    const sf = e.target.closest('[data-scanfield]');
    if (sf) { const help = document.getElementById(sf.dataset.scanfield.replace('e', 'p') + '-help'); if (help) help.textContent = 'Kameraet er ikke koblet på endnu. Skriv stregkoden af indtil da.'; }
  });

  main.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.id === 'cardform') {
      const p1 = form.p1; const help = document.getElementById('p1-help');
      if (!p1.value.trim()) { p1.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Prio 1 mangler. Skriv mærke, variant og størrelse.'; p1.focus(); return; }
      p1.removeAttribute('aria-invalid'); delete help.dataset.error;
      const v = form.dataset.vare;
      db.cards[v] = { auto: undefined, p1: p1.value.trim(), p2: form.p2.value.trim(), p3: form.p3.value.trim(), ean1: form.e1.value.trim(), ean2: form.e2.value.trim(), ean3: form.e3.value.trim(), rule: form.rule.value, max: form.max.value.trim(), store: form.store.value.trim(), note: form.note.value.trim() };
      document.getElementById('save-help').textContent = save() ? 'Gemt på telefonen.' : 'Kunne ikke gemme. Telefonen tillader ikke lokal lagring.';
      return;
    }
    if (form.id === 'newlistform') {
      const n = form.nln.value.trim(); const help = document.getElementById('nl-help');
      if (!n) { form.nln.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Giv listen et navn.'; form.nln.focus(); return; }
      if (db.lister && db.lister[n]) { form.nln.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Der findes allerede en liste med det navn.'; form.nln.focus(); return; }
      const fromWeek = form.nlw.checked;
      (db.lister ||= {})[n] = fromWeek ? JSON.parse(JSON.stringify({ dishes: W().dishes, extra: W().extra || {}, qty: W().qty || {}, skip: W().skip || {}, opt: W().opt || {}, note: W().note || {}, butik: form.nlb.value })) : { dishes: [], extra: {}, qty: {}, skip: {}, butik: form.nlb.value };
      save(); location.hash = `#/liste/${slug(n)}`; return;
    }
    if (form.id === 'listaddform') {
      const n = form.dataset.liste; const x = db.lister[n]; const t = form.lsa.value.trim(); const help = document.getElementById('lsa-help');
      if (!t) { help.textContent = 'Skriv en vare.'; form.lsa.focus(); return; }
      const hit = findItems(t, 1)[0]; const v = hit && (norm(hit) === norm(t) || norm(hit).startsWith(norm(t))) ? hit : newItem(t);
      x.extra ||= {}; x.qty ||= {}; x.extra[v] = true; x.qty[v] = (x.qty[v] || 0) + 1; save(); rerender(); document.getElementById('lsa')?.focus({ preventScroll: true }); toast(`${v} er på ${n}.`); return;
    }
    if (form.id === 'saveform') {
      const n = form.ln.value.trim(); const help = document.getElementById('save-list-help');
      if (!n) { form.ln.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Giv listen et navn.'; form.ln.focus(); return; }
      db.lister ||= {}; const had = !!db.lister[n]; db.lister[n] = JSON.parse(JSON.stringify({ dishes: W().dishes, extra: W().extra || {}, qty: W().qty || {}, skip: W().skip || {}, opt: W().opt || {}, note: W().note || {} }));
      save(); rerender(); toast(had ? `${n} er opdateret.` : `${n} er gemt.`); return;
    }
    if (form.id === 'recipeform') {
      const name = form.rn.value.trim().replace(/^./, (c) => c.toUpperCase()); const help = document.getElementById('recipe-help'); const edit = form.dataset.edit;
      const nh = document.getElementById('rn-help'); form.rn.removeAttribute('aria-invalid'); nh.textContent = '';
      if (!name) { form.rn.setAttribute('aria-invalid', 'true'); nh.dataset.error = ''; nh.textContent = 'Retten mangler et navn.'; form.rn.focus(); return; }
      if (name !== edit && S.retter[name] && !(db.opskrifter && db.opskrifter[name])) { form.rn.setAttribute('aria-invalid', 'true'); nh.dataset.error = ''; nh.textContent = 'Der findes allerede en ret med det navn.'; form.rn.focus(); return; }
      const ing = parseIngredients(form.ri.value);
      if (!ing.varer.length) { form.ri.setAttribute('aria-invalid', 'true'); const ih = document.getElementById('ri-help'); ih.dataset.error = ''; ih.textContent = 'Skriv mindst én ingrediens.'; form.ri.focus(); return; }
      db.opskrifter ||= {};
      if (edit && edit !== name) { delete db.opskrifter[edit]; delete S.retter[edit]; delete OP[edit]; Object.values(db.weeks).forEach((w) => { w.dishes = w.dishes.map((x) => (x === edit ? name : x)); }); }
      db.opskrifter[name] = { egen: true, kilde: (form.rsrc && form.rsrc.value) || (db.opskrifter[edit] && db.opskrifter[edit].kilde) || '', emne: form.re.value.trim() || 'Andre retter', personer: Math.max(1, parseInt(form.rp.value, 10) || 4), tid: form.rt.value.trim(), varer: ing.varer, maengder: ing.maengder, trin: form.rs.value.split('\n').map((x) => x.trim()).filter(Boolean) };
      if (edit && edit !== name && db.dishFoto && db.dishFoto[edit]) { db.dishFoto[name] = db.dishFoto[edit]; delete db.dishFoto[edit]; }
      if (pendingPhoto) { (db.dishFoto ||= {})[name] = pendingPhoto; pendingPhoto = null; }
      if (db.emne) delete db.emne[name];
      mergeOwn(); save(); location.hash = `#/ret/${slug(name)}`; setTimeout(() => toast(`${name} er gemt.`), 50); return;
    }
    if (form.id === 'addform') {
      const q = form.q.value; if (!q.trim()) return;
      const sel = document.querySelector('#addlist [aria-selected="true"]');
      if (sel) { sel.click(); return; }
      const { out, unknown } = parseSpoken(q);
      if (out.length && !unknown.length) { addAndShow(out, true); return; }
      const hit = findItems(q, 1)[0];
      addAndShow([[hit && norm(hit) === norm(q) ? hit : newItem(q), 1]]); return;
    }
    if (form.id === 'eanform') {
      const inp = form.ean; const help = document.getElementById('ean-help'); const val = inp.value.replace(/\D/g, '');
      if (!window.Scanner || !Scanner.valid(val)) { inp.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Det ligner ikke en stregkode. Skriv de 8 eller 13 cifre under stregerne.'; inp.focus(); return; }
      location.replace(`#/scan?ean=${val.length === 12 ? '0' + val : val}${form.dataset.vare ? `&vare=${slug(form.dataset.vare)}` : ''}`); return;
    }
    if (form.id === 'priceform') {
      const p = form.pprice; const help = document.getElementById('price-help');
      const n = parseFloat(p.value.replace(',', '.'));
      if (!(n > 0)) { p.setAttribute('aria-invalid', 'true'); help.dataset.error = ''; help.textContent = 'Prisen mangler. Skriv den som 39,95.'; p.focus(); return; }
      p.removeAttribute('aria-invalid'); delete help.dataset.error;
      (db.prices ||= []).push({ vare: form.dataset.vare, store: form.pstore.value.trim(), price: n, at: new Date().toISOString() });
      const ok = save(); render(); const h = document.getElementById('price-help'); if (h) h.textContent = ok ? `Gemt på telefonen: ${n.toFixed(2).replace('.', ',')} kr.` : 'Kunne ikke gemme.';
      return;
    }
    if (form.id === 'askform') {
      const text = form.msg.value.trim(); const help = document.getElementById('ask-help'); if (!text) { help.textContent = 'Skriv en besked først.'; form.msg.focus(); return; }
      if (navigator.share) navigator.share({ text }).then(() => { help.textContent = 'Sendt.'; }).catch((err) => { if (err.name !== 'AbortError') location.href = `sms:?&body=${encodeURIComponent(text)}`; });
      else location.href = `sms:?&body=${encodeURIComponent(text)}`;
      return;
    }
    if (form.dataset.endpoint === '') {
      const help = form.querySelector('[aria-live]');
      help.textContent = 'Ikke sendt: beskeder til den anden er ikke koblet på endnu.';
      return;
    }
    if (form.id === 'pdfform') {
      const help = document.getElementById('pdf-help'); const btn = form.querySelector('[type=submit]');
      const fmt = form.fmt.value;
      if (form.what.value === 'tjek') { window.open(`pdf/butikstjek-${fmt}.pdf`, '_blank', 'noopener'); help.textContent = 'PDF’en åbner i en ny fane.'; return; }
      btn.disabled = true; help.textContent = 'Laver PDF’en…';
      window.makeListPdf(weekData(), fmt).then((blob) => {
        const name = `indkob-${weekLabel().replace(' ', '')}-${fmt}.pdf`;
        const file = new File([blob], name, { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
        help.innerHTML = `PDF’en er lavet. <a class="link" href="${url}" target="_blank" rel="noopener">Åbn den</a>${navigator.canShare && navigator.canShare({ files: [file] }) ? ' eller <button type="button" class="link" data-sharepdf>del den</button>' : ''}.`;
        window.__lastPdf = file;
      }).catch((e) => { help.textContent = `PDF’en kunne ikke laves: ${e.message}`; }).finally(() => { btn.disabled = false; });
    }
  });

  // scroll memory per route, so the back gesture returns to the same row
  const pos = {};
  const trail = [location.hash || '#/indkob'];
  let settling = false;
  window.addEventListener('scroll', () => { if (!settling) pos[location.hash || '#/indkob'] = window.scrollY; }, { passive: true });
  window.addEventListener('hashchange', (e) => {
    const to = location.hash;
    const i = trail.lastIndexOf(to);
    const isBack = i > -1 && i === trail.length - 2;
    if (isBack) trail.pop(); else if (trail[trail.length - 1] !== to) trail.push(to);
    if (to.split('?')[0] !== new URL(e.oldURL).hash.split('?')[0]) undo = null;
    settling = true; setTimeout(() => { settling = false; }, 400);
    const go = () => { render(); window.scrollTo(0, isBack ? pos[to] || 0 : 0); };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const vt = document.startViewTransition(go); [vt.ready, vt.finished, vt.updateCallbackDone].forEach((pr) => pr && pr.catch(() => {})); } else go();
  });
  // product names were tidied (rens.js): cards that still carry the old, untidy label get the new one
  function relabel() {
    const fix = (c) => { if (!c) return; [1, 2, 3].forEach((n) => { const p = byEan[c['ean' + n]]; if (p && p.raa && c['p' + n] === prodLabel(p.raa)) c['p' + n] = prodLabel(p); }); };
    Object.values(db.cards).forEach(fix); Object.values(db.weeks).forEach((w) => Object.values(w.cardOv || {}).forEach(fix));
  }
  mergeOwn(); relabel(); autofill(); save();
  // the intro, once (tests run with ?intro=0)
  if (!db.introSet && !/[?&]intro=0/.test(location.search) && !navigator.webdriver) setTimeout(showIntro, 300);
  if (/[?&]intro=1/.test(location.search)) setTimeout(showIntro, 300);
  // efter en opdatering: vis det nye én gang (nye brugere ser introduktionen i stedet)
  if (!db.introSet && NYT[0] && !db.nytSet) { db.nytSet = NYT[0].id; save(); }
  else if (db.introSet && NYT[0] && (db.nytSet || '') < NYT[0].id && !/[?&]intro=0/.test(location.search) && !navigator.webdriver) setTimeout(() => showNyt(false), 600);
  if (/[?&]nyt=1/.test(location.search)) setTimeout(() => showNyt(true), 300);
  // offline and installable: only where the page is served over https (or localhost) from its own origin
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').then((reg) => {
      const offer = (w) => { if (!w || !navigator.serviceWorker.controller) return; toast('Der er en ny version af appen.'); const el = document.getElementById('toast'); el.insertAdjacentHTML('beforeend', '<button type="button" class="toast__undo" data-reload>Opdater</button>'); clearTimeout(el._t); };
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {}));
    document.addEventListener('click', (e) => { if (e.target.closest('[data-reload]')) location.reload(); });
  }
  render();
})();
