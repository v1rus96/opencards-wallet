'use client';

import { Home, CreditCard, ClipboardList, Settings } from 'lucide-react';

const TABS = [
  { id: 'overview' as const, icon: Home, label: 'Overview' },
  { id: 'cards' as const, icon: CreditCard, label: 'Cards' },
  { id: 'history' as const, icon: ClipboardList, label: 'Activity' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

export type TabId = typeof TABS[number]['id'];

interface Props {
  active: TabId;
  onSelect: (tab: TabId) => void;
  bottomInset: number;
}

export function TabBar({ active, onSelect, bottomInset }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl"
      style={{ paddingBottom: Math.max(8, bottomInset) }}
    >
      {TABS.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex flex-col items-center px-3 pb-1 pt-2.5 text-[10px] font-medium transition-colors ${
              active === tab.id ? 'text-teal-400' : 'text-zinc-500'
            }`}
          >
            <Icon size={20} className="mb-0.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
