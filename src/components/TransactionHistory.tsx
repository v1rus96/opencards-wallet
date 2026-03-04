'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ClipboardList } from 'lucide-react';
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
  hideFilter?: boolean;
}

export function TransactionHistory({ cards, hideFilter = false }: Props) {
  const [transactions, setTransactions] = useState<(Transaction & { cardLast4: string })[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('all');
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
      setTransactions(allTxs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cards]);

  useEffect(() => {
    if (cards.length > 0) loadTransactions();
  }, [cards, loadTransactions]);

  const filtered = selectedCard === 'all'
    ? transactions
    : transactions.filter(tx => tx.cardLast4 === selectedCard);

  const uniqueCards = [...new Set(cards.map(c => c.last4).filter(Boolean))];

  const getTxIcon = (tx: Transaction) => {
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
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts > 1e12 ? ts : ts * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Card filter pills */}
      {!hideFilter && uniqueCards.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCard('all')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${selectedCard === 'all'
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
          >
            All
          </button>
          {uniqueCards.map(last4 => (
            <button
              key={last4}
              onClick={() => setSelectedCard(last4!)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${selectedCard === last4
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
            >
              •{last4}
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
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList size={32} className="mx-auto text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx, i) => {
            const { icon, cls } = getTxIcon(tx);
            return (
              <div
                key={tx.transactionId || i}
                className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
              >
                <div className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${cls}`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {tx.merchantName || tx.description || tx.type || 'Transaction'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    •{tx.cardLast4} · {formatTime(tx.transactionTime || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-bold ${(tx.amount || 0) > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    {(tx.amount || 0) > 0 ? '+' : '-'}${Math.abs(tx.amount || 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-zinc-500">{tx.status || 'completed'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
