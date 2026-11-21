// Recipe bank: ordinary everyday recipes, written for Vareven (not copied from any site or book).
// Amounts are for 4 people. "Fra skabet" (salt, pepper, oil) is not listed.
// A recipe the household takes from here is copied into their own cookbook, where they can change it.
window.OPSKRIFTSBANK = {
  kategorier: ['Sundt og let', 'Airfryer', 'Vegetar', 'Hurtigt, under 30 min', 'Supper', 'Børnevenligt', 'Bagning', 'Årstidens retter'],
  // seasons as Danes count them; a recipe can belong to several
  saesoner: { vinter: [12, 1, 2], 'forår': [3, 4, 5], sommer: [6, 7, 8], 'efterår': [9, 10, 11] },
  // items the 49 standard items do not cover, with the category they belong to on the list
  nyeVarer: {
    'Laks': 'Kød og fisk', 'Skinke': 'Kød og fisk',
    'Broccoli': 'Frugt og grønt', 'Blomkål': 'Frugt og grønt', 'Hvidløg': 'Frugt og grønt', 'Citron': 'Frugt og grønt', 'Ingefær': 'Frugt og grønt', 'Rødløg': 'Frugt og grønt', 'Peberfrugt': 'Frugt og grønt', 'Squash': 'Frugt og grønt', 'Søde kartofler': 'Frugt og grønt', 'Spinat': 'Frugt og grønt', 'Champignon': 'Frugt og grønt', 'Æbler': 'Frugt og grønt',
    'Feta': 'Mejeri og æg', 'Madlavningsfløde': 'Mejeri og æg', 'Græsk yoghurt': 'Mejeri og æg', 'Mozzarella': 'Mejeri og æg', 'Parmesan': 'Mejeri og æg',
    'Kikærter': 'Kolonial', 'Kokosmælk': 'Kolonial', 'Rød karrypasta': 'Kolonial', 'Røde linser': 'Kolonial', 'Kidneybønner': 'Kolonial', 'Majs': 'Kolonial', 'Couscous': 'Kolonial', 'Gær': 'Kolonial',
    'Tortillas': 'Brød',
    'Sukker': 'Kolonial', 'Havregryn': 'Kolonial', 'Bagepulver': 'Kolonial', 'Kanel': 'Krydderier', 'Bananer': 'Frugt og grønt', 'Rugmel': 'Kolonial',
    'Kærnemælk': 'Mejeri og æg', 'Kammerjunkere': 'Kolonial', 'Jordbær': 'Frugt og grønt', 'Rabarber': 'Frugt og grønt', 'Nye kartofler': 'Frugt og grønt',
    'Grønkål': 'Frugt og grønt', 'Gule ærter': 'Kolonial', 'Hokkaidogræskar': 'Frugt og grønt', 'Svampe': 'Frugt og grønt', 'Risottoris': 'Kolonial',
    'Rødkål': 'Frugt og grønt', 'Flæskesteg': 'Kød og fisk', 'Kyllingespyd': 'Kød og fisk', 'Majskolber': 'Frugt og grønt', 'Piskefløde': 'Mejeri og æg'
  },
  opskrifter: {
    'Ovnbagt laks med broccoli og kartofler': { kategori: 'Sundt og let', tid: '35 min', ing: [['600 g', 'Laks'], ['1 stk', 'Broccoli'], ['1 stk', 'Citron'], ['800 g', 'Kartofler']],
      trin: ['Tænd ovnen på 200 °C.', 'Kog kartoflerne.', 'Læg laksen i et fad, drys med salt, peber og revet citronskal, og bag den i 15-18 min.', 'Del broccolien i buketter, og kog den 3 min, eller bag den med laksen de sidste 8 min.', 'Server med citronbåde.'] },
    'Kyllingesalat med couscous og feta': { kategori: 'Sundt og let', tid: '25 min', ing: [['500 g', 'Kylling'], ['250 g', 'Couscous'], ['1 stk', 'Agurk'], ['250 g', 'Tomater'], ['150 g', 'Feta'], ['1 stk', 'Citron']],
      trin: ['Hæld kogende vand over couscousen, læg låg på, og lad den trække 5 min.', 'Skær kyllingen i strimler, og steg den gennem på panden med salt og peber.', 'Skær agurk og tomater i tern.', 'Vend det hele sammen med citronsaft og lidt olie, og smuldr feta over.'] },
    'Bagte søde kartofler med kikærter': { kategori: 'Sundt og let', tid: '45 min', ing: [['4 stk', 'Søde kartofler'], ['2 dåser', 'Kikærter'], ['300 g', 'Græsk yoghurt'], ['100 g', 'Spinat'], ['1 fed', 'Hvidløg']],
      trin: ['Tænd ovnen på 200 °C.', 'Prik kartoflerne med en gaffel, og bag dem i 40 min, til de er bløde.', 'Skyl kikærterne, vend dem i olie og salt, og bag dem de sidste 20 min.', 'Rør yoghurten med revet hvidløg og salt.', 'Flæk kartoflerne, og fyld dem med spinat, kikærter og yoghurt.'] },
    'Fisk i fad med tomat og spinat': { kategori: 'Sundt og let', tid: '30 min', ing: [['600 g', 'Fiskefilet'], ['1 dåse', 'Hakkede tomater'], ['150 g', 'Spinat'], ['2 fed', 'Hvidløg'], ['300 g', 'Ris']],
      trin: ['Tænd ovnen på 200 °C, og kog risene.', 'Rør tomaterne med presset hvidløg, salt og peber, og hæld dem i et fad.', 'Læg spinat og fisk ovenpå, og krydr fisken.', 'Bag i 15-20 min, til fisken er hvid hele vejen igennem.'] },

    'Sprøde kyllingelår i airfryer': { kategori: 'Airfryer', tid: '35 min', ing: [['1 kg', 'Kylling'], ['1 kg', 'Kartofler'], ['1 stk', 'Salat'], ['1 flaske', 'Dressing']],
      trin: ['Krydr kyllingelårene med salt, peber og paprika.', 'Skær kartoflerne i både, og vend dem i lidt olie og salt.', 'Kør kyllingen i airfryeren ved 190 °C i 25 min, og vend den halvvejs.', 'Kør kartoffelbådene ved 200 °C i 20 min, og ryst kurven et par gange.', 'Server med salat og dressing.'] },
    'Laks og søde kartofler i airfryer': { kategori: 'Airfryer', tid: '30 min', ing: [['500 g', 'Laks'], ['800 g', 'Søde kartofler'], ['1 stk', 'Broccoli'], ['1 stk', 'Citron']],
      trin: ['Skær de søde kartofler i tern, vend dem i olie og salt, og kør dem ved 200 °C i 15 min.', 'Læg laksen og broccolibuketterne i kurven, og kør videre i 8-10 min ved 180 °C.', 'Pres citron over, og server.'] },
    'Sprøde kyllingestrimler i airfryer': { kategori: 'Airfryer', tid: '30 min', ing: [['500 g', 'Kylling'], ['2 stk', 'Æg'], ['100 g', 'Rasp'], ['3 spsk', 'Hvedemel'], ['600 g', 'Pommes frites'], ['1 stk', 'Agurk']],
      trin: ['Skær kyllingen i strimler, og krydr med salt og peber.', 'Vend strimlerne i mel, så i sammenpisket æg og til sidst i rasp.', 'Kør dem ved 200 °C i 10-12 min, til de er gennemstegte, og vend dem halvvejs.', 'Kør pommes frites efter posens anvisning, og skær agurken i stave.'] },
    'Airfryer-grøntsager med feta og couscous': { kategori: 'Airfryer', tid: '25 min', ing: [['1 stk', 'Squash'], ['2 stk', 'Peberfrugt'], ['2 stk', 'Rødløg'], ['250 g', 'Champignon'], ['150 g', 'Feta'], ['250 g', 'Couscous']],
      trin: ['Skær grøntsagerne i grove stykker, og vend dem i olie, salt og peber.', 'Kør dem i airfryeren ved 200 °C i 15 min, og ryst kurven halvvejs.', 'Hæld kogende vand over couscousen, og lad den trække 5 min.', 'Smuldr feta over grøntsagerne, og server med couscous.'] },

    'Linsedahl med ris': { kategori: 'Vegetar', tid: '35 min', ing: [['300 g', 'Røde linser'], ['1 dåse', 'Kokosmælk'], ['1 dåse', 'Hakkede tomater'], ['1 stk', 'Løg'], ['2 fed', 'Hvidløg'], ['1 stk', 'Ingefær'], ['2 tsk', 'Karry'], ['300 g', 'Ris']],
      trin: ['Svits hakket løg, hvidløg og revet ingefær i olie, og rør karryen i.', 'Tilsæt linser, tomater, kokosmælk og 4 dl vand, og lad det simre 20 min.', 'Kog risene imens.', 'Smag dahlen til med salt og citron.'] },
    'Ovnbagt pasta med squash og mozzarella': { kategori: 'Vegetar', tid: '40 min', ing: [['400 g', 'Pasta'], ['1 stk', 'Squash'], ['2 dåser', 'Hakkede tomater'], ['125 g', 'Mozzarella'], ['1 stk', 'Løg']],
      trin: ['Tænd ovnen på 200 °C, og kog pastaen 2 min kortere end posen siger.', 'Svits hakket løg og squash i tern, tilsæt tomaterne, og lad det simre 10 min.', 'Vend pastaen i sovsen, hæld det i et fad, og riv mozzarella over.', 'Bag i 15 min, til osten er gylden.'] },
    'Chili sin carne': { kategori: 'Vegetar', tid: '35 min', ing: [['2 dåser', 'Kidneybønner'], ['1 dåse', 'Majs'], ['2 dåser', 'Hakkede tomater'], ['2 stk', 'Peberfrugt'], ['1 stk', 'Løg'], ['300 g', 'Ris']],
      trin: ['Svits hakket løg og peberfrugt i tern.', 'Tilsæt tomater, skyllede bønner, majs, spidskommen og chili, og lad det simre 20 min.', 'Kog risene imens.', 'Smag til med salt, og server med en klat yoghurt, hvis I har.'] },
    'Grøn karry med kikærter': { kategori: 'Vegetar', tid: '25 min', ing: [['2 dåser', 'Kikærter'], ['1 dåse', 'Kokosmælk'], ['2 spsk', 'Rød karrypasta'], ['1 stk', 'Broccoli'], ['1 stk', 'Peberfrugt'], ['300 g', 'Ris']],
      trin: ['Kog risene.', 'Steg karrypastaen i lidt olie et minut, og hæld kokosmælken ved.', 'Tilsæt kikærter, broccoli og peberfrugt i strimler, og lad det simre 8 min.', 'Smag til med salt og lidt citron.'] },

    'Pasta carbonara': { kategori: 'Hurtigt, under 30 min', tid: '20 min', ing: [['400 g', 'Pasta'], ['200 g', 'Flæsk i skiver'], ['3 stk', 'Æg'], ['50 g', 'Parmesan']],
      trin: ['Kog pastaen. Gem en kop af kogevandet.', 'Skær flæsket i strimler, og steg det sprødt.', 'Pisk æg og revet parmesan sammen med peber.', 'Vend den varme pasta i flæsket, tag panden af varmen, og rør æggemassen i med lidt kogevand, til det er cremet.'] },
    'Wraps med kylling': { kategori: 'Hurtigt, under 30 min', tid: '20 min', ing: [['8 stk', 'Tortillas'], ['400 g', 'Kylling'], ['1 stk', 'Salat'], ['250 g', 'Tomater'], ['1 dåse', 'Majs'], ['1 flaske', 'Dressing']],
      trin: ['Skær kyllingen i strimler, og steg den gennem med salt, peber og paprika.', 'Snit salat og tomater.', 'Varm tortillas på en tør pande eller i ovnen.', 'Fyld dem med kylling, grønt, majs og dressing, og rul dem sammen.'] },
    'Æggekage med flæsk': { kategori: 'Hurtigt, under 30 min', tid: '25 min', ing: [['8 stk', 'Æg'], ['1 dl', 'Mælk'], ['200 g', 'Flæsk i skiver'], ['250 g', 'Tomater'], ['2 spsk', 'Hvedemel'], ['1 bundt', 'Persille']],
      trin: ['Steg flæsket sprødt, og tag det af panden.', 'Pisk æg, mælk, mel, salt og peber sammen.', 'Hæld æggemassen på panden ved lav varme med låg på, og lad den stivne i 10 min.', 'Læg flæsk og tomatskiver ovenpå, og drys med hakket persille.'] },
    'Nudler med kylling og grønt': { kategori: 'Hurtigt, under 30 min', tid: '20 min', ing: [['250 g', 'Nudler'], ['400 g', 'Kylling'], ['500 g', 'Frosne grøntsager'], ['3 spsk', 'Soyasauce'], ['1 stk', 'Ingefær']],
      trin: ['Kog nudlerne, og skyl dem i koldt vand.', 'Steg kylling i strimler gennem på en varm pande.', 'Tilsæt grøntsagerne og revet ingefær, og steg et par minutter.', 'Vend nudler og soyasauce i, og varm det hele igennem.'] },

    'Tomatsuppe med pasta': { kategori: 'Supper', tid: '25 min', ing: [['2 dåser', 'Hakkede tomater'], ['1 stk', 'Løg'], ['1 terning', 'Bouillon'], ['1 dl', 'Madlavningsfløde'], ['150 g', 'Pasta']],
      trin: ['Svits hakket løg i lidt smør.', 'Tilsæt tomater, 5 dl vand og bouillon, og lad det simre 10 min.', 'Blend suppen, og rør fløden i.', 'Kog små pasta i suppen, til de er møre, og smag til med salt og peber.'] },
    'Kartoffel- og porresuppe': { kategori: 'Supper', tid: '35 min', ing: [['800 g', 'Kartofler'], ['3 stk', 'Porre'], ['2 terninger', 'Bouillon'], ['2 dl', 'Madlavningsfløde'], ['150 g', 'Flæsk i skiver']],
      trin: ['Skræl kartoflerne, og skær dem i tern. Skyl porrerne, og skær dem i skiver.', 'Svits porrerne, tilsæt kartofler, 1 l vand og bouillon, og lad det simre 20 min.', 'Blend suppen, og rør fløden i.', 'Steg flæsket sprødt, og drys det over.'] },
    'Gulerodssuppe med ingefær': { kategori: 'Supper', tid: '35 min', ing: [['1 kg', 'Gulerødder'], ['1 stk', 'Løg'], ['1 stk', 'Ingefær'], ['2 terninger', 'Bouillon'], ['1 dåse', 'Kokosmælk']],
      trin: ['Skræl gulerødderne, og skær dem i stykker.', 'Svits hakket løg og revet ingefær, tilsæt gulerødder, 1 l vand og bouillon, og lad det simre 20 min.', 'Blend suppen, og rør kokosmælken i.', 'Smag til med salt og lidt citron.'] },
    'Blomkålssuppe': { kategori: 'Supper', tid: '30 min', ing: [['1 stk', 'Blomkål'], ['300 g', 'Kartofler'], ['2 terninger', 'Bouillon'], ['1 dl', 'Madlavningsfløde'], ['1 bundt', 'Persille']],
      trin: ['Del blomkålen i buketter, og skær kartoflerne i tern.', 'Kog det i 1 l vand med bouillon i 15 min.', 'Blend suppen, og rør fløden i.', 'Hak persillen, og drys den over.'] },

    'Hjemmelavet pizza': { kategori: 'Børnevenligt', tid: '1 t 30 min', ing: [['500 g', 'Hvedemel'], ['25 g', 'Gær'], ['2 spsk', 'Tomatpuré'], ['1 dåse', 'Hakkede tomater'], ['200 g', 'Revet ost'], ['150 g', 'Skinke']],
      trin: ['Rør gæren ud i 3 dl lunkent vand, og ælt mel, salt og lidt olie i til en blød dej.', 'Lad dejen hæve tildækket i 1 time.', 'Rør tomater og puré sammen med salt og oregano.', 'Rul dejen ud på to plader, smør tomatsovs på, og læg ost og skinke på.', 'Bag ved 225 °C i 12-15 min.'] },
    'Kødboller i tomatsovs med spaghetti': { kategori: 'Børnevenligt', tid: '40 min', ing: [['500 g', 'Hakket oksekød'], ['1 stk', 'Æg'], ['4 spsk', 'Rasp'], ['2 dåser', 'Hakkede tomater'], ['400 g', 'Pasta'], ['1 stk', 'Løg']],
      trin: ['Rør kødet med æg, rasp, salt og peber, og form små boller.', 'Brun bollerne på panden, og tag dem af.', 'Svits hakket løg, tilsæt tomaterne, og lad det simre 10 min. Kom bollerne i, og lad dem simre 10 min mere.', 'Kog pastaen, og server med sovsen.'] },
    'Mild kyllingekarry med ris': { kategori: 'Børnevenligt', tid: '35 min', ing: [['500 g', 'Kylling'], ['2 tsk', 'Karry'], ['2,5 dl', 'Madlavningsfløde'], ['1 stk', 'Æbler'], ['1 stk', 'Løg'], ['300 g', 'Ris']],
      trin: ['Kog risene.', 'Skær kyllingen i tern, og steg den med hakket løg.', 'Drys karry over, og steg et minut.', 'Tilsæt fløde og æble i tern, og lad det simre 10 min, til kyllingen er gennemstegt.'] },
    'Pandekager': { kategori: 'Børnevenligt', tid: '40 min', ing: [['250 g', 'Hvedemel'], ['5 dl', 'Mælk'], ['3 stk', 'Æg'], ['25 g', 'Smør']],
      trin: ['Pisk mel og halvdelen af mælken til en jævn dej uden klumper.', 'Pisk resten af mælken og æggene i, og lad dejen hvile 15 min.', 'Smelt smør på en pande, og hæld en tynd kage på.', 'Vend den, når kanten slipper, og bag den gylden på den anden side.'] },
    'Morgenboller': { kategori: 'Bagning', tid: '2 t', saeson: [], ing: [['25 g', 'Gær'], ['5 dl', 'Mælk'], ['750 g', 'Hvedemel'], ['1 tsk', 'Sukker'], ['50 g', 'Smør']],
      trin: ['Lun mælken til håndvarm, og rør gæren ud i den.', 'Ælt mel, sukker, salt og blødt smør i, til dejen er glat og slipper skålen.', 'Lad dejen hæve tildækket i 1 time.', 'Form 16 boller, og lad dem hæve 30 min på pladen.', 'Pensl med mælk, og bag ved 220 °C i 12-15 min.'] },
    'Havregrynsboller': { kategori: 'Bagning', tid: '1 t 45 min', saeson: [], ing: [['25 g', 'Gær'], ['5 dl', 'Mælk'], ['150 g', 'Havregryn'], ['550 g', 'Hvedemel'], ['1 tsk', 'Sukker']],
      trin: ['Lun mælken til håndvarm, og rør gæren ud i den.', 'Rør havregryn, sukker og salt i, og ælt melet i lidt ad gangen.', 'Lad dejen hæve i 1 time.', 'Form 14 boller, og lad dem hæve 20 min.', 'Bag ved 220 °C i 15 min.'] },
    'Bananbrød': { kategori: 'Bagning', tid: '1 t 15 min', saeson: [], ing: [['3 stk', 'Bananer'], ['2 stk', 'Æg'], ['100 g', 'Smør'], ['150 g', 'Sukker'], ['250 g', 'Hvedemel'], ['2 tsk', 'Bagepulver']],
      trin: ['Tænd ovnen på 175 °C, og smør en aflang form.', 'Mos bananerne, og rør smeltet smør, sukker og æg i.', 'Vend mel, bagepulver og en knivspids salt i.', 'Hæld dejen i formen, og bag i 50-60 min, til en kødnål kommer ren ud.'] },
    'Kanelsnegle': { kategori: 'Bagning', tid: '2 t', saeson: ['vinter', 'efterår'], ing: [['25 g', 'Gær'], ['2,5 dl', 'Mælk'], ['450 g', 'Hvedemel'], ['150 g', 'Smør'], ['100 g', 'Sukker'], ['2 spsk', 'Kanel'], ['1 stk', 'Æg']],
      trin: ['Lun mælken, rør gæren ud, og ælt mel, 50 g smør, 2 spsk sukker og ægget i til en blød dej.', 'Lad dejen hæve 45 min.', 'Rør resten af smørret med sukker og kanel.', 'Rul dejen ud, smør fyldet på, rul den sammen, og skær 16 skiver.', 'Lad dem hæve 20 min, og bag ved 200 °C i 12-15 min.'] },
    'Æblekage med kanel': { kategori: 'Bagning', tid: '1 t', saeson: ['efterår'], ing: [['4 stk', 'Æbler'], ['150 g', 'Smør'], ['150 g', 'Sukker'], ['3 stk', 'Æg'], ['150 g', 'Hvedemel'], ['1 tsk', 'Bagepulver'], ['1 tsk', 'Kanel']],
      trin: ['Tænd ovnen på 180 °C.', 'Pisk blødt smør og sukker luftigt, og pisk æggene i et ad gangen.', 'Vend mel og bagepulver i, og bred dejen ud i en smurt form.', 'Skær æblerne i både, tryk dem ned i dejen, og drys med kanel og sukker.', 'Bag i 35-40 min.'] },

    'Grønlangkål med flæsk': { kategori: 'Årstidens retter', tid: '1 t', saeson: ['vinter'], ing: [['500 g', 'Grønkål'], ['600 g', 'Flæsk i skiver'], ['1 kg', 'Kartofler'], ['5 dl', 'Mælk'], ['40 g', 'Smør'], ['40 g', 'Hvedemel']],
      trin: ['Skyl grønkålen, kog den 10 min, og hak den fint.', 'Kog kartoflerne.', 'Smelt smør, rør mel i, og pisk mælken i til en jævn sovs.', 'Vend grønkålen i sovsen, og smag til med salt og lidt sukker.', 'Steg flæsket sprødt, og server det hele sammen.'] },
    'Gule ærter': { kategori: 'Årstidens retter', tid: '2 t 30 min', saeson: ['vinter'], ing: [['500 g', 'Gule ærter'], ['1 kg', 'Flæsk i skiver'], ['4 stk', 'Gulerødder'], ['2 stk', 'Porre'], ['500 g', 'Kartofler'], ['1 stk', 'Løg'], ['2 spsk', 'Sennep']],
      trin: ['Skyl ærterne, og kog dem i 1,5 l vand. Skum undervejs, og lad dem simre 1 time.', 'Kog flæsket med løg i en anden gryde i 1 time.', 'Kom kartofler, gulerødder og porrer i skiver i ærterne, og kog 25 min.', 'Smag suppen til med salt og timian, og server med flæsk og sennep.'] },
    'Flæskesteg med rødkål': { kategori: 'Årstidens retter', tid: '2 t', saeson: ['vinter'], ing: [['1,5 kg', 'Flæskesteg'], ['1 kg', 'Kartofler'], ['1 stk', 'Rødkål'], ['2 dl', 'Piskefløde'], ['1 terning', 'Bouillon']],
      trin: ['Tænd ovnen på 200 °C. Gnid sværen med salt, og steg stegen i 1,5 time.', 'Skru op på 250 °C de sidste 10-15 min, så sværen popper.', 'Kog kartoflerne.', 'Snit rødkålen, og lad den simre med eddike, sukker og lidt vand i 45 min.', 'Kog skyen op med bouillon og fløde til en sovs.'] },
    'Nye kartofler med asparges': { kategori: 'Årstidens retter', tid: '30 min', saeson: ['forår'], ing: [['1 kg', 'Nye kartofler'], ['500 g', 'Asparges'], ['100 g', 'Smør'], ['1 bundt', 'Persille'], ['4 stk', 'Æg']],
      trin: ['Skrub kartoflerne, og kog dem 15 min i saltet vand.', 'Knæk den træede ende af aspargesene, og kog dem 3-4 min.', 'Kog æggene i 7 min.', 'Smelt smørret, og rør hakket persille i. Hæld det over kartofler og asparges.'] },
    'Rabarbergrød med fløde': { kategori: 'Årstidens retter', tid: '25 min', saeson: ['forår', 'sommer'], ing: [['800 g', 'Rabarber'], ['200 g', 'Sukker'], ['3 spsk', 'Hvedemel'], ['2 dl', 'Piskefløde']],
      trin: ['Skær rabarberne i stykker, og kog dem med sukker og 2 dl vand i 10 min.', 'Rør melet ud i lidt koldt vand, og rør det i grøden, til den tykner.', 'Lad grøden køle af.', 'Server med kold fløde.'] },
    'Koldskål med kammerjunkere': { kategori: 'Årstidens retter', tid: '15 min', saeson: ['sommer'], ing: [['1 l', 'Kærnemælk'], ['2 stk', 'Æg'], ['75 g', 'Sukker'], ['1 pose', 'Kammerjunkere'], ['250 g', 'Jordbær']],
      trin: ['Pisk æggeblommer og sukker luftigt.', 'Pisk kærnemælken i lidt ad gangen, og smag til med citron og vanilje.', 'Stil koldskålen koldt.', 'Server med kammerjunkere og jordbær i skiver.'] },
    'Grillede kyllingespyd med majs': { kategori: 'Årstidens retter', tid: '40 min', saeson: ['sommer'], ing: [['600 g', 'Kyllingespyd'], ['4 stk', 'Majskolber'], ['1 stk', 'Salat'], ['250 g', 'Tomater'], ['1 flaske', 'Dressing']],
      trin: ['Tænd grillen, eller varm en grillpande godt op.', 'Grill spyddene 12-15 min, og vend dem ofte, til kyllingen er gennemstegt.', 'Grill majskolberne 10 min med lidt smør og salt.', 'Snit salat og tomater, og server med dressing.'] },
    'Græskarsuppe': { kategori: 'Årstidens retter', tid: '45 min', saeson: ['efterår'], ing: [['1 stk', 'Hokkaidogræskar'], ['1 stk', 'Løg'], ['1 stk', 'Ingefær'], ['2 terninger', 'Bouillon'], ['1 dl', 'Madlavningsfløde']],
      trin: ['Skær græskarret i både, fjern kernerne, og skær det i tern. Skrællen kan blive på.', 'Svits hakket løg og revet ingefær, tilsæt græskar, 1 l vand og bouillon, og lad det simre 20 min.', 'Blend suppen, og rør fløden i.', 'Smag til med salt og peber.'] },
    'Svamperisotto': { kategori: 'Årstidens retter', tid: '40 min', saeson: ['efterår'], ing: [['300 g', 'Risottoris'], ['400 g', 'Svampe'], ['1 stk', 'Løg'], ['2 terninger', 'Bouillon'], ['50 g', 'Parmesan'], ['30 g', 'Smør']],
      trin: ['Opløs bouillonen i 1 l kogende vand.', 'Svits hakket løg, rør risene i, og hæld bouillon i lidt ad gangen, mens du rører, i ca. 20 min.', 'Steg svampene gyldne på en varm pande.', 'Rør smør, revet parmesan og svampe i risottoen.'] }
  }
};
// seasons for the everyday recipes above (the seasonal ones carry their own)
(() => {
  const S = { 'Tomatsuppe med pasta': ['efterår', 'vinter'], 'Kartoffel- og porresuppe': ['efterår', 'vinter'], 'Gulerodssuppe med ingefær': ['efterår', 'vinter'], 'Blomkålssuppe': ['efterår', 'vinter'],
    'Kyllingesalat med couscous og feta': ['sommer'], 'Wraps med kylling': ['sommer'], 'Airfryer-grøntsager med feta og couscous': ['sommer', 'efterår'], 'Ovnbagt laks med broccoli og kartofler': ['forår'],
    'Linsedahl med ris': ['vinter'], 'Chili sin carne': ['vinter', 'efterår'], 'Mild kyllingekarry med ris': ['vinter'] };
  Object.entries(window.OPSKRIFTSBANK.opskrifter).forEach(([n, r]) => { r.saeson = r.saeson || S[n] || []; });
})();
