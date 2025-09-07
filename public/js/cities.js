// Complete cities database with real coordinates, population, and activities
export const cities = [
    // Starting point
    {
        id: "aix-en-provence",
        name: "Aix-en-Provence",
        lat: 43.5263,
        lon: 5.4454,
        country: "FR",
        population: 147933,
        themes: {
            adventure: 0.4,
            romantic: 0.8,
            cultural: 0.9,
            hidden: 0.2,
            family: 0.7
        },
        activities: [
            "Cours Mirabeau fountain walk",
            "Cézanne's studio visit",
            "Granet Museum art collection",
            "Thermal spa wellness"
        ]
    },
    // French Riviera cities
    {
        id: "nice",
        name: "Nice",
        lat: 43.7102,
        lon: 7.262,
        country: "FR",
        population: 343875,
        themes: {
            adventure: 0.5,
            romantic: 0.9,
            cultural: 0.8,
            hidden: 0.1,
            family: 0.8
        },
        activities: [
            "Promenade des Anglais sunset walk",
            "Castle Hill panoramic views",
            "Old Town (Vieux Nice) exploration",
            "Cours Saleya flower market"
        ]
    },
    {
        id: "cannes",
        name: "Cannes",
        lat: 43.5528,
        lon: 7.0174,
        country: "FR",
        population: 73603,
        themes: {
            adventure: 0.3,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.1,
            family: 0.6
        },
        activities: [
            "La Croisette boulevard stroll",
            "Film Festival Palace visit",
            "Îles de Lérins boat trip",
            "Le Suquet old quarter"
        ]
    },
    {
        id: "antibes",
        name: "Antibes",
        lat: 43.5804,
        lon: 7.1251,
        country: "FR",
        population: 76994,
        themes: {
            adventure: 0.5,
            romantic: 0.8,
            cultural: 0.8,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Picasso Museum visit",
            "Cap d'Antibes coastal walk",
            "Provençal market shopping",
            "Port Vauban yacht watching"
        ]
    },
    {
        id: "monaco",
        name: "Monaco",
        lat: 43.7384,
        lon: 7.4246,
        country: "MC",
        population: 39244,
        themes: {
            adventure: 0.4,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.1,
            family: 0.6
        },
        activities: [
            "Prince's Palace changing of guard",
            "Monte Carlo Casino visit",
            "Oceanographic Museum exploration",
            "Japanese Garden meditation"
        ]
    },
    {
        id: "menton",
        name: "Menton",
        lat: 43.7765,
        lon: 7.5046,
        country: "FR",
        population: 28833,
        themes: {
            adventure: 0.3,
            romantic: 0.8,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Lemon Festival celebration",
            "Jean Cocteau Museum visit",
            "Serre de la Madone gardens",
            "Old Town colorful streets"
        ]
    },
    {
        id: "saint-tropez",
        name: "Saint-Tropez",
        lat: 43.2677,
        lon: 6.6407,
        country: "FR",
        population: 4103,
        themes: {
            adventure: 0.6,
            romantic: 0.9,
            cultural: 0.6,
            hidden: 0.2,
            family: 0.5
        },
        activities: [
            "Old Port celebrity spotting",
            "Citadel maritime museum",
            "Pampelonne Beach sunbathing",
            "Place des Lices market"
        ]
    },
    // Italian cities
    {
        id: "venice",
        name: "Venice",
        lat: 45.4408,
        lon: 12.3155,
        country: "IT",
        population: 261905,
        themes: {
            adventure: 0.3,
            romantic: 1.0,
            cultural: 1.0,
            hidden: 0.2,
            family: 0.5
        },
        activities: [
            "St. Mark's Basilica tour",
            "Gondola canal ride",
            "Rialto Bridge crossing",
            "Murano glass workshop"
        ]
    },
    {
        id: "florence",
        name: "Florence",
        lat: 43.7696,
        lon: 11.2558,
        country: "IT",
        population: 382258,
        themes: {
            adventure: 0.3,
            romantic: 0.8,
            cultural: 1.0,
            hidden: 0.2,
            family: 0.6
        },
        activities: [
            "Uffizi Gallery masterpieces",
            "Duomo dome climb",
            "Ponte Vecchio shopping",
            "Boboli Gardens stroll"
        ]
    },
    {
        id: "milan",
        name: "Milan",
        lat: 45.4642,
        lon: 9.19,
        country: "IT",
        population: 1396059,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.8,
            hidden: 0.1,
            family: 0.6
        },
        activities: [
            "Duomo cathedral rooftop",
            "La Scala opera house",
            "Galleria Vittorio Emanuele II shopping",
            "Navigli canals aperitivo"
        ]
    },
    {
        id: "turin",
        name: "Turin",
        lat: 45.0703,
        lon: 7.6869,
        country: "IT",
        population: 870456,
        themes: {
            adventure: 0.5,
            romantic: 0.7,
            cultural: 0.9,
            hidden: 0.4,
            family: 0.7
        },
        activities: [
            "Egyptian Museum treasures",
            "Royal Palace tour",
            "Mole Antonelliana view",
            "Authentic aperitivo experience"
        ]
    },
    {
        id: "genoa",
        name: "Genoa",
        lat: 44.4056,
        lon: 8.9463,
        country: "IT",
        population: 580223,
        themes: {
            adventure: 0.6,
            romantic: 0.6,
            cultural: 0.8,
            hidden: 0.5,
            family: 0.7
        },
        activities: [
            "Via del Campo palaces",
            "Aquarium of Genoa visit",
            "Focaccia bread tasting",
            "Spianata Castelletto views"
        ]
    },
    {
        id: "verona",
        name: "Verona",
        lat: 45.4384,
        lon: 10.9916,
        country: "IT",
        population: 259610,
        themes: {
            adventure: 0.4,
            romantic: 0.9,
            cultural: 0.9,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Juliet's Balcony visit",
            "Roman Arena opera",
            "Piazza delle Erbe market",
            "Castelvecchio fortress"
        ]
    },
    {
        id: "padua",
        name: "Padua",
        lat: 45.4064,
        lon: 11.8768,
        country: "IT",
        population: 214198,
        themes: {
            adventure: 0.3,
            romantic: 0.6,
            cultural: 0.9,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Scrovegni Chapel frescoes",
            "University of Padua tour",
            "Prato della Valle square",
            "Botanical Garden visit"
        ]
    },
    {
        id: "brescia",
        name: "Brescia",
        lat: 45.5416,
        lon: 10.2118,
        country: "IT",
        population: 196745,
        themes: {
            adventure: 0.5,
            romantic: 0.5,
            cultural: 0.8,
            hidden: 0.6,
            family: 0.6
        },
        activities: [
            "Roman ruins exploration",
            "Santa Giulia Museum",
            "Brescia Castle hike",
            "Piazza della Loggia"
        ]
    },
    {
        id: "pisa",
        name: "Pisa",
        lat: 43.7228,
        lon: 10.4017,
        country: "IT",
        population: 90118,
        themes: {
            adventure: 0.3,
            romantic: 0.6,
            cultural: 0.9,
            hidden: 0.2,
            family: 0.8
        },
        activities: [
            "Leaning Tower climb",
            "Piazza dei Miracoli tour",
            "Baptistery acoustics",
            "Arno River walk"
        ]
    },
    {
        id: "la-spezia",
        name: "La Spezia",
        lat: 44.1069,
        lon: 9.8238,
        country: "IT",
        population: 93678,
        themes: {
            adventure: 0.7,
            romantic: 0.6,
            cultural: 0.6,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Naval Museum visit",
            "Cinque Terre gateway",
            "Castle of San Giorgio",
            "Local seafood market"
        ]
    },
    // Alpine cities
    {
        id: "chamonix",
        name: "Chamonix",
        lat: 45.9237,
        lon: 6.8694,
        country: "FR",
        population: 8902,
        themes: {
            adventure: 1.0,
            romantic: 0.7,
            cultural: 0.4,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Aiguille du Midi cable car",
            "Mer de Glace glacier train",
            "Mont Blanc tunnel",
            "Alpine hiking trails"
        ]
    },
    {
        id: "annecy",
        name: "Annecy",
        lat: 45.8992,
        lon: 6.1294,
        country: "FR",
        population: 128199,
        themes: {
            adventure: 0.6,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.2,
            family: 0.8
        },
        activities: [
            "Lake Annecy boat cruise",
            "Old Town canals walk",
            "Château d'Annecy visit",
            "Paragliding adventure"
        ]
    },
    {
        id: "grenoble",
        name: "Grenoble",
        lat: 45.1885,
        lon: 5.7245,
        country: "FR",
        population: 158454,
        themes: {
            adventure: 0.8,
            romantic: 0.5,
            cultural: 0.7,
            hidden: 0.3,
            family: 0.6
        },
        activities: [
            "Bastille cable car ride",
            "Museum of Grenoble art",
            "Vercors mountain excursions",
            "Old Town exploration"
        ]
    },
    {
        id: "gap",
        name: "Gap",
        lat: 44.5598,
        lon: 6.0821,
        country: "FR",
        population: 40559,
        themes: {
            adventure: 0.8,
            romantic: 0.4,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Serre-Ponçon Lake activities",
            "National Park hiking",
            "Gap Cathedral visit",
            "Mountain biking trails"
        ]
    },
    {
        id: "chambery",
        name: "Chambéry",
        lat: 45.5646,
        lon: 5.9178,
        country: "FR",
        population: 59490,
        themes: {
            adventure: 0.6,
            romantic: 0.6,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Château des Ducs de Savoie",
            "Elephant Fountain landmark",
            "Lake Bourget excursion",
            "Old Town medieval streets"
        ]
    },
    // Provence circuit
    {
        id: "avignon",
        name: "Avignon",
        lat: 43.9493,
        lon: 4.8055,
        country: "FR",
        population: 92130,
        themes: {
            adventure: 0.3,
            romantic: 0.7,
            cultural: 1.0,
            hidden: 0.2,
            family: 0.7
        },
        activities: [
            "Papal Palace tour",
            "Pont d'Avignon bridge",
            "Festival d'Avignon theater",
            "Les Halles market"
        ]
    },
    {
        id: "arles",
        name: "Arles",
        lat: 43.6761,
        lon: 4.6306,
        country: "FR",
        population: 52548,
        themes: {
            adventure: 0.4,
            romantic: 0.7,
            cultural: 0.9,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Roman amphitheater gladiators",
            "Van Gogh trail walk",
            "Alyscamps necropolis",
            "Saturday market shopping"
        ]
    },
    {
        id: "nimes",
        name: "Nîmes",
        lat: 43.8367,
        lon: 4.3601,
        country: "FR",
        population: 151001,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.9,
            hidden: 0.2,
            family: 0.7
        },
        activities: [
            "Arena of Nîmes concerts",
            "Maison Carrée temple",
            "Jardins de la Fontaine",
            "Pont du Gard aqueduct"
        ]
    },
    {
        id: "salon-de-provence",
        name: "Salon-de-Provence",
        lat: 43.6403,
        lon: 5.0982,
        country: "FR",
        population: 45328,
        themes: {
            adventure: 0.3,
            romantic: 0.5,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Nostradamus house museum",
            "Savonnerie Marius Fabre soap",
            "Château de l'Empéri",
            "Wednesday market"
        ]
    },
    {
        id: "cavaillon",
        name: "Cavaillon",
        lat: 43.8387,
        lon: 5.0378,
        country: "FR",
        population: 26224,
        themes: {
            adventure: 0.6,
            romantic: 0.4,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Via Ferrata climbing",
            "Melon festival celebration",
            "Saint-Jacques Hill hike",
            "Roman arch discovery"
        ]
    },
    // Luberon villages
    {
        id: "lourmarin",
        name: "Lourmarin",
        lat: 43.7631,
        lon: 5.3596,
        country: "FR",
        population: 1119,
        themes: {
            adventure: 0.3,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.6,
            family: 0.5
        },
        activities: [
            "Renaissance château visit",
            "Friday market shopping",
            "Albert Camus grave",
            "Café terraces"
        ]
    },
    {
        id: "bonnieux",
        name: "Bonnieux",
        lat: 43.8233,
        lon: 5.3058,
        country: "FR",
        population: 1418,
        themes: {
            adventure: 0.5,
            romantic: 0.8,
            cultural: 0.6,
            hidden: 0.7,
            family: 0.5
        },
        activities: [
            "12th-century church climb",
            "Cedar forest hike",
            "Panoramic viewpoint",
            "Local wine tasting"
        ]
    },
    {
        id: "roussillon",
        name: "Roussillon",
        lat: 43.9014,
        lon: 5.2942,
        country: "FR",
        population: 1305,
        themes: {
            adventure: 0.6,
            romantic: 0.8,
            cultural: 0.7,
            hidden: 0.5,
            family: 0.7
        },
        activities: [
            "Ochre Trail hike",
            "Ochre cliffs photography",
            "Artist galleries visit",
            "Sunset viewpoint"
        ]
    },
    {
        id: "gordes",
        name: "Gordes",
        lat: 43.9106,
        lon: 5.2019,
        country: "FR",
        population: 2067,
        themes: {
            adventure: 0.4,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.5
        },
        activities: [
            "Village Castle visit",
            "Sénanque Abbey lavender",
            "Stone village walk",
            "Terrace dining views"
        ]
    },
    // Verdon region
    {
        id: "moustiers-sainte-marie",
        name: "Moustiers-Sainte-Marie",
        lat: 43.8447,
        lon: 6.2200,
        country: "FR",
        population: 703,
        themes: {
            adventure: 0.7,
            romantic: 0.8,
            cultural: 0.6,
            hidden: 0.6,
            family: 0.5
        },
        activities: [
            "Pottery workshops visit",
            "Chapel Notre-Dame hike",
            "Golden star legend",
            "Waterfall trail"
        ]
    },
    {
        id: "castellane",
        name: "Castellane",
        lat: 43.8469,
        lon: 6.5125,
        country: "FR",
        population: 1558,
        themes: {
            adventure: 0.9,
            romantic: 0.5,
            cultural: 0.4,
            hidden: 0.6,
            family: 0.6
        },
        activities: [
            "Verdon rafting base",
            "Notre-Dame du Roc climb",
            "Canyon entrance point",
            "Saturday market"
        ]
    },
    // Coastal towns
    {
        id: "cassis",
        name: "Cassis",
        lat: 43.2148,
        lon: 5.5381,
        country: "FR",
        population: 7265,
        themes: {
            adventure: 0.7,
            romantic: 0.8,
            cultural: 0.5,
            hidden: 0.4,
            family: 0.7
        },
        activities: [
            "Calanques boat tour",
            "Cap Canaille cliffs",
            "Port-side dining",
            "Beach swimming"
        ]
    },
    {
        id: "la-ciotat",
        name: "La Ciotat",
        lat: 43.1748,
        lon: 5.6045,
        country: "FR",
        population: 35281,
        themes: {
            adventure: 0.6,
            romantic: 0.6,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.7
        },
        activities: [
            "Eden Theater cinema history",
            "Shipyard heritage tour",
            "Green Island boat trip",
            "Lumière brothers museum"
        ]
    },
    {
        id: "bandol",
        name: "Bandol",
        lat: 43.1363,
        lon: 5.7484,
        country: "FR",
        population: 8577,
        themes: {
            adventure: 0.5,
            romantic: 0.8,
            cultural: 0.6,
            hidden: 0.4,
            family: 0.7
        },
        activities: [
            "Wine estate tours",
            "Bendor Island excursion",
            "Coastal path walk",
            "Beach club relaxation"
        ]
    },
    {
        id: "toulon",
        name: "Toulon",
        lat: 43.1242,
        lon: 5.928,
        country: "FR",
        population: 171953,
        themes: {
            adventure: 0.5,
            romantic: 0.4,
            cultural: 0.6,
            hidden: 0.3,
            family: 0.6
        },
        activities: [
            "Naval Museum visit",
            "Mont Faron cable car",
            "Provençal market",
            "Harbor boat tour"
        ]
    },
    {
        id: "hyeres",
        name: "Hyères",
        lat: 43.1205,
        lon: 6.1286,
        country: "FR",
        population: 55588,
        themes: {
            adventure: 0.6,
            romantic: 0.7,
            cultural: 0.5,
            hidden: 0.4,
            family: 0.7
        },
        activities: [
            "Golden Islands ferry",
            "Villa Noailles architecture",
            "Medieval old town",
            "Salt marshes flamingos"
        ]
    },
    // Inland Provence
    {
        id: "manosque",
        name: "Manosque",
        lat: 43.8344,
        lon: 5.7869,
        country: "FR",
        population: 22349,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "L'Occitane factory tour",
            "Jean Giono center",
            "Old gates walk",
            "Saturday market"
        ]
    },
    {
        id: "sisteron",
        name: "Sisteron",
        lat: 44.1948,
        lon: 5.9451,
        country: "FR",
        population: 7450,
        themes: {
            adventure: 0.8,
            romantic: 0.5,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Citadel fortress visit",
            "Via Ferrata climbing",
            "Méouge Gorges swimming",
            "Rock climbing spots"
        ]
    },
    {
        id: "forcalquier",
        name: "Forcalquier",
        lat: 43.9597,
        lon: 5.7797,
        country: "FR",
        population: 4982,
        themes: {
            adventure: 0.5,
            romantic: 0.6,
            cultural: 0.6,
            hidden: 0.7,
            family: 0.5
        },
        activities: [
            "Citadel panoramic views",
            "Monday market experience",
            "Observatory astronomy",
            "Lavender distillery"
        ]
    },
    {
        id: "digne-les-bains",
        name: "Digne-les-Bains",
        lat: 44.0919,
        lon: 6.2358,
        country: "FR",
        population: 16333,
        themes: {
            adventure: 0.7,
            romantic: 0.4,
            cultural: 0.5,
            hidden: 0.6,
            family: 0.6
        },
        activities: [
            "Thermal spa relaxation",
            "Geological Reserve",
            "Lavender museum",
            "Train des Pignes ride"
        ]
    },
    // Additional route cities
    {
        id: "saint-maximin",
        name: "Saint-Maximin-la-Sainte-Baume",
        lat: 43.4532,
        lon: 5.8642,
        country: "FR",
        population: 16900,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.8,
            hidden: 0.5,
            family: 0.5
        },
        activities: [
            "Basilica Mary Magdalene",
            "Royal Convent hotel",
            "Organ concerts",
            "Medieval market"
        ]
    },
    {
        id: "le-luc",
        name: "Le Luc",
        lat: 43.3909,
        lon: 6.3173,
        country: "FR",
        population: 8900,
        themes: {
            adventure: 0.3,
            romantic: 0.4,
            cultural: 0.4,
            hidden: 0.6,
            family: 0.5
        },
        activities: [
            "Hexagonal bell tower",
            "Wine cooperative visit",
            "Local market Friday",
            "Historic center walk"
        ]
    },
    {
        id: "frejus",
        name: "Fréjus",
        lat: 43.4326,
        lon: 6.7365,
        country: "FR",
        population: 52389,
        themes: {
            adventure: 0.5,
            romantic: 0.6,
            cultural: 0.7,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Roman amphitheater",
            "Aqueduct remains",
            "Cathedral cloister",
            "Beach activities"
        ]
    },
    {
        id: "mandelieu",
        name: "Mandelieu-la-Napoule",
        lat: 43.5487,
        lon: 6.9393,
        country: "FR",
        population: 22714,
        themes: {
            adventure: 0.5,
            romantic: 0.7,
            cultural: 0.5,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "La Napoule Castle",
            "Golf courses",
            "Marina walks",
            "Mimosa festival"
        ]
    },
    {
        id: "villeneuve-loubet",
        name: "Villeneuve-Loubet",
        lat: 43.633,
        lon: 7.1275,
        country: "FR",
        population: 14427,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.7
        },
        activities: [
            "Marina Baie des Anges",
            "Escoffier Museum cuisine",
            "Beach park activities",
            "Medieval village visit"
        ]
    },
    {
        id: "cagnes-sur-mer",
        name: "Cagnes-sur-Mer",
        lat: 43.6635,
        lon: 7.1491,
        country: "FR",
        population: 51049,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Renoir Museum gardens",
            "Haut-de-Cagnes medieval",
            "Grimaldi Castle museum",
            "Hippodrome racing"
        ]
    },
    // Italian coastal towns
    {
        id: "ventimiglia",
        name: "Ventimiglia",
        lat: 43.7923,
        lon: 7.6079,
        country: "IT",
        population: 24071,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.5
        },
        activities: [
            "Hanbury Botanical Gardens",
            "Friday market bargains",
            "Old Town exploration",
            "Beach promenade"
        ]
    },
    {
        id: "imperia",
        name: "Imperia",
        lat: 43.8851,
        lon: 8.0276,
        country: "IT",
        population: 42060,
        themes: {
            adventure: 0.5,
            romantic: 0.6,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Olive Oil Museum",
            "Porto Maurizio old town",
            "Villa Grock park",
            "Parasio district walk"
        ]
    },
    {
        id: "savona",
        name: "Savona",
        lat: 44.3071,
        lon: 8.481,
        country: "IT",
        population: 60853,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.7,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Priamar Fortress",
            "Sistine Chapel replica",
            "Torre Leon Pancaldo",
            "Local ceramics shopping"
        ]
    },
    {
        id: "finale-ligure",
        name: "Finale Ligure",
        lat: 44.1697,
        lon: 8.3442,
        country: "IT",
        population: 11665,
        themes: {
            adventure: 0.8,
            romantic: 0.7,
            cultural: 0.5,
            hidden: 0.7,
            family: 0.7
        },
        activities: [
            "Rock climbing paradise",
            "Finalborgo medieval town",
            "Beach activities",
            "Mountain biking trails"
        ]
    },
    {
        id: "alassio",
        name: "Alassio",
        lat: 44.0063,
        lon: 8.1726,
        country: "IT",
        population: 10947,
        themes: {
            adventure: 0.4,
            romantic: 0.7,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.7
        },
        activities: [
            "Muretto celebrity wall",
            "Sandy beaches",
            "Via Julia Augusta walk",
            "English promenade"
        ]
    },
    // Additional Italian cities
    {
        id: "massa",
        name: "Massa",
        lat: 44.0366,
        lon: 10.1411,
        country: "IT",
        population: 68946,
        themes: {
            adventure: 0.5,
            romantic: 0.5,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.5
        },
        activities: [
            "Malaspina Castle",
            "Marble quarries tour",
            "Ducal Palace visit",
            "Beach resort area"
        ]
    },
    {
        id: "viareggio",
        name: "Viareggio",
        lat: 43.8717,
        lon: 10.2441,
        country: "IT",
        population: 62467,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.6,
            hidden: 0.3,
            family: 0.7
        },
        activities: [
            "Carnival parade festival",
            "Liberty architecture walk",
            "Beach establishments",
            "Pineta park cycling"
        ]
    },
    {
        id: "empoli",
        name: "Empoli",
        lat: 43.719,
        lon: 10.9464,
        country: "IT",
        population: 48626,
        themes: {
            adventure: 0.3,
            romantic: 0.4,
            cultural: 0.6,
            hidden: 0.6,
            family: 0.5
        },
        activities: [
            "Glass Museum visit",
            "Collegiate Church art",
            "Weekly market Thursday",
            "Historic center stroll"
        ]
    },
    // Northern route cities
    {
        id: "pertuis",
        name: "Pertuis",
        lat: 43.6937,
        lon: 5.5028,
        country: "FR",
        population: 19459,
        themes: {
            adventure: 0.3,
            romantic: 0.4,
            cultural: 0.5,
            hidden: 0.5,
            family: 0.5
        },
        activities: [
            "Saint-Jacques church",
            "Friday market shopping",
            "Clock tower visit",
            "Durance River walks"
        ]
    },
    // Wine route
    {
        id: "chateauneuf-du-pape",
        name: "Châteauneuf-du-Pape",
        lat: 44.0556,
        lon: 4.8306,
        country: "FR",
        population: 2179,
        themes: {
            adventure: 0.3,
            romantic: 0.8,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.4
        },
        activities: [
            "Wine estate tastings",
            "Château ruins sunset",
            "Wine museum visit",
            "Vineyard tours"
        ]
    },
    {
        id: "orange",
        name: "Orange",
        lat: 44.1361,
        lon: 4.8083,
        country: "FR",
        population: 29183,
        themes: {
            adventure: 0.3,
            romantic: 0.5,
            cultural: 0.9,
            hidden: 0.3,
            family: 0.6
        },
        activities: [
            "Roman Theatre performances",
            "Triumphal Arch visit",
            "Museum exhibitions",
            "Old Town exploration"
        ]
    },
    {
        id: "vaison-la-romaine",
        name: "Vaison-la-Romaine",
        lat: 44.2417,
        lon: 5.0733,
        country: "FR",
        population: 6179,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.9,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Roman ruins exploration",
            "Medieval upper town",
            "Roman bridge crossing",
            "Tuesday market"
        ]
    },
    {
        id: "carpentras",
        name: "Carpentras",
        lat: 44.0550,
        lon: 5.0478,
        country: "FR",
        population: 28798,
        themes: {
            adventure: 0.3,
            romantic: 0.5,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Friday truffle market",
            "Synagogue oldest France",
            "Berlingot candy tasting",
            "Cathedral Saint-Siffrein"
        ]
    },
    // Rhône Valley
    {
        id: "montelimar",
        name: "Montélimar",
        lat: 44.5583,
        lon: 4.7506,
        country: "FR",
        population: 39352,
        themes: {
            adventure: 0.3,
            romantic: 0.4,
            cultural: 0.5,
            hidden: 0.4,
            family: 0.7
        },
        activities: [
            "Nougat factory tours",
            "Château des Adhémar",
            "Miniature museum",
            "Wednesday market"
        ]
    },
    {
        id: "valence",
        name: "Valence",
        lat: 44.9333,
        lon: 4.8923,
        country: "FR",
        population: 62481,
        themes: {
            adventure: 0.4,
            romantic: 0.5,
            cultural: 0.6,
            hidden: 0.3,
            family: 0.6
        },
        activities: [
            "Kiosque Peynet landmark",
            "Saint-Apollinaire Cathedral",
            "Museum of Fine Arts",
            "Jouvet Park stroll"
        ]
    },
    // Italian wine region
    {
        id: "alba",
        name: "Alba",
        lat: 44.7009,
        lon: 8.0353,
        country: "IT",
        population: 31420,
        themes: {
            adventure: 0.3,
            romantic: 0.7,
            cultural: 0.7,
            hidden: 0.5,
            family: 0.4
        },
        activities: [
            "White truffle hunting",
            "Barolo wine tours",
            "Medieval towers visit",
            "Saturday truffle market"
        ]
    },
    {
        id: "asti",
        name: "Asti",
        lat: 44.9008,
        lon: 8.2064,
        country: "IT",
        population: 76211,
        themes: {
            adventure: 0.3,
            romantic: 0.6,
            cultural: 0.7,
            hidden: 0.4,
            family: 0.5
        },
        activities: [
            "Asti Spumante cellars",
            "Palio horse race",
            "Cathedral of Asti",
            "Torre Rossa climb"
        ]
    },
    {
        id: "como",
        name: "Como",
        lat: 45.8080,
        lon: 9.0852,
        country: "IT",
        population: 85263,
        themes: {
            adventure: 0.5,
            romantic: 0.9,
            cultural: 0.7,
            hidden: 0.2,
            family: 0.6
        },
        activities: [
            "Lake Como boat tours",
            "Funicular to Brunate",
            "Como Cathedral visit",
            "Villa Olmo gardens"
        ]
    },
    {
        id: "bergamo",
        name: "Bergamo",
        lat: 45.6983,
        lon: 9.6773,
        country: "IT",
        population: 120287,
        themes: {
            adventure: 0.5,
            romantic: 0.7,
            cultural: 0.8,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Città Alta walls walk",
            "Funicular railway ride",
            "Accademia Carrara art",
            "Piazza Vecchia dining"
        ]
    },
    // Camargue region
    {
        id: "saintes-maries-de-la-mer",
        name: "Saintes-Maries-de-la-Mer",
        lat: 43.4519,
        lon: 4.4286,
        country: "FR",
        population: 2478,
        themes: {
            adventure: 0.6,
            romantic: 0.6,
            cultural: 0.6,
            hidden: 0.5,
            family: 0.6
        },
        activities: [
            "Fortified church visit",
            "Gypsy pilgrimage festival",
            "Horse riding beaches",
            "Flamingo watching"
        ]
    },
    {
        id: "aigues-mortes",
        name: "Aigues-Mortes",
        lat: 43.5667,
        lon: 4.1903,
        country: "FR",
        population: 8560,
        themes: {
            adventure: 0.4,
            romantic: 0.6,
            cultural: 0.8,
            hidden: 0.4,
            family: 0.6
        },
        activities: [
            "Medieval ramparts walk",
            "Tower of Constance",
            "Salt works tour",
            "Canal boat trips"
        ]
    },
    // Hidden gems
    {
        id: "caseneuve",
        name: "Caseneuve",
        lat: 44.0447,
        lon: 5.4247,
        country: "FR",
        population: 500,
        themes: {
            adventure: 0.5,
            romantic: 0.7,
            cultural: 0.6,
            hidden: 0.9,
            family: 0.4
        },
        activities: [
            "Medieval castle ruins",
            "Largest oratory Provence",
            "L'Authentic bistrot",
            "Village panoramic views"
        ]
    },
    {
        id: "le-paradou",
        name: "Le Paradou",
        lat: 43.7167,
        lon: 4.7833,
        country: "FR",
        population: 400,
        themes: {
            adventure: 0.3,
            romantic: 0.8,
            cultural: 0.5,
            hidden: 0.9,
            family: 0.5
        },
        activities: [
            "Bistrot du Paradou dining",
            "Queen Jeanne pavilion",
            "Local artist galleries",
            "Alpilles hiking trails"
        ]
    },
    {
        id: "eguilles",
        name: "Éguilles",
        lat: 43.5667,
        lon: 5.3500,
        country: "FR",
        population: 7826,
        themes: {
            adventure: 0.3,
            romantic: 0.7,
            cultural: 0.5,
            hidden: 0.8,
            family: 0.5
        },
        activities: [
            "Hilltop village views",
            "Sunset terrace dining",
            "Medieval castle remains",
            "Local wine producers"
        ]
    },
    {
        id: "lamanon",
        name: "Lamanon",
        lat: 43.7042,
        lon: 5.0823,
        country: "FR",
        population: 2024,
        themes: {
            adventure: 0.6,
            romantic: 0.5,
            cultural: 0.7,
            hidden: 0.8,
            family: 0.5
        },
        activities: [
            "Grottes de Calès caves",
            "116 troglodyte dwellings",
            "Medieval chapel ruins",
            "Nature trail hiking"
        ]
    }
];