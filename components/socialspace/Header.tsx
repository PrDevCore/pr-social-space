import React from 'react';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  onOpenKeyModal: () => void;
  onOpenLogsModal: () => void;
  onOpenComposer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenKeyModal,
  onOpenLogsModal,
  onOpenComposer
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/30 shrink-0">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">SocialSpace</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Pro Edition
              </span>
            </div>
            <p className="text-xs text-slate-400">Cross-platform publishing & scheduling dashboard</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenComposer}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>
    </header>
  );
};
