// "Er den frisk?": how to pick good food in the shop and what to leave on the shelf.
// Plain, general advice written for the app. It is not a guarantee: when in doubt, leave it.
// godt = signs of a good one, undgaa = signs to leave it, tip = storage or what can still be eaten.
window.FRISK = {
  datoer: [
    { h: 'Sidste anvendelsesdato', t: 'Står på kød, fisk og andre letfordærvelige varer. Efter datoen skal maden smides ud, også selvom den ser fin ud.' },
    { h: 'Mindst holdbar til', t: 'Står på fx mælk, æg og tørvarer. Det er en kvalitetsdato. Maden er ofte god lidt længere, hvis den har stået rigtigt, og ser, lugter og smager normalt.' },
    { h: 'Altid først', t: 'Tag varen bagerst på hylden, hvis datoen er vigtig. Kig på datoen, før den kommer i kurven.' }
  ],
  kategorier: ['Frugt og grønt', 'Kød og fisk', 'Mejeri og æg', 'Brød og tørvarer'],
  varer: {
    'Kartofler': { kat: 'Frugt og grønt', godt: ['Faste og hele', 'Glat, tør skræl', 'Ensartet farve'], undgaa: ['Grønne pletter eller grøn skræl', 'Spirer og rynker', 'Bløde eller våde steder, mug eller sur lugt'], tip: 'Små grønne pletter og spirer kan skæres rigeligt væk. Er kartoflen grøn flere steder eller smager bitter, så smid den ud. Opbevares mørkt og køligt.' },
    'Nye kartofler': { kat: 'Frugt og grønt', godt: ['Faste, tynd skræl der kan gnides af', 'Hele og tørre'], undgaa: ['Bløde, våde eller grønne', 'Mug eller sur lugt'], tip: 'Nye kartofler holder kortere tid end almindelige. Brug dem inden for få dage.' },
    'Søde kartofler': { kat: 'Frugt og grønt', godt: ['Faste og tunge', 'Glat skræl'], undgaa: ['Bløde, mørke pletter', 'Rynker eller mug'], tip: 'Opbevares tørt og ikke i køleskabet.' },
    'Løg': { kat: 'Frugt og grønt', godt: ['Faste og tunge', 'Tør, raslende skal'], undgaa: ['Bløde steder', 'Sort støv eller mug', 'Lange grønne spirer og sur lugt'], tip: 'Et løg med en lille grøn spire kan stadig bruges, men er ofte mindre sprødt.' },
    'Rødløg': { kat: 'Frugt og grønt', godt: ['Faste og tørre', 'Glat, blank skal'], undgaa: ['Bløde pletter', 'Mug eller spirer'] },
    'Hvidløg': { kat: 'Frugt og grønt', godt: ['Hele, faste hoveder', 'Tør, tæt skal'], undgaa: ['Bløde fed', 'Grønne spirer inde i fedet (bitre)', 'Mug eller tørre, hule fed'] },
    'Gulerødder': { kat: 'Frugt og grønt', godt: ['Faste og knasende', 'Ensartet orange farve'], undgaa: ['Bløde, gummiagtige eller slimede', 'Hvide, tørre striber', 'Mug'], tip: 'Er de bare lidt bløde, men ellers fine, er de gode til suppe og gryderetter. Slimede skal smides ud.' },
    'Porre': { kat: 'Frugt og grønt', godt: ['Hvidt, fast skaft', 'Friske grønne blade'], undgaa: ['Gule eller visne blade', 'Bløde eller slimede steder'], tip: 'Skyl mellem lagene, der gemmer sig jord.' },
    'Hvidkål': { kat: 'Frugt og grønt', godt: ['Tung og fast', 'Tætte, friske blade'], undgaa: ['Sorte pletter', 'Slimede eller våde blade', 'Stærk, sur lugt'], tip: 'De yderste løse blade kan fjernes, hvis resten er fast og frisk.' },
    'Rødkål': { kat: 'Frugt og grønt', godt: ['Tung og fast', 'Dyb, ensartet farve'], undgaa: ['Slimede blade', 'Sorte eller bløde pletter'] },
    'Tomater': { kat: 'Frugt og grønt', godt: ['Lidt faste ved let tryk', 'Dyb farve og sød duft ved stilken'], undgaa: ['Skrumpne eller rynkede', 'Bløde, mørke pletter', 'Mug ved stilken eller væske der løber'], tip: 'Opbevares ved stuetemperatur, ikke i køleskabet, så smagen bliver bedre.' },
    'Agurk': { kat: 'Frugt og grønt', godt: ['Fast hele vejen', 'Ensartet grøn'], undgaa: ['Bløde ender', 'Gule eller skrumpne steder', 'Slimet overflade'] },
    'Salat': { kat: 'Frugt og grønt', godt: ['Sprøde, friske blade', 'Lys, ensartet farve'], undgaa: ['Slimede, brune eller glasagtige blade', 'Sur lugt', 'Væske i posen'], tip: 'Salat i pose: tjek datoen og at posen er hel. Skyl også den, hvis der ikke står "klar til brug".' },
    'Spinat': { kat: 'Frugt og grønt', godt: ['Mørkegrønne, faste blade'], undgaa: ['Gule, slimede eller våde blade', 'Sur lugt', 'Væske i posen'] },
    'Persille': { kat: 'Frugt og grønt', godt: ['Friske grønne blade', 'Faste stilke'], undgaa: ['Gule, visne eller slimede blade'], tip: 'Sæt stilkene i et glas vand i køleskabet, så holder den længere.' },
    'Broccoli': { kat: 'Frugt og grønt', godt: ['Mørkegrønne, faste buketter', 'Fast stok'], undgaa: ['Gule blomster', 'Bløde eller slimede steder', 'Stærk lugt'] },
    'Blomkål': { kat: 'Frugt og grønt', godt: ['Hvid eller cremet, tæt hoved', 'Friske blade'], undgaa: ['Mange brune eller sorte pletter', 'Bløde steder', 'Stærk lugt'], tip: 'Få lette pletter kan skæres væk.' },
    'Peberfrugt': { kat: 'Frugt og grønt', godt: ['Faste og blanke', 'Tunge for størrelsen'], undgaa: ['Rynkede eller bløde', 'Bløde pletter eller mug'] },
    'Squash': { kat: 'Frugt og grønt', godt: ['Fast og glat', 'Tung for størrelsen'], undgaa: ['Bløde eller våde pletter', 'Rynker eller mug'] },
    'Asparges': { kat: 'Frugt og grønt', godt: ['Faste, glatte stænger', 'Lukkede, tætte spidser'], undgaa: ['Bløde eller slimede', 'Åbne, spredte spidser', 'Tørre, træagtige ender'], tip: 'Knæk den træagtige ende af, hvor den knækker af sig selv.' },
    'Rødbeder': { kat: 'Frugt og grønt', godt: ['Faste og glatte', 'Dyb farve'], undgaa: ['Bløde eller skrumpne', 'Mug'] },
    'Champignon': { kat: 'Frugt og grønt', godt: ['Faste, tørre hatte', 'Lys, ensartet farve'], undgaa: ['Slimede eller våde', 'Mørke, bløde pletter', 'Sur lugt'] },
    'Svampe': { kat: 'Frugt og grønt', godt: ['Faste og tørre', 'Frisk, jordagtig duft'], undgaa: ['Slimede eller våde', 'Mørke pletter', 'Sur lugt'] },
    'Citron': { kat: 'Frugt og grønt', godt: ['Tung for størrelsen', 'Lidt fast, blank skal'], undgaa: ['Hård og tør', 'Bløde pletter eller mug'] },
    'Æbler': { kat: 'Frugt og grønt', godt: ['Faste og hele', 'Glat, uden bløde mærker'], undgaa: ['Bløde, brune pletter', 'Rynker eller mug', 'Huller'], tip: 'Ét dårligt æble får de andre til at blive dårlige hurtigere. Tag det væk.' },
    'Bananer': { kat: 'Frugt og grønt', godt: ['Gule med få brune pletter', 'Hele'], undgaa: ['Helt sorte eller meget bløde', 'Lækker væske', 'Mug ved stilken'], tip: 'Brune pletter betyder, at den er moden og sød. Fine til bananbrød, når de er meget brune.' },
    'Jordbær': { kat: 'Frugt og grønt', godt: ['Dybrøde hele vejen rundt', 'Friske grønne toppe', 'Sød duft'], undgaa: ['Mug (tjek hele bakken)', 'Bløde og våde', 'Væske i bunden af bakken'], tip: 'Ét muggent jordbær i bakken betyder, at de andre hurtigt følger efter. Smid de muggne ud, og brug resten hurtigt.' },
    'Rabarber': { kat: 'Frugt og grønt', godt: ['Faste, sprøde stilke', 'Rød eller lysegrøn, glat'], undgaa: ['Bløde, slappe eller tørre', 'Slimede steder'], tip: 'Bladene må ikke spises. Kun stilkene.' },
    'Grønkål': { kat: 'Frugt og grønt', godt: ['Mørkegrønne, faste blade'], undgaa: ['Gule, slappe eller slimede blade'] },
    'Hokkaidogræskar': { kat: 'Frugt og grønt', godt: ['Tung og fast', 'Tør, hård stilk'], undgaa: ['Bløde pletter', 'Huller i skrællen', 'Mug'] },
    'Majskolber': { kat: 'Frugt og grønt', godt: ['Grønne, tætte blade', 'Faste, saftige kerner'], undgaa: ['Tørre, brune blade', 'Skrumpne kerner', 'Mug'] },
    'Ingefær': { kat: 'Frugt og grønt', godt: ['Fast, med glat, tynd skræl'], undgaa: ['Rynket eller blød', 'Mug eller våde steder'] },

    'Kylling': { kat: 'Kød og fisk', godt: ['Lyserødt, fast kød', 'Hel, tæt pakke', 'Kold varen'], undgaa: ['Grå eller slimet kød', 'Sur lugt', 'Meget væske i pakken eller en oppustet pakke'], tip: 'Tjek sidste anvendelsesdato. Kyllingen skal stegt helt igennem.' },
    'Hakket svinekød': { kat: 'Kød og fisk', godt: ['Frisk lyserød farve', 'Hel, tæt pakke', 'Kold varen'], undgaa: ['Slimet overflade', 'Sur lugt', 'Oppustet pakke'], tip: 'Tjek sidste anvendelsesdato. Hakket kød skal være stegt helt igennem.' },
    'Hakket oksekød': { kat: 'Kød og fisk', godt: ['Frisk rød farve', 'Hel, tæt pakke', 'Kold varen'], undgaa: ['Slimet overflade', 'Sur lugt', 'Oppustet pakke'], tip: 'Lidt gråt indeni er normalt, hvis lugten er fin. Sur lugt betyder, at det skal smides ud.' },
    'Fiskefilet': { kat: 'Kød og fisk', godt: ['Ren lugt af hav', 'Fast, skinnende kød', 'Hel pakke'], undgaa: ['Stærk fiskelugt eller lugt af ammoniak', 'Slimet eller mat', 'Frostskader og is i pakken, hvis den er optøet'], tip: 'Tjek sidste anvendelsesdato. Frossen fisk skal være helt frossen.' },
    'Laks': { kat: 'Kød og fisk', godt: ['Fast, skinnende kød', 'Ren lugt af hav'], undgaa: ['Slimet, mat eller blødt', 'Stærk lugt'], tip: 'Tjek sidste anvendelsesdato.' },
    'Pølser': { kat: 'Kød og fisk', godt: ['Hel pakke', 'Fast pølse'], undgaa: ['Slimet væske', 'Sur lugt', 'Oppustet pakke'], tip: 'Tjek sidste anvendelsesdato.' },
    'Flæsk i skiver': { kat: 'Kød og fisk', godt: ['Hvidt, fast fedt', 'Lyserødt kød'], undgaa: ['Gult eller harskt fedt', 'Slimet', 'Sur lugt'], tip: 'Tjek sidste anvendelsesdato.' },
    'Svinekoteletter': { kat: 'Kød og fisk', godt: ['Lyst kød med hvidt fedt', 'Kold, hel pakke'], undgaa: ['Grå eller slimet', 'Sur lugt'], tip: 'Tjek sidste anvendelsesdato.' },

    'Æg': { kat: 'Mejeri og æg', godt: ['Hele, rene skaller', 'Æggebakken er tør'], undgaa: ['Revnede eller smatte æg', 'Klistret bakke'], tip: 'Åbn æsken i butikken, og tjek alle æggene. Mindst holdbar til er en kvalitetsdato.' },
    'Mælk': { kat: 'Mejeri og æg', godt: ['Datoen langt fremme', 'Kold hylde', 'Hel, tæt pakke'], undgaa: ['Opsvulmet eller utæt pakke', 'Datoen er overskredet'], tip: 'Er mælken sur af lugt eller har klumper, så smid den ud. Hold den i køleskab.' },
    'Smør': { kat: 'Mejeri og æg', godt: ['Hel, tæt indpakning', 'Ensartet farve'], undgaa: ['Misfarvet eller hård kant', 'Harsk lugt'] },
    'Revet ost': { kat: 'Mejeri og æg', godt: ['Hel pose, fri for væske', 'Datoen langt fremme'], undgaa: ['Mug', 'Klumper og våd ost', 'Opsvulmet pose'] },
    'Feta': { kat: 'Mejeri og æg', godt: ['Hvid, fast ost', 'Hel pakke i lage'], undgaa: ['Gul eller slimet', 'Sur lugt', 'Grumset lage'] },
    'Mozzarella': { kat: 'Mejeri og æg', godt: ['Hvid, fast kugle', 'Hel pakke'], undgaa: ['Sur lugt', 'Gul eller slimet overflade'] },
    'Græsk yoghurt': { kat: 'Mejeri og æg', godt: ['Datoen langt fremme', 'Hel og kold'], undgaa: ['Opsvulmet låg', 'Mug', 'Sur lugt'] },

    'Hotdogbrød': { kat: 'Brød og tørvarer', godt: ['Bløde, luftige', 'Hel pose'], undgaa: ['Mug', 'Hårde eller klamme'] },
    'Pitabrød': { kat: 'Brød og tørvarer', godt: ['Bløde og bøjelige', 'Hel pose'], undgaa: ['Mug', 'Hårde eller klamme'] },
    'Tortillas': { kat: 'Brød og tørvarer', godt: ['Bløde og bøjelige', 'Hel pose'], undgaa: ['Mug', 'Hårde eller revnede'] },
    'Pasta': { kat: 'Brød og tørvarer', godt: ['Hel pakke uden huller', 'Tørre, hele stykker'], undgaa: ['Fugt i pakken', 'Små dyr eller spind', 'Muffen lugt'] },
    'Ris': { kat: 'Brød og tørvarer', godt: ['Hel, tør pose'], undgaa: ['Fugt i posen', 'Små dyr eller spind', 'Muffen lugt'] },
    'Hvedemel': { kat: 'Brød og tørvarer', godt: ['Hel, tør pose'], undgaa: ['Klumper af fugt', 'Små dyr eller spind', 'Muffen lugt'] }
  },
  // used for the dishes' ingredient pictures when a guide has no item of its own
  generel: {
    godt: ['Hel og ren emballage', 'Frisk farve og duft', 'Kold, hvis den hører hjemme i køleskab'],
    undgaa: ['Mug, slim eller sur lugt', 'Opsvulmet eller utæt pakke', 'Datoen er overskredet (sidste anvendelsesdato)']
  }
};
