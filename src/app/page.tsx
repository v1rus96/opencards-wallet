'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { ArrowUpRight, CreditCard, Settings, Wallet, Plus, KeyRound } from 'lucide-react';
import { NetworkSolana, NetworkEthereum } from '@web3icons/react';
import { useSafeArea, useTelegram } from '@/hooks/useTelegram';
import { useWalletData } from '@/hooks/useWalletData';
import { getConfig, clearConfig } from '@/lib/store';
import { clearAddressCache, freezeCard, unfreezeCard } from '@/lib/api';
import { BalanceHero } from '@/components/BalanceHero';
import { ChainGrid } from '@/components/ChainGrid';
import { CardList } from '@/components/CardList';
import { SpendingBudget } from '@/components/SpendingBudget';
import { AddressBar } from '@/components/AddressBar';
import { TabBar, TabId } from '@/components/TabBar';
import { SafeAreaFade } from '@/components/SafeAreaFade';
import { OrderCard } from '@/components/OrderCard';
import { DepositCard } from '@/components/DepositCard';
import { Setup } from '@/components/Setup';
import { PullToRefresh } from '@/components/PullToRefresh';
import { CardOrder } from '@/types';

const TransactionHistory = dynamic(() => import('@/components/TransactionHistory').then(m => m.TransactionHistory), { ssr: false });

type View = 'main' | 'order' | 'deposit' | 'setup';

