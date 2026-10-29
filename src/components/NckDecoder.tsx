import React, { useState } from 'react';
import { Key, AlertOctagon, ShieldAlert, CheckCircle2, HelpCircle, PhoneCall, RefreshCcw, Lock, ArrowRight, ExternalLink } from 'lucide-react';

interface NckDecoderProps {
  onNavigateToWizard?: () => void;
  onNavigateToCodes?: () => void;
}

export const NckDecoder: React.FC<NckDecoderProps> = ({ onNavigateToWizard, onNavigateToCodes }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('nck');

  const codeTypes = [
    {
      id: 'nck',
      name: 'NCK (Network Control Key)',
      prompt: '"SIM Network Unlock PIN"',
      purpose: 'Standard carrier network lock key',
      length: '8 to 16 digits',
      description: 'Requested when an Android device detects a SIM card from an unauthorized or competing mobile operator.',
      howToGet: 'Provided directly by your original network carrier for free once tenure or financing requirements are fulfilled.',
      dangerWarning: 'Do NOT guess. Most modern smartphones allow only 3 to 10 attempts before permanently freezing the SIM controller.',
    },
    {
      id: 'mck',
      name: 'MCK (Master Code Key / Defreeze)',
      prompt: '"SIM Network PIN Blocked. Enter SIM network PUK"',
      purpose: 'Unfreezes a locked/frozen SIM baseband',
      length: '8 digits',
      description: 'Appears after the user has repeatedly entered an incorrect NCK unlock code (usually 5 or 10 failed attempts). The phone freezes the network partition as a tamper countermeasure.',
      howToGet: 'Call your carrier’s Tier 2 Technical Support or manufacturer (e.g. Samsung Executive Care) with proof of ownership to generate the Master Defreeze code.',
      dangerWarning: 'Standard customer care reps often do not see MCK on tier-1 screens. Ask specifically for "Baseband Tier 2 Escalation / Defreeze Code".',
    },
    {
      id: 'puk',
      name: 'PUK (Personal Unblocking Key)',
      prompt: '"PIN Blocked / Enter PUK"',
      purpose: 'SIM card PIN security (NOT a phone carrier lock!)',
      length: '8 digits',
      description: 'This is a lock on the SIM card chip itself, NOT a carrier lock on your phone hardware. It occurs when your 4-digit SIM PIN was guessed incorrectly 3 times.',
      howToGet: 'Login to your current carrier’s web account dashboard or look at the plastic credit-card-sized holder your SIM card came with.',
      dangerWarning: '10 incorrect PUK attempts permanently destroys the SIM card chip, requiring a physical SIM replacement.',
    },
    {
      id: 'spc',
      name: 'SPC / MSL (Service Programming Code)',
      prompt: '"Enter Subsidy Password / MSL"',
      purpose: 'CDMA & APN firmware programming',
      length: '6 digits (typically 000000 or custom MSL)',
      description: 'Used historically on CDMA networks (Sprint, older Verizon, US Cellular) to reprogram network APN profiles and roaming PRL tables.',
      howToGet: 'Your carrier will release the 6-digit MSL upon account closure or international roaming request.',
      dangerWarning: 'Modern 5G VoLTE devices rarely require MSL, but legacy LTE handsets may still prompt during manual APN setup.',
    },
  ];

  const activeCode = codeTypes.find((c) => c.id === selectedPrompt) || codeTypes[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Key className="w-3.5 h-3.5" />
            <span>Telecommunications Security Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            NCK, MCK, &amp; PUK Unlock Code Decoder
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Decode exactly what prompt your phone is displaying. Learn the crucial difference between carrier network locks (NCK), baseband freezes (MCK), and SIM card chip locks (PUK).
          </p>
        </div>

        {/* Prompt Selector Buttons */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {codeTypes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedPrompt(c.id)}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                selectedPrompt === c.id
                  ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="text-xs font-mono font-bold text-cyan-400">{c.name.split(' ')[0]}</div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">{c.prompt}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{c.purpose}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Code Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Code Type Analysis
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {activeCode.name}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Typical Code Length</span>
              <div className="text-sm font-bold font-mono text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 mt-0.5">
                {activeCode.length}
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                On-Screen Prompt Display
              </h4>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-sm font-semibold">
                {activeCode.prompt}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                What This Code Does
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {activeCode.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                How to Legally Obtain It
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {activeCode.howToGet}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-200">Critical Warning:</strong>
                <p className="mt-0.5">{activeCode.dangerWarning}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Scam Advisory */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900 border border-red-800/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Beware of "Unlock Crack" Scams</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Thousands of scam websites claim to "generate free unlock codes instantly" via suspicious downloaded executables or asking for upfront Bitcoin/credit card payments.
            </p>

            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span>Third-party tools cannot generate mathematical NCK codes for modern RSA/SHA basebands.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span>Tampering tools often overwrite your NVRAM / EFS partition, permanently erasing your valid IMEI and cellular signal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Only legitimate carrier requests update the official HLR/HSS carrier network database legally and safely.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Need the MCK Defreeze Code?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              If your phone has frozen ("SIM Network PIN Blocked"), ask your carrier representative to submit a ticket for the <strong>"Master Network Unlock Key (MCK)"</strong>. Samsung and Motorola send these to carrier backend engineers upon request.
            </p>

            <div className="pt-2 space-y-2">
              {onNavigateToWizard && (
                <button
                  type="button"
                  onClick={onNavigateToWizard}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  <span>Generate Carrier Call Script</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {onNavigateToCodes && (
                <button
                  type="button"
                  onClick={onNavigateToCodes}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <span>Open Unlock Codes Database</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Legal Rights Reference Links */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Legal Protection Links
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="https://www.fcc.gov/general/cell-phone-unlocking"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span>FCC Official Device Unlocking Rules</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>

              <a
                href="https://www.ctia.org/the-wireless-industry/industry-commitments/consumer-code-for-wireless-service"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <span>CTIA Consumer Code Commitment</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
