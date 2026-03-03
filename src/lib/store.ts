export interface WalletConfig {
  apiKey: string;
  apiBase: string;
  configured: boolean;
}

const STORAGE_KEY = 'wallet_config';

const DEFAULT_CONFIG: WalletConfig = {
  apiKey: '',
  apiBase: 'https://opencards-api-production.up.railway.app/api/v1',
  configured: false,
};

export function getConfig(): WalletConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(partial: Partial<WalletConfig>) {
  const current = getConfig();
  const updated = { ...current, ...partial, configured: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
