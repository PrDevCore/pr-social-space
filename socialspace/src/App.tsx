import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { Composer } from './components/Composer';
import { PostList } from './components/PostList';
import { AccountsGrid } from './components/AccountsGrid';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ApiLogsModal } from './components/ApiLogsModal';
import { Post, SocialAccount, ApiLog, PlatformId, ApiVerificationResult } from './types';
import { Share2, PenTool, Layers, Radio, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('pfm_user_api_key') || '');
  const [isKeyVerified, setIsKeyVerified] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<'live' | 'sandbox'>('sandbox');

  // Modals & Navigation
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'composer' | 'posts' | 'channels'>('composer');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial posts, accounts, and logs
  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/post-for-me/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/post-for-me/logs');
      if (res.ok) {
        const data = await res.json();
        setApiLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/post-for-me/accounts?apiKey=${encodeURIComponent(apiKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
        }
      }
    } catch (e) {
      console.error('Failed to fetch accounts:', e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchLogs();
    fetchAccounts();
  }, []);

  const handleVerifyKey = async (keyToTest: string): Promise<ApiVerificationResult> => {
    const res = await fetch('/api/post-for-me/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: keyToTest })
    });
    const result = await res.json();
    fetchLogs();

    if (result.ok && result.data) {
      setIsKeyVerified(true);
      setApiMode(result.data.environment === 'live' ? 'live' : 'sandbox');
      return {
        valid: true,
        organization: result.data.organization,
        environment: result.data.environment,
        message: result.data.message || 'Key verified successfully'
      };
    } else {
      return {
        valid: false,
        message: result.data?.error || 'Invalid API Key'
      };
    }
  };

  const handleSaveKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('pfm_user_api_key', newKey);
    if (newKey) {
      handleVerifyKey(newKey);
      showToast('API Key saved successfully!', 'success');
    } else {
      setIsKeyVerified(false);
      setApiMode('sandbox');
      showToast('API key cleared. Running in Sandbox simulation mode.', 'info');
    }
  };

  // BACKEND API ENDPOINT HANDLERS
  const handlePublishNow = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => {
    try {
      const res = await fetch('/api/post-for-me/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userApiKey: apiKey
        })
      });
      const result = await res.json();
      await fetchPosts();
      await fetchLogs();

      if (res.ok) {
        showToast(`Published successfully to ${data.platforms.length} platform(s)!`, 'success');
      } else {
        showToast(result.error || 'Failed to publish post', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error executing publish request', 'error');
    }
  };

  const handleSchedulePost = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[]; scheduledAt: string }) => {
    try {
      const res = await fetch('/api/post-for-me/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userApiKey: apiKey
        })
      });
      const result = await res.json();
      await fetchPosts();
      await fetchLogs();

      if (res.ok) {
        showToast(`Post scheduled for ${new Date(data.scheduledAt).toLocaleString()}`, 'success');
      } else {
        showToast(result.error || 'Failed to schedule post', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error executing schedule request', 'error');
    }
  };

  const handleSaveDraft = async (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => {
    try {
      const res = await fetch('/api/post-for-me/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await fetchPosts();
      if (res.ok) {
        showToast('Draft saved successfully', 'info');
      }
    } catch (err: any) {
      showToast('Failed to save draft', 'error');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/post-for-me/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userApiKey: apiKey })
      });
      await fetchPosts();
      await fetchLogs();
      if (res.ok) {
        showToast('Post deleted / publication cancelled', 'info');
      }
    } catch (err: any) {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleRetryPost = async (id: string) => {
    try {
      const res = await fetch(`/api/post-for-me/posts/${id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userApiKey: apiKey })
      });
      await fetchPosts();
      await fetchLogs();
      if (res.ok) {
        showToast('Post re-dispatched!', 'success');
      }
    } catch (err: any) {
      showToast('Failed to retry post', 'error');
    }
  };

  const handleGenerateAi = async (prompt: string, platforms: PlatformId[], tone: string) => {
    try {
      const res = await fetch('/api/post-for-me/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platforms, tone })
      });
      const result = await res.json();
      return result.caption;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white pb-16">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-500/40'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        apiKey={apiKey}
        isKeyVerified={isKeyVerified}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onOpenLogsModal={() => setShowLogsModal(true)}
        onOpenComposer={() => setActiveTab('composer')}
        apiMode={apiMode}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Analytics & Metrics Overview */}
        <StatsOverview
          posts={posts}
          accounts={accounts}
          apiKey={apiKey}
          isVerified={isKeyVerified}
        />

        {/* Dashboard View Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('composer')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition ${
                activeTab === 'composer'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Post Composer</span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Post Queue & Stream ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition ${
                activeTab === 'channels'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Connected Channels</span>
            </button>
          </div>

          <button
            onClick={() => setShowLogsModal(true)}
            className="hidden md:flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open API Inspector ({apiLogs.length})</span>
          </button>
        </div>

        {/* Dynamic View Sections */}
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
              onInspectPayload={() => setShowLogsModal(true)}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <PostList
            posts={posts}
            onDeletePost={handleDeletePost}
            onRetryPost={handleRetryPost}
            onInspectPayload={() => setShowLogsModal(true)}
          />
        )}

        {activeTab === 'channels' && (
          <AccountsGrid
            accounts={accounts}
            onSyncAccounts={fetchAccounts}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveKey}
        onVerifyKey={handleVerifyKey}
      />

      {/* Raw HTTP API Inspector Logs Modal */}
      <ApiLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={apiLogs}
        onRefreshLogs={fetchLogs}
      />
    </div>
  );
}
