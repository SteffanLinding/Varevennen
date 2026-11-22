// Typical nutrition per 100 g, used when an item has no product with Open Food Facts data.
// Rounded everyday values (kcal, protein, carbohydrate, fat). The app always shows the result as "ca.".
// vaegt: grams in one piece (stk), can, bunch etc. for that item, so recipe amounts can be counted.
window.NAERING = {
  typisk: {
    'Mælk': [46, 3.5, 4.7, 1.5], 'Æg': [140, 12.5, 0.7, 9.7], 'Smør': [740, 0.6, 0.6, 82], 'Revet ost': [330, 25, 1, 25],
    'Hakket svinekød': [210, 18, 0, 15], 'Hakket oksekød': [190, 19, 0, 12], 'Kylling': [120, 22, 0, 3], 'Pølser': [250, 12, 3, 21], 'Fiskefilet': [80, 18, 0, 1],
    'Svinekoteletter': [190, 20, 0, 12], 'Flæsk i skiver': [440, 14, 0, 43], 'Suppehøne': [170, 20, 0, 10], 'Laks': [200, 20, 0, 13], 'Skinke': [120, 19, 1, 4],
    'Kyllingespyd': [140, 21, 2, 5], 'Flæskesteg': [270, 18, 0, 22],
    'Løg': [40, 1.1, 8, 0.1], 'Gulerødder': [40, 0.9, 8, 0.2], 'Porre': [30, 1.5, 5, 0.3], 'Hvidkål': [30, 1.3, 5, 0.1], 'Kartofler': [80, 2, 17, 0.1], 'Nye kartofler': [70, 1.7, 15, 0.1],
    'Salat': [15, 1.2, 2, 0.2], 'Tomater': [20, 0.9, 3.5, 0.2], 'Agurk': [12, 0.7, 2, 0.1], 'Persille': [40, 3, 6, 0.8], 'Broccoli': [35, 3, 4, 0.4], 'Blomkål': [25, 2, 3, 0.3],
    'Hvidløg': [140, 6, 28, 0.5], 'Citron': [30, 1, 7, 0.3], 'Ingefær': [80, 1.8, 18, 0.8], 'Rødløg': [40, 1.1, 9, 0.1], 'Peberfrugt': [30, 1, 5, 0.3], 'Squash': [17, 1.2, 3, 0.3],
    'Søde kartofler': [86, 1.6, 20, 0.1], 'Spinat': [23, 2.9, 1.4, 0.4], 'Champignon': [22, 3, 3, 0.3], 'Æbler': [52, 0.3, 14, 0.2], 'Bananer': [89, 1.1, 23, 0.3],
    'Grønkål': [49, 4.3, 9, 0.9], 'Hokkaidogræskar': [40, 1, 8, 0.1], 'Svampe': [22, 3, 3, 0.3], 'Rødkål': [30, 1.4, 6, 0.2], 'Majskolber': [96, 3.4, 21, 1.5],
    'Jordbær': [32, 0.7, 7.7, 0.3], 'Rabarber': [21, 0.9, 4.5, 0.2],
    'Asparges': [20, 2.2, 2, 0.1], 'Rødbeder': [60, 1, 13, 0.1], 'Syltede agurker': [40, 0.5, 9, 0.1], 'Pasta': [355, 12, 72, 1.5], 'Lasagneplader': [355, 12, 72, 1.5], 'Nudler': [360, 11, 72, 2],
    'Ris': [355, 7, 79, 0.6], 'Risottoris': [350, 7, 79, 0.6], 'Couscous': [360, 13, 72, 1.5], 'Hvedemel': [340, 10, 70, 1.5], 'Rugmel': [320, 9, 66, 2], 'Rasp': [380, 12, 75, 4],
    'Havregryn': [370, 13, 59, 7], 'Hakkede tomater': [22, 1.2, 3.5, 0.2], 'Tomatpuré': [80, 4, 13, 0.5], 'Bouillon': [220, 10, 20, 10], 'Ketchup': [110, 1.2, 25, 0.2],
    'Sennep': [140, 6, 10, 8], 'Remoulade': [430, 1, 12, 42], 'Ristede løg': [600, 6, 40, 44], 'Soyasauce': [60, 8, 6, 0.1], 'Sød chilisauce': [220, 0.5, 52, 0.5],
    'Dressing': [300, 1, 10, 28], 'Kikærter': [120, 7, 15, 2.6], 'Kokosmælk': [180, 1.8, 3, 18], 'Rød karrypasta': [120, 2.5, 14, 6], 'Røde linser': [340, 24, 50, 1.5],
    'Kidneybønner': [105, 7, 15, 0.5], 'Majs': [80, 2.5, 15, 1], 'Gær': [100, 12, 6, 2], 'Sukker': [400, 0, 100, 0], 'Bagepulver': [100, 0, 25, 0], 'Kanel': [250, 4, 55, 1.2],
    'Gule ærter': [340, 24, 50, 2], 'Kammerjunkere': [470, 7, 70, 18],
    'Feta': [260, 15, 1, 21], 'Madlavningsfløde': [150, 3, 4, 13], 'Piskefløde': [340, 2, 3, 36], 'Græsk yoghurt': [110, 6, 4, 8], 'Mozzarella': [250, 18, 1, 19], 'Parmesan': [400, 33, 0, 29],
    'Kærnemælk': [37, 3.5, 4.5, 0.5],
    'Frosne grøntsager': [45, 2.5, 6, 0.5], 'Pommes frites': [150, 2.5, 22, 5], 'Frysepizza': [250, 10, 30, 10], 'Kyllingenuggets': [250, 14, 18, 14], 'Forårsruller': [220, 6, 28, 9],
    'Karry': [330, 12, 55, 14], 'Tarteletter': [520, 7, 55, 30], 'Hotdogbrød': [270, 8, 50, 4], 'Pitabrød': [270, 9, 55, 1.5], 'Tortillas': [300, 8, 50, 7]
  },
  // grams per piece, can, bunch or bag for the item; amounts in g, kg, dl, l, spsk and tsk are counted directly
  vaegt: {
    'Æg': 60, 'Løg': 150, 'Rødløg': 120, 'Gulerødder': 80, 'Porre': 200, 'Kartofler': 120, 'Tomater': 90, 'Agurk': 350, 'Salat': 300, 'Persille': 40, 'Broccoli': 400, 'Blomkål': 800,
    'Hvidløg': 5, 'Citron': 100, 'Ingefær': 30, 'Peberfrugt': 150, 'Squash': 300, 'Søde kartofler': 300, 'Æbler': 150, 'Bananer': 120, 'Hokkaidogræskar': 1200, 'Majskolber': 200,
    'Hvidkål': 1000, 'Rødkål': 1000, 'Hakkede tomater': 400, 'Kikærter': 240, 'Kidneybønner': 240, 'Majs': 285, 'Kokosmælk': 400, 'Asparges': 250, 'Rødbeder': 300,
    'Bouillon': 10, 'Tortillas': 40, 'Pitabrød': 80, 'Hotdogbrød': 45, 'Tarteletter': 15, 'Pølser': 60, 'Svinekoteletter': 180, 'Laks': 125, 'Mozzarella': 125,
    'Dressing': 60, 'Kammerjunkere': 200, 'Grønkål': 500, 'Suppehøne': 900, 'Frysepizza': 350, 'Kyllingenuggets': 20, 'Forårsruller': 60, 'Fiskefilet': 125, 'Kylling': 150
  },
  // the kind of thing an amount word means, when the item itself has no weight
  enhed: { dåse: 400, dåser: 400, pose: 250, poser: 250, pakke: 250, pakker: 250, bundt: 40, bdt: 40, fed: 5, terning: 10, terninger: 10, flaske: 60, spsk: 15, tsk: 5, knivspids: 1, skive: 25, skiver: 25 },
  kodvarer: ['Hakket svinekød', 'Hakket oksekød', 'Kylling', 'Pølser', 'Fiskefilet', 'Svinekoteletter', 'Flæsk i skiver', 'Suppehøne', 'Laks', 'Skinke', 'Kyllingespyd', 'Flæskesteg', 'Kyllingenuggets', 'Forårsruller', 'Frysepizza']
};
