'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { CreditCard, Plus, KeyRound, ChevronRight, Wallet } from 'lucide-react';
import { NetworkSolana, NetworkEthereum } from '@web3icons/react';
import { useSafeArea, useTelegram } from '@/hooks/useTelegram';
import { useWalletData } from '@/hooks/useWalletData';
import { getConfig, clearConfig } from '@/lib/store';
import { clearAddressCache, freezeCard, unfreezeCard, getAddresses } from '@/lib/api';
import { ChainGrid } from '@/components/ChainGrid';
import { CardList } from '@/components/CardList';
import { SpendingBudget } from '@/components/SpendingBudget';
import { CoinDrawer } from '@/components/CoinDrawer';
import { TabBar, TabId } from '@/components/TabBar';
import { SafeAreaFade } from '@/components/SafeAreaFade';
import { OrderCard } from '@/components/OrderCard';
import { DepositCard } from '@/components/DepositCard';
import { Setup } from '@/components/Setup';
import { PullToRefresh } from '@/components/PullToRefresh';
import { RecentActivity } from '@/components/RecentActivity';
import { CardOrder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const [selectedChain, setSelectedChain] = useState<import('@/types').ChainBalance | null>(null);
  const [isCoinDrawerOpen, setIsCoinDrawerOpen] = useState(false);
  const [addresses, setAddresses] = useState({ sol: '', evm: '' });

  useEffect(() => {
    const config = getConfig();
    if (!config.configured || !config.apiKey) {
      setView('setup');
      setConfigured(false);
    } else {
      setConfigured(true);
      getAddresses().then(setAddresses);
    }
  }, []);

  const handleTab = (tab: TabId) => {
    setActiveTab(tab);
    setView('main');
    haptic('selection');
  };

  const handleDeposit = (card: CardOrder & { liveBalance: number }) => {
    setDepositCard(card);
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

  if (configured === null) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <SafeAreaFade height={safeArea.top} />

      <div style={{ height: safeArea.top }} />

      <PullToRefresh onRefresh={refresh}>

      <div className="mx-auto max-w-lg px-4 pb-24">
        {view === 'setup' && (
          <Setup onComplete={handleSetupComplete} initialConfig={getConfig()} />
        )}

        {view !== 'setup' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between py-3">
              <h1 className="flex items-center gap-2 text-xl font-bold text-white">
                <svg width="22" height="20" viewBox="27 37 168 150" className="text-primary"><path d="m34.14 171.15c24.48-24.55 48.69-48.87 72.96-73.14 2.35-2.35 4.17-4.82 1.31-7.66-3.02-2.99-5.48-0.53-7.64 1.64-17.64 17.69-35.25 35.41-52.88 53.11-2.35 2.36-4.62 4.83-7.17 6.95-1.43 1.19-3.94 2.89-4.94 2.37-1.5-0.78-2.74-3.21-3-5.08-4.05-29.74 2.44-55.62 27.75-74.45 10-7.45 19.94-14.97 29.99-22.36 9.4-6.91 19.83-9.74 31.54-8.09 3.49 0.5 7.28 0.18 10.74-0.59 18.13-4.07 36.29-4.54 54.52-1 1.9 0.37 3.58 1.9 5.36 2.89-0.97 1.66-1.66 3.6-2.97 4.92-23.48 23.63-47.04 47.19-70.58 70.76-1.65 1.65-3.26 3.33-4.9 4.99-2.1 2.14-3.13 4.54-0.78 7.01 2.49 2.61 4.78 1.24 6.86-0.85q19.56-19.63 39.12-39.26c7.29-7.32 14.5-14.71 21.85-21.97 4.02-3.97 6.81-3.21 7.63 2.47 4.23 29.37-1.17 55.38-26.52 74.26-10.28 7.66-20.36 15.6-30.67 23.22-9.82 7.25-20.73 10.29-32.97 7.99-2.35-0.44-5-0.31-7.33 0.27-18.54 4.64-37.18 5.36-55.93 1.66-2.08-0.42-3.95-1.89-5.91-2.87 1.08-1.96 2.14-3.93 3.26-5.87 0.24-0.42 0.69-0.72 1.3-1.32z" fill="currentColor" /></svg>
                Open<span className="text-primary">Cards</span>
              </h1>
              {error && (
                <Badge variant="destructive" className="text-[11px]">OFFLINE</Badge>
              )}
            </div>

            {view === 'order' && (
              <OrderCard onBack={() => setView('main')} onSuccess={handleOrderSuccess} />
            )}

            {view === 'main' && (
              <>
                {activeTab === 'overview' && (
                  <div className="animate-fadeIn">
                    {/* Hero: Balance + Quick Actions */}
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] p-7 shadow-2xl">
                      {/* Glow orbs */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.06] to-primary/[0.03] opacity-60" />
                        <div className="absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-gradient-to-tr from-primary/15 to-transparent blur-3xl" />
                        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
                        <div className="absolute bottom-20 right-12 h-14 w-14 rounded-full bg-primary/[0.06] blur-2xl animate-pulse" />
                        <div className="absolute top-8 left-8 h-10 w-10 rounded-full bg-white/[0.03] blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 h-20 w-20 rounded-br-3xl bg-gradient-to-br from-white/[0.04] to-transparent" />
                      <div className="absolute bottom-0 right-0 h-20 w-20 rounded-tl-3xl bg-gradient-to-tl from-primary/[0.06] to-transparent" />

                      <div className="relative z-10 mb-2 flex items-center justify-center gap-2">
                        <Wallet size={14} className="text-zinc-500" />
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                          Total Portfolio
                        </p>
                      </div>
                      <div className="relative z-10">
                        {loading ? (
                          <div className="mx-auto h-12 w-40 animate-pulse rounded-lg bg-zinc-800" />
                        ) : (() => {
                          const formatted = totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const [whole, decimal] = formatted.split('.');
                          return (
                            <p className="text-center font-mono text-[44px] font-extrabold leading-none tracking-tight text-white">
                              <span className="text-xl text-zinc-500">$</span>
                              {whole}
                              <span className="text-xl text-zinc-500">.{decimal}</span>
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    <p className="section-title">Wallets</p>
                    <ChainGrid
                      chains={chains}
                      loading={loading}
                      horizontal
                      onChainSelect={(chain) => {
                        setSelectedChain(chain);
                        setIsCoinDrawerOpen(true);
                        haptic('medium');
                      }}
                    />

                    <p className="section-title">Recent Activity</p>
                    <RecentActivity cards={cards} onViewAll={() => handleTab('history')} />
                  </div>
                )}

                {activeTab === 'cards' && (
                  <div className="animate-fadeIn">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="section-title !mt-0 !mb-0">Virtual Cards ({cards.length})</p>
                      <Button
                        onClick={() => { setView('order'); haptic('medium'); }}
                        size="sm"
                        className="gap-1.5 rounded-lg text-xs font-bold active:scale-95"
                      >
                        <Plus size={14} /> New Card
                      </Button>
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
                        { icon: <CreditCard size={20} className="text-primary" />, name: 'OpenCards', status: 'Connected' },
                      ].map(p => (
                        <Card key={p.name} className="border-zinc-800 bg-zinc-900 py-0 shadow-none">
                          <CardContent className="flex items-center px-4 py-3.5">
                            <span className="mr-3">{p.icon}</span>
                            <span className="flex-1 text-sm font-medium">{p.name}</span>
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400">
                              {p.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <p className="section-title">Account</p>
                    <div className="space-y-2">
                      <Card className="border-zinc-800 bg-zinc-900 py-0 shadow-none">
                        <button
                          onClick={handleReconfigure}
                          className="flex w-full items-center px-4 py-3.5 transition-all active:scale-[0.98]"
                        >
                          <KeyRound size={18} className="mr-3 text-primary" />
                          <span className="flex-1 text-left text-sm font-medium">Reconfigure Keys</span>
                          <ChevronRight size={16} className="text-zinc-500" />
                        </button>
                      </Card>
                      <Card className="border-red-500/20 bg-red-500/5 py-0 shadow-none">
                        <button
                          onClick={handleDisconnect}
                          className="flex w-full items-center px-4 py-3.5 transition-all active:scale-[0.98]"
                        >
                          <span className="flex-1 text-left text-sm font-medium text-red-400">Disconnect Wallet</span>
                          <ChevronRight size={16} className="text-red-400/50" />
                        </button>
                      </Card>
                    </div>

                    <p className="section-title">Agent Info</p>
                    <Card className="border-zinc-800 bg-zinc-900 py-0 shadow-none">
                      <CardContent className="p-4">
                        {[
                          ['Agent', 'v1rus96'],
                          ['Owner', 'Firuz'],
                          ['Version', '2.1.0'],
                        ].map(([k, v], i, arr) => (
                          <div key={k}>
                            <div className="flex justify-between py-2.5">
                              <span className="text-sm text-zinc-500">{k}</span>
                              <span className="text-sm font-semibold">{v}</span>
                            </div>
                            {i < arr.length - 1 && <Separator className="bg-zinc-800" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
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

      {/* Coin Drawer (Send/Receive) */}
      <CoinDrawer
        open={isCoinDrawerOpen}
        chain={selectedChain}
        address={
          selectedChain?.chain.includes('Solana') || selectedChain?.chain.includes('SOL')
            ? addresses.sol
            : addresses.evm
        }
        onClose={() => { setIsCoinDrawerOpen(false); setTimeout(() => setSelectedChain(null), 300); }}
      />

      {/* Deposit Bottom Sheet Overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${isDepositOpen ? 'visible bg-black/60' : 'invisible bg-transparent'}`}
        onClick={() => { setIsDepositOpen(false); setTimeout(() => setDepositCard(null), 300); }}
      >
        <div
          className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-zinc-950 px-4 pb-12 pt-6 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isDepositOpen ? 'translate-y-0' : 'translate-y-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
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
