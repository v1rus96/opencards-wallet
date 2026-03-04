'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DrawerAction } from '@/components/DepositCard';
import { CreditCard, ChevronLeft, Loader2, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { TokenUSDC } from '@web3icons/react';
import { getProducts, getPaymentWalletBalance, orderCard } from '@/lib/payment';
import { CardScanAnimation } from '@/components/CardScanAnimation';
import { OrderCardPreview } from '@/components/OrderCardPreview';
import { SlidingNumber } from '@/components/SlidingNumber';


interface Product {
  id: string;
  name: string;
  organization: string;
  type: string;
  category: string;
  cardPrice: string;
  depositMin: string;
  depositMax: string;
}

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onActionButton?: (action: DrawerAction | null) => void;
}

type Step = 'product' | 'amount' | 'confirm' | 'processing' | 'success' | 'error';

export function OrderCard({ onBack, onSuccess, onActionButton }: Props) {
  const [step, setStep] = useState<Step>('product');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [amount, setAmount] = useState('25');
  const [walletBalance, setWalletBalance] = useState({ solana: 0, base: 0 });
  const [result, setResult] = useState<{ order?: { id: string; last4?: string }; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  // Piecewise slider: more space for lower values, less for higher
  // $20–$200 → 50% of track, $200–$1000 → 30%, $1000–$10000 → 20%
  const SLIDER_TICKS = 1000;
  const BREAKPOINTS = [
    { dollar: 20,    tick: 0 },
    { dollar: 200,   tick: 500 },
    { dollar: 1000,  tick: 800 },
    { dollar: 10000, tick: 1000 },
  ];

  const sliderToAmount = useCallback((tick: number): number => {
    for (let i = 1; i < BREAKPOINTS.length; i++) {
      const prev = BREAKPOINTS[i - 1];
      const curr = BREAKPOINTS[i];
      if (tick <= curr.tick) {
        const t = (tick - prev.tick) / (curr.tick - prev.tick);
        return Math.round(prev.dollar + t * (curr.dollar - prev.dollar));
      }
    }
    return BREAKPOINTS[BREAKPOINTS.length - 1].dollar;
  }, []);

  const amountToSlider = useCallback((val: number): number => {
    const clamped = Math.max(20, Math.min(10000, val));
    for (let i = 1; i < BREAKPOINTS.length; i++) {
      const prev = BREAKPOINTS[i - 1];
      const curr = BREAKPOINTS[i];
      if (clamped <= curr.dollar) {
        const t = (clamped - prev.dollar) / (curr.dollar - prev.dollar);
        return Math.round(prev.tick + t * (curr.tick - prev.tick));
      }
    }
    return BREAKPOINTS[BREAKPOINTS.length - 1].tick;
  }, []);

  // Haptic feedback — fire on every value change
  const lastHapticVal = useRef(Number(amount));
  const hapticRef = useRef((val: number) => {
    if (val !== lastHapticVal.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wa = (window as any).Telegram?.WebApp;
        wa?.HapticFeedback?.selectionChanged?.();
      } catch { /* */ }
    }
    lastHapticVal.current = val;
  });

  const hapticTick = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wa = (window as any).Telegram?.WebApp;
      wa?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* */ }
  }, []);

  // Map steps to scan progress — CardScanAnimation handles smooth interpolation
  const stepProgress: Record<Step, number> = {
    product: 0, amount: 33, confirm: 66, processing: 90, success: 100, error: 66,
  };

  useEffect(() => {
    setScanProgress(stepProgress[step]);
  }, [step]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const prods = await getProducts();
        if (mounted) setProducts(prods);
      } catch (e) {
        console.error('Failed to load products:', e);
      }
      try {
        const bal = await getPaymentWalletBalance();
        if (mounted) setWalletBalance({ solana: bal.solana?.usdc || 0, base: bal.base?.usdc || 0 });
      } catch (e) {
        console.error('Failed to load balances:', e);
      }
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const totalUsdc = walletBalance.solana + walletBalance.base;
  const cardFee = parseFloat(selectedProduct?.cardPrice || '0');
  const depositAmount = parseFloat(amount || '0');
  // x402 charges the deposit amount; card fee is deducted from deposit by the issuer
  const totalCharge = depositAmount;
  const canAfford = totalUsdc >= totalCharge;

  const handleConfirm = async () => {
    if (!selectedProduct) return;
    setStep('processing');
    try {
      const data = await orderCard(selectedProduct.id, parseFloat(amount));
      if (data.success || data.order) {
        setResult(data);
        setStep('success');
      } else {
        setResult({ error: data.error || 'Order failed' });
        setStep('error');
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
      setStep('error');
    }
  };

  // Expose current action to parent (for morphed nav button)
  const performRef = useRef<() => void>(() => {});
  if (step === 'product') performRef.current = onBack;
  else if (step === 'amount') performRef.current = () => setStep('confirm');
  else if (step === 'confirm') performRef.current = handleConfirm;
  else if (step === 'success') performRef.current = () => { onSuccess(); onBack(); };
  else if (step === 'error') performRef.current = () => setStep('confirm');
  else performRef.current = () => {};

  useEffect(() => {
    if (!onActionButton) return;
    const labels: Record<string, string> = {
      product: 'Cancel', amount: 'Continue', confirm: 'Pay & Order', success: 'Done', error: 'Try Again',
    };
    const label = labels[step];
    if (!label) { onActionButton(null); return; }
    const backActions: Record<string, (() => void) | undefined> = {
      amount: () => setStep('product'),
      confirm: () => setStep('amount'),
      error: () => setStep('confirm'),
    };
    onActionButton({
      label,
      disabled: step === 'amount'
        ? !amount || parseFloat(amount) < Number(selectedProduct?.depositMin || '0')
        : step === 'confirm' ? !canAfford : false,
      perform: () => performRef.current(),
      onBack: backActions[step],
    });
    return () => onActionButton(null);
  }, [step, amount, canAfford, onActionButton, selectedProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {!onActionButton && (
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-zinc-400 active:text-white">
          <ChevronLeft size={16} /> Back
        </button>
      )}

      {/* Card scan progress indicator */}
      <div className="mx-auto mb-5 w-3/4">
        <CardScanAnimation progress={scanProgress}>
          <OrderCardPreview />
        </CardScanAnimation>
      </div>

      {/* Step: Select Product */}
      {step === 'product' && (
        <div className="animate-fadeIn">
          <h2 className="mb-4 text-lg font-bold">Select Card Type</h2>
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p); setStep('amount'); }}
                className="flex w-full items-center rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all active:scale-[0.98]"
              >
                <CreditCard size={20} className="mr-3 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{p.organization} {p.type}</p>
                  <p className="text-xs text-zinc-500">Card fee: ${p.cardPrice} · Deposit: ${p.depositMin}–${Number(p.depositMax).toLocaleString()}</p>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-zinc-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Enter Amount */}
      {step === 'amount' && selectedProduct && (
        <div className="animate-fadeIn">
          <h2 className="mb-1 text-lg font-bold">Card Amount</h2>
          <p className="mb-5 text-xs text-zinc-500">
            {selectedProduct.organization} {selectedProduct.type} · Fee: ${selectedProduct.cardPrice}
          </p>

          {/* Amount display */}
          <div className="mb-6 text-center">
            <span className="font-mono text-5xl font-extrabold text-white">$<SlidingNumber value={Number(amount)} /></span>
          </div>

          {/* Slider — logarithmic scale for precision at low values */}
          <div className="mb-3 px-1">
            <input
              type="range"
              min={0}
              max={SLIDER_TICKS}
              step={1}
              value={amountToSlider(Number(amount))}
              onChange={e => {
                const dollars = sliderToAmount(Number(e.target.value));
                const str = String(dollars);
                if (str !== amount) {
                  setAmount(str);
                  hapticRef.current(dollars);
                }
              }}
              className="amount-slider w-full"
              style={{ '--val': `${(amountToSlider(Number(amount)) / SLIDER_TICKS) * 100}%` } as React.CSSProperties}
            />
            <div className="mt-2 flex justify-between text-xs text-zinc-500">
              <span>$20</span>
              <span>$10,000</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="mb-5 flex gap-2">
            {[25, 50, 100, 500, 1000].map(v => (
              <button
                key={v}
                onClick={() => { setAmount(String(v)); hapticTick(); }}
                className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                  amount === String(v)
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}
              >
                ${v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
          </div>

          {!onActionButton && (
            <button
              onClick={() => setStep('confirm')}
              disabled={!amount || parseFloat(amount) < Number(selectedProduct.depositMin)}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedProduct && (
        <div className="animate-fadeIn">
          <h2 className="mb-5 text-lg font-bold">Confirm Order</h2>

          <div className="mb-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <CreditCard size={12} /> Order Summary
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Card</span>
                  <span className="font-semibold">{selectedProduct.organization} {selectedProduct.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Deposit</span>
                  <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                </div>
                {cardFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Card fee (from deposit)</span>
                    <span className="font-semibold text-zinc-500">−${cardFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-800 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-white">You pay</span>
                    <span className="font-mono font-bold text-primary">${totalCharge.toFixed(2)} USDC</span>
                  </div>
                  {cardFee > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-zinc-500">Card balance after fee</span>
                      <span className="text-zinc-400">${(depositAmount - cardFee).toFixed(2)}</span>
                    </div>
                  )}
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

            {!canAfford && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400">
                Insufficient USDC balance. Need ${totalCharge.toFixed(2)}, have ${totalUsdc.toFixed(2)}.
              </div>
            )}
          </div>

          {!onActionButton && (
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
                className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
              >
                Pay & Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="animate-fadeIn py-16 text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-primary" />
          <p className="mt-4 text-sm font-semibold text-white">Processing x402 Payment...</p>
          <p className="mt-1 text-xs text-zinc-500">Signing transaction & ordering card</p>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="animate-fadeIn py-16 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <p className="mt-4 text-lg font-bold text-white">Card Ordered!</p>
          <p className="mt-1 text-sm text-zinc-400">
            {result?.order?.last4 ? `•••• ${result.order.last4}` : 'Provisioning...'}
          </p>
          {!onActionButton && (
            <button
              onClick={() => { onSuccess(); onBack(); }}
              className="mt-6 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]"
            >
              Done
            </button>
          )}
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="animate-fadeIn py-16 text-center">
          <XCircle size={48} className="mx-auto text-red-400" />
          <p className="mt-4 text-lg font-bold text-white">Order Failed</p>
          <p className="mt-1 text-sm text-zinc-400">{result?.error}</p>
          {!onActionButton && (
            <button
              onClick={() => setStep('confirm')}
              className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800 px-8 py-3 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98]"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
