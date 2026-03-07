'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, CircleDot, ClipboardList, ShieldCheck } from 'lucide-react';
import { CardOrder } from '@/types';
import { getAllCardTransactions, type CardTransaction } from '@/lib/api';
import { TransactionDetail, type TxDetailData } from './TransactionDetail';

interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  hideFilter?: boolean;
}

export function TransactionHistory({ cards, hideFilter = false }: Props) {
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<CardTransaction | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // When hideFilter is true (single card view), use the first card's ID directly
      let cardId: string | undefined;
      if (hideFilter && cards.length === 1) {
        cardId = cards[0].id;
      } else if (selectedCard !== 'all') {
        cardId = cards.find(c => c.last4 === selectedCard)?.id;
      }
      const { transactions: txs } = await getAllCardTransactions({
        cardId,
        limit: 100,
      });
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cards, selectedCard, hideFilter]);

  useEffect(() => {
    if (cards.length > 0) loadTransactions();
  }, [cards, loadTransactions]);

  const uniqueCards = [...new Set(cards.map(c => c.last4).filter(Boolean))];

  const getTxIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('deposit') || t.includes('recharge'))
      return { icon: <ArrowDownLeft size={16} />, cls: 'bg-emerald-500/10 text-emerald-400' };
    if (t.includes('withdraw') || t.includes('spend') || t.includes('purchase'))
      return { icon: <ArrowUpRight size={16} />, cls: 'bg-red-500/10 text-red-400' };
    if (t.includes('card_create') || t.includes('create') || t.includes('open') || t === 'bindding')
      return { icon: <CreditCard size={16} />, cls: 'bg-primary/10 text-primary' };
    if (t.includes('freeze'))
      return { icon: <Snowflake size={16} />, cls: 'bg-blue-500/10 text-blue-400' };
    if (t.includes('unfreeze'))
      return { icon: <ShieldCheck size={16} />, cls: 'bg-green-500/10 text-green-400' };
    return { icon: <CircleDot size={16} />, cls: 'bg-zinc-500/10 text-zinc-400' };
  };

  const labelForType = (tx: CardTransaction): string => {
    const t = (tx.type || '').toLowerCase();
    if (t.includes('card_create') || t === 'bindding') return 'Card Ordered';
    if (t === 'freeze') return 'Card Frozen';
    if (t === 'unfreeze') return 'Card Unfrozen';
    if (t.includes('deposit')) return 'Deposit';
    if (t.includes('withdraw')) return 'Withdrawal';
    return tx.merchant_name || tx.type || 'Transaction';
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return '';
    const d = new Date(ts);
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
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center">
          <ClipboardList size={32} className="mx-auto text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const { icon, cls } = getTxIcon(tx.type);
            const isPending = tx.status === 'pending' || tx.status === 'processing';
            const isPositive = tx.type.toLowerCase().includes('deposit') || tx.type.toLowerCase().includes('card_create');
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 cursor-pointer transition-colors active:bg-zinc-800"
              >
                <div className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${cls}`}>
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {labelForType(tx)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    •{tx.card_last4} · {formatTime(tx.transaction_time || tx.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  {tx.amount > 0 && (
                    <p className={`font-mono text-sm font-bold ${
                      isPending ? 'text-amber-400' :
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isPositive ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-500">
                    {isPending ? 'processing' : tx.status || 'completed'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction detail sheet */}
      {selectedTx && (
        <TransactionDetail
          tx={{
            id: selectedTx.id,
            source: 'card',
            label: labelForType(selectedTx),
            sublabel: `•••• ${selectedTx.card_last4}`,
            amount: Math.abs(selectedTx.amount),
            symbol: 'USD',
            isPositive: selectedTx.type.toLowerCase().includes('deposit') || selectedTx.type.toLowerCase().includes('card_create'),
            timestamp: selectedTx.transaction_time ? new Date(selectedTx.transaction_time).getTime() : new Date(selectedTx.created_at).getTime(),
            iconType: (() => { const t = selectedTx.type.toLowerCase(); if (t.includes('card_create')) return 'card'; if (t.includes('deposit')) return 'deposit'; if (t.includes('withdraw')) return 'withdraw'; if (t === 'freeze') return 'freeze'; if (t === 'unfreeze') return 'unfreeze'; return 'other'; })(),
            status: selectedTx.status,
            card_last4: selectedTx.card_last4,
            fee: selectedTx.fee,
            type: selectedTx.type,
          } as TxDetailData}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
