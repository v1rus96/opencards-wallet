'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { Home as HomeIcon, CreditCard, ClipboardList, Settings, Plus, KeyRound, ChevronRight, Wallet } from 'lucide-react';
import { NetworkSolana, NetworkEthereum } from '@web3icons/react';
import { useSafeArea, useTelegram } from '@/hooks/useTelegram';
import { useWalletData } from '@/hooks/useWalletData';
import { getConfig, clearConfig } from '@/lib/store';
import { clearAddressCache, freezeCard, unfreezeCard, getAddresses } from '@/lib/api';
import { ChainGrid } from '@/components/ChainGrid';
const CardList = dynamic(() => import('@/components/CardList').then(m => m.CardList), { ssr: false });
import { SpendingBudget } from '@/components/SpendingBudget';
import { CoinDrawer } from '@/components/CoinDrawer';
import { BottomNavbar, type CTAButton, type DrawerStep } from '@/components/bottom-navbar';
import { SafeAreaFade } from '@/components/SafeAreaFade';
import { OrderCard } from '@/components/OrderCard';
import { DepositCard, type DrawerAction } from '@/components/DepositCard';
import { TransactionDetailContent, type TxDetailData } from '@/components/TransactionDetail';
import { Setup } from '@/components/Setup';
import { PullToRefresh } from '@/components/PullToRefresh';
import { RecentActivity } from '@/components/RecentActivity';
import { CardOrder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const TransactionHistory = dynamic(() => import('@/components/TransactionHistory').then(m => m.TransactionHistory), { ssr: false });

type View = 'main' | 'setup';

export default function Home() {
  const safeArea = useSafeArea();
  const { haptic } = useTelegram();
  const { cards, chains, spending, totalUsd, totalCrypto, totalCash, loading, refresh, updateSpending, realtimeEvent } = useWalletData();
  const [activeTab, setActiveTab] = useState('Overview');
  const [view, setView] = useState<View>('main');
  const [depositCard, setDepositCard] = useState<(CardOrder & { liveBalance: number }) | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [selectedChain, setSelectedChain] = useState<import('@/types').ChainBalance | null>(null);
  const [addresses, setAddresses] = useState({ sol: '', evm: '' });
  const [drawerMode, setDrawerMode] = useState<'none' | 'order' | 'deposit' | 'coin' | 'txDetail'>('none');
  const [drawerCTA, setDrawerCTA] = useState<DrawerAction | null>(null);
  const [selectedTx, setSelectedTx] = useState<TxDetailData | null>(null);

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

  const handleTab = (tab: string) => {
    setActiveTab(tab);
    setView('main');
    haptic('selection');
  };

  const handleDeposit = (card: CardOrder & { liveBalance: number }) => {
    setDepositCard(card);
    setDrawerMode('deposit');
    haptic('medium');
  };

  const handleDrawerClose = useCallback(() => {
    setDrawerMode('none');
    setDrawerCTA(null);
    setTimeout(() => { setDepositCard(null); setSelectedChain(null); setSelectedTx(null); }, 400);
  }, []);

  const handleTxSelect = useCallback((tx: TxDetailData) => {
    setSelectedTx(tx);
    setDrawerMode('txDetail');
    haptic('light');
  }, [haptic]);

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

      <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
        {view === 'setup' && (
          <Setup onComplete={handleSetupComplete} initialConfig={getConfig()} />
        )}

        {view !== 'setup' && (
          <>
            {view === 'main' && (
              <>
                {activeTab === 'Overview' && (
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

                      {/* Crypto / Cash split */}
                      {!loading && (
                        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Crypto</p>
                            <p className="mt-1 font-mono text-lg font-bold text-white">
                              ${totalCrypto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Cash</p>
                            <p className="mt-1 font-mono text-lg font-bold text-white">
                              ${totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="section-title">Wallets</p>
                    <ChainGrid
                      chains={chains}
                      loading={loading}
                      horizontal
                      onChainSelect={(chain) => {
                        setSelectedChain(chain);
                        setDrawerMode('coin');
                        haptic('medium');
                      }}
                    />

                    <p className="section-title">Recent Activity</p>
                    <RecentActivity cards={cards} refreshKey={realtimeEvent} onViewAll={() => handleTab('Activity')} onTxSelect={handleTxSelect} />
                  </div>
                )}

                {activeTab === 'Cards' && (
                  <div className="animate-fadeIn">
                    <p className="section-title !mt-0">Virtual Cards ({cards.length})</p>
                    <CardList cards={cards} loading={loading} onDeposit={handleDeposit} onFreeze={handleFreeze} onTxSelect={handleTxSelect} />
                  </div>
                )}

                {activeTab === 'Activity' && (
                  <div className="animate-fadeIn">
                    <p className="section-title !mt-0">Transaction History</p>
                    <TransactionHistory cards={cards} onTxSelect={handleTxSelect} />
                  </div>
                )}

                {activeTab === 'Settings' && (
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
        <BottomNavbar
          navItems={[
            { icon: HomeIcon, label: 'Overview' },
            { icon: CreditCard, label: 'Cards' },
            { icon: ClipboardList, label: 'Activity' },
            { icon: Settings, label: 'Settings' },
          ]}
          activeTab={activeTab}
          onTabChange={handleTab}
          actionButton={{
            icon: Plus,
            label: 'New Card',
            onClick: () => { setDrawerMode('order'); haptic('medium'); },
          }}
          drawer={{
            steps: drawerMode === 'order' ? [{
              title: '',
              content: (
                <OrderCard
                  onBack={handleDrawerClose}
                  onSuccess={() => { handleOrderSuccess(); handleDrawerClose(); }}
                  onActionButton={setDrawerCTA}
                />
              ),
            }] : drawerMode === 'deposit' && depositCard ? [{
              title: '',
              content: (
                <DepositCard
                  card={depositCard}
                  onBack={handleDrawerClose}
                  onSuccess={() => { handleOrderSuccess(); handleDrawerClose(); }}
                  onActionButton={setDrawerCTA}
                />
              ),
            }] : drawerMode === 'coin' && selectedChain ? [{
              title: '',
              content: (
                <CoinDrawer
                  chain={selectedChain}
                  address={
                    selectedChain.chain.includes('Solana') || selectedChain.chain.includes('SOL')
                      ? addresses.sol
                      : addresses.evm
                  }
                  onBack={handleDrawerClose}
                  onSuccess={refresh}
                  onActionButton={setDrawerCTA}
                />
              ),
            }] : drawerMode === 'txDetail' && selectedTx ? [{
              title: '',
              content: (
                <TransactionDetailContent
                  tx={selectedTx}
                  onBack={handleDrawerClose}
                  onActionButton={setDrawerCTA}
                />
              ),
            }] : [],
            ctaButtons: drawerCTA ? [
              ...(drawerCTA.onBack ? [{
                label: 'Back',
                variant: 'secondary' as const,
                onClick: drawerCTA.onBack,
              }] : []),
              {
                label: drawerCTA.label,
                onClick: () => drawerCTA.perform(),
                disabled: drawerCTA.disabled,
              },
            ] : [],
            isOpen: drawerMode !== 'none',
            onOpenChange: (open: boolean) => { if (!open) handleDrawerClose(); },
            currentStep: 0,
            onStepChange: () => {},
          }}
        />
      )}

    </div>
  );
}
