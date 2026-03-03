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
      const [orders, solBal, solUsdc, baseEth, baseUsdc] = await Promise.all([
        api.getOrders(),
        api.getSolBalance(),
        api.getSolUsdcBalance(),
        api.getBaseEthBalance(),
        api.getBaseUsdcBalance(),
      ]);

      // Get live balances for each card
      const completedOrders = orders.filter((o: CardOrder) => o.status === 'completed');
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
        { chain: 'Base (Sepolia)', icon: '🔵', symbol: 'ETH', balance: baseEth },
        { chain: 'Solana (Devnet)', icon: '💎', symbol: 'SOL', balance: solBal },
        { chain: 'USDC (Base)', icon: '💵', symbol: 'USDC', balance: baseUsdc },
        { chain: 'USDC (Solana)', icon: '💵', symbol: 'USDC', balance: solUsdc },
      ];

      setCards(cardsWithBalance);
      setChains(chainBalances);
      setTotalUsd(totalCards + baseUsdc + solUsdc);
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
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { cards, chains, spending, totalUsd, loading, error, refresh: loadData, updateSpending };
}
