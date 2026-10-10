// Le immagini dell'app: tutte di pubblico dominio o CC0 (Wikimedia Commons,
// licenze verificate una per una), ridimensionate e salvate in public/img/
// così funzionano anche offline. Chi le ha fatte: IMAGE_CREDITS, in Opzioni.

export interface ImageInfo {
  src: string;
  /** Dove cade il punto d'interesse quando l'immagine viene ritagliata. */
  position?: string;
  /** Immagine chiara: il testo sopra ha bisogno di più ombra. */
  light?: boolean;
}

const img = (file: string, position?: string, light = false): ImageInfo => ({ src: `/img/${file}.jpg`, position, light });

/** Le immagini delle sezioni. */
export const IMG: Record<string, ImageInfo | undefined> = {
  hero: img('oggi-liszt', 'center 45%'),
  sprint: img('sprint-spartito', 'center 40%'),
  'module:lettura': img('lettura-bach-duetto', 'center 30%', true),
  'module:scale': img('scale-tasti', 'center 55%'),
  'module:ritmo': img('ritmo-metronomo', 'center 35%'),
  'module:espressione': img('espressione-caillebotte', 'center 40%'),
  'module:tecnica-base': img('tecnica-mani', 'center 60%'),
  'module:accordi': img('accordi-tastiera', 'center 55%'),
  'module:verso-chopin': img('chopin-polacca', 'center 30%', true),
};

/** Ritratti dei compositori (e immagini per esercizi e canti), per nome come in library.ts. */
export const PORTRAIT: Record<string, ImageInfo | undefined> = {
  'J. S. Bach': img('bach', 'center 12%'),
  'W. A. Mozart': img('mozart', 'center 20%'),
  'L. van Beethoven': img('beethoven', 'center 30%'),
  'F. Schubert': img('schubert', 'center 25%'),
  'F. Chopin': img('chopin', 'center 12%'),
  'R. Schumann': img('schumann', 'center 30%', true),
  'J. Brahms': img('brahms', 'center 15%'),
  Tradizionale: img('tradizionale-whistler', '60% center'),
  Esercizio: img('esercizio-coda', '40% center'),
};

export interface ImageCredit {
  what: string;
  author: string;
  license: string;
  url: string;
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

export const IMAGE_CREDITS: ImageCredit[] = [
  { what: 'Ritratto di J. S. Bach', author: 'Elias Gottlob Haussmann, 1748', license: 'pubblico dominio', url: commons('Johann Sebastian Bach.jpg') },
  { what: 'Ritratto di W. A. Mozart', author: 'Barbara Krafft, 1819', license: 'pubblico dominio', url: commons('Wolfgang-amadeus-mozart 1.jpg') },
  { what: 'Ritratto di L. van Beethoven', author: 'Joseph Karl Stieler, 1820', license: 'pubblico dominio', url: commons("Joseph Karl Stieler's Beethoven mit dem Manuskript der Missa solemnis (cropped).jpg") },
  { what: 'Ritratto di F. Schubert', author: 'Wilhelm August Rieder, 1875', license: 'pubblico dominio', url: commons('Franz Schubert by Wilhelm August Rieder 1875.jpg') },
  { what: 'Fotografia di F. Chopin', author: 'Louis-Auguste Bisson, 1849', license: 'pubblico dominio', url: commons('Frederic Chopin photo.jpeg') },
  { what: 'Ritratto di R. Schumann', author: 'Josef Kriehuber, 1839', license: 'pubblico dominio', url: commons('Robert Schumann 1839.jpg') },
  { what: 'Fotografia di J. Brahms', author: 'C. Brasch, Berlino, 1889', license: 'pubblico dominio', url: commons('JohannesBrahms.jpg') },
  { what: 'Liszt al pianoforte', author: 'Josef Danhauser, 1840', license: 'pubblico dominio', url: commons('Danhauser, Josef - Franz Liszt am Flügel phantasierend.jpg') },
  { what: 'Duetto I, BWV 802 (edizione incisa)', author: 'J. S. Bach, 1739', license: 'pubblico dominio', url: commons('Duetto 1 BWV 802.jpg') },
  { what: 'Tasti di pianoforte', author: 'Maciej Korsan', license: 'CC0', url: commons('Keys-piano-sh.jpg') },
  { what: 'Metronomo di Mälzel, 1815', author: 'foto di Andreas Praefcke', license: 'pubblico dominio', url: commons('Metronom Mälzel 1815.jpg') },
  { what: 'Giovane al pianoforte', author: 'Gustave Caillebotte, 1876', license: 'pubblico dominio', url: commons('G. Caillebotte - Jeune homme au piano.jpg') },
  { what: 'Mani di pianista', author: 'Jamille Queiroz', license: 'CC0', url: commons("Pianist's hands in black and white (Unsplash).jpg") },
  { what: 'Tastiera Lauberger & Gloss', author: 'Lukas Budimaier', license: 'CC0', url: commons('Lauberger & Gloss keyboard in black and white (Unsplash).jpg') },
  { what: 'Polacca op. 53, autografo', author: 'Fryderyk Chopin, 1842', license: 'pubblico dominio', url: commons('Chopin polonaise Op. 53.jpg') },
  { what: 'Spartito', author: 'Valentino Funghi', license: 'CC0', url: commons('Black and white music score (Unsplash).jpg') },
  { what: 'Pianoforte a coda', author: 'autore sconosciuto (pxhere)', license: 'CC0', url: commons('Steinbach grand piano with pianist (2017-03-29 11.55.17 @pxhere 1391193).jpg') },
  { what: 'Al pianoforte', author: 'James McNeill Whistler, 1858–59', license: 'pubblico dominio', url: commons('Whistler, James McNeill - At the Piano - Taft Museum of Art - 1962.7.jpg') },
];
