'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ClipboardList, ShieldCheck, Repeat, Loader2 } from 'lucide-react';
import { CardOrder } from '@/types';
import { getAllCardTransactions, getOnchainTransactions, type CardTransaction, type OnchainTransaction } from '@/lib/api';
import type { TxDetailData } from './TransactionDetail';

type IconType = 'deposit' | 'withdraw' | 'send' | 'swap' | 'card' | 'freeze' | 'unfreeze' | 'receive' | 'other';
type FilterType = 'all' | 'send' | 'receive' | 'card' | 'deposit' | 'swap';

const PAGE_SIZE = 20;

interface DisplayTx {
  id: string;
  source: 'card' | 'onchain';
  label: string;
  sublabel?: string;
  amount: number;
  symbol: string;
  isPositive: boolean;
  timestamp: number;
  iconType: IconType;
  status?: string;
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
  hideFilter?: boolean;
  onTxSelect?: (tx: TxDetailData) => void;
}

function classifyCardTxType(type: string): IconType {
  const t = type.toLowerCase();
  if (t.includes('card_create') || t.includes('create') || t.includes('open') || t === 'bindding') return 'card';
  if (t.includes('deposit') || t.includes('recharge')) return 'deposit';
  if (t.includes('withdraw') || t.includes('spend') || t.includes('purchase')) return 'withdraw';
  if (t === 'freeze') return 'freeze';
  if (t === 'unfreeze') return 'unfreeze';
  return 'other';
}

function classifyOnchainType(type: string): IconType {
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

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getIcon(type: IconType) {
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

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'send', label: 'Sends' },
  { value: 'receive', label: 'Receives' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'card', label: 'Card' },
  { value: 'swap', label: 'Swaps' },
];

function matchesFilter(tx: DisplayTx, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'send') return tx.iconType === 'send' || tx.iconType === 'withdraw';
  if (filter === 'receive') return tx.iconType === 'receive';
  if (filter === 'deposit') return tx.iconType === 'deposit';
  if (filter === 'card') return tx.iconType === 'card' || tx.iconType === 'freeze' || tx.iconType === 'unfreeze';
  if (filter === 'swap') return tx.iconType === 'swap';
  return true;
}

function mapCardTx(tx: CardTransaction): DisplayTx {
  const iconType = classifyCardTxType(tx.type);
  const isPositive = iconType === 'deposit' || iconType === 'card';
  const ts = tx.transaction_time
    ? new Date(tx.transaction_time).getTime()
    : new Date(tx.created_at).getTime();
  return {
    id: tx.id,
    source: 'card',
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
}

function mapOnchainTx(tx: OnchainTransaction): DisplayTx {
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
    source: 'onchain',
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
    type,
  };
}

export function TransactionHistory({ cards, hideFilter = false, onTxSelect }: Props) {
  // allTransactions holds the full sorted list; visibleCount controls how many we render
  const [allTransactions, setAllTransactions] = useState<DisplayTx[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let cardId: string | undefined;
      if (hideFilter && cards.length === 1) {
        cardId = cards[0].id;
      }

      // Fetch first page of card txs + onchain txs in parallel
      const cardTxPromise = getAllCardTransactions({ cardId, limit: PAGE_SIZE })
        .then(({ transactions: txs }) => txs.map(mapCardTx))
        .catch(() => [] as DisplayTx[]);

      const onchainPromise = hideFilter
        ? Promise.resolve([] as DisplayTx[])
        : getOnchainTransactions(PAGE_SIZE, { sync: true, network: 'solana-devnet' })
            .then(txs => txs.map(mapOnchainTx))
            .catch(() => [] as DisplayTx[]);

      const [cardTxs, onchainTxs] = await Promise.all([cardTxPromise, onchainPromise]);
      const all = [...cardTxs, ...onchainTxs];
      all.sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(all);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cards, hideFilter]);

  // Load more card transactions when user scrolls to bottom
  const loadMore = useCallback(async () => {
    if (loadingMore) return;

    const filtered = allTransactions.filter(tx => matchesFilter(tx, selectedFilter));
    if (visibleCount >= filtered.length) {
      // We've shown everything we have locally — try fetching more from API
      setLoadingMore(true);
      try {
        let cardId: string | undefined;
        if (hideFilter && cards.length === 1) {
          cardId = cards[0].id;
        }

        const cardCount = allTransactions.filter(t => t.source === 'card').length;
        const { transactions: moreTxs } = await getAllCardTransactions({
          cardId,
          limit: PAGE_SIZE,
          offset: cardCount,
        });

        if (moreTxs.length > 0) {
          const mapped = moreTxs.map(mapCardTx);
          setAllTransactions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newOnes = mapped.filter(t => !existingIds.has(t.id));
            if (newOnes.length === 0) return prev;
            const merged = [...prev, ...newOnes];
            merged.sort((a, b) => b.timestamp - a.timestamp);
            return merged;
          });
          setVisibleCount(prev => prev + PAGE_SIZE);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMore(false);
      }
    } else {
      // We have more locally — just show next page
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
    }
  }, [allTransactions, visibleCount, selectedFilter, loadingMore, cards, hideFilter]);

  useEffect(() => {
    if (cards.length > 0) loadTransactions();
  }, [cards, loadTransactions]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadMore]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedFilter]);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = allTransactions.filter(tx => matchesFilter(tx, selectedFilter));
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length || allTransactions.filter(t => t.source === 'card').length % PAGE_SIZE === 0;

  return (
    <div>
      {/* Type filter pills */}
      {!hideFilter && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedFilter(opt.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${selectedFilter === opt.value
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList size={32} className="mx-auto text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((tx) => {
            const { icon, cls } = getIcon(tx.iconType);
            const isPending = tx.status === 'pending_approval' || tx.status === 'pending' || tx.status === 'processing';
            return (
              <div
                key={tx.id}
                onClick={() => onTxSelect?.(tx as TxDetailData)}
                className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 cursor-pointer transition-colors active:bg-zinc-800"
              >
                <div className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${cls}`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {tx.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {tx.sublabel} · {formatTime(tx.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  {tx.amount > 0 && (
                    <p className={`font-mono text-sm font-bold ${
                      isPending ? 'text-amber-400' :
                      tx.isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.isPositive ? '+' : '-'}{tx.amount.toFixed(2)} {tx.symbol !== 'USD' ? tx.symbol : ''}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500">
                    {isPending ? 'pending' : tx.status || 'completed'}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Scroll sentinel + loading indicator */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {loadingMore && <Loader2 size={20} className="animate-spin text-zinc-500" />}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
