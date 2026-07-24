import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert, Radio, Users, ExternalLink } from 'lucide-react';
import { SocialAccount, PlatformId } from '@/lib/socialspace-types';
import { PLATFORMS } from '@/lib/socialspace-data';

interface AccountsGridProps {
  accounts: SocialAccount[];
  onSyncAccounts: () => Promise<void>;
  onOpenKeyModal: () => void;
}

export const AccountsGrid: React.FC<AccountsGridProps> = ({ accounts, onSyncAccounts, onOpenKeyModal }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => { setSyncing(true); try { await onSyncAccounts(); } finally { setSyncing(false); } };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            <span>Connected Social Media Channels</span>
          </h2>
          <p className="text-xs text-slate-500">Authorized social channels ready for automated cross-platform posting</p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${syncing ? 'animate-spin' : ''}`} />
          <span>Sync Connected Accounts</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {(Object.keys(PLATFORMS) as PlatformId[]).map((pId) => {
          const platform = PLATFORMS[pId];
          const account = accounts.find((a) => a.platform === pId);
          const isConnected = account ? account.status === 'connected' : false;

          return (
            <div key={pId} className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs bg-white text-slate-800 border border-slate-200">{platform.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{platform.name}</h3>
                    <p className="text-[11px] font-mono text-slate-500">{account?.handle || platform.handleExample}</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Not connected</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-800 font-semibold">{account ? account.followerCount.toLocaleString() : '—'}</span>
                  <span>Audience</span>
                </div>
                <button onClick={onOpenKeyModal} className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold">
                  <span>Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
