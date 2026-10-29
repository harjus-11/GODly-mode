import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Smartphone, Shield, ExternalLink, RefreshCw, Cpu, HelpCircle, Info } from 'lucide-react';
import { ImeiAnalysisResult } from '../types.ts';
import { CARRIERS_LIST, VERIFIED_DEVICE_PROFILES } from '../data/carriers.ts';

interface ImeiCheckerProps {
  onSelectCarrier: (carrierId: string) => void;
  onNavigateToWizard: (brand: string, carrierId: string) => void;
}

export const ImeiChecker: React.FC<ImeiCheckerProps> = ({ onSelectCarrier, onNavigateToWizard }) => {
  const [imei, setImei] = useState('352011110482917');
  const [carrier, setCarrier] = useState('att');
  const [deviceCondition, setDeviceCondition] = useState('paid_off');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImeiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanDigits = imei.replace(/\D/g, '');

  const runValidation = async (targetImei: string, targetCarrier: string, targetCondition: string) => {
    const digits = targetImei.replace(/\D/g, '');
    if (digits.length < 14) {
      setError('Please enter a full 15-digit IMEI. Dial *#06# on your device keypad.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/imei/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: digits,
          carrier: targetCarrier,
          deviceCondition: targetCondition,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const data: ImeiAnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to analyze IMEI. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation('352011110482917', 'att', 'paid_off');
  }, []);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await runValidation(imei, carrier, deviceCondition);
  };

  const handleLoadPreset = (preset: typeof VERIFIED_DEVICE_PROFILES[0]) => {
    setImei(preset.imei);
    setCarrier(preset.carrier);
    setDeviceCondition(preset.condition);
    runValidation(preset.imei, preset.carrier, preset.condition);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Carrier Unlock Diagnostics</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Unlock Your Phone From <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Any Network Carrier</span>
          </h1>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Verify device IMEI checksum (Luhn-10), decode Type Allocation Codes (TAC), evaluate network lock status, and generate guaranteed official carrier unlock submissions for Apple iPhone, Samsung Galaxy, Google Pixel, and all carriers.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Legal &amp; FCC/CTIA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free Carrier Submission Portals</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Permanent Baseband Unlock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analyzer Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              IMEI Format &amp; Carrier Eligibility Check
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the 15-digit International Mobile Equipment Identity number.
            </p>
          </div>

          {/* Quick Verified Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Verified Device Reference:</span>
            {VERIFIED_DEVICE_PROFILES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadPreset(s)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition cursor-pointer"
              >
                {s.brand} ({s.carrier.toUpperCase()})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleValidate} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* IMEI input */}
            <div className="md:col-span-3 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Device IMEI (15 Digits)
                </label>
                <span className="text-xs text-slate-400">
                  {cleanDigits.length} / 15 digits
                  {cleanDigits.length === 15 ? (
                    <span className="ml-2 text-emerald-400 font-bold">✓ Ready</span>
                  ) : (
                    <span className="ml-2 text-amber-400">(Dial *#06# to find)</span>
                  )}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={18}
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="e.g. 352011110482915"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3.5 text-white font-mono tracking-wider text-base sm:text-lg transition"
                />
                <button
                  type="button"
                  onClick={() => setImei('352011110482915')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-cyan-400 px-2 py-1 rounded bg-slate-800/80 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Current Carrier */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Current Locked Network
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white transition cursor-pointer"
              >
                {CARRIERS_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Account / Device Condition */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Financial / Service Status
              </label>
              <select
                value={deviceCondition}
                onChange={(e) => setDeviceCondition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm text-white transition cursor-pointer"
              >
                <option value="paid_off">Device Fully Paid Off (Zero Balance)</option>
                <option value="installment">Under Installment Plan / Financed</option>
                <option value="former_customer">Former Customer / Cancelled Line</option>
                <option value="military">Active Military Deployed Overseas</option>
                <option value="second_hand">Bought Second-Hand (eBay / Swappa)</option>
              </select>
            </div>

            {/* Submit Action */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[46px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Telecom Registry...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Run Unlock Diagnostics</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Header Score & Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      result.eligibility.status === 'Eligible'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : result.eligibility.status === 'Conditional'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {result.eligibility.status === 'Eligible' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {result.eligibility.status === 'Conditional' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {result.eligibility.status === 'Needs Payoff' && <XCircle className="w-3.5 h-3.5" />}
                    Unlock Status: {result.eligibility.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    IMEI: {result.imei}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
                  {result.device.brand} {result.device.model} on {result.policy.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Type Allocation Code (TAC): <span className="font-mono text-cyan-300">{result.tac}</span> | OS Architecture: {result.device.os}
                </p>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center gap-4 bg-slate-950 px-5 py-3.5 rounded-xl border border-slate-800">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Carrier Eligibility Score</div>
                  <div className="text-2xl font-black text-cyan-400">
                    {result.eligibility.score}%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-white">
                  {result.eligibility.score}
                </div>
              </div>
            </div>

            {/* Technical Delivery Method */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-start gap-3">
                <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    Unlocking Protocol &amp; Delivery Method
                  </h4>
                  <p className="text-sm text-slate-200 mt-1 font-medium">
                    {result.eligibility.method}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {result.device.os === 'iOS'
                      ? 'Apple iPhones NEVER require an unlock code. The carrier transmits the IMEI to Apple’s GSX activation servers, and the unlock applies automatically over Wi-Fi.'
                      : 'Android phones either receive an over-the-air baseband update via the carrier Device Unlock application, or prompt for a numeric NCK (Network Control Key) code when a third-party SIM is inserted.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist of Requirements */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Carrier Verification Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.eligibility.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border ${
                      req.satisfied
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-amber-950/20 border-amber-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {req.satisfied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">{req.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{req.note}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Steps */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Recommended Official Execution Steps
              </h4>
              <ol className="space-y-2.5">
                {result.eligibility.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold shrink-0 border border-cyan-800 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <a
                  href={result.policy.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <span>Open Official {result.policy.name} Unlock Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => onNavigateToWizard(result.device.brand, result.policy.name.toLowerCase().includes('verizon') ? 'verizon' : result.policy.name.toLowerCase().includes('t-mobile') ? 'tmobile' : 'att')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
                >
                  <span>Generate Detailed Brand &amp; Model Guide</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Luhn Algorithm Education Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>How IMEI Validation (Luhn-10 Algorithm) Works</span>
            </div>
            <p>
              An International Mobile Equipment Identity (IMEI) consists of a 14-digit hardware identifier plus a final 15th Luhn checksum digit (Formula: mod 10 doubling every second digit from left to right). For IMEI <span className="font-mono text-cyan-300">{result.imei}</span>, the mathematical check digit is <span className="font-mono text-white font-bold">{result.luhn.calculatedCheckDigit}</span> (entered: <span className="font-mono text-white font-bold">{result.luhn.actualCheckDigit}</span>). Carriers use this checksum to eliminate typos prior to transmitting unlock commands to core network HLR/HSS registers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
