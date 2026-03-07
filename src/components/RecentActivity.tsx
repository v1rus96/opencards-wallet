'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ChevronRight, Repeat, ShieldCheck } from 'lucide-react';
import { CardOrder } from '@/types';
import { getAllCardTransactions, getOnchainTransactions, type CardTransaction, type OnchainTransaction } from '@/lib/api';
import type { TxDetailData } from './TransactionDetail';

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
  iconType: 'deposit' | 'withdraw' | 'send' | 'swap' | 'card' | 'freeze' | 'unfreeze' | 'receive' | 'other';
  status?: string;
  // Detail fields
  card_last4?: string;
  fee?: number;
  type?: string;
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  network?: string;
  memo?: string;
}

interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  onViewAll?: () => void;
  onTxSelect?: (tx: TxDetailData) => void;
  refreshKey?: number; // bump to force re-fetch (e.g. from realtime events)
}

function getIcon(type: DisplayTx['iconType']) {
  switch (type) {
    case 'deposit': case 'receive': return { icon: <ArrowDownLeft size={16} />, cls: 'bg-emerald-500/10 text-emerald-400' };
    case 'withdraw': case 'send': return { icon: <ArrowUpRight size={16} />, cls: 'bg-red-500/10 text-red-400' };
    case 'swap': return { icon: <Repeat size={16} />, cls: 'bg-purple-500/10 text-purple-400' };
    case 'card': return { icon: <CreditCard size={16} />, cls: 'bg-primary/10 text-primary' };
    case 'freeze': return { icon: <Snowflake size={16} />, cls: 'bg-blue-500/10 text-blue-400' };
    case 'unfreeze': return { icon: <ShieldCheck size={16} />, cls: 'bg-green-500/10 text-green-400' };
    default: return { icon: <CircleDot size={16} />, cls: 'bg-zinc-500/10 text-zinc-400' };
  }
}

function classifyCardTxType(type: string): DisplayTx['iconType'] {
  const t = type.toLowerCase();
  if (t.includes('card_create') || t.includes('create') || t.includes('open') || t === 'bindding') return 'card';
  if (t.includes('deposit') || t.includes('recharge')) return 'deposit';
  if (t.includes('withdraw') || t.includes('spend') || t.includes('purchase')) return 'withdraw';
  if (t === 'freeze') return 'freeze';
  if (t === 'unfreeze') return 'unfreeze';
  return 'other';
}

function classifyOnchainType(type: string): DisplayTx['iconType'] {
  const t = type.toLowerCase();
  if (t === 'receive') return 'receive';
  if (t === 'swap') return 'swap';
  return 'send';
}

function labelForCardTx(tx: CardTransaction): string {
  const t = (tx.type || '').toLowerCase();
  if (t.includes('card_create') || t === 'bindding') return 'Card Ordered';
  if (t === 'freeze') return 'Card Frozen';
  if (t === 'unfreeze') return 'Card Unfrozen';
  if (t.includes('deposit')) return 'Deposit';
  if (t.includes('withdraw')) return 'Withdrawal';
  return tx.merchant_name || tx.type || 'Transaction';
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

export function RecentActivity({ cards, onViewAll, onTxSelect, refreshKey }: Props) {
  const [transactions, setTransactions] = useState<DisplayTx[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const all: DisplayTx[] = [];

      // Fetch ALL card transactions in one fast DB call
      const cardTxPromise = getAllCardTransactions({ limit: 20 }).then(({ transactions: txs }) =>
        txs.map((tx) => {
          const iconType = classifyCardTxType(tx.type);
          const isPositive = iconType === 'deposit' || iconType === 'card';
          const ts = tx.transaction_time
            ? new Date(tx.transaction_time).getTime()
            : new Date(tx.created_at).getTime();
          return {
            id: tx.id,
            source: 'card' as const,
            label: labelForCardTx(tx),
            sublabel: `•••• ${tx.card_last4}`,
            amount: Math.abs(tx.amount || 0),
            symbol: 'USD',
            isPositive,
            timestamp: ts,
            iconType,
            status: tx.status,
            card_last4: tx.card_last4,
            fee: tx.fee,
            type: tx.type,
          };
        })
      ).catch(() => [] as DisplayTx[]);

      // Fetch onchain transactions
      const onchainPromise = getOnchainTransactions(10, { sync: true, network: 'solana-devnet' }).then(txs =>
        txs.map((tx: OnchainTransaction) => {
          const type = (tx.type || 'send').toLowerCase();
          const token = tx.token_symbol || tx.token || '';
          const to = tx.to_address || tx.to || '';
          const from = tx.from_address || tx.from || '';
          const amount = tx.amount || 0;
          const ts = tx.created_at ? new Date(tx.created_at).getTime() : 0;
          const iconType = classifyOnchainType(type);

          const label = type === 'send' ? `Sent ${token}`
            : type === 'swap' ? `Swap ${token}`
            : type === 'receive' ? `Received ${token}`
            : `${type} ${token}`;

          return {
            id: tx.id,
            source: 'onchain' as const,
            label: label.trim() || 'Transaction',
            sublabel: type === 'receive'
              ? `← ${shortenAddress(from)}`
              : to ? `→ ${shortenAddress(to)}` : tx.network || '',
            amount,
            symbol: token,
            isPositive: type === 'receive',
            timestamp: isNaN(ts) ? 0 : ts,
            iconType,
            status: tx.status || '',
            tx_hash: tx.tx_hash || '',
            from_address: from,
            to_address: to,
            network: tx.network || '',
            memo: tx.memo || '',
            type: type,
          };
        })
      ).catch(() => [] as DisplayTx[]);

      const [cardTxs, onchainTxs] = await Promise.all([cardTxPromise, onchainPromise]);
      all.push(...cardTxs, ...onchainTxs);

      // Sort by timestamp descending, take top 5
      all.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(all.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Re-fetch when cards change or refreshKey bumps (realtime events)
  useEffect(() => {
    if (cards.length > 0 || refreshKey) loadTransactions();
  }, [cards.length, refreshKey, loadTransactions]);

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
        const isPending = tx.status === 'pending_approval' || tx.status === 'pending' || tx.status === 'processing';
        return (
          <div
            key={tx.id}
            onClick={() => onTxSelect?.(tx as TxDetailData)}
            className={`relative z-10 flex items-center px-4 py-3 cursor-pointer transition-colors active:bg-white/[0.03] ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
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
              {tx.amount > 0 && (
                <p className={`font-mono text-sm font-bold ${
                  isPending ? 'text-amber-400' :
                  tx.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {tx.isPositive ? '+' : '-'}{tx.amount.toFixed(2)} {tx.symbol !== 'USD' ? tx.symbol : ''}
                </p>
              )}
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
