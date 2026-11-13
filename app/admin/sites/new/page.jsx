'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Landmark,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Shield,
  Layers,
  MapPin,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NewHeritageSitePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    historicalBackground: '',
    state: '',
    city: '',
    address: '',
    latitude: 27.1751,
    longitude: 78.0421,
    category: 'Mughal Architecture',
    openTime: '06:00',
    closeTime: '18:00',
    weeklyClosingDay: 'None',
    feeIndianAdult: 50,
    feeSaarcBimstec: 540,
    feeForeignerAdult: 1100,
    feeChild: 0,
    feeMausoleumSupplement: 0,
    visitorInstructions:
      'Valid government photo identity card is required at turnstiles.\nChildren below 15 years enter complimentary.\nLarge baggage, camera tripods, and tobacco items are prohibited.',
    websiteUrl: 'https://asi.nic.in',
    isFeatured: false,
    isActive: true,
    imageUrls: '/images/hero-banner.jpg',
    maxPerHour: 1000,
    standardSlotCapacity: 200,
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFormErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        historicalBackground: formData.historicalBackground.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        category: formData.category.trim(),
        openingHours: {
          open: formData.openTime.trim(),
          close: formData.closeTime.trim(),
        },
        weeklyClosingDay: formData.weeklyClosingDay.trim(),
        entryFee: {
          indianAdult: Number(formData.feeIndianAdult),
          saarcBimstec: Number(formData.feeSaarcBimstec),
          foreignerAdult: Number(formData.feeForeignerAdult),
          child: Number(formData.feeChild),
          mausoleumSupplement: Number(formData.feeMausoleumSupplement),
        },
        visitorInstructions: formData.visitorInstructions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        websiteUrl: formData.websiteUrl.trim(),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        images: formData.imageUrls
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        demonstrationCapacity: {
          maxPerHour: Number(formData.maxPerHour),
          standardSlotCapacity: Number(formData.standardSlotCapacity),
        },
      };

      const res = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin/sites');
      } else {
        setError(data.message || 'Failed to register heritage monument.');
      }
    } catch (err) {
      setError('A network communication error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header and Back navigation */}
      <div>
        <Link
          href="/admin/sites"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-500 hover:text-heritage-green transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Monuments</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
          Register New Heritage Monument
        </h1>
        <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
          Add an official destination record with verified ASI tariffs, visiting guidelines, and carrying capacity quotas.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <Landmark className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Monument Identity & Taxonomy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Monument Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Fatehpur Sikri"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                URL Slug * (Unique Identifier)
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="e.g. fatehpur-sikri"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. The Mughal City of Victory"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              >
                <option value="Mughal Architecture">Mughal Architecture</option>
                <option value="Ancient Caves">Ancient Caves & Rock Cut</option>
                <option value="Temple Architecture">Temple Architecture</option>
                <option value="Forts & Palaces">Forts & Palaces</option>
                <option value="Colonial & Modern">Colonial & Modern</option>
                <option value="Archaeological Remains">Archaeological Remains</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Official Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://asi.nic.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Geographic Location */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <MapPin className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Location & Coordinates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                State / Union Territory *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                City / District *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Agra"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Postal Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Fatehpur Sikri, Agra District, Uttar Pradesh 283110"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Tariff Schedule */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <IndianRupee className="w-4 h-4 text-heritage-green" />
            <div>
              <h2 className="font-serif text-base font-bold text-heritage-charcoal">
                Official ASI Tariff Schedule (₹ INR)
              </h2>
              <p className="text-[11px] text-heritage-charcoal-400 font-sans">
                Statutory tariffs recalculated server-side during booking creation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Indian Citizen (Adult) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-heritage-charcoal-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.feeIndianAdult}
                  onChange={(e) => setFormData({ ...formData, feeIndianAdult: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                SAARC / BIMSTEC Citizen *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-heritage-charcoal-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.feeSaarcBimstec}
                  onChange={(e) => setFormData({ ...formData, feeSaarcBimstec: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Foreign Tourist (Non-SAARC) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-heritage-charcoal-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.feeForeignerAdult}
                  onChange={(e) => setFormData({ ...formData, feeForeignerAdult: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Child (Below 15 Years) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-heritage-charcoal-400">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.feeChild}
                  onChange={(e) => setFormData({ ...formData, feeChild: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Dome / Mausoleum Supplement (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-heritage-charcoal-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={formData.feeMausoleumSupplement}
                  onChange={(e) => setFormData({ ...formData, feeMausoleumSupplement: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Operational Hours & Carrying Capacity Quotas */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <Clock className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Visiting Hours & Carrying Capacity Quotas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Opening Time (HH:MM)
              </label>
              <input
                type="text"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                placeholder="06:00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Closing Time (HH:MM)
              </label>
              <input
                type="text"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                placeholder="18:00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Weekly Closed Day
              </label>
              <select
                value={formData.weeklyClosingDay}
                onChange={(e) => setFormData({ ...formData, weeklyClosingDay: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              >
                <option value="None">Open All 7 Days (None)</option>
                <option value="Friday">Friday (e.g. Taj Mahal)</option>
                <option value="Monday">Monday (e.g. Red Fort)</option>
                <option value="Wednesday">Wednesday</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Standard Slot Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.standardSlotCapacity}
                onChange={(e) => setFormData({ ...formData, standardSlotCapacity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Descriptions & Guidelines */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <Layers className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Narrative & Visitor Guidelines
            </h2>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Overview Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Comprehensive architectural and cultural description of the monument..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Historical Background
              </label>
              <textarea
                rows={3}
                value={formData.historicalBackground}
                onChange={(e) => setFormData({ ...formData, historicalBackground: e.target.value })}
                placeholder="Commission history, builder, dynasty era, and archaeological discovery..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Visitor Instructions (One rule per line)
              </label>
              <textarea
                rows={3}
                value={formData.visitorInstructions}
                onChange={(e) => setFormData({ ...formData, visitorInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Image Reference URLs (One per line)
              </label>
              <textarea
                rows={2}
                value={formData.imageUrls}
                onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
                placeholder="/images/hero-banner.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button href="/admin/sites" variant="outline">
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            leftIcon={Save}
            className="bg-heritage-green hover:bg-heritage-green-800"
          >
            {submitting ? 'Registering Monument...' : 'Save & Publish Monument'}
          </Button>
        </div>
      </form>
    </div>
  );
}
