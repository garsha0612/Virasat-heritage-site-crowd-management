'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  ArrowLeft,
  Calendar,
  Clock,
  Ticket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Building2,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function AccountRefundsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/users/refunds');
      const data = await res.json();
      if (res.ok && data.success) {
        setRefunds(data.data.refunds || []);
      } else {
        setError(data.message || 'Unable to retrieve refund requests.');
      }
    } catch {
      setError('Network communication error while loading refunds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account/refunds');
      return;
    }
    if (isAuthenticated) {
      fetchRefunds();
    }
  }, [authLoading, isAuthenticated, router]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning">Submitted — Under Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Administrative Review Active</Badge>;
      case 'APPROVED':
        return <Badge variant="primary">Approved — Queued for Settlement</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing via Gateway</Badge>;
      case 'REFUNDED':
        return <Badge variant="success">Refund Settled Successfully</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Request Rejected</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Gateway Settlement Pending Retry</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getTimelineSteps = (refund) => {
    const isRejected = refund.status === 'REJECTED';
    const isApproved = ['APPROVED', 'PROCESSING', 'REFUNDED'].includes(refund.status);
    const isSettled = refund.status === 'REFUNDED';
    const isUnderReview = ['UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'REFUNDED', 'REJECTED'].includes(refund.status);

    return [
      {
        title: 'Request Submitted',
        desc: `Submitted on ${new Date(refund.requestedAt || refund.createdAt).toLocaleDateString('en-IN')}`,
        completed: true,
        active: refund.status === 'REQUESTED',
      },
      {
        title: 'Administrative Review',
        desc: isRejected
          ? `Rejected: ${refund.adminReview?.adminNote || 'Does not meet refund criteria'}`
          : isUnderReview
          ? refund.adminReview?.adminNote || 'Supervisor reviewing reservation record'
          : 'Pending supervisor review',
        completed: isUnderReview || isRejected,
        active: refund.status === 'UNDER_REVIEW',
        failed: isRejected,
      },
      {
        title: 'Gateway Settlement',
        desc: isSettled
          ? `Settled via Cashfree (Ref: ${refund.gateway?.cfRefundId || refund.gateway?.cashfreeRefundId || refund.refundId})`
          : isApproved
          ? 'Initiated with Cashfree payment gateway'
          : 'Awaiting administrative approval',
        completed: isSettled,
        active: ['APPROVED', 'PROCESSING'].includes(refund.status),
      },
    ];
  };

  if (authLoading || loading) {
    return (
      <div className="py-12 sm:py-16 bg-heritage-ivory min-h-screen">
        <Container size="lg" className="space-y-6">
          <Skeleton variant="title" className="w-64 h-8" />
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-40" />
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-600 hover:text-heritage-green transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Visitor Dashboard</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRefunds}
            leftIcon={RefreshCw}
            className="text-xs text-heritage-charcoal-500 hover:text-heritage-charcoal"
          >
            Refresh
          </Button>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
              <RotateCcw className="w-6 h-6" />
            </span>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
                My Refund Requests
              </h1>
              <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans mt-0.5">
                Track administrative review status, justification records, and Cashfree gateway settlements.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Refunds List */}
        {refunds.length === 0 ? (
          <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-heritage-sandstone-100 text-heritage-sandstone-600 flex items-center justify-center mx-auto mb-4 border border-heritage-sandstone/30">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
              No Refund Requests Found
            </h3>
            <p className="text-xs text-heritage-charcoal-500 mt-2 leading-relaxed font-sans">
              You have not submitted any refund requests. Eligible reservations can be refunded directly from your booking list.
            </p>
            <div className="mt-6">
              <Button href="/dashboard" variant="primary" size="sm">
                View My Bookings
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {refunds.map((refund) => {
              const timeline = getTimelineSteps(refund);
              return (
                <div
                  key={refund._id}
                  className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8 space-y-6"
                >
                  {/* Top Bar: IDs & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-heritage-sandstone/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-heritage-charcoal">
                          {refund.refundId}
                        </span>
                        <span className="text-[10px] text-heritage-charcoal-400 font-mono">
                          Ref: {refund.bookingReference}
                        </span>
                      </div>
                      <p className="text-xs text-heritage-charcoal-500 font-sans mt-0.5">
                        {refund.booking?.siteName || 'Heritage Monument'} • Visit Date:{' '}
                        {refund.booking?.visitDate || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                          Refund Amount
                        </span>
                        <span className="font-mono text-base font-bold text-heritage-green">
                          ₹{refund.approvedAmount || refund.requestedAmount}
                        </span>
                      </div>
                      {getStatusBadge(refund.status)}
                    </div>
                  </div>

                  {/* Justification details */}
                  <div className="p-4 rounded-2xl bg-heritage-ivory border border-heritage-sandstone/25 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block mb-0.5">
                          Reason for Request:
                        </span>
                        <p className="font-semibold text-heritage-charcoal">
                          "{refund.reason}"
                        </p>
                      </div>
                    </div>
                    {refund.supportingDetails && (
                      <p className="text-heritage-charcoal-500 text-[11px] italic">
                        Supporting Details: {refund.supportingDetails}
                      </p>
                    )}
                    {refund.adminReview?.adminNote && (
                      <div className="pt-2 border-t border-heritage-sandstone/15">
                        <span className="text-[10px] uppercase font-bold text-heritage-green block mb-0.5">
                          Administrator Decision Note:
                        </span>
                        <p className="text-heritage-charcoal font-medium">
                          {refund.adminReview.adminNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline Progression */}
                  <div>
                    <h4 className="text-[11px] uppercase font-bold text-heritage-charcoal-400 mb-3 tracking-wider font-sans">
                      Refund Lifecycle Timeline
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {timeline.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border text-xs ${
                            step.failed
                              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                              : step.completed
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : step.active
                              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                              : 'bg-heritage-ivory/50 border-heritage-sandstone/20 text-heritage-charcoal-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {step.failed ? (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : step.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-heritage-sandstone-500 shrink-0" />
                            )}
                            <strong className="text-xs">{step.title}</strong>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {step.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settlement Metadata */}
                  {refund.status === 'REFUNDED' && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Funds credited to original payment source via Cashfree Payment Gateway.</span>
                      </div>
                      <span className="font-mono font-bold text-[11px]">
                        CF ID: {refund.gateway?.cfRefundId || refund.refundId}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
