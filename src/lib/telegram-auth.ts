const API_BASE = 'https://opencards-api-production.up.railway.app/api/v1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWebApp(): any {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Telegram?.WebApp ?? null;
}

export function getTelegramChatId(): string | undefined {
  const tg = getWebApp();
  return tg?.initDataUnsafe?.user?.id?.toString();
}

export function getTelegramStartParam(): string | undefined {
  const tg = getWebApp();
  return tg?.initDataUnsafe?.start_param;
}

export function getTelegramApprovalId(): string | undefined {
  const param = getTelegramStartParam();
  if (param?.startsWith('approve_')) {
    return param.replace('approve_', '');
  }
  return undefined;
}

interface AutoLoginResult {
  success: boolean;
  apiKey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent?: any;
  chatId?: string;
}

export async function handleTelegramAutoLogin(): Promise<AutoLoginResult> {
  const startParam = getTelegramStartParam();
  const chatId = getTelegramChatId();

  if (!startParam || !startParam.startsWith('oc_')) {
    return { success: false };
  }

  const apiKey = startParam;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
    };
    if (chatId) {
      headers['x-telegram-chat-id'] = chatId;
    }

    const res = await fetch(`${API_BASE}/agents/me`, { headers });
    const data = await res.json();

    if (data.success) {
      // Fire-and-forget: explicitly link Telegram
      if (chatId) {
        fetch(`${API_BASE}/agents/link-telegram`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId }),
        }).catch(() => {});
      }

      // Auto-generate wallets if the agent doesn't have any yet
      const walletsRes = await fetch(`${API_BASE}/wallets/me`, { headers });
      const walletsData = await walletsRes.json();

      if (!walletsData.wallets?.length) {
        await fetch(`${API_BASE}/wallets/generate`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ network: 'solana-devnet' }),
        });
        await fetch(`${API_BASE}/wallets/generate`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ network: 'base-sepolia' }),
        });
      }

      return { success: true, apiKey, agent: data.agent, chatId };
    }
  } catch (err) {
    console.error('Telegram auto-login failed:', err);
  }

  return { success: false };
}

/**
 * Link Telegram chat ID to the current agent (fire-and-forget).
 * Call after registration or import so the user gets notifications.
 */
export function linkTelegramChat(apiKey: string) {
  const chatId = getTelegramChatId();
  if (!chatId || !apiKey) return;

  // Send chat ID via header on /agents/me
  fetch(`${API_BASE}/agents/me`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-telegram-chat-id': chatId,
    },
  }).catch(() => {});

  // Explicit link-telegram call as backup
  fetch(`${API_BASE}/agents/link-telegram`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatId }),
  }).catch(() => {});
}
