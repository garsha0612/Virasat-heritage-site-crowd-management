'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Ticket,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Compass,
  Info,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { getSiteBySlug } from '@/constants/heritageSites';
import {
  TICKET_CATEGORIES,
  getSitePricing,
  getCatalogEntryForSite,
} from '@/constants/pricing';
import { useAuth } from '@/hooks/useAuth';

export default function BookingWizardPage({ params }) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const slug = params.slug;
  const site = useMemo(() => getSiteBySlug(slug), [slug]);
  const pricingCatalog = useMemo(() => getCatalogEntryForSite(slug), [slug]);
  const isTajMahal = site?.slug === 'taj-mahal' || site?.slug === 'taj';

  // Date selection (default: today)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState('');

  // Verified ticket categories state
  const [ticketQuantities, setTicketQuantities] = useState({
    indianAdult: 1,
    saarcBimstec: 0,
    foreignerAdult: 0,
    child: 0,
  });

  // Taj Mahal specific addon
  const [includeMausoleum, setIncludeMausoleum] = useState(false);

  // Visitor Details state
  const [visitorDetails, setVisitorDetails] = useState({
    primaryName: '',
    primaryEmail: '',
    primaryPhone: '',
    nationality: 'Indian',
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Prefill visitor details from authenticated session
  useEffect(() => {
    if (user) {
      setVisitorDetails((prev) => ({
        ...prev,
        primaryName: user.name || '',
        primaryEmail: user.email || '',
        primaryPhone: user.phone || '',
        nationality: user.nationality || 'Indian',
      }));
    }
  }, [user]);

  // Fetch slot availability whenever site or date changes
  useEffect(() => {
    let isMounted = true;
    async function fetchSlots() {
      if (!site) return;
      setSlotsLoading(true);
      setSlotsError('');
      setSelectedSlotId(null);

      try {
        const res = await fetch(`/api/availability?site=${site.slug}&date=${selectedDate}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success) {
          setSlots(data.data.slots || []);
          // Auto-select first available slot if any
          const firstAvailable = (data.data.slots || []).find((s) => s.isAvailable);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.id);
          }
        } else {
          setSlotsError(data.message || 'Failed to load time slots.');
          setSlots([]);
        }
      } catch (err) {
        if (isMounted) setSlotsError('Unable to connect to availability service.');
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    }

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [site, selectedDate]);

  // Calculate live pricing summary
  const pricing = useMemo(() => {
    if (!site) return { unitPrices: {}, itemized: [], totalTickets: 0, totalAmount: 0 };
    const unitPrices = getSitePricing(site.slug);
    const itemized = [];
    let totalTickets = 0;
    let totalAmount = 0;

    Object.keys(TICKET_CATEGORIES).forEach((catKey) => {
      const qty = ticketQuantities[catKey] || 0;
      if (qty > 0) {
        const unitPrice = unitPrices[catKey] || 0;
        const subtotal = unitPrice * qty;
        totalTickets += qty;
        totalAmount += subtotal;
        itemized.push({
          category: catKey,
          label: TICKET_CATEGORIES[catKey].label,
          quantity: qty,
          unitPrice,
          subtotal,
        });
      }
    });

    // Taj Mahal Mausoleum Addon calculation
    let mausoleumAmount = 0;
    const payingAdultCount =
      (ticketQuantities.indianAdult || 0) +
      (ticketQuantities.saarcBimstec || 0) +
      (ticketQuantities.foreignerAdult || 0);

    if (isTajMahal && includeMausoleum && payingAdultCount > 0) {
      mausoleumAmount = payingAdultCount * 200;
      totalAmount += mausoleumAmount;
      itemized.push({
        category: 'mausoleumSupplement',
        label: 'Main Mausoleum Dome Supplement',
        quantity: payingAdultCount,
        unitPrice: 200,
        subtotal: mausoleumAmount,
      });
    }

    return { unitPrices, itemized, totalTickets, totalAmount, mausoleumAmount };
  }, [site, ticketQuantities, isTajMahal, includeMausoleum]);

  const handleQuantityChange = (category, delta) => {
    setTicketQuantities((prev) => {
      const current = prev[category] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [category]: next };
    });
  };

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.id === selectedSlotId);
  }, [slots, selectedSlotId]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      router.push(`/login?redirect=/sites/${site?.slug}/book`);
      return;
    }

    if (!selectedSlotId) {
      setBookingError('Please choose an available entry time slot.');
      return;
    }

    if (pricing.totalTickets === 0) {
      setBookingError('Please select at least 1 ticket pass.');
      return;
    }

    if (selectedSlot && selectedSlot.remainingCapacity < pricing.totalTickets) {
      setBookingError(
        `Selected time window has only ${selectedSlot.remainingCapacity} seats left. Please reduce your ticket quantity or select another slot.`
      );
      return;
    }

    if (!visitorDetails.primaryName.trim() || !visitorDetails.primaryEmail.trim()) {
      setBookingError('Please enter primary visitor name and email address.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        siteSlug: site.slug,
        visitDate: selectedDate,
        slotId: selectedSlotId,
        includeMausoleum: isTajMahal && includeMausoleum,
        tickets: Object.keys(ticketQuantities)
          .filter((k) => ticketQuantities[k] > 0)
          .map((k) => ({ category: k, quantity: ticketQuantities[k] })),
        visitorDetails: {
          primaryName: visitorDetails.primaryName.trim(),
          primaryEmail: visitorDetails.primaryEmail.trim(),
          primaryPhone: visitorDetails.primaryPhone.trim(),
          nationality: visitorDetails.nationality,
        },
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(data.data.checkoutUrl);
      } else {
        setBookingError(data.message || 'Failed to reserve tickets. Please try again.');
      }
    } catch (err) {
      setBookingError('Network error occurred during ticket reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!site) {
    return (
      <Container size="lg" className="py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-heritage-charcoal">Destination Not Found</h1>
        <p className="text-xs text-heritage-charcoal-500 mt-2">The requested heritage site does not exist.</p>
        <div className="mt-6">
          <Button href="/explore" variant="primary">Return to Monument Directory</Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen">
      <Container size="xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/sites/${site.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-600 hover:text-heritage-green transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {site.name} Overview</span>
          </Link>
        </div>

        {/* Academic Simulation Notice Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>NOTICE:</strong> ANVAYA is an educational heritage site management platform. 
            Time slot intervals and entry permits model crowd flow analytics.
            Official entry tickets must be procured through verified government portals or ASI monument counters.
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-heritage-green bg-heritage-green/10 px-2.5 py-0.5 rounded-full border border-heritage-green/20">
                Advance Booking
              </span>
              <span className="text-xs text-heritage-charcoal-400 font-sans">
                • {site.location}, {site.state}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
              Book Tickets for {site.name}
            </h1>
            <p className="text-xs text-heritage-charcoal-500 font-sans">
              Dynamic capacity controls model staggered tourist flow. Select your intended visit date and entrance slot below.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-mono bg-heritage-sandstone-50 border border-heritage-sandstone/25 p-3 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-heritage-green shrink-0" />
            <div>
              <p className="font-bold text-heritage-charcoal">Atomic Concurrency Guard</p>
              <p className="text-[10px] text-heritage-charcoal-400">Anti-Overbooking Model</p>
            </div>
          </div>
        </div>

        {/* Authentication Notice Banner */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-heritage-green shrink-0" />
              <span>You are reserving as a guest. Please sign in to link this entry pass to your account.</span>
            </div>
            <Button
              href={`/login?redirect=/sites/${site.slug}/book`}
              variant="outline"
              size="sm"
              className="shrink-0 bg-white"
            >
              Sign In to Book
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {bookingError && (
          <div
            role="alert"
            className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-sans flex-1">{bookingError}</span>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <form onSubmit={handleSubmitBooking}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Steps Column (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* STEP 1: Date & Slot Selection */}
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 pb-5 border-b border-heritage-sandstone/20">
                  <div className="w-8 h-8 rounded-lg bg-heritage-sandstone-100 text-heritage-green flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
                      Select Visit Date & Entry Window
                    </h2>
                    <p className="text-xs text-heritage-charcoal-400 font-sans">
                      Advance booking available up to 30 calendar days ahead.
                    </p>
                  </div>
                </div>

                {/* Date Input */}
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-heritage-charcoal-700 mb-2 font-sans">
                    Intended Date of Visit
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-72 rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/60 px-3.5 py-2.5 text-xs text-heritage-charcoal focus:border-heritage-green focus:bg-white focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-heritage-charcoal-400 mt-1 font-sans">
                    Monument visiting hours: {site.visitingHours?.open} – {site.visitingHours?.close} • {site.visitingHours?.note || 'Open daily'}
                  </p>
                </div>

                {/* Slots Grid */}
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-heritage-charcoal-700 mb-2 font-sans">
                    Available Demonstration Slots for {selectedDate}
                  </label>

                  {slotsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Skeleton variant="card" className="h-24" />
                      <Skeleton variant="card" className="h-24" />
                    </div>
                  ) : slotsError ? (
                    <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">
                      {slotsError}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-heritage-sandstone-50 text-heritage-charcoal-500 text-xs text-center">
                      No entry intervals configured for this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const isFull = slot.isFullyBooked;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? 'border-heritage-green bg-heritage-green/5 ring-2 ring-heritage-green/30'
                                : isFull
                                ? 'border-heritage-sandstone/20 bg-heritage-sandstone-50/50 opacity-60 cursor-not-allowed'
                                : 'border-heritage-sandstone/30 bg-white hover:border-heritage-sandstone hover:bg-heritage-sandstone-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-serif font-bold text-sm text-heritage-charcoal">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              {isFull ? (
                                <Badge variant="high" size="sm">Fully Booked</Badge>
                              ) : (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                  slot.occupancyPercentage > 70
                                    ? 'bg-rose-100 text-rose-800'
                                    : slot.occupancyPercentage > 40
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {slot.remainingCapacity} seats left
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-heritage-charcoal-500 mt-1 truncate">
                              {slot.slotLabel}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: Ticket Categories & Quantities */}
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 pb-5 border-b border-heritage-sandstone/20">
                  <div className="w-8 h-8 rounded-lg bg-heritage-sandstone-100 text-heritage-green flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
                      Choose Visitor Passes
                    </h2>
                    <p className="text-xs text-heritage-charcoal-400 font-sans">
                      Tariffs based on official Archaeological Survey of India (ASI) notifications.
                    </p>
                  </div>
                </div>

                <div className="mt-6 divide-y divide-heritage-sandstone/15">
                  {Object.keys(TICKET_CATEGORIES).map((catKey) => {
                    const cat = TICKET_CATEGORIES[catKey];
                    const unitPrice = pricing.unitPrices[catKey] || 0;
                    const qty = ticketQuantities[catKey] || 0;

                    return (
                      <div key={catKey} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-heritage-charcoal">
                              {cat.label}
                            </span>
                            {catKey === 'child' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-heritage-charcoal-500">
                            {cat.description}
                          </p>
                          <p className="text-[10px] text-heritage-charcoal-400 italic">
                            Proof: {cat.eligibility}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-heritage-charcoal">
                              {unitPrice === 0 ? 'FREE' : `₹${unitPrice}`}
                            </div>
                            <span className="text-[10px] text-heritage-charcoal-400">per person</span>
                          </div>

                          {/* Stepper Controls */}
                          <div className="flex items-center rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/50">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(catKey, -1)}
                              disabled={qty <= 0}
                              className="w-8 h-8 flex items-center justify-center text-heritage-charcoal hover:bg-heritage-sandstone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-xl transition-colors font-bold text-sm"
                            >
                              –
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-heritage-charcoal">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(catKey, 1)}
                              disabled={qty >= 10}
                              className="w-8 h-8 flex items-center justify-center text-heritage-charcoal hover:bg-heritage-sandstone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-r-xl transition-colors font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Taj Mahal Main Mausoleum Addon Card */}
                {isTajMahal && (
                  <div className="mt-6 p-4 rounded-2xl border-2 border-heritage-gold/40 bg-heritage-gold/5 flex items-start gap-4">
                    <input
                      type="checkbox"
                      id="mausoleum-check"
                      checked={includeMausoleum}
                      onChange={(e) => setIncludeMausoleum(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-heritage-sandstone text-heritage-green focus:ring-heritage-green"
                    />
                    <label htmlFor="mausoleum-check" className="cursor-pointer space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-heritage-charcoal">
                          Add Main Mausoleum Dome Entry Ticket (+₹200 per adult)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-heritage-green bg-heritage-green/10 px-2 py-0.5 rounded">
                          Official ASI Addon
                        </span>
                      </div>
                      <p className="text-[11px] text-heritage-charcoal-600 leading-relaxed">
                        Required to step onto the upper marble plinth and view the central cenotaph chamber of Emperor Shah Jahan and Mumtaz Mahal.
                        Children under 15 enter free.
                      </p>
                      <a
                        href="https://www.tajmahal.gov.in/visiting-hours.aspx"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-heritage-green hover:underline mt-0.5"
                      >
                        Official ADA/ASI tariff notification <ExternalLink className="w-3 h-3" />
                      </a>
                    </label>
                  </div>
                )}
              </div>

              {/* STEP 3: Visitor Details */}
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 pb-5 border-b border-heritage-sandstone/20">
                  <div className="w-8 h-8 rounded-lg bg-heritage-sandstone-100 text-heritage-green flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
                      Lead Visitor Contact Details
                    </h2>
                    <p className="text-xs text-heritage-charcoal-400 font-sans">
                      Electronic gate pass delivery and simulated verification dossier.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <Input
                    label="Primary Visitor Full Name *"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={visitorDetails.primaryName}
                    onChange={(e) =>
                      setVisitorDetails({ ...visitorDetails, primaryName: e.target.value })
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Email Address *"
                      type="email"
                      required
                      placeholder="e.g. aarav@example.com"
                      value={visitorDetails.primaryEmail}
                      onChange={(e) =>
                        setVisitorDetails({ ...visitorDetails, primaryEmail: e.target.value })
                      }
                    />

                    <Input
                      label="Contact Mobile Number"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={visitorDetails.primaryPhone}
                      onChange={(e) =>
                        setVisitorDetails({ ...visitorDetails, primaryPhone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heritage-charcoal-700 mb-1 font-sans">
                      Visitor Nationality Category
                    </label>
                    <select
                      value={visitorDetails.nationality}
                      onChange={(e) =>
                        setVisitorDetails({ ...visitorDetails, nationality: e.target.value })
                      }
                      className="w-full rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/60 px-3.5 py-2.5 text-xs text-heritage-charcoal focus:border-heritage-green focus:bg-white focus:outline-none"
                    >
                      <option value="Indian">Indian Citizen (Domestic Tariff)</option>
                      <option value="SAARC/BIMSTEC">SAARC / BIMSTEC Treaty Citizen</option>
                      <option value="Other Foreigner">Foreign Tourist (Non-SAARC)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Summary Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-6 sm:p-8 sticky top-24 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-heritage-sandstone/20">
                  <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
                    Reservation Dossier
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-heritage-sandstone-100 text-heritage-charcoal-600 rounded font-semibold">
                    Official Tariff
                  </span>
                </div>

                {/* Monument & Slot Details */}
                <div className="space-y-3 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-heritage-charcoal-500">Destination:</span>
                    <strong className="text-heritage-charcoal font-semibold">{site.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-heritage-charcoal-500">Scheduled Date:</span>
                    <strong className="text-heritage-charcoal font-semibold">{selectedDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-heritage-charcoal-500">Time Slot:</span>
                    <strong className="text-heritage-charcoal font-semibold">
                      {selectedSlot
                        ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
                        : 'None Selected'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-heritage-charcoal-500">Admitted Visitors:</span>
                    <strong className="text-heritage-charcoal font-semibold">
                      {pricing.totalTickets} Person(s)
                    </strong>
                  </div>
                </div>

                {/* Itemized Pricing Breakdown */}
                <div className="pt-4 border-t border-heritage-sandstone/20">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-heritage-charcoal-400 mb-2 font-mono">
                    Tariff Breakdown (INR ₹)
                  </h4>

                  {pricing.itemized.length === 0 ? (
                    <p className="text-xs text-heritage-charcoal-400 italic">No tickets selected.</p>
                  ) : (
                    <div className="space-y-2 text-xs font-mono">
                      {pricing.itemized.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-heritage-charcoal-600 font-sans">
                            {item.label} × {item.quantity}
                          </span>
                          <span className="font-bold text-heritage-charcoal">
                            ₹{item.subtotal}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="pt-4 border-t-2 border-heritage-sandstone/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-heritage-charcoal-500 font-sans block">Total Payable</span>
                    <span className="text-[10px] text-heritage-charcoal-400 font-sans">Payment via Razorpay</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold text-heritage-green">
                      ₹{pricing.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Official Source & Verification Disclosure */}
                {pricingCatalog && (
                  <div className="p-3 bg-heritage-sandstone-50/70 rounded-xl border border-heritage-sandstone/20 text-[10px] text-heritage-charcoal-500 space-y-1">
                    <div className="font-bold text-heritage-charcoal">Official Tariff Authority:</div>
                    <div>{pricingCatalog.sourceOrganization}</div>
                    <div className="flex items-center gap-1">
                      <span>Source:</span>
                      <a
                        href={pricingCatalog.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-heritage-green underline truncate max-w-[200px]"
                      >
                        {pricingCatalog.officialSourceUrl}
                      </a>
                    </div>
                    <div>Verified: {pricingCatalog.lastVerifiedDate}</div>
                  </div>
                )}

                {/* CTA Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={bookingLoading}
                    disabled={pricing.totalTickets === 0 || !selectedSlotId}
                    className="w-full justify-center"
                    rightIcon={ArrowRight}
                  >
                    Proceed to Payment (₹{pricing.totalAmount})
                  </Button>
                  <p className="text-[10px] text-heritage-charcoal-400 text-center mt-2 font-sans">
                    You will be taken to the secure payment step to complete your booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
