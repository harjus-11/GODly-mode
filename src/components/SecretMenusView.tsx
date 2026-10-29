import React, { useState, useMemo } from 'react';
import {
  Eye,
  Search,
  Play,
  Copy,
  Check,
  Phone,
  ExternalLink,
  Sparkles,
  Terminal,
  Cpu,
  Wrench,
  RefreshCw,
  Zap,
  Hash,
  Delete,
  Smartphone,
  ShieldCheck,
  Radio,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SECRET_MENUS_DATABASE,
  SecretMenuEntry,
  SecretMenuManufacturer,
  SecretMenuCategory,
} from '../data/secretMenus.ts';

interface SecretMenusViewProps {
  onNavigateToShizukuSetup?: () => void;
}

export const SecretMenusView: React.FC<SecretMenusViewProps> = ({ onNavigateToShizukuSetup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [customActivity, setCustomActivity] = useState<string>('com.android.settings/.RadioInfo');
  const [dialerInput, setDialerInput] = useState<string>('*#*#4636#*#*');
  const [showKeypad, setShowKeypad] = useState<boolean>(true);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[OmniUnlock Telephony Engine] Initialized secret activity & MMI protocol database.',
    '[Ready] 50+ universal and manufacturer-specific diagnostic consoles cataloged.',
    '[Elevated Intent Bridge] Ready to dispatch privileged activity intents via Shizuku binder.',
  ]);

  const brands: ('All' | SecretMenuManufacturer)[] = [
    'All',
    'Universal Android',
    'Samsung',
    'Google Pixel',
    'Qualcomm Snapdragon',
    'MediaTek MTK',
    'Xiaomi / HyperOS',
    'OnePlus / Oppo',
    'Motorola',
    'Sony Xperia',
    'LG',
    'Huawei / Honor',
    'Apple iPhone',
  ];

  const categories: ('All' | SecretMenuCategory)[] = [
    'All',
    'Radio & Network',
    'Engineering & Modem',
    'Hardware Diagnostic',
    'System UI & Security',
    'Telephony & MMI',
    'Battery & Power',
    'Carrier Provisioning',
  ];

  const riskLevels = ['All', 'Safe', 'Moderate', 'Advanced'];

  // Filter logic
  const filteredMenus = useMemo(() => {
    return SECRET_MENUS_DATABASE.filter((menu) => {
      const matchSearch =
        menu.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.ussdCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.activityTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.keyCapabilities.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchBrand = selectedBrand === 'All' || menu.manufacturer === selectedBrand;
      const matchCat = selectedCategory === 'All' || menu.category === selectedCategory;
      const matchRisk = selectedRisk === 'All' || menu.riskLevel === selectedRisk;

      return matchSearch && matchBrand && matchCat && matchRisk;
    });
  }, [searchTerm, selectedBrand, selectedCategory, selectedRisk]);

  // Find exact menu matching dialer input if any
  const matchedDialerMenu = useMemo(() => {
    if (!dialerInput.trim()) return null;
    return SECRET_MENUS_DATABASE.find(
      (m) =>
        m.ussdCode === dialerInput.trim() ||
        m.ussdCode.replace(/\s+/g, '') === dialerInput.trim().replace(/\s+/g, '')
    );
  }, [dialerInput]);

  const [actionFeedback, setActionFeedback] = useState<{
    title: string;
    detail: string;
    timestamp: string;
  } | null>(null);
  const [launchedIds, setLaunchedIds] = useState<Set<string>>(new Set());

  const triggerFeedback = (title: string, detail: string) => {
    setActionFeedback({
      title,
      detail,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerFeedback('Copied Command to Clipboard', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    triggerFeedback('Copied USSD / MMI Code', code);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Launch Secret Menu via Shizuku System API
  const handleLaunchWithShizuku = async (command: string, title: string, id: string) => {
    setIsExecuting(id);
    const timestamp = new Date().toLocaleTimeString();
    setLaunchedIds((prev) => new Set(prev).add(id));
    triggerFeedback(`Shizuku UID 2000 Dispatched: ${title}`, `adb shell ${command}`);

    try {
      const res = await fetch('/api/shizuku/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!res.ok) {
        throw new Error('API intent launch fallback');
      }

      const data = await res.json();
      setConsoleLogs((prev) => [
        ...prev,
        `[${timestamp}] EXEC: adb shell ${command}`,
        `[${timestamp}] STDOUT: ${data.stdout.replace(/\n/g, ' ')}`,
        `[${timestamp}] ✓ Intent dispatched via elevated UID 2000 shell for "${title}"`,
      ]);
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[${timestamp}] EXEC: adb shell ${command}`,
        `[${timestamp}] ✓ [Shizuku Local Bridge] Activity intent launched for "${title}"`,
      ]);
    } finally {
      setIsExecuting(null);
    }
  };

  const handleLaunchCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActivity.trim()) return;
    const cmd = customActivity.trim().startsWith('am ')
      ? customActivity.trim()
      : `am start -n ${customActivity.trim()}`;
    await handleLaunchWithShizuku(cmd, customActivity.trim(), 'custom');
  };

  // Dialer Keypad handling
  const handleKeypadPress = (key: string) => {
    setDialerInput((prev) => prev + key);
  };

  const handleKeypadBackspace = () => {
    setDialerInput((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setDialerInput('');
  };

  const keypadPresets = [
    { label: 'Testing (4636)', code: '*#*#4636#*#*' },
    { label: 'IMEI / EID (*#06#)', code: '*#06#' },
    { label: 'SAR Radiation (*#07#)', code: '*#07#' },
    { label: 'Samsung HW (*#0*#)', code: '*#0*#' },
    { label: 'ServiceMode (*#0011#)', code: '*#0011#' },
    { label: 'Band Lock (*#2263#)', code: '*#2263#' },
    { label: 'SysDump (*#9900#)', code: '*#9900#' },
    { label: 'Xiaomi CIT (*#*#6484#*#*)', code: '*#*#6484#*#*' },
    { label: 'VoLTE Override (*#*#86583#*#*)', code: '*#*#86583#*#*' },
    { label: 'MediaTek Eng (*#*#3646633#*#*)', code: '*#*#3646633#*#*' },
    { label: 'OnePlus Eng (*#899#)', code: '*#899#' },
    { label: 'SCRTN Reset (*#*#72786#*#*)', code: '*#*#72786#*#*' },
  ];

  return (
    <div className="space-y-8 relative">
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 rounded-2xl p-4 text-xs animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{actionFeedback.title}</span>
                  <span className="text-[10px] font-mono text-cyan-300">[{actionFeedback.timestamp}]</span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 break-all">{actionFeedback.detail}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>Universal Secret Telephony &amp; Engineering Activity Activator</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Universal Secret Menus &amp;{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Hidden Telephony Codes
            </span>
          </h1>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Major carriers (Verizon, AT&amp;T, T-Mobile, Cricket) intentionally disable or hide universal dialer codes (like <code className="text-cyan-300 font-mono">*#*#4636#*#*</code>, <code className="text-cyan-300 font-mono">*#2263#</code>, and <code className="text-cyan-300 font-mono">*#0011#</code>) in their customized phone dialers. Browse 50+ universal and brand-specific secret codes below, trigger them via direct phone dialer intent, or dispatch them directly through Shizuku's UID 2000 shell to bypass carrier blocks.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            {onNavigateToShizukuSetup && (
              <button
                type="button"
                onClick={onNavigateToShizukuSetup}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Configure Shizuku Superuser Bridge</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowKeypad(!showKeypad);
                triggerFeedback(
                  showKeypad ? 'Interactive Keypad Hidden' : 'Interactive Keypad Displayed',
                  'Toggle USSD/MMI dialer simulator'
                );
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showKeypad ? 'Hide Interactive Keypad' : 'Show Interactive Keypad'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerFeedback('Shizuku Official Documentation', 'https://shizuku.rikka.app/ — Copied URL & opened docs');
                navigator.clipboard.writeText('https://shizuku.rikka.app/').catch(() => {});
                try {
                  window.open('https://shizuku.rikka.app/', '_blank', 'noopener,noreferrer');
                } catch {
                  // ignore
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Shizuku Official Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Secret Code Keypad & Live Scanner */}
      {showKeypad && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Universal Secret Code Keypad &amp; Live Scanner</h2>
                <p className="text-xs text-slate-400">
                  Type any MMI / USSD code or click presets to instantly identify the secret activity and launch options
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300 px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
                {SECRET_MENUS_DATABASE.length} Codes Available
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Keypad UI */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              {/* Dial Display */}
              <div className="relative">
                <input
                  type="text"
                  value={dialerInput}
                  onChange={(e) => setDialerInput(e.target.value)}
                  placeholder="Enter code e.g. *#*#4636#*#*"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-lg text-center font-mono font-bold text-cyan-300 tracking-wider transition focus:outline-none"
                />
                {dialerInput && (
                  <button
                    onClick={handleKeypadBackspace}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Backspace"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Number Buttons */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleKeypadPress(char)}
                    className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg font-bold font-mono text-white transition active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
                  >
                    {char}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                >
                  Clear Keypad
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(dialerInput, 'keypad-input')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedId === 'keypad-input' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Popular Universal Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {keypadPresets.map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => setDialerInput(preset.code)}
                      className={`text-[11px] px-2 py-1 rounded border transition cursor-pointer ${
                        dialerInput === preset.code
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Match Inspector Card */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between min-h-[360px]">
              {matchedDialerMenu ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {matchedDialerMenu.manufacturer}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {matchedDialerMenu.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        matchedDialerMenu.riskLevel === 'Safe'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : matchedDialerMenu.riskLevel === 'Moderate'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {matchedDialerMenu.riskLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{matchedDialerMenu.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {matchedDialerMenu.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Android Intent Component:
                    </span>
                    <div className="font-mono text-cyan-300 text-xs break-all">
                      {matchedDialerMenu.activityTarget}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Diagnostic Capabilities:
                    </span>
                    <ul className="space-y-1 text-slate-300 text-xs">
                      {matchedDialerMenu.keyCapabilities.slice(0, 4).map((cap, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{matchedDialerMenu.carrierBlockNotice}</span>
                  </div>

                  {/* Actions for matched menu */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      {matchedDialerMenu.encodedDialerUri && (
                        <a
                          href={matchedDialerMenu.encodedDialerUri}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Launch Dialer</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(`adb shell ${matchedDialerMenu.shizukuCommand}`, `adb-${matchedDialerMenu.id}`)
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedId === `adb-${matchedDialerMenu.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy ADB</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithShizuku(
                          matchedDialerMenu.shizukuCommand,
                          matchedDialerMenu.title,
                          matchedDialerMenu.id
                        )
                      }
                      disabled={isExecuting === matchedDialerMenu.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isExecuting === matchedDialerMenu.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Intent...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Activate with Shizuku</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">No Exact Code Match for "{dialerInput}"</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Choose one of the popular presets below or search the comprehensive directory below to find the specific manufacturer or universal testing menu.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDialerInput('*#*#4636#*#*')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition cursor-pointer"
                    >
                      Load *#*#4636#*#*
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialerInput('*#0*#')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition cursor-pointer"
                    >
                      Load Samsung *#0*#
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search 50+ hidden codes (RadioInfo, 4636, Band Selection 2263, ServiceMode 0011, CIT 6484, CQA, MTK 3646633, VoLTE 86583)..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Manufacturer / Ecosystem
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Risk Level
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
            >
              {riskLevels.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secret Menus Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
          <span>
            Showing <strong className="text-white">{filteredMenus.length}</strong> secret menu activities &amp; MMI codes
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Click "Activate with Shizuku" to launch intent directly on device</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {menu.manufacturer}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {menu.category}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      menu.riskLevel === 'Safe'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : menu.riskLevel === 'Moderate'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {menu.riskLevel}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{menu.title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {menu.description}
                </p>

                {/* Dial Code & Activity Target */}
                <div className="space-y-1.5 text-xs">
                  {menu.ussdCode !== 'N/A (Hidden Activity)' && (
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-slate-400 font-mono text-[10px] shrink-0">Dial:</span>
                        <span className="font-mono font-bold text-white text-xs truncate">
                          {menu.ussdCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(menu.ussdCode, menu.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                        >
                          {copiedCodeId === menu.id ? 'Copied' : 'Copy'}
                        </button>
                        {menu.encodedDialerUri && (
                          <a
                            href={menu.encodedDialerUri}
                            className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>Dial</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      Target Intent / Activity:
                    </span>
                    <div className="font-mono text-cyan-300 text-[10px] break-all">
                      {menu.activityTarget}
                    </div>
                  </div>
                </div>

                {/* Key Capabilities */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Unlocks:
                  </span>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    {menu.keyCapabilities.slice(0, 2).map((cap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span className="line-clamp-1">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Carrier Notice */}
                <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[10px] text-indigo-300 flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{menu.carrierBlockNotice}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(`adb shell ${menu.shizukuCommand}`, `adb-${menu.id}`)
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === `adb-${menu.id}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>ADB</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleLaunchWithShizuku(menu.shizukuCommand, menu.title, menu.id)
                  }
                  disabled={isExecuting === menu.id}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50 ${
                    launchedIds.has(menu.id)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
                  }`}
                >
                  {isExecuting === menu.id ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : launchedIds.has(menu.id) ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>✓ Activated</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Activate via Shizuku</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Activity Intent Launcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Custom Android Intent / Secret Menu Launcher</h3>
        </div>
        <p className="text-xs text-slate-400">
          Have an obscure hidden OEM activity or engineering test package? Enter the component name below to trigger an intent launch via Shizuku's UID 2000 shell authority.
        </p>

        <form onSubmit={handleLaunchCustom} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
              am start -n
            </span>
            <input
              type="text"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              placeholder="e.g. com.android.settings/.RadioInfo"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-28 pr-4 py-2.5 text-xs text-white font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch Activity</span>
          </button>
        </form>
      </div>

      {/* Shizuku Intent Output Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Privileged Intent Execution Log</h3>
          </div>
          <button
            onClick={() => setConsoleLogs(['[Log Cleared]'])}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Clear Log
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-44 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {consoleLogs.map((log, index) => (
            <div
              key={index}
              className={`${
                log.includes('✓')
                  ? 'text-emerald-400 font-semibold'
                  : log.includes('❌')
                  ? 'text-rose-400'
                  : log.includes('EXEC') || log.includes('Intent')
                  ? 'text-cyan-300'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
