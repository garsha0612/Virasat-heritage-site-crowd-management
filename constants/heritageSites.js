/**
 * ANVAYA – Heritage Site Crowd Management System
 * Initial Pilot Monuments Dataset & Helper Methods
 * 
 * DISCLAIMER:
 * All visitor volume statistics, crowd classifications, and capacity calculations
 * in this dataset represent algorithmic demonstration data for testing the 
 * smart-tourism crowd management platform.
 */

export const CROWD_THRESHOLDS = {
  LOW_MAX: 40,
  MODERATE_MAX: 70,
  HIGH_MAX: 100,
};

/**
 * Helper to calculate crowd status and color indicator from an occupancy percentage.
 * @param {number} percentage - Integer or float 0 to 100
 * @returns {{ key: 'low' | 'moderate' | 'high', label: string, color: string, badgeBg: string, dotColor: string, advisory: string }}
 */
export function getCrowdClassification(percentage) {
  if (percentage <= CROWD_THRESHOLDS.LOW_MAX) {
    return {
      key: 'low',
      label: 'Low Crowd',
      advisory: 'Optimal window for photography, quiet contemplation, and unhurried exploration.',
      color: '#10B981',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    };
  }
  if (percentage <= CROWD_THRESHOLDS.MODERATE_MAX) {
    return {
      key: 'moderate',
      label: 'Moderate Crowd',
      advisory: 'Standard visitor flow. Minor queuing expected at main security and ticketing checkpoints.',
      color: '#F59E0B',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
    };
  }
  return {
    key: 'high',
    label: 'High Density',
    advisory: 'Approaching peak visitor limits. Advance digital time-slot reservation strongly advised to avoid turnstile delays.',
    color: '#EF4444',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500',
  };
}

