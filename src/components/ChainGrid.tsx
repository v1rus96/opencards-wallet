'use client';

import { ChainBalance } from '@/types';
import { NetworkEthereum, NetworkSolana, TokenUSDC } from '@web3icons/react';

const CHAIN_ICONS: Record<string, React.ReactNode> = {
  'Base (Sepolia)': <NetworkEthereum size={28} variant="mono" />,
  'Solana (Devnet)': <NetworkSolana size={28} variant="mono" />,
  'USDC (Base)': <TokenUSDC size={28} variant="mono" />,
  'USDC (Solana)': <TokenUSDC size={28} variant="mono" />,
};

export function ChainGrid({ chains, loading, horizontal = false, onChainSelect }: { chains: ChainBalance[]; loading: boolean; horizontal?: boolean; onChainSelect?: (chain: ChainBalance) => void }) {
  if (loading) {
    if (horizontal) {
      return (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[88px] w-[120px] shrink-0 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {chains.map((c, i) => (
          <button
            key={c.chain}
            onClick={() => onChainSelect?.(c)}
            className="relative shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a] p-3.5 text-left transition-all active:scale-[0.97]"
            style={{ minWidth: 130 }}
          >
            <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/[0.03] blur-2xl" />
            {i === 0 && <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-primary/[0.06] blur-2xl" />}
            <div className="relative z-10 mb-2">
              {CHAIN_ICONS[c.chain] || <span className="text-2xl">{c.icon}</span>}
            </div>
            <p className="relative z-10 text-[11px] font-medium text-zinc-500">{c.chain.split(' ')[0]}</p>
            <p className="relative z-10 mt-0.5 font-mono text-sm font-bold text-white">
              {c.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
              <span className="font-sans text-[10px] font-medium text-zinc-500">{c.symbol}</span>
            </p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {chains.map((c) => (
        <button
          key={c.chain}
          onClick={() => onChainSelect?.(c)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all active:scale-[0.97]"
        >
          <div className="mb-2">
            {CHAIN_ICONS[c.chain] || <span className="text-2xl">{c.icon}</span>}
          </div>
          <p className="text-[11px] font-medium text-zinc-500">{c.chain}</p>
          <p className="mt-1 font-mono text-base font-bold text-white">
            {c.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
            <span className="font-sans text-xs font-medium text-zinc-500">{c.symbol}</span>
          </p>
        </button>
      ))}
    </div>
  );
}
