'use client';

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from './store';

let supabase: SupabaseClient | null = null;
let channel: RealtimeChannel | null = null;
let agentId: string | null = null;

type ChangeCallback = (payload: {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

/**
 * Initialize Supabase realtime — fetches config from backend, then subscribes.
 * Call once on app startup.
 */
export async function initRealtime(onChange: ChangeCallback): Promise<() => void> {
  const config = getConfig();
  if (!config.apiKey || !config.apiBase) return () => {};

  try {
    // Fetch Supabase config from our backend
    const resp = await fetch(`${config.apiBase}/cards/config/realtime`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    const data = await resp.json();

    if (!data.success || !data.supabase_url || !data.supabase_anon_key) {
      console.warn('[Realtime] Missing Supabase config from backend');
      return () => {};
    }

    agentId = data.agent_id;

    // Create Supabase client
    supabase = createClient(data.supabase_url, data.supabase_anon_key, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });

    // Subscribe to changes on all relevant tables filtered by agent_id
    channel = supabase
      .channel('wallet-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_orders',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          onChange({
            table: 'card_orders',
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: (payload.new || {}) as Record<string, unknown>,
            old: (payload.old || {}) as Record<string, unknown>,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_transactions',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          onChange({
            table: 'card_transactions',
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: (payload.new || {}) as Record<string, unknown>,
            old: (payload.old || {}) as Record<string, unknown>,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onchain_transactions',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          onChange({
            table: 'onchain_transactions',
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: (payload.new || {}) as Record<string, unknown>,
            old: (payload.old || {}) as Record<string, unknown>,
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    // Return cleanup function
    return () => {
      if (channel) {
        supabase?.removeChannel(channel);
        channel = null;
      }
    };
  } catch (err) {
    console.error('[Realtime] Init failed:', err);
    return () => {};
  }
}

export function getAgentId(): string | null {
  return agentId;
}
