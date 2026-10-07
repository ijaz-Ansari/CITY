import React, { useState } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallBannerProps {
  onOpenModal: () => void;
}

export const AndroidInstallBanner: React.FC<AndroidInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Do not show if already installed in standalone mode or dismissed in session
  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white border-b border-red-900/50 px-4 py-2 sm:py-2.5 shadow-sm no-print relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                Android App Available
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-slate-200 truncate">
                Install on Android phone for 1-tap launcher access & offline slips
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isInstallable ? (
            <button
              onClick={() => install()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : (
            <button
              onClick={onOpenModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get Android App</span>
            </button>
          )}

          <button
            onClick={onOpenModal}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer hidden md:inline-flex items-center space-x-1"
          >
            <span>APK Package</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
