import React from 'react';
import {
  Smartphone,
  Unlock,
  Search,
  ShieldCheck,
  Sparkles,
  Building2,
  Key,
  DollarSign,
  Database,
  CheckCircle2,
  Zap,
  Eye,
  EyeOff,
  Cpu,
  Package,
  Box,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDialerModal: () => void;
}

export interface HubGroup {
  hubId: string;
  hubLabel: string;
  hubSubtitle: string;
  defaultTab: string;
  subTabs: Array<{
    id: string;
    label: string;
    shortDesc: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export const WORKSPACE_HUBS: HubGroup[] = [
  {
    hubId: 'hub-modem-bios',
    hubLabel: 'Modem & BIOS Core',
    hubSubtitle: 'SIM/eSIM Carrier Masking, Modem Handshake, BIOS/NVM & Shizuku IPC',
    defaultTab: 'boot-bios-sandbox',
    subTabs: [
      {
        id: 'boot-bios-sandbox',
        label: 'Modem, SIM/eSIM Carrier & BIOS Workbench',
        shortDesc: 'Multi-Carrier SIM/eSIM Properties, Master Switch & BIOS/NVM Sandbox',
        icon: Box,
      },
      {
        id: 'shizuku',
        label: 'Shizuku Binder IPC Bridge',
        shortDesc: 'Privileged UID 0 / 2000 Telephony & Radio Binder Transactions',
        icon: Zap,
      },
      {
        id: 'secret-menus',
        label: 'Engineering Secret Dialer Menus',
        shortDesc: '*#*#4636#*#*, ServiceMode *#0011#, Qualcomm DIAG & MTK EngineerMode',
        icon: Eye,
      },
    ],
  },
  {
    hubId: 'hub-baseband',
    hubLabel: 'Baseband Lab',
    hubSubtitle: 'Qualcomm Firehose EDL, Samsung Odin3, MediaTek SP Flash & NV Item 550',
    defaultTab: 'baseband-lab',
    subTabs: [
      {
        id: 'baseband-lab',
        label: 'Baseband & Firmware Engineering Lab',
        shortDesc: 'QFIL / Odin / SP Flash Protocols, NVM Item 550 Hex & 3GPP Architecture',
        icon: Cpu,
      },
    ],
  },
  {
    hubId: 'hub-imei-identity',
    hubLabel: 'IMEI & Identity Lab',
    hubSubtitle: 'Luhn-10 Synthesizer, NVM Redaction, TAC Hardware Decoder & Lock Checks',
    defaultTab: 'imei-masking',
    subTabs: [
      {
        id: 'imei-masking',
        label: 'IMEI Synthesizer (Luhn-10) & NVM Redactor',
        shortDesc: 'Brand & Model TAC Synthesizer, Luhn Matrix & NV Item 550 Log Scrubber',
        icon: EyeOff,
      },
      {
        id: 'imei-lookup',
        label: 'IMEI TAC & Hardware Inspector',
        shortDesc: '3GPP TS 23.003 TAC Breakdown, SoC Baseband Mapping & Lab Routing',
        icon: Search,
      },
      {
        id: 'imei',
        label: 'Carrier Eligibility & GSMA Diagnostic',
        shortDesc: 'Pre-Unlock Contract, Financial & Blacklist Readiness Check',
        icon: CheckCircle2,
      },
      {
        id: 'check-status',
        label: 'iOS & Android Lock Status Guide',
        shortDesc: 'Verify SIM Restrictions in Settings & Carrier Config',
        icon: ShieldCheck,
      },
    ],
  },
  {
    hubId: 'hub-carrier-unlock',
    hubLabel: 'Carrier Unlock Suite',
    hubSubtitle: 'Universal Unlock Wizard, NCK/MCK Decoder, Model DB & Carrier Portals',
    defaultTab: 'wizard',
    subTabs: [
      {
        id: 'wizard',
        label: 'Universal Unlock Wizard',
        shortDesc: 'Step-by-Step Guided Carrier Removal for Apple, Samsung, Google & More',
        icon: Unlock,
      },
      {
        id: 'nck',
        label: 'NCK / MCK / SPCK Decoder',
        shortDesc: '3GPP TS 22.022 Personalization Categories & Cryptographic Key Analysis',
        icon: Key,
      },
      {
        id: 'codes-db',
        label: 'OEM Unlock Codes Database',
        shortDesc: 'Searchable OEM Model Unlock Sequences & Carrier Instructions',
        icon: Database,
      },
      {
        id: 'carriers',
        label: 'Official Carrier Portals',
        shortDesc: 'Direct FCC/CTIA Carrier Unlock Portals & Policy Requirements',
        icon: Building2,
      },
      {
        id: 'advisor',
        label: 'FCC / CTIA Policy Advisor',
        shortDesc: 'Interactive Carrier Unlock Policy & Military/Travel Exception Guide',
        icon: Sparkles,
      },
      {
        id: 'savings',
        label: 'MVNO Switch Calculator',
        shortDesc: 'Calculate Annual Savings After Unlocking Your Phone',
        icon: DollarSign,
      },
    ],
  },
  {
    hubId: 'hub-apk-studio',
    hubLabel: 'APK Builder Studio',
    hubSubtitle: 'Universal Multi-Engine Android APK Compiler & Packaging Engine',
    defaultTab: 'apk-compiler',
    subTabs: [
      {
        id: 'apk-compiler',
        label: 'Universal Multi-Engine APK Builder',
        shortDesc: 'Compile APKs from Custom Uploaded Files, HTML5/JS, System Files or Full Suite',
        icon: Package,
      },
    ],
  },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenDialerModal }) => {
  // Determine which Primary Hub owns the current activeTab
  const currentHub =
    WORKSPACE_HUBS.find((hub) => hub.subTabs.some((t) => t.id === activeTab)) || WORKSPACE_HUBS[0];

  return (
    <header className="sticky top-0 z-50 bg-[#050811]/95 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: Zone 1 Brand Wordmark — Zone 2 5 Primary Hub Links — Zone 3 Primary Action */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('boot-bios-sandbox')}
            className="flex items-center gap-3 text-left cursor-pointer whitespace-nowrap shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center shadow-sm">
              <svg
                viewBox="0 0 64 64"
                className="w-6 h-6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="navHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <polygon
                  points="32,5 56,18.5 56,45.5 32,59 8,45.5 8,18.5"
                  fill="#091024"
                  stroke="url(#navHexGrad)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <path
                  d="M 26 28 V 21 C 26 17.5 28.5 15 32 15 C 35 15 37.5 17 38 20"
                  stroke="#10B981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <rect x="21" y="27" width="22" height="18" rx="4" fill="url(#navHexGrad)" />
                <circle cx="32" cy="34.5" r="2.5" fill="#050811" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
              OmniUnlock Studio
            </span>
          </button>

          {/* Zone 2: 5 Primary Domain Hubs (Single-line text navigation) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            {WORKSPACE_HUBS.map((hub) => {
              const isHubActive = currentHub.hubId === hub.hubId;
              return (
                <button
                  key={hub.hubId}
                  type="button"
                  onClick={() => setActiveTab(hub.defaultTab)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isHubActive
                      ? 'text-cyan-300 font-semibold underline underline-offset-8 decoration-cyan-400 decoration-2'
                      : 'hover:text-white'
                  }`}
                >
                  {hub.hubLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenDialerModal}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Dial *#06# Helper</span>
            </button>
          </div>
        </div>

        {/* Mobile Hub Selector (visible on small viewports) */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800/70">
          {WORKSPACE_HUBS.map((hub) => {
            const isHubActive = currentHub.hubId === hub.hubId;
            return (
              <button
                key={hub.hubId}
                type="button"
                onClick={() => setActiveTab(hub.defaultTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isHubActive
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {hub.hubLabel}
              </button>
            );
          })}
        </div>

        {/* Contextual Sub-Tab Bar for the Active Hub (only shown when the Hub has multiple related tools) */}
        {currentHub.subTabs.length > 1 && (
          <div className="flex items-center justify-between gap-4 py-2.5 border-t border-slate-800/60 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {currentHub.subTabs.map((sub) => {
                const Icon = sub.icon;
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveTab(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isSubActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSubActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="hidden xl:inline text-[11px] text-slate-500 whitespace-nowrap shrink-0">
              {currentHub.hubSubtitle}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

