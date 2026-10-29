import React, { useState, useEffect } from 'react';
import {
  Search,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  EyeOff,
  HardDrive,
  Terminal,
} from 'lucide-react';

interface ImeiLookupResult {
  success: boolean;
  imei: string;
  manufacturer: string;
  model: string;
  os: 'iOS' | 'Android';
  tac: string;
  serialNumber: string;
  checkDigit: number;
  calculatedCheckDigit: number;
  luhnValid: boolean;
  isExactMatch: boolean;
  specs: {
    releaseYear: string;
    chipset: string;
    simConfiguration: string;
    cellularTech: string;
    reportingBody: string;
  };
  carrierLockInfo: {
    lockType: string;
    unlockEligibility: string;
    blacklistStatus: string;
    fccApproval: string;
  };
  basebandArchitecture?: {
    recommendedTool: 'qfil' | 'odin' | 'spflash';
    flashingSoftware: string;
    nvmStoragePartition: string;
    debugInterface: string;
    bootromSecurity: string;
  };
  formatDetails: {
    tacGroup: string;
    serialGroup: string;
    checkDigit: number;
    formatted: string;
  };
}

interface ImeiLookupViewProps {
  onUnlockDevice: (manufacturer: string, model: string) => void;
  onOpenDialerModal: () => void;
  onNavigateToMasker?: () => void;
  onOpenBasebandLab?: (tool: 'qfil' | 'odin' | 'spflash', imei: string) => void;
}

