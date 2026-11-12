'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  FileText,
  User,
  CreditCard,
  History,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({
    TOTAL: 0,
    REQUESTED: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    PROCESSING: 0,
    REFUNDED: 0,
    REJECTED: 0,
    FAILED: 0,
    totalRefundedAmount: 0,
    totalPendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRefunds = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pagination.limit));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/refunds?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setRefunds(json.data.refunds || []);
        setPagination(json.data.pagination);
        if (json.data.counts) setCounts(json.data.counts);
      } else {
        setError(json.message || 'Unable to retrieve refunds.');
      }
    } catch {
      setError('Network communication error while loading refunds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRefunds(1);
  };

  const openDetailModal = (refund) => {
    setSelectedRefund(refund);
    setAdminNote(refund.adminReview?.adminNote || '');
    setActionError('');
    setIsDetailModalOpen(true);
  };

  const handleStatusTransition = async (actionName, bodyPayload = {}) => {
    if (!selectedRefund) return;
    try {
      setProcessingAction(true);
      setActionError('');
      const res = await fetch(`/api/admin/refunds/${selectedRefund._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, adminNote, ...bodyPayload }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionSuccessMsg(json.message || 'Refund updated successfully.');
        setTimeout(() => setActionSuccessMsg(''), 5000);
        setIsDetailModalOpen(false);
        fetchRefunds(pagination.page);
      } else {
        setActionError(json.message || 'Operation failed.');
      }
    } catch {
      setActionError('Network error executing refund transition.');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning">Requested</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">Approved (Queued)</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Gateway Processing</Badge>;
      case 'REFUNDED':
        return <Badge variant="success">Refunded</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Gateway Failed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-heritage-green/10 text-heritage-green">
              <RotateCcw className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
              Refund Governance & Settlement
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-heritage-charcoal-500 mt-1">
            Mandatory administrator approval, financial validation, and genuine Cashfree refund execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRefunds(pagination.page)}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-5 shadow-heritage-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-charcoal-400">
            Pending Review
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {counts.REQUESTED + counts.UNDER_REVIEW}
            </span>
            <span className="text-[11px] text-heritage-charcoal-400">requests</span>
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            ₹{counts.totalPendingAmount.toLocaleString('en-IN')} pending decision
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-5 shadow-heritage-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-charcoal-400">
            Approved / Ready for Gateway
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-heritage-green">
              {counts.APPROVED}
            </span>
            <span className="text-[11px] text-heritage-charcoal-400">requests</span>
          </div>
          <p className="text-[11px] text-heritage-green/80 mt-1">
            Awaiting administrator gateway dispatch
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-5 shadow-heritage-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-charcoal-400">
            Settled (Refunded)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {counts.REFUNDED}
            </span>
            <span className="text-[11px] text-heritage-charcoal-400">settled</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-mono font-semibold">
            ₹{counts.totalRefundedAmount.toLocaleString('en-IN')} returned
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-5 shadow-heritage-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-heritage-charcoal-400">
            Rejected / Failed
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {counts.REJECTED + counts.FAILED}
            </span>
            <span className="text-[11px] text-heritage-charcoal-400">cases</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1">
            {counts.FAILED > 0 ? `${counts.FAILED} eligible for gateway retry` : 'Zero gateway errors'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-heritage-sandstone/30 p-4 shadow-heritage-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-heritage-sandstone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Booking Reference (VIR-...) or Refund ID (REF-...)"
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal font-mono placeholder:font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal font-medium"
            >
              <option value="ALL">All Statuses ({counts.TOTAL})</option>
              <option value="REQUESTED">Requested ({counts.REQUESTED})</option>
              <option value="UNDER_REVIEW">Under Review ({counts.UNDER_REVIEW})</option>
              <option value="APPROVED">Approved ({counts.APPROVED})</option>
              <option value="PROCESSING">Processing ({counts.PROCESSING})</option>
              <option value="REFUNDED">Refunded ({counts.REFUNDED})</option>
              <option value="REJECTED">Rejected ({counts.REJECTED})</option>
              <option value="FAILED">Failed ({counts.FAILED})</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton variant="card" className="h-16" />
            <Skeleton variant="card" className="h-16" />
            <Skeleton variant="card" className="h-16" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-xs font-semibold">
            {error}
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-16 text-center text-heritage-charcoal-400">
            <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-serif text-base font-bold text-heritage-charcoal">
              No Refund Requests Found
            </p>
            <p className="text-xs mt-1">
              There are currently no refund requests matching your selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-heritage-ivory/60 border-b border-heritage-sandstone/20 text-heritage-charcoal-500 font-serif">
                  <th className="py-3.5 px-4 font-bold">Refund ID & Date</th>
                  <th className="py-3.5 px-4 font-bold">Booking Reference</th>
                  <th className="py-3.5 px-4 font-bold">Visitor Details</th>
                  <th className="py-3.5 px-4 font-bold text-right">Tariff Amount</th>
                  <th className="py-3.5 px-4 font-bold text-center">Current Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-sandstone/15 font-sans">
                {refunds.map((r) => (
                  <tr key={r._id} className="hover:bg-heritage-ivory/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-heritage-charcoal block">
                        {r.refundId}
                      </span>
                      <span className="text-[10px] text-heritage-charcoal-400">
                        {new Date(r.requestedAt || r.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-heritage-green block">
                        {r.bookingReference}
                      </span>
                      <span className="text-[10px] text-heritage-charcoal-500">
                        {r.booking?.siteName || 'Heritage Monument'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-heritage-charcoal block">
                        {r.user?.name || 'Visitor'}
                      </span>
                      <span className="text-[10px] text-heritage-charcoal-400 font-mono">
                        {r.user?.email || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-heritage-charcoal">
                      ₹{r.requestedAmount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openDetailModal(r)}
                        leftIcon={Eye}
                        className="text-xs"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Settlement Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => !processingAction && setIsDetailModalOpen(false)}
        title={`Refund Review: ${selectedRefund?.refundId}`}
        description="Inspect visitor justification, original payment capture, and execute authorized state transition."
      >
        {selectedRefund && (
          <div className="space-y-5 text-xs font-sans">
            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-heritage-ivory border border-heritage-sandstone/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                  Status
                </span>
                <span className="mt-1 block">{getStatusBadge(selectedRefund.status)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                  Eligible Amount
                </span>
                <span className="font-mono text-sm font-bold text-heritage-green mt-1 block">
                  ₹{selectedRefund.requestedAmount}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                  Booking Ref
                </span>
                <span className="font-mono text-xs font-bold text-heritage-charcoal mt-1 block">
                  {selectedRefund.bookingReference}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                  Monument
                </span>
                <span className="text-xs font-semibold text-heritage-charcoal mt-1 block truncate">
                  {selectedRefund.booking?.siteName}
                </span>
              </div>
            </div>

            {/* Visitor Reason */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">
                Visitor Justification
              </span>
              <p className="text-heritage-charcoal font-medium leading-relaxed">
                "{selectedRefund.reason}"
              </p>
              {selectedRefund.supportingDetails && (
                <p className="text-heritage-charcoal-500 text-[11px] mt-2 italic">
                  Additional Details: {selectedRefund.supportingDetails}
                </p>
              )}
            </div>

            {/* Payment & Gateway Data */}
            <div className="p-3.5 rounded-xl bg-white border border-heritage-sandstone/30 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-400">Payment Gateway:</span>
                <strong className="text-heritage-charcoal">Cashfree Payment Gateway</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-400">Cashfree Order ID:</span>
                <span className="text-heritage-charcoal">
                  {selectedRefund.booking?.payment?.cashfreeOrderId || selectedRefund.bookingReference}
                </span>
              </div>
              {selectedRefund.gateway?.cfRefundId && (
                <div className="flex justify-between">
                  <span className="text-heritage-charcoal-400">CF Refund ID:</span>
                  <span className="text-heritage-green font-bold">
                    {selectedRefund.gateway.cfRefundId}
                  </span>
                </div>
              )}
              {selectedRefund.gateway?.failureReason && (
                <div className="flex justify-between text-red-600">
                  <span>Last Gateway Error:</span>
                  <span className="truncate max-w-[240px]">
                    {selectedRefund.gateway.failureReason}
                  </span>
                </div>
              )}
            </div>

            {/* Admin Note Input */}
            <div>
              <label className="block text-[11px] font-bold text-heritage-charcoal-600 uppercase tracking-wider mb-1.5">
                Administrative Note / Justification
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter justification for approval, review comments, or reason for rejection..."
                rows={2}
                disabled={processingAction}
                className="w-full px-3 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal"
              />
            </div>

            {/* Action Buttons based on status */}
            <div className="pt-4 border-t border-heritage-sandstone/20 flex flex-wrap items-center justify-end gap-2.5">
              {['REQUESTED', 'UNDER_REVIEW'].includes(selectedRefund.status) && (
                <>
                  {selectedRefund.status === 'REQUESTED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusTransition('review')}
                      disabled={processingAction}
                    >
                      Mark Under Review
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusTransition('reject', { reason: adminNote })}
                    disabled={processingAction}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusTransition('approve')}
                    isLoading={processingAction}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700"
                  >
                    Approve Refund
                  </Button>
                </>
              )}

              {['APPROVED', 'FAILED'].includes(selectedRefund.status) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusTransition('process-gateway')}
                  isLoading={processingAction}
                  leftIcon={Send}
                  className="bg-heritage-green hover:bg-heritage-green/90 text-white"
                >
                  {selectedRefund.status === 'FAILED' ? 'Retry Cashfree Refund' : 'Initiate Cashfree Refund'}
                </Button>
              )}

              {selectedRefund.status === 'REFUNDED' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settled via Cashfree (ID: {selectedRefund.gateway?.cfRefundId || selectedRefund.refundId})</span>
                </div>
              )}
            </div>

            {/* Audit Log Timeline */}
            {selectedRefund.auditLog && selectedRefund.auditLog.length > 0 && (
              <div className="pt-4 border-t border-heritage-sandstone/15">
                <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block mb-2">
                  Complete Activity Audit Log
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedRefund.auditLog.map((log, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-2 rounded-lg bg-heritage-ivory/60 border border-heritage-sandstone/20 text-[11px] flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-heritage-charcoal block">
                          {log.action}
                        </span>
                        <span className="text-heritage-charcoal-500 text-[10px]">
                          By {log.actorName} ({log.actorRole})
                        </span>
                        {log.note && (
                          <p className="text-heritage-charcoal-600 text-[10px] mt-0.5">
                            {log.note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-heritage-charcoal-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
