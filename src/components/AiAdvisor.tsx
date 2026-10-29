import React, { useState } from 'react';
import { Sparkles, Send, ShieldAlert, CheckCircle2, Clock, HelpCircle, AlertTriangle, ArrowRight, RefreshCw, Cpu } from 'lucide-react';
import { AiAdvisorResponse } from '../types.ts';

export const AiAdvisor: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [phoneModel, setPhoneModel] = useState('Samsung Galaxy S23');
  const [currentCarrier, setCurrentCarrier] = useState('AT&T');
  const [desiredCarrier, setDesiredCarrier] = useState('T-Mobile / Mint Mobile');
  const [lockStatus, setLockStatus] = useState('Device is paid off, bought second-hand on Swappa');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiAdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      title: 'Bought on eBay / Swappa',
      phone: 'iPhone 14 Pro',
      carrier: 'AT&T',
      target: 'Visible by Verizon',
      status: 'Bought second-hand, seller claims paid off',
      q: 'How can I unlock an AT&T iPhone bought on eBay if I am not the original account holder?',
    },
    {
      title: 'Military Deployment Waiver',
      phone: 'Google Pixel 8',
      carrier: 'Verizon',
      target: 'Local German SIM (Telekom)',
      status: 'Active military with deployment orders under 60 days',
      q: 'How do I unlock my Verizon phone prior to the mandatory 60 days for an overseas military deployment?',
    },
    {
      title: 'Frozen SIM "PIN Blocked"',
      phone: 'Samsung Galaxy S22',
      carrier: 'T-Mobile',
      target: 'Cricket Wireless',
      status: 'Entered wrong unlock PIN 5 times',
      q: 'My phone says "SIM Network PIN Blocked. Enter SIM network PUK". How do I get the MCK defreeze key?',
    },
    {
      title: 'International Travel eSIM',
      phone: 'iPhone 15',
      carrier: 'T-Mobile',
      target: 'Airalo / Holafly eSIM',
      status: 'Currently on 24-month installment contract',
      q: 'Can I temporarily unlock my phone to use an international travel eSIM while traveling to Europe?',
    },
  ];

  const handleAsk = async (e?: React.FormEvent, customQ?: typeof presets[0]) => {
    if (e) e.preventDefault();
    const activeQ = customQ ? customQ.q : question;
    const activePhone = customQ ? customQ.phone : phoneModel;
    const activeCarrier = customQ ? customQ.carrier : currentCarrier;
    const activeTarget = customQ ? customQ.target : desiredCarrier;
    const activeStatus = customQ ? customQ.status : lockStatus;

    if (!activeQ.trim() && !activePhone.trim()) {
      setError('Please provide a question or select a scenario.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/carrier/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQ,
          phoneModel: activePhone,
          currentCarrier: activeCarrier,
          desiredCarrier: activeTarget,
          lockStatus: activeStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Advisor request failed');
      }

      const data: AiAdvisorResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Advisor error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreset = (p: typeof presets[0]) => {
    setPhoneModel(p.phone);
    setCurrentCarrier(p.carrier);
    setDesiredCarrier(p.target);
    setLockStatus(p.status);
    setQuestion(p.q);
    handleAsk(undefined, p);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Telecom Policy Advisor (Gemini 3.8 Flash)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            AI Carrier Policy &amp; Tricky Scenario Consultant
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Ask specific legal, technical, and carrier-policy questions regarding second-hand purchases, military deployment unlock exceptions, frozen MCK basebands, or international travel eSIMs.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 font-medium py-1">Popular Scenarios:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 transition cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleAsk} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Model</label>
              <input
                type="text"
                value={phoneModel}
                onChange={(e) => setPhoneModel(e.target.value)}
                placeholder="e.g. iPhone 15 Pro, Galaxy S23"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Carrier</label>
              <input
                type="text"
                value={currentCarrier}
                onChange={(e) => setCurrentCarrier(e.target.value)}
                placeholder="e.g. AT&T, Verizon, T-Mobile"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Carrier</label>
              <input
                type="text"
                value={desiredCarrier}
                onChange={(e) => setDesiredCarrier(e.target.value)}
                placeholder="e.g. Mint Mobile, Visible"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account / Contract State</label>
              <input
                type="text"
                value={lockStatus}
                onChange={(e) => setLockStatus(e.target.value)}
                placeholder="e.g. Paid off, contract, military"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Question</label>
            <div className="relative">
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe your unlock situation in detail..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3.5 text-xs sm:text-sm text-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consulting Gemini Telecom AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Get Expert Carrier Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Response Display */}
      {response && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Engine: {response.source}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Executive Analysis &amp; Action Plan
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estimated Timeline: <strong className="text-white">{response.estimatedTime}</strong></span>
            </div>
          </div>

          {/* Direct Answer Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {response.summary}
          </div>

          {/* Policy Overview */}
          {response.carrierPolicyOverview && (
            <div className="space-y-1.5 text-xs text-slate-300">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Carrier Policy Background
              </h4>
              <p className="leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {response.carrierPolicyOverview}
              </p>
            </div>
          )}

          {/* Action Steps */}
          {response.stepByStepInstructions && response.stepByStepInstructions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Action Steps Required
              </h4>
              <ol className="space-y-2">
                {response.stepByStepInstructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold shrink-0 border border-cyan-800 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Device & NCK Details */}
          {(response.deviceSpecificNotes || response.nckMckExplanation) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {response.deviceSpecificNotes && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-cyan-400 block font-bold">Device Hardware Notes:</strong>
                  <p className="text-slate-300">{response.deviceSpecificNotes}</p>
                </div>
              )}
              {response.nckMckExplanation && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-indigo-400 block font-bold">Baseband / Code Details:</strong>
                  <p className="text-slate-300">{response.nckMckExplanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Warnings & Consumer Rights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {response.consumerRightsTip && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 space-y-1">
                <strong className="text-emerald-400 font-bold block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Consumer Rights Protection</span>
                </strong>
                <p className="text-slate-300">{response.consumerRightsTip}</p>
              </div>
            )}
            {response.fraudWarning && (
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 text-red-300 space-y-1">
                <strong className="text-red-400 font-bold block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Anti-Fraud Advisory</span>
                </strong>
                <p className="text-slate-300">{response.fraudWarning}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
