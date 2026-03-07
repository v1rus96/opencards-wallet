'use client';

import { useState, useEffect, useCallback } from 'react';
import { CardOrder, ChainBalance, SpendingConfig } from '@/types';
import * as api from '@/lib/api';

const DEFAULT_SPENDING: SpendingConfig = {
  autoApproveBelow: 10,
  approvalThreshold: 50,
  dailyLimit: 500,
  monthlyLimit: 5000,
  alwaysRequireApproval: ['card_create', 'withdraw'],
};

export function useWalletData() {
  const [cards, setCards] = useState<(CardOrder & { liveBalance: number })[]>([]);
  const [chains, setChains] = useState<ChainBalance[]>([]);
  const [spending, setSpending] = useState<SpendingConfig>(DEFAULT_SPENDING);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);

      // Parallel fetch
      const [orders, solBal, solUsdc, baseEth, baseUsdc, prices] = await Promise.all([
        api.getOrders(),
        api.getSolBalance(),
        api.getSolUsdcBalance(),
        api.getBaseEthBalance(),
        api.getBaseUsdcBalance(),
        api.getCryptoPrices(),
      ]);

      // Get live balances for each card
      const completedOrders = orders.filter((o: CardOrder) => o.status === 'completed' || o.status === 'frozen');
      const cardsWithBalance = await Promise.all(
        completedOrders.map(async (card: CardOrder) => {
          try {
            const bal = await api.getCardBalance(card.id);
            return { ...card, liveBalance: parseFloat(bal?.available || String(card.amount)) };
          } catch {
            return { ...card, liveBalance: card.amount };
          }
        })
      );

      const totalCards = cardsWithBalance.reduce((s, c) => s + c.liveBalance, 0);

      const chainBalances: ChainBalance[] = [
        { chain: 'Base (Sepolia)', icon: '🔵', symbol: 'ETH', balance: baseEth, usdValue: baseEth * (prices.ETH || 0) },
        { chain: 'Solana (Devnet)', icon: '💎', symbol: 'SOL', balance: solBal, usdValue: solBal * (prices.SOL || 0) },
        { chain: 'USDC (Base)', icon: '💵', symbol: 'USDC', balance: baseUsdc, usdValue: baseUsdc * (prices.USDC || 1) },
        { chain: 'USDC (Solana)', icon: '💵', symbol: 'USDC', balance: solUsdc, usdValue: solUsdc * (prices.USDC || 1) },
      ];

      const totalChainUsd = chainBalances.reduce((s, c) => s + (c.usdValue || 0), 0);

      setCards(cardsWithBalance);
      setChains(chainBalances);
      setTotalUsd(totalCards + totalChainUsd);
      setLoading(false);
    } catch (err) {
      setError('Failed to load wallet data');
      setLoading(false);
      console.error(err);
    }
  }, []);

  const updateSpending = useCallback((config: Partial<SpendingConfig>) => {
    setSpending(prev => ({ ...prev, ...config }));
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      const updated = { ...spending, ...config };
      localStorage.setItem('spending_config', JSON.stringify(updated));
    }
  }, [spending]);

  useEffect(() => {
    // Load spending config from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spending_config');
      if (saved) {
        try { setSpending(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
    loadData();

    // Pause polling when tab is hidden to save resources
    let interval = setInterval(loadData, 60000);
    const handleVisibility = () => {
      clearInterval(interval);
      if (!document.hidden) {
        loadData(); // refresh immediately when tab becomes visible
        interval = setInterval(loadData, 60000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  return { cards, chains, spending, totalUsd, loading, error, refresh: loadData, updateSpending };
}
