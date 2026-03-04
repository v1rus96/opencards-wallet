'use client';

import { useState } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import { SpendingConfig } from '@/types';

interface Props {
  config: SpendingConfig;
  onUpdate: (config: Partial<SpendingConfig>) => void;
  totalSpent?: number;
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2.5 flex justify-between">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span className="font-mono text-xs font-semibold text-white">
          ${value.toLocaleString()} / ${max.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EditField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const save = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num > 0) onSave(num);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-zinc-400">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-right text-sm font-semibold text-white outline-none focus:border-primary"
            autoFocus
          />
          <button onClick={save} className="text-primary"><Check size={16} /></button>
          <button onClick={() => setEditing(false)} className="text-zinc-500"><X size={16} /></button>
        </div>
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="font-mono text-sm font-semibold text-white"
        >
          ${value.toLocaleString()}
        </button>
      )}
    </div>
  );
}

export function SpendingBudget({ config, onUpdate, totalSpent = 0 }: Props) {
  return (
    <div className="space-y-3">
      <ProgressBar value={totalSpent} max={config.dailyLimit} label="Daily" />
      <ProgressBar value={totalSpent} max={config.monthlyLimit} label="Monthly" />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Configure Limits</p>
        <div className="divide-y divide-zinc-800">
          <EditField label="Auto-approve below" value={config.autoApproveBelow} onSave={v => onUpdate({ autoApproveBelow: v })} />
          <EditField label="Approval threshold" value={config.approvalThreshold} onSave={v => onUpdate({ approvalThreshold: v })} />
          <EditField label="Daily limit" value={config.dailyLimit} onSave={v => onUpdate({ dailyLimit: v })} />
          <EditField label="Monthly limit" value={config.monthlyLimit} onSave={v => onUpdate({ monthlyLimit: v })} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Always Require Approval</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.alwaysRequireApproval.map(action => (
            <span key={action} className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
