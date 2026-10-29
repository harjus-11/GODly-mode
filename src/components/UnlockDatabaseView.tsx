import React, { useState, useMemo } from 'react';
import { Database, Search, Filter, Key, CheckCircle, ExternalLink, PhoneCall, Copy, Check, Shield, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { CARRIER_UNLOCK_DATABASE, UnlockEntry } from '../data/unlockDatabase.ts';

interface UnlockDatabaseViewProps {
  onSelectModel?: (brand: string, model: string) => void;
}

export const UnlockDatabaseView: React.FC<UnlockDatabaseViewProps> = ({ onSelectModel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('att-iphone-all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter options
  const carriers = ['ALL', 'AT&T', 'Verizon Wireless', 'T-Mobile', 'Metro by T-Mobile', 'Cricket Wireless', 'Boost Mobile', 'Universal / All Carriers', 'UK Networks (EE, Vodafone, O2, Three)', 'Canadian Carriers (Rogers, Bell, Telus)'];
  const brands = ['ALL', 'Apple', 'Samsung', 'Google', 'Motorola', 'OnePlus', 'Universal'];
  const regions = ['ALL', 'United States', 'United Kingdom', 'Canada', 'Global / North America'];

  const filteredEntries = useMemo(() => {
    return CARRIER_UNLOCK_DATABASE.filter((entry) => {
      const matchSearch =
        entry.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.phoneModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.codeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.unlockCodeOrSyntax.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.region.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCarrier = selectedCarrier === 'ALL' || entry.carrier.toLowerCase().includes(selectedCarrier.toLowerCase());
      const matchBrand = selectedBrand === 'ALL' || entry.manufacturer.toLowerCase() === selectedBrand.toLowerCase();
      const matchRegion = selectedRegion === 'ALL' || entry.region.toLowerCase().includes(selectedRegion.toLowerCase());

      return matchSearch && matchCarrier && matchBrand && matchRegion;
    });
  }, [searchTerm, selectedCarrier, selectedBrand, selectedRegion]);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5" />
            <span>Master Telecom Registry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Carrier Unlock Codes &amp; Procedures Database
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Explore verified network unlock codes, command syntax, and official step-by-step procedures categorized by mobile carrier, phone model, and region.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search carrier (AT&T, Verizon, T-Mobile), model (iPhone, Galaxy, Pixel), code type or syntax..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 transition"
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

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Carrier Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Carrier
              </label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
              >
                {carriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Manufacturer
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

            {/* Region Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Filter by Region / Country
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredEntries.length}</strong> unlock procedure entries
        </span>
        <span>Click any card to expand full instructions</span>
      </div>

      {/* Database Cards List */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <div
              key={entry.id}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? 'bg-slate-900 border-cyan-500/60 shadow-xl shadow-cyan-500/5'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Row (Always Visible) */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
                      {entry.carrier}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {entry.region}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {entry.codeType}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {entry.phoneModel}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{entry.timeEstimate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Difficulty: {entry.difficulty}</span>
                    </span>
                  </div>
                </div>

                {/* Right Preview & Toggle */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <div className="text-[11px] text-slate-400">Unlock Code / Mechanism</div>
                    <div className="text-xs font-mono font-bold text-cyan-300 max-w-[240px] truncate">
                      {entry.unlockCodeOrSyntax}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed View */}
              {isExpanded && (
                <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-800/80 space-y-6">
                  {/* Code Highlight Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Specific Unlock Code or Syntax
                      </div>
                      <div className="text-sm sm:text-base font-mono font-bold text-cyan-300 mt-1">
                        {entry.unlockCodeOrSyntax}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(entry.id, entry.unlockCodeOrSyntax)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Code</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Syntax</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Carrier Eligibility Requirements
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {entry.prerequisites.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step by Step Instructions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Required Step-by-Step Instructions
                    </h4>
                    <ol className="space-y-2">
                      {entry.stepByStepInstructions.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold shrink-0 border border-cyan-800 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Verification Check & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <strong className="text-emerald-400 font-bold block mb-1">
                        How to Verify Success:
                      </strong>
                      <span className="text-slate-300">{entry.verificationCheck}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <strong className="text-cyan-400 font-bold block mb-1">
                        Technical Note:
                      </strong>
                      <span className="text-slate-300">{entry.notes}</span>
                    </div>
                  </div>

                  {/* Direct Action Links */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {entry.portalUrl && (
                      <a
                        href={entry.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        <span>Open Official Carrier Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <a
                      href={`tel:${entry.customerServiceNumber.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Customer Support: <strong className="text-white underline">{entry.customerServiceNumber}</strong></span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No unlock procedures match your search</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the carrier or manufacturer filters above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
