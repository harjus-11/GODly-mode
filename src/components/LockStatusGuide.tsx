import React, { useState } from 'react';
import { ShieldCheck, Smartphone, CheckCircle2, XCircle, HelpCircle, ArrowRight, Layers, Eye } from 'lucide-react';

interface LockStatusGuideProps {
  onNavigateToImei?: () => void;
  onNavigateToCodes?: () => void;
}

export const LockStatusGuide: React.FC<LockStatusGuideProps> = ({ onNavigateToImei, onNavigateToCodes }) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [simState, setSimState] = useState<'unlocked' | 'locked'>('unlocked');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive On-Device Hardware Check</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How to Check If Your Phone Is Already Unlocked
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Over 35% of consumers who look for unlock tools already possess an unlocked device! Test your phone directly through native settings before submitting carrier paperwork.
          </p>
        </div>

        {/* Platform Switcher */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setPlatform('ios')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              platform === 'ios'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Apple iPhone (iOS 14+)</span>
          </button>

          <button
            onClick={() => setPlatform('android')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              platform === 'android'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (Samsung / Pixel / Moto)</span>
          </button>
        </div>
      </div>

      {/* Interactive Mock Settings Screen & Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Step Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>{platform === 'ios' ? 'iPhone Native Verification (30 Seconds)' : 'Android Native Verification'}</span>
          </h3>

          {platform === 'ios' ? (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white">Open the Settings App</strong>
                  <p className="text-slate-400 text-xs mt-0.5">Tap the gear icon on your home screen or App Library.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white">Tap General, then tap About</strong>
                  <p className="text-slate-400 text-xs mt-0.5">This reveals model information, iOS version, and carrier provisioning certificates.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white">Scroll Down to "Carrier Lock"</strong>
                  <p className="text-slate-400 text-xs mt-0.5">Inspect the exact phrasing:</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>"No SIM restrictions"</strong> = Phone is 100% UNLOCKED permanently for all carriers worldwide.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
                      <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>"SIM locked"</strong> = Locked to the specified carrier profile. Must run carrier unlock process.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  Method 1
                </span>
                <div>
                  <strong className="text-white">Test SIM Swap (Most Reliable)</strong>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Insert a friend's active SIM card from a DIFFERENT carrier (e.g., insert a T-Mobile SIM into an AT&T phone).
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    • If phone establishes signal and can make a call: <span className="text-emerald-400 font-bold">UNLOCKED</span>.<br />
                    • If a popup demands "SIM Network Unlock PIN / NCK": <span className="text-amber-400 font-bold">LOCKED</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  Method 2
                </span>
                <div>
                  <strong className="text-white">Samsung Network Unlock Status</strong>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Go to <strong>Settings &gt; Connections &gt; More connection settings &gt; Network Unlock</strong>. Look for status: "Unlocked" or "Locked".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-bold text-xs shrink-0 border border-cyan-800 mt-0.5">
                  Method 3
                </span>
                <div>
                  <strong className="text-white">Samsung USSD Code (Older Models)</strong>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Dial <code className="bg-slate-950 px-1.5 py-0.5 text-cyan-300 font-mono">*#7465625#</code>. It displays the SIMLOCK menu. If "Network Lock" is [OFF], it is unlocked.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive Phone Preview Mockup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="text-xs text-slate-400 mb-4 flex items-center justify-between w-full">
            <span className="font-semibold text-slate-300">Carrier Lock Status Visualizer</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimState('unlocked')}
                className={`text-[11px] px-2.5 py-1 rounded cursor-pointer transition ${
                  simState === 'unlocked' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Verified Unlocked State
              </button>
              <button
                type="button"
                onClick={() => setSimState('locked')}
                className={`text-[11px] px-2.5 py-1 rounded cursor-pointer transition ${
                  simState === 'locked' ? 'bg-amber-900/60 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Carrier-Restricted State
              </button>
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-[320px] rounded-[36px] bg-slate-950 border-4 border-slate-700 p-3 shadow-2xl shadow-cyan-500/10">
            {/* Speaker notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

            {/* Screen Content */}
            <div className="bg-slate-900 rounded-[24px] p-4 font-sans text-white border border-slate-800/80 min-h-[380px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <span>9:41</span>
                  <span>5G • 100%</span>
                </div>

                <div className="text-center py-2">
                  <h4 className="text-xs font-bold text-slate-200">
                    {platform === 'ios' ? 'About iPhone' : 'Connections & Network'}
                  </h4>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-800/50">
                    <span className="text-slate-400">Model Name</span>
                    <span className="font-medium text-slate-200">{platform === 'ios' ? 'iPhone 15 Pro' : 'Galaxy S24'}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-800/50">
                    <span className="text-slate-400">Software Version</span>
                    <span className="font-medium text-slate-200">{platform === 'ios' ? 'iOS 18.1' : 'One UI 6.1'}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-800/50">
                    <span className="text-slate-400">Primary SIM</span>
                    <span className="font-medium text-slate-200">Physical + eSIM Active</span>
                  </div>

                  {/* The Critical Carrier Lock Field */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      simState === 'unlocked'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                        : 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px]">Carrier Lock</span>
                      <span className="font-extrabold text-[12px]">
                        {simState === 'unlocked' ? 'No SIM restrictions' : 'SIM locked'}
                      </span>
                    </div>
                    <div className="text-[10px] mt-1 opacity-80">
                      {simState === 'unlocked'
                        ? '✓ This device may be used on any cellular network worldwide.'
                        : '⚠️ This device is currently restricted to its original carrier.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons & External Guides */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Next Steps &amp; Official References
        </h4>
        <div className="flex flex-wrap gap-3">
          {onNavigateToImei && (
            <button
              onClick={onNavigateToImei}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-2"
            >
              <span>Look Up Phone IMEI Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigateToCodes && (
            <button
              onClick={onNavigateToCodes}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-2"
            >
              <span>Explore Unlock Codes Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href="https://support.apple.com/en-us/109316"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Apple Carrier Lock Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://support.google.com/android/answer/9059108"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Android SIM &amp; Mobile Network Help</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
