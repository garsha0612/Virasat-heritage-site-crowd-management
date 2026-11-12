import HeritageSite from '../models/HeritageSite.js';
import { HERITAGE_SITES } from '../constants/heritageSites.js';
import { SITE_PRICING_CATALOG } from '../constants/pricing.js';

/**
 * Ensures the database contains the standard heritage monument entries.
 * If HeritageSite collection is empty, populates from HERITAGE_SITES and official tariffs.
 *
 * @returns {Promise<number>} Number of sites seeded or existing.
 */
export async function ensureHeritageSitesSeeded() {
  const count = await HeritageSite.countDocuments();
  if (count > 0) {
    return count;
  }

  const siteDocs = HERITAGE_SITES.map((site) => {
    const pricing = SITE_PRICING_CATALOG[site.slug] || {};
    const rates = pricing.rates || {};

    return {
      name: site.name,
      slug: site.slug,
      tagline: site.tagline || '',
      description: site.shortDescription || site.description || '',
      historicalBackground: site.history || '',
      state: site.state,
      city: site.location || site.city || 'Agra',
      address: `${site.name}, ${site.location || site.city}, ${site.state}, India`,
      latitude: site.coordinates?.lat || site.latitude || 27.1751,
      longitude: site.coordinates?.lng || site.longitude || 78.0421,
      category: site.category || 'Mughal Architecture',
      openingHours: {
        open: site.visitingHours?.open || '06:00',
        close: site.visitingHours?.close || '18:00',
      },
      weeklyClosingDay: site.closedDays?.[0] || 'None',
      entryFee: {
        indianAdult: rates.indianAdult?.appliedRate ?? 50,
        saarcBimstec: rates.saarcBimstec?.appliedRate ?? 540,
        foreignerAdult: rates.foreignerAdult?.appliedRate ?? 1100,
        child: rates.child?.appliedRate ?? 0,
        mausoleumSupplement: pricing.addons?.mausoleumSupplement?.rate ?? 0,
      },
      visitorInstructions: site.keyFacts || [
        'Valid photo ID card matching registration name is mandatory at entry turnstiles.',
        'Prohibited items: large bags, tripods, tobacco, and lighters.',
        'Children below 15 years must be accompanied by an adult.',
      ],
      websiteUrl: pricing.officialSourceUrl || 'https://asi.nic.in',
      isFeatured: true,
      isActive: true,
      images: site.images || [site.heroImage || '/images/hero-banner.jpg'],
      demonstrationCapacity: {
        maxPerHour: site.hourlyCapacity || 1000,
        standardSlotCapacity: site.dailyCapacity ? Math.round(site.dailyCapacity / 8) : 200,
      },
    };
  });

  await HeritageSite.insertMany(siteDocs);
  return siteDocs.length;
}
