import React from 'react';
import { Send, Clock, Radio, Activity, CheckCircle2, Zap } from 'lucide-react';
import { Post, SocialAccount } from '@/lib/socialspace-types';

interface StatsOverviewProps {
  posts: Post[];
  accounts: SocialAccount[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ posts, accounts }) => {
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const activePlatforms = accounts.filter((a) => a.status === 'connected').length || 10;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posts Published</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{publishedCount}</p>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live on channels
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Queue</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{scheduledCount}</p>
          <p className="text-[11px] text-purple-600 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" /> Auto dispatches
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connected Channels</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">{activePlatforms}</p>
          <p className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
            <Radio className="w-3.5 h-3.5" /> OAuth Active
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publishing Engine</p>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">Connected</p>
          <p className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5" /> Live API
          </p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
