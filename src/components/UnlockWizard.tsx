import React, { useState } from 'react';
import { Smartphone, CheckCircle, ExternalLink, PhoneCall, Copy, Check, AlertCircle, HelpCircle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { CARRIERS_LIST, POPULAR_PHONES } from '../data/carriers.ts';

interface UnlockWizardProps {
  initialBrand?: string;
  initialCarrier?: string;
  onNavigateToNck: () => void;
}

export const UnlockWizard: React.FC<UnlockWizardProps> = ({
  initialBrand = 'Apple',
  initialCarrier = 'att',
  onNavigateToNck,
}) => {
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(initialCarrier);
  const [selectedCondition, setSelectedCondition] = useState('paid_off');
  const [copiedScript, setCopiedScript] = useState(false);

  const brandObj = POPULAR_PHONES.find((b) => b.brand.toLowerCase() === selectedBrand.toLowerCase()) || POPULAR_PHONES[0];
  const carrierObj = CARRIERS_LIST.find((c) => c.id === selectedCarrier) || CARRIERS_LIST[0];

  const currentModels = brandObj.models;
  const activeModel = selectedModel || currentModels[0];

  const isIos = brandObj.os === 'iOS';

  const customerServiceScript = `Hello, I am calling regarding my ${selectedBrand} ${activeModel}. The device is in good standing and I would like to request an official Network SIM Unlock under standard CTIA unlocking commitments so that I can use it with another cellular provider. My IMEI is readily available. Could you please process this unlock request or provide the Network Control Key (NCK)?`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(customerServiceScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Custom Device Unlock Guide Generator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Universal Carrier Unlock Roadmap for <span className="text-cyan-400">{selectedBrand}</span> on <span className="text-blue-400">{carrierObj.name}</span>
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Select your exact phone model, network carrier, and contract status to generate step-by-step instructions, official carrier portal links, customer support call scripts, and verification tests.
          </p>
        </div>

        {/* Step-by-Step Selectors */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Phone Manufacturer
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                const b = POPULAR_PHONES.find((p) => p.brand === e.target.value);
                if (b) setSelectedModel(b.models[0]);
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white cursor-pointer"
            >
              {POPULAR_PHONES.map((p) => (
                <option key={p.brand} value={p.brand}>
                  {p.brand}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Device Model
            </label>
            <select
              value={activeModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white cursor-pointer"
            >
              {currentModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Current Carrier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Current Network Lock
            </label>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white cursor-pointer"
            >
              {CARRIERS_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Financing / Account
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white cursor-pointer"
            >
              <option value="paid_off">Device Paid In Full</option>
              <option value="contract">Financed / On Installment Plan</option>
              <option value="second_hand">Purchased Second-Hand (eBay/Swappa)</option>
              <option value="military">Active Military Deployed Abroad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated Guide Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step-by-Step Procedure */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Unlock Process */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Step-by-Step Unlock Procedure</span>
              </h3>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                Target: {selectedBrand} {activeModel}
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-sm shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">
                    Retrieve Device 15-Digit IMEI &amp; Model Number
                  </h4>
                  <p className="text-xs text-slate-300">
                    Open the Phone app keypad and dial <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-cyan-300 font-bold">*#06#</span>. A screen will immediately pop up showing your IMEI, IMEI2 (for eSIM/dual SIM), and serial number. Write down IMEI 1.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-sm shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">
                    Submit Request to Official {carrierObj.name} Portal
                  </h4>
                  <p className="text-xs text-slate-300">
                    {carrierObj.autoUnlock
                      ? `${carrierObj.name} devices unlock automatically ${carrierObj.lockPeriodPostpaidDays} days following initial activation. However, you can request an expedited review if day 60 has passed.`
                      : `Navigate to the ${carrierObj.name} online portal at ${carrierObj.portalLabel}. Select whether you are a current or former customer and input your 15-digit IMEI.`}
                  </p>
                  <div className="pt-2">
                    <a
                      href={carrierObj.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg transition"
                    >
                      <span>Visit {carrierObj.portalLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-sm shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">
                    Apply the Unlock to Your Device Hardware
                  </h4>
                  {isIos ? (
                    <div className="text-xs text-slate-300 space-y-2">
                      <p>
                        <strong className="text-white">Apple iPhone Specifics:</strong> iPhones do not use unlock codes. Once {carrierObj.name} approves the request, Apple’s GSX activation servers update the activation profile.
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Connect your iPhone to a reliable Wi-Fi network.</li>
                        <li>Power off the iPhone, insert a SIM card from your new carrier (or scan your new carrier’s eSIM QR code).</li>
                        <li>Turn on your iPhone. If prompted, sign in with your Apple ID to complete activation.</li>
                        <li>Go to <strong className="text-slate-200">Settings &gt; General &gt; About &gt; Carrier Lock</strong>. It should now state <strong className="text-emerald-400">"No SIM restrictions"</strong>.</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 space-y-2">
                      <p>
                        <strong className="text-white">Android ({selectedBrand}) Specifics:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>
                          {carrierObj.name.includes('T-Mobile') || carrierObj.name.includes('Metro')
                            ? 'Go to Settings > Connections > More connection settings > Network Unlock > tap "Permanent Unlock" while connected to Wi-Fi.'
                            : 'Power off device, insert an incompatible SIM from another carrier, and boot up.'}
                        </li>
                        <li>
                          When the phone boots, it will prompt: <strong className="text-cyan-300">"SIM Network Unlock PIN"</strong> or <strong className="text-cyan-300">"Enter Network Control Key (NCK)"</strong>.
                        </li>
                        <li>
                          Input the 8-to-16 digit NCK code provided in your approval email from {carrierObj.name} and tap Unlock.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Care Call Script */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Customer Care Phone Script &amp; Tier 2 Prompt
                </h3>
              </div>
              <a
                href={`tel:${carrierObj.phoneSupport.replace(/[^0-9+]/g, '')}`}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer"
              >
                <span>Call {carrierObj.phoneSupport}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              If the online portal rejects your request or you are a former customer/bought the phone used, call the number above and read this prompt:
            </p>

            <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-sans leading-relaxed relative">
              "{customerServiceScript}"
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Script to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Carrier Rules & Troubleshooting */}
        <div className="space-y-6">
          {/* Policy Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{carrierObj.name} Policy Rules</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Postpaid Tenure:</span>
                <span className="font-semibold text-white">
                  {carrierObj.lockPeriodPostpaidDays === 0 ? 'Immediate (Unrestricted)' : `${carrierObj.lockPeriodPostpaidDays} Days`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Prepaid Tenure:</span>
                <span className="font-semibold text-white">
                  {carrierObj.lockPeriodPrepaidDays === 0 ? 'Immediate (Unrestricted)' : `${carrierObj.lockPeriodPrepaidDays} Days`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Automatic Unlock:</span>
                <span className={`font-semibold ${carrierObj.autoUnlock ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {carrierObj.autoUnlock ? 'Yes (FCC Automated)' : 'Requires Portal Submission'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Military Exception:</span>
                <span className="font-semibold text-cyan-400">
                  {carrierObj.militaryWaiver ? 'Expedited with Orders' : 'Standard'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Key Requirements:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {carrierObj.notes.map((n, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <a
                href={carrierObj.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition cursor-pointer"
              >
                <span>Open {carrierObj.portalLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Code vs Server Prompt Helper */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-indigo-400" />
              <span>Did Your Phone Ask For a Code?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If your screen asks for <strong className="text-white">"SIM Network Unlock PIN"</strong> or <strong className="text-white">"Master Code (MCK)"</strong>, do NOT guess randomly. Entering wrong codes 5-10 times can permanently freeze your SIM slot.
            </p>
            <button
              type="button"
              onClick={onNavigateToNck}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
            >
              <span>Read NCK &amp; MCK Code Decoder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
