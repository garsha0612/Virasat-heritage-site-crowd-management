import { getSiteBySlug, HERITAGE_SITES } from './heritageSites.js';

/**
 * ANVAYA Academic Ticket Pricing & Tariff Specifications
 * 
 * DISCLAIMER:
 * ANVAYA is an educational college continuous assessment (CA) simulation platform.
 * ANVAYA is NOT an official ticketing portal of the Archaeological Survey of India (ASI)
 * or the Ministry of Culture, Government of India. All bookings, ticket codes, and simulated
 * payments are generated strictly for academic crowd management and system design study.
 * 
 * Tariff rates below are cataloged from official published Archaeological Survey of India
 * and monument authority notices. Where offline/counter or cashless booking variances exist,
 * both are documented.
 */

/**
 * Standard Verified Visitor Categories
 */
export const TICKET_CATEGORIES = {
  indianAdult: {
    key: 'indianAdult',
    label: 'Indian Citizen',
    description: 'Adult visitor aged 15 years and above.',
    categoryNote: 'Statutory domestic tariff established by the Archaeological Survey of India (ASI).',
  },
  saarcBimstec: {
    key: 'saarcBimstec',
    label: 'SAARC & BIMSTEC Citizen',
    description: 'Citizen of SAARC or BIMSTEC member states.',
    categoryNote: 'Concessional treaty tariff applicable to citizens of SAARC and BIMSTEC nations.',
  },
  foreignerAdult: {
    key: 'foreignerAdult',
    label: 'Foreign Tourist (Non-SAARC)',
    description: 'International visitor from all other nations aged 15 years and above.',
    categoryNote: 'Standard international tourist tariff established by the Archaeological Survey of India (ASI).',
  },
  child: {
    key: 'child',
    label: 'Child (Under 15 Years)',
    description: 'Free entrance in compliance with Archaeological Survey of India (ASI) statutory notifications.',
    categoryNote: 'Statutory complimentary admission for children below 15 years of age on the date of visit.',
  },
};

/**
 * Destination-Specific Official Tariff Catalog
 * Each entry cites the official government domain source and last verification date.
 */
