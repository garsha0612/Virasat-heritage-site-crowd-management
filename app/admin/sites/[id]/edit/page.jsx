'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Landmark,
  Save,
  AlertCircle,
  Clock,
  IndianRupee,
  Layers,
  MapPin,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function EditHeritageSitePage({ params }) {
  const router = useRouter();
  const siteId = params.id;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    historicalBackground: '',
    state: '',
    city: '',
    address: '',
    latitude: 0,
    longitude: 0,
    category: '',
    openTime: '06:00',
    closeTime: '18:00',
    weeklyClosingDay: 'None',
    feeIndianAdult: 50,
    feeSaarcBimstec: 540,
    feeForeignerAdult: 1100,
    feeChild: 0,
    feeMausoleumSupplement: 0,
    visitorInstructions: '',
    websiteUrl: '',
    isFeatured: false,
    isActive: true,
    imageUrls: '',
    maxPerHour: 1000,
    standardSlotCapacity: 200,
  });

  useEffect(() => {
    async function loadSite() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/sites/${siteId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const s = data.data.site;
          setFormData({
            name: s.name || '',
            slug: s.slug || '',
            tagline: s.tagline || '',
            description: s.description || '',
            historicalBackground: s.historicalBackground || '',
            state: s.state || '',
            city: s.city || '',
            address: s.address || '',
            latitude: s.latitude ?? 0,
            longitude: s.longitude ?? 0,
            category: s.category || 'Mughal Architecture',
            openTime: s.openingHours?.open || '06:00',
            closeTime: s.openingHours?.close || '18:00',
            weeklyClosingDay: s.weeklyClosingDay || 'None',
            feeIndianAdult: s.entryFee?.indianAdult ?? 50,
            feeSaarcBimstec: s.entryFee?.saarcBimstec ?? 540,
            feeForeignerAdult: s.entryFee?.foreignerAdult ?? 1100,
            feeChild: s.entryFee?.child ?? 0,
            feeMausoleumSupplement: s.entryFee?.mausoleumSupplement ?? 0,
            visitorInstructions: Array.isArray(s.visitorInstructions)
              ? s.visitorInstructions.join('\n')
              : '',
            websiteUrl: s.websiteUrl || '',
            isFeatured: Boolean(s.isFeatured),
            isActive: Boolean(s.isActive),
            imageUrls: Array.isArray(s.images) ? s.images.join('\n') : '',
            maxPerHour: s.demonstrationCapacity?.maxPerHour ?? 1000,
            standardSlotCapacity: s.demonstrationCapacity?.standardSlotCapacity ?? 200,
          });
        } else {
          setError(data.message || 'Failed to load monument.');
        }
      } catch {
        setError('Network error while loading monument.');
      } finally {
        setLoading(false);
      }
    }
    if (siteId) loadSite();
  }, [siteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

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

      const res = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/admin/sites/${siteId}`);
      } else {
        setError(data.message || 'Failed to update monument.');
      }
    } catch {
      setError('Network communication error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton variant="title" className="w-64 h-8" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link
          href={`/admin/sites/${siteId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-500 hover:text-heritage-green transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Site Dossier</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
          Edit Monument: {formData.name}
        </h1>
        <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
          Update verified official tariffs, visiting hours, and capacity thresholds.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Category *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Active Status
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              >
                <option value="true">Active (Public Bookings Enabled)</option>
                <option value="false">Deactivated (Archived from Public View)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <MapPin className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Geographic Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                State / UT *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tariff Schedule */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <IndianRupee className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Official ASI Tariffs (₹ INR)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Indian Adult
              </label>
              <input
                type="number"
                min="0"
                value={formData.feeIndianAdult}
                onChange={(e) => setFormData({ ...formData, feeIndianAdult: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                SAARC / BIMSTEC
              </label>
              <input
                type="number"
                min="0"
                value={formData.feeSaarcBimstec}
                onChange={(e) => setFormData({ ...formData, feeSaarcBimstec: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Foreign Tourist
              </label>
              <input
                type="number"
                min="0"
                value={formData.feeForeignerAdult}
                onChange={(e) => setFormData({ ...formData, feeForeignerAdult: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Child (Below 15)
              </label>
              <input
                type="number"
                min="0"
                value={formData.feeChild}
                onChange={(e) => setFormData({ ...formData, feeChild: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Mausoleum Addon
              </label>
              <input
                type="number"
                min="0"
                value={formData.feeMausoleumSupplement}
                onChange={(e) => setFormData({ ...formData, feeMausoleumSupplement: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Narrative Description */}
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
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Visitor Instructions (One per line)
              </label>
              <textarea
                rows={3}
                value={formData.visitorInstructions}
                onChange={(e) => setFormData({ ...formData, visitorInstructions: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-heritage-sandstone/30 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button href={`/admin/sites/${siteId}`} variant="outline">
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            leftIcon={Save}
            className="bg-heritage-green hover:bg-heritage-green-800"
          >
            {submitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