export const HERITAGE_SITES = [
  {
    id: 'site-001',
    slug: 'taj-mahal',
    aliases: ['taj'],
    name: 'Taj Mahal',
    tagline: 'An Eternal Poem in White Marble',
    location: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    category: 'Mughal Architecture',
    historicalEra: '1631–1648 CE',
    rating: 4.9,
    reviewCount: 14820,
    shortDescription:
      'An immense mausoleum of ivory-white marble commissioned in 1631 by Mughal Emperor Shah Jahan for Mumtaz Mahal. Celebrated worldwide as the pinnacle of Indo-Islamic funerary architecture and a UNESCO World Heritage treasure.',
    history:
      'Commissioned by Emperor Shah Jahan in 1631 to enshrine the tomb of his favorite consort Mumtaz Mahal, the Taj Mahal stands on the southern bank of the Yamuna River. Designed by a council of architects led by Ustad Ahmad Lahori, the construction marshaled over 20,000 artisans, sculptors, and calligraphers over two decades. The central marble tomb was completed in 1648, while the ancillary minarets, mosque, jawab, and Charbagh gardens were finalized around 1653.',
    architecture:
      'Built entirely of translucent white Makrana marble inlaid with twenty-eight varieties of semi-precious stones via the pietra dura (parchin kari) technique. The complex exhibits perfect bilateral symmetry across a central north-south axis, punctuated by four 40-meter minarets deliberately tilted outwards to safeguard the tomb from seismic shockwaves. The bulbous onion dome soars 35 meters above the drum, enclosed within four smaller domed chattris.',
    keyFacts: [
      'Employs perfect bilateral symmetry, except for the later asymmetrical tomb of Shah Jahan.',
      'Translucent Makrana marble changes color from pinkish at dawn to milky white at noon and golden under moonlight.',
      'The four corner minarets incline slightly outward (2 degrees) as a seismic preservation safeguard.',
      'Designated a UNESCO World Heritage Site in 1983 and voted one of the New 7 Wonders of the World.',
    ],
    visitingHours: {
      open: '06:00',
      close: '18:30',
      note: 'Closed on Fridays for prayers. Night viewing permitted for five nights surrounding the full moon.',
    },
    ticketPricing: {
      indian: 50,
      foreigner: 1100,
      child: 0,
      student: 25,
      mainMausoleumAddon: 200,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 5000,
      dailyPermits: 35000,
      currentSimulatedVisitors: 1800,
      occupancyPercentage: 36,
      status: 'low',
    },
    bestTimeToVisit: 'Sunrise (06:00–08:30) or late afternoon (16:00–18:00) during October to March.',
    rules: [
      'Shoe covers must be worn on the upper marble plinth.',
      'No food, tobacco, tripods, or large bags permitted inside security gates.',
      'Strict silence is enforced inside the central tomb chamber.',
      'Drone videography is strictly prohibited under monument preservation laws.',
    ],
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&w=1000&q=80',
        caption: 'Central dome and reflecting pool along the Charbagh axis',
      },
      {
        url: 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?auto=format&fit=crop&w=1000&q=80',
        caption: 'Parchin Kari pietra dura marble floral inlay detail',
      },
      {
        url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1000&q=80',
        caption: 'Red sandstone mosque flanking the western terrace',
      },
    ],
    isDemoData: true,
  },
  {
    id: 'site-002',
    slug: 'red-fort',
    aliases: ['lal-qila'],
    name: 'Red Fort',
    tagline: 'Citadel of the Mughal Empire',
    location: 'Old Delhi',
    state: 'Delhi',
    country: 'India',
    category: 'UNESCO World Heritage',
    historicalEra: '1638–1648 CE',
    rating: 4.6,
    reviewCount: 9410,
    shortDescription:
      'Constructed by Shah Jahan upon shifting the capital to Shahjahanabad, this formidable red sandstone fortress served as the political seat of the Mughals and remains an enduring national symbol of Indian sovereignty.',
    history:
      'Commissioned in 1638 by Emperor Shah Jahan when he resolved to shift his capital from Agra to Delhi, the fortress was completed in 1648 under the supervision of architect Ustad Ahmad Lahori. The citadel incorporated palaces, administrative halls, barracks, and gardens. On 15 August 1947, Prime Minister Jawaharlal Nehru hoisted the Indian tricolor above the Lahori Gate, establishing a continuous national tradition commemorated every Independence Day.',
    architecture:
      'Enclosed by massive red sandstone ramparts spanning 2.4 kilometers with walls rising up to 33 meters. The interior showcases a synthesis of Persian, Timurid, and Hindu architectural styles. Notable structures include the Diwan-i-Aam (Hall of Public Audience) with its marble throne plinth, the Diwan-i-Khas (Hall of Private Audience) once housing the Peacock Throne, and the Nahr-i-Bihisht (Canal of Paradise) aqueduct system connecting the imperial pavilions.',
    keyFacts: [
      'The Lahori Gate serves as the ceremonial backdrop for the Prime Minister’s annual Independence Day address.',
      'Originally named Qila-i-Mubarak ("The Blessed Fort") by Emperor Shah Jahan.',
      'Fed water continuously from the Yamuna River via the ingenious Nahr-i-Bihisht stream channel.',
      'Inscribed on the UNESCO World Heritage list in 2007.',
    ],
    visitingHours: {
      open: '09:30',
      close: '16:30',
      note: 'Closed on Mondays. Evening Sound and Light show operated in Hindi and English.',
    },
    ticketPricing: {
      indian: 35,
      foreigner: 550,
      child: 0,
      student: 20,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 4000,
      dailyPermits: 28000,
      currentSimulatedVisitors: 2440,
      occupancyPercentage: 61,
      status: 'moderate',
    },
    bestTimeToVisit: 'Morning hours (09:30–11:30) or late afternoon during winter (November to February).',
    rules: [
      'Airport-style metal detection security screening at entry gates.',
      'Luggage lockers available near the ticket counter for large bags.',
      'Eating inside heritage pavilions is prohibited.',
    ],
    image: 'https://images.unsplash.com/photo-1598324789736-4861f89564a0?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=1000&q=80',
        caption: 'Lahori Gate grand portal entrance',
      },
      {
        url: 'https://images.unsplash.com/photo-1592635196078-9fe3d54f2377?auto=format&fit=crop&w=1000&q=80',
        caption: 'Diwan-i-Khas white marble arches and pietra dura motifs',
      },
    ],
    isDemoData: true,
  },
  {
    id: 'site-003',
    slug: 'qutub-minar',
    aliases: ['qutb-minar'],
    name: 'Qutub Minar',
    tagline: 'Tallest Fluted Brick Minaret in the World',
    location: 'Mehrauli',
    state: 'Delhi',
    country: 'India',
    category: 'Indo-Islamic Victory Tower',
    historicalEra: '1192–1220 CE',
    rating: 4.7,
    reviewCount: 8120,
    shortDescription:
      'A soaring 72.5-meter victory tower founded by Qutb-ud-din Aibak, flanked by the rust-resistant 4th-century Iron Pillar of Chandragupta II and intricate Arabic epigraphical carvings in red sandstone.',
    history:
      'Initiated in 1192 by Qutb-ud-din Aibak, the founder of the Delhi Sultanate, to mark the advent of Islamic rule and serve as a minaret for the Quwwat-ul-Islam Mosque. Aibak completed the baseline ground story; his successor Shams-ud-din Iltutmish added three more stories of red sandstone. In 1368, Firoz Shah Tughlaq repaired damage from a lightning strike and added the top two stories in white marble and red sandstone.',
    architecture:
      'Standing 72.5 meters tall with a base diameter of 14.3 meters tapering to 2.7 meters at the pinnacle. Comprises five distinct storeys, each demarcated by a projecting balcony supported by delicate stalactite corbels. The exterior surfaces feature alternating angular and fluted sandstone pilasters carved with Kufic calligraphy and geometric arabesques.',
    keyFacts: [
      'The highest stone tower and brick minaret anywhere in the world.',
      'The adjacent Iron Pillar has stood exposed to weather for over 1,600 years without rusting.',
      'Contains 379 spiral stone steps to the summit (interior stairway closed to the public).',
      'The Qutub complex also preserves the monumental unfinished Alai Minar begun by Alauddin Khalji.',
    ],
    visitingHours: {
      open: '07:00',
      close: '19:00',
      note: 'Open seven days a week. Spectacular architectural illumination after sunset.',
    },
    ticketPricing: {
      indian: 40,
      foreigner: 600,
      child: 0,
      student: 20,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 2500,
      dailyPermits: 18000,
      currentSimulatedVisitors: 2050,
      occupancyPercentage: 82,
      status: 'high',
    },
    bestTimeToVisit: 'Early morning (07:00–09:00) or during evening illumination (17:30–19:00).',
    rules: [
      'Interior tower stairway remains closed for public safety.',
      'Touching the 4th-century Iron Pillar is prevented by a protective fence.',
      'Commercial filming requires prior ASI sanction.',
    ],
    image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?auto=format&fit=crop&w=1000&q=80',
        caption: 'Intricate sandstone balcony corbels and Arabic calligraphy',
      },
      {
        url: 'https://images.unsplash.com/photo-1600100397608-f010f443831b?auto=format&fit=crop&w=1000&q=80',
        caption: 'Quwwat-ul-Islam cloisters and Iron Pillar courtyard',
      },
    ],
    isDemoData: true,
  },
  {
    id: 'site-004',
    slug: 'hampi',
    aliases: ['hampi-monuments'],
    name: 'Hampi Monuments',
    tagline: 'Granite Splendor of the Vijayanagara Empire',
    location: 'Vijayanagara',
    state: 'Karnataka',
    country: 'India',
    category: 'Vijayanagara Ruins',
    historicalEra: '14th–16th Century CE',
    rating: 4.8,
    reviewCount: 6540,
    shortDescription:
      'Spanning a boulder-strewn landscape along the Tungabhadra River, Hampi contains over 1,600 surviving monuments, including the iconic Stone Chariot at the Vijaya Vittala Temple and the towering Virupaksha gopura.',
    history:
      'Founded in 1336 by Harihara I and Bukka Raya I, Hampi served as the imperial capital of the Vijayanagara Empire—one of the wealthiest and largest medieval empires in South Asia. Chronicled by Portuguese, Persian, and Italian travelers as a metropolis rivaling Rome. The city was sacked following the Battle of Talikota in 1565, leaving behind an astonishing open-air archaeological landscape.',
    architecture:
      'Monuments are carved from local coarse-grained granite boulders using mortis-and-tenon interlocking stone masonry. Highlights include the Vijaya Vittala Temple with its 56 musical pillars that produce acoustic resonance when tapped, the monolithic Sasivekalu and Kadalekalu Ganeshas, the Lotus Mahal pavilion blending Indo-Islamic arches, and the Queen’s Bath.',
    keyFacts: [
      'The Stone Chariot is depicted on the reverse of the modern Indian ₹50 banknote.',
      'The Virupaksha Temple has functioned as an active worship shrine continuously since the 7th century.',
      'The archaeological site covers over 4,100 hectares with more than 1,600 identified monuments.',
      'Designated a UNESCO World Heritage Site in 1986.',
    ],
    visitingHours: {
      open: '06:00',
      close: '18:00',
      note: 'The landscape is open sunrise to sunset. Vittala Temple and Zenana Enclosure require paid permits.',
    },
    ticketPricing: {
      indian: 40,
      foreigner: 600,
      child: 0,
      student: 20,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 6000,
      dailyPermits: 25000,
      currentSimulatedVisitors: 1440,
      occupancyPercentage: 24,
      status: 'low',
    },
    bestTimeToVisit: 'November to February for mild winter temperatures ideal for bicycling across the ruins.',
    rules: [
      'Climbing on delicate monolithic sculptures or chariot wheels is strictly prohibited.',
      'Respect active religious ceremonies inside the Virupaksha sanctum.',
      'Wear sturdy walking shoes for rocky granite terrain.',
    ],
    image: 'https://images.unsplash.com/photo-1600100397608-f010f443831b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80',
        caption: 'Stone Chariot shrine dedicated to Garuda in Vittala complex',
      },
      {
        url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80',
        caption: 'Virupaksha temple gopuram towering above Hampi Bazaar',
      },
    ],
    isDemoData: true,
  },
  {
    id: 'site-005',
    slug: 'sun-temple-konark',
    aliases: ['konark'],
    name: 'Sun Temple Konark',
    tagline: 'The Grand Cosmic Chariot of Surya',
    location: 'Puri',
    state: 'Odisha',
    country: 'India',
    category: 'Kalinga Sacred Architecture',
    historicalEra: '1250 CE',
    rating: 4.8,
    reviewCount: 7890,
    shortDescription:
      'Conceived as a colossal chariot for the Sun God Surya, featuring 24 exquisitely carved stone wheels that function as accurate astronomical sundials, pulled by seven caparisoned stone horses.',
    history:
      'Commissioned around 1250 CE by King Narasimhadeva I of the Eastern Ganga Dynasty to commemorate military victories and celebrate the Sun God Surya. Built near the Bay of Bengal coastline, European sailors referred to the grand tower as the "Black Pagoda" because it served as an essential maritime navigational landmark along the coast.',
    architecture:
      'Constructed in the classical Kalinga deula architectural idiom using Khondalite and Chlorite stone blocks bonded by iron dowels. The sanctum and porch are sculpted in the form of Surya’s celestial chariot, resting on 24 giant stone wheels (nearly 10 feet in diameter) with spokes aligned to calculate time down to minutes based on solar shadow lines. Sculptural reliefs depict dancers, celestial musicians, and fauna.',
    keyFacts: [
      'The chariot wheels function as precise sundials, with the shadow cast on the spokes indicating the exact time of day.',
      'Represented on the reverse of the Indian ₹10 currency note.',
      'Seven sculpted stone horses represent the seven days of the week and seven spectral solar colors.',
      'Declared a UNESCO World Heritage Site in 1984.',
    ],
    visitingHours: {
      open: '06:00',
      close: '20:00',
      note: 'Open daily. Annual Konark Dance Festival held every December.',
    },
    ticketPricing: {
      indian: 40,
      foreigner: 600,
      child: 0,
      student: 20,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 3500,
      dailyPermits: 22000,
      currentSimulatedVisitors: 2030,
      occupancyPercentage: 58,
      status: 'moderate',
    },
    bestTimeToVisit: 'October through March. Sunrise is spectacular as dawn rays strike the Jagamohana portal.',
    rules: [
      'Sanctum interior has been sealed with sand for structural conservation since 1903.',
      'Do not touch or lean against intricately carved Chlorite stone reliefs.',
      'Guides must possess official Archaeological Survey of India (ASI) badges.',
    ],
    image: 'https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&w=1000&q=80',
        caption: 'Intricately carved stone sundial wheel of Konark',
      },
      {
        url: 'https://images.unsplash.com/photo-1598324789736-4861f89564a0?auto=format&fit=crop&w=1000&q=80',
        caption: 'Dancing celestial musicians in the Natya Mandap',
      },
    ],
    isDemoData: true,
  },
  {
    id: 'site-006',
    slug: 'ajanta-caves',
    aliases: ['ajanta'],
    name: 'Ajanta Caves',
    tagline: 'Masterpieces of Ancient Buddhist Rock-Cut Art',
    location: 'Chhatrapati Sambhaji Nagar',
    state: 'Maharashtra',
    country: 'India',
    category: 'Ancient Rock-Cut Architecture',
    historicalEra: '2nd Century BCE – 480 CE',
    rating: 4.9,
    reviewCount: 6180,
    shortDescription:
      'Thirty rock-hewn Buddhist cave monuments carved into a sheer horseshoe gorge above the Waghur River, world-renowned for expressive tempera murals illustrating the Jataka tales and seated Buddha sanctuaries.',
    history:
      'Excavated across two major phases: the first under the Satavahana dynasty (circa 2nd century BCE to 1st century CE) representing Theravada Buddhism, and the second major expansion under the Vakataka dynasty during the reign of Harishena (circa 5th century CE) representing Mahayana traditions. The site was abandoned in the 6th century and swallowed by jungle foliage until rediscovery in 1819 by British officer John Smith.',
    architecture:
      'Consists of 30 caves carved directly into volcanic basalt trap rock, encompassing both chaitya grihas (stupa prayer halls with vaulted apses) and viharas (monastic residential monasteries with cell chambers). The tempera mural paintings—celebrated for expressive fluid outlines and emotive gazes—depict the previous lives of the Buddha (Jatakas) and court life.',
    keyFacts: [
      'Cave 26 features a breathtaking 7-meter reclining sculpture of the Mahaparinirvana of the Buddha.',
      'Cave 1 houses the celebrated Padmapani and Vajrapani Bodhisattva murals.',
      'Rediscovered accidentally in April 1819 during a tiger hunt by an officer of the Madras Presidency Army.',
      'One of India’s inaugural UNESCO World Heritage Sites, inscribed in 1983.',
    ],
    visitingHours: {
      open: '09:00',
      close: '17:30',
      note: 'Closed on Mondays. Eco-friendly shuttle buses operate from the T-Junction visitor center.',
    },
    ticketPricing: {
      indian: 40,
      foreigner: 600,
      child: 0,
      student: 20,
      currency: 'INR (₹)',
    },
    capacity: {
      maxInstantaneous: 1800,
      dailyPermits: 12000,
      currentSimulatedVisitors: 558,
      occupancyPercentage: 31,
      status: 'low',
    },
    bestTimeToVisit: 'Monsoon season (July to September) for lush waterfalls, or winter (October to March) for pleasant weather.',
    rules: [
      'Flash photography is strictly prohibited inside painted caves to preserve pigment.',
      'Footwear must be removed before entering cave interiors.',
      'Strict visitor quotas per cave chamber are enforced by staff.',
    ],
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80',
        caption: 'Chaitya prayer hall façade with arched horseshoe window',
      },
      {
        url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80',
        caption: 'Horseshoe ravine setting along the Waghur River gorge',
      },
    ],
    isDemoData: true,
  },
];

/**
 * Find monument by slug or alias.
 * @param {string} slug - Target slug
 * @returns {object|null}
 */
export function getSiteBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();
  return (
    HERITAGE_SITES.find(
      (site) =>
        site.slug === cleanSlug ||
        site.aliases?.includes(cleanSlug) ||
        site.id === cleanSlug
    ) || null
  );
}

/**
 * Retrieve all unique categories for filtering.
 */
export function getAllCategories() {
  return Array.from(new Set(HERITAGE_SITES.map((site) => site.category))).sort();
}

/**
 * Retrieve all unique states for filtering.
 */
export function getAllStates() {
  return Array.from(new Set(HERITAGE_SITES.map((site) => site.state))).sort();
}

/**
 * Retrieve list of all slugs for Next.js generateStaticParams.
 */
export function getAllSiteSlugs() {
  const slugs = [];
  HERITAGE_SITES.forEach((site) => {
    slugs.push({ slug: site.slug });
    if (site.aliases) {
      site.aliases.forEach((alias) => slugs.push({ slug: alias }));
    }
  });
  return slugs;
}
