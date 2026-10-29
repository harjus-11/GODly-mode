import React, { useState, useMemo } from 'react';
import {
  Shield,
  EyeOff,
  Copy,
  Check,
  FileText,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lock,
  Download,
  Info,
  Hash,
  Binary,
  ArrowRight,
} from 'lucide-react';
import { VERIFIED_DEVICE_PROFILES } from '../data/carriers.ts';
import { encodeImeiToNv550Hex } from '../data/basebandData.ts';

type MaskingStyle = 'support' | 'receipt' | 'strict' | 'custom' | 'token';

interface ImeiMaskingViewProps {
  onOpenBasebandNvm?: (imei: string) => void;
}

export const ImeiMaskingView: React.FC<ImeiMaskingViewProps> = ({ onOpenBasebandNvm }) => {
  // Single IMEI Masker State
  const [inputImei, setInputImei] = useState<string>('358942110294854');
  const [maskChar, setMaskChar] = useState<string>('•');
  const [selectedStyle, setSelectedStyle] = useState<MaskingStyle>('support');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Scrubber State
  const [scrubberInput, setScrubberInput] = useState<string>(
    `Subject: AT&T Device Unlock Request Confirmation
Hello Customer,

Your unlock request for Apple iPhone 15 Pro (IMEI: 358942110294854) has been processed.
IMEI 2: 358942110294862
UART NV_READ_F (0x0226): 08 3A 58 94 21 10 29 48 54

Please backup your device and insert your non-AT&T SIM card.`
  );
  const [scrubberMaskStyle, setScrubberMaskStyle] = useState<MaskingStyle>('support');

  // Synthetic Test Generator State (Brand + Model + Step-by-Step Luhn-10 Inspector)
  const BRAND_MODEL_CATALOG: Record<
    string,
    Array<{ model: string; tac: string; chipset: string; releaseYear: string }>
  > = {
    Apple: [
      { model: 'iPhone 16 Pro Max', tac: '35689412', chipset: 'A18 Pro + Snapdragon X75', releaseYear: '2024' },
      { model: 'iPhone 15 Pro Max', tac: '35894211', chipset: 'A17 Pro + Snapdragon X70', releaseYear: '2023' },
      { model: 'iPhone 15 Pro', tac: '35409115', chipset: 'A17 Pro + Snapdragon X70', releaseYear: '2023' },
      { model: 'iPhone 14 Pro', tac: '35391211', chipset: 'A16 Bionic + Snapdragon X65', releaseYear: '2022' },
    ],
    Samsung: [
      { model: 'Galaxy S24 Ultra', tac: '35284911', chipset: 'Snapdragon 8 Gen 3 (X75)', releaseYear: '2024' },
      { model: 'Galaxy Z Fold 6', tac: '35710412', chipset: 'Snapdragon 8 Gen 3 (X75)', releaseYear: '2024' },
      { model: 'Galaxy S23 Ultra', tac: '35094811', chipset: 'Snapdragon 8 Gen 2 (X70)', releaseYear: '2023' },
      { model: 'Galaxy A55 5G', tac: '35819211', chipset: 'Exynos 1480 Shannon 5308', releaseYear: '2024' },
    ],
    Google: [
      { model: 'Pixel 9 Pro XL', tac: '35910412', chipset: 'Tensor G4 + Exynos 5400', releaseYear: '2024' },
      { model: 'Pixel 8 Pro', tac: '35489209', chipset: 'Tensor G3 + Exynos 5300', releaseYear: '2023' },
      { model: 'Pixel 8a', tac: '35620111', chipset: 'Tensor G3 + Exynos 5300', releaseYear: '2024' },
    ],
    Motorola: [
      { model: 'Edge 50 Ultra', tac: '35791211', chipset: 'Snapdragon 8s Gen 3', releaseYear: '2024' },
      { model: 'Edge 40 Pro', tac: '35728409', chipset: 'Snapdragon 8 Gen 2', releaseYear: '2023' },
      { model: 'Razr+ (2024)', tac: '35849011', chipset: 'Snapdragon 8s Gen 3', releaseYear: '2024' },
    ],
    OnePlus: [
      { model: 'OnePlus 12', tac: '35928410', chipset: 'Snapdragon 8 Gen 3 (X75)', releaseYear: '2024' },
      { model: 'OnePlus Open', tac: '35601911', chipset: 'Snapdragon 8 Gen 2 (X70)', releaseYear: '2023' },
    ],
  };

  const [testBrand, setTestBrand] = useState<string>('Apple');
  const [selectedModelTac, setSelectedModelTac] = useState<string>('35689412');
  const [customSnr, setCustomSnr] = useState<string>('482910');
  const [generatedBatch, setGeneratedBatch] = useState<
    Array<{ imei: string; imei2: string; brand: string; model: string; tac: string; snr: string; cd: number }>
  >([]);

  // Calculate Luhn check digit
  const calculateLuhn = (first14Digits: string): number => {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(first14Digits[i] || '0', 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10);
      }
      sum += digit;
    }
    return (10 - (sum % 10)) % 10;
  };

  // Detailed step-by-step Luhn-10 breakdown for the active Brand + Model + SNR
  const activeAcademicDemo = useMemo(() => {
    const modelsForBrand = BRAND_MODEL_CATALOG[testBrand] || BRAND_MODEL_CATALOG['Apple'];
    const modelProfile =
      modelsForBrand.find((m) => m.tac === selectedModelTac) || modelsForBrand[0];
    const cleanSnr = customSnr.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
    const first14 = `${modelProfile.tac}${cleanSnr}`;

    const steps: Array<{
      index: number;
      digit: number;
      isDoubled: boolean;
      doubledValue: number;
      reducedValue: number;
      section: 'TAC' | 'SNR';
    }> = [];

    let runningSum = 0;
    for (let i = 0; i < 14; i++) {
      const digit = parseInt(first14[i] || '0', 10);
      const isDoubled = i % 2 === 1;
      const doubledValue = isDoubled ? digit * 2 : digit;
      const reducedValue =
        isDoubled && doubledValue > 9
          ? Math.floor(doubledValue / 10) + (doubledValue % 10)
          : doubledValue;
      runningSum += reducedValue;
      steps.push({
        index: i + 1,
        digit,
        isDoubled,
        doubledValue,
        reducedValue,
        section: i < 8 ? 'TAC' : 'SNR',
      });
    }

    const checkDigit = (10 - (runningSum % 10)) % 10;
    const fullImei = `${first14}${checkDigit}`;

    // Secondary eSIM SNR (+1)
    const esimSnrNum = ((parseInt(cleanSnr, 10) + 1) % 1000000).toString().padStart(6, '0');
    const esimFirst14 = `${modelProfile.tac}${esimSnrNum}`;
    const esimCd = calculateLuhn(esimFirst14);
    const esimImei = `${esimFirst14}${esimCd}`;

    return {
      brand: testBrand,
      model: modelProfile.model,
      chipset: modelProfile.chipset,
      releaseYear: modelProfile.releaseYear,
      tac: modelProfile.tac,
      snr: cleanSnr,
      checkDigit,
      fullImei,
      esimImei,
      runningSum,
      steps,
    };
  }, [testBrand, selectedModelTac, customSnr]);

  // Masking implementation
  const maskImei = (imei: string, style: MaskingStyle, char: string = '•'): string => {
    const clean = imei.replace(/\D/g, '');
    if (clean.length < 14) return clean;

    const tac = clean.substring(0, 8);
    const cd = clean.length >= 15 ? clean.substring(14, 15) : '';

    switch (style) {
      case 'support':
        return `${tac} ${char.repeat(6)} ${cd}`.trim();
      case 'receipt':
        return `${char.repeat(11)} ${clean.slice(-4)}`;
      case 'strict':
        return `[REDACTED-IMEI]`;
      case 'token': {
        const pseudoHash = Math.abs(
          clean.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
        )
          .toString(16)
          .toUpperCase()
          .padStart(8, '0');
        return `PRV-IMEI-${pseudoHash.slice(0, 4)}-${pseudoHash.slice(4, 8)}`;
      }
      case 'custom':
        return `${clean.substring(0, 6)}${char.repeat(8)}${clean.slice(-1)}`;
      default:
        return `${tac} ${char.repeat(6)} ${cd}`;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clean IMEI input analysis
  const cleanImei = inputImei.replace(/\D/g, '');
  const tacPart = cleanImei.substring(0, 8);
  const snrPart = cleanImei.substring(8, 14);
  const cdPart = cleanImei.substring(14, 15);
  const expectedCd = cleanImei.length >= 14 ? calculateLuhn(cleanImei.substring(0, 14)) : null;
  const isLuhnValid = expectedCd !== null && cdPart === expectedCd.toString();

  // NV Item 550 BCD Hex representation & Masked NVM Hex
  const nv550Data = useMemo(() => {
    const encoded = encodeImeiToNv550Hex(cleanImei || '358942110294854');
    // Mask the SNR bytes (bytes 5, 6, 7, 8) while keeping length + TAC bytes (0..4)
    const maskedHexBytes = encoded.hexBytes.map((b, idx) => (idx >= 5 ? 'XX' : b));
    return {
      rawHex: encoded.formattedHex,
      maskedHex: maskedHexBytes.join(' '),
    };
  }, [cleanImei]);

  // Redacted bulk text calculation (scrubs both 15-digit decimal IMEIs and 9-byte NV Item 550 BCD hex frames)
  const scrubbedResult = useMemo(() => {
    const imeiRegex = /\b(\d{14,16})\b/g;
    const nv550HexRegex = /\b08\s+[0-9A-Fa-f][Aa]\s+(?:[0-9A-Fa-f]{2}\s+){2}([0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2}\s+[0-9A-Fa-f]{2})\b/g;
    let count = 0;

    let replaced = scrubberInput.replace(imeiRegex, (match) => {
      count++;
      return maskImei(match, scrubberMaskStyle, maskChar);
    });

    replaced = replaced.replace(nv550HexRegex, (fullMatch, snrGroup) => {
      count++;
      return fullMatch.replace(snrGroup, 'XX XX XX XX');
    });

    return { text: replaced, count };
  }, [scrubberInput, scrubberMaskStyle, maskChar]);

  // Generate synthetic test batch based on selected Brand & Model
  const generateTestImeis = (brand: string, modelTac?: string, count: number = 4) => {
    const modelsForBrand = BRAND_MODEL_CATALOG[brand] || BRAND_MODEL_CATALOG['Apple'];
    const target =
      modelsForBrand.find((m) => m.tac === (modelTac || selectedModelTac)) || modelsForBrand[0];
    const results = [];

    for (let i = 0; i < count; i++) {
      const randomSnr = Math.floor(100000 + Math.random() * 900000).toString();
      const first14 = `${target.tac}${randomSnr}`;
      const cd = calculateLuhn(first14);
      const esimSnr = ((parseInt(randomSnr, 10) + 1) % 1000000).toString().padStart(6, '0');
      const esimFirst14 = `${target.tac}${esimSnr}`;
      const esimCd = calculateLuhn(esimFirst14);
      results.push({
        imei: `${first14}${cd}`,
        imei2: `${esimFirst14}${esimCd}`,
        brand,
        model: `${target.model} (Academic Demo)`,
        tac: target.tac,
        snr: randomSnr,
        cd,
      });
    }

    // Also update the active SNR with the first generated SNR so the live demonstrator updates
    if (results.length > 0) {
      setCustomSnr(results[0].snr);
      setInputImei(results[0].imei);
    }

    setGeneratedBatch(results);
  };

  const handleRandomizeSingleDemo = () => {
    const randomSnr = Math.floor(100000 + Math.random() * 900000).toString();
    setCustomSnr(randomSnr);
    const first14 = `${activeAcademicDemo.tac}${randomSnr}`;
    const cd = calculateLuhn(first14);
    setInputImei(`${first14}${cd}`);
  };

  const handleDownloadScrubbed = () => {
    const blob = new Blob([scrubbedResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scrubbed-telephony-nvm-log.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 border border-slate-800">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
            <span>GSMA TAC &amp; Luhn-10 Synthesizer</span>
            <span aria-hidden="true">·</span>
            <span>NV Item 550 BCD Hex Redaction</span>
            <span aria-hidden="true">·</span>
            <span>3GPP TS 23.003 Academic Demonstrator</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic IMEI Synthesizer, Luhn-10 Validator &amp; NVM Redaction Lab
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Generate structurally valid, Luhn-verified synthetic 15-digit IMEIs by selecting a device brand and model Type Allocation Code (TAC) for classroom demonstrations and QA test benches, or redact real serial numbers (SNR) from diagnostic logs and 9-byte Non-Volatile Memory (`NV_UE_IMEI_I` / Item 550) dumps.
          </p>
        </div>
      </div>

      {/* NEW: Featured Classroom Brand & Model Synthetic IMEI + Luhn-10 Step-by-Step Demonstrator */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3GPP TS 23.003 Section 6 — Brand/Model TAC + Luhn-10 Check Digit Demonstrator</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Brand &amp; Model Synthetic IMEI Generator (Luhn-10 Academic Demo)
            </h2>
            <p className="text-xs text-slate-400">
              Select a manufacturer and device model to bind its authentic 8-digit GSMA Type Allocation Code (TAC), synthesize a 6-digit Serial Number (SNR), and compute the exact 15th Luhn check digit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeSingleDemo}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Synthesize New Valid IMEI</span>
            </button>
            <button
              type="button"
              onClick={() => generateTestImeis(testBrand, selectedModelTac, 4)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Generate 4-Device Classroom Batch</span>
            </button>
          </div>
        </div>

        {/* Brand, Model & SNR Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Select Brand */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <label className="text-xs font-bold text-slate-300 block">
              1. Select OEM Brand
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(BRAND_MODEL_CATALOG).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    setTestBrand(brand);
                    const firstModel = BRAND_MODEL_CATALOG[brand][0];
                    if (firstModel) {
                      setSelectedModelTac(firstModel.tac);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    testBrand === brand
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Model & GSMA TAC */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>2. Select Device Model (GSMA TAC)</span>
              <span className="text-[11px] font-mono text-cyan-400">TAC: {activeAcademicDemo.tac}</span>
            </label>
            <select
              value={selectedModelTac}
              onChange={(e) => setSelectedModelTac(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {(BRAND_MODEL_CATALOG[testBrand] || []).map((m) => (
                <option key={m.tac} value={m.tac}>
                  {m.model} — TAC {m.tac} ({m.releaseYear})
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 font-mono">
              Baseband Architecture: <span className="text-slate-200">{activeAcademicDemo.chipset}</span>
            </div>
          </div>

          {/* Step 3: 6-Digit SNR Input */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>3. 6-Digit Serial Number (SNR)</span>
              <span className="text-[11px] font-mono text-amber-400">Digits 9–14</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSnr}
                maxLength={6}
                onChange={(e) => setCustomSnr(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 font-bold tracking-wider"
                placeholder="482910"
              />
              <button
                type="button"
                onClick={handleRandomizeSingleDemo}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold cursor-pointer shrink-0"
              >
                Random SNR
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Luhn Check Digit (Digit 15) auto-computes to{' '}
              <span className="text-emerald-400 font-mono font-bold">{activeAcademicDemo.checkDigit}</span>
            </div>
          </div>
        </div>

        {/* Synthesized Output Banner (Primary Slot 0 + eSIM Slot 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 block">
                Synthesized Primary IMEI (Slot 0 Physical SIM) — {activeAcademicDemo.brand} {activeAcademicDemo.model}
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black tracking-widest tabular-nums">
                <span className="text-cyan-300">{activeAcademicDemo.tac}</span>
                <span className="text-amber-300 mx-1">{activeAcademicDemo.snr}</span>
                <span className="text-emerald-400 underline decoration-emerald-500/60">
                  {activeAcademicDemo.checkDigit}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                TAC (8): <span className="text-cyan-300">{activeAcademicDemo.tac}</span> · SNR (6):{' '}
                <span className="text-amber-300">{activeAcademicDemo.snr}</span> · Luhn CD (1):{' '}
                <span className="text-emerald-400">{activeAcademicDemo.checkDigit}</span> (Sum={activeAcademicDemo.runningSum} + {activeAcademicDemo.checkDigit} ≡ 0 mod 10)
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(activeAcademicDemo.fullImei, 'synth-imei1')}
                className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'synth-imei1' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy IMEI</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setInputImei(activeAcademicDemo.fullImei)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Load into Redactor
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 block">
                Paired Dual-SIM / eSIM IMEI2 (Slot 1 eUICC) — Sequential SNR+1
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black tracking-widest tabular-nums text-white">
                {activeAcademicDemo.esimImei}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                9-Byte NV Item 550 BCD:{' '}
                <span className="text-emerald-300">
                  {encodeImeiToNv550Hex(activeAcademicDemo.fullImei).formattedHex}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(activeAcademicDemo.esimImei, 'synth-imei2')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedId === 'synth-imei2' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied IMEI2</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy eSIM IMEI2</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-Step Luhn-10 Mathematical Matrix for Classroom Projection */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200">
              Step-by-Step Luhn-10 Check Digit Verification Matrix (Digits 1–14 → Digit 15)
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Formula: CD = (10 - (Sum_1_to_14 mod 10)) mod 10 = (10 - ({activeAcademicDemo.runningSum} mod 10)) mod 10 = {activeAcademicDemo.checkDigit}
            </span>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-15 gap-1.5 text-center font-mono text-xs">
            {activeAcademicDemo.steps.map((s) => (
              <div
                key={s.index}
                className={`p-2 rounded-lg border ${
                  s.section === 'TAC'
                    ? 'bg-cyan-950/25 border-cyan-500/30'
                    : 'bg-amber-950/25 border-amber-500/30'
                }`}
              >
                <div className="text-[9px] text-slate-400">D{s.index}</div>
                <div className="text-sm font-black text-white">{s.digit}</div>
                <div className="text-[9px] text-slate-400">{s.isDoubled ? '×2' : '×1'}</div>
                <div className="text-[10px] font-bold text-cyan-300">+{s.reducedValue}</div>
              </div>
            ))}
            <div className="p-2 rounded-lg border bg-emerald-950/40 border-emerald-500/50">
              <div className="text-[9px] text-emerald-300 font-bold">D15 (CD)</div>
              <div className="text-sm font-black text-emerald-400">{activeAcademicDemo.checkDigit}</div>
              <div className="text-[9px] text-emerald-300">Check</div>
              <div className="text-[10px] font-bold text-emerald-200">Valid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Single Masker & Bulk Scrubber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Single IMEI & NVM Hex Masker */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Single IMEI &amp; NVM Item 550 Masker</h2>
                <p className="text-xs text-slate-400">
                  Generate privacy-safe strings for carrier forums &amp; baseband research papers
                </p>
              </div>

              {/* Verified Device Preset Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Preset:</span>
                <select
                  onChange={(e) => setInputImei(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {VERIFIED_DEVICE_PROFILES.map((s) => (
                    <option key={s.imei} value={s.imei}>
                      {s.label.split('(')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Enter 15-Digit Device IMEI</span>
                <span
                  className={`text-xs font-mono tabular-nums ${
                    cleanImei.length === 15 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {cleanImei.length}/15 Digits
                </span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={inputImei}
                  onChange={(e) => setInputImei(e.target.value)}
                  placeholder="e.g. 358942110294854"
                  maxLength={18}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white font-mono tabular-nums placeholder-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setInputImei('')}
                  className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* IMEI Architecture Inspection (TAC + SNR + CD) */}
            {cleanImei.length >= 8 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3GPP TS 23.003 Hardware Breakdown</span>
                </span>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono tabular-nums">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-cyan-400 font-bold block">TAC (Digits 1–8)</span>
                    <span className="text-sm font-bold text-cyan-200">{tacPart || '--------'}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">OEM &amp; Model</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-amber-400 font-bold block">SNR (Digits 9–14)</span>
                    <span className="text-sm font-bold text-amber-200">{snrPart || '------'}</span>
                    <span className="text-[10px] text-amber-400 block mt-0.5">Sensitive Serial</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-[10px] text-indigo-400 font-bold block">CD (Digit 15)</span>
                    <span className={`text-sm font-bold ${isLuhnValid ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {cdPart || '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isLuhnValid ? 'Valid Luhn-10' : 'Checksum'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Masking Style Presets */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Redaction Mode
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'support', name: 'Carrier Support', desc: 'Keeps TAC, masks SNR', icon: Shield },
                  { id: 'receipt', name: 'Invoice / Store', desc: 'Last 4 digits visible', icon: FileText },
                  { id: 'token', name: 'Privacy Token', desc: 'Hash pseudonym', icon: Hash },
                  { id: 'strict', name: 'Strict Redaction', desc: 'Total scrub', icon: Lock },
                ].map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedStyle(preset.id as MaskingStyle)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <span className="text-xs font-bold block">{preset.name}</span>
                      <span className="text-[10px] text-slate-500 block">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Masking Character Toggle */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <span className="text-xs text-slate-300 font-medium">Redaction Character:</span>
              <div className="flex gap-1.5">
                {['•', '*', 'X', '#'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setMaskChar(char)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                      maskChar === char
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Decimal Masked Result */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Masked Decimal Output</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(maskImei(inputImei, selectedStyle, maskChar), 'single-mask')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition cursor-pointer"
                >
                  {copiedId === 'single-mask' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy Masked IMEI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono tabular-nums text-base text-white font-bold tracking-wider select-all break-all">
                {maskImei(inputImei, selectedStyle, maskChar)}
              </div>
            </div>

            {/* Baseband NV Item 550 (0x0226) BCD Hex Masker */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Modem NVM Register (NV_UE_IMEI_I / Item 550) BCD Hex Redaction</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(nv550Data.maskedHex, 'nv550-mask')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'nv550-mask' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied NVM Hex</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Redacted Hex</span>
                      </>
                    )}
                  </button>
                  {onOpenBasebandNvm && (
                    <button
                      type="button"
                      onClick={() => onOpenBasebandNvm(cleanImei || '358942110294854')}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect in NVM Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Unmasked 9-Byte BCD in NVM:</span>
                  <span className="text-amber-300 font-bold">{nv550Data.rawHex}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Scrubbed NVM Hex (Safe for Papers/XDA):</span>
                  <span className="text-emerald-400 font-bold">{nv550Data.maskedHex}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bulk Log & UART Dump Scrubber + Test Batch History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bulk Text & UART Log Scrubber */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">UART Serial, QFIL &amp; Email Log Scrubber</h3>
                <p className="text-[11px] text-slate-400">
                  Auto-detects &amp; masks decimal IMEIs and NV Item 550 hex frames
                </p>
              </div>

              <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                {scrubbedResult.count} Identifier{scrubbedResult.count === 1 ? '' : 's'} Scrubbed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium">Input Diagnostic Log</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setScrubberInput(
                        `[UART 115200] DIAG TX: NV_READ_F (0x26) Item 550 (0x0226)\n[NVM DUMP] 0x00022600: 08 3A 58 94 21 10 29 48 54\n[BASEBAND] Primary IMEI: 358942110294854 | eSIM IMEI2: 358942110294862`
                      )
                    }
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Load UART / NVM Dump
                  </button>
                  <button
                    type="button"
                    onClick={() => setScrubberInput('')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                value={scrubberInput}
                onChange={(e) => setScrubberInput(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none transition resize-none"
                placeholder="Paste unlock confirmation email, UART serial capture, or QFIL log..."
              />
            </div>

            {/* Redacted Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium">Scrubbed Output</label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(scrubbedResult.text, 'bulk-scrub')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedId === 'bulk-scrub' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadScrubbed}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save .txt</span>
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                {scrubbedResult.text}
              </div>
            </div>
          </div>

          {/* Synthetic Test IMEI Batch Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">3GPP Sandbox Test IMEI Batch</h3>
                <p className="text-[11px] text-slate-400">
                  Luhn-verified synthetic test pairs (Slot 0 + eSIM Slot 1) for {testBrand}
                </p>
              </div>

              <button
                type="button"
                onClick={() => generateTestImeis(testBrand, selectedModelTac, 4)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Batch</span>
              </button>
            </div>

            {/* Generated List */}
            <div className="space-y-2">
              {generatedBatch.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">No synthetic test batch generated yet.</p>
                  <button
                    type="button"
                    onClick={() => generateTestImeis(testBrand, selectedModelTac, 4)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Generate verified {activeAcademicDemo.brand} {activeAcademicDemo.model} batch
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {generatedBatch.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono tabular-nums"
                    >
                      <div>
                        <span className="text-white font-bold">{item.imei}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.model} · eSIM: {item.imei2}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.imei, `test-${idx}`)}
                        className="text-slate-400 hover:text-cyan-300 transition cursor-pointer p-1"
                        title="Copy Test IMEI"
                      >
                        {copiedId === `test-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
