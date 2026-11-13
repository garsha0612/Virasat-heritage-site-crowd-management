import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  Clock,
  Calendar,
  Ticket,
  Users,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import SiteLocation from '@/components/site/SiteLocation';
import SiteRating from '@/components/site/SiteRating';
import SiteCategory from '@/components/site/SiteCategory';
import CrowdBadge from '@/components/crowd/CrowdBadge';
import CrowdGauge from '@/components/crowd/CrowdGauge';
import {
  HERITAGE_SITES,
  getSiteBySlug,
  getAllSiteSlugs,
  getCrowdClassification,
} from '@/constants/heritageSites';

/**
 * Next.js generateStaticParams for all initial pilot destinations.
 */
export async function generateStaticParams() {
  return getAllSiteSlugs();
}

/**
 * Dynamic SEO Metadata Generation for Heritage Site.
 */
export async function generateMetadata({ params }) {
  const site = getSiteBySlug(params.slug);
  if (!site) {
    return {
      title: 'Heritage Site Not Found | ANVAYA',
      description: 'The requested historical monument could not be found in our directory.',
    };
  }

  return {
    title: `${site.name} – History, Visiting Hours & Live Crowd Status | ANVAYA`,
    description: site.shortDescription,
    openGraph: {
      title: `${site.name} – ANVAYA Heritage Portal`,
      description: site.shortDescription,
      images: [{ url: site.image, width: 1200, height: 800, alt: site.name }],
    },
  };
}

