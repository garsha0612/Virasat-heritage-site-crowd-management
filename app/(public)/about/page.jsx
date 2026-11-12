import Link from 'next/link';
import {
  Landmark,
  ShieldCheck,
  Users,
  Compass,
  Sparkles,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'About ANVAYA – Smart Tourism & Heritage Preservation Platform',
  description:
    "Learn about ANVAYA's mission to balance Indian heritage monument conservation with intelligent carrying-capacity crowd management.",
};

export default function AboutPage() {
  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen font-sans">
      <Container size="xl">
        {/* Page Header */}
        <SectionHeading
          eyebrow="Conservation Mission"
          title="About ANVAYA"
          description="A smart-tourism platform engineered to preserve cultural heritage monuments across India through intelligent visitor flow management and capacity governance."
        />

        {/* Narrative Section 1: The Core Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-heritage-sandstone-700 bg-heritage-sandstone-100 px-2.5 py-1 rounded">
              The Challenge & Vision
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal leading-tight">
              Balancing Unrestricted Access with Physical Preservation
            </h2>

            <p className="text-sm sm:text-base text-heritage-charcoal-700 leading-relaxed">
              India is home to thousands of monumental structures that represent centuries of artistic, mathematical, and architectural genius. Iconic destinations like the <strong className="text-heritage-charcoal">Taj Mahal</strong>, <strong className="text-heritage-charcoal">Red Fort</strong>, and <strong className="text-heritage-charcoal">Qutub Minar</strong> attract millions of domestic and international visitors annually.
            </p>

            <p className="text-xs sm:text-sm text-heritage-charcoal-600 leading-relaxed">
              However, unmanaged mass tourism threatens the very survival of these fragile wonders. Excessive footfall creates structural vibrations, marble floor abrasion, micro-climatic humidity fluctuations inside enclosed cave chambers, and hazardous pedestrian bottlenecks that degrade the tourist experience.
            </p>

            <p className="text-xs sm:text-sm text-heritage-charcoal-600 leading-relaxed">
              <strong className="text-heritage-green font-semibold">ANVAYA</strong> was conceived to solve this delicate dilemma by introducing <strong className="text-heritage-charcoal">Intelligent Carrying-Capacity Crowd Management</strong>: providing tourists with advance visibility into expected density, and offering curators atomic tools to prevent overbooking.
            </p>
          </div>

          <div className="lg:col-span-5">
            <Card className="p-8 bg-gradient-to-br from-white to-heritage-sandstone-50/60 border-heritage-sandstone/40 space-y-4 shadow-heritage-md">
              <div className="w-12 h-12 rounded-xl bg-heritage-green flex items-center justify-center text-heritage-gold shadow-heritage-sm">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-heritage-charcoal">
                Platform Objectives
              </h3>
              <ul className="space-y-2.5 text-xs text-heritage-charcoal-600 font-sans">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-heritage-green mt-1.5 shrink-0" />
                  <span>Empower tourists to choose serene, unhurried visit windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-heritage-green mt-1.5 shrink-0" />
                  <span>Enforce architectural maximum carrying capacities at ticketing gates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-heritage-green mt-1.5 shrink-0" />
                  <span>Provide transparent, verified historical and archaeological context.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-heritage-green mt-1.5 shrink-0" />
                  <span>Support automated time-slotted pass reservations with zero overbooking.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Four Key Pillars */}
        <div className="mb-16">
          <SectionHeading
            eyebrow="Architecture"
            title="Four Pillars of Smart Crowd Governance"
            description="The core tenets underpinning ANVAYA's technical and operational methodology."
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-heritage-green-50 text-heritage-green flex items-center justify-center mb-4 border border-heritage-green-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                1. Density Classification
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed">
                Categorizes real-time occupancy into actionable thresholds: Low (0–40%), Moderate (41–70%), and High Density (71–100%) to guide visitor arrival timing.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-heritage-sandstone-100 text-heritage-sandstone-800 flex items-center justify-center mb-4 border border-heritage-sandstone-300">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                2. Slotted Reservation
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed">
                Replaces chaotic on-site ticket queues with staggered 2-hour entry windows, leveling visitor inflow throughout operating hours.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-heritage-gold-50 text-heritage-gold-800 flex items-center justify-center mb-4 border border-heritage-gold-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                3. Structural Preservation
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed">
                Protects fragile cultural fabric—such as the tempera murals of Ajanta or the marble inlay of the Taj Mahal—from microclimatic stress.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                4. Archival Knowledge
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed">
                Delivers vetted archaeological dossiers, architectural blueprints, visiting rules, and official rates without commercial distortions.
              </p>
            </Card>
          </div>
        </div>

        {/* Academic CA Project & Simulation Disclosure */}
        <div className="bg-heritage-charcoal text-heritage-sandstone-200 rounded-2xl p-8 sm:p-10 border border-heritage-gold/25 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-heritage-sandstone/15">
            <Sparkles className="w-6 h-6 text-heritage-gold" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              Academic Project & Data Disclosure
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-heritage-charcoal-300 leading-relaxed font-sans">
            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                College Continuous Assessment Context
              </h4>
              <p>
                ANVAYA is engineered as a comprehensive technical project demonstrating modern enterprise web architecture using the Next.js App Router, React 18, and MongoDB Atlas. It serves as an academic prototype for state and national tourism departments.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                Simulated Telemetry Disclosure
              </h4>
              <p>
                All crowd numbers, turnstile ticks, occupancy gauges, and hourly visitor figures displayed throughout this portal are generated via an algorithmic mathematical model. Unless explicitly interfaced with physical IoT turnstiles or official ASI ministry APIs, all statistics must be recognized as simulated demonstration data.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button href="/explore" variant="gold" size="md" rightIcon={Compass}>
              Explore Pilot Monuments
            </Button>
            <Button
              href="/crowd-status"
              variant="outline"
              size="md"
              className="text-white border-white/40 hover:bg-white/10"
            >
              Inspect Crowd Gauges
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
