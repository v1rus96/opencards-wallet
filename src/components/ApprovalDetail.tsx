'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, XCircle, Send, AlertTriangle, Globe, Coins } from 'lucide-react';
import type { DrawerAction } from '@/components/DepositCard';

const API_BASE = 'https://opencards-api-production.up.railway.app/api/v1';

export interface Approval {
  id: string;
  action: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  description: string;
  network?: string;
  recipient?: string;
  token?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface Props {
  approvalId: string;
  onBack: () => void;
  onActionButton?: (action: DrawerAction) => void;
  onComplete?: () => void;
}

function getApiHeaders() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('wallet_config') : null;
  const config = raw ? JSON.parse(raw) : {};
  return {
    Authorization: `Bearer ${config.apiKey || ''}`,
    'Content-Type': 'application/json',
  };
}

function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ApprovalDetail({ approvalId, onBack, onActionButton, onComplete }: Props) {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);
  const [result, setResult] = useState<'approved' | 'denied' | null>(null);

  // Fetch approval details
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/spending/approvals/${approvalId}`, {
          headers: getApiHeaders(),
        });
        const data = await res.json();
        if (data.approval) {
          setApproval(data.approval);
        } else {
          setError(data.error || 'Approval not found');
        }
      } catch {
        setError('Failed to load approval');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [approvalId]);

  // Report CTA buttons to parent drawer
  useEffect(() => {
    if (!onActionButton) return;

    if (result) {
      onActionButton({
        label: 'Done',
        disabled: false,
        perform: () => { onBack(); onComplete?.(); },
        onBack: undefined,
      });
      return;
    }

    if (!approval || approval.status !== 'pending' || loading) {
      onActionButton({
        label: 'Back',
        disabled: false,
        perform: () => onBack(),
      });
      return;
    }

    // For pending approvals, we handle buttons within the component
    // Just report a back action
    onActionButton({
      label: 'Back',
      disabled: false,
      perform: () => onBack(),
    });
  }, [approval, loading, result, onActionButton, onBack, onComplete]);

  const handleApprove = async () => {
    if (!approval) return;
    setSubmitting('approve');
    try {
      const res = await fetch(`${API_BASE}/spending/approvals/${approval.id}/approve`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      const data = await res.json();
      if (data.success !== false) {
        setResult('approved');
      } else {
        setError(data.error || 'Approval failed');
      }
    } catch {
      setError('Failed to approve');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!approval) return;
    setSubmitting('reject');
    try {
      const res = await fetch(`${API_BASE}/spending/approvals/${approval.id}/deny`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      const data = await res.json();
      if (data.success !== false) {
        setResult('denied');
      } else {
        setError(data.error || 'Rejection failed');
      }
    } catch {
      setError('Failed to reject');
    } finally {
      setSubmitting(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="mt-3 text-sm text-zinc-500">Loading approval...</p>
      </div>
    );
  }

  // Error state
  if (error && !approval) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <XCircle size={28} className="text-red-400" />
        </div>
        <p className="text-sm font-medium text-red-400">{error}</p>
        <button onClick={onBack} className="mt-4 text-sm text-zinc-500 underline">Go back</button>
      </div>
    );
  }

  if (!approval) return null;

  // Result state
  if (result) {
    const isApproved = result === 'approved';
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isApproved ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isApproved
            ? <CheckCircle2 size={32} className="text-emerald-400" />
            : <XCircle size={32} className="text-red-400" />}
        </div>
        <h3 className="text-lg font-bold">{isApproved ? 'Approved' : 'Rejected'}</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {isApproved
            ? 'The action has been approved and will execute automatically.'
            : 'The action has been rejected.'}
        </p>
      </div>
    );
  }

  // Already resolved
  if (approval.status !== 'pending') {
    const statusConfig = {
      approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Already Approved' },
      denied: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle, label: 'Already Rejected' },
      expired: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle, label: 'Expired' },
    }[approval.status] || { color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: AlertTriangle, label: approval.status };

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${statusConfig.bg}`}>
          <statusConfig.icon size={32} className={statusConfig.color} />
        </div>
        <h3 className="text-lg font-bold">{statusConfig.label}</h3>
        <p className="mt-1 text-sm text-zinc-500">{approval.description}</p>
      </div>
    );
  }

  // Pending approval — show details + action buttons
  return (
    <div className="animate-fadeIn px-1">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 transition-all active:scale-90">
          <ChevronLeft size={18} className="text-zinc-400" />
        </button>
        <div>
          <h3 className="text-base font-bold">Approval Request</h3>
          <p className="text-xs text-zinc-500">{timeAgo(approval.created_at)}</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
          <AlertTriangle size={14} />
          Review this action carefully before approving
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Action</p>
        <p className="text-sm font-medium text-white">{approval.description}</p>
      </div>

      {/* Details grid */}
      <div className="mb-4 space-y-2">
        {approval.amount != null && (
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <Coins size={16} className="mr-3 text-primary" />
            <span className="flex-1 text-xs text-zinc-500">Amount</span>
            <span className="font-mono text-sm font-bold text-white">
              {approval.amount} {approval.token || 'USDC'}
            </span>
          </div>
        )}

        {approval.network && (
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <Globe size={16} className="mr-3 text-zinc-500" />
            <span className="flex-1 text-xs text-zinc-500">Network</span>
            <span className="text-sm font-medium text-white">{approval.network}</span>
          </div>
        )}

        {approval.recipient && (
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <Send size={16} className="mr-3 text-zinc-500" />
            <span className="flex-1 text-xs text-zinc-500">Recipient</span>
            <span className="font-mono text-sm text-white">{shortenAddress(approval.recipient)}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-center text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={!!submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {submitting === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={!!submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {submitting === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Approve
        </button>
      </div>
    </div>
  );
}
