/**
 * Portadas del fondo de la landing (usuarios sin sesión).
 *
 * Sin sesión no se puede pedir el catálogo (todos los endpoints de /music exigen Bearer), así que
 * es una lista FIJA: los 80 álbumes que eligió el propietario (2026-11-13), en su orden. Las URLs
 * salen de GET /music/search?type=album (las que no estaban, el backend las importó de Spotify
 * al buscarlas). Se usa la variante de 300 px del CDN de Spotify (prefijo ab67616d00001e02).
 * Escritorio muestra las 80; móvil, 40 al azar en cada visita.
 * Pendiente del backend: un endpoint público para rotarlas (LANDING-01, SOLICITUDES_BACKEND.md).
 */
export interface LandingCover {
  title: string
  artist: string
  imageUrl: string
}

export const LANDING_COVERS: readonly LandingCover[] = [
  { title: 'Doppelganger', artist: 'The Fall of Troy', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0262f0f15dfc1cec391dfe577c' },
  { title: 'With Ears To See And Eyes To Hear', artist: 'Sleeping With Sirens', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02032fd22bde573d0746c87352' },
  { title: 'Monster', artist: 'Future', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c1a4bee8f56f093ba31e9fd2' },
  { title: '10,000 Days', artist: 'TOOL', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02725e469500de9880a320d8cb' },
  { title: 'Definitely Maybe', artist: 'Oasis', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02820bf2b8036d5a2094daf3c6' },
  { title: 'The Rise and Fall of a Midwest Princess', artist: 'Chappell Roan', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0296fa88fb1789be437d5cb4b6' },
  { title: 'LIVE.LOVE.A$AP', artist: 'A$AP Rocky', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c8ced8a4d6b6b61eb592f3dd' },
  { title: 'Weezer (Green Album)', artist: 'Weezer', imageUrl: 'https://i.scdn.co/image/ab67616d00001e021e0dc5baaabda304b0ad1815' },
  { title: 'Diary (Remastered and Expanded Edition)', artist: 'Sunny Day Real Estate', imageUrl: 'https://i.scdn.co/image/ab67616d00001e024713de3f8def31792e7e8954' },
  { title: 'MOTOMAMI', artist: 'ROSALÍA', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ac8367a27c0eb7195dc3a58d' },
  { title: 'Turn On The Bright Lights', artist: 'Interpol', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0214f8df9fb9c2d3056a994390' },
  { title: 'Lonely People With Power', artist: 'Deafheaven', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0254ea0eefe3e605132df9d28b' },
  { title: 'Slime Season 3', artist: 'Young Thug', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a875c3ec944b4f164ab5c350' },
  { title: 'In The Court Of The Crimson King (Expanded & Remastered Original Album Mix)', artist: 'King Crimson', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02da7b326bd7ffa7b6b95b0660' },
  { title: 'loveless', artist: 'my bloody valentine', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c3e9c9fed4906712461a35ac' },
  { title: 'D>E>A>T>H>M>E>T>A>L', artist: 'Panchiko', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02275137c8860871ca2ef6b542' },
  { title: 'To Pimp A Butterfly', artist: 'Kendrick Lamar', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02cdb645498cd3d8a2db4d05e1' },
  { title: 'Tales from Topographic Oceans (Deluxe Edition)', artist: 'Yes', imageUrl: 'https://i.scdn.co/image/ab67616d00001e022ac13cc406daca534d18c26d' },
  { title: 'Post', artist: 'Björk', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0203b878ae26aeab059fd94bf0' },
  { title: 'Big Bang', artist: 'Los Enanitos Verdes', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0235bf8a2179962114b8ec7585' },
  { title: 'Frizzle Fry (Remastered)', artist: 'Primus', imageUrl: 'https://i.scdn.co/image/ab67616d00001e022416da30701c087d1905fef2' },
  { title: 'RADIO ONSEN EUTOPIA', artist: 'YAKUSHIMARU Etsuko', imageUrl: 'https://i.scdn.co/image/ab67616d00001e028642040675045076ca7dff5b' },
  { title: 'ASTROWORLD', artist: 'Travis Scott', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02daec894c14c0ca42d76eeb32' },
  { title: 'Night Time, My Time', artist: 'Sky Ferreira', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02d39843a4927d1dd474978d23' },
  { title: 'Balas Perdidas', artist: 'Morat', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0290fa215e791c13fe9bacb8bc' },
  { title: 'THE TORTURED POETS DEPARTMENT', artist: 'Taylor Swift', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025076e4160d018e378f488c33' },
  { title: 'Solstis - De León Larregui', artist: 'León Larregui', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025be353af3e7d01599fbbda14' },
  { title: 'how i\'m feeling now', artist: 'Charli xcx', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025b8ef3c9b30d307df5245bfa' },
  { title: 'Imaginal Disk', artist: 'Magdalena Bay', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a3390485ba30a0a99feaa0dd' },
  { title: 'I Want to Be There', artist: 'Sadness', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02b43e87fb91979aabf1864c0c' },
  { title: 'DATA', artist: 'Tainy', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f885fb64a381318a1c9c14e4' },
  { title: 'GÉNESIS', artist: 'Peso Pluma', imageUrl: 'https://i.scdn.co/image/ab67616d00001e022fb583ed96f8f35cbf2897ba' },
  { title: 'Paramore', artist: 'Paramore', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02532033d0d90736f661c13d35' },
  { title: 'Maracucho Bueno Muere Chiquito', artist: 'Cruzzi', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0271fa1f493824349117812e60' },
  { title: 'PRIMA', artist: 'ADÉLA', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ac9d5d5263e9f03802d6864c' },
  { title: 'Con Todo Respeto', artist: 'Molotov', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025e2b069b2306267d474c43dd' },
  { title: 'When Broken Is Easily Fixed', artist: 'Silverstein', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ea6e6f676b39b921d6491e3a' },
  { title: 'The Colour And The Shape', artist: 'Foo Fighters', imageUrl: 'https://i.scdn.co/image/ab67616d00001e024bc9bcdbdc9ac34e37d8b6bb' },
  { title: 'lucy miró al mundo y notó que está girando', artist: 'AKRIILA', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02b1baec4d64bd460bc4fa83fd' },
  { title: 'Welcome To The St. James\' Club', artist: 'The Rippingtons', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a39011262e6e9abda178c89c' },
  { title: 'Skydrvg 1.0', artist: 'Pedro LaDroga', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025de396c4a960fe8a4375f314' },
  { title: 'USB IDOL', artist: 'Saramalacara', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02044a768d73e8bcaa85647874' },
  { title: 'Sling', artist: 'Clairo', imageUrl: 'https://i.scdn.co/image/ab67616d00001e022624442cf48e4962d1422da8' },
  { title: 'you seem pretty sad for a girl so in love', artist: 'Olivia Rodrigo', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025cf234eeb7a2edf44bf64a46' },
  { title: 'Bewitched: The Goddess Edition', artist: 'Laufey', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0213832cc69a78c53b18a8bc10' },
  { title: 'Sounding The Seventh Trumpet', artist: 'Avenged Sevenfold', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025f277702095002c64c308ea8' },
  { title: 'Mi Vida En Un Cigarro 2', artist: 'Junior H', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02bce9f6ae2b428bc6a3616a10' },
  { title: 'Paradise', artist: 'Lana Del Rey', imageUrl: 'https://i.scdn.co/image/ab67616d00001e024123029b8c0648e8f1fad18a' },
  { title: 'DEPR</3$$ED MFKZ', artist: 'Gael Valenzuela y Junior H', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f1b7ee109bd8626cad94f478' },
  { title: 'Serotonin II', artist: 'yeule', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c93e5d445758bfd4a9693686' },
  { title: 'eternal sunset', artist: 'A Rose Dying In The Rain', imageUrl: 'https://i.scdn.co/image/ab67616d00001e024a9be491bd17d4b3731c3075' },
  { title: 'This Old Dog', artist: 'Mac DeMarco', imageUrl: 'https://i.scdn.co/image/ab67616d00001e023f7561fb0914fb1f5f101f0a' },
  { title: 'Blonde', artist: 'Frank Ocean', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c5649add07ed3720be9d5526' },
  { title: 'Puberty 2', artist: 'Mitski', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0242cb382726e956058bf73ed3' },
  { title: 'Mon Laferte (Vol. 1)', artist: 'Mon Laferte', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025eebf3f8ec6e9807105f3151' },
  { title: 'NEXUS-2060', artist: 'CAPSULE', imageUrl: 'https://i.scdn.co/image/ab67616d00001e021ac33085db9be29748147f62' },
  { title: 'World Is Yours', artist: 'MASS OF THE FERMENTING DREGS', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025f2ca3e8b93fd5bc304480f5' },
  { title: 'Audioslave', artist: 'Audioslave', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a7292b6863258e889b78d787' },
  { title: 'Take Off Your Pants And Jacket', artist: 'blink-182', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02d9d27e5b56e2b983e54dba64' },
  { title: 'Hypnotize', artist: 'System Of A Down', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f5e7b2e5adaa87430a3eccff' },
  { title: 'The New Abnormal', artist: 'The Strokes', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02e3f1ba3de4659708c25d0f39' },
  { title: 'Take This to Your Grave', artist: 'Fall Out Boy', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02b3e13979bf4f6515020fbaea' },
  { title: 'Beatopia', artist: 'beabadoobee', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02384d10f967c2b914de7e2713' },
  { title: 'Pa Que Hablen', artist: 'Fuerza Regida', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c01f2a049a60288bf8966790' },
  { title: 'No Fue Suerte', artist: 'Chuy Montana', imageUrl: 'https://i.scdn.co/image/ab67616d00001e021f5823cc37f4b0334e42d9fb' },
  { title: 'Bleed American', artist: 'Jimmy Eat World', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0295d1d98c5176e4f982bd73d6' },
  { title: 'Dirty', artist: 'Sonic Youth', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02bc89a9404a3e534cbcef352d' },
  { title: 'You\'d Prefer An Astronaut', artist: 'Hum', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f2237ba7c0eb6326738ad6ad' },
  { title: 'PERDIENDO RASGOS ADOLESCENTES', artist: 'AgusFortnite2008', imageUrl: 'https://i.scdn.co/image/ab67616d00001e0276cda03f42331eb0487904c1' },
  { title: 'Positive', artist: 'PENTAGON', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02e099e697d0068b652fe6814e' },
  { title: 'Entre el Progreso y el Caboverdeano (Deluxe Edition)', artist: 'Clúster', imageUrl: 'https://i.scdn.co/image/ab67616d00001e020655f3aace0745a9d834dcf0' },
  { title: 'Can We Hang Out Sometime?', artist: 'Good Kid', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02dbbbb85c5d7723f8aba643e9' },
  { title: 'EL QUE COMPRÓ PERDIÓ', artist: 'Little Boogie', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02792bacf38ca1c664959f408a' },
  { title: 'Adromicfms 4', artist: 'Yung Beef', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02d02b559886598d6655f676e5' },
  { title: 'YHLQMDLG', artist: 'Bad Bunny', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02548f7ec52da7313de0c5e4a0' },
  { title: 'Whirlpool, Before and After', artist: 'Chapterhouse', imageUrl: 'https://i.scdn.co/image/ab67616d00001e024c793e5fe69c6f4ab4e18e54' },
  { title: 'Random Access Memories', artist: 'Daft Punk', imageUrl: 'https://i.scdn.co/image/ab67616d00001e029b9b36b0e22870b9f542d937' },
  { title: 'Live Through This', artist: 'Hole', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02be245e5b673371e6f95b19e2' },
  { title: 'Nevermind (Remastered)', artist: 'Nirvana', imageUrl: 'https://i.scdn.co/image/ab67616d00001e02e175a19e530c898d167d39bf' },
  { title: 'Melt My Eyez See Your Future', artist: 'Denzel Curry', imageUrl: 'https://i.scdn.co/image/ab67616d00001e025b924aa009b61b6b9d831eec' },
]

/**
 * Easter egg: al abrir la landing se sortea un número entre 1 y EASTER_EGG_RANGE; si sale
 * EASTER_EGG_NUMBER, todas las portadas son EASTER_EGG_COVER (decisión del propietario, 2026-11-13).
 */
export const EASTER_EGG_RANGE = 137_500
export const EASTER_EGG_NUMBER = 67

/**
 * "TRAP STORY": portada de una lista pública de Spotify (no es un álbum, así que no está en el
 * catálogo del backend). URL obtenida con el oEmbed público de Spotify
 * (open.spotify.com/oembed?url=…/playlist/1NaTVrYp7vkBAU5v6pxNWP). Si quien la creó cambia la
 * imagen, esta URL puede dejar de funcionar.
 */
export const EASTER_EGG_COVER: LandingCover = {
  title: 'TRAP STORY',
  artist: 'Gucci Mane',
  imageUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8414189b5652fd624cb979a45f',
}

/** `count` portadas distintas al azar (Fisher–Yates sobre una copia). */
export function pickRandomCovers(covers: readonly LandingCover[], count: number): LandingCover[] {
  const copy = [...covers]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy.slice(0, count)
}
