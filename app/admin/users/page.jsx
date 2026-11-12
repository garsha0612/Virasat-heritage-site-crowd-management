'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Power,
  RefreshCw,
  AlertCircle,
  Calendar,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // Visitor Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pagination.limit));
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (activeFilter !== 'all') params.set('isActive', activeFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data.users || []);
        setPagination(json.data.pagination);
      } else {
        setError(json.message || 'Unable to retrieve users.');
      }
    } catch {
      setError('Network communication error while loading users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    if (currentUser?.id === user.id) {
      alert('Security safeguard: You cannot deactivate your own administrative account.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: data.data.isActive } : u))
        );
      } else {
        alert(data.message || 'Failed to update user status.');
      }
    } catch {
      alert('Network error while toggling user status.');
    }
  };

  const openUserDetail = async (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUserBookings(json.data.bookings || []);
      }
    } catch {
      // Keep empty
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Visitor & User Accounts
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Registered visitor accounts, verification status, and historical booking activity.
          </p>
        </div>
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
              placeholder="Search by full name, email address, or phone number..."
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

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Roles</option>
            <option value="visitor">Visitors</option>
            <option value="admin">Administrators</option>
            <option value="staff">Monument Staff</option>
          </select>

          {/* Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Suspended Only</option>
          </select>

          <button
            type="button"
            onClick={() => fetchUsers(pagination.page)}
            className="p-1.5 text-heritage-charcoal-400 hover:text-heritage-green ml-auto"
            title="Refresh users"
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

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-14" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-heritage-sandstone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
              No Registered Users Found
            </h3>
            <p className="text-xs text-heritage-charcoal-400 max-w-sm mx-auto font-sans">
              No accounts matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-heritage-sandstone-50/60 border-b border-heritage-sandstone/20 text-heritage-charcoal-500 uppercase tracking-wider text-[10px] font-mono font-semibold">
                <tr>
                  <th className="py-3.5 px-6">User / Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4 text-center">Registered</th>
                  <th className="py-3.5 px-4 text-center">Total Bookings</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-sandstone/15">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-heritage-sandstone-50/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-bold text-heritage-charcoal flex items-center gap-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono bg-heritage-green/10 text-heritage-green px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[11px] text-heritage-charcoal-400">
                            {u.email}
                          </p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === 'staff'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-heritage-sandstone-100 text-heritage-charcoal-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-mono text-heritage-charcoal-600">
                        {u.phone || '—'}
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 text-center font-mono text-[11px] text-heritage-charcoal-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Total Bookings */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-heritage-charcoal">
                        {u.totalBookings}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <Badge
                          variant={u.isActive ? 'success' : 'danger'}
                          className="text-[10px]"
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openUserDetail(u)}
                            className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-500 hover:text-heritage-green transition-colors"
                            title="View Visitor History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                u.isActive
                                  ? 'border-heritage-sandstone/30 hover:border-rose-300 text-heritage-charcoal-500 hover:text-rose-700'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-heritage-sandstone-50/40 border-t border-heritage-sandstone/20 flex items-center justify-between text-xs font-sans">
            <span className="text-heritage-charcoal-400">
              Showing page <strong>{pagination.page}</strong> of{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.total} registered users)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visitor Detail Modal with Booking History */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedUser(null);
          setUserBookings([]);
        }}
        title={`Visitor Profile: ${selectedUser?.name}`}
        size="lg"
      >
        <div className="space-y-6 text-xs font-sans">
          {/* Identity Snapshot */}
          <div className="p-4 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-heritage-charcoal-400 text-[10px] uppercase font-mono block">Email</span>
              <p className="font-mono font-bold text-heritage-charcoal mt-0.5 truncate">
                {selectedUser?.email}
              </p>
            </div>
            <div>
              <span className="text-heritage-charcoal-400 text-[10px] uppercase font-mono block">Role</span>
              <p className="font-bold text-heritage-charcoal mt-0.5 capitalize">{selectedUser?.role}</p>
            </div>
            <div>
              <span className="text-heritage-charcoal-400 text-[10px] uppercase font-mono block">Phone</span>
              <p className="font-mono text-heritage-charcoal mt-0.5">{selectedUser?.phone || 'None'}</p>
            </div>
            <div>
              <span className="text-heritage-charcoal-400 text-[10px] uppercase font-mono block">Status</span>
              <Badge variant={selectedUser?.isActive ? 'success' : 'danger'} className="text-[10px] mt-0.5">
                {selectedUser?.isActive ? 'Active' : 'Suspended'}
              </Badge>
            </div>
          </div>

          {/* Booking History Table */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-heritage-charcoal">
              Historical Booking Dossier ({userBookings.length})
            </h4>

            {detailLoading ? (
              <Skeleton variant="card" className="h-28" />
            ) : userBookings.length === 0 ? (
              <p className="text-center py-6 text-heritage-charcoal-400">
                No past reservations found for this visitor.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-heritage-sandstone/20 border border-heritage-sandstone/20 rounded-2xl bg-white">
                {userBookings.map((b) => (
                  <div key={b._id} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono font-bold text-heritage-charcoal">{b.bookingReference}</p>
                      <p className="text-[11px] text-heritage-charcoal-400">
                        {b.siteName} • Visit: {b.visitDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">₹{b.totalAmount}</span>
                      <Badge
                        variant={
                          b.bookingStatus === 'confirmed'
                            ? 'success'
                            : b.bookingStatus === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {b.bookingStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-heritage-sandstone/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Close Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
