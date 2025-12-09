// Sample route: Aix-en-Provence → Barcelona (Adventure Agent)
// This is a real-looking route showcasing the quality of our AI generation

export const sampleRoute = {
  origin: {
    name: "Aix-en-Provence",
    latitude: 43.5297,
    longitude: 5.4474,
    description: "Your starting point in the heart of Provence"
  },
  destination: {
    name: "Barcelona",
    latitude: 41.3851,
    longitude: 2.1734,
    description: "Vibrant Catalan capital on the Mediterranean coast"
  },
  waypoints: [
    {
      name: "Montpellier",
      latitude: 43.6108,
      longitude: 3.8767,
      description: "Dynamic university city with medieval charm and modern energy",
      activities: [
        "Explore Place de la Comédie and historic center",
        "Visit the stunning Musée Fabre art museum",
        "Stroll through the Jardin des Plantes botanical garden"
      ],
      duration: "1 day",
      distanceFromPrevious: 146,
      image: "/images/cities/montpellier.jpg"
    },
    {
      name: "Perpignan",
      latitude: 42.6887,
      longitude: 2.8948,
      description: "Gateway to Catalonia with a distinct Franco-Spanish culture",
      activities: [
        "Discover the Palace of the Kings of Majorca",
        "Wander through the old town's narrow streets",
        "Visit Le Castillet, the iconic brick gateway"
      ],
      duration: "1 day",
      distanceFromPrevious: 112,
      image: "/images/cities/perpignan.jpg"
    },
    {
      name: "Figueres",
      latitude: 42.2667,
      longitude: 2.9614,
      description: "Home to the surreal Dalí Theatre-Museum",
      activities: [
        "Explore the mind-bending Dalí Theatre-Museum",
        "Walk the historic Rambla de Figueres",
        "Visit the Sant Ferran Castle fortress"
      ],
      duration: "Half day",
      distanceFromPrevious: 52,
      image: "/images/cities/figueres.jpg"
    }
  ],
  alternatives: [
    {
      name: "Nîmes",
      description: "Roman monuments and Mediterranean charm",
      why: "Incredible Roman amphitheater and Maison Carrée temple"
    },
    {
      name: "Girona",
      description: "Medieval city with stunning cathedral",
      why: "Walk the ancient walls and explore Jewish Quarter"
    }
  ],
  totalDistance: 453,
  estimatedDuration: "7-8 hours driving",
  agent: {
    name: "Adventure Agent",
    color: "#34C759",
    icon: "⛰️",
    focus: "Outdoor activities, hiking trails, and natural landscapes"
  },
  highlights: [
    "Mediterranean coastal views",
    "Franco-Spanish cultural fusion",
    "Surrealist art and architecture",
    "Historic medieval towns"
  ],
  bestTime: "Spring (April-June) or Fall (September-October) for ideal weather",
  itinerary: {
    day1: {
      title: "Aix-en-Provence → Montpellier",
      activities: [
        "Morning: Depart Aix-en-Provence",
        "Afternoon: Arrive Montpellier, lunch at Place de la Comédie",
        "Evening: Explore historic center, dinner in Ecusson district"
      ],
      accommodation: "Hotel in Montpellier city center"
    },
    day2: {
      title: "Montpellier → Perpignan",
      activities: [
        "Morning: Visit Musée Fabre, coffee at Jardin des Plantes",
        "Afternoon: Drive to Perpignan (2h), arrive for late lunch",
        "Evening: Explore Palace of the Kings of Majorca at sunset"
      ],
      accommodation: "Hotel near Perpignan old town"
    },
    day3: {
      title: "Perpignan → Figueres → Barcelona",
      activities: [
        "Morning: Drive to Figueres (1h), immerse in Dalí Museum",
        "Afternoon: Continue to Barcelona (2h), check into hotel",
        "Evening: First taste of Barcelona - tapas in Gothic Quarter"
      ],
      accommodation: "Hotel in Barcelona"
    }
  }
}

export const sampleRouteMetadata = {
  generatedAt: "2 hours ago",
  totalStops: 3,
  budget: "Comfortable",
  selectedAgent: "adventure"
}
