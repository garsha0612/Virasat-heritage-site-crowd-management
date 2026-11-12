'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Power,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';

export default function AdminSitesPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterOptions, setFilterOptions] = useState({ states: [], categories: [] });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedState !== 'all') params.set('state', selectedState);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (activeFilter !== 'all') params.set('isActive', activeFilter);

      const res = await fetch(`/api/admin/sites?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSites(json.data.sites || []);
        if (json.data.filterOptions) {
          setFilterOptions(json.data.filterOptions);
        }
      } else {
        setError(json.message || 'Unable to retrieve heritage sites.');
      }
    } catch (err) {
      setError('Network communication error occurred while loading monuments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [selectedState, selectedCategory, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSites();
  };

  const handleToggleStatus = async (site) => {
    try {
      const res = await fetch(`/api/admin/sites/${site.id}/toggle-status`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSites((prev) =>
          prev.map((s) => (s.id === site.id ? { ...s, isActive: data.data.isActive } : s))
        );
      } else {
        alert(data.message || 'Failed to update site status.');
      }
    } catch {
      alert('Network error while toggling site status.');
    }
  };

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    try {
      setDeleting(true);
      setDeleteError('');
      const res = await fetch(`/api/admin/sites/${siteToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteModalOpen(false);
        setSiteToDelete(null);
        fetchSites();
      } else {
        setDeleteError(data.message || 'Failed to delete monument.');
      }
    } catch {
      setDeleteError('Network error while attempting deletion.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Heritage Monuments
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Manage official destination records, tariff schedules, visiting guidelines, and operating capacities.
          </p>
        </div>

        <Button
          href="/admin/sites/new"
          variant="primary"
          leftIcon={Plus}
          className="bg-heritage-green hover:bg-heritage-green-800"
        >
          Add Heritage Site
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-heritage-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search monuments by name, city, state, or slug..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green font-sans"
            />
          </div>

          <Button type="submit" variant="secondary" size="sm" className="shrink-0">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-heritage-sandstone/20 text-xs font-sans">
          <span className="text-heritage-charcoal-400 flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All States / UTs</option>
            {filterOptions.states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Categories</option>
            {filterOptions.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Active Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>

          <button
            type="button"
            onClick={fetchSites}
            className="p-1.5 text-heritage-charcoal-400 hover:text-heritage-green ml-auto"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Monuments Table */}
      <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-16" />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Landmark className="w-12 h-12 text-heritage-sandstone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
              No Heritage Sites Found
            </h3>
            <p className="text-xs text-heritage-charcoal-400 max-w-sm mx-auto font-sans">
              No monument records matched your search and filter criteria. Adjust your filters or add a new monument.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-heritage-sandstone-50/60 border-b border-heritage-sandstone/20 text-heritage-charcoal-500 uppercase tracking-wider text-[10px] font-mono font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Monument</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Official Tariff</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Activity</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-sandstone/15">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-heritage-sandstone-50/40 transition-colors">
                    {/* Monument Name & Slug */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/sites/${site.id}`}
                          className="font-serif font-bold text-sm text-heritage-charcoal hover:text-heritage-green transition-colors"
                        >
                          {site.name}
                        </Link>
                        <p className="font-mono text-[11px] text-heritage-charcoal-400">
                          /{site.slug}
                        </p>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-heritage-charcoal-600">
                      {site.city}, {site.state}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-heritage-sandstone-100 text-heritage-charcoal-700 font-medium text-[11px]">
                        {site.category}
                      </span>
                    </td>

                    {/* Tariffs */}
                    <td className="py-4 px-4 font-mono text-[11px] text-heritage-charcoal-600">
                      Adult: ₹{site.entryFee?.indianAdult} • Foreigner: ₹{site.entryFee?.foreignerAdult}
                    </td>

                    {/* Active Status */}
                    <td className="py-4 px-4 text-center">
                      <Badge
                        variant={site.isActive ? 'success' : 'danger'}
                        className="text-[10px]"
                      >
                        {site.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>

                    {/* Bookings & Slots */}
                    <td className="py-4 px-4 text-center font-mono text-[11px] text-heritage-charcoal-500">
                      {site.bookingCount} bookings • {site.slotCount} slots
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Dossier */}
                        <Link
                          href={`/admin/sites/${site.id}`}
                          className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-500 hover:text-heritage-green transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/admin/sites/${site.id}/edit`}
                          className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-heritage-gold text-heritage-charcoal-500 hover:text-heritage-gold-700 transition-colors"
                          title="Edit Site"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(site)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            site.isActive
                              ? 'border-heritage-sandstone/30 hover:border-amber-300 text-heritage-charcoal-500 hover:text-amber-700'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={site.isActive ? 'Deactivate Site' : 'Activate Site'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Guard */}
                        <button
                          type="button"
                          onClick={() => {
                            setSiteToDelete(site);
                            setDeleteError('');
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-rose-300 text-heritage-charcoal-500 hover:text-rose-700 transition-colors"
                          title="Delete Site"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Guard Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSiteToDelete(null);
        }}
        title="Confirm Monument Deletion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-heritage-charcoal font-sans">
            Are you sure you want to permanently delete{' '}
            <strong className="text-heritage-charcoal font-bold">{siteToDelete?.name}</strong>?
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans">
            <strong>Auditing Safeguard:</strong> Sites with historical booking records or reserved time
            slots cannot be hard-deleted. To disable public bookings while retaining records, deactivate the
            site instead.
          </div>

          {deleteError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-heritage-sandstone/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setSiteToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={deleting}
              onClick={confirmDelete}
              className="bg-rose-700 hover:bg-rose-800 text-white"
            >
              {deleting ? 'Verifying & Deleting...' : 'Confirm Safe Deletion'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
