import React from 'react';
import { Building2, ExternalLink, ShieldCheck, Clock, PhoneCall, AlertCircle } from 'lucide-react';
import { CARRIERS_LIST } from '../data/carriers.ts';

export const CarrierDirectory: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Verified Official Channels</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Official Mobile Carrier Unlocking Portals
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Direct access to official carrier submission portals, mandated tenure timelines, customer care numbers, and unlocking criteria under FCC and CTIA regulations.
          </p>
        </div>
      </div>

      {/* Carrier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARRIERS_LIST.map((carrier) => (
          <div
            key={carrier.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{carrier.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {carrier.country}
                    </span>
                  </div>
                  <a
                    href={`tel:${carrier.phoneSupport.replace(/[^0-9+]/g, '')}`}
                    className="text-xs text-slate-400 hover:text-cyan-300 mt-1 inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Support: <strong className="underline text-slate-200">{carrier.phoneSupport}</strong></span>
                  </a>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    carrier.autoUnlock
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  }`}
                >
                  {carrier.autoUnlock ? 'Automatic' : 'Online Portal'}
                </span>
              </div>

              {/* Tenure Rules */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Postpaid Tenure:</span>
                  <span className="font-bold text-white">
                    {carrier.lockPeriodPostpaidDays === 0 ? 'Immediate' : `${carrier.lockPeriodPostpaidDays} Days`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Prepaid Tenure:</span>
                  <span className="font-bold text-white">
                    {carrier.lockPeriodPrepaidDays === 0 ? 'Immediate' : `${carrier.lockPeriodPrepaidDays} Days`}
                  </span>
                </div>
              </div>

              {/* Policy Criteria */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unlocking Criteria:
                </h4>
                {carrier.notes.map((n, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span className="text-slate-300">{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Link */}
            <div className="pt-4 border-t border-slate-800">
              <a
                href={carrier.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 hover:border-cyan-500/40 transition cursor-pointer"
              >
                <span>Open {carrier.portalLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
