'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  BarChart3,
  Clock,
  Landmark,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import SiteCard from '@/components/site/SiteCard';
import CrowdBadge from '@/components/crowd/CrowdBadge';
import CrowdGauge from '@/components/crowd/CrowdGauge';
import { HERITAGE_SITES } from '@/constants/heritageSites';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/explore');
    }
  }

  // Aggregate simulated metrics
  const totalDestinations = HERITAGE_SITES.length;
  const totalCurrentSimulated = HERITAGE_SITES.reduce(
    (acc, s) => acc + (s.capacity?.currentSimulatedVisitors || 0),
    0
  );
  const totalMaxCapacity = HERITAGE_SITES.reduce(
    (acc, s) => acc + (s.capacity?.maxInstantaneous || 0),
    0
  );
  const aggregateOccupancy = Math.round((totalCurrentSimulated / totalMaxCapacity) * 100);

  return (
    <div className="flex flex-col">
      {/* SECTION A: Hero Section */}
      <section className="relative overflow-hidden bg-heritage-charcoal text-heritage-ivory pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-36 border-b border-heritage-gold/20">
        {/* Background Image with Darkened Editorial Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85"
            alt="Taj Mahal under morning sky"
            fill
            priority
            className="object-cover object-center opacity-30 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-heritage-charcoal via-heritage-charcoal/80 to-heritage-charcoal/50" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl">
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-heritage-gold/20 text-heritage-gold-300 border border-heritage-gold/30 mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-heritage-gold" />
              <span>Smart Tourism & Monument Carrying Capacity</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Discover India&apos;s Timeless Heritage with Intelligent Crowd Insights
            </h1>

            <p className="mt-6 text-base sm:text-lg text-heritage-sandstone-200 leading-relaxed font-sans max-w-2xl">
              ANVAYA balances public tourist access with structural conservation. Plan visits during low-density intervals, inspect live-style visitor counts, and experience India&apos;s greatest monuments without the stress of overwhelming crowds.
            </p>

            {/* Quick Hero Search Input */}
            <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl">
              <div className="relative flex items-center shadow-heritage-md rounded-xl overflow-hidden bg-white/95 backdrop-blur-md p-1.5 border border-heritage-sandstone/40">
                <Search className="w-5 h-5 text-heritage-charcoal-400 ml-3 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search monuments (e.g. Taj Mahal, Hampi, Qutub)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-heritage-charcoal placeholder-heritage-charcoal-400 bg-transparent focus:outline-none font-sans"
                />
                <Button type="submit" variant="primary" size="md" className="shrink-0">
                  Search
                </Button>
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href="/explore" variant="gold" size="lg" rightIcon={ArrowRight}>
                Explore Destinations
              </Button>
              <Button href="/crowd-status" variant="outline" size="lg" className="text-white border-white/50 hover:bg-white/10">
                View Crowd Telemetry
              </Button>
            </div>

            {/* Fast Stats Bar */}
            <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-heritage-sandstone-300">
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-white">6 Sites</span>
                <span className="text-[11px] text-heritage-sandstone-400">Initial Pilot Enclave</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-white">3 Tiers</span>
                <span className="text-[11px] text-heritage-sandstone-400">Low / Mod / High</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-white">100%</span>
                <span className="text-[11px] text-heritage-sandstone-400">Slotted Quota Control</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-white">UNESCO</span>
                <span className="text-[11px] text-heritage-sandstone-400">Preservation Priority</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION B: Featured Destinations */}
      <section className="py-16 sm:py-24 bg-heritage-ivory border-b border-heritage-sandstone/15">
        <Container size="xl">
          <SectionHeading
            eyebrow="Pilot Destinations"
            title="Featured Indian Heritage Monuments"
            description="Explore historical context, architectural highlights, visiting hours, and live-style crowd density across our six initial pilot monuments."
            action={
              <Button href="/explore" variant="outline" size="md" rightIcon={ArrowRight}>
                Explore All Destinations
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {HERITAGE_SITES.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        </Container>
      </section>

      {/* SECTION C: Smart Crowd Monitoring Introduction */}
      <section className="py-16 sm:py-24 bg-heritage-sandstone-50/40 border-b border-heritage-sandstone/15">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-heritage-sandstone-700 bg-heritage-sandstone-100 px-2.5 py-1 rounded-md border border-heritage-sandstone-200">
                Intelligent Visitor Flow
              </span>

              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-heritage-charcoal tracking-tight leading-tight">
                How ANVAYA Prevents Dangerous Overcrowding
              </h2>

              <p className="text-sm sm:text-base text-heritage-charcoal-600 leading-relaxed font-sans">
                Heritage monuments possess fragile physical carrying capacities. Sudden tourist surges cause environmental wear, foot-traffic abrasion, and degraded visitor experiences.
              </p>

              <p className="text-xs sm:text-sm text-heritage-charcoal-600 leading-relaxed font-sans">
                ANVAYA models monument capacity in real time. We calculate instantaneous occupancy percentage against architectural carrying limits, categorizing crowd flow into three actionable advisory states:
              </p>

              {/* 3 Tier Explanation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-white border border-emerald-200 shadow-heritage-subtle">
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-800 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Low (0–40%)
                  </div>
                  <p className="text-[11px] text-heritage-charcoal-500 leading-normal">
                    Optimal photography window. Unhurried monument exploration.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-amber-200 shadow-heritage-subtle">
                  <div className="flex items-center gap-1.5 mb-1 text-amber-800 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Moderate (41–70%)
                  </div>
                  <p className="text-[11px] text-heritage-charcoal-500 leading-normal">
                    Standard visitor flow. Minor queuing at security checkpoints.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-rose-200 shadow-heritage-subtle">
                  <div className="flex items-center gap-1.5 mb-1 text-rose-800 font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    High (71–100%)
                  </div>
                  <p className="text-[11px] text-heritage-charcoal-500 leading-normal">
                    Peak density threshold. Turnstiles throttle entry automatically.
                  </p>
                </div>
              </div>

              {/* Conservation Advisory */}
              <div className="p-4 rounded-xl bg-heritage-ivory border border-heritage-sandstone/30 flex items-start gap-3 text-xs text-heritage-charcoal-600">
                <ShieldCheck className="w-5 h-5 text-heritage-green shrink-0 mt-0.5" />
                <p>
                  <strong>Carrying Capacity Standards:</strong> Real-time monument occupancy meters balance public tourist access with structural conservation, enabling uncrowded exploration of India&apos;s timeless heritage.
                </p>
              </div>

              <div className="pt-2">
                <Button href="/crowd-status" variant="primary" size="md" rightIcon={BarChart3}>
                  Inspect Live Crowd Dashboard
                </Button>
              </div>
            </div>

            {/* Right Telemetry Snapshot Card */}
            <div className="lg:col-span-5">
              <Card className="p-6 sm:p-8 border-heritage-sandstone/40">
                <div className="flex items-center justify-between pb-4 border-b border-heritage-sandstone/15">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-heritage-sandstone-700 bg-heritage-sandstone-100 px-2 py-0.5 rounded">
                      Pilot Overview
                    </span>
                    <h3 className="font-serif text-lg font-bold text-heritage-charcoal mt-1">
                      System Occupancy Ticker
                    </h3>
                  </div>
                  <CrowdBadge percentage={aggregateOccupancy} />
                </div>

                <div className="my-6 flex flex-col items-center justify-center text-center">
                  <CrowdGauge percentage={aggregateOccupancy} size="lg" />
                  <p className="text-xs text-heritage-charcoal-500 mt-3 font-sans">
                    Average density across all 6 pilot monuments
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-heritage-sandstone/15 text-xs">
                  <div className="flex justify-between py-1 border-b border-heritage-sandstone/10">
                    <span className="text-heritage-charcoal-500">Active Simulated Tourists:</span>
                    <strong className="text-heritage-charcoal font-semibold">
                      {totalCurrentSimulated.toLocaleString()} visitors
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-heritage-sandstone/10">
                    <span className="text-heritage-charcoal-500">Instantaneous Carrying Limit:</span>
                    <strong className="text-heritage-charcoal font-semibold">
                      {totalMaxCapacity.toLocaleString()} visitors
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-heritage-charcoal-500">Quota Availability:</span>
                    <strong className="text-emerald-700 font-semibold">
                      {(totalMaxCapacity - totalCurrentSimulated).toLocaleString()} passes open
                    </strong>
                  </div>
                </div>

                <div className="mt-6">
                  <Button href="/crowd-status" variant="outline" size="sm" className="w-full justify-center">
                    View Destination Breakdown
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION D: Why Choose ANVAYA */}
      <section className="py-16 sm:py-24 bg-heritage-ivory border-b border-heritage-sandstone/15">
        <Container size="xl">
          <SectionHeading
            eyebrow="Capabilities"
            title="Why Plan with ANVAYA"
            description="A modern smart-tourism platform built specifically for Indian historical monuments, visitors, and curators."
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-heritage-sandstone-100 flex items-center justify-center text-heritage-sandstone-700 mb-4 border border-heritage-sandstone-200">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                1. Archival History
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed font-sans">
                Curated historical narratives, architectural epoch details, and key archaeological facts verified against official records.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-heritage-green-50 flex items-center justify-center text-heritage-green mb-4 border border-heritage-green-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                2. Live Crowd Gauges
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed font-sans">
                Instantaneous density classifications (Low, Moderate, High) help you avoid queues and choose tranquil visit windows.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-heritage-gold-50 flex items-center justify-center text-heritage-gold-800 mb-4 border border-heritage-gold-200">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                3. Slotted Booking Plan
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed font-sans">
                Designed for atomic capacity locks that eliminate overbooking, guaranteeing entry during your reserved time slot.
              </p>
            </Card>

            <Card className="p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800 mb-4 border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-heritage-charcoal mb-2">
                4. Monument Preservation
              </h3>
              <p className="text-xs text-heritage-charcoal-500 leading-relaxed font-sans">
                Respecting maximum physical capacity limits prevents degradation of fragile marble plinths, frescoes, and stone carvings.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* SECTION E: Travel Planning CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-heritage-green-900 via-heritage-green to-heritage-green-800 text-heritage-ivory">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-heritage-gold/20 text-heritage-gold-300 border border-heritage-gold/30">
              <Sparkles className="w-3.5 h-3.5 text-heritage-gold" />
              Begin Your Journey
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Ready to Experience India&apos;s Architectural Wonders?
            </h2>

            <p className="text-sm sm:text-base text-heritage-sandstone-200 font-sans leading-relaxed">
              Browse destinations, compare crowd levels, and inspect detailed visiting guidelines to craft an unforgettable, respectful heritage journey.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Button href="/explore" variant="gold" size="lg" rightIcon={Compass}>
                Explore All Monuments
              </Button>
              <Button
                href="/about"
                variant="outline"
                size="lg"
                className="text-white border-white/40 hover:bg-white/10"
              >
                Learn About ANVAYA
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
