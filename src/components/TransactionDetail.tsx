'use client';

import { X, ArrowDownLeft, ArrowUpRight, CreditCard, Snowflake, Repeat, ShieldCheck, CircleDot, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

export interface TxDetailData {
  id: string;
  source: 'card' | 'onchain';
  label: string;
  sublabel?: string;
  amount: number;
  symbol: string;
  isPositive: boolean;
  timestamp: number;
  status?: string;
  iconType: string;
  // Card-specific
  card_last4?: string;
  fee?: number;
  type?: string;
  // Onchain-specific
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  network?: string;
  token_mint?: string;
  memo?: string;
}

function getIcon(type: string) {
  switch (type) {
    case 'deposit': case 'receive': return { icon: <ArrowDownLeft size={20} />, cls: 'bg-emerald-500/10 text-emerald-400' };
    case 'withdraw': case 'send': return { icon: <ArrowUpRight size={20} />, cls: 'bg-red-500/10 text-red-400' };
    case 'swap': return { icon: <Repeat size={20} />, cls: 'bg-purple-500/10 text-purple-400' };
    case 'card': return { icon: <CreditCard size={20} />, cls: 'bg-primary/10 text-primary' };
    case 'freeze': return { icon: <Snowflake size={20} />, cls: 'bg-blue-500/10 text-blue-400' };
    case 'unfreeze': return { icon: <ShieldCheck size={20} />, cls: 'bg-green-500/10 text-green-400' };
    default: return { icon: <CircleDot size={20} />, cls: 'bg-zinc-500/10 text-zinc-400' };
  }
}

function statusColor(status?: string) {
  if (!status) return 'text-zinc-400';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'confirmed' || s === 'submitted') return 'text-emerald-400';
  if (s === 'failed') return 'text-red-400';
  if (s === 'pending' || s === 'processing' || s === 'pending_approval') return 'text-amber-400';
  return 'text-zinc-400';
}

function formatTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function shortenAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr || '';
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    try { (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (t: string) => void } } } }).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch { /* */ }
  }, [text]);
  return (
    <button onClick={copy} className="ml-1.5 p-1 rounded hover:bg-white/5 transition">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-zinc-500" />}
    </button>
  );
}

function explorerUrl(tx: TxDetailData): string | null {
  if (!tx.tx_hash) return null;
  const network = tx.network || '';
  if (network.includes('solana')) {
    const cluster = network.includes('mainnet') ? '' : '?cluster=devnet';
    return `https://solscan.io/tx/${tx.tx_hash}${cluster}`;
  }
  if (network.includes('base-sepolia')) return `https://sepolia.basescan.org/tx/${tx.tx_hash}`;
  if (network.includes('base')) return `https://basescan.org/tx/${tx.tx_hash}`;
  return null;
}

interface Props {
  tx: TxDetailData;
  onClose: () => void;
}

export function TransactionDetail({ tx, onClose }: Props) {
  const { icon, cls } = getIcon(tx.iconType);
  const explorer = explorerUrl(tx);

  const rows: { label: string; value: string; copyable?: boolean }[] = [];

  rows.push({ label: 'Status', value: tx.status || 'unknown' });
  rows.push({ label: 'Date', value: formatTime(tx.timestamp) });

  if (tx.source === 'card') {
    if (tx.card_last4) rows.push({ label: 'Card', value: `•••• ${tx.card_last4}` });
    if (tx.type) rows.push({ label: 'Type', value: tx.type });
    if (tx.fee && tx.fee > 0) rows.push({ label: 'Fee', value: `$${tx.fee.toFixed(2)}` });
  }

  if (tx.source === 'onchain') {
    if (tx.network) rows.push({ label: 'Network', value: tx.network });
    if (tx.from_address) rows.push({ label: 'From', value: shortenAddr(tx.from_address), copyable: true });
    if (tx.to_address) rows.push({ label: 'To', value: shortenAddr(tx.to_address), copyable: true });
    if (tx.tx_hash) rows.push({ label: 'Tx Hash', value: shortenAddr(tx.tx_hash), copyable: true });
    if (tx.memo) rows.push({ label: 'Memo', value: tx.memo });
  }

  rows.push({ label: 'ID', value: tx.id.slice(0, 8) + '...', copyable: true });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl border-t border-white/[0.08] bg-zinc-950 px-5 pb-8 pt-4 animate-slideUp"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

        {/* Close */}
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/5">
          <X size={18} className="text-zinc-500" />
        </button>

        {/* Icon + Amount */}
        <div className="flex flex-col items-center mb-6">
          <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${cls}`}>
            {icon}
          </div>
          <p className="text-lg font-semibold text-white">{tx.label}</p>
          {tx.sublabel && <p className="text-sm text-zinc-500">{tx.sublabel}</p>}
          <p className={`mt-2 font-mono text-3xl font-bold ${tx.isPositive ? 'text-emerald-400' : tx.amount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
            {tx.amount > 0 && (tx.isPositive ? '+' : '-')}{tx.amount > 0 ? tx.amount.toFixed(tx.symbol === 'USD' ? 2 : 6) : ''} {tx.symbol !== 'USD' ? tx.symbol : tx.amount > 0 ? '' : ''}
            {tx.amount > 0 && tx.symbol === 'USD' && ' USD'}
          </p>
        </div>

        {/* Detail rows */}
        <div className="space-y-0 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {rows.map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-zinc-800' : ''}`}>
              <span className="text-sm text-zinc-500">{row.label}</span>
              <span className="flex items-center">
                <span className={`text-sm font-medium ${row.label === 'Status' ? statusColor(row.value) : 'text-white'}`}>
                  {row.value}
                </span>
                {row.copyable && (
                  <CopyButton text={
                    row.label === 'From' ? (tx.from_address || '') :
                    row.label === 'To' ? (tx.to_address || '') :
                    row.label === 'Tx Hash' ? (tx.tx_hash || '') :
                    row.label === 'ID' ? tx.id : row.value
                  } />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Explorer link */}
        {explorer && (
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-medium text-primary transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            View on Explorer <ExternalLink size={14} />
          </a>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>
    </div>
  );
}
