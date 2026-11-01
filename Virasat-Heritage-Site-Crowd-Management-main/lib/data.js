export const SITES = [
  { id: "taj", name: "Taj Mahal", city: "Agra", built: "1632–1653", capacity: 40000,
    blurb: "An ivory-white marble mausoleum commissioned by Emperor Shah Jahan for Mumtaz Mahal, a UNESCO World Heritage Site and icon of Mughal architecture.",
    facts: ["Took ~20,000 artisans 22 years", "Changes colour from dawn to dusk", "Closed on Fridays for prayers"],
    hours: "Sunrise – Sunset", tickets: { Indian: 50, Foreigner: 1100, Child: 0 },
    crowd: [20, 45, 70, 90, 95, 80, 65, 55, 40, 25] },
  { id: "fort", name: "Red Fort", city: "Delhi", built: "1639–1648", capacity: 25000,
    blurb: "The red sandstone citadel of the Mughal emperors, from where India's Prime Minister addresses the nation each Independence Day.",
    facts: ["Walls rise 33m on the city side", "UNESCO site since 2007", "Evening light & sound show"],
    hours: "9:30 AM – 4:30 PM", tickets: { Indian: 35, Foreigner: 550, Child: 0 },
    crowd: [10, 30, 55, 75, 85, 90, 70, 50, 30, 15] },
  { id: "hampi", name: "Hampi", city: "Karnataka", built: "14th–16th c.", capacity: 15000,
    blurb: "Ruins of the Vijayanagara Empire's capital, a boulder-strewn landscape of temples, bazaars and royal enclosures.",
    facts: ["Stone chariot at Vittala Temple", "Musical pillars of Vittala", "1,600+ surviving monuments"],
    hours: "6:00 AM – 6:00 PM", tickets: { Indian: 40, Foreigner: 600, Child: 0 },
    crowd: [15, 25, 40, 55, 60, 50, 45, 35, 25, 10] },
  { id: "konark", name: "Konark Sun Temple", city: "Odisha", built: "13th c.", capacity: 12000,
    blurb: "A colossal chariot of the Sun God, with 24 intricately carved stone wheels that double as sundials.",
    facts: ["Built by King Narasimhadeva I", "Wheels tell time to the minute", "Depicted on the ₹10 note"],
    hours: "6:00 AM – 8:00 PM", tickets: { Indian: 40, Foreigner: 600, Child: 0 },
    crowd: [20, 35, 50, 65, 70, 55, 45, 40, 30, 20] },
];
export const HOURS = ["6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p"];
export const SLOTS = ["6:00 – 8:00", "8:00 – 10:00", "10:00 – 12:00", "12:00 – 2:00", "2:00 – 4:00", "4:00 – 6:00"];
export const level = (v) => (v < 40 ? ["Calm", "#7fbf7b"] : v < 70 ? ["Moderate", "#e0b84c"] : ["Crowded", "#d9573b"]);
