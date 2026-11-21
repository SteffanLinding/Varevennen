// Basic kitchen techniques, linked from the recipe steps.
// match: when a recipe step's text matches, the step gets a "Se hvordan" link.
// alle: shown once before the steps of any recipe with raw meat, fish or eggs.
// trin: the frames of the little film; vare = which item's picture to show in the frame.
// video: key into window.VIDEOER (free videos from Wikimedia Commons, credited on the page).
window.TEKNIKKER = {
  'raat-koed': {
    navn: 'Råt kød og grønt for sig', kort: 'Så bakterier fra råt kød ikke kommer over i salaten.',
    alle: /kød|kylling|fisk|kotelet|flæsk|frikadel|høne|bøf|fars|pølse/i, video: ['adskil', 'haender'],
    trin: [
      { t: 'Vask hænder med sæbe, før du går i gang.' },
      { t: 'Skær grønt først og kød bagefter. Eller brug to skærebrætter.', vare: 'Gulerødder' },
      { t: 'Hold råt kød og kødsaft væk fra det, der ikke skal steges eller koges.', vare: 'Hakket svinekød' },
      { t: 'Vask bræt, kniv og hænder med varmt vand og sæbe, når du har rørt råt kød.' },
      { t: 'Læg aldrig det stegte kød tilbage på den tallerken, det rå kød lå på.' }
    ],
    tip: 'Kylling og hakket kød skal altid steges helt igennem. Se "Er kødet stegt igennem?".'
  },
  'slaa-aeg': {
    navn: 'Slå et æg ud og fjern skaller', kort: 'Uden skal i maden, og uden at ét dårligt æg ødelægger resten.',
    match: /(^|[^a-zæøå])æg([^a-zæøå]|$)|æggene|spejlæg/i, video: ['aeg'],
    trin: [
      { t: 'Slå ægget mod en flad bordplade, ikke mod kanten af skålen. Så knuses skallen mindre.', vare: 'Æg' },
      { t: 'Hold ægget over en kop, sæt tommelfingrene i revnen, og træk skallen fra hinanden.' },
      { t: 'Er der skal i, så fisk den op med en halv æggeskal. Den skærer bedre end en ske.' },
      { t: 'Slå hvert æg ud i en kop for sig, før det kommer i maden.' },
      { t: 'Vask hænder, når du har rørt rå æg.' }
    ],
    tip: 'Et frisk æg lugter ikke. Lugter det, så smid det ud og vask koppen.'
  },
  'hvid-sovs': {
    navn: 'Hvid sovs (opbagning)', kort: 'Smør, mel og mælk til en jævn sovs uden klumper.',
    match: /smelt smør, rør mel|rør mel i fedtstoffet|rør resten af melet i|jævn/i,
    trin: [
      { t: 'Smelt smøret i en gryde ved middel varme. Det må boble, men ikke blive brunt.', vare: 'Smør' },
      { t: 'Rør melet i med et piskeris, og lad det boble 1 minut.', vare: 'Hvedemel' },
      { t: 'Hæld lidt kold mælk i ad gangen, og pisk hele tiden. Så kommer der ingen klumper.', vare: 'Mælk' },
      { t: 'Lad sovsen koge og simre 3-5 minutter, mens du rører. Den bliver tykkere, når den koger.' },
      { t: 'Smag til med salt. Er den for tyk, så pisk lidt mere mælk i.' }
    ],
    tip: 'Klumper alligevel? Pisk kraftigt, eller hæld sovsen gennem en sigte.'
  },
  'hak-loeg': {
    navn: 'Hak et løg', kort: 'Små tern uden at skære fingrene.',
    match: /hakket løg|hakkede løg|løg i tern|og løg i|kartofler og løg/i,
    trin: [
      { t: 'Skær toppen af, og skær løget midt over gennem rodenden.', vare: 'Løg' },
      { t: 'Pil den yderste skal af.' },
      { t: 'Læg snitfladen ned. Skær snit på langs, men lad roden holde sammen på det.' },
      { t: 'Skær på tværs, så det falder fra hinanden i tern.' },
      { t: 'Hold fingrene bøjet ind, så kniven går mod knoerne og ikke fingerspidserne.' }
    ]
  },
  'riv': {
    navn: 'Riv gulerod, løg og kål', kort: 'På den grove side af rivejernet.',
    match: /revet|\briv\b/i,
    trin: [
      { t: 'Skræl eller skyl grøntsagen.', vare: 'Gulerødder' },
      { t: 'Stil rivejernet på et bræt, og hold godt fast i toppen.' },
      { t: 'Riv nedad på den grove side.' },
      { t: 'Stop, før fingrene kommer tæt på. Den sidste stump kan hakkes med kniv.' }
    ]
  },
  'brun-koed': {
    navn: 'Brun hakket kød', kort: 'Brunt og krummet, ikke gråt og kogt.',
    match: /brun kødet/i,
    trin: [
      { t: 'Varm panden godt op med lidt olie.' },
      { t: 'Kom kødet på, og del det i stykker med en grydeske.', vare: 'Hakket oksekød' },
      { t: 'Lad det ligge et par minutter, så det får farve, før du rører.' },
      { t: 'Rør og steg videre, til der ikke er noget rødt tilbage.' }
    ],
    tip: 'Kommer der meget væde, er panden for kold eller for fuld. Steg i to omgange.'
  },
  'steg-gennem': {
    navn: 'Er kødet stegt igennem?', kort: 'Sådan ser du, at kylling, frikadeller og fisk er færdige.',
    match: /gennem|steg (dem|kyllingen|fisken|flæsket|kylling)|steg et|på hver side/i,
    trin: [
      { t: 'Skær det tykkeste stykke over på midten.', vare: 'Kylling' },
      { t: 'Kylling: hvid hele vejen igennem, og kødsaften er klar, ikke rosa.' },
      { t: 'Frikadeller og hakket kød: ingen rosa i midten.', vare: 'Hakket svinekød' },
      { t: 'Fisk: hvid og falder fra hinanden i flager.', vare: 'Fiskefilet' },
      { t: 'Har I et stegetermometer: 75 °C i midten.' }
    ]
  },
  'form-farse': {
    navn: 'Form frikadeller og bøffer', kort: 'Så de hænger sammen og ikke sætter sig fast.',
    match: /\bform\b|farsen hvile/i,
    trin: [
      { t: 'Lad farsen hvile koldt i 15 minutter. Så hænger den bedre sammen.', vare: 'Hakket svinekød' },
      { t: 'Dyp en spiseske i det varme fedt på panden, så slipper farsen skeen.' },
      { t: 'Form en aflang bolle mod kanten af skålen, og læg den på panden.' },
      { t: 'Vend dem først, når de slipper panden af sig selv.' }
    ]
  },
  'paner': {
    navn: 'Panér i æg og rasp', kort: 'En sprød skorpe, der bliver siddende.',
    match: /rasp/i,
    trin: [
      { t: 'Stil to dybe tallerkener frem: sammenpisket æg i den ene, rasp i den anden.', vare: 'Rasp' },
      { t: 'Vend kødet i ægget, og lad det dryppe af.', vare: 'Æg' },
      { t: 'Tryk det ned i raspen på begge sider.' },
      { t: 'Steg ved middel varme, så raspen ikke bliver sort, før kødet er færdigt.' }
    ]
  },
  'kog-pasta': {
    navn: 'Kog pasta og nudler', kort: 'Rigeligt vand, og smag før du hælder fra.',
    match: /kog (pasta|pastaen|nudlerne)|kog pasta/i, video: ['pasta'],
    trin: [
      { t: 'Kog rigeligt vand: cirka 1 liter pr. 100 g pasta.' },
      { t: 'Kom salt i, og rør pastaen i med det samme, så den ikke klistrer.', vare: 'Pasta' },
      { t: 'Kog den tid, der står på posen. Smag et stykke et minut før.' },
      { t: 'Hæld den i en sigte. Gem en kop kogevand, hvis sovsen er for tyk.' }
    ]
  },
  'kog-ris': {
    navn: 'Kog ris', kort: 'Løse ris med låg på og ro på.',
    match: /risene/i, video: ['ris'],
    trin: [
      { t: 'Kom 1 del ris og 2 dele vand i en gryde, eller følg posen.', vare: 'Ris' },
      { t: 'Kog op, og skru ned på laveste blus. Låg på.' },
      { t: 'Lad dem trække 12-15 minutter uden at løfte låget.' },
      { t: 'Lad dem stå 5 minutter, og løs dem med en gaffel.' }
    ]
  },
  'kog-kartofler': {
    navn: 'Kog kartofler', kort: 'Lige store stykker, så de bliver færdige samtidig.',
    match: /kog (\w+ )?kartof|skræl kartof/i, video: ['kartofler'],
    trin: [
      { t: 'Skræl kartoflerne, eller skrub dem rene.', vare: 'Kartofler' },
      { t: 'Skær store kartofler over, så de er lige store.' },
      { t: 'Kom dem i koldt vand med salt, og kog op.' },
      { t: 'Kog 15-20 minutter. De er færdige, når en kniv glider let ind.' },
      { t: 'Hæld vandet fra med låget på skrå.' }
    ]
  },
  'simre': {
    navn: 'Simre', kort: 'Lige under kogepunktet, med små bobler.',
    match: /simre/i,
    trin: [
      { t: 'Kog op.' },
      { t: 'Skru ned, til der kun kommer få, små bobler.' },
      { t: 'Rør af og til, så det ikke brænder på i bunden.' }
    ]
  },
  'skum': {
    navn: 'Skum suppen', kort: 'Fjern det grå skum, så suppen bliver klar.',
    match: /skum/i,
    trin: [
      { t: 'Det grå skum kommer op de første 20 minutter.', vare: 'Suppehøne' },
      { t: 'Tag det af med en hulske eller en ske, og kom det i en kop.' },
      { t: 'Det er ikke farligt, men suppen bliver klarere.' }
    ]
  },
  'melboller': {
    navn: 'Melboller', kort: 'Bløde boller til suppen.',
    match: /melboller/i,
    trin: [
      { t: 'Kog smør og mælk op i en gryde.', vare: 'Smør' },
      { t: 'Kom melet i på én gang, og rør, til dejen slipper gryden.', vare: 'Hvedemel' },
      { t: 'Lad dejen køle af i 10 minutter.' },
      { t: 'Pisk æggene i et ad gangen.', vare: 'Æg' },
      { t: 'Form små boller med to teskeer, og kog dem, til de flyder op.' }
    ]
  },
  'skaer-koed': {
    navn: 'Skær kød i tern og strimler', kort: 'Lige store stykker, så de bliver færdige samtidig.',
    match: /skær (kyllingen|pølserne|dem)|kylling i strimler|i tern|pil kødet/i,
    trin: [
      { t: 'Brug et bræt, der kun er til kød, og en skarp kniv.', vare: 'Kylling' },
      { t: 'Skær først i skiver, så tykke som stykkerne skal være.' },
      { t: 'Skær skiverne på langs til strimler, eller på tværs til tern.' },
      { t: 'Vask hænder, bræt og kniv bagefter, hvis kødet var råt.' }
    ]
  },
  'snit-groent': {
    navn: 'Snit salat og grønt', kort: 'Skyl, tør og skær i mundrette stykker.',
    match: /snit|porrer i skiver|hak persillen|agurk/i,
    trin: [
      { t: 'Skyl grøntsagerne i koldt vand. Porrer skal skylles mellem lagene.', vare: 'Salat' },
      { t: 'Ryst eller dup dem tørre, så dressingen bliver siddende.' },
      { t: 'Skær tomater og agurk i både eller skiver på et rent bræt.', vare: 'Agurk' },
      { t: 'Hak krydderurter fint med kniven i en vippende bevægelse.', vare: 'Persille' }
    ]
  },
  'ovn': {
    navn: 'Brug ovnen', kort: 'Tænd den i god tid, og brug grillhandsker.',
    match: /ovnen|bag ved|bag (pizza|pommes|forår)/i,
    trin: [
      { t: 'Tænd ovnen 10-15 minutter før, så den er varm, når maden skal ind.' },
      { t: 'Varmluft: skru 20 grader ned i forhold til almindelig over- og undervarme.' },
      { t: 'Sæt fadet i midten af ovnen, medmindre opskriften siger andet.' },
      { t: 'Brug grillhandsker, når du tager det ud, og sæt det på en bordskåner.' }
    ]
  },
  'kog-i-bouillon': {
    navn: 'Kog i bouillon', kort: 'Kød og boller trækker smag fra vandet.',
    match: /med bouillon|i vand med/i,
    trin: [
      { t: 'Kom vand og bouillon i gryden, og kog op.', vare: 'Bouillon' },
      { t: 'Kom kødet eller bollerne i, og skru ned, så det kun simrer.' },
      { t: 'Kog den tid, opskriften siger. Boller er færdige, når de flyder op.' },
      { t: 'Gem kogevandet, hvis det skal bruges til sovsen.' }
    ]
  },
  'airfryer': {
    navn: 'Brug airfryeren', kort: 'Sprødt uden frituregryde. Luften skal kunne komme rundt.',
    match: /airfryer|kurven/i,
    trin: [
      { t: 'Varm airfryeren op i 3 minutter, hvis den har brug for det.' },
      { t: 'Læg maden i ét lag. Er kurven for fuld, bliver det dampet i stedet for sprødt.', vare: 'Pommes frites' },
      { t: 'Vend det i lidt olie først, så det får farve.' },
      { t: 'Ryst kurven eller vend maden halvvejs.' },
      { t: 'Kød skal stadig være gennemstegt. Skær det tykkeste stykke over, og tjek.', vare: 'Kylling' }
    ]
  },
  'blend': {
    navn: 'Blend en varm suppe', kort: 'Glat suppe uden at sprøjte.',
    match: /blend/i,
    trin: [
      { t: 'Tag gryden af varmen, og lad suppen køle et par minutter.' },
      { t: 'Med stavblender: hold den helt nede i suppen, før du tænder.' },
      { t: 'Med blender: fyld den højst halvt, og hold et viskestykke over låget.' },
      { t: 'Hæld suppen tilbage, og varm den op igen.' }
    ]
  }
};
