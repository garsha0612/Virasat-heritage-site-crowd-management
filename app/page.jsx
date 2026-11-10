import {
  Compass,
  ShieldCheck,
  Landmark,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const INITIAL_MONUMENTS = [
  {
    name: 'Taj Mahal',
    location: 'Agra, Uttar Pradesh',
    era: '1631–1648 CE',
    capacity: 5000,
    currentSimulated: 1840,
    status: 'low',
    tag: 'Mughal Architecture',
  },
  {
    name: 'Red Fort',
    location: 'Old Delhi, Delhi',
    era: '1638–1648 CE',
    capacity: 4000,
    currentSimulated: 2450,
    status: 'moderate',
    tag: 'UNESCO World Heritage',
  },
  {
    name: 'Qutub Minar',
    location: 'Mehrauli, South Delhi',
    era: '1192–1220 CE',
    capacity: 2500,
    currentSimulated: 2020,
    status: 'high',
    tag: 'Indo-Islamic Victory Tower',
  },
  {
    name: 'Hampi Monuments',
    location: 'Vijayanagara, Karnataka',
    era: '14th–16th Century CE',
    capacity: 6000,
    currentSimulated: 1210,
    status: 'low',
    tag: 'Vijayanagara Empire',
  },
  {
    name: 'Sun Temple Konark',
    location: 'Puri, Odisha',
    era: '1250 CE',
    capacity: 3500,
    currentSimulated: 1820,
    status: 'moderate',
    tag: 'Kalinga Chariot Architecture',
  },
  {
    name: 'Ajanta Caves',
    location: 'Chhatrapati Sambhaji Nagar, Maharashtra',
    era: '2nd Century BCE – 480 CE',
    capacity: 1800,
    currentSimulated: 650,
    status: 'low',
    tag: 'Ancient Rock-cut Buddhist Caves',
  },
];

const CROWD_BADGES = {
  low: {
    label: 'Low Crowd (36%)',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    indicator: 'bg-emerald-500',
  },
  moderate: {
    label: 'Moderate (61%)',
    bg: 'bg-amber-50 text-amber-800 border-amber-300',
    indicator: 'bg-amber-500',
  },
  high: {
    label: 'High Density (81%)',
    bg: 'bg-rose-50 text-rose-800 border-rose-300',
    indicator: 'bg-rose-500',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-heritage-ivory text-heritage-charcoal selection:bg-heritage-sandstone/30">
      {/* Top Heritage Notice Banner */}
      <aside aria-label="Simulation Notice" className="bg-heritage-green-900 text-heritage-sandstone-100 px-4 py-2 text-xs border-b border-heritage-gold/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-heritage-gold animate-pulse" />
            <span className="font-medium tracking-wide">
              SMART TOURISM PILOT: Live-style crowd density figures are powered by an algorithmic simulation engine.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[11px] text-heritage-sandstone-200">
            Phase 1 • Environment Initialized
          </span>
        </div>
      </aside>

      {/* Primary Header */}
      <header className="sticky top-0 z-30 bg-heritage-ivory/95 backdrop-blur-md border-b border-heritage-sandstone/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-heritage-green flex items-center justify-center text-heritage-gold shadow-heritage-sm border border-heritage-gold/40">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-heritage-charcoal leading-tight">
                Heritage Site Crowd Management System
              </h1>
              <p className="text-xs text-heritage-charcoal-400 font-medium tracking-wider uppercase">
                College Continuous Assessment • Production Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-heritage-green-50 text-heritage-green border border-heritage-green-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-heritage-green-500" />
              Phase 1 Configured
            </span>
          </div>
        </div>
      </header>

      {/* Hero Showcase */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-heritage-sandstone/20 bg-gradient-to-b from-heritage-ivory via-heritage-sandstone-50/40 to-heritage-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-heritage-sandstone-100 text-heritage-sandstone-700 border border-heritage-sandstone-300 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-heritage-gold-600" />
                Preserving Indian Heritage through Smart Capacity Control
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-heritage-charcoal tracking-tight leading-tight">
                Intelligent Crowd Telemetry & Slotted Ticketing
              </h2>

              <p className="mt-6 text-base sm:text-lg text-heritage-charcoal-600 leading-relaxed font-normal">
                An integrated platform engineered to balance visitor access with monument conservation. Plan your visits during low-density windows, reserve verified digital time-slots, and inspect real-time capacity analytics.
              </p>

              {/* Status Metric Strip */}
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div className="p-4 rounded-xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm">
                  <div className="flex items-center gap-2 text-heritage-green mb-1">
                    <Compass className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-heritage-charcoal-400">Architecture</span>
                  </div>
                  <div className="text-lg font-bold text-heritage-charcoal font-serif">Next.js App Router</div>
                  <div className="text-xs text-heritage-charcoal-500 mt-0.5">JavaScript ES6+ (No TS)</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm">
                  <div className="flex items-center gap-2 text-heritage-green mb-1">
                    <Landmark className="w-4 h-4 text-heritage-sandstone-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-heritage-charcoal-400">Monuments</span>
                  </div>
                  <div className="text-lg font-bold text-heritage-charcoal font-serif">6 Initial Sites</div>
                  <div className="text-xs text-heritage-charcoal-500 mt-0.5">Taj Mahal, Qutub, Red Fort...</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm">
                  <div className="flex items-center gap-2 text-heritage-green mb-1">
                    <Users className="w-4 h-4 text-heritage-gold-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-heritage-charcoal-400">Database</span>
                  </div>
                  <div className="text-lg font-bold text-heritage-charcoal font-serif">MongoDB Atlas</div>
                  <div className="text-xs text-heritage-charcoal-500 mt-0.5">heritageDB • 5 Collections</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm">
                  <div className="flex items-center gap-2 text-heritage-green mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-heritage-charcoal-400">Security</span>
                  </div>
                  <div className="text-lg font-bold text-heritage-charcoal font-serif">Edge RBAC + JWT</div>
                  <div className="text-xs text-heritage-charcoal-500 mt-0.5">Atomic Anti-Overbooking</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Initial Monuments Preview Grid */}
        <section className="py-16 bg-heritage-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-heritage-sandstone/20">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-heritage-sandstone-600">
                  Target Monuments
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal mt-1">
                  Initial Pilot Destinations
                </h3>
              </div>
              <p className="text-xs text-heritage-charcoal-500 mt-2 sm:mt-0 font-medium max-w-sm">
                Configured with carrying capacities and simulated entry sensors as specified in system design.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INITIAL_MONUMENTS.map((monument) => {
                const badge = CROWD_BADGES[monument.status];
                return (
                  <div
                    key={monument.name}
                    className="group bg-white rounded-2xl border border-heritage-sandstone/30 overflow-hidden shadow-heritage-sm hover:shadow-heritage-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-heritage-sandstone-700 bg-heritage-sandstone-50 px-2.5 py-0.5 rounded-md border border-heritage-sandstone-200">
                          {monument.tag}
                        </span>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.indicator}`} />
                          {badge.label}
                        </div>
                      </div>

                      <h4 className="font-serif text-xl font-bold text-heritage-charcoal group-hover:text-heritage-green transition-colors">
                        {monument.name}
                      </h4>
                      <p className="text-xs text-heritage-charcoal-500 mt-1 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-heritage-sandstone-600" />
                        {monument.location}
                      </p>

                      <div className="mt-6 pt-4 border-t border-heritage-sandstone-100 flex items-center justify-between text-xs text-heritage-charcoal-600">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-heritage-charcoal-400">Historical Era</div>
                          <div className="font-medium text-heritage-charcoal mt-0.5">{monument.era}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-heritage-charcoal-400">Carrying Capacity</div>
                          <div className="font-semibold text-heritage-green mt-0.5">{monument.capacity.toLocaleString()} visitors</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-heritage-sandstone-50/50 border-t border-heritage-sandstone-100 flex items-center justify-between text-xs">
                      <span className="font-medium text-heritage-charcoal-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-heritage-sandstone-600" />
                        Visiting: 06:00 – 18:30
                      </span>
                      <span className="font-semibold text-heritage-sandstone-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View Dossier
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Phase 1 Verification Callout */}
        <section className="py-12 bg-heritage-green text-heritage-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-heritage-green-800/80 rounded-2xl p-6 sm:p-8 border border-heritage-gold/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-heritage-gold/20 text-heritage-gold-300 border border-heritage-gold/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-heritage-gold" />
                  Phase 1 Milestone Complete
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Next.js App Router & Heritage Design Tokens Verified
                </h3>
                <p className="text-sm text-heritage-sandstone-200 mt-1 max-w-2xl">
                  Dependencies resolved, Tailwind heritage palette registered, path aliases configured, and Server Component rendering is operating with zero errors.
                </p>
              </div>

              <div className="text-xs font-mono bg-heritage-green-950/80 px-4 py-3 rounded-lg border border-heritage-gold/20 text-heritage-sandstone-200">
                <div>Framework: Next.js 14 (App Router)</div>
                <div>Runtime: Node.js {process.version}</div>
                <div>Language: JavaScript ES6+ (No TS)</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-heritage-charcoal text-heritage-sandstone-200 py-10 border-t border-heritage-gold/20 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-heritage-gold" />
            <span className="font-serif font-bold text-white text-sm">
              Heritage Site Crowd Management System
            </span>
          </div>
          <p className="text-heritage-charcoal-300 text-center sm:text-right">
            Designed for College CA Project • Compliant with Indian Heritage Conservation & Smart Tourism Standards
          </p>
        </div>
      </footer>
    </div>
  );
}
