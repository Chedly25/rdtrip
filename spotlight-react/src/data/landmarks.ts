export interface Landmark {
  id: number
  name: string
  type: 'monument' | 'historic' | 'cultural' | 'natural'
  lat: number
  lng: number
  country: string
  city: string
  icon_type: string
  description: string
  image_url: string
  rating: number
  visit_duration: number
}

export const europeanLandmarks: Landmark[] = [
  // France
  {
    id: 1,
    name: "Eiffel Tower",
    type: "monument",
    lat: 48.8584,
    lng: 2.2945,
    country: "France",
    city: "Paris",
    icon_type: "tower",
    description: "Iconic iron lattice tower and symbol of Paris",
    image_url: "/images/landmarks/eiffel_tower.png",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 2,
    name: "Mont Saint-Michel",
    type: "historic",
    lat: 48.6361,
    lng: -1.5115,
    country: "France",
    city: "Normandy",
    icon_type: "castle",
    description: "Medieval abbey perched on a tidal island",
    image_url: "/images/landmarks/mont_saint_michel.png",
    rating: 4.8,
    visit_duration: 180
  },
  {
    id: 31,
    name: "Arc de Triomphe",
    type: "monument",
    lat: 48.8738,
    lng: 2.2950,
    country: "France",
    city: "Paris",
    icon_type: "monument",
    description: "Triumphal arch honoring French army victories",
    image_url: "/images/landmarks/arc_de_triomphe.png",
    rating: 4.5,
    visit_duration: 60
  },
  {
    id: 32,
    name: "Notre Dame",
    type: "cultural",
    lat: 48.8530,
    lng: 2.3499,
    country: "France",
    city: "Paris",
    icon_type: "cathedral",
    description: "Medieval Catholic cathedral with Gothic architecture",
    image_url: "/images/landmarks/notre_dame.png",
    rating: 4.7,
    visit_duration: 90
  },
  {
    id: 33,
    name: "Versailles",
    type: "historic",
    lat: 48.8049,
    lng: 2.1204,
    country: "France",
    city: "Versailles",
    icon_type: "palace",
    description: "Opulent royal palace with magnificent gardens",
    image_url: "/images/landmarks/versailles.png",
    rating: 4.8,
    visit_duration: 240
  },
  // Italy
  {
    id: 3,
    name: "Colosseum",
    type: "historic",
    lat: 41.8902,
    lng: 12.4922,
    country: "Italy",
    city: "Rome",
    icon_type: "amphitheater",
    description: "Ancient Roman amphitheater and architectural marvel",
    image_url: "/images/landmarks/colosseum.png",
    rating: 4.5,
    visit_duration: 150
  },
  {
    id: 4,
    name: "Leaning Tower of Pisa",
    type: "monument",
    lat: 43.7230,
    lng: 10.3966,
    country: "Italy",
    city: "Pisa",
    icon_type: "tower",
    description: "Famous tilted bell tower",
    image_url: "/images/landmarks/pisa.png",
    rating: 4.3,
    visit_duration: 90
  },
  {
    id: 34,
    name: "St. Peter's Basilica",
    type: "cultural",
    lat: 41.9022,
    lng: 12.4539,
    country: "Italy",
    city: "Vatican City",
    icon_type: "cathedral",
    description: "Renaissance church and papal enclave",
    image_url: "/images/landmarks/st_peter.png",
    rating: 4.9,
    visit_duration: 120
  },
  {
    id: 35,
    name: "Trevi Fountain",
    type: "monument",
    lat: 41.9009,
    lng: 12.4833,
    country: "Italy",
    city: "Rome",
    icon_type: "fountain",
    description: "Baroque fountain famous for coin-tossing tradition",
    image_url: "/images/landmarks/trevi_fountain.png",
    rating: 4.6,
    visit_duration: 30
  },
  {
    id: 36,
    name: "Duomo di Milano",
    type: "cultural",
    lat: 45.4642,
    lng: 9.1900,
    country: "Italy",
    city: "Milan",
    icon_type: "cathedral",
    description: "Gothic cathedral with stunning white marble facade",
    image_url: "/images/landmarks/duomo_milano.png",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 37,
    name: "St. Mark's Basilica",
    type: "cultural",
    lat: 45.4345,
    lng: 12.3398,
    country: "Italy",
    city: "Venice",
    icon_type: "cathedral",
    description: "Byzantine cathedral with stunning mosaics",
    image_url: "/images/landmarks/st_mark_venice.png",
    rating: 4.6,
    visit_duration: 120
  },
  // Spain
  {
    id: 5,
    name: "Sagrada Familia",
    type: "cultural",
    lat: 41.4036,
    lng: 2.1744,
    country: "Spain",
    city: "Barcelona",
    icon_type: "cathedral",
    description: "Gaudí's unfinished masterpiece basilica",
    image_url: "/images/landmarks/sagrada_familia.png",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 6,
    name: "Alhambra",
    type: "historic",
    lat: 37.1760,
    lng: -3.5881,
    country: "Spain",
    city: "Granada",
    icon_type: "palace",
    description: "Moorish palace and fortress complex",
    image_url: "/images/landmarks/alhambra_granada.png",
    rating: 4.8,
    visit_duration: 240
  },
  // Germany
  {
    id: 7,
    name: "Neuschwanstein Castle",
    type: "historic",
    lat: 47.5576,
    lng: 10.7498,
    country: "Germany",
    city: "Bavaria",
    icon_type: "castle",
    description: "Fairy-tale castle in the Bavarian Alps",
    image_url: "/images/landmarks/neuschwanstein_castle.png",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 8,
    name: "Brandenburg Gate",
    type: "monument",
    lat: 52.5163,
    lng: 13.3777,
    country: "Germany",
    city: "Berlin",
    icon_type: "gate",
    description: "Iconic neoclassical monument",
    image_url: "/images/landmarks/brandenburg_gate.png",
    rating: 4.4,
    visit_duration: 60
  },
  {
    id: 38,
    name: "Cologne Cathedral",
    type: "cultural",
    lat: 50.9413,
    lng: 6.9583,
    country: "Germany",
    city: "Cologne",
    icon_type: "cathedral",
    description: "Gothic cathedral and UNESCO World Heritage Site",
    image_url: "/images/landmarks/cologne_cathedral.png",
    rating: 4.6,
    visit_duration: 120
  },
  // UK
  {
    id: 9,
    name: "Tower Bridge",
    type: "monument",
    lat: 51.5055,
    lng: -0.0754,
    country: "United Kingdom",
    city: "London",
    icon_type: "bridge",
    description: "Victorian bascule bridge over the Thames",
    image_url: "/images/landmarks/tower_bridge.png",
    rating: 4.5,
    visit_duration: 90
  },
  {
    id: 10,
    name: "Stonehenge",
    type: "historic",
    lat: 51.1789,
    lng: -1.8262,
    country: "United Kingdom",
    city: "Salisbury",
    icon_type: "monument",
    description: "Prehistoric stone circle",
    image_url: "/images/landmarks/stonehenge.png",
    rating: 4.2,
    visit_duration: 120
  },
  {
    id: 39,
    name: "Big Ben",
    type: "monument",
    lat: 51.4994,
    lng: -0.1245,
    country: "United Kingdom",
    city: "London",
    icon_type: "tower",
    description: "Iconic clock tower at the Palace of Westminster",
    image_url: "/images/landmarks/big_ben.png",
    rating: 4.4,
    visit_duration: 60
  },
  {
    id: 40,
    name: "Edinburgh Castle",
    type: "historic",
    lat: 55.9486,
    lng: -3.1999,
    country: "United Kingdom",
    city: "Edinburgh",
    icon_type: "castle",
    description: "Historic fortress dominating Edinburgh's skyline",
    image_url: "/images/landmarks/edinburgh_castle.png",
    rating: 4.5,
    visit_duration: 180
  },
  // Switzerland
  {
    id: 11,
    name: "Matterhorn",
    type: "natural",
    lat: 45.9763,
    lng: 7.6586,
    country: "Switzerland",
    city: "Zermatt",
    icon_type: "mountain",
    description: "Iconic pyramid-shaped peak in the Alps",
    image_url: "/images/landmarks/matterhorn.png",
    rating: 4.9,
    visit_duration: 300
  },
  // Greece
  {
    id: 12,
    name: "Acropolis of Athens",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient citadel with the Parthenon",
    image_url: "/images/landmarks/acropolis_athens.png",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 41,
    name: "Parthenon",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient temple dedicated to the goddess Athena",
    image_url: "/images/landmarks/parthenon.png",
    rating: 4.6,
    visit_duration: 90
  },
  // Portugal
  {
    id: 13,
    name: "Jerónimos Monastery",
    type: "cultural",
    lat: 38.6979,
    lng: -9.2065,
    country: "Portugal",
    city: "Lisbon",
    icon_type: "monastery",
    description: "Manueline architectural masterpiece",
    image_url: "/images/landmarks/jeronimo-monestary.png",
    rating: 4.5,
    visit_duration: 120
  },
  {
    id: 42,
    name: "Pena Palace",
    type: "historic",
    lat: 38.7876,
    lng: -9.3906,
    country: "Portugal",
    city: "Sintra",
    icon_type: "palace",
    description: "Romantic palace with eclectic architectural styles",
    image_url: "/images/landmarks/pena_palace.png",
    rating: 4.6,
    visit_duration: 150
  },
  // Netherlands
  {
    id: 14,
    name: "Kinderdijk Windmills",
    type: "cultural",
    lat: 51.8839,
    lng: 4.6389,
    country: "Netherlands",
    city: "Kinderdijk",
    icon_type: "windmill",
    description: "Network of 19 UNESCO-listed windmills",
    image_url: "/images/landmarks/kinderdijk_windmills.png",
    rating: 4.4,
    visit_duration: 120
  },
  // Austria
  {
    id: 43,
    name: "Schönbrunn Palace",
    type: "historic",
    lat: 48.1847,
    lng: 16.3119,
    country: "Austria",
    city: "Vienna",
    icon_type: "palace",
    description: "Imperial summer palace with baroque gardens",
    image_url: "/images/landmarks/schonnbrun_vienna.png",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 44,
    name: "Hallstatt Village",
    type: "cultural",
    lat: 47.5622,
    lng: 13.6493,
    country: "Austria",
    city: "Hallstatt",
    icon_type: "village",
    description: "Picturesque lakeside village in the Alps",
    image_url: "/images/landmarks/hallstatt_village_austria.png",
    rating: 4.7,
    visit_duration: 180
  },
  // Czech Republic
  {
    id: 45,
    name: "Charles Bridge",
    type: "monument",
    lat: 50.0865,
    lng: 14.4114,
    country: "Czech Republic",
    city: "Prague",
    icon_type: "bridge",
    description: "Historic stone bridge connecting Prague's Old and New Towns",
    image_url: "/images/landmarks/charles_bridge_prague.png",
    rating: 4.5,
    visit_duration: 60
  },
  // Belgium
  {
    id: 46,
    name: "Atomium",
    type: "monument",
    lat: 50.8950,
    lng: 4.3415,
    country: "Belgium",
    city: "Brussels",
    icon_type: "structure",
    description: "Iconic building representing an iron crystal magnified 165 billion times",
    image_url: "/images/landmarks/atomium_brussels.png",
    rating: 4.2,
    visit_duration: 90
  },
  // Denmark
  {
    id: 47,
    name: "Little Mermaid",
    type: "monument",
    lat: 55.6930,
    lng: 12.5993,
    country: "Denmark",
    city: "Copenhagen",
    icon_type: "statue",
    description: "Bronze statue commemorating Hans Christian Andersen's fairy tale",
    image_url: "/images/landmarks/little_mermaid_copenhagen.png",
    rating: 3.8,
    visit_duration: 30
  },
  // Ireland
  {
    id: 48,
    name: "Cliffs of Moher",
    type: "natural",
    lat: 52.9715,
    lng: -9.4265,
    country: "Ireland",
    city: "County Clare",
    icon_type: "cliff",
    description: "Spectacular sea cliffs rising 214m from the Atlantic Ocean",
    image_url: "/images/landmarks/cliffs_of_moher.png",
    rating: 4.7,
    visit_duration: 120
  },
  // Norway
  {
    id: 49,
    name: "Geirangerfjord",
    type: "natural",
    lat: 62.1049,
    lng: 7.0045,
    country: "Norway",
    city: "Geiranger",
    icon_type: "fjord",
    description: "UNESCO World Heritage fjord with dramatic waterfalls",
    image_url: "/images/landmarks/geirangerfjord_norway.png",
    rating: 4.8,
    visit_duration: 240
  },
  // Russia
  {
    id: 50,
    name: "St. Basil's Cathedral",
    type: "cultural",
    lat: 55.7525,
    lng: 37.6231,
    country: "Russia",
    city: "Moscow",
    icon_type: "cathedral",
    description: "Colorful onion-domed cathedral in Red Square",
    image_url: "/images/landmarks/st_basils_moscow.png",
    rating: 4.8,
    visit_duration: 90
  },
]
