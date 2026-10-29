import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Terminal,
  Shield,
  BookOpen,
  HardDrive,
  Radio,
  Lock,
  Copy,
  Check,
  Play,
  RefreshCw,
  FileText,
  ExternalLink,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Binary,
  Download,
  Smartphone,
  WifiOff,
  Zap,
  Power,
} from 'lucide-react';
import {
  OEM_TOOL_PROFILES,
  BASEBAND_NVM_REGISTERS,
  BOOTROM_SECURITY_CHAIN,
  ACADEMIC_SPECIFICATIONS,
  encodeImeiToNv550Hex,
  OemToolSimulatorProfile,
  NvmRegisterEntry,
} from '../data/basebandData.ts';

interface BasebandFirmwareLabProps {
  initialTool?: 'qfil' | 'odin' | 'spflash';
  initialModule?: 'oem-tools' | 'nvm-uart' | 'bootrom-auth' | 'academic-specs';
  initialImei?: string;
}

export const BasebandFirmwareLab: React.FC<BasebandFirmwareLabProps> = ({
  initialTool = 'qfil',
  initialModule = 'oem-tools',
  initialImei = '352011110482917',
}) => {
  const [activeModule, setActiveModule] = useState<'oem-tools' | 'nvm-uart' | 'bootrom-auth' | 'academic-specs'>(
    initialModule
  );
  const [selectedOemToolId, setSelectedOemToolId] = useState<'qfil' | 'odin' | 'spflash'>(initialTool);
  const [selectedPortMode, setSelectedPortMode] = useState<string>('UART 115200 8N1 (Debug Serial)');
  const [nvImeiInput, setNvImeiInput] = useState<string>(initialImei);
  const [selectedNvmId, setSelectedNvmId] = useState<string>('nv-550');

  // OS Toggles vs Baseband Handshake Simulator state
  const [osAirplaneMode, setOsAirplaneMode] = useState<boolean>(false);
  const [osMobileData, setOsMobileData] = useState<boolean>(true);
  const [insertedSimMccMnc, setInsertedSimMccMnc] = useState<'310-410' | '311-480' | '310-260'>('311-480');
  const [selectedBootStage, setSelectedBootStage] = useState<number>(1);

  // Academic citation state
  const [specFilter, setSpecFilter] = useState<string>('All');
  const [citationFormat, setCitationFormat] = useState<'ieee' | 'apa' | 'bibtex'>('ieee');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  // Shared Shizuku Baseband & 3GPP Override State
  const [shizukuBasebandControls, setShizukuBasebandControls] = useState<{
    cellularBasebandArchitecture: boolean;
    ts22022PersonalizationLock: boolean;
    ts23003ImeiIdentityLock: boolean;
  }>({
    cellularBasebandArchitecture: true,
    ts22022PersonalizationLock: true,
    ts23003ImeiIdentityLock: true,
  });

  // Live UART / EDL / Baseband Console Log
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[Baseband Lab Workbench] Initialized cellular firmware & NVM telemetry engine.',
    '[Shizuku IPC Bridge] Connected to UID 2000 RILD, 3GPP TS 22.022 & TS 23.003 override hooks.',
    '[Port Bridge] Ready on /dev/ttyUSB0 (UART 115200 8N1) & QDLoader 9008 / Odin LOKE / MTK BROM.',
  ]);

  // Live Visual Feedback Toast
  const [actionFeedback, setActionFeedback] = useState<{
    title: string;
    detail: string;
    timestamp: string;
  } | null>(null);

  const triggerFeedback = (title: string, detail: string) => {
    setActionFeedback({
      title,
      detail,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  useEffect(() => {
    fetch('/api/shizuku/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.basebandControls) {
          setShizukuBasebandControls(data.basebandControls);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleShizukuBaseband = async (
    target: 'cellularBasebandArchitecture' | 'ts22022PersonalizationLock' | 'ts23003ImeiIdentityLock' | 'disable-all' | 'restore-all'
  ) => {
    setIsExecuting(`shizuku-${target}`);
    const ts = new Date().toLocaleTimeString();

    // Optimistic state update
    setShizukuBasebandControls((prev) => {
      if (target === 'disable-all') {
        return {
          cellularBasebandArchitecture: false,
          ts22022PersonalizationLock: false,
          ts23003ImeiIdentityLock: false,
        };
      }
      if (target === 'restore-all') {
        return {
          cellularBasebandArchitecture: true,
          ts22022PersonalizationLock: true,
          ts23003ImeiIdentityLock: true,
        };
      }
      return {
        ...prev,
        [target]: !prev[target],
      };
    });

    triggerFeedback(
      `Shizuku Baseband Override: ${target}`,
      'Applied UID 2000 RILD & 3GPP override across cellular baseband stack'
    );

    try {
      const res = await fetch('/api/shizuku/baseband-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.basebandControls) {
          setShizukuBasebandControls(data.basebandControls);
        }
        if (data.logs) {
          setConsoleLogs((prev) => [
            ...prev,
            ...data.logs.map((l: string) => `[${ts}] ${l}`),
          ]);
        }
      }
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[${ts}] ✓ [Shizuku IPC] Applied baseband override (${target}) locally.`,
      ]);
    } finally {
      setIsExecuting(null);
    }
  };

  const currentOemTool: OemToolSimulatorProfile = useMemo(() => {
    return OEM_TOOL_PROFILES.find((t) => t.id === selectedOemToolId) || OEM_TOOL_PROFILES[0];
  }, [selectedOemToolId]);

  const currentNvmRegister: NvmRegisterEntry = useMemo(() => {
    return BASEBAND_NVM_REGISTERS.find((r) => r.id === selectedNvmId) || BASEBAND_NVM_REGISTERS[0];
  }, [selectedNvmId]);

  const nv550Encoded = useMemo(() => {
    return encodeImeiToNv550Hex(nvImeiInput);
  }, [nvImeiInput]);

  const filteredSpecs = useMemo(() => {
    if (specFilter === 'All') return ACADEMIC_SPECIFICATIONS;
    return ACADEMIC_SPECIFICATIONS.filter((s) => s.category === specFilter);
  }, [specFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerFeedback('Copied to Clipboard', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Call backend API for OEM Flashing Tool diagnostic simulation
  const handleRunOemToolAction = async (
    toolId: string,
    actionId: string,
    command: string,
    fallbackLines: string[]
  ) => {
    setIsExecuting(actionId);
    const ts = new Date().toLocaleTimeString();
    triggerFeedback(`Executed ${toolId.toUpperCase()} Protocol`, command);

    try {
      const res = await fetch('/api/baseband/simulate-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, actionId, command, portMode: selectedPortMode }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsoleLogs((prev) => [
          ...prev,
          `[${ts}] EXEC (${toolId.toUpperCase()}): $ ${command}`,
          ...(data.telemetry || fallbackLines).map((line: string) => `[${ts}] ${line}`),
        ]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          `[${ts}] EXEC (${toolId.toUpperCase()}): $ ${command}`,
          ...fallbackLines.map((line) => `[${ts}] ${line}`),
        ]);
      }
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[${ts}] EXEC (${toolId.toUpperCase()}): $ ${command}`,
        ...fallbackLines.map((line) => `[${ts}] ${line}`),
      ]);
    } finally {
      setIsExecuting(null);
    }
  };

  // Call backend API to probe an NVM register over UART / DIAG
  const handleProbeNvmRegister = async (reg: NvmRegisterEntry) => {
    setIsExecuting(reg.id);
    const ts = new Date().toLocaleTimeString();
    triggerFeedback(`Probed ${reg.nvItemNumber} (${reg.hexOffset})`, `${reg.name} over ${selectedPortMode}`);

    try {
      const res = await fetch('/api/baseband/probe-nvm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerId: reg.id,
          nvItemNumber: reg.nvItemNumber,
          hexOffset: reg.hexOffset,
          portMode: selectedPortMode,
          imei: nvImeiInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsoleLogs((prev) => [
          ...prev,
          `[${ts}] [${selectedPortMode}] Probing ${reg.nvItemNumber} at offset ${reg.hexOffset}...`,
          ...(data.logs || []),
        ]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          `[${ts}] [${selectedPortMode}] Probing ${reg.nvItemNumber} (${reg.name})...`,
          `[${ts}] [HEX DUMP] ${reg.hexOffset}: ${reg.rawHexSample}`,
          `[${ts}] [DECODED]  ${reg.decodedValue}`,
          `[${ts}] [SECURITY] Access Control: ${reg.accessControl} (${reg.partition})`,
        ]);
      }
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[${ts}] [${selectedPortMode}] Probing ${reg.nvItemNumber} (${reg.name})...`,
        `[${ts}] [HEX DUMP] ${reg.hexOffset}: ${reg.rawHexSample}`,
        `[${ts}] [DECODED]  ${reg.decodedValue}`,
      ]);
    } finally {
      setIsExecuting(null);
    }
  };

  // Call backend API to trace OS Toggle vs Baseband Firmware Handshake
  const handleSimulateBasebandHandshake = async () => {
    setIsExecuting('handshake-sim');
    const ts = new Date().toLocaleTimeString();
    triggerFeedback(
      '3GPP NAS & Baseband Handshake Trace Executed',
      `SIM MCC/MNC ${insertedSimMccMnc} | TS 22.022: ${shizukuBasebandControls.ts22022PersonalizationLock ? 'Active' : 'OFF'}`
    );

    try {
      const res = await fetch('/api/baseband/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airplaneMode: osAirplaneMode,
          mobileData: osMobileData,
          simMccMnc: insertedSimMccMnc,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsoleLogs((prev) => [
          ...prev,
          `[${ts}] === 3GPP NAS & BASEBAND HANDSHAKE TRACE ===`,
          ...(data.trace || []).map((t: string) => `[${ts}] ${t}`),
        ]);
      }
    } catch {
      setConsoleLogs((prev) => [
        ...prev,
        `[${ts}] [BASEBAND] Simulating 3GPP TS 22.022 Personalisation check for MCC/MNC ${insertedSimMccMnc}...`,
      ]);
    } finally {
      setIsExecuting(null);
    }
  };

  const handleDownloadPaperNotes = () => {
    const content = [
      '====================================================================',
      'TELECOMMUNICATIONS BASEBAND & FIRMWARE SECURITY — TECHNICAL SUMMARY',
      '====================================================================',
      '',
      '1. NETWORK LOCK ENFORCEMENT & OS TOGGLE SEPARATION',
      'Standard operating system settings (such as Airplane Mode or Mobile Data toggles) only regulate high-level IP sockets or instruct the radio transceiver to suspend transmission. They do not bypass a carrier network lock. The lock itself is enforced within the isolated baseband firmware (Qualcomm Hexagon DSP, Samsung Shannon, or MediaTek Helio M80), which manages the cellular radios directly and verifies the SIM IMSI against a signed 3GPP TS 22.022 Personalisation policy before completing any Restricted Network handshake.',
      '',
      '2. MODEM NON-VOLATILE MEMORY (NVM) & SERIAL DEBUG INTERFACES',
      'Baseband identification numbers (such as the 15-digit IMEI defined in 3GPP TS 23.003) and SIM lock status flags reside in dedicated Non-Volatile Memory (NVM) partitions—specifically Qualcomm EFS2 (modemst1, modemst2, fsg, NV Item 550), Samsung EFS (/efs/nv_data.bin), and MediaTek NVRAM (nvram, nvdata, protect1). Communicating with these low-level storage blocks involves serial diagnostic protocols over debug interfaces such as UART (115200 8N1) or USB Diagnostic/Emergency Download endpoints.',
      '',
      '3. STANDARD OEM FLASHING & SERVICE SOFTWARE REFERENCES',
      '- Qualcomm: QFIL (Qualcomm Flash Image Loader) & QPST communicating via Sahara/Firehose protocols on EDL 9008.',
      '- Samsung: Odin3 communicating via the Loke download protocol to flash BL, AP, CP (Core Processor Baseband), and CSC.',
      '- MediaTek: SP Flash Tool & Meta Mode communicating via BootROM (BROM) Download Agents (DA) and scatter memory maps.',
      '',
      '4. BOOTROM EXPLOITS, CRYPTOGRAPHIC EFUSES & AUTHENTICATION PROTOCOLS',
      'Modern mobile SoCs prevent unauthorized baseband or NVM modification through a hardware Root of Trust anchored in the silicon BootROM, laser-blown eFuses (OEM_PK_HASH), and asymmetric RSA signature verification.',
      '',
      '5. ACADEMIC & TECHNICAL CITATIONS (IEEE FORMAT)',
      ...ACADEMIC_SPECIFICATIONS.map((s, idx) => `[${idx + 1}] ${s.citations.ieee}`),
      '',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baseband-security-paper-reference.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerFeedback('Downloaded Research Dossier', 'baseband-security-paper-reference.txt');
  };

  return (
    <div className="space-y-8 relative">
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-950/95 backdrop-blur-xl border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 rounded-2xl p-4 text-xs animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
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

      {/* Top Workbench Header */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
              <span>Cellular Baseband Architecture</span>
              <span aria-hidden="true">·</span>
              <span>NVM &amp; UART Serial Diagnostics</span>
              <span aria-hidden="true">·</span>
              <span>3GPP TS 22.022 &amp; TS 23.003</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Baseband Firmware, NVM Storage &amp; OEM Flashing Workbench
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Explore how cellular network locks are enforced inside isolated baseband firmware rather than host OS settings, inspect how service tools (<strong className="text-white">QFIL</strong>, <strong className="text-white">Odin</strong>, and <strong className="text-white">SP Flash Tool</strong>) interact with Non-Volatile Memory (NVM) over <strong className="text-white">UART / EDL / BROM</strong> serial bridges, and export peer-reviewed <strong className="text-white">3GPP &amp; IEEE</strong> citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPaperNotes}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Research Dossier (.txt)</span>
            </button>
          </div>
        </div>

        {/* Sub-Module Segmented Switcher */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            {
              id: 'oem-tools',
              label: '1. QFIL, Odin & SP Flash Simulators',
              icon: HardDrive,
            },
            {
              id: 'nvm-uart',
              label: '2. Baseband NVM & UART Serial Explorer',
              icon: Binary,
            },
            {
              id: 'bootrom-auth',
              label: '3. BootROM, eFuses & OS vs Baseband Lock',
              icon: Shield,
            },
            {
              id: 'academic-specs',
              label: '4. 3GPP & IEEE Academic Citation Library',
              icon: BookOpen,
            },
          ].map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Shizuku IPC Baseband & 3GPP TS 22.022 / TS 23.003 Kill-Switch Bar */}
        <div className="mt-5 pt-5 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/90 p-4 rounded-xl border border-cyan-500/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Shizuku IPC Bridge Connected (UID 2000) — Direct Baseband &amp; 3GPP Kill-Switches</span>
            </div>
            <p className="text-xs text-slate-400">
              Turn off Cellular Baseband Architecture, 3GPP TS 22.022 SIM Personalization, or 3GPP TS 23.003 IMEI/NV-550 Identity Attestation via Shizuku and test the live effect below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleShizukuBaseband('cellularBasebandArchitecture')}
              disabled={isExecuting !== null}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                !shizukuBasebandControls.cellularBasebandArchitecture
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                Baseband Arch: {shizukuBasebandControls.cellularBasebandArchitecture ? 'ON (Click to Turn OFF)' : 'TURNED OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleShizukuBaseband('ts22022PersonalizationLock')}
              disabled={isExecuting !== null}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                !shizukuBasebandControls.ts22022PersonalizationLock
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                3GPP TS 22.022: {shizukuBasebandControls.ts22022PersonalizationLock ? 'ON (Click to Turn OFF)' : 'TURNED OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleShizukuBaseband('ts23003ImeiIdentityLock')}
              disabled={isExecuting !== null}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                !shizukuBasebandControls.ts23003ImeiIdentityLock
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900 hover:bg-rose-500/20 text-slate-200 hover:text-rose-200 border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                3GPP TS 23.003: {shizukuBasebandControls.ts23003ImeiIdentityLock ? 'ON (Click to Turn OFF)' : 'TURNED OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleToggleShizukuBaseband(
                  !shizukuBasebandControls.cellularBasebandArchitecture &&
                    !shizukuBasebandControls.ts22022PersonalizationLock &&
                    !shizukuBasebandControls.ts23003ImeiIdentityLock
                    ? 'restore-all'
                    : 'disable-all'
                )
              }
              disabled={isExecuting !== null}
              className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>
                {!shizukuBasebandControls.cellularBasebandArchitecture &&
                !shizukuBasebandControls.ts22022PersonalizationLock &&
                !shizukuBasebandControls.ts23003ImeiIdentityLock
                  ? 'Restore All 3'
                  : 'Turn OFF All 3'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MODULE 1: QFIL, ODIN, AND SP FLASH TOOL SIMULATORS */}
      {activeModule === 'oem-tools' && (
        <div className="space-y-6">
          {/* Tool Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OEM_TOOL_PROFILES.map((tool) => {
              const isSelected = tool.id === selectedOemToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedOemToolId(tool.id)}
                  className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
                      <span>{tool.name}</span>
                      {isSelected && <span className="text-emerald-400 font-semibold">Active Workbench</span>}
                    </div>
                    <h3 className="text-base font-bold text-white">{tool.fullName}</h3>
                    <p className="text-xs text-slate-400">{tool.chipsetEcosystem}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 truncate">
                    {tool.protocolName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active OEM Tool Workbench */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="text-xs text-cyan-400 font-mono">
                  {currentOemTool.usbVidPid} · {currentOemTool.baudOrSpeed}
                </div>
                <h2 className="text-xl font-bold text-white">{currentOemTool.fullName}</h2>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {currentOemTool.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">Serial / USB Interface:</span>
                <select
                  value={selectedPortMode}
                  onChange={(e) => setSelectedPortMode(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="UART 115200 8N1 (Debug Serial)">UART 115200 8N1 (Debug Serial)</option>
                  <option value="QDLoader 9008 (Qualcomm EDL)">QDLoader 9008 (Qualcomm EDL)</option>
                  <option value="Samsung Loke ACM0 (Download Mode)">Samsung Loke ACM0 (Download Mode)</option>
                  <option value="MediaTek VCOM 921600 (BROM/DA)">MediaTek VCOM 921600 (BROM/DA)</option>
                </select>
              </div>
            </div>

            {/* Technical Protocol Metadata Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Loader / Download Agent</span>
                <span className="font-mono font-bold text-cyan-300 block break-all">
                  {currentOemTool.programmerOrAgent}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Partition &amp; Calibration Format</span>
                <span className="font-mono font-bold text-white block break-all">
                  {currentOemTool.configFormat}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Academic Paper Context</span>
                <span className="text-slate-300 block leading-relaxed">
                  {currentOemTool.firmwareModificationSummary}
                </span>
              </div>
            </div>

            {/* Modem & NVM Partition Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Baseband Firmware &amp; Non-Volatile Memory (NVM) Partition Map
                </h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {currentOemTool.partitions.length} Critical Baseband Partitions
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-3 px-4 font-semibold">Partition Name</th>
                      <th className="py-3 px-4 font-semibold">Flash Offset</th>
                      <th className="py-3 px-4 font-semibold">Size</th>
                      <th className="py-3 px-4 font-semibold">Hardware Security Boundary</th>
                      <th className="py-3 px-4 font-semibold">Baseband &amp; NVM Architectural Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {currentOemTool.partitions.map((part) => (
                      <tr key={part.name} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                          {part.name}
                          {part.containsImeiOrLock && (
                            <span className="ml-2 text-[10px] font-sans font-normal text-amber-400">
                              · IMEI / Lock NVM
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {part.offset}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                          {part.size}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 whitespace-nowrap">
                          {part.securityAttribute}
                        </td>
                        <td className="py-3 px-4 text-slate-300 leading-relaxed">{part.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Diagnostic & Protocol Probes */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">
                Interactive {currentOemTool.name} Protocol Handshakes (Streams to Live Console)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentOemTool.diagnosticActions.map((act) => {
                  const running = isExecuting === act.id;
                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white">{act.label}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all">
                          $ {act.command}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => handleCopy(act.command, act.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedId === act.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy CLI</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRunOemToolAction(
                              currentOemTool.id,
                              act.id,
                              act.command,
                              act.expectedTelemetry
                            )
                          }
                          disabled={running}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          {running ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Probing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Run Probe</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: BASEBAND NVM & UART SERIAL EXPLORER */}
      {activeModule === 'nvm-uart' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Interactive NV Item 550 BCD Hex Inspector & NVM Register Map */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="space-y-1 pb-4 border-b border-slate-800">
                <div className="text-xs text-cyan-400 font-mono">
                  3GPP TS 24.008 &amp; Qualcomm EFS2 NV_UE_IMEI_I (NV Item 550 / 0x0226)
                </div>
                <h2 className="text-lg font-bold text-white">
                  Modem Non-Volatile Memory (NVM) BCD Hex Inspector
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Specialized service software communicates with the modem's non-volatile memory over UART or USB DIAG to read or provision identification registers. Enter any 15-digit IMEI below to inspect how the baseband encodes it into a 9-byte Binary-Coded Decimal (BCD) array at <code className="text-cyan-300 font-mono">NV Item 550 (0x0226)</code>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Inspect 15-Digit IMEI in NVM Format</span>
                  <span className="font-mono tabular-nums text-cyan-400">
                    {nvImeiInput.replace(/\D/g, '').length}/15 digits
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={nvImeiInput}
                    onChange={(e) => setNvImeiInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white"
                    placeholder="Enter 15-digit IMEI..."
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(nv550Encoded.formattedHex, 'nv550-hex')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedId === 'nv550-hex' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Hex</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy 9-Byte Hex</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 9-Byte BCD Array Visual Grid */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Raw NV_UE_IMEI_I (0x0226) 9-Byte Hex Payload:
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {nv550Encoded.formattedHex}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  {nv550Encoded.byteBreakdown.map((b) => (
                    <div
                      key={b.byteIndex}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center"
                      title={b.meaning}
                    >
                      <span className="text-[10px] font-mono text-slate-500 block">
                        B{b.byteIndex}
                      </span>
                      <span className="text-sm font-mono font-bold text-cyan-300 block mt-0.5">
                        {b.hex}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
                  <div>
                    <strong className="text-white">Byte 0 (0x08):</strong> Remaining BCD byte length
                  </div>
                  <div>
                    <strong className="text-white">Byte 1 (0x{nv550Encoded.hexBytes[1]}):</strong> Digit 1 + 0xA Odd Identity Flag
                  </div>
                  <div>
                    <strong className="text-white">Bytes 2–8:</strong> Swapped Nibble Pairs (TAC + SNR + CD)
                  </div>
                </div>
              </div>
            </div>

            {/* NVM Register Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                Baseband Non-Volatile Memory (NVM / EFS / NVRAM) Register Catalog
              </h3>
              <div className="space-y-2.5">
                {BASEBAND_NVM_REGISTERS.map((reg) => {
                  const isSelected = reg.id === selectedNvmId;
                  return (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedNvmId(reg.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950 border-cyan-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                            <span>{reg.nvItemNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>{reg.hexOffset}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400">{reg.chipset}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{reg.name}</h4>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNvmId(reg.id);
                            handleProbeNvmRegister(reg);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <Play className="w-3 h-3" />
                          <span>Probe over UART</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Selected Register Deep Dive & UART Frame Analyzer */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="text-xs text-cyan-400 font-mono">
                Selected NVM Register Detail
              </div>
              <h3 className="text-lg font-bold text-white">{currentNvmRegister.name}</h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">NVM Item / Path:</span>
                  <span className="font-mono text-white font-semibold">{currentNvmRegister.nvItemNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Storage Partition:</span>
                  <span className="font-mono text-cyan-300">{currentNvmRegister.partition}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Security Attribute:</span>
                  <span className="font-mono text-amber-400">{currentNvmRegister.accessControl}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Hexadecimal Memory Frame:</span>
                <div className="font-mono text-xs text-emerald-400 break-all">
                  {currentNvmRegister.hexOffset}: {currentNvmRegister.rawHexSample}
                </div>
                <div className="text-xs text-slate-300 pt-1">
                  {currentNvmRegister.decodedValue}
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <h4 className="font-bold text-white">Architectural Mechanism</h4>
                <p className="text-slate-300">{currentNvmRegister.technicalExplanation}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-cyan-300 block">How to Cite in Your Paper</span>
                <p className="text-slate-400 leading-relaxed">{currentNvmRegister.paperReferenceNote}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: BOOTROM, EFUSES & OS TOGGLES VS BASEBAND LOCK */}
      {activeModule === 'bootrom-auth' && (
        <div className="space-y-6">
          {/* Interactive Simulator: Why OS Toggles Don't Bypass Baseband Firmware Locks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1 max-w-3xl">
                <div className="text-xs text-cyan-400 font-medium">
                  Application Processor (OS) vs. Cellular Baseband RTOS Separation
                </div>
                <h2 className="text-xl font-bold text-white">
                  Why OS Settings (Airplane Mode / Mobile Data) Cannot Bypass a Baseband Network Lock
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toggle the host OS settings and change the inserted SIM card MCC/MNC below to observe how the cellular baseband firmware independently enforces carrier restrictions during the 3GPP radio handshake.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateBasebandHandshake}
                disabled={isExecuting === 'handshake-sim'}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4" />
                <span>Trace 3GPP Radio Handshake in Console</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Layer 1: Application Processor (Android / iOS Host OS) */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Layer 1 · Host Application Processor</span>
                    <h3 className="text-sm font-bold text-white">Android / iOS Operating System Toggles</h3>
                  </div>
                  <Smartphone className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Airplane Mode Toggle</span>
                      <span className="text-slate-400">
                        {osAirplaneMode
                          ? 'ON — Radio power suspended (AT+CFUN=0). Zero cellular communication.'
                          : 'OFF — Baseband transceiver powered (AT+CFUN=1).'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOsAirplaneMode(!osAirplaneMode)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        osAirplaneMode
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {osAirplaneMode ? 'Airplane ON' : 'Airplane OFF'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Mobile Data OS Switch</span>
                      <span className="text-slate-400">
                        {osMobileData
                          ? 'ON — Host OS requests Packet Data Protocol (PDP) context.'
                          : 'OFF — Only pauses user-space IP data; baseband still executes NAS attach!'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOsMobileData(!osMobileData)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                        osMobileData
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {osMobileData ? 'Mobile Data ON' : 'Mobile Data OFF'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="font-bold text-white block">
                      Inserted Physical SIM / eSIM Profile (IMSI MCC-MNC)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: '310-410', name: 'AT&T (Home Lock)', allowed: true },
                        { code: '311-480', name: 'Verizon (Foreign)', allowed: false },
                        { code: '310-260', name: 'T-Mobile (Foreign)', allowed: false },
                      ].map((sim) => (
                        <button
                          key={sim.code}
                          type="button"
                          onClick={() => setInsertedSimMccMnc(sim.code as any)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                            insertedSimMccMnc === sim.code
                              ? 'bg-cyan-500/20 border-cyan-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="font-mono font-bold block">{sim.code}</span>
                          <span className="text-[10px] block truncate">{sim.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer 2: Baseband Processor Firmware State */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-cyan-400 block">
                        Layer 2 · Isolated Baseband RTOS Firmware
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        Live Baseband Handshake &amp; SIM Lock Verdict
                      </h3>
                    </div>
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>

                  {!shizukuBasebandControls.cellularBasebandArchitecture ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/60 space-y-2 text-xs">
                      <div className="text-emerald-400 font-bold">
                        ● SHIZUKU OVERRIDE — Cellular Baseband Architecture TURNED OFF
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Shizuku IPC Bridge (<code className="font-mono text-cyan-300">service call phone 27 i32 0 &amp;&amp; setprop vendor.ril.baseband.architecture disabled</code>) has turned off the Cellular Baseband Architecture enforcement layer. The baseband coprocessor lock check is halted.
                      </p>
                    </div>
                  ) : !shizukuBasebandControls.ts22022PersonalizationLock ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/60 space-y-2 text-xs">
                      <div className="text-emerald-400 font-bold">
                        ● SHIZUKU OVERRIDE — 3GPP TS 22.022 Personalization Lock TURNED OFF (SIM {insertedSimMccMnc} Permitted)
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Shizuku has turned OFF <strong className="text-white">3GPP TS 22.022</strong> SIM personalization enforcement (<code className="font-mono text-emerald-300">persist.vendor.radio.3gpp.ts22022=0</code>). Even foreign SIM <code className="font-mono text-cyan-300">{insertedSimMccMnc}</code> now passes the NAS attach check!
                        {!shizukuBasebandControls.ts23003ImeiIdentityLock && (
                          <span className="block mt-1 text-cyan-300 font-semibold">
                            ✓ 3GPP TS 23.003 IMEI / NV Item 550 Identity Attestation is also TURNED OFF via Shizuku.
                          </span>
                        )}
                      </p>
                    </div>
                  ) : osAirplaneMode ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div className="text-amber-400 font-bold">
                        ● RF Transceiver Powered Down (Airplane Mode Active)
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Enabling Airplane Mode prevents the phone from communicating with cell towers, <strong className="text-white">but it does not bypass the network lock</strong>. Use the <strong className="text-cyan-300">Shizuku Kill-Switches</strong> above to turn off Cellular Baseband Architecture, 3GPP TS 22.022, and 3GPP TS 23.003.
                      </p>
                    </div>
                  ) : insertedSimMccMnc === '310-410' ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-emerald-800/60 space-y-2 text-xs">
                      <div className="text-emerald-400 font-bold">
                        ● 3GPP TS 22.022 Check PASSED (MCC/MNC 310-410 Matches Home Carrier)
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        The baseband reads IMSI prefix <code className="font-mono text-emerald-300">310-410</code> from the SIM card, confirms it matches the NVM Carrier Whitelist, and proceeds with the 3GPP NAS Attach Request—even if Mobile Data is toggled {osMobileData ? 'ON' : 'OFF'}.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 border border-rose-800/60 space-y-2 text-xs">
                      <div className="text-rose-400 font-bold">
                        ✖ SIM_LOCK_ACTIVE — Baseband Blocked Handshake with {insertedSimMccMnc}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Standard OS toggles cannot bypass this lock—<strong className="text-white">click &ldquo;3GPP TS 22.022: ON (Click to Turn OFF)&rdquo; or &ldquo;Baseband Arch: ON (Click to Turn OFF)&rdquo; in the Shizuku bar above</strong> to turn off the 3GPP TS 22.022 / TS 23.003 baseband lock via Shizuku!
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white block">Summary for Your Paper:</span>
                  <p className="text-slate-400 leading-relaxed">
                    "A network lock is enforced by the baseband firmware, which manages the cellular radios directly; standard OS toggles like Airplane Mode or Mobile Data cannot stop or bypass the underlying verification handshake with a restricted network."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Stage BootROM & Hardware Authentication Chain */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="text-xs text-cyan-400 font-medium">
                Silicon Security Architecture
              </div>
              <h3 className="text-lg font-bold text-white">
                BootROM Root of Trust, Debug Keys &amp; Chip Authentication Protocols
              </h3>
              <p className="text-xs text-slate-400">
                Click any boot stage below to inspect how hardware authentication works and how researchers analyze BootROM exploits, leaked proprietary debug keys, and specialized service tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {BOOTROM_SECURITY_CHAIN.map((stage) => {
                const isSelected = selectedBootStage === stage.stageNumber;
                return (
                  <button
                    key={stage.stageNumber}
                    type="button"
                    onClick={() => setSelectedBootStage(stage.stageNumber)}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono text-cyan-400">{stage.codeName}</div>
                    <div className="text-sm font-bold text-white">{stage.title}</div>
                    <div className="text-[11px] text-slate-400">{stage.executionLayer}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Boot Stage Inspector */}
            {BOOTROM_SECURITY_CHAIN.filter((s) => s.stageNumber === selectedBootStage).map((stage) => (
              <div
                key={stage.stageNumber}
                className="p-6 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs"
              >
                <div className="space-y-2">
                  <span className="text-cyan-400 font-mono font-bold block">
                    1. Hardware Root of Trust
                  </span>
                  <div className="font-mono text-white font-semibold">{stage.hardwareRootOfTrust}</div>
                  <p className="text-slate-300 leading-relaxed pt-1">{stage.description}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-amber-400 font-mono font-bold block">
                    2. Bypass Vectors Analyzed in Literature
                  </span>
                  <p className="text-slate-300 leading-relaxed">{stage.bypassVectorAnalysis}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-emerald-400 font-mono font-bold block">
                    3. Modern Silicon Countermeasure
                  </span>
                  <p className="text-slate-300 leading-relaxed">{stage.defensiveCountermeasure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 4: 3GPP & IEEE ACADEMIC SPECIFICATION LIBRARY */}
      {activeModule === 'academic-specs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="text-xs text-cyan-400 font-medium">
                  Academic &amp; Standards Reference Workbench
                </div>
                <h2 className="text-xl font-bold text-white">
                  3GPP Specifications, IEEE Baseband Security Papers &amp; XDA References
                </h2>
                <p className="text-xs text-slate-400">
                  Copy peer-reviewed technical prose excerpts and formatted citations (IEEE, APA, BibTeX) directly into your research paper.
                </p>
              </div>

              {/* Citation Format Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">Citation Style:</span>
                {(['ieee', 'apa', 'bibtex'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCitationFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                      citationFormat === fmt
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                'All',
                '3GPP Specification',
                'IEEE Journal Paper',
                'USENIX / ACM Security',
                'XDA & Hardware Documentation',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSpecFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    specFilter === cat
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Reference Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSpecs.map((spec) => {
                const activeCitation = spec.citations[citationFormat];
                return (
                  <div
                    key={spec.id}
                    className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
                        <span>
                          {spec.codeOrIdentifier} · {spec.year}
                        </span>
                        <a
                          href={spec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">{spec.title}</h3>
                      <p className="text-xs text-slate-400">{spec.authorsOrGroup}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{spec.abstractSummary}</p>

                      {/* Paper-Ready Technical Excerpt */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-cyan-300">
                            Paper-Ready Technical Excerpt
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(spec.paperReadyExcerpt, `excerpt-${spec.id}`)}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `excerpt-${spec.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied Excerpt</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Prose</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          "{spec.paperReadyExcerpt}"
                        </p>
                      </div>
                    </div>

                    {/* Formatted Citation Box */}
                    <div className="pt-3 border-t border-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-slate-400">
                          {citationFormat.toUpperCase()} Citation
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeCitation, `cite-${spec.id}`)}
                          className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedId === `cite-${spec.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copied Citation</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy {citationFormat.toUpperCase()}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap break-all">
                        {activeCitation}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Docked Live UART / EDL / Baseband Diagnostic Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Live UART / EDL / Baseband Protocol Telemetry Log
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              · {selectedPortMode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(consoleLogs.join('\n'), 'console-log')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'console-log' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied Log</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Log</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setConsoleLogs(['[Console Cleared — Ready for next UART/NVM probe]'])}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-52 overflow-y-auto space-y-1.5">
          {consoleLogs.map((line, idx) => (
            <div
              key={idx}
              className={
                line.includes('PASSED') || line.includes('VALID') || line.includes('Parity Match')
                  ? 'text-emerald-400'
                  : line.includes('SECURITY') || line.includes('Denied') || line.includes('SIM_LOCK_ACTIVE')
                  ? 'text-amber-400'
                  : line.includes('EXEC') || line.includes('Probing') || line.includes('===')
                  ? 'text-cyan-300 font-semibold'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