export default function Home() {
  const safeArea = useSafeArea();
  const { haptic } = useTelegram();
  const { cards, chains, spending, totalUsd, loading, error, refresh, updateSpending } = useWalletData();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [view, setView] = useState<View>('main');
  const [depositCard, setDepositCard] = useState<(CardOrder & { liveBalance: number }) | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const config = getConfig();
    if (!config.configured || !config.apiKey) {
      setView('setup');
      setConfigured(false);
    } else {
      setConfigured(true);
    }
  }, []);

  const handleTab = (tab: TabId) => {
    setActiveTab(tab);
    setView('main');
    haptic('selection');
  };

  const handleDeposit = (card: CardOrder & { liveBalance: number }) => {
    setDepositCard(card);
    // Delay view change slightly so the component mounts before sliding up
    setTimeout(() => setIsDepositOpen(true), 10);
    haptic('medium');
  };

  const handleFreeze = async (card: CardOrder & { liveBalance: number }, freeze: boolean) => {
    if (freeze) {
      await freezeCard(card.id);
    } else {
      await unfreezeCard(card.id);
    }
    haptic('medium');
    refresh();
  };

  const handleOrderSuccess = () => {
    refresh();
    haptic('success');
  };

  const handleSetupComplete = () => {
    clearAddressCache();
    setConfigured(true);
    setView('main');
    refresh();
  };

  const handleReconfigure = () => {
    setView('setup');
  };

  const handleDisconnect = () => {
    clearConfig();
    clearAddressCache();
    setConfigured(false);
    setView('setup');
  };

  // Don't render until we know config state
  if (configured === null) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <SafeAreaFade height={safeArea.top} />

      <div style={{ height: safeArea.top }} />

      <PullToRefresh onRefresh={refresh}>

      <div className="mx-auto max-w-lg px-4 pb-24">
        {/* Setup Flow */}
        {view === 'setup' && (
          <Setup onComplete={handleSetupComplete} initialConfig={getConfig()} />
        )}

        {view !== 'setup' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between py-3">
              <h1 className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-xl font-bold text-transparent">
                <Wallet size={20} className="text-teal-400" />
                Agent Wallet
              </h1>
              {error && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                  OFFLINE
                </span>
              )}
            </div>

            {/* Order Card Flow */}
            {view === 'order' && (
              <OrderCard onBack={() => setView('main')} onSuccess={handleOrderSuccess} />
            )}

            {/* Main Views */}
            {view === 'main' && (
              <>
                {activeTab === 'overview' && (
                  <div className="animate-fadeIn">
                    <BalanceHero amount={totalUsd} loading={loading} />

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[
                        { icon: <ArrowUpRight size={20} />, label: 'Send', action: () => { } },
                        { icon: <CreditCard size={20} />, label: 'Cards', action: () => handleTab('cards') },
                        { icon: <Plus size={20} />, label: 'New Card', action: () => { setView('order'); haptic('medium'); } },
                        { icon: <Settings size={20} />, label: 'Settings', action: () => handleTab('settings') },
                      ].map(a => (
                        <button
                          key={a.label}
                          onClick={a.action}
                          className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 py-3.5 text-zinc-400 transition-all active:scale-95"
                        >
                          {a.icon}
                          <span className="mt-1 text-[11px] text-zinc-500">{a.label}</span>
                        </button>
                      ))}
                    </div>

                    <p className="section-title">Wallets</p>
                    <ChainGrid chains={chains} loading={loading} />

                    <p className="section-title">Addresses</p>
                    <AddressBar />

                    <p className="section-title">Spending Budget</p>
                    <SpendingBudget config={spending} onUpdate={updateSpending} />
                  </div>
                )}

                {activeTab === 'cards' && (
                  <div className="animate-fadeIn">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="section-title !mt-0 !mb-0">Virtual Cards ({cards.length})</p>
                      <button
                        onClick={() => { setView('order'); haptic('medium'); }}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-all active:scale-95"
                      >
                        <Plus size={14} /> New Card
                      </button>
                    </div>
                    <CardList cards={cards} loading={loading} onDeposit={handleDeposit} onFreeze={handleFreeze} />
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="animate-fadeIn">
                    <p className="section-title !mt-0">Transaction History</p>
                    <TransactionHistory cards={cards} />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="animate-fadeIn">
                    <p className="section-title !mt-0">Spending Controls</p>
                    <SpendingBudget config={spending} onUpdate={updateSpending} />

                    <p className="section-title">Connected Providers</p>
                    <div className="space-y-2">
                      {[
                        { icon: <NetworkSolana size={20} variant="mono" />, name: 'Solana', status: 'Connected' },
                        { icon: <NetworkEthereum size={20} variant="mono" />, name: 'Base (EVM)', status: 'Connected' },
                        { icon: <CreditCard size={20} className="text-teal-400" />, name: 'OpenCards', status: 'Connected' },
                      ].map(p => (
                        <div key={p.name} className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
                          <span className="mr-3">{p.icon}</span>
                          <span className="flex-1 text-sm font-medium">{p.name}</span>
                          <span className="text-xs font-semibold text-emerald-400">{p.status}</span>
                        </div>
                      ))}
                    </div>

                    <p className="section-title">Account</p>
                    <div className="space-y-2">
                      <button
                        onClick={handleReconfigure}
                        className="flex w-full items-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-all active:scale-[0.98]"
                      >
                        <KeyRound size={18} className="mr-3 text-teal-400" />
                        <span className="flex-1 text-left text-sm font-medium">Reconfigure Keys</span>
                        <span className="text-xs text-zinc-500">Edit</span>
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="flex w-full items-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 transition-all active:scale-[0.98]"
                      >
                        <span className="flex-1 text-left text-sm font-medium text-red-400">Disconnect Wallet</span>
                      </button>
                    </div>

                    <p className="section-title">Agent Info</p>
                    <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      {[
                        ['Agent', 'v1rus96'],
                        ['Owner', 'Firuz'],
                        ['Version', '2.1.0'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                          <span className="text-sm text-zinc-500">{k}</span>
                          <span className="text-sm font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      </PullToRefresh>

      {view !== 'setup' && (
        <TabBar active={activeTab} onSelect={handleTab} bottomInset={safeArea.bottom} />
      )}

      {/* Deposit Bottom Sheet Overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${isDepositOpen ? 'visible bg-black/60' : 'invisible bg-transparent'}`}
        onClick={() => { setIsDepositOpen(false); setTimeout(() => setDepositCard(null), 300); }}
      >
        <div
          className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-zinc-950 px-4 pb-12 pt-6 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isDepositOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-zinc-800" />

          {depositCard && (
            <DepositCard
              card={depositCard}
              onBack={() => { setIsDepositOpen(false); setTimeout(() => setDepositCard(null), 300); }}
              onSuccess={() => { handleOrderSuccess(); setIsDepositOpen(false); setTimeout(() => setDepositCard(null), 300); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
