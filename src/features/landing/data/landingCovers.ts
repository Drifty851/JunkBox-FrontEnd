/**
 * Portadas del fondo de la landing (usuarios sin sesión).
 *
 * Sin sesión no se puede pedir el catálogo (todos los endpoints de /music exigen Bearer), así que
 * es una lista FIJA de carátulas que ya están en la base de Junkbox, recopiladas el 2026-11-11 con
 * GET /music/search?type=album de los artistas ya importados. Se usa la variante de 300 px del CDN
 * de Spotify (prefijo ab67616d00001e02) en lugar de la de 640 px.
 * Pendiente del backend: un endpoint público para rotarlas (LANDING-01, SOLICITUDES_BACKEND.md).
 */
export interface LandingCover {
  title: string
  artist: string
  imageUrl: string
}

export const LANDING_COVERS: readonly LandingCover[] = [
  { title: "Trilogy", artist: "The Weeknd", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02b298538481c52f7e217ed000' },
  { title: "BBO", artist: "Hoke", imageUrl: 'https://i.scdn.co/image/ab67616d00001e025c55f6850bebf0a64b373b3c' },
  { title: "Hexagons", artist: "Muse", imageUrl: 'https://i.scdn.co/image/ab67616d00001e024b0a7705d87ee1a18c2b05b4' },
  { title: "Homework", artist: "Daft Punk", imageUrl: 'https://i.scdn.co/image/ab67616d00001e028ac778cc7d88779f74d33311' },
  { title: "No Time To Die", artist: "Billie Eilish", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f7b7174bef6f3fbfda3a0bb7' },
  { title: "GNX", artist: "Kendrick Lamar", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02e2a0a166493a2bde5480a420' },
  { title: "8", artist: "Luis Fonsi", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0229035ea37892b23fa78beafe' },
  { title: "TIM", artist: "Avicii", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02660ee24281a547103f466ff5' },
  { title: "Version", artist: "Mark Ronson", imageUrl: 'https://i.scdn.co/image/ab67616d00001e026a5beb0500ad6e3b0f7aea22' },
  { title: "Trilogy", artist: "The Weeknd", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02158c84a1b6f8b935dc7fa9a9' },
  { title: "M.A.N.", artist: "Hoke", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0282042d93ef931ba02b5feb3a' },
  { title: "Starlight", artist: "Muse", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02f7824a1e8a8e044114c4d170' },
  { title: "Discovery", artist: "Daft Punk", imageUrl: 'https://i.scdn.co/image/ab67616d00001e021e81bff9807a9e629fce5ade' },
  { title: "Happier Than Ever", artist: "Billie Eilish", imageUrl: 'https://i.scdn.co/image/ab67616d00001e022a038d3bf875d23e4aeaa84e' },
  { title: "DAMN.", artist: "Kendrick Lamar", imageUrl: 'https://i.scdn.co/image/ab67616d00001e022c6dd664eb1a4c7afb386e47' },
  { title: "VIDA", artist: "Luis Fonsi", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ef0d4234e1a645740f77d59c' },
  { title: "Levels", artist: "Avicii", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ffb343926530168be4724dd4' },
  { title: "Uptown Special", artist: "Mark Ronson", imageUrl: 'https://i.scdn.co/image/ab67616d00001e029860171ddfee17f77a570cf6' },
  { title: "Starboy", artist: "The Weeknd", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a048415db06a5b6fa7ec4e1a' },
  { title: "TRES CREUS", artist: "Hoke", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0201c42f9ef122c20778d74836' },
  { title: "The Wow! Signal", artist: "Muse", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02b295bd39e098e7b68d57aacf' },
  { title: "Alive 2007", artist: "Daft Punk", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02673288fb985e5c194536ae27' },
  { title: "dont smile at me", artist: "Billie Eilish", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a9f6c04ba168640b48aa5795' },
  { title: "DAMN.", artist: "Kendrick Lamar", imageUrl: 'https://i.scdn.co/image/ab67616d00001e022171b967bef683ab0eaf12e9' },
  { title: "Paso A Paso", artist: "Luis Fonsi", imageUrl: 'https://i.scdn.co/image/ab67616d00001e024687097846c807e9676657a6' },
  { title: "AVĪCI (01)", artist: "Avicii", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a26cc58b4d64c2ece3376389' },
  { title: "Late Night Feelings", artist: "Mark Ronson", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02de087ae2924d2c1654f60d74' },
  { title: "Dawn FM", artist: "The Weeknd", imageUrl: 'https://i.scdn.co/image/ab67616d00001e024ab2520c2c77a1d66b9ee21d' },
  { title: "Medallones", artist: "Hoke", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0262d3ee795914ab6d6492b513' },
  { title: "Knights of Cydonia", artist: "Muse", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02c6816704559135719efb0b43' },
  { title: "One More Time", artist: "Daft Punk", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0238e5c88261ac859cee792916' },
  { title: "bad guy (with Justin Bieber)", artist: "Billie Eilish", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02a69b8b111a5fb8cb1c97e8eb' },
  { title: "DAMN.", artist: "Kendrick Lamar", imageUrl: 'https://i.scdn.co/image/ab67616d00001e028b52c6b9bc4e43d873869699' },
  { title: "Eterno", artist: "Luis Fonsi", imageUrl: 'https://i.scdn.co/image/ab67616d00001e0249e5e850c466573328b7b9c0' },
  { title: "Stories", artist: "Avicii", imageUrl: 'https://i.scdn.co/image/ab67616d00001e025393c5d3cac806092a9bc468' },
  { title: "Uptown Funk (Remixes) (feat. Bruno Mars)", artist: "Mark Ronson", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02146f0228683dc97769498290' },
  { title: "Starboy", artist: "The Weeknd", imageUrl: 'https://i.scdn.co/image/ab67616d00001e024718e2b124f79258be7bc452' },
  { title: "All City Dreams", artist: "Hoke", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02352609e124afe8cec6f04a69' },
  { title: "Knights of Cydonia", artist: "Muse", imageUrl: 'https://i.scdn.co/image/ab67616d00001e02ed15d7181be4901fe1d4571e' },
  { title: "Human After All", artist: "Daft Punk", imageUrl: 'https://i.scdn.co/image/ab67616d00001e022ed719bad67261c7bf090c70' },
]
