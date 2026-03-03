'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, CheckCircle2, XCircle, Wallet, ArrowDownLeft } from 'lucide-react';
import { TokenUSDC } from '@web3icons/react';
import { getPaymentWalletBalance, depositCard } from '@/lib/payment';

import { CardOrder } from '@/types';

interface Props {
  card: CardOrder & { liveBalance: number };
  onBack: () => void;
  onSuccess: () => void;
}

type Step = 'amount' | 'confirm' | 'processing' | 'success' | 'error';

export function DepositCard({ card, onBack, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('25');
  const [walletBalance, setWalletBalance] = useState({ solana: 0, base: 0 });
  const [result, setResult] = useState<{ error?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentWalletBalance()
      .then(bal => {
        setWalletBalance({ solana: bal.solana?.usdc || 0, base: bal.base?.usdc || 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalUsdc = walletBalance.solana + walletBalance.base;
  const depositAmount = parseFloat(amount || '0');
  const canAfford = totalUsdc >= depositAmount && depositAmount > 0;

  const handleConfirm = async () => {
    setStep('processing');
    try {
      const data = await depositCard(card.id, depositAmount);
      if (data.success) {
        setResult(data);
        setStep('success');
      } else {
        setResult({ error: data.error || 'Deposit failed' });
        setStep('error');
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
      setStep('error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-zinc-400 active:text-white">
        <ChevronLeft size={16} /> Back to Cards
      </button>

      {/* Step: Amount */}
      {step === 'amount' && (
        <div className="animate-fadeIn">
          <h2 className="mb-1 text-lg font-bold">Deposit to •{card.last4}</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Current balance: ${card.liveBalance.toFixed(2)}
          </p>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-zinc-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-32 border-none bg-transparent text-center text-4xl font-extrabold text-white outline-none"
                min={1}
                autoFocus
              />
            </div>
          </div>

          <div className="mb-5 flex gap-2">
            {[10, 25, 50, 100].map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all ${
                  amount === String(v)
                    ? 'border-teal-500/30 bg-teal-500/10 text-teal-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep('confirm')}
            disabled={depositAmount <= 0}
            className="w-full rounded-xl bg-teal-500 py-3.5 text-sm font-bold text-zinc-950 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="animate-fadeIn">
          <h2 className="mb-5 text-lg font-bold">Confirm Deposit</h2>

          <div className="mb-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <ArrowDownLeft size={12} /> Deposit Summary
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Card</span>
                  <span className="font-semibold">{card.brand} •{card.last4}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Current balance</span>
                  <span className="font-semibold">${card.liveBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Deposit amount</span>
                  <span className="font-bold text-teal-400">${depositAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-zinc-800 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-white">New balance</span>
                    <span className="font-bold text-emerald-400">
                      ${(card.liveBalance + depositAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Wallet size={12} /> Payment via x402
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TokenUSDC size={16} variant="mono" />
                    <span className="text-zinc-400">USDC (Solana)</span>
                  </div>
                  <span className={`font-semibold ${walletBalance.solana > 0 ? 'text-white' : 'text-zinc-600'}`}>
                    {walletBalance.solana.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TokenUSDC size={16} variant="mono" />
                    <span className="text-zinc-400">USDC (Base)</span>
                  </div>
                  <span className={`font-semibold ${walletBalance.base > 0 ? 'text-white' : 'text-zinc-600'}`}>
                    {walletBalance.base.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {totalUsdc < depositAmount && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400">
                Insufficient USDC balance. Need ${depositAmount.toFixed(2)}, have ${totalUsdc.toFixed(2)}.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('amount')}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98]"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canAfford}
              className="flex-1 rounded-xl bg-teal-500 py-3.5 text-sm font-bold text-zinc-950 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Pay & Deposit
            </button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="animate-fadeIn py-16 text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-teal-400" />
          <p className="mt-4 text-sm font-semibold text-white">Processing x402 Payment...</p>
          <p className="mt-1 text-xs text-zinc-500">Depositing ${depositAmount.toFixed(2)} to •{card.last4}</p>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="animate-fadeIn py-16 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <p className="mt-4 text-lg font-bold text-white">Deposit Complete!</p>
          <p className="mt-1 text-sm text-zinc-400">
            ${depositAmount.toFixed(2)} added to •{card.last4}
          </p>
          <button
            onClick={() => { onSuccess(); onBack(); }}
            className="mt-6 rounded-xl bg-teal-500 px-8 py-3 text-sm font-bold text-zinc-950 transition-all active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="animate-fadeIn py-16 text-center">
          <XCircle size={48} className="mx-auto text-red-400" />
          <p className="mt-4 text-lg font-bold text-white">Deposit Failed</p>
          <p className="mt-1 text-sm text-zinc-400">{result?.error}</p>
          <button
            onClick={() => setStep('confirm')}
            className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800 px-8 py-3 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
