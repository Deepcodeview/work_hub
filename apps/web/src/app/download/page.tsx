'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from '../../components/icons';

export default function DownloadPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      alert('To install WorkHub on iOS Safari: tap Share (⎋) > Add to Home Screen.\nOn Chrome/Edge: tap Menu (⋮) > Install App.');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FF981A] via-[#FF7A00] to-[#E66E00] p-6 sm:p-10 text-white relative overflow-hidden shadow-lg shadow-orange-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Mobile Companion v1.0
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Take WorkHub With You Everywhere
          </h1>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6">
            Track daily work hours with verified GPS geofencing, submit weekly timesheets, request leaves, and chat with your AI Workplace Copilot directly on Android and iOS.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/Deepcodeview/work_hub/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-white text-[#FF7A00] font-bold text-xs sm:text-sm hover:bg-[#FFF8F0] shadow-md transition-all flex items-center gap-2 active:scale-98"
            >
              <Download className="w-4 h-4 text-[#FF7A00]" />
              <span>Download Android APK</span>
            </a>

            <button
              onClick={handleInstallPWA}
              className="px-6 py-3 rounded-full bg-black/20 hover:bg-black/30 border border-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isInstalled ? 'App Installed ✓' : 'Install PWA Web App'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Download Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Android APK */}
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4 border border-emerald-100">
              🤖
            </div>
            <h3 className="font-bold text-lg text-[#1F2937] mb-1">Android Standalone APK</h3>
            <p className="text-xs text-[#8A92A6] mb-5">
              Direct installer package for all Android phones and tablets (Samsung, Google Pixel, OnePlus, Xiaomi).
            </p>

            <div className="space-y-2.5 text-xs text-[#64748B] mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Package: <code className="font-mono text-[#1F2937]">com.workhub.mobile</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Target: Android 9.0 (Pie) through Android 15</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Permissions: Fine Location (GPS Geofence), Network</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Size: ~24 MB (Optimized React Native / Expo)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1ECE4]">
            <a
              href="https://github.com/Deepcodeview/work_hub/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-full bg-[#1F2937] hover:bg-[#111827] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Direct APK (v1.0.0)</span>
            </a>
          </div>
        </div>

        {/* Option 2: Progressive Web App (PWA) */}
        <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl mb-4 border border-orange-100">
              ⚡
            </div>
            <h3 className="font-bold text-lg text-[#1F2937] mb-1">Instant PWA (iOS & Android)</h3>
            <p className="text-xs text-[#8A92A6] mb-5">
              Zero-install web application that works offline and saves directly to your device home screen.
            </p>

            <div className="space-y-3 text-xs text-[#64748B] mb-6">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                <span className="font-bold text-[#1F2937] block mb-0.5">iPhone / iPad (iOS Safari):</span>
                <span>Tap the <strong>Share</strong> icon (⎋), scroll down, and select <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
                <span className="font-bold text-[#1F2937] block mb-0.5">Android (Chrome / Edge / Brave):</span>
                <span>Tap the menu dots (⋮) and tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1ECE4]">
            <button
              onClick={handleInstallPWA}
              className="w-full py-3 rounded-full bg-[#FF7A00] hover:bg-[#E66E00] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isInstalled ? 'PWA Ready on Home Screen' : 'Install on This Device'}</span>
            </button>
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
