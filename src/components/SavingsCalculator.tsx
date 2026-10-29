import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap, Info, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const SavingsCalculator: React.FC = () => {
  const [currentBillPerLine, setCurrentBillPerLine] = useState(85);
  const [lines, setLines] = useState(2);
  const [targetMvno, setTargetMvno] = useState('visible');
  const [commercialUnlockFee, setCommercialUnlockFee] = useState(65); // Average third-party paid service fee
  const [chartView, setChartView] = useState<'savings' | 'comparison'>('savings');

  const mvnoOptions: Record<string, { name: string; cost: number; network: string; perk: string }> = {
    mint: { name: 'Mint Mobile', cost: 15, network: 'T-Mobile 5G', perk: 'Unlimited Talk/Text + 5GB 5G Data' },
    visible: { name: 'Visible by Verizon', cost: 25, network: 'Verizon 5G Ultra Wideband', perk: 'Unlimited 5G Data + Unlimited Mobile Hotspot' },
    usmobile: { name: 'US Mobile Warp', cost: 20, network: 'Verizon / T-Mobile', perk: '35GB High-Speed 5G Priority Data' },
    cricket: { name: 'Cricket More', cost: 32, network: 'AT&T 5G', perk: 'Unlimited High-Speed Data + 15GB Hotspot' },
    googlefi: { name: 'Google Fi Simply Unlimited', cost: 25, network: 'T-Mobile 5G', perk: 'Full International Roaming & Dual-network switching' },
  };

  const selectedMvno = mvnoOptions[targetMvno] || mvnoOptions.visible;

  // Monthly breakdown
  const currentTotalMonthly = currentBillPerLine * lines;
  const newTotalMonthly = selectedMvno.cost * lines;
  const monthlySavings = currentTotalMonthly - newTotalMonthly;
  const upfrontCommercialFeeAvoided = commercialUnlockFee * lines;

  // Generate 36-month timeline data for Recharts
  const chartData = useMemo(() => {
    const milestones = [1, 3, 6, 9, 12, 18, 24, 30, 36];
    return milestones.map((month) => {
      // Commercial third-party service route: paid upfront fee + locked carrier rate
      const commercialCarrierSpend = upfrontCommercialFeeAvoided + currentTotalMonthly * month;
      
      // Manual official carrier unlocking route ($0 free legal unlock) + low cost MVNO plan
      const manualUnlockSpend = 0 + newTotalMonthly * month;
      
      // Cumulative savings achieved by choosing manual unlock over commercial service
      const cumulativeSavings = commercialCarrierSpend - manualUnlockSpend;

      return {
        month: `Mo ${month}`,
        monthNum: month,
        manualSpend: manualUnlockSpend,
        commercialSpend: commercialCarrierSpend,
        cumulativeSavings: cumulativeSavings,
      };
    });
  }, [upfrontCommercialFeeAvoided, currentTotalMonthly, newTotalMonthly]);

  const annualSavings = (currentTotalMonthly - newTotalMonthly) * 12 + upfrontCommercialFeeAvoided;
  const threeYearSavings = (currentTotalMonthly - newTotalMonthly) * 36 + upfrontCommercialFeeAvoided;

  // Custom Dark Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>Milestone: {label}</span>
            <span className="text-cyan-400 font-mono">{lines} {lines === 1 ? 'Device' : 'Devices'}</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                ${entry.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800/80">
            Manual unlocking avoids ${upfrontCommercialFeeAvoided} in commercial fee charges.
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Freedom of Unlocking Financial Analysis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Unlocked Phone Carrier Switch &amp; Cumulative Savings
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Track and visualize the cumulative market savings you achieve by choosing 100% free manual carrier unlocking over predatory third-party fee services, combined with low-cost MVNO network freedom.
          </p>
        </div>
      </div>

      {/* Main Grid: Controls + Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Configuration Inputs</span>
            <span className="text-xs font-normal text-cyan-400 font-mono">Live Sync</span>
          </h3>

          {/* Current Cost Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Current Cost Per Line:</span>
              <span className="font-bold text-white font-mono">${currentBillPerLine}/mo</span>
            </div>
            <input
              type="range"
              min={40}
              max={120}
              step={5}
              value={currentBillPerLine}
              onChange={(e) => setCurrentBillPerLine(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$40</span>
              <span>$85 (Avg US Postpaid)</span>
              <span>$120</span>
            </div>
          </div>

          {/* Lines Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Number of Active Lines:</span>
              <span className="font-bold text-white font-mono">{lines} {lines === 1 ? 'Line' : 'Lines'}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 Line</span>
              <span>2 Lines</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Commercial Third-Party Unlock Fee Comparison Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Avoided Third-Party Fee:</span>
              <span className="font-bold text-emerald-400 font-mono">${commercialUnlockFee}/phone</span>
            </div>
            <input
              type="range"
              min={25}
              max={120}
              step={5}
              value={commercialUnlockFee}
              onChange={(e) => setCommercialUnlockFee(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$25 (Basic)</span>
              <span>$65 (Avg Online Scams)</span>
              <span>$120 (Express)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Shady web unlock services charge up to $120. With OmniUnlock's manual carrier guide, your cost is <strong className="text-emerald-400">$0</strong>.
            </p>
          </div>

          {/* Target MVNO */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Target Unlocked Provider
            </label>
            <select
              value={targetMvno}
              onChange={(e) => setTargetMvno(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer"
            >
              {Object.entries(mvnoOptions).map(([key, opt]) => (
                <option key={key} value={key}>
                  {opt.name} (${opt.cost}/mo • {opt.network})
                </option>
              ))}
            </select>
          </div>

          {/* Upfront Savings Highlight */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Day 1 Instant Unlock Savings</span>
            </div>
            <p className="text-slate-300">
              You save <strong className="text-emerald-400">${upfrontCommercialFeeAvoided}</strong> right away on device unlocking fees by following official manual carrier procedures.
            </p>
          </div>
        </div>

        {/* Results 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Big Savings Metric Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Total Cumulative Impact
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Save <span className="text-emerald-400">${annualSavings.toLocaleString()}</span> in Year 1
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Includes ${upfrontCommercialFeeAvoided} in avoided unlock fees + ${monthlySavings * 12} in carrier plan savings across {lines} {lines === 1 ? 'line' : 'lines'}.
                </p>
              </div>

              <div className="text-right bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 shrink-0">
                <div className="text-xs text-slate-400">36-Month Cumulative Savings</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ${threeYearSavings.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Recharts Data Visualization Section */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Cumulative Savings Trajectory (36 Months)
                  </h4>
                </div>

                {/* Chart Mode Switcher */}
                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setChartView('savings')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                      chartView === 'savings'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cumulative Savings ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('comparison')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                      chartView === 'comparison'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Spend Comparison
                  </button>
                </div>
              </div>

              {/* Chart Render */}
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'savings' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `$${value}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulativeSavings"
                        name="Cumulative Savings"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#savingsGradient)"
                      />
                    </AreaChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="commercialGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="manualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `$${value}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
                      />
                      <Area
                        type="monotone"
                        dataKey="commercialSpend"
                        name="Carrier-Fee Route (Paid Unlock + Contract)"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#commercialGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="manualSpend"
                        name="Manual Unlock Route (Free $0 Unlock + MVNO)"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#manualGrad)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manual unlock: 100% legal, permanent baseband unlock, $0 cost.</span>
                </span>
                <span className="text-slate-300 font-mono">
                  Breakeven: Day 1 (Immediate savings of ${upfrontCommercialFeeAvoided})
                </span>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold block">
                  Carrier-Fee &amp; Locked Route
                </span>
                <div className="text-xl font-bold text-rose-400 font-mono">
                  ${currentTotalMonthly}/month + ${upfrontCommercialFeeAvoided} Fee
                </div>
                <p className="text-[11px] text-slate-500">
                  Includes third-party unlock markup + carrier equipment subsidy &amp; high administrative plan overhead.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/50 space-y-2">
                <span className="text-xs text-emerald-300 font-semibold block">
                  Manual Unlocking + {selectedMvno.name}
                </span>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  ${newTotalMonthly}/month + $0 Unlock Fee
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedMvno.perk} on {selectedMvno.network}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
