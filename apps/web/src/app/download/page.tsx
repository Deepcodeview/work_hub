'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  Info,
  ExternalLink,
} from '../../components/icons';

export default function DownloadPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadApk = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/downloads/workhub-v1.0.0.apk';
    link.download = 'workhub-v1.0.0.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 3000);
  };

  const handleInstallPWA = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setInstallPrompt(null);
        return;
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    }
    // If browser didn't emit beforeinstallprompt (e.g. iOS or HTTP), open guide
    setShowPwaGuide(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 touch-pan-y">
      {/* Toast Notification */}
      {downloading && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-emerald-600 animate-bounce" />
            <div>
              <p className="font-bold text-sm text-emerald-900">Direct APK Download Started!</p>
              <p className="text-emerald-700 font-normal">File <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">workhub-v1.0.0.apk</code> is downloading to your device.</p>
            </div>
          </div>
          <button onClick={() => setDownloading(false)} className="font-bold p-1 text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FF981A] via-[#FF7A00] to-[#E66E00] p-6 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-orange-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Mobile Apps & PWA v1.0.0
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            WorkHub Mobile App & PWA
          </h1>
          <p className="text-sm sm:text-base text-white/95 leading-relaxed mb-6">
            Install WorkHub directly on your Android phone or iPhone. Get GPS-geofenced attendance punch, real-time stopwatch, instant leave requests, and role-based enterprise operations in the palm of your hand.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadApk}
              className="px-6 py-3.5 rounded-full bg-white text-[#FF7A00] font-bold text-xs sm:text-sm hover:bg-[#FFF8F0] shadow-lg transition-all flex items-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4 text-[#FF7A00]" />
              <span>{downloading ? 'Downloading...' : 'Download Android APK (Direct)'}</span>
            </button>

            <button
              onClick={handleInstallPWA}
              className="px-6 py-3.5 rounded-full bg-black/25 hover:bg-black/35 border border-white/40 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isInstalled ? 'PWA Installed ✓' : 'Install PWA Web App'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION 1: Android Native APK */}
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl border border-emerald-100">
                🤖
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Full Native Package
              </span>
            </div>

            <h3 className="font-bold text-lg text-[#1F2937] mb-1">Android Standalone APK</h3>
            <p className="text-xs text-[#8A92A6] mb-5">
              Genuine compiled Android application package with full hardware GPS, biometric readiness, and offline retry screen.
            </p>

            <div className="space-y-2.5 text-xs text-[#64748B] mb-6">
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">Package ID:</span>
                <code className="font-mono font-bold text-[#1F2937]">com.workhub.mobile</code>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">Android Target:</span>
                <span className="font-semibold text-[#1F2937]">Android 7.0 (API 24) to Android 15</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">Digital Signatures:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> APK Scheme v2 + v3 Signed
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#F5F2EB]">
                <span className="text-[#8A92A6]">GPS Geofencing:</span>
                <span className="font-semibold text-emerald-600">Enabled (FINE & COARSE)</span>
              </div>
            </div>

            {/* APK Installation Guide Toggle */}
            <div className="mb-4">
              <button
                onClick={() => setShowApkGuide(!showApkGuide)}
                className="w-full text-left text-xs font-semibold text-[#FF7A00] flex items-center justify-between p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <span>📖 How to install APK on your phone</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showApkGuide ? 'rotate-180' : ''}`} />
              </button>

              {showApkGuide && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE4D8] text-xs text-[#64748B] space-y-2 animate-in fade-in">
                  <p className="font-bold text-[#1F2937]">3 Simple Steps to Install:</p>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>Tap <strong>"Download Android APK"</strong> below.</li>
                    <li>Open the downloaded <code className="bg-white px-1 rounded font-mono text-[#1F2937]">workhub-v1.0.0.apk</code> from Chrome's Downloads or Notification bar.</li>
                    <li>Tap <strong>"Install"</strong>. If your phone asks for permission to <em>"Install unknown apps"</em>, tap <strong>Settings</strong> and toggle <strong>"Allow from this source"</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1ECE4] space-y-2">
            <button
              onClick={handleDownloadApk}
              className="w-full py-3.5 rounded-full bg-[#1F2937] hover:bg-[#111827] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md active:scale-98"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{downloading ? 'Downloading APK...' : 'Download APK (workhub-v1.0.0.apk)'}</span>
            </button>
            <p className="text-[10px] text-center text-[#8A92A6]">
              Direct download link • No third-party store required
            </p>
          </div>
        </div>

        {/* OPTION 2: Progressive Web App (PWA) */}
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl border border-orange-100">
                ⚡
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-[#FF7A00] text-[10px] font-bold uppercase tracking-wider">
                Instant / Zero Storage
              </span>
            </div>

            <h3 className="font-bold text-lg text-[#1F2937] mb-1">Progressive Web App (PWA)</h3>
            <p className="text-xs text-[#8A92A6] mb-5">
              Works instantly on both Android and iPhone without downloading any installer file. Saves directly to your home screen.
            </p>

            <div className="space-y-2.5 text-xs text-[#64748B] mb-6">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                <div className="flex items-center gap-2 font-bold text-[#1F2937] mb-1">
                  <span>📱 Android (Chrome / Edge / Samsung Internet):</span>
                </div>
                <p className="leading-relaxed">
                  Tap the <strong>3 vertical dots (⋮)</strong> in Chrome's top-right corner, then tap <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                <div className="flex items-center gap-2 font-bold text-[#1F2937] mb-1">
                  <span>🍏 iPhone / iPad (Safari):</span>
                </div>
                <p className="leading-relaxed">
                  Tap the <strong>Share</strong> button (box with upward arrow <span className="font-mono">⎋</span>), scroll down, and select <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>

            {/* PWA Info banner */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                WorkHub includes an active Service Worker (<code className="font-mono text-amber-950">sw.js</code>) and standalone manifest for offline caching and smooth fullscreen operation.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1ECE4] space-y-2 mt-4">
            <button
              onClick={handleInstallPWA}
              className="w-full py-3.5 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isInstalled ? 'WorkHub Installed on Home Screen ✓' : 'Install PWA Web App'}</span>
            </button>
            <p className="text-[10px] text-center text-[#8A92A6]">
              {isInstalled ? 'Running in standalone application mode' : 'Tap above to install or view device guide'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 sm:p-8 shadow-xs">
        <h3 className="font-bold text-base text-[#1F2937] mb-4">Mobile Experience Highlights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center mb-2">
              <MapPin className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1F2937] mb-1">GPS Geofence Punch</h4>
            <p className="text-[#8A92A6] leading-relaxed">
              Verify office presence within 25 meters before clocking in. Remote work automatically records coordinates.
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1F2937] mb-1">Live Shift Stopwatch</h4>
            <p className="text-[#8A92A6] leading-relaxed">
              Real-time work stopwatch keeps ticking accurately even when your phone is locked or offline.
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#1F2937] mb-1">AI Copilot On The Go</h4>
            <p className="text-[#8A92A6] leading-relaxed">
              Draft customer emails, schedule meetings, and generate sprint updates right from your phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
