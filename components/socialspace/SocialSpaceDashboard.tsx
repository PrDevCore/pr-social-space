"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { StatsOverview } from './StatsOverview';
import { Composer } from './Composer';
import { PostList } from './PostList';
import { AccountsGrid } from './AccountsGrid';
import { ApiLogsModal } from './ApiLogsModal';
import { Post, SocialAccount, ApiLog, PlatformId } from '@/lib/socialspace-types';
import { PenTool, Layers, Radio, Terminal } from 'lucide-react';

export default function SocialSpaceDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'composer' | 'posts' | 'channels'>('composer');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [inspectingPost, setInspectingPost] = useState<Post | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/post-for-me/posts');
      if (res.ok) { const data = await res.json(); setPosts(data.posts || []); }
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/post-for-me/logs');
      if (res.ok) { const data = await res.json(); setApiLogs(data.logs || []); }
    } catch {}
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/post-for-me/accounts');
      if (res.ok) { const data = await res.json(); setAccounts(data.accounts || []); }
    } catch {}
  }, []);

  useEffect(() => { fetchPosts(); fetchLogs(); fetchAccounts(); }, [fetchPosts, fetchLogs, fetchAccounts]);

  const handlePublishNow = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => {
    const res = await fetch('/api/post-for-me/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    await fetchPosts(); await fetchLogs();
    if (res.ok) showToast(`Published successfully to ${data.platforms.length} platform(s)!`, 'success');
    else showToast(result.error || 'Failed to publish', 'error');
  };

  const handleSchedulePost = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[]; scheduledAt: string }) => {
    const res = await fetch('/api/post-for-me/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    await fetchPosts(); await fetchLogs();
    if (res.ok) showToast(`Post scheduled for ${new Date(data.scheduledAt).toLocaleString()}`, 'success');
    else showToast('Failed to schedule', 'error');
  };

  const handleSaveDraft = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => {
    const res = await fetch('/api/post-for-me/drafts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    await fetchPosts();
    if (res.ok) showToast('Draft saved', 'info');
  };

  const handleDeletePost = async (id: string) => {
    const res = await fetch(`/api/post-for-me/posts/${id}`, { method: 'DELETE' });
    await fetchPosts(); await fetchLogs();
    if (res.ok) showToast('Post deleted', 'info');
  };

  const handleRetryPost = async (id: string) => {
    const res = await fetch(`/api/post-for-me/posts/${id}/retry`, { method: 'POST' });
    await fetchPosts(); await fetchLogs();
    if (res.ok) showToast('Post retried!', 'success');
  };

  const handleGenerateAi = async (prompt: string, _platforms: PlatformId[], _tone: string) => {
    const res = await fetch('/api/post-for-me/ai-generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, platforms: _platforms, tone: _tone })
    });
    const result = await res.json();
    return result.caption || '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40' :
            toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-500/40' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Header
        onOpenKeyModal={() => {}}
        onOpenLogsModal={() => setShowLogsModal(true)}
        onOpenComposer={() => setActiveTab('composer')}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        <StatsOverview posts={posts} accounts={accounts} />

        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {([
              { id: 'composer', label: 'Post Composer', icon: PenTool },
              { id: 'posts', label: `Post Queue & Stream (${posts.length})`, icon: Layers },
              { id: 'channels', label: 'Connected Channels', icon: Radio }
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                }`}>
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
            <button onClick={() => setShowLogsModal(true)}
              className="md:hidden flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold ml-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>API Logs</span>
            </button>
          </div>
          <button onClick={() => setShowLogsModal(true)}
            className="hidden md:flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Open API Inspector ({apiLogs.length})</span>
          </button>
        </div>

        {activeTab === 'composer' && (
          <div className="space-y-6">
            <Composer
              onPublishNow={handlePublishNow}
              onSchedulePost={handleSchedulePost}
              onSaveDraft={handleSaveDraft}
              onGenerateAiContent={handleGenerateAi}
            />
            <PostList
              posts={posts}
              onDeletePost={handleDeletePost}
              onRetryPost={handleRetryPost}
              onInspectPayload={(p) => { setInspectingPost(p); setShowLogsModal(true); }}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <PostList
            posts={posts}
            onDeletePost={handleDeletePost}
            onRetryPost={handleRetryPost}
            onInspectPayload={(p) => { setInspectingPost(p); setShowLogsModal(true); }}
          />
        )}

        {activeTab === 'channels' && (
          <AccountsGrid
            accounts={accounts}
            onSyncAccounts={fetchAccounts}
            onOpenKeyModal={() => {}}
          />
        )}
      </main>

      <ApiLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={apiLogs}
        onRefreshLogs={fetchLogs}
      />
    </div>
  );
}
