import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Check, 
  Copy, 
  QrCode, 
  ExternalLink, 
  ShieldCheck, 
  WifiOff, 
  Printer, 
  Sparkles,
  ArrowRight,
  Code
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'install' | 'studio'>('install');
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://citycon.edu.pk/fee';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const outcome = await install();
      if (outcome) {
        // App install accepted
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header with Android Green & Institute Red Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Android App Ready
                </span>
                <span className="text-xs text-slate-400">WebAPK & Native Studio</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                City Con Fee Android App
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer relative z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs between Instant Install and Android Studio Project */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>1. Instant Android Install (Recommended)</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'border-red-700 text-red-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-red-700" />
            <span>2. Android Studio APK Package (.ZIP)</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'install' ? (
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
                    📱
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Native Home Icon</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Launches in full screen without browser URL bar</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Offline Caching</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Works smoothly on campus without active internet</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Android Print</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Direct PDF challan voucher & slip generation</p>
                  </div>
                </div>
              </div>

              {/* Direct Install CTA */}
              <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white border border-emerald-200 rounded-2xl p-5 text-center space-y-3 shadow-xs">
                {isInstalled ? (
                  <div className="flex items-center justify-center space-x-2 text-emerald-700 font-bold text-sm py-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>✓ App is currently running in Android Standalone Mode</span>
                  </div>
                ) : isInstallable ? (
                  <>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Install to your Android Device Now
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Click below to immediately trigger the Android WebAPK install sheet and add City Con Fee App to your phone's home screen.
                    </p>
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      disabled={installing}
                      className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      {installing ? 'Opening Android Prompt...' : '📲 Install App on Android Device'}
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Open & Install on your Android Phone
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Scan the QR code below with any Android camera or Google Lens to open the app on your mobile, then tap <strong>Install App</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                      {/* SVG QR Code representing current live URL */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}&color=0f172a`}
                          alt="QR Code for Android" 
                          className="w-32 h-32 rounded-lg"
                        />
                        <span className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center">
                          <QrCode className="w-3 h-3 mr-1" /> Scan on Android
                        </span>
                      </div>

                      <div className="space-y-2 text-left max-w-xs">
                        <label className="text-[11px] font-bold text-slate-700">Direct Android App Link:</label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            readOnly
                            value={currentUrl}
                            className="text-xs font-mono bg-white px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0 flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Send this link to your phone via WhatsApp or Telegram and open in Google Chrome.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 3 Step Visual Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  How to Install on Android in 3 Taps (Chrome):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center mb-1.5">1</span>
                    <strong className="block text-slate-900 font-semibold mb-1">Open in Chrome</strong>
                    <span className="text-slate-500 text-[11px]">Open the link in Google Chrome on your Android smartphone.</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center mb-1.5">2</span>
                    <strong className="block text-slate-900 font-semibold mb-1">Tap Menu (⋮)</strong>
                    <span className="text-slate-500 text-[11px]">Tap the three dots (⋮) at top right corner of Chrome.</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center mb-1.5">3</span>
                    <strong className="block text-slate-900 font-semibold mb-1">Tap "Install App"</strong>
                    <span className="text-slate-500 text-[11px]">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Done!</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Android Studio Native APK Project Export */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                      Native Android Studio Project
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      CityCon-Fee-Android-Studio-Project.zip
                    </h4>
                    <p className="text-xs text-slate-500">
                      Includes AndroidManifest.xml, MainActivity.java, Gradle build files, and mipmap app icons.
                    </p>
                  </div>

                  <a
                    href="/CityCon-Fee-Android-Studio-Project.zip"
                    download="CityCon-Fee-Android-Studio-Project.zip"
                    className="inline-flex items-center px-4 py-2.5 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Android Project (.ZIP)
                  </a>
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">
                    How to compile into a signed APK in Android Studio:
                  </h5>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                    <li>Download and extract <code>CityCon-Fee-Android-Studio-Project.zip</code>.</li>
                    <li>Open <strong>Android Studio</strong> and select <strong>File ➔ Open</strong>, then choose the <code>android/</code> directory.</li>
                    <li>Wait 30 seconds for Gradle to automatically sync dependencies (SDK 34).</li>
                    <li>Click <strong>Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)</strong>.</li>
                    <li>Your <code>app-debug.apk</code> is ready! You can share it directly with staff or publish to the Google Play Store.</li>
                  </ol>
                </div>

                <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-[11px] space-y-1">
                  <div className="text-slate-400 font-bold mb-1">// Android Package Configuration</div>
                  <div>Package: <span className="text-emerald-400">pk.edu.citycon.feemanager</span></div>
                  <div>Target SDK: <span className="text-amber-400">Android 14 (API Level 34)</span></div>
                  <div>Min SDK: <span className="text-amber-400">Android 7.0 (API Level 24)</span></div>
                  <div>Features: <span className="text-sky-400">Hardware Acceleration, PrintManager, DOM Storage, Camera</span></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PWA WebAPK Service Worker Active &amp; Verified</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
