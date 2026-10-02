import { useEffect, useRef } from 'react';

export type SyncDomain = 
  | 'transactions' 
  | 'accounts' 
  | 'creditCards' 
  | 'budgets' 
  | 'goals' 
  | 'categories'
  | 'all';

export interface DataSyncDetail {
  domains: SyncDomain[];
  timestamp: number;
  sourceTabId?: string;
}

const EVENT_NAME = 'app_gastos_datasync';
const CHANNEL_NAME = 'app_gastos_sync_channel';

// Unique session/tab identifier to avoid echo loops
const currentTabId = Math.random().toString(36).substring(2, 11);

// Internal local event bus
const syncBus = new EventTarget();

// Multi-tab / multi-window bridge
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event: MessageEvent<DataSyncDetail>) => {
      if (event.data && event.data.sourceTabId !== currentTabId) {
        // Dispatch locally without echoing back to channel
        dispatchLocal(event.data.domains, event.data.sourceTabId);
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel initialization failed; cross-tab sync will use local bus only', err);
  }
}

function dispatchLocal(domains: SyncDomain[], sourceTabId?: string) {
  const detail: DataSyncDetail = {
    domains,
    timestamp: Date.now(),
    sourceTabId
  };
  syncBus.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

/**
 * Broadcasts a data change notification to all active views and open tabs.
 */
export function notifyDataSync(domainOrDomains: SyncDomain | SyncDomain[] = 'all'): void {
  const domains = Array.isArray(domainOrDomains) ? domainOrDomains : [domainOrDomains];
  
  // 1. Dispatch in current window
  dispatchLocal(domains, currentTabId);

  // 2. Broadcast to other tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        domains,
        timestamp: Date.now(),
        sourceTabId: currentTabId
      });
    } catch (err) {
      console.error('Failed to post message to BroadcastChannel', err);
    }
  }
}

/**
 * React hook to subscribe a component to domain-specific sync invalidations.
 * Whenever any of the specified domains change, `onSync` is invoked.
 */
export function useDataSync(
  domainOrDomains: SyncDomain | SyncDomain[],
  onSync: () => void | Promise<void>
): void {
  const callbackRef = useRef(onSync);
  useEffect(() => {
    callbackRef.current = onSync;
  });

  const domainsRef = useRef(domainOrDomains);
  useEffect(() => {
    domainsRef.current = domainOrDomains;
  }, [domainOrDomains]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<DataSyncDetail>;
      const changedDomains = customEvent.detail?.domains || [];

      const target = domainsRef.current;
      const subscribed = Array.isArray(target) ? target : [target];

      const shouldSync = 
        subscribed.includes('all') ||
        changedDomains.includes('all') ||
        subscribed.some(domain => changedDomains.includes(domain));

      if (shouldSync && callbackRef.current) {
        callbackRef.current();
      }
    };

    syncBus.addEventListener(EVENT_NAME, handler);
    return () => {
      syncBus.removeEventListener(EVENT_NAME, handler);
    };
  }, []);
}
