'use client';

import { Wallet } from 'lucide-react';

export function BalanceHero({ amount, loading }: { amount: number; loading: boolean }) {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [whole, decimal] = formatted.split('.');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-zinc-900 to-zinc-800 p-7 text-center">
      <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-[radial-gradient(circle_at_30%_50%,rgba(45,212,191,0.12),transparent_60%)]" />
      <div className="relative mb-2 flex items-center justify-center gap-2">
        <Wallet size={14} className="text-zinc-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Total Portfolio
        </p>
      </div>
      <div className="relative">
        {loading ? (
          <div className="mx-auto h-12 w-40 animate-pulse rounded-lg bg-zinc-700" />
        ) : (
          <p className="text-[44px] font-extrabold leading-none tracking-tight text-white">
            <span className="text-xl text-zinc-500">$</span>
            {whole}
            <span className="text-xl text-zinc-500">.{decimal}</span>
          </p>
        )}
      </div>
    </div>
  );
}
