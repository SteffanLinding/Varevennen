// Ready meals ("færdigretter"): dinners you buy ready, so the dish is one item with a varekort.
// Adds the items and dishes to the seed data, so planning, "vælg en ret for mig", reminders
// and shopping work like for any other dish. Load after data.js and opskrifter.js.
(() => {
  const S = window.SEED; const O = window.OPSKRIFTER = window.OPSKRIFTER || { opskrifter: {}, skab: [] };
  O.opskrifter = O.opskrifter || {};
  const ITEMS = [
    ['Færdig lasagne', 'Frost eller køl? Kød, kylling eller spinat? Størrelse (2 eller 4 portioner)?'],
    ['Færdig suppe', 'Tomat, ærter, grøntsager eller høns? På glas, dåse eller brik?'],
    ['Færdig pastaret', 'Carbonara, bolognese eller tortellini? Køl eller frost?'],
    ['Sushi', 'Hvilken boks? Laks, vegetar eller blandet? Antal stykker?'],
    ['Tærte', 'Quiche Lorraine, porre eller gedeost? Frost eller køl?'],
    ['Færdige frikadeller', 'Almindelige eller mini? Svin eller kalv? Køl eller frost?']
  ];
  // dish, items on the list, time, persons, amounts, steps
  const DISHES = [
    ['Pizza', ['Frysepizza'], '15 min', 2, { Frysepizza: '1 stk' }, ['Tænd ovnen efter pakken, ofte 200-220 °C.', 'Tag pizzaen ud af emballagen, og læg den på en rist eller plade.', 'Bag den efter pakken, typisk 10-15 min, til osten er gylden.', 'Drys evt. med oregano eller frisk rucola.']],
    ['Lasagne (færdig)', ['Færdig lasagne'], '45 min', 2, { 'Færdig lasagne': '1 pakke' }, ['Følg tilberedningen på pakken. Frossen lasagne skal ofte længere i ovnen end kølet.', 'Den er færdig, når den er varm hele vejen igennem, og osten er gylden.', 'Server med en grøn salat.']],
    ['Suppe (færdig)', ['Færdig suppe'], '10 min', 2, { 'Færdig suppe': '1 pakke' }, ['Hæld suppen i en gryde, og varm den forsigtigt op under omrøring.', 'Lad den næsten koge, men ikke bruse.', 'Server med brød, og drys evt. med friske krydderurter.']],
    ['Pastaret (færdig)', ['Færdig pastaret'], '15 min', 2, { 'Færdig pastaret': '1 pakke' }, ['Varm retten i en gryde, på panden eller i mikrobølgeovnen efter pakken.', 'Rør rundt undervejs, så den bliver ens varm.', 'Drys evt. med revet parmesan og peber.']],
    ['Sushi', ['Sushi'], '5 min', 2, { Sushi: '1 pakke' }, ['Tag sushien ud af køleskabet 10-15 min før, så smagen kommer frem.', 'Server med soja, wasabi og ingefær.', 'Spis den samme dag, og hold den kold, til den skal spises.']],
    ['Tærte (færdig)', ['Tærte'], '30 min', 2, { Tærte: '1 pakke' }, ['Varm tærten i ovnen efter pakken, ofte 20-25 min ved 200 °C.', 'Den er færdig, når den er varm i midten, og kanten er gylden.', 'Server med en grøn salat.']],
    ['Frikadeller (færdige)', ['Færdige frikadeller', 'Kartofler'], '25 min', 4, { 'Færdige frikadeller': '1 pakke', Kartofler: '800 g' }, ['Kog kartoflerne.', 'Varm frikadellerne på panden eller i ovnen efter pakken, til de er varme hele vejen igennem.', 'Server med kartofler og sovs eller rugbrød og pickles.']],
    ['Nuggets og pommes', ['Kyllingenuggets', 'Pommes frites'], '25 min', 2, { Kyllingenuggets: '16 stk', 'Pommes frites': '600 g' }, ['Tænd ovnen eller airfryeren efter pakkerne.', 'Bag nuggets og pommes frites, til de er gyldne og varme hele vejen igennem.', 'Server med ketchup og en salat.']]
  ];
  ITEMS.forEach(([navn, afklar]) => { if (!S.varer.some((v) => v.navn === navn)) S.varer.push({ navn, kategori: 'Færdigretter', afklar }); });
  window.FAERDIG_RETTER = DISHES.map((d) => d[0]);
  DISHES.forEach(([navn, varer, tid, personer, maengder, trin]) => {
    S.retter[navn] = varer;
    O.opskrifter[navn] = { tid, personer, maengder, trin, faerdig: true };
  });
})();
