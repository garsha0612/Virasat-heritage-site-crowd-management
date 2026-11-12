'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import CrowdBadge from '@/components/crowd/CrowdBadge';
import CrowdGauge from '@/components/crowd/CrowdGauge';
import CrowdStatusCard from '@/components/crowd/CrowdStatusCard';
import { HERITAGE_SITES } from '@/constants/heritageSites';

export default function CrowdStatusPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Aggregated Statistics
  const totalSites = HERITAGE_SITES.length;
  const totalCurrent = HERITAGE_SITES.reduce(
    (acc, s) => acc + (s.capacity?.currentSimulatedVisitors || 0),
    0
  );
  const totalMax = HERITAGE_SITES.reduce(
    (acc, s) => acc + (s.capacity?.maxInstantaneous || 0),
    0
  );
  const aggregateOccupancy = Math.round((totalCurrent / totalMax) * 100);

  const lowSites = HERITAGE_SITES.filter((s) => s.capacity?.status === 'low');
  const moderateSites = HERITAGE_SITES.filter((s) => s.capacity?.status === 'moderate');
  const highSites = HERITAGE_SITES.filter((s) => s.capacity?.status === 'high');

  const displayedSites = HERITAGE_SITES.filter((site) => {
    if (selectedFilter === 'all') return true;
    return site.capacity?.status === selectedFilter;
  });

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen font-sans">
      <Container size="xl">
        {/* Page Title & Context */}
        <SectionHeading
          eyebrow="Real-Time Telemetry"
          title="Monuments Crowd Status & Carrying Capacity"
          description="Instantaneous visitor density telemetry across all six pilot heritage destinations. Use these indicators to plan visits during peaceful, unhurried time slots."
        />

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-heritage-charcoal-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Monuments</span>
              <Activity className="w-4 h-4 text-heritage-green" />
            </div>
            <div className="font-serif text-2xl font-bold text-heritage-charcoal">
              {totalSites} Sites
            </div>
            <div className="text-[11px] text-heritage-charcoal-500 mt-1">
              Active pilot network
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-heritage-charcoal-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Active Visitors</span>
              <Users className="w-4 h-4 text-heritage-sandstone-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-heritage-charcoal">
              {totalCurrent.toLocaleString()}
            </div>
            <div className="text-[11px] text-heritage-charcoal-500 mt-1">
              Simulated active tourists
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-heritage-charcoal-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Total Capacity</span>
              <TrendingUp className="w-4 h-4 text-heritage-gold" />
            </div>
            <div className="font-serif text-2xl font-bold text-heritage-charcoal">
              {totalMax.toLocaleString()}
            </div>
            <div className="text-[11px] text-heritage-charcoal-500 mt-1">
              Combined physical limit
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-xs text-heritage-charcoal-400 mb-1 font-semibold uppercase tracking-wider">
              <span>System Density</span>
              <CrowdBadge percentage={aggregateOccupancy} size="sm" />
            </div>
            <div className="font-serif text-2xl font-bold text-heritage-charcoal">
              {aggregateOccupancy}%
            </div>
            <div className="text-[11px] text-heritage-charcoal-500 mt-1">
              Average across all sites
            </div>
          </Card>
        </div>

        {/* Three Tier Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Low Category Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'low' ? 'all' : 'low')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              selectedFilter === 'low'
                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-heritage-md'
                : 'bg-white border-emerald-200/80 hover:border-emerald-300 shadow-heritage-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded">
                Low Density (0–40%)
              </span>
              <span className="font-serif text-xl font-bold text-emerald-900">
                {lowSites.length} Sites
              </span>
            </div>
            <p className="text-xs text-heritage-charcoal-600 leading-relaxed mb-3">
              Minimal queuing. Optimal time for uninterrupted photography and peaceful monument exploration.
            </p>
            <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <span>Monuments:</span>
              <span className="font-semibold">{lowSites.map((s) => s.name).join(', ')}</span>
            </div>
          </div>

          {/* Moderate Category Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'moderate' ? 'all' : 'moderate')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              selectedFilter === 'moderate'
                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20 shadow-heritage-md'
                : 'bg-white border-amber-200/80 hover:border-amber-300 shadow-heritage-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded">
                Moderate (41–70%)
              </span>
              <span className="font-serif text-xl font-bold text-amber-900">
                {moderateSites.length} Sites
              </span>
            </div>
            <p className="text-xs text-heritage-charcoal-600 leading-relaxed mb-3">
              Standard visitor movement. Moderate lines at security gates and inner sanctum corridors.
            </p>
            <div className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
              <span>Monuments:</span>
              <span className="font-semibold">{moderateSites.map((s) => s.name).join(', ')}</span>
            </div>
          </div>

          {/* High Category Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'high' ? 'all' : 'high')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              selectedFilter === 'high'
                ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 shadow-heritage-md'
                : 'bg-white border-rose-200/80 hover:border-rose-300 shadow-heritage-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded">
                High Density (71–100%)
              </span>
              <span className="font-serif text-xl font-bold text-rose-900">
                {highSites.length} Site
              </span>
            </div>
            <p className="text-xs text-heritage-charcoal-600 leading-relaxed mb-3">
              Approaching capacity. Entry turnstiles are paced and advance time-slotted booking is strongly recommended.
            </p>
            <div className="text-[11px] font-medium text-rose-800 flex items-center gap-1">
              <span>Monuments:</span>
              <span className="font-semibold">{highSites.map((s) => s.name).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Filter Selection Tabs Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-heritage-sandstone/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-heritage-charcoal-500 mr-2">
              Filter By Status:
            </span>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-heritage-green text-white'
                  : 'bg-white text-heritage-charcoal border border-heritage-sandstone/30 hover:bg-heritage-sandstone-50'
              }`}
            >
              All Monuments ({totalSites})
            </button>
            <button
              onClick={() => setSelectedFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedFilter === 'low'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              Low ({lowSites.length})
            </button>
            <button
              onClick={() => setSelectedFilter('moderate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedFilter === 'moderate'
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              Moderate ({moderateSites.length})
            </button>
            <button
              onClick={() => setSelectedFilter('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedFilter === 'high'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              High ({highSites.length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-heritage-charcoal-400">
            <Clock className="w-3.5 h-3.5 text-heritage-sandstone-600" />
            <span>Telemetry calibrated hourly</span>
          </div>
        </div>

        {/* Detailed Destination Crowd Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {displayedSites.map((site) => (
            <div key={site.id} className="flex flex-col">
              <CrowdStatusCard
                siteName={site.name}
                location={`${site.location}, ${site.state}`}
                currentVisitors={site.capacity?.currentSimulatedVisitors}
                maxCapacity={site.capacity?.maxInstantaneous}
                occupancyPercentage={site.capacity?.occupancyPercentage}
              />
              <div className="mt-2 text-right">
                <Link
                  href={`/sites/${site.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-heritage-green hover:underline"
                >
                  <span>View Full Monument Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Architectural Simulation Transparency Disclosure Card */}
        <div className="bg-heritage-charcoal text-heritage-sandstone-200 rounded-2xl p-6 sm:p-8 border border-heritage-gold/25">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-heritage-charcoal-800 border border-heritage-gold/30 flex items-center justify-center text-heritage-gold shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Algorithmic Simulation Transparency Standard
              </h3>
              <p className="text-xs sm:text-sm text-heritage-charcoal-300 leading-relaxed font-sans">
                In accordance with academic and institutional transparency standards, all visitor volumes, occupancy percentages, and gauge readouts displayed on this page are generated by an algorithmic simulation model. The algorithm models pedestrian arrival peaks (typically 10:00 AM and 03:00 PM) based on historical ASI attendance curves.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-heritage-gold-300">
                <span>Model: Gaussian Distribution Surge Engine</span>
                <span>•</span>
                <span>Status: Academic CA Demonstration</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
