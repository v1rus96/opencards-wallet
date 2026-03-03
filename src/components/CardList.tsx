'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, CreditCard, ArrowDownLeft } from 'lucide-react';
import { CardOrder, CardSensitive } from '@/types';
import { getCardSensitive } from '@/lib/api';

interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  loading: boolean;
  onDeposit?: (card: CardOrder & { liveBalance: number }) => void;
}

function CardVisual({
  card,
  onDeposit,
}: {
  card: CardOrder & { liveBalance: number };
  onDeposit?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [sensitive, setSensitive] = useState<CardSensitive | null>(null);
  const [revealing, setRevealing] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    setRevealing(true);
    try {
      const data = await getCardSensitive(card.id);
      setSensitive(data);
      setRevealed(true);
    } catch (err) {
      console.error('Failed to reveal card:', err);
    } finally {
      setRevealing(false);
    }
  };

  const formatPan = (pan: string) => pan.replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-500/15 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6">
      <div className="absolute -top-[30%] -right-[20%] h-[200px] w-[200px] bg-[radial-gradient(circle,rgba(45,212,191,0.12),transparent_70%)]" />

      <div className="relative">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-teal-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-teal-400">
              {card.brand || 'Mastercard'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDeposit && (
              <button
                onClick={onDeposit}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-700/40 bg-emerald-800/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition-all active:scale-95"
              >
                <ArrowDownLeft size={12} />
                Deposit
              </button>
            )}
            <button
              onClick={handleReveal}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-all active:scale-95"
            >
              {revealing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : revealed ? (
                <EyeOff size={12} />
              ) : (
                <Eye size={12} />
              )}
              {revealing ? '...' : revealed ? 'Hide' : 'Reveal'}
            </button>
          </div>
        </div>

        {/* Card Number */}
        <p className="mb-5 font-mono text-lg font-semibold tracking-[3px] text-white">
          {revealed && sensitive
            ? formatPan(sensitive.card_number)
            : `•••• •••• •••• ${card.last4 || '????'}`}
        </p>

        {/* Footer */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Balance</p>
            <span className="inline-block rounded-lg bg-teal-500/10 px-3 py-1 text-sm font-bold text-teal-400">
              ${card.liveBalance.toFixed(2)}
            </span>
          </div>
          {revealed && sensitive ? (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">CVV</p>
              <p className="font-mono text-sm font-semibold text-white">{sensitive.cvv}</p>
            </div>
          ) : null}
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Expires</p>
            <p className="text-sm font-semibold text-white">
              {revealed && sensitive ? sensitive.expiry : (card.expiry || '—')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardList({ cards, loading, onDeposit }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map(i => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <CreditCard size={32} className="mx-auto text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-500">No cards yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <CardVisual
          key={card.id}
          card={card}
          onDeposit={onDeposit ? () => onDeposit(card) : undefined}
        />
      ))}
    </div>
  );
}
