// Free videos from Wikimedia Commons, downloaded into video/ so they also work offline.
// H.264 mp4 (360p) for all phones, webm (240p) as a fallback. Credit is shown under each video.
(() => {
  const c = (f) => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.replace(/ /g, '_'));
  window.VIDEOER = {
    aeg: { titel: 'Crack And Separate An Egg', af: 'Kathy Maister', licens: 'CC BY 2.0', side: c('Crack And Separate An Egg.webm'), sek: 55, sprog: 'engelsk', om: 'Sådan slår man et æg ud og skiller det.', filer: { webm: 'video/aeg.webm', mp4: 'video/aeg.mp4' } },
    adskil: { titel: 'Separate raw meat from fruits and vegetables', af: 'Centers for Disease Control and Prevention', licens: 'Public domain', side: c('Separate raw meat from fruits and vegetables.webm'), sek: 7, sprog: 'engelsk', om: 'Hold råt kød væk fra frugt og grønt.', filer: { webm: 'video/adskil.webm', mp4: 'video/adskil.mp4' } },
    haender: { titel: 'Always wash your hands before, during, and after preparing food', af: 'Centers for Disease Control and Prevention', licens: 'Public domain', side: c('Always wash your hands before, during, and after preparing food.webm'), sek: 10, sprog: 'engelsk', om: 'Vask hænder før, under og efter madlavning.', filer: { webm: 'video/haender.webm', mp4: 'video/haender.mp4' } },
    pasta: { titel: 'Pot of pasta boiling', af: 'Anselm Schüler', licens: 'CC BY-SA 4.0', side: c('Pot of pasta boiling.webm'), sek: 0, om: 'Sådan ser pasta ud, når vandet koger, som det skal.', filer: { webm: 'video/pasta.webm', mp4: 'video/pasta.mp4' } },
    ris: { titel: 'Rice Cooking on a gas stove', af: 'Shraddhahistory', licens: 'CC BY-SA 4.0', side: c('Rice Cooking on a gas stove.webm'), sek: 0, om: 'Ris, der koger i en gryde.', filer: { webm: 'video/ris.webm', mp4: 'video/ris.mp4' } },
    kartofler: { titel: 'Potato peeling', af: 'Dav Sargsyan', licens: 'CC BY-SA 4.0', side: c('Potato peeling.webm'), sek: 0, om: 'Sådan skrælles en kartoffel.', filer: { webm: 'video/kartofler.webm', mp4: 'video/kartofler.mp4' } }
  };
})();