export const ImeiLookupView: React.FC<ImeiLookupViewProps> = ({
  onUnlockDevice,
  onOpenDialerModal,
  onNavigateToMasker,
  onOpenBasebandLab,
}) => {
  const [inputImei, setInputImei] = useState('352011110482917');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImeiLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const verifiedPresets = [
    { label: 'iPhone 15 Pro', imei: '352011110482917', brand: 'Apple' },
    { label: 'Galaxy S24 Ultra (Odin)', imei: '357829112948121', brand: 'Samsung' },
    { label: 'Pixel 9 Pro', imei: '358210118374290', brand: 'Google' },
    { label: 'Redmi Note 13 Pro+ (MTK)', imei: '863920051029384', brand: 'Xiaomi' },
    { label: 'OnePlus 12 (QFIL)', imei: '867819049281723', brand: 'OnePlus' },
  ];

  const handleLookup = async (e?: React.FormEvent, customImei?: string) => {
    if (e) e.preventDefault();
    const query = customImei || inputImei;
    const clean = query.replace(/\D/g, '');

    if (clean.length < 8) {
      setError('Please enter at least 8 digits to identify the TAC (Type Allocation Code).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/imei/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: clean }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to look up IMEI');
      }

      const data: ImeiLookupResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Lookup failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLookup(undefined, '352011110482917');
  }, []);

  const handleCopy = () => {
    if (!result) return;
    const summary = [
      `IMEI: ${result.imei}`,
      `Manufacturer: ${result.manufacturer}`,
      `Model: ${result.model}`,
      `OS: ${result.os}`,
      `TAC: ${result.tac}`,
      `Chipset: ${result.specs.chipset}`,
      `SIM: ${result.specs.simConfiguration}`,
      result.basebandArchitecture ? `Flashing Tool: ${result.basebandArchitecture.flashingSoftware}` : '',
      result.basebandArchitecture ? `NVM Partition: ${result.basebandArchitecture.nvmStoragePartition}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 border border-slate-800">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
            <span>Hardware Identification Engine</span>
            <span aria-hidden="true">·</span>
            <span>3GPP TS 23.003 TAC Registry</span>
            <span aria-hidden="true">·</span>
            <span>Baseband &amp; NVM Mapper</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IMEI Hardware, Baseband Processor &amp; NVM Partition Lookup
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Enter any 15-digit IMEI to identify the exact phone model, mobile SoC, cellular baseband architecture, Non-Volatile Memory (NVM) storage partition, and standard OEM service software (QFIL, Odin, or SP Flash Tool).
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenDialerModal}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 underline cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Need to find your IMEI? Dial *#06# on your phone keypad</span>
            </button>
          </div>
        </div>
      </div>

      {/* IMEI Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Enter 15-Digit IMEI</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The first 8 digits (TAC) pinpoint the exact OEM, model, and baseband platform.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            {verifiedPresets.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputImei(s.imei);
                  handleLookup(undefined, s.imei);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLookup} className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={18}
                value={inputImei}
                onChange={(e) => setInputImei(e.target.value)}
                placeholder="e.g. 352011110482917"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-white font-mono tabular-nums tracking-wider text-base transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono tabular-nums">
                {inputImei.replace(/\D/g, '').length} / 15 digits
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying TAC Registry...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Inspect Hardware &amp; Baseband</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Main Device Identity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span>{result.manufacturer}</span>
                  <span aria-hidden="true">·</span>
                  <span>TAC {result.tac}</span>
                  <span aria-hidden="true">·</span>
                  <span className={result.luhnValid ? 'text-emerald-400' : 'text-amber-400'}>
                    {result.luhnValid ? '● Luhn-10 Verified' : '▲ Checksum Mismatch'}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {result.model}
                </h3>
                <p className="text-xs text-slate-400">
                  OS Architecture: <strong className="text-slate-200">{result.os}</strong> · Reporting Body: {result.specs.reportingBody}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied Specs</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Specs</span>
                    </>
                  )}
                </button>

                {onNavigateToMasker && (
                  <button
                    type="button"
                    onClick={onNavigateToMasker}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <EyeOff className="w-4 h-4 text-cyan-400" />
                    <span>Mask IMEI / NVM</span>
                  </button>
                )}

                {onOpenBasebandLab && result.basebandArchitecture && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBasebandLab(result.basebandArchitecture!.recommendedTool, result.imei)
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Open in Baseband Lab</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onUnlockDevice(result.manufacturer, result.model)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Unlock Procedure</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* IMEI Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Type Allocation Code (TAC)</div>
                <div className="text-base font-bold font-mono tabular-nums text-cyan-300 mt-1">
                  {result.tac}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Identifies OEM &amp; Model</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Serial Number (SNR)</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-200 mt-1">
                  {result.serialNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Unit Manufacturing Sequence</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Luhn Check Digit (CD)</div>
                <div className="text-base font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {result.checkDigit} (Calc: {result.calculatedCheckDigit})
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {result.luhnValid ? 'Mathematically verified' : 'Expected: ' + result.calculatedCheckDigit}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">GSMA EIR Registry Status</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clean / Not Blacklisted</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Passes Insurance Registry</div>
              </div>
            </div>

            {/* Technical Hardware Specs */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Identified Hardware &amp; Cellular Specifications</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Processor / Mobile Platform:</span>
                  <span className="font-semibold text-white">{result.specs.chipset}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">SIM Slot Configuration:</span>
                  <span className="font-semibold text-white">{result.specs.simConfiguration}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Cellular Network Capabilities:</span>
                  <span className="font-semibold text-white">{result.specs.cellularTech}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Release Generation:</span>
                  <span className="font-semibold text-white font-mono tabular-nums">{result.specs.releaseYear}</span>
                </div>
              </div>
            </div>

            {/* Baseband Firmware, NVM Storage & OEM Flashing Tool Profile */}
            {result.basebandArchitecture && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Baseband Firmware, NVM Partition &amp; Service Tool Architecture</span>
                  </h4>
                  {onOpenBasebandLab && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenBasebandLab(result.basebandArchitecture!.recommendedTool, result.imei)
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Simulate {result.basebandArchitecture.recommendedTool.toUpperCase()} &amp; NVM in Lab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">Standard OEM Flashing Reference:</span>
                    <span className="font-mono font-semibold text-cyan-300 block">
                      {result.basebandArchitecture.flashingSoftware}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">Modem Non-Volatile Memory (NVM) Storage:</span>
                    <span className="font-mono font-semibold text-white block">
                      {result.basebandArchitecture.nvmStoragePartition}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">Serial / Diagnostic Bridge:</span>
                    <span className="font-mono text-slate-300 block">
                      {result.basebandArchitecture.debugInterface}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 block">BootROM &amp; Hardware Root of Trust:</span>
                    <span className="font-mono text-emerald-400 block">
                      {result.basebandArchitecture.bootromSecurity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Carrier Unlocking Profile for this Model */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Carrier Unlock Enforcement Mechanism for {result.manufacturer}</span>
              </div>
              <p className="text-xs text-white font-semibold">
                {result.carrierLockInfo.lockType}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {result.os === 'iOS'
                  ? 'Apple devices do not utilize numeric NCK unlock codes. The carrier submits your IMEI directly to Apple’s GSX activation servers, and the unlock profile applies over Wi-Fi.'
                  : 'Android devices enforce network locks inside the baseband NVM partition (3GPP TS 22.022). Official unlocking uses an 8-to-16 digit NCK code or a signed carrier unlock payload.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
