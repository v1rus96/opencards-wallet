'use client';

import { ChainBalance } from '@/types';
import { NetworkEthereum, NetworkSolana, TokenUSDC } from '@web3icons/react';

const CHAIN_ICONS: Record<string, React.ReactNode> = {
  'Base (Sepolia)': <NetworkEthereum size={28} variant="mono" />,
  'Solana (Devnet)': <NetworkSolana size={28} variant="mono" />,
  'USDC (Base)': <TokenUSDC size={28} variant="mono" />,
  'USDC (Solana)': <TokenUSDC size={28} variant="mono" />,
};

export function ChainGrid({ chains, loading }: { chains: ChainBalance[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {chains.map((c) => (
        <div
          key={c.chain}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all active:scale-[0.97]"
        >
          <div className="mb-2">
            {CHAIN_ICONS[c.chain] || <span className="text-2xl">{c.icon}</span>}
          </div>
          <p className="text-[11px] font-medium text-zinc-500">{c.chain}</p>
          <p className="mt-1 text-base font-bold text-white">
            {c.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
            <span className="text-xs font-medium text-zinc-500">{c.symbol}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
