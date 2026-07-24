import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, FileText, Trash2, RotateCw, Terminal, Calendar, Layers, Filter } from 'lucide-react';
import { Post } from '@/lib/socialspace-types';
import { PLATFORMS } from '@/lib/socialspace-data';

interface PostListProps {
  posts: Post[];
  onDeletePost: (id: string) => Promise<void>;
  onRetryPost: (id: string) => Promise<void>;
  onInspectPayload: (post: Post) => void;
}

export const PostList: React.FC<PostListProps> = ({ posts, onDeletePost, onRetryPost, onInspectPayload }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'failed'>('all');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const filteredPosts = posts.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  const handleDelete = async (id: string) => { setLoadingActionId(id); try { await onDeletePost(id); } finally { setLoadingActionId(null); } };
  const handleRetry = async (id: string) => { setLoadingActionId(id); try { await onRetryPost(id); } finally { setLoadingActionId(null); } };

  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'published': return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Published</span>;
      case 'scheduled': return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200"><Clock className="w-3.5 h-3.5 text-purple-600" /> Scheduled</span>;
      case 'failed': return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Failed</span>;
      default: return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"><FileText className="w-3.5 h-3.5 text-slate-500" /> Draft</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Social Post Stream & Queue</span>
          </h2>
          <p className="text-xs text-slate-500">Manage live posts, queued schedules, and API execution states</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {[
            { id: 'all', label: `All (${posts.length})` },
            { id: 'published', label: `Published (${posts.filter((p) => p.status === 'published').length})` },
            { id: 'scheduled', label: `Scheduled (${posts.filter((p) => p.status === 'scheduled').length})` },
            { id: 'failed', label: `Failed (${posts.filter((p) => p.status === 'failed').length})` },
            { id: 'draft', label: `Drafts (${posts.filter((p) => p.status === 'draft').length})` }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id as any)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition shrink-0 ${statusFilter === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No posts found in this queue</p>
          <p className="text-xs text-slate-400 mt-1">Compose a new post above to publish across your platforms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="p-4 sm:p-5 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row gap-4 justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(post.status)}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {post.platforms.map((pId) => (
                      <span key={pId} className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-white text-slate-700 border-slate-200">{PLATFORMS[pId]?.name || pId}</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {post.mediaUrls.map((url, i) => (
                      <div key={i} className="w-16 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"><img src={url} alt={`Post media ${i}`} className="w-full h-full object-cover" /></div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span>ID: {post.id}</span>
                  <span>Created: {new Date(post.createdAt).toLocaleDateString()} {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {post.scheduledAt && <span className="text-purple-600 font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> Scheduled: {new Date(post.scheduledAt).toLocaleString()}</span>}
                  {post.error && <span className="text-rose-600 font-medium">Error: {post.error}</span>}
                </div>
              </div>
              <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                <button onClick={() => onInspectPayload(post)} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition" title="Inspect raw Post For Me API response">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inspect API</span>
                </button>
                {(post.status === 'failed' || post.status === 'draft') && (
                  <button onClick={() => handleRetry(post.id)} disabled={loadingActionId === post.id}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition disabled:opacity-50">
                    <RotateCw className={`w-3.5 h-3.5 ${loadingActionId === post.id ? 'animate-spin' : ''}`} />
                    <span>Retry API</span>
                  </button>
                )}
                <button onClick={() => handleDelete(post.id)} disabled={loadingActionId === post.id}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{post.status === 'scheduled' ? 'Cancel Schedule' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
