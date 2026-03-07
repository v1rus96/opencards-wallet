'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ChevronRight, Repeat } from 'lucide-react';
import { CardOrder } from '@/types';
import { getCardTransactions, getOnchainTransactions, type OnchainTransaction } from '@/lib/api';

interface CardTransaction {
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

/** Unified transaction item for display */
interface DisplayTx {
  id: string;
  source: 'card' | 'onchain';
  label: string;
  sublabel?: string;
  amount: number;
  symbol: string;
  isPositive: boolean;
  timestamp: number;
  iconType: 'deposit' | 'withdraw' | 'send' | 'swap' | 'card' | 'freeze' | 'other';
  status?: string;
}

interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  onViewAll?: () => void;
}

function getIcon(type: DisplayTx['iconType']) {
  switch (type) {
    case 'deposit': return { icon: <ArrowDownLeft size={16} />, cls: 'bg-emerald-500/10 text-emerald-400' };
    case 'withdraw': case 'send': return { icon: <ArrowUpRight size={16} />, cls: 'bg-red-500/10 text-red-400' };
    case 'swap': return { icon: <Repeat size={16} />, cls: 'bg-purple-500/10 text-purple-400' };
    case 'card': return { icon: <CreditCard size={16} />, cls: 'bg-primary/10 text-primary' };
    case 'freeze': return { icon: <Snowflake size={16} />, cls: 'bg-blue-500/10 text-blue-400' };
    default: return { icon: <CircleDot size={16} />, cls: 'bg-zinc-500/10 text-zinc-400' };
  }
}

function classifyCardTx(type: string): DisplayTx['iconType'] {
  const t = type.toLowerCase();
  if (t.includes('deposit') || t.includes('recharge')) return 'deposit';
  if (t.includes('withdraw') || t.includes('spend') || t.includes('purchase')) return 'withdraw';
  if (t.includes('create') || t.includes('open')) return 'card';
  if (t.includes('freeze')) return 'freeze';
  return 'other';
}

function classifyOnchainTx(type: string): DisplayTx['iconType'] {
  const t = type.toLowerCase();
  if (t.includes('send')) return 'send';
  if (t.includes('swap')) return 'swap';
  if (t.includes('receive') || t.includes('deposit')) return 'deposit';
  return 'send';
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

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function RecentActivity({ cards, onViewAll }: Props) {
  const [transactions, setTransactions] = useState<DisplayTx[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const all: DisplayTx[] = [];

      // Fetch card transactions
      const cardTxPromises = cards.map(async (card) => {
        try {
          const txs = await getCardTransactions(card.id);
          if (Array.isArray(txs)) {
            return txs.map((tx: CardTransaction) => ({
              id: tx.transactionId || `card-${card.id}-${tx.transactionTime}`,
              source: 'card' as const,
              label: tx.merchantName || tx.description || tx.type || 'Card Transaction',
              sublabel: `•••• ${card.last4 || '????'}`,
              amount: Math.abs(tx.amount || 0),
              symbol: 'USD',
              isPositive: (tx.amount || 0) > 0,
              timestamp: tx.transactionTime || 0,
              iconType: classifyCardTx(tx.type || ''),
              status: tx.status,
            }));
          }
          return [];
        } catch {
          return [];
        }
      });

      // Fetch onchain transactions
      const onchainPromise = getOnchainTransactions(10, { sync: true }).then(txs =>
        txs.map((rawTx: OnchainTransaction) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tx = rawTx as any;
          // Flexible field access — API may use different casing/naming
          const type = tx.type || tx.transaction_type || 'send';
          const token = tx.token || tx.currency || tx.symbol || '';
          const to = tx.to || tx.to_address || tx.destination || '';
          const network = tx.network || '';
          const amount = tx.amount ?? 0;
          const createdAt = tx.created_at || tx.createdAt || tx.timestamp || '';
          const ts = createdAt ? new Date(createdAt as string).getTime() : 0;

          const typeStr = String(type).toLowerCase();
          const label = typeStr === 'send'
            ? `Sent ${token}`
            : typeStr === 'swap'
              ? `Swap ${token}`
              : `${type} ${token}`;

          return {
            id: tx.id || String(Math.random()),
            source: 'onchain' as const,
            label: label.trim() || 'Transaction',
            sublabel: to ? `→ ${shortenAddress(String(to))}` : network || undefined,
            amount: typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0,
            symbol: String(token) || '',
            isPositive: typeStr !== 'send',
            timestamp: isNaN(ts) ? 0 : ts,
            iconType: classifyOnchainTx(typeStr),
            status: tx.status || '',
          };
        })
      ).catch(() => [] as DisplayTx[]);

      const [cardResults, onchainTxs] = await Promise.all([
        Promise.all(cardTxPromises),
        onchainPromise,
      ]);

      cardResults.forEach(txs => all.push(...txs));
      all.push(...onchainTxs);

      // Sort by timestamp descending, take top 5
      all.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(all.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cards]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
        const { icon, cls } = getIcon(tx.iconType);
        const isPending = tx.status === 'pending_approval' || tx.status === 'pending';
        return (
          <div
            key={tx.id}
            className={`relative z-10 flex items-center px-4 py-3 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
          >
            <div className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {tx.label}
              </p>
              {tx.sublabel && (
                <p className="truncate text-[11px] text-zinc-600">{tx.sublabel}</p>
              )}
            </div>
            <div className="ml-3 text-right">
              <p className={`font-mono text-sm font-bold ${
                isPending ? 'text-amber-400' :
                tx.isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {tx.isPositive ? '+' : '-'}{tx.amount.toFixed(2)} {tx.symbol !== 'USD' ? tx.symbol : ''}
              </p>
              <p className="text-[11px] text-zinc-600">
                {isPending ? 'pending' : formatRelativeTime(tx.timestamp)}
              </p>
            </div>
          </div>
        );
      })}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="relative z-10 flex w-full items-center justify-center gap-1 border-t border-white/[0.04] py-3 text-xs font-semibold text-zinc-500 transition-colors active:bg-white/[0.03] active:scale-[0.98]"
        >
          View All <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
