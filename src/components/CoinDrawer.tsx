'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, ArrowUpRight, ArrowDownLeft, X, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { NetworkSolana, NetworkEthereum, TokenUSDC } from '@web3icons/react';
import QRCode from 'react-qr-code';
import { ChainBalance } from '@/types';
import { DrawerAction } from '@/components/DepositCard';
import { sendTokens, type SendTokensResult } from '@/lib/api';

interface Props {
  chain: ChainBalance | null;
  address: string;
  onBack: () => void;
  onSuccess?: () => void;
  onActionButton?: (action: DrawerAction | null) => void;
}

type Tab = 'receive' | 'send';
type SendStep = 'form' | 'processing' | 'success' | 'pending' | 'error';

const CHAIN_ICONS: Record<string, React.ReactNode> = {
  'Base (Sepolia)': <NetworkEthereum size={24} variant="mono" />,
  'Solana (Devnet)': <NetworkSolana size={24} variant="mono" />,
  'USDC (Base)': <TokenUSDC size={24} variant="mono" />,
  'USDC (Solana)': <TokenUSDC size={24} variant="mono" />,
};

/** Map our chain display names to API token + network */
function chainToApi(chainName: string): { token: string; network: string } {
  if (chainName === 'USDC (Solana)') return { token: 'USDC', network: 'solana-devnet' };
  if (chainName === 'USDC (Base)') return { token: 'USDC', network: 'base-sepolia' };
  if (chainName === 'Solana (Devnet)') return { token: 'SOL', network: 'solana-devnet' };
  if (chainName === 'Base (Sepolia)') return { token: 'ETH', network: 'base-sepolia' };
  return { token: 'USDC', network: 'solana-devnet' };
}

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

export function CoinDrawer({ chain, address, onBack, onSuccess, onActionButton }: Props) {
  const [tab, setTab] = useState<Tab>('receive');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendStep, setSendStep] = useState<SendStep>('form');
  const [sendResult, setSendResult] = useState<SendTokensResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    copyToClipboard(address);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [address]);

  const handleSend = useCallback(async () => {
    if (!chain || !sendAddress || !sendAmount) return;
    const { token, network } = chainToApi(chain.chain);
    setSendStep('processing');
    try {
      const result = await sendTokens({
        to: sendAddress,
        amount: parseFloat(sendAmount),
        token,
        network,
      });
      setSendResult(result);
      if (result.status === 'pending_approval') {
        setSendStep('pending');
      } else if (result.success) {
        setSendStep('success');
        haptic('medium');
        onSuccess?.();
      } else {
        setSendStep('error');
      }
    } catch (err) {
      setSendResult({ success: false, error: (err as Error).message });
      setSendStep('error');
    }
  }, [chain, sendAddress, sendAmount, onSuccess]);

  const resetSend = useCallback(() => {
    setSendStep('form');
    setSendResult(null);
    setSendAddress('');
    setSendAmount('');
  }, []);

  // CTA button logic
  const performRef = useRef<() => void>(() => {});
  if (tab === 'receive') {
    performRef.current = handleCopy;
  } else if (sendStep === 'form') {
    performRef.current = handleSend;
  } else if (sendStep === 'success' || sendStep === 'pending') {
    performRef.current = () => { resetSend(); onBack(); };
  } else if (sendStep === 'error') {
    performRef.current = () => setSendStep('form');
  } else {
    performRef.current = () => {};
  }

  useEffect(() => {
    if (!onActionButton) return;

    if (tab === 'receive') {
      onActionButton({
        label: copied ? 'Copied!' : 'Copy Address',
        disabled: false,
        perform: () => performRef.current(),
        onBack,
      });
    } else if (sendStep === 'form') {
      onActionButton({
        label: 'Send',
        disabled: !sendAddress || !sendAmount || parseFloat(sendAmount) <= 0,
        perform: () => performRef.current(),
        onBack,
      });
    } else if (sendStep === 'processing') {
      onActionButton(null);
    } else if (sendStep === 'success') {
      onActionButton({
        label: 'Done',
        disabled: false,
        perform: () => performRef.current(),
        onBack: undefined,
      });
    } else if (sendStep === 'pending') {
      onActionButton({
        label: 'Done',
        disabled: false,
        perform: () => performRef.current(),
        onBack: undefined,
      });
    } else if (sendStep === 'error') {
      onActionButton({
        label: 'Try Again',
        disabled: false,
        perform: () => performRef.current(),
        onBack,
      });
    }

    return () => onActionButton(null);
  }, [tab, onActionButton, sendAddress, sendAmount, copied, onBack, sendStep]);

  if (!chain) return null;

  const icon = CHAIN_ICONS[chain.chain] || <span className="text-xl">{chain.icon}</span>;
  const chainName = chain.chain.split(' ')[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
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
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tab pills — hide during send processing/result */}
      {(tab === 'receive' || sendStep === 'form') && (
        <div className="mb-6 flex gap-1 rounded-full border border-white/[0.06] bg-zinc-900 p-1">
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
      )}

      {/* Receive tab */}
      {tab === 'receive' && (
        <div className="animate-fadeIn">
          <div className="mx-auto mb-5 flex w-fit rounded-2xl border border-white/[0.06] bg-white p-4">
            <QRCode value={address || ' '} size={180} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>

          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {chainName} Address
          </p>

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
        <>
          {/* Form */}
          {sendStep === 'form' && (
            <div className="animate-fadeIn">
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

              {parseFloat(sendAmount || '0') > chain.balance && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400">
                  Insufficient balance
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {sendStep === 'processing' && (
            <div className="animate-fadeIn py-12 text-center">
              <Loader2 size={40} className="mx-auto animate-spin text-primary" />
              <p className="mt-4 text-sm font-semibold text-white">Sending {chain.symbol}...</p>
              <p className="mt-1 text-xs text-zinc-500">Signing & broadcasting transaction</p>
            </div>
          )}

          {/* Success */}
          {sendStep === 'success' && (
            <div className="animate-fadeIn py-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
              <p className="mt-4 text-lg font-bold text-white">Sent!</p>
              <p className="mt-1 text-sm text-zinc-400">{sendResult?.message}</p>
              {sendResult?.tx_hash && (
                <p className="mt-2 font-mono text-[11px] text-zinc-600 break-all px-4">
                  {sendResult.tx_hash}
                </p>
              )}
            </div>
          )}

          {/* Pending Approval */}
          {sendStep === 'pending' && (
            <div className="animate-fadeIn py-12 text-center">
              <Clock size={48} className="mx-auto text-amber-400" />
              <p className="mt-4 text-lg font-bold text-white">Approval Required</p>
              <p className="mt-1 text-sm text-zinc-400">{sendResult?.reason}</p>
              <p className="mt-2 text-xs text-zinc-500">{sendResult?.message}</p>
            </div>
          )}

          {/* Error */}
          {sendStep === 'error' && (
            <div className="animate-fadeIn py-12 text-center">
              <XCircle size={48} className="mx-auto text-red-400" />
              <p className="mt-4 text-lg font-bold text-white">Send Failed</p>
              <p className="mt-1 text-sm text-zinc-400">{sendResult?.error}</p>
              {sendResult?.reason && (
                <p className="mt-1 text-xs text-zinc-500">{sendResult.reason}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
