'use client';

import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { NetworkSolana, NetworkEthereum } from '@web3icons/react';
import { getAddresses } from '@/lib/api';

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text);
  const wa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (t: string) => void }; showAlert?: (m: string) => void } } }).Telegram?.WebApp;
  wa?.HapticFeedback?.notificationOccurred('success');
  wa?.showAlert?.(`Copied: ${text.slice(0, 8)}...${text.slice(-6)}`);
}

export function AddressBar() {
  const [addresses, setAddresses] = useState({ sol: '', evm: '' });

  useEffect(() => {
    getAddresses().then(setAddresses);
  }, []);

  const entries = [
    { label: 'SOL', addr: addresses.sol, icon: <NetworkSolana size={18} variant="mono" /> },
    { label: 'EVM', addr: addresses.evm, icon: <NetworkEthereum size={18} variant="mono" /> },
  ].filter(e => e.addr); // Only show addresses that exist

  if (entries.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#0e0e0e] to-[#0a0a0a]">
      <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-primary/[0.04] blur-2xl" />
      {entries.map(({ label, addr, icon }, i) => (
        <button
          key={label}
          onClick={() => copyToClipboard(addr)}
          className={`relative z-10 flex w-full items-center px-4 py-3.5 transition-all active:bg-white/[0.03] ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
        >
          <span className="mr-3">{icon}</span>
          <span className="mr-2 text-xs font-bold text-primary">{label}</span>
          <span className="flex-1 truncate font-mono text-xs text-zinc-500">
            {addr.slice(0, 8)}...{addr.slice(-6)}
          </span>
          <Copy size={14} className="text-zinc-600" />
        </button>
      ))}
    </div>
  );
}
