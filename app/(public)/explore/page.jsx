'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  MapPin,
  Landmark,
  Compass,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import SiteCard from '@/components/site/SiteCard';
import {
  HERITAGE_SITES,
  getAllCategories,
  getAllStates,
} from '@/constants/heritageSites';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCrowd, setSelectedCrowd] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const categories = useMemo(() => getAllCategories(), []);
  const states = useMemo(() => getAllStates(), []);

  // Filter and Sort logic
  const filteredSites = useMemo(() => {
    return HERITAGE_SITES.filter((site) => {
      // 1. Text Search matching name, location, state, category
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.location.toLowerCase().includes(q) ||
        site.state.toLowerCase().includes(q) ||
        site.category.toLowerCase().includes(q) ||
        site.shortDescription.toLowerCase().includes(q);

      // 2. State filter
      const matchesState = selectedState === 'all' || site.state === selectedState;

      // 3. Category filter
      const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;

      // 4. Crowd level filter
      const matchesCrowd =
        selectedCrowd === 'all' || site.capacity?.status === selectedCrowd;

      return matchesQuery && matchesState && matchesCategory && matchesCrowd;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'occupancy-asc') {
        return (a.capacity?.occupancyPercentage || 0) - (b.capacity?.occupancyPercentage || 0);
      }
      if (sortBy === 'price-asc') {
        return (a.ticketPricing?.indian || 0) - (b.ticketPricing?.indian || 0);
      }
      return 0;
    });
  }, [searchQuery, selectedState, selectedCategory, selectedCrowd, sortBy]);

  function handleResetFilters() {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCategory('all');
    setSelectedCrowd('all');
    setSortBy('name-asc');
  }

  const isFiltered =
    Boolean(searchQuery) ||
    selectedState !== 'all' ||
    selectedCategory !== 'all' ||
    selectedCrowd !== 'all' ||
    sortBy !== 'name-asc';

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen">
      <Container size="xl">
        {/* Page Header */}
        <SectionHeading
          eyebrow="Directory & Search"
          title="Explore Heritage Destinations"
          description="Discover India's most celebrated archaeological wonders. Filter by state, epoch, and real-time visitor density to plan a tranquil itinerary."
        />

        {/* Filter & Search Control Panel */}
        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 mb-10">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between pb-5 border-b border-heritage-sandstone/15">
            {/* Search Bar Input */}
            <div className="flex-1 max-w-lg">
              <Input
                placeholder="Search by monument name, city, or architecture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={Search}
                className="w-full"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs font-sans shrink-0">
              <label htmlFor="sort-select" className="text-heritage-charcoal-500 font-semibold uppercase tracking-wider">
                Sort By:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-heritage-sandstone/40 bg-heritage-ivory px-3 py-2 text-xs text-heritage-charcoal focus:border-heritage-green focus:outline-none"
              >
                <option value="name-asc">Monument Name (A–Z)</option>
                <option value="occupancy-asc">Lowest Crowd First (Least Crowded)</option>
                <option value="rating-desc">Highest Rated First</option>
                <option value="price-asc">Entry Fee (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters Strip */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* State Filter */}
            <div>
              <label htmlFor="state-filter" className="block text-[11px] font-bold uppercase tracking-wider text-heritage-charcoal-500 mb-1.5">
                Filter by State
              </label>
              <select
                id="state-filter"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-lg border border-heritage-sandstone/40 bg-heritage-ivory px-3 py-2 text-xs text-heritage-charcoal focus:border-heritage-green focus:outline-none"
              >
                <option value="all">All States ({HERITAGE_SITES.length} monuments)</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-[11px] font-bold uppercase tracking-wider text-heritage-charcoal-500 mb-1.5">
                Architectural Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-heritage-sandstone/40 bg-heritage-ivory px-3 py-2 text-xs text-heritage-charcoal focus:border-heritage-green focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Crowd Level Filter */}
            <div>
              <label htmlFor="crowd-filter" className="block text-[11px] font-bold uppercase tracking-wider text-heritage-charcoal-500 mb-1.5">
                Crowd Density Status
              </label>
              <select
                id="crowd-filter"
                value={selectedCrowd}
                onChange={(e) => setSelectedCrowd(e.target.value)}
                className="w-full rounded-lg border border-heritage-sandstone/40 bg-heritage-ivory px-3 py-2 text-xs text-heritage-charcoal focus:border-heritage-green focus:outline-none"
              >
                <option value="all">All Crowd Levels</option>
                <option value="low">Low Crowd (0–40%)</option>
                <option value="moderate">Moderate (41–70%)</option>
                <option value="high">High Density (71–100%)</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            <div>
              <Button
                variant={isFiltered ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleResetFilters}
                disabled={!isFiltered}
                leftIcon={RotateCcw}
                className="w-full justify-center"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between text-xs text-heritage-charcoal-500 mb-6 font-sans">
          <span>
            Showing <strong className="text-heritage-charcoal font-semibold">{filteredSites.length}</strong> of {HERITAGE_SITES.length} monuments
          </span>
          {isFiltered && (
            <span className="font-mono text-heritage-sandstone-800 bg-heritage-sandstone-100 px-2 py-0.5 rounded">
              Active Filters Applied
            </span>
          )}
        </div>

        {/* Destinations Grid or Empty State */}
        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-12 text-center max-w-lg mx-auto my-12">
            <div className="w-14 h-14 rounded-full bg-heritage-sandstone-100 flex items-center justify-center text-heritage-sandstone-600 mx-auto mb-4 border border-heritage-sandstone-200">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-heritage-charcoal">
              No Heritage Sites Match Your Search
            </h3>
            <p className="text-xs text-heritage-charcoal-500 mt-2 leading-relaxed">
              We couldn&apos;t find any monuments matching &quot;{searchQuery}&quot; with your selected state, category, and crowd level filters.
            </p>
            <div className="mt-6">
              <Button variant="primary" size="md" onClick={handleResetFilters} leftIcon={RotateCcw}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

function ExploreLoadingFallback() {
  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Skeleton variant="text" className="w-32 mx-auto h-4" />
          <Skeleton variant="title" className="w-96 mx-auto h-10" />
          <Skeleton variant="text" className="w-full h-4" />
        </div>
        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-6 mb-10 space-y-4">
          <Skeleton variant="text" className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Skeleton variant="text" className="h-9 rounded-lg" />
            <Skeleton variant="text" className="h-9 rounded-lg" />
            <Skeleton variant="text" className="h-9 rounded-lg" />
            <Skeleton variant="text" className="h-9 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-heritage-sandstone/30 overflow-hidden p-4 space-y-4">
              <Skeleton variant="rectangular" className="h-48 w-full rounded-xl" />
              <Skeleton variant="title" className="w-3/4 h-6" />
              <Skeleton variant="text" className="w-full h-4" />
              <Skeleton variant="text" className="w-2/3 h-4" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreLoadingFallback />}>
      <ExploreContent />
    </Suspense>
  );
}