export const SITE_PRICING_CATALOG = {
  'taj-mahal': {
    siteName: 'Taj Mahal',
    slug: 'taj-mahal',
    aliases: ['taj'],
    officialSourceUrl: 'https://www.tajmahal.gov.in/visiting-hours.aspx',
    sourceOrganization: 'Archaeological Survey of India (ASI) & Agra Development Authority (ADA)',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote:
      'Combined admission: ASI entry fee + ADA toll tax. Visiting the main marble mausoleum dome requires an additional separate supplement of ₹200.',
    rates: {
      indianAdult: {
        counterPrice: 50,
        onlinePrice: 45,
        appliedRate: 50,
        breakdown: 'ASI ₹35 + ADA Toll Tax ₹15',
      },
      saarcBimstec: {
        counterPrice: 540,
        onlinePrice: 540,
        appliedRate: 540,
        breakdown: 'ASI ₹400 + ADA Toll Tax ₹140',
      },
      foreignerAdult: {
        counterPrice: 1100,
        onlinePrice: 1050,
        appliedRate: 1100,
        breakdown: 'ASI ₹600 + ADA Toll Tax ₹500',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children below 15 years',
      },
    },
    addons: {
      mausoleumSupplement: {
        key: 'mausoleumSupplement',
        label: 'Main Mausoleum Dome Entry Ticket',
        description: 'Mandatory ASI entry supplement to step onto the upper marble plinth and view the central cenotaph chamber.',
        rate: 200,
        sourceUrl: 'https://www.tajmahal.gov.in/visiting-hours.aspx',
        appliesToCategories: ['indianAdult', 'saarcBimstec', 'foreignerAdult'],
      },
    },
  },

  'red-fort': {
    siteName: 'Red Fort',
    slug: 'red-fort',
    aliases: ['lal-qila'],
    officialSourceUrl: 'https://asi.nic.in/pages/WorldHeritageRedFort',
    sourceOrganization: 'Archaeological Survey of India (ASI) - Delhi Circle',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote: 'ASI Ticketed World Heritage Monument standard tariff.',
    rates: {
      indianAdult: {
        counterPrice: 50,
        onlinePrice: 35,
        appliedRate: 50,
        breakdown: 'ASI World Heritage Entry Fee',
      },
      saarcBimstec: {
        counterPrice: 50,
        onlinePrice: 35,
        appliedRate: 50,
        breakdown: 'ASI Concessional Treaty Tariff',
      },
      foreignerAdult: {
        counterPrice: 600,
        onlinePrice: 550,
        appliedRate: 600,
        breakdown: 'ASI International Tourist Tariff',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children under 15 years',
      },
    },
    addons: {},
  },

  'qutub-minar': {
    siteName: 'Qutub Minar',
    slug: 'qutub-minar',
    aliases: ['qutb-minar'],
    officialSourceUrl: 'https://asi.nic.in/pages/WorldHeritageQutbMinar',
    sourceOrganization: 'Archaeological Survey of India (ASI) - Delhi Circle',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote: 'ASI Ticketed World Heritage Complex tariff.',
    rates: {
      indianAdult: {
        counterPrice: 50,
        onlinePrice: 35,
        appliedRate: 50,
        breakdown: 'ASI Complex Entrance Fee',
      },
      saarcBimstec: {
        counterPrice: 50,
        onlinePrice: 35,
        appliedRate: 50,
        breakdown: 'ASI Concessional Treaty Tariff',
      },
      foreignerAdult: {
        counterPrice: 600,
        onlinePrice: 550,
        appliedRate: 600,
        breakdown: 'ASI International Tourist Tariff',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children under 15 years',
      },
    },
    addons: {},
  },

  'hampi': {
    siteName: 'Group of Monuments at Hampi',
    slug: 'hampi',
    aliases: ['hampi-monuments'],
    officialSourceUrl: 'https://asi.nic.in/pages/WorldHeritageHampi',
    sourceOrganization: 'Archaeological Survey of India (ASI) - Hampi Circle',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote:
      'Covers ticketed complexes: Vittala Temple and Zenana Enclosure / Lotus Mahal. Verified official ASI tariff is ₹40 for Indian & SAARC citizens and ₹600 for foreign visitors. No official online discount tariff is published by the Hampi circle; online price is configured identically to the official verified rate.',
    rates: {
      indianAdult: {
        counterPrice: 40,
        onlinePrice: 40,
        appliedRate: 40,
        breakdown: 'ASI World Heritage Entry Fee (Verified ₹40)',
      },
      saarcBimstec: {
        counterPrice: 40,
        onlinePrice: 40,
        appliedRate: 40,
        breakdown: 'ASI Concessional Treaty Tariff (Verified ₹40)',
      },
      foreignerAdult: {
        counterPrice: 600,
        onlinePrice: 600,
        appliedRate: 600,
        breakdown: 'ASI International Tourist Tariff (Verified ₹600)',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children under 15 years',
      },
    },
    addons: {},
  },

  'sun-temple-konark': {
    siteName: 'Sun Temple Konark',
    slug: 'sun-temple-konark',
    aliases: ['konark'],
    officialSourceUrl: 'https://asi.nic.in/pages/WorldHeritageKonarak',
    sourceOrganization: 'Archaeological Survey of India (ASI) - Bhubaneswar Circle',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote:
      'ASI Ticketed World Heritage Monument standard tariff (Verified ₹40 Indian/SAARC, ₹600 Foreigner). Online price represents configurable academic demonstration price.',
    rates: {
      indianAdult: {
        counterPrice: 40,
        onlinePrice: 35,
        appliedRate: 40,
        breakdown: 'ASI Category B Heritage Entrance Fee (Verified ₹40)',
      },
      saarcBimstec: {
        counterPrice: 40,
        onlinePrice: 35,
        appliedRate: 40,
        breakdown: 'ASI Concessional Treaty Tariff (Verified ₹40)',
      },
      foreignerAdult: {
        counterPrice: 600,
        onlinePrice: 550,
        appliedRate: 600,
        breakdown: 'ASI International Tourist Tariff (Verified ₹600)',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children under 15 years',
      },
    },
    addons: {},
  },

  'ajanta-caves': {
    siteName: 'Ajanta Caves',
    slug: 'ajanta-caves',
    aliases: ['ajanta'],
    officialSourceUrl: 'https://asi.nic.in/pages/WorldHeritageAjantaCaves',
    sourceOrganization: 'Archaeological Survey of India (ASI) - Aurangabad Circle',
    lastVerifiedDate: '2026-03-01',
    isOfficialVerified: true,
    currency: 'INR',
    currencySymbol: '₹',
    pricingStructureNote:
      'Covers ASI archaeological cave complex admission (Verified ₹40 Indian/SAARC, ₹600 Foreigner). MSRTC eco-bus from T-junction is a separate state transit charge. Online price represents configurable academic demonstration price.',
    rates: {
      indianAdult: {
        counterPrice: 40,
        onlinePrice: 35,
        appliedRate: 40,
        breakdown: 'ASI Category B Heritage Entrance Fee (Verified ₹40)',
      },
      saarcBimstec: {
        counterPrice: 40,
        onlinePrice: 35,
        appliedRate: 40,
        breakdown: 'ASI Concessional Treaty Tariff (Verified ₹40)',
      },
      foreignerAdult: {
        counterPrice: 600,
        onlinePrice: 550,
        appliedRate: 600,
        breakdown: 'ASI International Tourist Tariff (Verified ₹600)',
      },
      child: {
        counterPrice: 0,
        onlinePrice: 0,
        appliedRate: 0,
        breakdown: 'Complimentary entrance for children under 15 years',
      },
    },
    addons: {},
  },
};