export default async function SiteDetailPage({ params }) {
  const site = getSiteBySlug(params.slug);

  if (!site) {
    notFound();
  }

  const {
    slug,
    name,
    tagline,
    location,
    state,
    country,
    category,
    historicalEra,
    rating,
    reviewCount,
    shortDescription,
    history,
    architecture,
    keyFacts = [],
    visitingHours,
    ticketPricing,
    capacity,
    bestTimeToVisit,
    rules = [],
    image,
    gallery = [],
  } = site;

  const occupancy = capacity?.occupancyPercentage || 0;
  const classification = getCrowdClassification(occupancy);

  return (
    <div className="bg-heritage-ivory min-h-screen pb-20 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="bg-heritage-sandstone-50/60 border-b border-heritage-sandstone/20 py-3 text-xs text-heritage-charcoal-500">
        <Container size="xl" className="flex items-center gap-2">
          <Link href="/" className="hover:text-heritage-green transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-heritage-charcoal-300" />
          <Link href="/explore" className="hover:text-heritage-green transition-colors">
            Explore
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-heritage-charcoal-300" />
          <span className="text-heritage-charcoal-800 font-semibold truncate">{name}</span>
        </Container>
      </div>

      {/* Monument Hero Banner */}
      <section className="relative bg-heritage-charcoal text-white pt-12 pb-16 sm:py-24 overflow-hidden border-b border-heritage-gold/25">
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={name}
            fill
            priority
            className="object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-heritage-charcoal via-heritage-charcoal/75 to-heritage-charcoal/40" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl space-y-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-sandstone-300 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              <SiteCategory category={category} />
              <CrowdBadge percentage={occupancy} status={capacity?.status} size="sm" />
              <span className="text-xs font-mono text-heritage-sandstone-300">
                Era: {historicalEra}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {name}
            </h1>

            {tagline && (
              <p className="text-sm sm:text-base text-heritage-gold font-serif italic tracking-wide">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-heritage-sandstone-200 pt-2">
              <SiteLocation city={location} state={state} country={country} className="text-heritage-sandstone-200" />
              <span>•</span>
              <SiteRating rating={rating} reviewCount={reviewCount} className="text-white" />
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content & Sidebar Grid */}
      <Container size="xl" className="mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Dossier Column (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* Overview / Introduction */}
            <section className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-heritage-charcoal mb-4">
                Monument Overview
              </h2>
              <p className="text-sm sm:text-base text-heritage-charcoal-700 leading-relaxed font-sans">
                {shortDescription}
              </p>
            </section>

            {/* Historical Narrative */}
            <section className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-heritage-charcoal mb-4 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-heritage-green" />
                Historical Background
              </h2>
              <p className="text-sm text-heritage-charcoal-700 leading-relaxed font-sans">
                {history}
              </p>
            </section>

            {/* Architectural & Structural Engineering */}
            <section className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-heritage-charcoal mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-heritage-sandstone-600" />
                Architectural Features & Construction
              </h2>
              <p className="text-sm text-heritage-charcoal-700 leading-relaxed font-sans">
                {architecture}
              </p>

              {/* Key Facts List */}
              {keyFacts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-heritage-sandstone/15">
                  <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-3">
                    Notable Archaeological Facts
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-heritage-charcoal-600">
                    {keyFacts.map((fact, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-heritage-green shrink-0 mt-0.5" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Photo Gallery */}
            {gallery.length > 0 && (
              <section className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
                <h2 className="font-serif text-2xl font-bold text-heritage-charcoal mb-2">
                  Architectural Gallery
                </h2>
                <p className="text-xs text-heritage-charcoal-400 mb-6 font-sans">
                  Photographic archive of structural perspectives and ornamental motifs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.map((item, idx) => (
                    <div key={idx} className="group relative rounded-xl overflow-hidden bg-heritage-sandstone-100 border border-heritage-sandstone/30">
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={item.url}
                          alt={item.caption || `${name} perspective`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {item.caption && (
                        <div className="p-3 bg-heritage-charcoal/90 text-white text-xs font-sans">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Preservation & Visiting Rules */}
            {rules.length > 0 && (
              <section className="bg-heritage-sandstone-50/60 rounded-2xl border border-heritage-sandstone/30 p-6 sm:p-8">
                <h2 className="font-serif text-xl font-bold text-heritage-charcoal mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-heritage-green" />
                  Preservation Guidelines & Etiquette
                </h2>
                <ul className="space-y-2 text-xs sm:text-sm text-heritage-charcoal-700">
                  {rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-heritage-sandstone-700 mt-2 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Operational Details Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live-Style Crowd Gauge Card */}
            <Card className="p-6 border-heritage-sandstone/40 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-heritage-sandstone/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-heritage-sandstone-700 bg-heritage-sandstone-100 px-2 py-0.5 rounded">
                  Current Telemetry
                </span>
                <CrowdBadge percentage={occupancy} />
              </div>

              <div className="my-5 flex flex-col items-center justify-center text-center">
                <CrowdGauge percentage={occupancy} size="lg" />
                <p className="text-xs font-semibold mt-2" style={{ color: classification.color }}>
                  {classification.label}
                </p>
                <p className="text-[11px] text-heritage-charcoal-500 mt-1 max-w-xs">
                  {classification.advisory}
                </p>
              </div>

              {/* Density Capacity Numbers */}
              <div className="space-y-2.5 pt-4 border-t border-heritage-sandstone/15 text-xs">
                <div className="flex justify-between">
                  <span className="text-heritage-charcoal-500">Active Simulated Tourists:</span>
                  <strong className="text-heritage-charcoal font-semibold">
                    {capacity?.currentSimulatedVisitors?.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-heritage-charcoal-500">Maximum Carrying Limit:</span>
                  <strong className="text-heritage-charcoal font-semibold">
                    {capacity?.maxInstantaneous?.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-heritage-charcoal-500">Daily Permit Quota:</span>
                  <strong className="text-heritage-charcoal font-semibold">
                    {capacity?.dailyPermits?.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Visiting Hours Information */}
              <div className="mt-6 pt-4 border-t border-heritage-sandstone/15 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-heritage-charcoal-700 font-semibold">
                  <Clock className="w-4 h-4 text-heritage-sandstone-600" />
                  <span>Visiting Hours:</span>
                </div>
                <p className="text-heritage-charcoal-600 font-medium pl-6">
                  {visitingHours?.open} – {visitingHours?.close}
                </p>
                {visitingHours?.note && (
                  <p className="text-[11px] text-heritage-charcoal-400 pl-6 italic">
                    {visitingHours.note}
                  </p>
                )}
              </div>

              {/* Ticket Pricing Card */}
              <div className="mt-6 pt-4 border-t border-heritage-sandstone/15 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-heritage-charcoal-700 font-semibold">
                  <Ticket className="w-4 h-4 text-heritage-gold-600" />
                  <span>Official Entry Tariffs (ASI):</span>
                </div>
                <div className="bg-heritage-sandstone-50/70 p-3 rounded-lg space-y-1.5 font-mono text-[11px] text-heritage-charcoal-600">
                  <div className="flex justify-between">
                    <span>Indian Nationals:</span>
                    <strong className="text-heritage-charcoal font-bold">₹{ticketPricing?.indian}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Foreign Tourists:</span>
                    <strong className="text-heritage-charcoal font-bold">₹{ticketPricing?.foreigner}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Student ID:</span>
                    <strong className="text-heritage-charcoal font-bold">₹{ticketPricing?.student}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>Children (&lt; 15 yrs):</span>
                    <strong>FREE</strong>
                  </div>
                </div>
                <p className="text-[10px] text-heritage-charcoal-400 italic">
                  *Official rates set by the Archaeological Survey of India (ASI).
                </p>
              </div>

              {/* Booking CTA Button */}
              <div className="mt-6 pt-2">
                <Button
                  href={`/sites/${slug}/book`}
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  rightIcon={Calendar}
                >
                  Book Time-Slotted Pass
                </Button>
                <p className="text-[10px] text-center text-heritage-charcoal-400 mt-2 font-mono">
                  Guaranteed slot entry • Anti-overbooking protection
                </p>
              </div>

              {/* Conservation Monitoring Badge */}
              <div className="mt-4 pt-3 border-t border-heritage-sandstone/15 flex items-center justify-between text-[10px] text-heritage-charcoal-400 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-heritage-green" />
                  Live Capacity Monitoring
                </span>
                <span>Active Turnstile Control</span>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
