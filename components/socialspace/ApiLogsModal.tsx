import React, { useState } from 'react';
import { X, Terminal, RefreshCw, CheckCircle2, AlertCircle, Copy, Check, Clock, Server } from 'lucide-react';
import { ApiLog } from '@/lib/socialspace-types';

interface ApiLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ApiLog[];
  onRefreshLogs: () => Promise<void>;
}

export const ApiLogsModal: React.FC<ApiLogsModalProps> = ({ isOpen, onClose, logs, onRefreshLogs }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleRefresh = async () => { setRefreshing(true); try { await onRefreshLogs(); } finally { setRefreshing(false); } };

  const copyJson = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => filterMethod === 'ALL' || log.method === filterMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full h-[85vh] flex flex-col text-slate-800 shadow-2xl relative overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold"><Terminal className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>HTTP API Execution Inspector</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-100 text-blue-800 border border-blue-200">{logs.length} Executed Calls</span>
              </h3>
              <p className="text-xs text-slate-500">Live inspection of HTTP requests, payload bodies, headers, and status codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Refresh logs">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filter Method:</span>
            {['ALL', 'POST', 'GET', 'DELETE'].map((m) => (
              <button key={m} onClick={() => setFilterMethod(m)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition ${filterMethod === m ? 'bg-blue-600 text-white font-bold' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-sans">
              <Server className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>No API execution logs recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Publish or schedule a post to see HTTP payloads dispatched.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
              const reqJson = JSON.stringify(log.requestBody || {}, null, 2);
              const resJson = JSON.stringify(log.responseBody || {}, null, 2);
              return (
                <div key={log.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${log.method === 'POST' ? 'bg-blue-50 text-blue-700 border border-blue-200' : log.method === 'DELETE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{log.method}</span>
                      <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 font-bold ${isSuccess ? 'text-emerald-600' : 'text-rose-600'}`}>{isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}{log.statusCode}</span>
                      <span className="text-slate-500 text-[11px] flex items-center gap-1"><Clock className="w-3 h-3" /> {log.durationMs}ms</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${log.isSimulated ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{log.isSimulated ? 'Sim' : 'Live'}</span>
                    </div>
                  </div>
                  <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                        <span>Request Body</span>
                        <button onClick={() => copyJson(reqJson, `${log.id}_req`)} className="hover:text-slate-800 flex items-center gap-1">{copiedId === `${log.id}_req` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}<span>Copy</span></button>
                      </div>
                      <pre className="p-2.5 rounded-md bg-white border border-slate-200 text-slate-800 overflow-x-auto max-h-40 leading-relaxed">{reqJson}</pre>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                        <span>Response Body</span>
                        <button onClick={() => copyJson(resJson, `${log.id}_res`)} className="hover:text-slate-800 flex items-center gap-1">{copiedId === `${log.id}_res` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}<span>Copy</span></button>
                      </div>
                      <pre className="p-2.5 rounded-md bg-white border border-slate-200 text-slate-800 overflow-x-auto max-h-40 leading-relaxed">{resJson}</pre>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