/**
 * Resolve destination catalog entry by slug or alias.
 */
export function getCatalogEntryForSite(siteSlug) {
  if (!siteSlug) return null;
  const slug = siteSlug.toLowerCase().trim();

  if (SITE_PRICING_CATALOG[slug]) {
    return SITE_PRICING_CATALOG[slug];
  }

  for (const entry of Object.values(SITE_PRICING_CATALOG)) {
    if (entry.aliases && entry.aliases.includes(slug)) {
      return entry;
    }
  }

  return null;
}

/**
 * Retrieve verified tariff rates for a heritage monument.
 * Returns unit prices for each category in INR (₹).
 * 
 * @param {string} siteSlug
 * @returns {Object} map of category keys to unit rates in INR
 */
export function getSitePricing(siteSlug) {
  const catalogEntry = getCatalogEntryForSite(siteSlug);

  if (!catalogEntry) {
    // If not found in catalog, fall back to constants/heritageSites if available
    const fallbackSite = getSiteBySlug(siteSlug);
    if (!fallbackSite) {
      throw new Error(`Invalid destination identifier: "${siteSlug}".`);
    }
    return {
      indianAdult: Number(fallbackSite.ticketPricing?.indian) || 50,
      saarcBimstec: Number(fallbackSite.ticketPricing?.indian) || 50,
      foreignerAdult: Number(fallbackSite.ticketPricing?.foreigner) || 600,
      child: 0,
    };
  }

  const rates = catalogEntry.rates;
  return {
    indianAdult: rates.indianAdult.appliedRate,
    saarcBimstec: rates.saarcBimstec.appliedRate,
    foreignerAdult: rates.foreignerAdult.appliedRate,
    child: rates.child.appliedRate,
  };
}

