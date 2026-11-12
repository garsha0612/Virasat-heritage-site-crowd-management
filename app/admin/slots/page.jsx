'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Landmark,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Power,
  Users,
  Edit2,
  Info,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';

export default function AdminSlotsPage() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('taj-mahal');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Slot Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newSlotData, setNewSlotData] = useState({
    startTime: '10:00',
    endTime: '11:00',
    capacity: 200,
    slotLabel: 'Morning Window',
  });

  // Edit Capacity Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newCapacity, setNewCapacity] = useState(200);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch monuments list
  useEffect(() => {
    async function loadSites() {
      try {
        const res = await fetch('/api/admin/sites');
        const json = await res.json();
        if (res.ok && json.success && json.data.sites?.length > 0) {
          setSites(json.data.sites);
          if (!selectedSite) setSelectedSite(json.data.sites[0].slug);
        }
      } catch {}
    }
    loadSites();
  }, []);

  const fetchSlots = async () => {
    if (!selectedSite || !selectedDate) return;
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ site: selectedSite, date: selectedDate });
      const res = await fetch(`/api/admin/slots?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSlots(json.data.slots || []);
      } else {
        setError(json.message || 'Unable to retrieve time slots.');
      }
    } catch {
      setError('Network communication error while loading slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedSite, selectedDate]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heritageSite: selectedSite,
          date: selectedDate,
          startTime: newSlotData.startTime,
          endTime: newSlotData.endTime,
          capacity: Number(newSlotData.capacity),
          slotLabel: newSlotData.slotLabel,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreateModalOpen(false);
        fetchSlots();
      } else {
        setCreateError(data.message || 'Failed to create slot.');
      }
    } catch {
      setCreateError('Network error while creating slot.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;

    if (newCapacity < editingSlot.reservedCount) {
      setEditError(
        `Capacity cannot be set below ${editingSlot.reservedCount} already reserved tickets.`
      );
      return;
    }

    try {
      setUpdating(true);
      setEditError('');
      const res = await fetch(`/api/admin/slots/${editingSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: Number(newCapacity) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditModalOpen(false);
        setEditingSlot(null);
        fetchSlots();
      } else {
        setEditError(data.message || 'Failed to update capacity.');
      }
    } catch {
      setEditError('Network error while updating capacity.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    try {
      const res = await fetch(`/api/admin/slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slot.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, isActive: data.data.isActive } : s))
        );
      }
    } catch {
      alert('Network error while updating slot status.');
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (slot.reservedCount > 0) {
      alert(
        `Cannot delete this slot because ${slot.reservedCount} visitor(s) are booked into this window. Deactivate the slot instead.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete slot ${slot.startTime} – ${slot.endTime}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/slots/${slot.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchSlots();
      } else {
        alert(data.message || 'Failed to delete slot.');
      }
    } catch {
      alert('Network error while deleting slot.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Time Slot & Carrying Capacity
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Configure hourly visitor quotas, manage demonstration entry windows, and monitor occupancy.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={Plus}
          onClick={() => {
            setCreateError('');
            setCreateModalOpen(true);
          }}
          className="bg-heritage-green hover:bg-heritage-green-800"
        >
          Add Time Slot
        </Button>
      </div>

      {/* Educational Demonstration Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="font-sans leading-relaxed">
          <strong className="font-semibold text-amber-950">Demonstration Capacity Note:</strong>
          <span className="ml-1">
            Carrying capacities and time intervals represent configurable ANVAYA demonstration parameters
            for testing crowd dispersal algorithms, not official Archaeological Survey of India statutory caps.
          </span>
        </div>
      </div>

      {/* Site and Calendar Date Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm flex flex-wrap items-center gap-4 text-xs font-sans">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-heritage-green" />
          <span className="font-semibold text-heritage-charcoal">Monument:</span>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal focus:outline-none focus:ring-1 focus:ring-heritage-green font-medium"
          >
            {sites.map((st) => (
              <option key={st.id} value={st.slug}>
                {st.name} ({st.city})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-heritage-sandstone-600" />
          <span className="font-semibold text-heritage-charcoal">Visit Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
          />
        </div>

        <button
          type="button"
          onClick={fetchSlots}
          className="p-1.5 text-heritage-charcoal-400 hover:text-heritage-green ml-auto"
          title="Refresh slots"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-44" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 p-16 text-center space-y-3 shadow-heritage-sm">
          <Clock className="w-12 h-12 text-heritage-sandstone-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
            No Time Slots for Selected Date
          </h3>
          <p className="text-xs text-heritage-charcoal-400 max-w-sm mx-auto font-sans">
            No entry windows have been seeded for {selectedDate}. Click &quot;Add Time Slot&quot; to initialize
            custom capacity intervals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot) => {
            const isFull = slot.remainingCapacity <= 0;
            return (
              <div
                key={slot.id}
                className={`bg-white rounded-3xl border shadow-heritage-sm p-6 space-y-4 transition-all ${
                  slot.isActive
                    ? 'border-heritage-sandstone/30'
                    : 'border-heritage-sandstone/30 bg-heritage-sandstone-50/50 opacity-75'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="font-serif text-lg font-bold text-heritage-charcoal flex items-center gap-2">
                      <Clock className="w-4 h-4 text-heritage-green" />
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </span>
                    <p className="text-[11px] text-heritage-charcoal-400 font-sans">
                      {slot.slotLabel}
                    </p>
                  </div>

                  <Badge variant={slot.isActive ? 'success' : 'danger'} className="text-[10px]">
                    {slot.isActive ? 'Active' : 'Closed'}
                  </Badge>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="text-heritage-charcoal-500 font-medium">Occupancy</span>
                    <span className="font-mono font-bold text-heritage-charcoal">
                      {slot.occupancyPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-heritage-sandstone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        slot.occupancyPercentage > 85
                          ? 'bg-rose-500'
                          : slot.occupancyPercentage > 50
                          ? 'bg-amber-500'
                          : 'bg-heritage-green'
                      }`}
                      style={{ width: `${Math.min(100, slot.occupancyPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Capacity Numbers */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-heritage-sandstone/20 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-heritage-charcoal-400 block uppercase">Capacity</span>
                    <span className="font-bold text-heritage-charcoal">{slot.capacity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-heritage-charcoal-400 block uppercase">Reserved</span>
                    <span className="font-bold text-amber-700">{slot.reservedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-heritage-charcoal-400 block uppercase">Available</span>
                    <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {slot.remainingCapacity}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-heritage-sandstone/15">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlot(slot);
                      setNewCapacity(slot.capacity);
                      setEditError('');
                      setEditModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-500 hover:text-heritage-green text-xs font-sans transition-colors inline-flex items-center gap-1"
                    title="Edit Capacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Capacity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSlotStatus(slot)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors inline-flex items-center gap-1 ${
                      slot.isActive
                        ? 'border-heritage-sandstone/30 text-heritage-charcoal-500 hover:text-amber-700'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={slot.isActive ? 'Deactivate Slot' : 'Activate Slot'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{slot.isActive ? 'Close' : 'Open'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot)}
                    className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-rose-300 text-heritage-charcoal-500 hover:text-rose-700 transition-colors"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Slot Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`Add Time Slot: ${selectedSite} (${selectedDate})`}
        size="md"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Start Time (HH:MM) *
              </label>
              <input
                type="text"
                required
                value={newSlotData.startTime}
                onChange={(e) => setNewSlotData({ ...newSlotData, startTime: e.target.value })}
                placeholder="10:00"
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                End Time (HH:MM) *
              </label>
              <input
                type="text"
                required
                value={newSlotData.endTime}
                onChange={(e) => setNewSlotData({ ...newSlotData, endTime: e.target.value })}
                placeholder="11:00"
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-heritage-charcoal mb-1">
              Demonstration Capacity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={newSlotData.capacity}
              onChange={(e) => setNewSlotData({ ...newSlotData, capacity: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
            />
          </div>

          <div>
            <label className="block font-semibold text-heritage-charcoal mb-1">
              Slot Label (Optional)
            </label>
            <input
              type="text"
              value={newSlotData.slotLabel}
              onChange={(e) => setNewSlotData({ ...newSlotData, slotLabel: e.target.value })}
              placeholder="e.g. Mid-Morning Window"
              className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-1 focus:ring-heritage-green"
            />
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-heritage-sandstone/20">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={creating}
              className="bg-heritage-green hover:bg-heritage-green-800 text-white"
            >
              {creating ? 'Saving Slot...' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Capacity Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingSlot(null);
        }}
        title={`Adjust Carrying Capacity: ${editingSlot?.startTime} – ${editingSlot?.endTime}`}
        size="md"
      >
        <form onSubmit={handleUpdateCapacity} className="space-y-4 text-xs font-sans">
          <div className="p-3.5 rounded-xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <p className="text-heritage-charcoal font-semibold">
              Currently Reserved: <span className="font-mono text-amber-800 font-bold">{editingSlot?.reservedCount} tickets</span>
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">
              To prevent overbooking, capacity cannot be reduced below the existing reserved ticket count.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-heritage-charcoal mb-1">
              New Maximum Capacity *
            </label>
            <input
              type="number"
              min={editingSlot?.reservedCount || 1}
              required
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green"
            />
          </div>

          {editError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              {editError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-heritage-sandstone/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditModalOpen(false);
                setEditingSlot(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updating}
              className="bg-heritage-green hover:bg-heritage-green-800 text-white"
            >
              {updating ? 'Updating...' : 'Save Capacity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
