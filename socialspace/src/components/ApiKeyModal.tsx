import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { ApiVerificationResult } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  onVerifyKey: (keyToTest: string) => Promise<ApiVerificationResult>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  onVerifyKey
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ApiVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setError(null);
    try {
      const res = await onVerifyKey(inputKey);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification request failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveKey(inputKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 text-slate-800 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Publishing API Settings</h3>
            <p className="text-xs text-slate-500">Configure API credentials for live cross-platform publishing</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Publishing API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="api_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              <span>Provide an optional API key for live channel dispatching, or leave blank to use simulated sandbox mode.</span>
            </p>
          </div>

          {/* Test connection results */}
          {result && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                result.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {result.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.organization && <p className="mt-0.5 opacity-80">Org: {result.organization}</p>}
                <p className="mt-0.5 opacity-80">Environment: {result.environment || 'sandbox'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Note about API Simulation mode */}
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>API Gateway Execution Mode</span>
            </div>
            <p className="text-blue-700 leading-relaxed">
              All action buttons in this dashboard hit backend server endpoints. When a key is supplied, live requests are authenticated and dispatched. If left empty, a live sandbox mode is used with full inspector logging.
            </p>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
            <span>Test Endpoint Connection</span>
          </button>
          <button
            onClick={handleSave}
            className="text-xs font-semibold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition"
          >
            Save Key & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
