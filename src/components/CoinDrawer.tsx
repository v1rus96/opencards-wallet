'use client';

import { useState, useEffect } from 'react';
import { Copy, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { NetworkSolana, NetworkEthereum, TokenUSDC } from '@web3icons/react';
import QRCode from 'react-qr-code';
import { ChainBalance } from '@/types';

interface Props {
  open: boolean;
  chain: ChainBalance | null;
  address: string;
  onClose: () => void;
  onActionButton?: (action: { label: string; disabled: boolean; perform: () => void } | null) => void;
}

type Tab = 'receive' | 'send';

const CHAIN_ICONS: Record<string, React.ReactNode> = {
  'Base (Sepolia)': <NetworkEthereum size={24} variant="mono" />,
  'Solana (Devnet)': <NetworkSolana size={24} variant="mono" />,
  'USDC (Base)': <TokenUSDC size={24} variant="mono" />,
  'USDC (Solana)': <TokenUSDC size={24} variant="mono" />,
};

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text);
  const wa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (t: string) => void }; showAlert?: (m: string) => void } } }).Telegram?.WebApp;
  wa?.HapticFeedback?.notificationOccurred('success');
  wa?.showAlert?.(`Copied!`);
}

function haptic(style: string) {
  const wa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void } } } }).Telegram?.WebApp;
  wa?.HapticFeedback?.impactOccurred(style);
}

export function CoinDrawer({ open, chain, address, onClose, onActionButton }: Props) {
  const [tab, setTab] = useState<Tab>('receive');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  useEffect(() => {
    if (!onActionButton) return;
    if (open) {
      onActionButton({ label: 'Done', disabled: false, perform: onClose });
    } else {
      onActionButton(null);
    }
    return () => onActionButton(null);
  }, [open, onClose, onActionButton]);

  if (!chain) return null;

  const icon = CHAIN_ICONS[chain.chain] || <span className="text-xl">{chain.icon}</span>;
  const chainName = chain.chain.split(' ')[0];

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col justify-end transition-all duration-300 ${open ? 'visible bg-black/60' : 'invisible bg-transparent'}`}
      onClick={onClose}
    >
      <div
        className={`relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-zinc-950 px-5 pb-28 pt-5 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${open ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl">
          <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-bl from-primary/[0.07] to-transparent blur-3xl" />
        </div>

        {/* Drag handle */}
        <div className="relative z-10 mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

        {/* Header */}
        <div className="relative z-10 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <p className="text-base font-bold text-white">{chainName}</p>
              <p className="font-mono text-sm text-zinc-400">
                {chain.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {chain.symbol}
              </p>
            </div>
          </div>
          {!onActionButton && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all active:scale-90"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab pills */}
        <div className="relative z-10 mb-6 flex gap-1 rounded-full border border-white/[0.06] bg-zinc-900 p-1">
          {[
            { id: 'receive' as Tab, label: 'Receive', icon: <ArrowDownLeft size={14} /> },
            { id: 'send' as Tab, label: 'Send', icon: <ArrowUpRight size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); haptic('light'); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-500'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Receive tab */}
        {tab === 'receive' && (
          <div className="relative z-10 animate-fadeIn">
            {/* QR Code */}
            <div className="mx-auto mb-5 flex w-fit rounded-2xl border border-white/[0.06] bg-white p-4">
              <QRCode
                value={address || ' '}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>

            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {chainName} Address
            </p>

            {/* Full address + copy */}
            <button
              onClick={() => copyToClipboard(address)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-900 px-4 py-3.5 transition-all active:bg-white/[0.03]"
            >
              <span className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-zinc-300">
                {address}
              </span>
              <Copy size={16} className="shrink-0 text-zinc-500" />
            </button>

            <p className="mt-3 text-center text-[11px] text-zinc-600">
              Only send {chain.symbol} on the {chainName} network
            </p>
          </div>
        )}

        {/* Send tab */}
        {tab === 'send' && (
          <div className="relative z-10 animate-fadeIn">
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-500">Recipient Address</label>
              <input
                type="text"
                value={sendAddress}
                onChange={e => setSendAddress(e.target.value)}
                placeholder={chain.chain.includes('Solana') ? 'Solana address...' : '0x...'}
                className="w-full rounded-xl border border-white/[0.06] bg-zinc-900 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-primary/30"
              />
            </div>

            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-500">Amount</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-zinc-900 px-4 py-3">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent font-mono text-lg font-bold text-white outline-none placeholder-zinc-600"
                  min={0}
                  step="any"
                />
                <span className="text-sm font-semibold text-zinc-500">{chain.symbol}</span>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between px-1">
              <span className="text-xs text-zinc-600">Available</span>
              <button
                onClick={() => setSendAmount(String(chain.balance))}
                className="font-mono text-xs font-semibold text-primary transition-all active:opacity-70"
              >
                {chain.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {chain.symbol}
              </button>
            </div>

            <button
              onClick={() => {
                haptic('medium');
                const wa = (window as unknown as { Telegram?: { WebApp?: { showAlert?: (m: string) => void } } }).Telegram?.WebApp;
                wa?.showAlert?.('Send feature coming soon!');
              }}
              disabled={!sendAddress || !sendAmount || parseFloat(sendAmount) <= 0}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Send {chain.symbol}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
