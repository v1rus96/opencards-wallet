'use client';

import { useState, useEffect, useCallback } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWebApp(): any {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Telegram?.WebApp ?? null;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0 });

  const update = useCallback(() => {
    const wa = getWebApp();
    if (!wa) return;

    const device = wa.safeAreaInset || { top: 0, bottom: 0 };
    const content = wa.contentSafeAreaInset || { top: 0, bottom: 0 };

    let top = (device.top || 0) + (content.top || 0);
    if (wa.isFullscreen && top < 80) {
      top = wa.platform === 'ios' ? 100 : 80;
    }

    setInsets({ top, bottom: (device.bottom || 0) + (content.bottom || 0) });
  }, []);

  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;

    update();
    wa.onEvent?.('safeAreaChanged', update);
    wa.onEvent?.('contentSafeAreaChanged', update);
    wa.onEvent?.('fullscreenChanged', update);

    const interval = setInterval(update, 500);
    return () => {
      wa.offEvent?.('safeAreaChanged', update);
      wa.offEvent?.('contentSafeAreaChanged', update);
      wa.offEvent?.('fullscreenChanged', update);
      clearInterval(interval);
    };
  }, [update]);

  return insets;
}

export function useTelegram() {
  useEffect(() => {
    const wa = getWebApp();
    if (!wa) return;
    wa.ready?.();
    wa.expand?.();
    wa.requestFullscreen?.();
    wa.setHeaderColor?.('#09090b');
    wa.setBackgroundColor?.('#09090b');
    wa.disableVerticalSwipes?.();
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection') => {
    const wa = getWebApp();
    if (!wa?.HapticFeedback) return;
    if (type === 'selection') wa.HapticFeedback.selectionChanged();
    else if (['success', 'error'].includes(type)) wa.HapticFeedback.notificationOccurred(type);
    else wa.HapticFeedback.impactOccurred(type);
  }, []);

  return { haptic };
}