/**
 * Server-side price calculation and itemization.
 * Recomputes totals independently of any client-supplied figures to defeat price tampering.
 * 
 * @param {string} siteSlug
 * @param {Array<{ category: string, quantity: number }>} requestedTickets
 * @param {Object} [options]
 * @param {boolean} [options.includeMausoleum=false] - For Taj Mahal only
 * @returns {{ itemizedTickets: Array<Object>, totalTickets: number, totalAmount: number, currency: string, metadata: Object }}
 */
export function calculateBookingTotal(siteSlug, requestedTickets, options = {}) {
  if (!Array.isArray(requestedTickets) || requestedTickets.length === 0) {
    throw new Error('At least one ticket must be selected.');
  }

  const catalogEntry = getCatalogEntryForSite(siteSlug);
  const siteTariffs = getSitePricing(siteSlug);
  const itemizedTickets = [];
  let totalTickets = 0;
  let totalAmount = 0;

  for (const item of requestedTickets) {
    const categoryKey = item.category;
    const quantity = Number(item.quantity);

    // Support legacy student mapping safely if older tests pass it
    let unitPrice;
    let label;

    if (categoryKey === 'student') {
      // Deprecated student category: if sent, map to Indian Adult rate without unverified discount
      unitPrice = siteTariffs.indianAdult;
      label = 'Student (Indian Adult Tariff Applied)';
    } else if (TICKET_CATEGORIES[categoryKey]) {
      unitPrice = siteTariffs[categoryKey] ?? 0;
      label = TICKET_CATEGORIES[categoryKey].label;
    } else {
      throw new Error(`Unrecognized ticket category: "${categoryKey}".`);
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`Invalid ticket quantity: ${quantity}. Must be a non-negative integer.`);
    }

    if (quantity === 0) continue;

    if (quantity > 10) {
      throw new Error(`Maximum 10 tickets allowed per category (requested ${quantity}).`);
    }

    const subtotal = unitPrice * quantity;
    itemizedTickets.push({
      category: categoryKey,
      categoryName: label,
      unitPrice,
      quantity,
      subtotal,
    });

    totalTickets += quantity;
    totalAmount += subtotal;
  }

  if (totalTickets === 0) {
    throw new Error('Total reserved tickets must be at least 1.');
  }

  if (totalTickets > 10) {
    throw new Error(`A single reservation cannot exceed 10 total visitors (requested ${totalTickets}).`);
  }

  // Taj Mahal Main Mausoleum Addon check
  const includeMausoleum = Boolean(options.includeMausoleum);
  let mausoleumAddonAmount = 0;

  if (includeMausoleum && catalogEntry?.slug === 'taj-mahal') {
    // Mausoleum supplement of ₹200 applies to each paying adult visitor (excludes children)
    const payingAdultCount = itemizedTickets
      .filter((t) => t.category !== 'child')
      .reduce((sum, t) => sum + t.quantity, 0);

    if (payingAdultCount > 0) {
      mausoleumAddonAmount = payingAdultCount * 200;
      totalAmount += mausoleumAddonAmount;
      itemizedTickets.push({
        category: 'mausoleumSupplement',
        categoryName: 'Taj Mahal Main Mausoleum Dome Entry Supplement',
        unitPrice: 200,
        quantity: payingAdultCount,
        subtotal: mausoleumAddonAmount,
      });
    }
  }

  return {
    itemizedTickets,
    totalTickets,
    totalAmount,
    currency: 'INR',
    metadata: {
      siteSlug,
      officialSourceUrl: catalogEntry?.officialSourceUrl || 'https://asi.nic.in',
      lastVerifiedDate: catalogEntry?.lastVerifiedDate || '2026-03-01',
      isOfficialVerified: Boolean(catalogEntry?.isOfficialVerified),
      pricingStructureNote: catalogEntry?.pricingStructureNote || 'Configured demo tariff schedule.',
      academicSimulationNotice:
        'ANVAYA is an educational college continuous assessment demonstration. Tariff charges and bookings are simulated.',
    },
  };
}
