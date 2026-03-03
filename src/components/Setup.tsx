'use client';

import { useState } from 'react';
import { Key, Shield, ChevronRight, CheckCircle2, UserPlus, Copy, Check, Wallet, AlertTriangle } from 'lucide-react';
import { saveConfig, WalletConfig } from '@/lib/store';

interface SetupProps {
  onComplete: () => void;
  initialConfig?: WalletConfig;
}

export function Setup({ onComplete, initialConfig }: SetupProps) {
  const [step, setStep] = useState<'welcome' | 'choice' | 'register' | 'import' | 'done'>('welcome');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [name, setName] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regResult, setRegResult] = useState<{ apiKey: string; solWallet?: string; evmWallet?: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRegister = async () => {
    if (!name || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        const key = data.agent.api_key;
        setRegResult({
          apiKey: key,
          solWallet: data.wallets?.solana?.address,
          evmWallet: data.wallets?.evm?.address,
          name: data.agent.name,
        });
        saveConfig({ apiKey: key });
        setStep('done');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Connection failed. Try again.');
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async () => {
    if (!apiKey.startsWith('oc_')) {
      setError('API key must start with oc_');
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const r = await fetch('/api/products');
      const data = await r.json();
      if (data.products?.length > 0) {
        saveConfig({ apiKey });
        setStep('done');
        setTimeout(onComplete, 800);
      } else {
        setError('Could not verify API key');
      }
    } catch {
      setError('Connection failed. Try again.');
    } finally {
      setTesting(false);
    }
  };

  const copyKey = async () => {
    if (regResult?.apiKey) {
      try {
        await navigator.clipboard.writeText(regResult.apiKey);
      } catch {
        // Fallback for Telegram WebView
        const ta = document.createElement('textarea');
        ta.value = regResult.apiKey;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center">
      {/* Welcome */}
      {step === 'welcome' && (
        <div className="animate-fadeIn text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-500/10">
            <Shield size={36} className="text-teal-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Agent Wallet</h1>
          <p className="mb-8 text-sm text-zinc-500">
            Order virtual cards, manage balances, and track spending — powered by OpenCards.
          </p>
          <button
            onClick={() => setStep('choice')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-4 text-base font-bold text-zinc-950 transition-all active:scale-[0.98]"
          >
            Get Started <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Choice: Register or Import */}
      {step === 'choice' && (
        <div className="animate-fadeIn">
          <h2 className="mb-1 text-lg font-bold">Connect Your Wallet</h2>
          <p className="mb-6 text-xs text-zinc-500">Create a new account or connect an existing one.</p>

          <button
            onClick={() => { setError(null); setStep('register'); }}
            className="mb-3 flex w-full items-center rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all active:scale-[0.98]"
          >
            <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
              <UserPlus size={22} className="text-teal-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Create New Account</p>
              <p className="text-xs text-zinc-500">Get an API key and wallet in seconds</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-zinc-600" />
          </button>

          <button
            onClick={() => { setError(null); setStep('import'); }}
            className="mb-6 flex w-full items-center rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all active:scale-[0.98]"
          >
            <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
              <Key size={22} className="text-zinc-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">I Have an API Key</p>
              <p className="text-xs text-zinc-500">Connect with your existing OpenCards key</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-zinc-600" />
          </button>

          <button
            onClick={() => setStep('welcome')}
            className="w-full text-center text-xs text-zinc-600"
          >
            Back
          </button>
        </div>
      )}

      {/* Register */}
      {step === 'register' && (
        <div className="animate-fadeIn py-4">
          <h2 className="mb-1 text-lg font-bold">Create Account</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Choose a name for your agent. This will be your identity on OpenCards.
          </p>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Agent Name</label>
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <UserPlus size={14} className="mr-2 shrink-0 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none"
                placeholder="e.g. my-agent"
                autoFocus
                maxLength={32}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-600">Letters, numbers, hyphens. Must be unique.</p>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-center text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setError(null); setStep('choice'); }}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98]"
            >
              Back
            </button>
            <button
              onClick={handleRegister}
              disabled={!name || name.trim().length < 2 || testing}
              className="flex-1 rounded-xl bg-teal-500 py-3.5 text-sm font-bold text-zinc-950 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {testing ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      )}

      {/* Import */}
      {step === 'import' && (
        <div className="animate-fadeIn py-4">
          <h2 className="mb-1 text-lg font-bold">Import API Key</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Paste your OpenCards API key to connect your existing account.
          </p>

          <div className="mb-4">
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <Key size={14} className="mr-2 shrink-0 text-zinc-500" />
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-white outline-none"
                placeholder="oc_..."
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-center text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setError(null); setStep('choice'); }}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-sm font-bold text-zinc-300 transition-all active:scale-[0.98]"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={!apiKey || testing}
              className="flex-1 rounded-xl bg-teal-500 py-3.5 text-sm font-bold text-zinc-950 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {testing ? 'Verifying...' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="animate-fadeIn text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>

          {regResult ? (
            <>
              <h2 className="mb-1 text-lg font-bold">Welcome, {regResult.name}!</h2>
              <p className="mb-5 text-sm text-zinc-500">Your account is ready. Save your API key below.</p>

              {/* API Key Display */}
              <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={12} />
                  Save this key — it won&apos;t be shown again!
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2">
                  <code className="flex-1 break-all text-xs text-zinc-300">{regResult.apiKey}</code>
                  <button
                    onClick={copyKey}
                    className="shrink-0 rounded-lg bg-zinc-800 p-2 transition-all active:scale-90"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-400" />}
                  </button>
                </div>
              </div>

              {/* Wallet Addresses */}
              {(regResult.solWallet || regResult.evmWallet) && (
                <div className="mb-5 space-y-2">
                  {regResult.solWallet && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                        <Wallet size={12} />
                        Solana Wallet (Devnet)
                      </div>
                      <code className="break-all text-xs text-teal-400">{regResult.solWallet}</code>
                    </div>
                  )}
                  {regResult.evmWallet && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                        <Wallet size={12} />
                        EVM Wallet (Base Sepolia)
                      </div>
                      <code className="break-all text-xs text-teal-400">{regResult.evmWallet}</code>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600 text-center">Fund with USDC to order cards</p>
                </div>
              )}

              <button
                onClick={onComplete}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-4 text-base font-bold text-zinc-950 transition-all active:scale-[0.98]"
              >
                Open Wallet <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-bold">Connected!</h2>
              <p className="mb-2 text-sm text-zinc-500">Loading your wallet...</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
