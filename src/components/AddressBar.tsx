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
    <div className="space-y-2">
      {entries.map(({ label, addr, icon }) => (
        <button
          key={label}
          onClick={() => copyToClipboard(addr)}
          className="flex w-full items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-all active:scale-[0.98]"
        >
          <span className="mr-3">{icon}</span>
          <span className="mr-2 text-xs font-bold text-teal-400">{label}</span>
          <span className="flex-1 truncate font-mono text-xs text-zinc-500">
            {addr.slice(0, 8)}...{addr.slice(-6)}
          </span>
          <Copy size={14} className="text-zinc-600" />
        </button>
      ))}
    </div>
  );
}
