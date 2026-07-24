import React, { useState } from 'react';
import {
  Send,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  X,
  Plus,
  Eye,
  Loader2,
  Share2,
  HelpCircle
} from 'lucide-react';
import { PlatformId } from '../types';
import { PLATFORMS } from '../data/platforms';

interface ComposerProps {
  onPublishNow: (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => Promise<void>;
  onSchedulePost: (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[]; scheduledAt: string }) => Promise<void>;
  onSaveDraft: (data: { caption: string; platforms: PlatformId[]; mediaUrls: string[] }) => Promise<void>;
  onGenerateAiContent: (prompt: string, platforms: PlatformId[], tone: string) => Promise<string>;
}

export const Composer: React.FC<ComposerProps> = ({
  onPublishNow,
  onSchedulePost,
  onSaveDraft,
  onGenerateAiContent
}) => {
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(['twitter', 'linkedin']);
  const [mediaUrls, setMediaUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
  ]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Default scheduled date = tomorrow 10:00 AM
  const defaultDate = new Date(Date.now() + 86400000);
  defaultDate.setHours(10, 0, 0, 0);
  const [scheduledAt, setScheduledAt] = useState(defaultDate.toISOString().slice(0, 16));

  const [activePreviewTab, setActivePreviewTab] = useState<PlatformId>('twitter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'publish' | 'schedule' | 'draft' | null>(null);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Write an announcement post for our new product feature launch.');
  const [aiTone, setAiTone] = useState('engaging and professional');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Toggle platform
  const togglePlatform = (id: PlatformId) => {
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  // Find strictest max chars among selected platforms
  const strictestMaxChars = Math.min(
    ...selectedPlatforms.map((p) => PLATFORMS[p]?.maxChars || 280)
  );

  const isOverCharLimit = caption.length > strictestMaxChars;

  const handleAddMedia = () => {
    if (newMediaUrl.trim() && !mediaUrls.includes(newMediaUrl.trim())) {
      setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
      setNewMediaUrl('');
    }
  };

  const handleRemoveMedia = (url: string) => {
    setMediaUrls(mediaUrls.filter((u) => u !== url));
  };

  const handlePublish = async () => {
    if (!caption.trim() || selectedPlatforms.length === 0) return;
    setIsSubmitting(true);
    setSubmitMode('publish');
    try {
      await onPublishNow({ caption, platforms: selectedPlatforms, mediaUrls });
      setCaption('');
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  const handleSchedule = async () => {
    if (!caption.trim() || selectedPlatforms.length === 0 || !scheduledAt) return;
    setIsSubmitting(true);
    setSubmitMode('schedule');
    try {
      await onSchedulePost({
        caption,
        platforms: selectedPlatforms,
        mediaUrls,
        scheduledAt: new Date(scheduledAt).toISOString()
      });
      setCaption('');
      setIsScheduling(false);
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  const handleDraft = async () => {
    if (!caption.trim()) return;
    setIsSubmitting(true);
    setSubmitMode('draft');
    try {
      await onSaveDraft({ caption, platforms: selectedPlatforms, mediaUrls });
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  const handleGenerateAi = async () => {
    setIsAiLoading(true);
    try {
      const generated = await onGenerateAiContent(aiPrompt, selectedPlatforms, aiTone);
      if (generated) {
        setCaption(generated);
        setShowAiModal(false);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Composer Card Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Cross-Platform Publisher</h2>
            <p className="text-xs text-slate-500">Compose and publish posts across all your connected social channels</p>
          </div>
        </div>

        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>AI Content Generator</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* 1. Target Social Platforms Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Select Publishing Channels ({selectedPlatforms.length} active)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {(Object.keys(PLATFORMS) as PlatformId[]).map((pId) => {
              const platform = PLATFORMS[pId];
              const isSelected = selectedPlatforms.includes(pId);
              return (
                <button
                  key={pId}
                  type="button"
                  onClick={() => togglePlatform(pId)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                  </div>
                  <span className="truncate">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Caption Editor & Character Gauge */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Post Content / Caption
            </label>
            <div
              className={`text-xs font-mono font-medium ${
                isOverCharLimit ? 'text-rose-600 font-bold' : 'text-slate-500'
              }`}
            >
              {caption.length} / {strictestMaxChars} chars
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What would you like to share across social platforms?"
              className={`w-full bg-white border rounded-lg p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                isOverCharLimit
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            {isOverCharLimit && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Caption exceeds character limit for selected platforms!</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Media Attachments */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Attached Media URLs
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="url"
              value={newMediaUrl}
              onChange={(e) => setNewMediaUrl(e.target.value)}
              placeholder="Paste image or video URL (https://...)"
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddMedia}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Attach Image</span>
            </button>
          </div>

          {/* Quick preset images */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-[11px] text-slate-500">
            <span className="shrink-0 font-medium">Presets:</span>
            {[
              { label: 'Abstract Tech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
              { label: 'Analytics Screen', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' },
              { label: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!mediaUrls.includes(p.url)) setMediaUrls([...mediaUrls, p.url]);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:text-blue-600 transition shrink-0"
              >
                + {p.label}
              </button>
            ))}
          </div>

          {/* Media preview grid */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 w-24 h-20 bg-slate-50">
                  <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(url)}
                    className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Scheduling Options Toggle */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-slate-800">Schedule Post Publication</span>
            </div>
            <button
              type="button"
              onClick={() => setIsScheduling(!isScheduling)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                isScheduling
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isScheduling ? 'Schedule Active' : 'Enable Schedule'}
            </button>
          </div>

          {isScheduling && (
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
              <div className="w-full sm:w-auto">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Target Publication Date & Time (UTC/Local)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic mt-auto pb-1">
                The scheduling engine will automatically dispatch this post at the chosen timestamp.
              </p>
            </div>
          )}
        </div>

        {/* 5. Live Channel Preview Inspector */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Channel Preview Inspector</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {selectedPlatforms.map((pId) => (
                <button
                  key={pId}
                  type="button"
                  onClick={() => setActivePreviewTab(pId)}
                  className={`text-[11px] px-2.5 py-1 rounded-md capitalize font-medium transition ${
                    activePreviewTab === pId
                      ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {PLATFORMS[pId]?.name || pId}
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Channel Card */}
          <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-2.5 max-w-xl mx-auto shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                ME
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs">Your Brand Account</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {PLATFORMS[activePreviewTab]?.handleExample || '@brand'} • Just now
                </p>
              </div>
            </div>

            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
              {caption || <span className="text-slate-400 italic">Type your post caption above to preview...</span>}
            </p>

            {mediaUrls.length > 0 && (
              <div className="rounded-lg overflow-hidden border border-slate-200 max-h-48 bg-slate-900">
                <img src={mediaUrls[0]} alt="Media preview" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* 6. PRIMARY ACTION BUTTONS WIRED DIRECTLY TO POST FOR ME ENDPOINTS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDraft}
            disabled={isSubmitting || !caption.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50"
          >
            {isSubmitting && submitMode === 'draft' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <FileText className="w-4 h-4 text-slate-500" />
            )}
            <span>Save Draft</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {isScheduling ? (
              <button
                type="button"
                onClick={handleSchedule}
                disabled={isSubmitting || !caption.trim() || isOverCharLimit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 transition disabled:opacity-50 active:scale-95"
              >
                {isSubmitting && submitMode === 'schedule' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>Schedule Publication</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || !caption.trim() || isOverCharLimit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition disabled:opacity-50 active:scale-95"
              >
                {isSubmitting && submitMode === 'publish' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Publish Now</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Modal Popup */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Gemini Social AI Assistant</h3>
                <p className="text-xs text-slate-500">Generate platform-optimized social posts</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic or Brief</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tone & Voice</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="engaging and professional">Engaging & Professional</option>
                  <option value="casual and friendly">Casual & Friendly</option>
                  <option value="bold and visionary">Bold & Visionary</option>
                  <option value="educational and helpful">Educational & Helpful</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAi}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200 transition disabled:opacity-50"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Post Text</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
