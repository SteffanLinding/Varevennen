// "Nyt i appen": vises én gang, når appen er blevet opdateret. Nyeste først. Ny post = nyt id.
// Skriv for den, der bruger appen, ikke for udvikleren. Højst 3-4 punkter pr. post.
window.NYT = [
  { id: '2026-11-22c', dato: '22. nov.', titel: 'Bedre stregkodelæser',
    punkter: [
      { h: 'Læser flere koder', p: 'Scanneren er gjort hurtigere og bedre til at læse små, mørke, uskarpe og skæve stregkoder, uanset hvor i billedet de står.' },
      { h: 'Billede af stregkoden', p: 'Kan kameraet ikke læse den live, så tag et billede af koden i stedet. Der er også en lommelygte-knap, hvis telefonen har en.', href: '#/scan' },
      { h: 'Ukendte varer', p: 'Kender appen ikke varen, slår den den op og lader jer gemme den som prio 1, 2 eller 3 på det rigtige varekort.' }
    ] },
  { id: '2026-11-22b', dato: '22. nov.', titel: 'Færdigretter og nyheder',
    punkter: [
      { h: 'Færdigretter', p: 'Pizza, lasagne, suppe, sushi og mere fra køledisken. Find dem i Kogebogen.', href: '#/retter?emne=F%C3%A6rdigretter' },
      { h: 'Vælg en ret for mig', p: 'Appen foreslår en ret eller hele ugen ud fra jeres allergier og årstiden.', href: '#/vaelg-ret' },
      { h: 'Tag kødet op', p: 'Få en påmindelse om at tage kødet op af fryseren, dagen før eller samme dag.' },
      { h: 'Er den frisk?', p: 'Se, hvordan du vælger gode kartofler, frugt og grønt. Står på varekortet.' }
    ] }
];
