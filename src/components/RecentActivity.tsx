'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ChevronRight } from 'lucide-react';
import { CardOrder } from '@/types';
import { getCardTransactions } from '@/lib/api';

interface Transaction {
  transactionId?: string;
  type?: string;
  amount?: number;
  fee?: number;
  status?: string;
  transactionTime?: number;
  description?: string;
  merchantName?: string;
  [key: string]: unknown;
}

interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  onViewAll: () => void;
}

function getTxIcon(tx: Transaction) {
  const type = (tx.type || '').toLowerCase();
  if (type.includes('deposit') || type.includes('recharge'))
    return { icon: <ArrowDownLeft size={16} />, cls: 'bg-emerald-500/10 text-emerald-400' };
  if (type.includes('withdraw') || type.includes('spend') || type.includes('purchase'))
    return { icon: <ArrowUpRight size={16} />, cls: 'bg-red-500/10 text-red-400' };
  if (type.includes('create') || type.includes('open'))
    return { icon: <CreditCard size={16} />, cls: 'bg-primary/10 text-primary' };
  if (type.includes('freeze'))
    return { icon: <Snowflake size={16} />, cls: 'bg-blue-500/10 text-blue-400' };
  return { icon: <CircleDot size={16} />, cls: 'bg-zinc-500/10 text-zinc-400' };
}

function formatRelativeTime(ts: number): string {
  if (!ts) return '';
  const time = ts > 1e12 ? ts : ts * 1000;
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function RecentActivity({ cards, onViewAll }: Props) {
  const [transactions, setTransactions] = useState<(Transaction & { cardLast4: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const allTxs: (Transaction & { cardLast4: string })[] = [];
      for (const card of cards) {
        try {
          const txs = await getCardTransactions(card.id);
          if (Array.isArray(txs)) {
            txs.forEach((tx: Transaction) => {
              allTxs.push({ ...tx, cardLast4: card.last4 || '????' });
            });
          }
        } catch {
          // skip
        }
      }
      allTxs.sort((a, b) => (b.transactionTime || 0) - (a.transactionTime || 0));
      setTransactions(allTxs.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cards]);

  useEffect(() => {
    if (cards.length > 0) {
      loadTransactions();
    } else {
      setLoading(false);
    }
  }, [cards, loadTransactions]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map(i => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a] py-8 text-center">
        <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-white/[0.03] blur-2xl" />
        <p className="relative z-10 text-sm text-zinc-500">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a]">
      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl" />
      <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-primary/[0.04] blur-xl" />
      {transactions.map((tx, i) => {
        const { icon, cls } = getTxIcon(tx);
        return (
          <div
            key={tx.transactionId || i}
            className={`relative z-10 flex items-center px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
          >
            <div className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {tx.merchantName || tx.description || tx.type || 'Transaction'}
              </p>
            </div>
            <div className="ml-3 text-right">
              <p className={`font-mono text-sm font-bold ${(tx.amount || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(tx.amount || 0) > 0 ? '+' : '-'}${Math.abs(tx.amount || 0).toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-600">{formatRelativeTime(tx.transactionTime || 0)}</p>
            </div>
          </div>
        );
      })}

      <button
        onClick={onViewAll}
        className="relative z-10 flex w-full items-center justify-center gap-1 border-t border-white/[0.04] py-3 text-xs font-semibold text-zinc-500 transition-colors active:bg-white/[0.03] active:scale-[0.98]"
      >
        View All <ChevronRight size={14} />
      </button>
    </div>
  );
}
