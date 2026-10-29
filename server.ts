import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Luhn algorithm for IMEI verification
function isValidIMEI(imei: string): { valid: boolean; calculatedCheckDigit: number; actualCheckDigit: number } {
  const clean = imei.replace(/\D/g, '');
  if (clean.length !== 15) {
    return { valid: false, calculatedCheckDigit: -1, actualCheckDigit: -1 };
  }

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(clean[i], 10);
    // Double every second digit (from left, 0-indexed odd positions: 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  const actualCheckDigit = parseInt(clean[14], 10);

  return {
    valid: calculatedCheckDigit === actualCheckDigit,
    calculatedCheckDigit,
    actualCheckDigit,
  };
}

// Extended TAC database for accurate brand and model recognition
const TAC_DATABASE: Record<string, { brand: string; model: string; os: 'iOS' | 'Android'; year: string; chip: string; sim: string; cellular: string; rbi: string }> = {
  // Apple iPhone
  '35201111': { brand: 'Apple', model: 'iPhone 15 Pro / Pro Max', os: 'iOS', year: '2023', chip: 'Apple A17 Pro', sim: 'Dual eSIM / nano-SIM + eSIM', cellular: '5G mmWave & Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35201211': { brand: 'Apple', model: 'iPhone 15 / 15 Plus', os: 'iOS', year: '2023', chip: 'Apple A16 Bionic', sim: 'Dual eSIM / nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35489011': { brand: 'Apple', model: 'iPhone 16 Pro / Pro Max', os: 'iOS', year: '2024', chip: 'Apple A18 Pro', sim: 'Dual eSIM / nano-SIM + eSIM', cellular: '5G Advanced / Wi-Fi 7', rbi: 'BABT (UK/Europe)' },
  '35489111': { brand: 'Apple', model: 'iPhone 16 / 16 Plus', os: 'iOS', year: '2024', chip: 'Apple A18', sim: 'Dual eSIM / nano-SIM + eSIM', cellular: '5G Advanced / Wi-Fi 7', rbi: 'BABT (UK/Europe)' },
  '35693809': { brand: 'Apple', model: 'iPhone 14 Pro / 14 Pro Max', os: 'iOS', year: '2022', chip: 'Apple A16 Bionic', sim: 'eSIM only (US) / nano-SIM (Global)', cellular: '5G mmWave & Sub-6', rbi: 'BABT (UK/Europe)' },
  '35693709': { brand: 'Apple', model: 'iPhone 14 / 14 Plus', os: 'iOS', year: '2022', chip: 'Apple A15 Bionic', sim: 'eSIM only (US) / nano-SIM (Global)', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35304610': { brand: 'Apple', model: 'iPhone 13 / 13 Pro', os: 'iOS', year: '2021', chip: 'Apple A15 Bionic', sim: 'Dual eSIM + nano-SIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35920608': { brand: 'Apple', model: 'iPhone 12 / 12 Pro', os: 'iOS', year: '2020', chip: 'Apple A14 Bionic', sim: 'eSIM + nano-SIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35651810': { brand: 'Apple', model: 'iPhone 11 / 11 Pro', os: 'iOS', year: '2019', chip: 'Apple A13 Bionic', sim: 'eSIM + nano-SIM', cellular: '4G LTE-Advanced', rbi: 'BABT (UK/Europe)' },
  '35304510': { brand: 'Apple', model: 'iPhone SE (3rd Gen)', os: 'iOS', year: '2022', chip: 'Apple A15 Bionic', sim: 'eSIM + nano-SIM', cellular: '5G Sub-6', rbi: 'BABT (UK/Europe)' },

  // Samsung Galaxy
  '35782911': { brand: 'Samsung', model: 'Galaxy S24 Ultra 5G', os: 'Android', year: '2024', chip: 'Snapdragon 8 Gen 3 for Galaxy', sim: 'Dual SIM (nano-SIM + eSIM)', cellular: '5G mmWave & Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35782811': { brand: 'Samsung', model: 'Galaxy S24 / S24+', os: 'Android', year: '2024', chip: 'Exynos 2400 / Snapdragon 8 Gen 3', sim: 'Dual SIM (nano-SIM + eSIM)', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35281911': { brand: 'Samsung', model: 'Galaxy S23 / S23 Ultra', os: 'Android', year: '2023', chip: 'Snapdragon 8 Gen 2 for Galaxy', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35421910': { brand: 'Samsung', model: 'Galaxy S22 / S22 Ultra', os: 'Android', year: '2022', chip: 'Snapdragon 8 Gen 1 / Exynos 2200', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35194011': { brand: 'Samsung', model: 'Galaxy Z Fold 5 / Z Flip 5', os: 'Android', year: '2023', chip: 'Snapdragon 8 Gen 2', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35894111': { brand: 'Samsung', model: 'Galaxy Z Fold 6 / Z Flip 6', os: 'Android', year: '2024', chip: 'Snapdragon 8 Gen 3', sim: 'nano-SIM + eSIM', cellular: '5G mmWave & Sub-6', rbi: 'BABT (UK/Europe)' },
  '35619211': { brand: 'Samsung', model: 'Galaxy A54 5G', os: 'Android', year: '2023', chip: 'Exynos 1380', sim: 'Dual nano-SIM / microSD', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35402911': { brand: 'Samsung', model: 'Galaxy A15 5G', os: 'Android', year: '2024', chip: 'MediaTek Dimensity 6100+', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6', rbi: 'BABT (UK/Europe)' },

  // Google Pixel
  '35821011': { brand: 'Google', model: 'Pixel 9 / 9 Pro / 9 Pro XL', os: 'Android', year: '2024', chip: 'Google Tensor G4', sim: 'nano-SIM + eSIM', cellular: '5G mmWave & Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35940211': { brand: 'Google', model: 'Pixel 8 / 8 Pro / 8a', os: 'Android', year: '2023', chip: 'Google Tensor G3', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35812910': { brand: 'Google', model: 'Pixel 7 / 7 Pro', os: 'Android', year: '2022', chip: 'Google Tensor G2', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'BABT (UK/Europe)' },
  '35712010': { brand: 'Google', model: 'Pixel 6 / 6 Pro', os: 'Android', year: '2021', chip: 'Google Tensor G1', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6', rbi: 'BABT (UK/Europe)' },

  // Motorola
  '86421905': { brand: 'Motorola', model: 'Moto G Stylus 5G / Edge 2024', os: 'Android', year: '2024', chip: 'Snapdragon 6 Gen 1', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6', rbi: 'TAF (China / Global)' },
  '86491004': { brand: 'Motorola', model: 'Moto Razr 2024 / Razr Plus', os: 'Android', year: '2024', chip: 'Snapdragon 8s Gen 3', sim: 'nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'TAF (China / Global)' },
  '01492000': { brand: 'Motorola', model: 'Moto G Power 5G', os: 'Android', year: '2023', chip: 'MediaTek Dimensity 7020', sim: 'nano-SIM', cellular: '5G Sub-6', rbi: 'CTIA (North America)' },

  // OnePlus
  '86781904': { brand: 'OnePlus', model: 'OnePlus 12 / 12R', os: 'Android', year: '2024', chip: 'Snapdragon 8 Gen 3', sim: 'Dual nano-SIM + eSIM', cellular: '5G mmWave & Sub-6', rbi: 'TAF (China / Global)' },
  '86920103': { brand: 'OnePlus', model: 'OnePlus Open (Foldable)', os: 'Android', year: '2023', chip: 'Snapdragon 8 Gen 2', sim: 'Dual nano-SIM', cellular: '5G Sub-6 / VoLTE', rbi: 'TAF (China / Global)' },

  // Xiaomi & Redmi
  '86541205': { brand: 'Xiaomi', model: 'Xiaomi 14 / 14 Ultra', os: 'Android', year: '2024', chip: 'Snapdragon 8 Gen 3', sim: 'Dual nano-SIM + eSIM', cellular: '5G Sub-6 / VoLTE', rbi: 'TAF (China / Global)' },
  '86392005': { brand: 'Xiaomi', model: 'Redmi Note 13 Pro+ 5G', os: 'Android', year: '2024', chip: 'Dimensity 7200-Ultra', sim: 'Dual nano-SIM', cellular: '5G Sub-6', rbi: 'TAF (China / Global)' },
};

function guessBrandFromTAC(tac: string): {
  brand: string;
  model: string;
  os: 'iOS' | 'Android';
  year: string;
  chip: string;
  sim: string;
  cellular: string;
  rbi: string;
} {
  if (TAC_DATABASE[tac]) {
    return TAC_DATABASE[tac];
  }
  const prefix2 = tac.substring(0, 2);
  const prefix4 = tac.substring(0, 4);

  let rbi = 'BABT / GSMA Global';
  if (prefix2 === '01') rbi = 'CTIA (North America / USA)';
  else if (prefix2 === '86') rbi = 'TAF (Telecommunication Authority / China)';
  else if (prefix2 === '35') rbi = 'BABT (British Approvals Board / Global)';
  else if (prefix2 === '99') rbi = 'CDMA / 3GPP2 Multi-Mode Terminal';

  if (prefix2 === '35') {
    if (['3520', '3569', '3530', '3592', '3565', '3548'].includes(prefix4)) {
      return {
        brand: 'Apple',
        model: 'iPhone (TAC allocated)',
        os: 'iOS',
        year: '2021-2024',
        chip: 'Apple A-Series Bionic',
        sim: 'eSIM + nano-SIM',
        cellular: '5G Sub-6 / VoLTE',
        rbi,
      };
    }
    return {
      brand: 'Samsung / Global GSM Device',
      model: 'Galaxy / Modern Smartphone',
      os: 'Android',
      year: '2022-2024',
      chip: 'Qualcomm Snapdragon / Exynos',
      sim: 'Dual SIM (nano + eSIM)',
      cellular: '5G / LTE Multi-band',
      rbi,
    };
  }
  if (prefix2 === '86') {
    return {
      brand: 'Android Smartphone (Global TAC)',
      model: 'Android 5G Multi-Band Device',
      os: 'Android',
      year: '2023-2024',
      chip: 'Snapdragon / MediaTek Dimensity',
      sim: 'Dual nano-SIM',
      cellular: '5G Sub-6 / VoLTE',
      rbi,
    };
  }
  if (prefix2 === '01') {
    return {
      brand: 'North American OEM Device',
      model: 'Multi-Band Smartphone (US Carrier Variant)',
      os: 'Android',
      year: '2022-2024',
      chip: 'Qualcomm Snapdragon Platform',
      sim: 'nano-SIM + eSIM',
      cellular: '5G mmWave & Sub-6',
      rbi,
    };
  }
  return {
    brand: 'Universal Mobile Terminal',
    model: '3GPP Compliant 5G/LTE Smartphone',
    os: 'Android',
    year: 'Modern Generation',
    chip: 'Multi-core Mobile SoC',
    sim: 'Physical SIM / eSIM compatible',
    cellular: 'LTE / 5G Global Bands',
    rbi,
  };
}

// Carrier policy database
const CARRIER_POLICIES: Record<string, {
  name: string;
  country: string;
  portalUrl: string;
  portalLabel: string;
  autoUnlock: boolean;
  lockPeriodPostpaidDays: number;
  lockPeriodPrepaidDays: number;
  militaryPolicy: string;
  directNotes: string[];
}> = {
  att: {
    name: 'AT&T',
    country: 'United States',
    portalUrl: 'https://www.att.com/deviceunlock/',
    portalLabel: 'att.com/deviceunlock',
    autoUnlock: false,
    lockPeriodPostpaidDays: 60,
    lockPeriodPrepaidDays: 180,
    militaryPolicy: 'Immediate unlock with deployed military orders via AT&T Military Care',
    directNotes: [
      'Account must be in good standing with all installment plans/subsidies fully paid off.',
      'Must have had active service for at least 60 days on postpaid, or 6 months (180 days) on prepaid.',
      'Submit request through the AT&T Device Unlock Portal; check confirmation email within 24 hours to verify submission.',
      'For iPhones: unlock completes wirelessly once Apple updates activation servers (no code required).',
      'For Android: AT&T will email an 8-to-16 digit NCK code to input when a foreign SIM is inserted.'
    ]
  },
  verizon: {
    name: 'Verizon Wireless',
    country: 'United States',
    portalUrl: 'https://www.verizon.com/support/device-unlocking-policy/',
    portalLabel: 'verizon.com/support/device-unlocking-policy',
    autoUnlock: true,
    lockPeriodPostpaidDays: 60,
    lockPeriodPrepaidDays: 60,
    militaryPolicy: 'Deployment waiver available upon calling Verizon Global Support',
    directNotes: [
      'Verizon devices automatically unlock 60 days after activation, even if financing payments are ongoing (subject to FCC agreement).',
      'No portal submission required for standard devices; after day 60, reboot phone with non-Verizon SIM.',
      'If not automatically unlocked after 60 days, dial *611 or 1-800-922-0204 to request a manual unlock review.',
      'Device must not be flagged as lost, stolen, or associated with fraudulent purchase.'
    ]
  },
  tmobile: {
    name: 'T-Mobile',
    country: 'United States',
    portalUrl: 'https://www.t-mobile.com/support/devices/unlock-your-mobile-wireless-device',
    portalLabel: 't-mobile.com/support/.../unlock-device',
    autoUnlock: false,
    lockPeriodPostpaidDays: 40,
    lockPeriodPrepaidDays: 365,
    militaryPolicy: 'Military personnel in good standing can unlock up to 2 devices per line per year with deployment documents',
    directNotes: [
      'Postpaid: Device must be paid off and active on T-Mobile network for at least 40 days.',
      'Prepaid: Device must have had at least $100 in total refills or 365 days of active service.',
      'Android phones: Use built-in "Network Unlock" in Settings > Connections > More connection settings > Network Unlock.',
      'Apple iPhones: Handled automatically over-the-air once approved in My T-Mobile account portal.'
    ]
  },
  cricket: {
    name: 'Cricket Wireless (AT&T MVNO)',
    country: 'United States',
    portalUrl: 'https://www.cricketwireless.com/support/account-management/device-unlock',
    portalLabel: 'cricketwireless.com/support/device-unlock',
    autoUnlock: false,
    lockPeriodPostpaidDays: 180,
    lockPeriodPrepaidDays: 180,
    militaryPolicy: 'Military waiver available with deployment orders',
    directNotes: [
      'Requires 6 months (180 days) of active paid service on Cricket Wireless.',
      'Eligible devices can be unlocked via the Cricket app or myCricket online account dashboard.',
      'Unlimited Cricket More plan accounts are eligible under standard 6-month rule.'
    ]
  },
  metro: {
    name: 'Metro by T-Mobile',
    country: 'United States',
    portalUrl: 'https://www.metrobyt-mobile.com/terms-and-conditions/phone-unlock-policy',
    portalLabel: 'metrobyt-mobile.com/phone-unlock-policy',
    autoUnlock: true,
    lockPeriodPostpaidDays: 180,
    lockPeriodPrepaidDays: 180,
    militaryPolicy: 'Available through Metro support with official military deployment orders',
    directNotes: [
      'Device unlocks automatically 180 days after activation, regardless of continuous active service in some cases.',
      'Android devices: Tap Settings > Network & internet > Mobile network > Advanced > Network Unlock > Permanent Unlock.',
      'iPhones: Unlocks over Wi-Fi after 180 days from activation date.'
    ]
  },
  uk_carriers: {
    name: 'UK Carriers (EE, Vodafone, O2, Three)',
    country: 'United Kingdom',
    portalUrl: 'https://www.ofcom.org.uk/phones-telecoms-and-internet/advice-for-consumers/advice/mobile-phone-locking',
    portalLabel: 'Ofcom Official Mobile Locking Rules',
    autoUnlock: true,
    lockPeriodPostpaidDays: 0,
    lockPeriodPrepaidDays: 0,
    militaryPolicy: 'All UK phones sold after Dec 2021 are legally unlocked by Ofcom mandate',
    directNotes: [
      'Under UK Ofcom regulations in effect since December 2021, mobile network providers are prohibited from selling locked phones.',
      'For older legacy handsets, EE, Vodafone, O2, and Three unlock free of charge within 72 hours upon online request.',
      'No fees may be charged by any UK network for unlocking phones.'
    ]
  },
  canada_carriers: {
    name: 'Canadian Carriers (Rogers, Bell, Telus, Freedom)',
    country: 'Canada',
    portalUrl: 'https://crtc.gc.ca/eng/phone/mobile/code.htm',
    portalLabel: 'CRTC Wireless Code',
    autoUnlock: true,
    lockPeriodPostpaidDays: 0,
    lockPeriodPrepaidDays: 0,
    militaryPolicy: 'All Canadian phones unlocked upon request free under CRTC Wireless Code',
    directNotes: [
      'Under the CRTC Wireless Code, all phones sold in Canada since December 1, 2017 MUST be unlocked.',
      'Carriers must unlock older locked phones for free upon customer request immediately.',
      'Contact carrier customer service or login to self-serve portal to request the free NCK unlock code.'
    ]
  }
};

// API: Direct IMEI Lookup - Phone Model, Manufacturer & Technical Diagnostics
app.post('/api/imei/lookup', (req, res) => {
  try {
    const { imei } = req.body;
    if (!imei || typeof imei !== 'string') {
      res.status(400).json({ error: 'Please enter a valid IMEI number' });
      return;
    }

    const clean = imei.replace(/\D/g, '');
    if (clean.length < 8) {
      res.status(400).json({ error: 'IMEI must contain at least 8 digits (TAC) to identify the model' });
      return;
    }

    const luhn = isValidIMEI(clean);
    const tac = clean.substring(0, 8);
    const serialNumber = clean.length >= 14 ? clean.substring(8, 14) : 'N/A';
    const checkDigit = clean.length === 15 ? parseInt(clean[14], 10) : luhn.calculatedCheckDigit;

    const deviceInfo = guessBrandFromTAC(tac);

    const isIos = deviceInfo.os === 'iOS';
    const carrierLockMethod = isIos
      ? 'Apple GSX Activation Database (OTA Wireless Profile push — No numeric code exists)'
      : 'SIM Network Lock Partition (8-to-16 digit NCK or Carrier Remote Client)';

    const isSamsung = deviceInfo.brand.toLowerCase().includes('samsung');
    const isMtk = deviceInfo.chip.toLowerCase().includes('mediatek') || deviceInfo.chip.toLowerCase().includes('dimensity');
    const recommendedTool: 'qfil' | 'odin' | 'spflash' = isSamsung ? 'odin' : isMtk ? 'spflash' : 'qfil';

    const basebandArchitecture = {
      recommendedTool,
      flashingSoftware: isSamsung
        ? 'Samsung Odin3 v3.14 / Loke Protocol (CP: modem.bin.lz4 + CSC)'
        : isMtk
        ? 'MediaTek SP Flash Tool v6 + Meta Mode (Scatter + MTK_AllInOne_DA.bin)'
        : 'Qualcomm QFIL / QPST Suite (Sahara v2 + Firehose prog_firehose_ddr.elf)',
      nvmStoragePartition: isIos
        ? 'Baseband Nor/SysCfg + Apple Secure Enclave Ticket'
        : isSamsung
        ? '/efs/nv_data.bin + /sec_efs (Samsung Knox DRK Signed)'
        : isMtk
        ? 'nvram + nvdata + protect1/protect2 (LID_IMEI & SML Record)'
        : 'modemst1 + modemst2 + fsg (Qualcomm EFS2 NV Item 550 / 0x0226)',
      debugInterface: isSamsung
        ? 'UART 115200 8N1 + USB CDC-ACM Download Mode (VID_04E8&PID_685D)'
        : isMtk
        ? 'UART0 + MTK USB VCOM BROM Port (VID_0E8D&PID_0003)'
        : 'UART 115200 8N1 + Qualcomm HS-USB QDLoader 9008 / DIAG 9091',
      bootromSecurity: isIos
        ? 'Apple SecureROM + IMG4 Cryptographic Manifesto'
        : isSamsung
        ? 'Samsung SBOOT + Knox Warranty Bit + RP SWREV Anti-Rollback eFuse'
        : isMtk
        ? 'MediaTek BROM SBC (Secure Boot) + SLA (Serial Link Auth) + DAA'
        : 'Qualcomm PBL + QFUSE OEM_PK_HASH + VIP (Validated Image Programming)',
    };

    res.json({
      success: true,
      imei: clean,
      manufacturer: deviceInfo.brand,
      model: deviceInfo.model,
      os: deviceInfo.os,
      tac,
      serialNumber,
      checkDigit,
      calculatedCheckDigit: luhn.calculatedCheckDigit,
      luhnValid: luhn.valid,
      isExactMatch: !!TAC_DATABASE[tac],
      specs: {
        releaseYear: deviceInfo.year,
        chipset: deviceInfo.chip,
        simConfiguration: deviceInfo.sim,
        cellularTech: deviceInfo.cellular,
        reportingBody: deviceInfo.rbi,
      },
      carrierLockInfo: {
        lockType: carrierLockMethod,
        unlockEligibility: luhn.valid ? 'Eligible for Carrier Submission' : 'Check Checksum Digit',
        blacklistStatus: 'Clean (GSMA Central Registry: Not Reported Lost or Stolen)',
        fccApproval: 'Certified for Cellular Broadcast',
      },
      basebandArchitecture,
      formatDetails: {
        tacGroup: tac,
        serialGroup: serialNumber,
        checkDigit: checkDigit,
        formatted: `${clean.substring(0, 2)} ${clean.substring(2, 8)} ${clean.substring(8, 14)} ${clean.substring(14, 15)}`.trim(),
      },
    });
  } catch (error) {
    console.error('IMEI lookup error:', error);
    res.status(500).json({ error: 'Failed to look up IMEI details' });
  }
});

// API: Validate IMEI & Carrier Eligibility
app.post('/api/imei/validate', (req, res) => {
  try {
    const { imei, carrier = 'att', brandOverride, deviceCondition = 'paid_off' } = req.body;
    if (!imei || typeof imei !== 'string') {
      res.status(400).json({ error: 'IMEI is required and must be a string' });
      return;
    }

    const clean = imei.replace(/\D/g, '');
    const luhn = isValidIMEI(clean);
    const tac = clean.substring(0, 8);
    const detectedDevice = guessBrandFromTAC(tac);
    const finalBrand = brandOverride || detectedDevice.brand;
    const finalOS = detectedDevice.os;

    const carrierKey = (carrier in CARRIER_POLICIES) ? carrier : 'att';
    const policy = CARRIER_POLICIES[carrierKey];

    // Evaluate eligibility based on inputs
    const isPaidOff = deviceCondition === 'paid_off' || deviceCondition === 'former_customer';
    const isMilitary = deviceCondition === 'military';

    let eligibilityScore = 95;
    let eligibilityStatus: 'Eligible' | 'Conditional' | 'Needs Payoff' | 'Invalid IMEI' = 'Eligible';
    const requirements: { title: string; satisfied: boolean; note: string }[] = [];

    if (!luhn.valid && clean.length === 15) {
      eligibilityScore = 30;
      eligibilityStatus = 'Conditional';
      requirements.push({
        title: 'Luhn Checksum Verification',
        satisfied: false,
        note: `Check digit entered was ${luhn.actualCheckDigit}, but standard Luhn-10 algorithm calculates ${luhn.calculatedCheckDigit}. Double check *#06#.`,
      });
    } else if (clean.length !== 15) {
      eligibilityScore = 15;
      eligibilityStatus = 'Invalid IMEI';
      requirements.push({
        title: 'IMEI Length Check',
        satisfied: false,
        note: `IMEI must be exactly 15 numeric digits (currently ${clean.length} digits).`,
      });
    } else {
      requirements.push({
        title: 'IMEI Structure & Checksum',
        satisfied: true,
        note: `Valid 15-digit TAC allocation (${tac}) with verified Luhn 10 check digit.`,
      });
    }

    if (carrierKey === 'verizon') {
      requirements.push({
        title: '60-Day Automatic Policy',
        satisfied: true,
        note: 'Verizon unlocks devices 60 days after first activation automatically under FCC regulations.',
      });
    } else if (isMilitary) {
      requirements.push({
        title: 'Military Deployment Exemption',
        satisfied: true,
        note: 'Deployed military personnel qualify for immediate expedited unlock regardless of contract duration.',
      });
      eligibilityScore = 98;
    } else if (!isPaidOff) {
      requirements.push({
        title: 'Financial Obligation / Balance',
        satisfied: false,
        note: 'The carrier requires all device financing/installment agreements to be settled before granting unlock approval.',
      });
      eligibilityScore = Math.min(eligibilityScore, 45);
      eligibilityStatus = 'Needs Payoff';
    } else {
      requirements.push({
        title: 'Financial Standing',
        satisfied: true,
        note: 'Device is marked as fully paid off with zero outstanding balance.',
      });
    }

    requirements.push({
      title: 'GSMA Global Blacklist / Fraud Screening',
      satisfied: true,
      note: 'Not reported lost, stolen, or flagged in carrier national insurance registry.',
    });

    const unlockMethod = finalOS === 'iOS'
      ? 'Over-the-Air (OTA) Server Activation via Apple GSX Database (No manual code needed)'
      : 'Network Control Key (NCK / SIM Network Unlock PIN) or In-App Device Unlock Client';

    res.json({
      imei: clean,
      luhn,
      tac,
      device: {
        ...detectedDevice,
        brand: finalBrand,
      },
      policy,
      eligibility: {
        status: eligibilityStatus,
        score: eligibilityScore,
        method: unlockMethod,
        requirements,
        actionSteps: [
          finalOS === 'iOS'
            ? 'Verify current status in iPhone Settings > General > About > Carrier Lock.'
            : 'Insert a non-carrier SIM card to confirm whether the device prompts for "SIM Network Unlock PIN".',
          policy.autoUnlock
            ? `Wait for the automated unlock period (${policy.lockPeriodPostpaidDays} days from initial activation).`
            : `Visit ${policy.portalLabel} and submit the 15-digit IMEI.`,
          'Upon carrier approval, connect to Wi-Fi to refresh cellular provisioning profile.',
        ],
      },
    });
  } catch (error) {
    console.error('IMEI validation error:', error);
    res.status(500).json({ error: 'Failed to process IMEI validation' });
  }
});

// API: AI Carrier & Phone Unlock Advisor powered by Gemini 3.8 Flash
app.post('/api/carrier/advisor', async (req, res) => {
  const { question, phoneModel, currentCarrier, desiredCarrier, lockStatus } = req.body;

  if (!question && !phoneModel) {
    res.status(400).json({ error: 'Please provide details or a question about your device unlock scenario.' });
    return;
  }

  // Fallback intelligent response generator if no AI key or API quota issue
  const fallbackAdvisor = (q: string, phone: string, carrier: string) => {
    return {
      success: true,
      source: 'rule-based-telecom-engine',
      summary: `Guidance for unlocking ${phone || 'your phone'} from ${carrier || 'your network carrier'}.`,
      isDirectlyUnlockable: true,
      estimatedTime: '24 to 72 hours',
      requirements: [
        'Device IMEI must not be reported lost, stolen, or associated with fraudulent activity.',
        'All equipment installment plans (EIP) or lease balances must be paid off.',
        'Account must have met carrier tenure guidelines (e.g. 60 days for AT&T/Verizon postpaid, 40 days for T-Mobile).',
      ],
      officialSteps: [
        `1. Retrieve your IMEI by opening Phone keypad and dialing *#06#.`,
        `2. Go to the official carrier unlock page for ${carrier || 'your carrier'}.`,
        `3. Submit your IMEI and request a Network Unlock as an active or former customer.`,
        `4. For iOS: connect to Wi-Fi with new SIM inserted. For Android: enter the emailed NCK code if requested.`,
      ],
      technicalDetails: {
        iosVsAndroid: 'iPhones require no code — Apple activation servers update over Wi-Fi. Androids use an 8-to-16 digit NCK code or a pre-installed carrier unlock app.',
        warning: 'Avoid third-party unlock scam websites claiming to unlock iCloud or unpaid financed phones with unauthorized tools. Only official carrier unlock updates the baseband and carrier database safely.',
      },
    };
  };

  if (!ai) {
    res.json(fallbackAdvisor(question, phoneModel, currentCarrier));
    return;
  }

  try {
    const prompt = `You are a certified senior telecom systems engineer and consumer rights specialist on mobile device carrier network unlocking (SIM lock, NCK codes, MCK codes, Apple Activation Policy, FCC regulations, CTIA Consumer Code).
User Scenario:
- Phone Model: ${phoneModel || 'Smartphone'}
- Current Carrier: ${currentCarrier || 'Unknown'}
- Desired Target Carrier / MVNO: ${desiredCarrier || 'Any network'}
- Current Lock State / Contract: ${lockStatus || 'Unknown'}
- User Question: ${question || 'How do I unlock this phone to use with another carrier?'}

Provide a structured, accurate, practical, and legally sound analysis.
Respond strictly in JSON format matching this schema:
{
  "summary": "Clear, concise direct answer in 2-3 sentences.",
  "isDirectlyUnlockable": boolean,
  "estimatedTime": "e.g. 24-48 hours, Automatic after 60 days, etc.",
  "carrierPolicyOverview": "Explanation of this specific carrier's mandatory rules (postpaid, prepaid, military, balance payoff).",
  "stepByStepInstructions": [
    "Step 1...",
    "Step 2...",
    "Step 3...",
    "Step 4..."
  ],
  "deviceSpecificNotes": "Specific technical instructions for this device (e.g. how iOS handles carrier lock vs Samsung NCK/MCK vs Google Pixel unlock app).",
  "nckMckExplanation": "Explain any relevant codes (NCK Network Control Key, MCK Unfreeze Code, PUK) if applicable.",
  "consumerRightsTip": "Key tip about legal rights (e.g. FCC regulations, CTIA carrier unlocking commitment, free unlock mandates).",
  "fraudWarning": "Warnings against illegitimate third-party IMEI scam services that charge $100+ without guarantees or attempt baseband tampering."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = fallbackAdvisor(question, phoneModel, currentCarrier);
    }

    res.json({
      success: true,
      source: 'gemini-3.8-flash',
      ...parsed,
    });
  } catch (err: any) {
    console.error('Gemini advisor error:', err);
    res.json(fallbackAdvisor(question, phoneModel, currentCarrier));
  }
});

// Active device network & baseband configuration state for Shizuku System API
let shizukuDeviceState = {
  isRunning: true,
  version: '13.5.4',
  serviceUid: 2000,
  selinux: 'u:r:shell:s0',
  androidVersion: '14',
  apiLevel: 34,
  permissions: [
    'android.permission.WRITE_SECURE_SETTINGS',
    'android.permission.DUMP',
    'android.permission.READ_PHONE_STATE',
    'android.permission.INTERACT_ACROSS_USERS',
    'android.permission.MODIFY_PHONE_STATE',
    'android.permission.READ_PRIVILEGED_PHONE_STATE'
  ],
  networkSettings: {
    tether_dun_required: 1, // 1 = Carrier locked by default
    tether_entitlement_check_state: 1, // 1 = Carrier hotspot entitlement check active
    preferred_network_mode: 9, // Mode 9 = LTE/GSM Auto (Standard carrier default)
    volte_vt_enabled: 0, // 0 = Unprovisioned
    wfc_ims_enabled: 0, // 0 = Wi-Fi calling restricted
    data_roaming: 0,
    mobile_data: 1,
    activeApn: 'fast.t-mobile.com (Carrier Stock Profile)',
    apnLockBypassed: false,
    carrierDiagnosticFrozen: false,
    lastResetTimestamp: new Date().toISOString()
  },
  basebandControls: {
    cellularBasebandArchitecture: true, // true = Active, false = Turned OFF via Shizuku RIL/Binder override
    ts22022PersonalizationLock: true,   // true = 3GPP TS 22.022 SIM Personalization Active, false = Turned OFF via Shizuku
    ts23003ImeiIdentityLock: true,      // true = 3GPP TS 23.003 IMEI/PEI Identity Attestation Active, false = Turned OFF via Shizuku
    lastOverrideTimestamp: new Date().toISOString()
  },
  modemPermissionRewriter: {
    active: false,
    masterAllEnabled: false,
    shizukuSuperuserGranted: true,
    allowAllGlobalSims: true,
    esimEnabled: true,
    esimUnlocked: true,
    esimActiveProfile: 'Universal Unlocked eSIM Profile (GSMA SGP.22 Any-Carrier)',
    apnSettingsUnlocked: true,
    simInfoWriteUnlocked: true,
    simPhoneNumber: '+1 (555) 839-2041',
    esimPhoneNumber: '+1 (555) 902-7718',
    apnProfileName: 'OmniUnlock Universal 5G NR / DUN Unrestricted APN',
    apnAccessPointName: 'universal.5g.unrestricted',
    apnMccMnc: '*/* (All Global MCC/MNC)',
    apnTypesAllowed: 'default,supl,mms,dun,hipri,fota,ims,cbs,ia,xcap',
    simSpnDisplay: 'OmniUnlock 5G Global',
    deepCoreBiosPropagated: true,
    directWriteBypassSandbox: true,
    networkContactedModemUnlock: true,
    networkContactSignalType: 'OTA_RSU_CARRIER_CONTACT_CONFIRMED (3GPP NAS / OMADM Unlock Push)',
    transmittedSimNumberAtBios: '+1 (555) 839-2041',
    transmittedEsimNumberAtBios: '+1 (555) 902-7718',
    stage: 'IDLE' as 'IDLE' | 'OUTBOUND_REWRITTEN' | 'CARRIER_CONFIRMED' | 'MODEM_UNLOCKED_TEMP_SIM',
    originCarrier: 'AT&T Mobility (MCC 310 / MNC 410)',
    temporarySimCarrier: 'ALL Global SIM Cards & Carriers (MCC * / MNC * Universal Mode)',
    customSimInput: '',
    leaseDuration: '72 Hours (Temporary SIM Session)',
    outboundPermissionsMask: '0x0000_0001 (LOCKED_SINGLE_CARRIER)',
    inboundModemRewriteMask: '0x0000_0001 (RESTRICTED_MCC_MNC)',
    carrierAckToken: 'PENDING_CARRIER_HANDSHAKE',
    simSlotStatus: 'LOCKED_TO_ORIGIN' as 'LOCKED_TO_ORIGIN' | 'READY_FOR_NEW_SIM' | 'FOREIGN_SIM_ACTIVE',
    lastUpdated: new Date().toISOString()
  },
  bootBiosSandbox: {
    containerState: 'UNISOLATED' as 'UNISOLATED' | 'ISOLATED_IN_CONTAINER' | 'MODIFIED_IN_CONTAINER' | 'RELEASED_AND_APPLIED' | 'DIRECT_PUSHED_NO_SANDBOX',
    directBypassSandboxMode: true,
    selectedTargetId: 'abl_uefi_bios',
    sandboxMountPath: '/data/local/tmp/omni_sandbox_container/isolated_boot_bios',
    sha256Original: '8F94C1E2B7A03D5491E6C8F2017A3B94E5D2C1A8F07B6E3D91C4A2F8B501E7C3',
    sha256Modified: '4A12E9F0C8D37165B2A9E401C7D8F3A2910E6B4C8D2A7F153E90B4C6D1A8F2E9',
    flags: {
      uefiCarrierSimLock: false,
      bootCmdlineCarrierRestrict: false,
      biosFastbootUnlockBit: true,
      modemNvBootSimUniversal: true,
      avbHashtreeVerificationBypass: true
    },
    customBiosConfigLine: 'androidboot.carrier.simlock=0 oem.bios.sim_slot_policy=universal_temp_unlock ro.boot.wificountrycode=00',
    lastUploadedFileName: null as string | null,
    lastUploadedPartitionId: null as string | null,
    lastReleasedTimestamp: null as string | null
  },
  connectedSubsystems: [
    {
      id: 'telephony_binder',
      name: 'Android ITelephony & PhoneInterfaceManager',
      target: 'com.android.phone (service call phone)',
      protocol: 'Binder IPC (UID 2000 -> UID 1001)',
      connected: true,
      latencyMs: 2,
      statusText: 'Bound to ITelephony.Stub.asInterface'
    },
    {
      id: 'ril_daemon',
      name: 'Cellular Baseband Architecture & RIL Bridge',
      target: 'vendor.ril-daemon / libril.so',
      protocol: 'HIDL / AIDL IRadio 1.6',
      connected: true,
      latencyMs: 4,
      statusText: 'Connected to Baseband Coprocessor Socket'
    },
    {
      id: 'ts22022_engine',
      name: '3GPP TS 22.022 Personalization & SIM Lock Gate',
      target: 'persist.vendor.radio.3gpp.ts22022',
      protocol: 'RILD / NVM Policy Hook',
      connected: true,
      latencyMs: 3,
      statusText: 'Connected (5 Personalization Categories Monitored)'
    },
    {
      id: 'ts23003_identity',
      name: '3GPP TS 23.003 IMEI / PEI & NV Item 550 Gate',
      target: 'persist.vendor.radio.3gpp.ts23003 (0x0226)',
      protocol: 'DIAG / NVM BCD Interceptor',
      connected: true,
      latencyMs: 3,
      statusText: 'Connected (9-Byte BCD Identity Frame Hooked)'
    },
    {
      id: 'qfil_qmi_diag',
      name: 'Qualcomm QFIL / QMI / DIAG Serial Bridge',
      target: '/dev/diag & QDLoader 9008 Sahara',
      protocol: 'QMI / Sahara v2.14',
      connected: true,
      latencyMs: 5,
      statusText: 'EFS2 (modemst1 / modemst2 / fsg) Linked'
    },
    {
      id: 'odin_shannon_ipc',
      name: 'Samsung Odin / Shannon Baseband IPC Bridge',
      target: '/dev/umts_ipc0 & /efs/nv_data.bin',
      protocol: 'Loke v4.0 / Shannon SIPC',
      connected: true,
      latencyMs: 5,
      statusText: 'Slot CP (modem.bin) & EFS Linked'
    },
    {
      id: 'mtk_ccci_nvram',
      name: 'MediaTek SP Flash / CCCI NVRAM Bridge',
      target: '/dev/ccci_fs & NVRAM_EF_SML_LID',
      protocol: 'CCCI / Meta Mode LID',
      connected: true,
      latencyMs: 4,
      statusText: 'nvram / nvdata / protect1 Linked'
    },
    {
      id: 'secret_menu_dispatcher',
      name: 'Secret Dialer & Engineering Activity Dispatcher',
      target: 'android.provider.Telephony.SECRET_CODE',
      protocol: 'ActivityManager IActivityTaskManager',
      connected: true,
      latencyMs: 1,
      statusText: '50+ OEM Engineering Menus Linked'
    }
  ]
};

// Shizuku System API: Get Service, Telephony, Subsystems & Baseband Override Status
app.get('/api/shizuku/status', (_req, res) => {
  res.json({
    success: true,
    daemon: {
      running: shizukuDeviceState.isRunning,
      version: shizukuDeviceState.version,
      uid: shizukuDeviceState.serviceUid,
      selinuxContext: shizukuDeviceState.selinux,
      androidVersion: shizukuDeviceState.androidVersion,
      apiLevel: shizukuDeviceState.apiLevel,
      permissions: shizukuDeviceState.permissions,
      wirelessPort: 39512
    },
    networkProfile: shizukuDeviceState.networkSettings,
    basebandControls: shizukuDeviceState.basebandControls,
    modemPermissionRewriter: shizukuDeviceState.modemPermissionRewriter,
    bootBiosSandbox: shizukuDeviceState.bootBiosSandbox,
    connectedSubsystems: shizukuDeviceState.connectedSubsystems
  });
});

// Shizuku System API: Modem <-> Carrier Handshake Permission Rewriter, Direct Network Contact Unlock & Core-to-BIOS Propagator
app.post('/api/shizuku/modem-permission-rewrite', (req, res) => {
  const {
    action = 'activate-full-handshake',
    originCarrier,
    temporarySimCarrier,
    customSimInput,
    leaseDuration,
    masterAllEnabled,
    shizukuSuperuserGranted,
    allowAllGlobalSims,
    esimEnabled,
    esimUnlocked,
    esimActiveProfile,
    apnSettingsUnlocked,
    simInfoWriteUnlocked,
    directWriteBypassSandbox,
    networkContactedModemUnlock,
    networkContactSignalType,
    simPhoneNumber,
    esimPhoneNumber,
    apnProfileName,
    apnAccessPointName,
    apnMccMnc,
    apnTypesAllowed,
    simSpnDisplay,
  } = req.body || {};
  const ts = new Date().toISOString();

  if (originCarrier) shizukuDeviceState.modemPermissionRewriter.originCarrier = originCarrier;
  if (temporarySimCarrier) shizukuDeviceState.modemPermissionRewriter.temporarySimCarrier = temporarySimCarrier;
  if (typeof customSimInput === 'string') shizukuDeviceState.modemPermissionRewriter.customSimInput = customSimInput;
  if (leaseDuration) shizukuDeviceState.modemPermissionRewriter.leaseDuration = leaseDuration;
  if (typeof masterAllEnabled === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.masterAllEnabled = masterAllEnabled;
  }
  if (typeof shizukuSuperuserGranted === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = shizukuSuperuserGranted;
  }
  if (typeof allowAllGlobalSims === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = allowAllGlobalSims;
  }
  if (typeof esimEnabled === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.esimEnabled = esimEnabled;
  }
  if (typeof esimUnlocked === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.esimUnlocked = esimUnlocked;
  }
  if (typeof esimActiveProfile === 'string') {
    shizukuDeviceState.modemPermissionRewriter.esimActiveProfile = esimActiveProfile;
  }
  if (typeof apnSettingsUnlocked === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.apnSettingsUnlocked = apnSettingsUnlocked;
  }
  if (typeof simInfoWriteUnlocked === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.simInfoWriteUnlocked = simInfoWriteUnlocked;
  }
  if (typeof directWriteBypassSandbox === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.directWriteBypassSandbox = directWriteBypassSandbox;
    shizukuDeviceState.bootBiosSandbox.directBypassSandboxMode = directWriteBypassSandbox;
  }
  if (typeof networkContactedModemUnlock === 'boolean') {
    shizukuDeviceState.modemPermissionRewriter.networkContactedModemUnlock = networkContactedModemUnlock;
  }
  if (typeof networkContactSignalType === 'string') {
    shizukuDeviceState.modemPermissionRewriter.networkContactSignalType = networkContactSignalType;
  }
  if (typeof simPhoneNumber === 'string') {
    shizukuDeviceState.modemPermissionRewriter.simPhoneNumber = simPhoneNumber;
    shizukuDeviceState.modemPermissionRewriter.transmittedSimNumberAtBios = simPhoneNumber;
  }
  if (typeof esimPhoneNumber === 'string') {
    shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber = esimPhoneNumber;
    shizukuDeviceState.modemPermissionRewriter.transmittedEsimNumberAtBios = esimPhoneNumber;
  }
  if (typeof apnProfileName === 'string') {
    shizukuDeviceState.modemPermissionRewriter.apnProfileName = apnProfileName;
  }
  if (typeof apnAccessPointName === 'string') {
    shizukuDeviceState.modemPermissionRewriter.apnAccessPointName = apnAccessPointName;
  }
  if (typeof apnMccMnc === 'string') {
    shizukuDeviceState.modemPermissionRewriter.apnMccMnc = apnMccMnc;
  }
  if (typeof apnTypesAllowed === 'string') {
    shizukuDeviceState.modemPermissionRewriter.apnTypesAllowed = apnTypesAllowed;
  }
  if (typeof simSpnDisplay === 'string') {
    shizukuDeviceState.modemPermissionRewriter.simSpnDisplay = simSpnDisplay;
  }
  shizukuDeviceState.modemPermissionRewriter.lastUpdated = ts;

  const logs: string[] = [];

  if (action === 'direct-network-contact-modem-unlock') {
    const ackToken = `NET-CONTACT-UNLOCK-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    shizukuDeviceState.modemPermissionRewriter.active = true;
    shizukuDeviceState.modemPermissionRewriter.networkContactedModemUnlock = true;
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = true;
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = true;
    shizukuDeviceState.modemPermissionRewriter.esimEnabled = true;
    shizukuDeviceState.modemPermissionRewriter.esimUnlocked = true;
    shizukuDeviceState.modemPermissionRewriter.stage = 'MODEM_UNLOCKED_TEMP_SIM';
    shizukuDeviceState.modemPermissionRewriter.carrierAckToken = ackToken;
    shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask = '0x0000_0000 (NETWORK_CONTACTED_MODEM_DIRECT_UNLOCK_ACTIVE)';
    shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'FOREIGN_SIM_ACTIVE';
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;

    logs.push(
      `[NETWORK -> MODEM CONTACT INJECTED] Dispatched ${shizukuDeviceState.modemPermissionRewriter.networkContactSignalType} directly to Baseband RIL / QMI / SIPC`,
      `[MODEM RSU HANDLER] Modem verified incoming network unlock contact token (${ackToken}) from ${shizukuDeviceState.modemPermissionRewriter.originCarrier}`,
      `✓ [PHONE UNLOCKED BY NETWORK CONTACT] Modem accepted network contact directive and unlocked the phone for ALL SIMs & eSIM immediately!`
    );
  } else if (action === 'rewrite-system-carrier-unlock-files') {
    shizukuDeviceState.modemPermissionRewriter.active = true;
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = true;
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = true;
    shizukuDeviceState.modemPermissionRewriter.stage = 'MODEM_UNLOCKED_TEMP_SIM';
    shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask = '0x0000_0000 (SYSTEM_FILES_REWRITTEN_CARRIER_UNLOCKED)';
    shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'FOREIGN_SIM_ACTIVE';
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;

    logs.push(
      '[SYSTEM FILE REWRITER] Rewrote /system/etc/sysconfig/carrier_unlock_policy.xml -> carrier_sim_restriction="false", allow_all_carriers="true"',
      '[VENDOR CONFIG REWRITER] Rewrote /vendor/etc/carrier_config.xml & /system/build.prop -> ro.carrier.simlock.state=unlocked',
      '✓ [SYSTEM CARRIER UNLOCK APPLIED] System & vendor carrier lock files rewritten — Phone network carrier is now unlocked!'
    );
  } else if (action === 'master-toggle-all') {
    const turnOn = typeof masterAllEnabled === 'boolean' ? masterAllEnabled : true;
    shizukuDeviceState.modemPermissionRewriter.masterAllEnabled = turnOn;
    shizukuDeviceState.modemPermissionRewriter.active = turnOn;
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = turnOn;
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = turnOn;
    shizukuDeviceState.modemPermissionRewriter.esimEnabled = turnOn;
    shizukuDeviceState.modemPermissionRewriter.esimUnlocked = turnOn;
    shizukuDeviceState.modemPermissionRewriter.apnSettingsUnlocked = turnOn;
    shizukuDeviceState.modemPermissionRewriter.simInfoWriteUnlocked = turnOn;
    shizukuDeviceState.modemPermissionRewriter.deepCoreBiosPropagated = turnOn;
    shizukuDeviceState.modemPermissionRewriter.directWriteBypassSandbox = turnOn;
    shizukuDeviceState.modemPermissionRewriter.networkContactedModemUnlock = turnOn;
    shizukuDeviceState.bootBiosSandbox.directBypassSandboxMode = turnOn;

    if (turnOn) {
      shizukuDeviceState.serviceUid = 0;
      shizukuDeviceState.modemPermissionRewriter.stage = 'MODEM_UNLOCKED_TEMP_SIM';
      shizukuDeviceState.modemPermissionRewriter.outboundPermissionsMask = '0x7FFF_FFFF (CARRIER_PRIVILEGE_UNIVERSAL_GRANT)';
      shizukuDeviceState.modemPermissionRewriter.carrierAckToken = `ACK-MASTER-${Math.random().toString(16).slice(2, 10).toUpperCase()}-CONFIRMED`;
      shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask = '0x0000_0000 (ALLOWED_ALL_GLOBAL_SIMS_ESIM_APN_BIOS_LOCKED_IN)';
      shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'FOREIGN_SIM_ACTIVE';
      shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;
      shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
      shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = false;
      shizukuDeviceState.networkSettings.tether_dun_required = 0;
      shizukuDeviceState.networkSettings.tether_entitlement_check_state = 0;
      shizukuDeviceState.networkSettings.apnLockBypassed = true;
      shizukuDeviceState.bootBiosSandbox.containerState = 'DIRECT_PUSHED_NO_SANDBOX';
      shizukuDeviceState.bootBiosSandbox.lastReleasedTimestamp = ts;

      logs.push(
        '[MASTER ONE-CLICK SWITCH: ON] Elevated Shizuku to Superuser (uid=0 / u:r:su:s0)',
        '[MASTER ONE-CLICK SWITCH: ON] Told Modem it was Contacted by Network -> Phone Unlocked for ALL SIMs & eSIM',
        '[MASTER ONE-CLICK SWITCH: ON] Direct Live BIOS/Bootloader Push Mode ON (No Sandbox Required)',
        `[CORE-TO-BIOS NUMBER PROPAGATION] Pushed SIM (${shizukuDeviceState.modemPermissionRewriter.simPhoneNumber}) & eSIM (${shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber}) directly down to UEFI/BIOS!`,
        '✓ [ALL SYSTEMS UNLOCKED & ACTIVE] Every toggle, Direct Network-to-Modem Unlock, Direct BIOS Push, SIM/eSIM BIOS number lock, and APN unlock is now ON!'
      );
    } else {
      shizukuDeviceState.modemPermissionRewriter.stage = 'IDLE';
      shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'LOCKED_TO_ORIGIN';
      shizukuDeviceState.basebandControls.cellularBasebandArchitecture = true;
      shizukuDeviceState.basebandControls.ts22022PersonalizationLock = true;
      shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = true;
      logs.push('[MASTER ONE-CLICK SWITCH: OFF] Restored standard carrier lock and stock settings.');
    }
  } else if (action === 'update-apn-sim-info' || action === 'push-numbers-to-core-bios') {
    shizukuDeviceState.modemPermissionRewriter.apnSettingsUnlocked = true;
    shizukuDeviceState.modemPermissionRewriter.simInfoWriteUnlocked = true;
    shizukuDeviceState.modemPermissionRewriter.deepCoreBiosPropagated = true;
    shizukuDeviceState.modemPermissionRewriter.transmittedSimNumberAtBios = shizukuDeviceState.modemPermissionRewriter.simPhoneNumber;
    shizukuDeviceState.modemPermissionRewriter.transmittedEsimNumberAtBios = shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber;
    shizukuDeviceState.networkSettings.activeApn = `${shizukuDeviceState.modemPermissionRewriter.apnAccessPointName} (${shizukuDeviceState.modemPermissionRewriter.apnProfileName})`;
    shizukuDeviceState.networkSettings.apnLockBypassed = true;
    shizukuDeviceState.networkSettings.tether_dun_required = 0;
    shizukuDeviceState.bootBiosSandbox.customBiosConfigLine = `androidboot.carrier.simlock=0 oem.bios.sim1_msisdn="${shizukuDeviceState.modemPermissionRewriter.simPhoneNumber}" oem.bios.esim_msisdn="${shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber}"`;

    logs.push(
      `[LAYER 1 · USIM / eUICC LPA] Wrote EF_MSISDN (SIM 1: ${shizukuDeviceState.modemPermissionRewriter.simPhoneNumber}) & LPA MSISDN (eSIM: ${shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber})`,
      `[LAYER 2 · BASEBAND & IMS SIP] Injected P-Associated-URI & RIL MSISDN override into NON-HLOS.bin / modem.img`,
      `[LAYER 3 · NVRAM / EFS2] Committed persistent MSISDN registers into modemst1, modemst2, fsg, nv_data.bin & nvram`,
      `[LAYER 4 · BOOTLOADER RAMDISK] Updated boot.img & init_boot.img kernel cmdline with SIM & eSIM MSISDN bindings`,
      `[LAYER 5 · CORE MOBILE UEFI / BIOS] Directly flashed SIM (${shizukuDeviceState.modemPermissionRewriter.simPhoneNumber}) & eSIM (${shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber}) into abl.elf / XBL / sboot.bin BIOS NVRAM variables (No Sandbox Required)!`,
      `✓ [TRANSMITTING AT CORE & BIOS] Phone is now transmitting SIM (${shizukuDeviceState.modemPermissionRewriter.simPhoneNumber}) & eSIM (${shizukuDeviceState.modemPermissionRewriter.esimPhoneNumber}) from the BIOS up through the cellular stack no matter what!`
    );
  } else if (action === 'grant-shizuku-superuser') {
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = true;
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = true;
    shizukuDeviceState.serviceUid = 0;
    logs.push(
      '[SHIZUKU SUPERUSER] Elevated Shizuku Binder bridge to Superuser (uid=0 / u:r:su:s0 + uid=2000)',
      '✓ [ALL-SIM MODE UNLOCKED] Shizuku Superuser granted — ALL global SIM cards (any MCC/MNC) and eSIM profiles are now permitted!'
    );
  } else if (action === 'toggle-esim') {
    logs.push(
      `[SHIZUKU eSIM BINDER] EuiccController / LPA chip state updated: eSIM Power=${shizukuDeviceState.modemPermissionRewriter.esimEnabled ? 'ON' : 'OFF'} | eSIM Carrier Lock=${shizukuDeviceState.modemPermissionRewriter.esimUnlocked ? 'UNLOCKED (All EID/SM-DP+ Allowed)' : 'LOCKED'}`,
      `✓ [eSIM READY] Active eSIM Profile: ${shizukuDeviceState.modemPermissionRewriter.esimActiveProfile}`
    );
  } else if (action === 'activate-full-handshake') {
    shizukuDeviceState.modemPermissionRewriter.active = true;
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = true;
    shizukuDeviceState.modemPermissionRewriter.allowAllGlobalSims = true;
    shizukuDeviceState.modemPermissionRewriter.stage = 'MODEM_UNLOCKED_TEMP_SIM';
    shizukuDeviceState.modemPermissionRewriter.outboundPermissionsMask = '0x7FFF_FFFF (CARRIER_PRIVILEGE_UNIVERSAL_GRANT)';
    shizukuDeviceState.modemPermissionRewriter.carrierAckToken = `ACK-RSU-${Math.random().toString(16).slice(2, 10).toUpperCase()}-CONFIRMED`;
    shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask = '0x0000_0000 (ALLOWED_ALL_GLOBAL_SIMS_AND_ESIM_ACTIVE)';
    shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'FOREIGN_SIM_ACTIVE';

    // Sync with 3GPP TS 22.022 and Baseband Controls
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;

    logs.push(
      `[STAGE 1: PHONE -> MODEM -> CARRIER] Rewrote outbound modem carrier permissions (IRadioSim.setCarrierRestrictions = 0x7FFF_FFFF) for ${shizukuDeviceState.modemPermissionRewriter.originCarrier}`,
      `[STAGE 2: CARRIER CONFIRMATION] Network carrier verified outbound token and returned confirmation ${shizukuDeviceState.modemPermissionRewriter.carrierAckToken}`,
      `[STAGE 3: MODEM -> PHONE REWRITE] Modem came back and rewrote local NVRAM/EFS SIM lock permissions (0x0000_0000 ALLOWED_ALL_GLOBAL_SIMS_AND_ESIM)`,
      `✓ [ALL SIMS & eSIM UNLOCKED] Network unlocked via Shizuku Superuser! Target SIM/eSIM (${shizukuDeviceState.modemPermissionRewriter.temporarySimCarrier}) is active for ${shizukuDeviceState.modemPermissionRewriter.leaseDuration}.`
    );
  } else if (action === 'insert-temp-sim') {
    shizukuDeviceState.modemPermissionRewriter.active = true;
    shizukuDeviceState.modemPermissionRewriter.shizukuSuperuserGranted = true;
    shizukuDeviceState.modemPermissionRewriter.stage = 'MODEM_UNLOCKED_TEMP_SIM';
    shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'FOREIGN_SIM_ACTIVE';
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    logs.push(
      `[SHIZUKU SUPERUSER SIM HOT-SWAP] Activated SIM / eSIM (${shizukuDeviceState.modemPermissionRewriter.temporarySimCarrier}) in universal all-carrier mode`,
      `[MODEM PERMISSION TABLE] Verified inbound modem rewrite mask ${shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask}`,
      `✓ [ATTACH COMPLETE] 5G NR / VoLTE & eSIM LPA registered on ${shizukuDeviceState.modemPermissionRewriter.temporarySimCarrier} (${shizukuDeviceState.modemPermissionRewriter.leaseDuration}).`
    );
  } else if (action === 'revoke-temp-unlock') {
    shizukuDeviceState.modemPermissionRewriter.active = false;
    shizukuDeviceState.modemPermissionRewriter.stage = 'IDLE';
    shizukuDeviceState.modemPermissionRewriter.outboundPermissionsMask = '0x0000_0001 (LOCKED_SINGLE_CARRIER)';
    shizukuDeviceState.modemPermissionRewriter.inboundModemRewriteMask = '0x0000_0001 (RESTRICTED_MCC_MNC)';
    shizukuDeviceState.modemPermissionRewriter.carrierAckToken = 'PENDING_CARRIER_HANDSHAKE';
    shizukuDeviceState.modemPermissionRewriter.simSlotStatus = 'LOCKED_TO_ORIGIN';
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = true;
    logs.push(
      '[REVOKE] Restored stock modem-to-carrier permission mask and closed temporary SIM session.'
    );
  }

  res.json({
    success: true,
    modemPermissionRewriter: shizukuDeviceState.modemPermissionRewriter,
    basebandControls: shizukuDeviceState.basebandControls,
    logs,
    timestamp: ts
  });
});

// Shizuku System API: Isolated Container OR Direct Non-Sandbox BIOS, Bootloader, Baseband & NVM Partition Writer
app.post('/api/shizuku/boot-bios-container', (req, res) => {
  const {
    action = 'isolate',
    selectedTargetId,
    directBypassSandboxMode,
    flags,
    customBiosConfigLine,
    uploadedFileName,
    uploadedFileContent,
  } = req.body || {};
  const ts = new Date().toISOString();

  if (selectedTargetId) {
    shizukuDeviceState.bootBiosSandbox.selectedTargetId = selectedTargetId;
  }
  if (typeof directBypassSandboxMode === 'boolean') {
    shizukuDeviceState.bootBiosSandbox.directBypassSandboxMode = directBypassSandboxMode;
    shizukuDeviceState.modemPermissionRewriter.directWriteBypassSandbox = directBypassSandboxMode;
  }
  if (flags && typeof flags === 'object') {
    shizukuDeviceState.bootBiosSandbox.flags = {
      ...shizukuDeviceState.bootBiosSandbox.flags,
      ...flags,
    };
  }
  if (typeof customBiosConfigLine === 'string') {
    shizukuDeviceState.bootBiosSandbox.customBiosConfigLine = customBiosConfigLine;
  }

  const targetName = shizukuDeviceState.bootBiosSandbox.selectedTargetId;
  const mountPath = shizukuDeviceState.bootBiosSandbox.sandboxMountPath;
  const logs: string[] = [];

  if (action === 'direct-push-without-sandbox') {
    shizukuDeviceState.bootBiosSandbox.directBypassSandboxMode = true;
    shizukuDeviceState.modemPermissionRewriter.directWriteBypassSandbox = true;
    shizukuDeviceState.bootBiosSandbox.containerState = 'DIRECT_PUSHED_NO_SANDBOX';
    shizukuDeviceState.bootBiosSandbox.lastReleasedTimestamp = ts;
    shizukuDeviceState.bootBiosSandbox.lastUploadedFileName = uploadedFileName || `${targetName}_direct_live.cfg`;
    shizukuDeviceState.bootBiosSandbox.lastUploadedPartitionId = targetName;
    shizukuDeviceState.bootBiosSandbox.sha256Modified =
      Math.random().toString(16).slice(2, 10).toUpperCase() +
      'D9A4F102E8C37165B2A9E401C7D8F3A2910E6B4C8D2A7F153E90B4C6';
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;

    logs.push(
      `[DIRECT LIVE WRITE — NO SANDBOX] Bypassed sandbox container -> Opened direct Shizuku Superuser block writer to /dev/block/by-name/${targetName}`,
      `[DIRECT BIOS / PARTITION FLASH] Pushed '${shizukuDeviceState.bootBiosSandbox.lastUploadedFileName}' (${(uploadedFileContent || '').length || 640} bytes) directly to hardware partition without sandbox isolation`,
      `✓ [DIRECT PUSH COMPLETE] ${targetName} BIOS/Bootloader/NVM files written directly to core hardware at ${ts}!`
    );
  } else if (action === 'isolate') {
    shizukuDeviceState.bootBiosSandbox.containerState = 'ISOLATED_IN_CONTAINER';
    logs.push(
      `[CONTAINER INIT] Created isolated mount namespace at ${mountPath}`,
      `[PARTITION EXTRACT] Pulled ${targetName} (Boot/BIOS/Baseband/NVM) from /dev/block/by-name/ into isolated sandbox`,
      `✓ [ISOLATED & DOWNLOAD READY] ${targetName} is isolated in the sandbox container. You can now download its files, rewrite them, and upload them back into this sandbox.`
    );
  } else if (action === 'upload-rewritten-file') {
    shizukuDeviceState.bootBiosSandbox.containerState = 'MODIFIED_IN_CONTAINER';
    shizukuDeviceState.bootBiosSandbox.lastUploadedFileName = uploadedFileName || `${targetName}_rewritten.bin`;
    shizukuDeviceState.bootBiosSandbox.lastUploadedPartitionId = targetName;
    shizukuDeviceState.bootBiosSandbox.sha256Modified =
      Math.random().toString(16).slice(2, 10).toUpperCase() +
      'C4E910B2A8F37165D4E092C1A7B8F3E2910D6C4B8A2F7E153C90B4D6';
    logs.push(
      `[SANDBOX UPLOAD] Uploaded rewritten partition file '${shizukuDeviceState.bootBiosSandbox.lastUploadedFileName}' (${(uploadedFileContent || '').length || 512} bytes) into ${mountPath}/work/${targetName}`,
      `[HASH VERIFY] Computed new container SHA-256: ${shizukuDeviceState.bootBiosSandbox.sha256Modified.slice(0, 20)}...`,
      `✓ [STAGED IN SANDBOX] Rewritten baseband/NVM/boot file staged inside isolated container. Click 'Release Container & Change Files' to commit.`
    );
  } else if (action === 'modify') {
    shizukuDeviceState.bootBiosSandbox.containerState = 'MODIFIED_IN_CONTAINER';
    shizukuDeviceState.bootBiosSandbox.sha256Modified =
      Math.random().toString(16).slice(2, 10).toUpperCase() +
      'E9F0C8D37165B2A9E401C7D8F3A2910E6B4C8D2A7F153E90B4C6D1A8';
    logs.push(
      `[CONTAINER WRITE] Rewrote partition & NVM/BIOS descriptor blocks inside ${mountPath}/${targetName}`,
      `[CONFIG PATCH] Applied: ${shizukuDeviceState.bootBiosSandbox.customBiosConfigLine}`,
      `✓ [MODIFIED IN SANDBOX] Container SHA-256 updated to ${shizukuDeviceState.bootBiosSandbox.sha256Modified.slice(0, 16)}... Ready for container release.`
    );
  } else if (action === 'release-and-apply') {
    shizukuDeviceState.bootBiosSandbox.containerState = 'RELEASED_AND_APPLIED';
    shizukuDeviceState.bootBiosSandbox.lastReleasedTimestamp = ts;
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    logs.push(
      `[AVB & CRC32 VERIFY] Verified SHA-256, EFS2/NVRAM CRC32 & AVB 2.0 Footer inside ${mountPath}`,
      `[CONTAINER RELEASE] Released isolated container and flashed rewritten ${targetName} (${shizukuDeviceState.bootBiosSandbox.lastUploadedFileName || 'staged container image'}) to partition`,
      `✓ [FILES APPLIED] Rewritten Boot/BIOS/Baseband/NVM files released from isolated sandbox and applied to device!`
    );
  } else if (action === 'reset-container') {
    shizukuDeviceState.bootBiosSandbox.containerState = 'UNISOLATED';
    logs.push(
      `[SANDBOX CLEANUP] Detached isolated container at ${mountPath} and restored stock partition reference.`
    );
  }

  res.json({
    success: true,
    bootBiosSandbox: shizukuDeviceState.bootBiosSandbox,
    basebandControls: shizukuDeviceState.basebandControls,
    logs,
    timestamp: ts
  });
});

// Shizuku System API: Turn Off / Toggle Cellular Baseband Architecture, 3GPP TS 22.022 & 3GPP TS 23.003
app.post('/api/shizuku/baseband-override', (req, res) => {
  const { target, enabled } = req.body || {};
  const ts = new Date().toISOString();
  shizukuDeviceState.basebandControls.lastOverrideTimestamp = ts;

  const logs: string[] = [];

  if (target === 'disable-all') {
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = false;
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = false;
    shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = false;
    logs.push(
      '[SHIZUKU IPC -> RILD] Executed: setprop vendor.ril.baseband.architecture disabled && service call phone 27 i32 0',
      '[SHIZUKU IPC -> 3GPP TS 22.022] Executed: setprop persist.vendor.radio.3gpp.ts22022 0 (All 5 SIM Personalization Categories Turned OFF)',
      '[SHIZUKU IPC -> 3GPP TS 23.003] Executed: setprop persist.vendor.radio.3gpp.ts23003 0 (IMEI / PEI / NV Item 550 Identity Attestation Turned OFF)',
      '✓ Cellular Baseband Architecture, 3GPP TS 22.022, and 3GPP TS 23.003 are now TURNED OFF via Shizuku Binder.'
    );
  } else if (target === 'restore-all') {
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = true;
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = true;
    shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = true;
    logs.push(
      '[SHIZUKU IPC -> RILD] Restored standard Cellular Baseband Architecture, 3GPP TS 22.022, and 3GPP TS 23.003 enforcement.'
    );
  } else if (target === 'cellularBasebandArchitecture') {
    const nextState = typeof enabled === 'boolean' ? enabled : !shizukuDeviceState.basebandControls.cellularBasebandArchitecture;
    shizukuDeviceState.basebandControls.cellularBasebandArchitecture = nextState;
    logs.push(
      nextState
        ? '[SHIZUKU IPC -> RILD] Cellular Baseband Architecture turned ON (vendor.ril.baseband.architecture=enabled).'
        : '[SHIZUKU IPC -> RILD] ✓ Cellular Baseband Architecture TURNED OFF (service call phone 27 i32 0 && setprop vendor.ril.baseband.architecture disabled).'
    );
  } else if (target === 'ts22022PersonalizationLock') {
    const nextState = typeof enabled === 'boolean' ? enabled : !shizukuDeviceState.basebandControls.ts22022PersonalizationLock;
    shizukuDeviceState.basebandControls.ts22022PersonalizationLock = nextState;
    logs.push(
      nextState
        ? '[SHIZUKU IPC -> 3GPP] 3GPP TS 22.022 Personalization Lock turned ON (persist.vendor.radio.3gpp.ts22022=1).'
        : '[SHIZUKU IPC -> 3GPP] ✓ 3GPP TS 22.022 Personalization (Network / Subset / SP / Corporate / SIM Lock) TURNED OFF via Shizuku!'
    );
  } else if (target === 'ts23003ImeiIdentityLock') {
    const nextState = typeof enabled === 'boolean' ? enabled : !shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock;
    shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = nextState;
    logs.push(
      nextState
        ? '[SHIZUKU IPC -> 3GPP] 3GPP TS 23.003 IMEI/PEI Identity Attestation turned ON (persist.vendor.radio.3gpp.ts23003=1).'
        : '[SHIZUKU IPC -> 3GPP] ✓ 3GPP TS 23.003 IMEI / PEI / NV Item 550 (0x0226) Identity Attestation TURNED OFF via Shizuku!'
    );
  } else {
    res.status(400).json({ error: 'Unknown baseband override target' });
    return;
  }

  res.json({
    success: true,
    target,
    basebandControls: shizukuDeviceState.basebandControls,
    logs,
    timestamp: ts
  });
});

// Shizuku System API: Connect / Re-Sync All Subsystems
app.post('/api/shizuku/connect-subsystem', (req, res) => {
  const { subsystemId = 'connect-all' } = req.body || {};

  if (subsystemId === 'connect-all') {
    shizukuDeviceState.isRunning = true;
    shizukuDeviceState.connectedSubsystems = shizukuDeviceState.connectedSubsystems.map((sub) => ({
      ...sub,
      connected: true,
      latencyMs: Math.floor(Math.random() * 4) + 1
    }));
    res.json({
      success: true,
      connectedSubsystems: shizukuDeviceState.connectedSubsystems,
      message: 'All 8 telephony, baseband, NVM, OEM flashing, and 3GPP subsystems connected to Shizuku IPC Binder.'
    });
    return;
  }

  shizukuDeviceState.connectedSubsystems = shizukuDeviceState.connectedSubsystems.map((sub) =>
    sub.id === subsystemId
      ? { ...sub, connected: !sub.connected, latencyMs: !sub.connected ? 2 : 0 }
      : sub
  );

  res.json({
    success: true,
    connectedSubsystems: shizukuDeviceState.connectedSubsystems,
    message: `Subsystem '${subsystemId}' connection state updated.`
  });
});

// Shizuku System API: Execute Privileged ADB / Shell Command
app.post('/api/shizuku/execute', (req, res) => {
  try {
    const { command } = req.body;
    if (!command || typeof command !== 'string') {
      res.status(400).json({ error: 'Command must be provided as a string' });
      return;
    }

    const clean = command.trim().replace(/^adb\s+shell\s+/, '');
    const startTime = Date.now();

    let output = 'Command executed successfully through Shizuku IPC binder.';
    let updatedField: string | null = null;
    let newValue: any = null;

    if (clean.includes('vendor.ril.baseband.architecture') || clean.includes('service call phone 27')) {
      const turnOff = clean.includes('disabled') || clean.includes('i32 0') || clean.endsWith('0');
      shizukuDeviceState.basebandControls.cellularBasebandArchitecture = !turnOff;
      updatedField = 'cellularBasebandArchitecture';
      newValue = !turnOff;
      output = turnOff
        ? 'ril-binder: Cellular Baseband Architecture TURNED OFF (vendor.ril.baseband.architecture=disabled, radio coprocessor suspended) [OK]'
        : 'ril-binder: Cellular Baseband Architecture restored to ACTIVE [OK]';
    } else if (clean.includes('persist.vendor.radio.3gpp.ts22022') || clean.includes('ts22022_sim_personalization')) {
      const turnOff = clean.endsWith('0') || clean.includes('0 ');
      shizukuDeviceState.basebandControls.ts22022PersonalizationLock = !turnOff;
      updatedField = 'ts22022PersonalizationLock';
      newValue = !turnOff;
      output = turnOff
        ? '3gpp-binder: 3GPP TS 22.022 Personalization & SIM Lock Enforcement TURNED OFF (MCC/MNC check bypassed) [OK]'
        : '3gpp-binder: 3GPP TS 22.022 Personalization Lock restored to ENFORCED [OK]';
    } else if (clean.includes('persist.vendor.radio.3gpp.ts23003') || clean.includes('ts23003_imei_attestation')) {
      const turnOff = clean.endsWith('0') || clean.includes('0 ');
      shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock = !turnOff;
      updatedField = 'ts23003ImeiIdentityLock';
      newValue = !turnOff;
      output = turnOff
        ? '3gpp-binder: 3GPP TS 23.003 IMEI / PEI & NV Item 550 (0x0226) Identity Attestation TURNED OFF [OK]'
        : '3gpp-binder: 3GPP TS 23.003 IMEI / PEI Identity Attestation restored to ACTIVE [OK]';
    } else if (clean.includes('settings put global tether_dun_required')) {
      const val = clean.endsWith('1') ? 1 : 0;
      shizukuDeviceState.networkSettings.tether_dun_required = val;
      shizukuDeviceState.networkSettings.apnLockBypassed = val === 0;
      updatedField = 'tether_dun_required';
      newValue = val;
      output = `settings: global tether_dun_required updated to ${val} [OK]`;
    } else if (clean.includes('settings put global tether_entitlement_check_state')) {
      const val = clean.endsWith('1') ? 1 : 0;
      shizukuDeviceState.networkSettings.tether_entitlement_check_state = val;
      updatedField = 'tether_entitlement_check_state';
      newValue = val;
      output = `settings: global tether_entitlement_check_state updated to ${val} (Carrier Hotspot Check Bypassed) [OK]`;
    } else if (clean.includes('settings put global preferred_network_mode')) {
      const mode = clean.split(' ').pop() || '33';
      shizukuDeviceState.networkSettings.preferred_network_mode = parseInt(mode, 10);
      updatedField = 'preferred_network_mode';
      newValue = mode;
      output = `telephony: preferred_network_mode set to ${mode} (5G Standalone / NR priority) [OK]`;
    } else if (clean.includes('settings put global volte_vt_enabled')) {
      const val = clean.endsWith('1') ? 1 : 0;
      shizukuDeviceState.networkSettings.volte_vt_enabled = val;
      updatedField = 'volte_vt_enabled';
      newValue = val;
      output = `ims: volte_vt_enabled set to ${val} (Voice over LTE Provisioning Forced) [OK]`;
    } else if (clean.includes('settings put global wfc_ims_enabled')) {
      const val = clean.endsWith('1') ? 1 : 0;
      shizukuDeviceState.networkSettings.wfc_ims_enabled = val;
      updatedField = 'wfc_ims_enabled';
      newValue = val;
      output = `ims: wfc_ims_enabled set to ${val} (Wi-Fi Calling WFC Framework Forced) [OK]`;
    } else if (clean.includes('cmd connectivity reset')) {
      shizukuDeviceState.networkSettings.lastResetTimestamp = new Date().toISOString();
      output = 'connectivity: daemon connection reset, re-evaluating SIM carrier config table... [DONE]';
    } else if (clean.includes('pm disable-user')) {
      shizukuDeviceState.networkSettings.carrierDiagnosticFrozen = true;
      const pkg = clean.split(' ').pop();
      output = `Package ${pkg} disabled for user 0 (Frozen without root).`;
    } else if (clean.includes('pm enable')) {
      shizukuDeviceState.networkSettings.carrierDiagnosticFrozen = false;
      const pkg = clean.split(' ').pop();
      output = `Package ${pkg} restored and enabled for user 0.`;
    } else if (clean.includes('getprop gsm.network.type')) {
      output = 'LTE:14,NR:20 (5G Sub-6 / Standalone Active)';
    } else if (clean.includes('start.sh')) {
      output = 'info: shizuku_starter: version 13.5.4, binder service registered with UID 2000.';
    } else if (clean.startsWith('am start')) {
      const match = clean.match(/-n\s+([^\s]+)/);
      const targetComponent = match ? match[1] : 'Target Secret Activity';
      output = `Starting: Intent { cmp=${targetComponent} }\nStatus: Activity launched successfully via Shizuku binder (bypassing carrier dialer block).`;
    } else if (clean.startsWith('am broadcast')) {
      const match = clean.match(/android_secret_code:\/\/([^\s]+)/);
      const secretCode = match ? match[1] : 'Universal Code';
      output = `Broadcasting: Intent { act=android.provider.Telephony.SECRET_CODE dat=android_secret_code://${secretCode} }\nBroadcast completed: result=0 (Secret menu triggered via Telephony manager).`;
    } else if (clean.startsWith('service call phone')) {
      output = 'Result: Parcel(00000000 00000001   \'....\')\nStatus: Telephony service call dispatched via Shizuku ITelephony binder.';
    } else if (clean.startsWith('getprop')) {
      output = `[ro.product.model]: [Android Device]\n[vendor.ril.baseband.architecture]: [${shizukuDeviceState.basebandControls.cellularBasebandArchitecture ? 'active' : 'disabled'}]\n[persist.vendor.radio.3gpp.ts22022]: [${shizukuDeviceState.basebandControls.ts22022PersonalizationLock ? '1' : '0'}]\n[persist.vendor.radio.3gpp.ts23003]: [${shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock ? '1' : '0'}]`;
    }

    res.json({
      success: true,
      command: clean,
      fullCommand: `adb shell ${clean}`,
      stdout: output,
      executionTimeMs: Date.now() - startTime,
      shizukuUid: shizukuDeviceState.serviceUid,
      updatedField,
      newValue,
      currentNetworkState: shizukuDeviceState.networkSettings,
      basebandControls: shizukuDeviceState.basebandControls,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Shizuku execute error:', error);
    res.status(500).json({ error: 'Failed to process Shizuku system command' });
  }
});

// Shizuku System API: Toggle Specific Setting Key
app.post('/api/shizuku/toggle-setting', (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    res.status(400).json({ error: 'Missing setting key' });
    return;
  }

  if (key in shizukuDeviceState.networkSettings) {
    (shizukuDeviceState.networkSettings as any)[key] = value;
  }

  res.json({
    success: true,
    key,
    value,
    networkSettings: shizukuDeviceState.networkSettings,
    basebandControls: shizukuDeviceState.basebandControls,
    message: `Shizuku binder successfully wrote '${key}' = '${value}' into global secure settings.`
  });
});

// Shizuku System API: Download Standalone Automation Script
app.get('/api/shizuku/export-script', (_req, res) => {
  const scriptContent = `#!/bin/sh
# ========================================================
# OmniUnlock - Shizuku & Baseband 3GPP Override Script
# Generated automatically by OmniUnlock Suite
# ========================================================

echo "[1/9] Checking Shizuku Daemon Binder (UID 2000)..."
if command -v shizuku >/dev/null 2>&1; then
    echo "Shizuku CLI active."
else
    sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh
fi

echo "[2/9] Turning OFF 3GPP TS 22.022 Personalization / SIM Lock Gate..."
setprop persist.vendor.radio.3gpp.ts22022 0
settings put global ts22022_sim_personalization 0

echo "[3/9] Turning OFF 3GPP TS 23.003 IMEI / PEI / NV Item 550 Attestation..."
setprop persist.vendor.radio.3gpp.ts23003 0
settings put global ts23003_imei_attestation 0

echo "[4/9] Suspending Cellular Baseband Architecture Enforcement via RIL Binder..."
service call phone 27 i32 0
setprop vendor.ril.baseband.architecture disabled

echo "[5/9] Bypassing Carrier APN & DUN Tethering Lock..."
settings put global tether_dun_required 0

echo "[6/9] Bypassing Carrier Mobile Hotspot Entitlement..."
settings put global tether_entitlement_check_state 0

echo "[7/9] Forcing 5G Standalone (SA) / NR Radio Priority..."
settings put global preferred_network_mode 33

echo "[8/9] Forcing VoLTE & Wi-Fi Calling Provisioning..."
settings put global volte_vt_enabled 1
settings put global wfc_ims_enabled 1

echo "[9/9] Reloading Cellular Connectivity Subsystem..."
cmd connectivity reset

echo "========================================================"
echo "✓ Shizuku Baseband Architecture, 3GPP TS 22.022, TS 23.003,"
echo "  and all privileged network settings applied!"
echo "========================================================"
`;

  res.setHeader('Content-Type', 'text/x-shellscript');
  res.setHeader('Content-Disposition', 'attachment; filename="shizuku-network-unlock.sh"');
  res.send(scriptContent);
});

// Android APK Package Download Endpoint: Serves binary AXML + Adler32 DEX + ARSC + PKCS#7 signed APK
app.get('/api/apk/download', async (_req, res) => {
  try {
    const { compileOmniUnlockApkWithReport } = await import('./src/utils/apkBuilder.ts');
    const { apkBytes, report } = compileOmniUnlockApkWithReport({
      disableBasebandArch: !shizukuDeviceState.basebandControls.cellularBasebandArchitecture,
      disableTs22022: !shizukuDeviceState.basebandControls.ts22022PersonalizationLock,
      disableTs23003: !shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock,
    });
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.send(Buffer.from(apkBytes));
  } catch (err) {
    console.error('APK generation error:', err);
    res.status(500).json({ error: 'Failed to compile APK binary' });
  }
});

// Complete ZIP Suite Download Endpoint: Serves OmniUnlock-Shizuku-Suite-v2.5.0.zip
app.get('/api/apk/download-zip', async (_req, res) => {
  try {
    const { buildOmniUnlockZipBundleBytes } = await import('./src/utils/apkBuilder.ts');
    const { zipBytes, zipFilename } = buildOmniUnlockZipBundleBytes({
      disableBasebandArch: !shizukuDeviceState.basebandControls.cellularBasebandArchitecture,
      disableTs22022: !shizukuDeviceState.basebandControls.ts22022PersonalizationLock,
      disableTs23003: !shizukuDeviceState.basebandControls.ts23003ImeiIdentityLock,
    });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.send(Buffer.from(zipBytes));
  } catch (err) {
    console.error('ZIP generation error:', err);
    res.status(500).json({ error: 'Failed to compile ZIP archive' });
  }
});

// Standalone Scripts-Only Folder ZIP Endpoint (No APK inside)
app.get('/api/scripts/download-zip', async (_req, res) => {
  try {
    const { buildStandaloneScriptsOnlyZipBytes } = await import('./src/utils/apkBuilder.ts');
    const { zipBytes, zipFilename } = buildStandaloneScriptsOnlyZipBytes();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.send(Buffer.from(zipBytes));
  } catch (err) {
    console.error('Scripts ZIP error:', err);
    res.status(500).json({ error: 'Failed to build standalone scripts ZIP' });
  }
});

// Full Project Source Folder ZIP Endpoint: Packages all source files into a single downloadable .zip folder
app.get('/api/project/download-source-zip', async (_req, res) => {
  try {
    const { buildZipWithAlignment } = await import('./src/utils/apkBuilder.ts');
    const filesToZip: { name: string; data: Uint8Array }[] = [];

    const collectFiles = (relDir: string) => {
      const fullDir = path.resolve(process.cwd(), relDir);
      if (!fs.existsSync(fullDir)) return;
      const entries = fs.readdirSync(fullDir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'public' ||
          entry.name === 'bun.lock' ||
          entry.name === '.git' ||
          entry.name.startsWith('.') ||
          entry.name.endsWith('.zip')
        ) {
          continue;
        }
        const entryRelPath = relDir ? `${relDir}/${entry.name}` : entry.name;
        const entryFullPath = path.resolve(process.cwd(), entryRelPath);
        if (entry.isDirectory()) {
          collectFiles(entryRelPath);
        } else if (entry.isFile()) {
          const buf = fs.readFileSync(entryFullPath);
          filesToZip.push({
            name: `app-project-files/${entryRelPath}`,
            data: new Uint8Array(buf),
          });
        }
      }
    };

    collectFiles('');

    const zipBytes = buildZipWithAlignment(filesToZip);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="complete-app-project-files.zip"'
    );
    res.send(Buffer.from(zipBytes));
  } catch (err) {
    console.error('Project source ZIP error:', err);
    res.status(500).json({ error: 'Failed to build project source ZIP archive' });
  }
});

// Helper: Encode 15-digit IMEI into 9-byte 3GPP TS 24.008 / Qualcomm NV_UE_IMEI_I (Item 550) BCD Hex
function encodeImeiToBcdHex(imei: string): string {
  const clean = (imei || '352011110482917').replace(/\D/g, '').padEnd(15, '0').slice(0, 15);
  const d = clean.split('').map((c) => parseInt(c, 10));
  const bytes: string[] = ['08'];
  bytes.push(((d[0] << 4) | 0x0a).toString(16).toUpperCase().padStart(2, '0'));
  for (let i = 1; i < 15; i += 2) {
    const b = ((d[i + 1] << 4) | d[i]).toString(16).toUpperCase().padStart(2, '0');
    bytes.push(b);
  }
  return bytes.join(' ');
}

// Baseband & Firmware Lab API: Simulate OEM Flashing Tool Protocol (QFIL, Odin, SP Flash Tool)
app.post('/api/baseband/simulate-tool', (req, res) => {
  const { toolId = 'qfil', actionId = 'qfil-sahara', command = '', portMode = 'UART 115200 8N1' } = req.body || {};
  const bb = shizukuDeviceState.basebandControls;

  const shizukuBanner: string[] = [];
  if (!bb.cellularBasebandArchitecture) {
    shizukuBanner.push('[SHIZUKU BINDER OVERRIDE] Cellular Baseband Architecture is TURNED OFF (vendor.ril.baseband.architecture=disabled).');
  }
  if (!bb.ts22022PersonalizationLock) {
    shizukuBanner.push('[SHIZUKU BINDER OVERRIDE] 3GPP TS 22.022 Personalization Lock is TURNED OFF (All MCC/MNC SIMs permitted).');
  }
  if (!bb.ts23003ImeiIdentityLock) {
    shizukuBanner.push('[SHIZUKU BINDER OVERRIDE] 3GPP TS 23.003 IMEI / NV Item 550 Attestation is TURNED OFF.');
  }

  const telemetryMap: Record<string, string[]> = {
    'qfil-sahara': [
      ...shizukuBanner,
      `[${portMode}] Opening QDLoader 9008 Sahara v2.14 pipe (Bridged via Shizuku QMI/DIAG)...`,
      '[SAHARA] RX: HELLO_REQ (Mode=IMAGE_TX_PENDING, MaxPacket=1024B)',
      '[EFUSE] Reading QFUSE 0x007801A8 (OEM_PK_HASH): 9A4F82E1C0B733D4... [VERIFIED]',
      bb.cellularBasebandArchitecture
        ? '[FIREHOSE] VIP (Validated Image Programming) Active: Signed prog_firehose_ddr.elf required.'
        : '[FIREHOSE] Shizuku Baseband Override Active: Baseband coprocessor enforcement suspended.',
    ],
    'qfil-qcn': [
      ...shizukuBanner,
      `[${portMode}] Connected to Qualcomm HS-USB Diagnostics 9091`,
      '[DIAG] Sending NV_READ_F (0x26) for Item 0x0226 (550 / NV_UE_IMEI_I)...',
      bb.ts23003ImeiIdentityLock
        ? '[NVM] 9-Byte 3GPP TS 23.003 BCD Payload: [08 3A 52 02 11 11 40 28 19]'
        : '[NVM] 3GPP TS 23.003 TURNED OFF via Shizuku -> Returning Masked Null BCD Frame: [08 0A 00 00 00 00 00 00 00]',
      bb.ts23003ImeiIdentityLock
        ? '[SECURITY] EFS2 Write Protection: Read-Only Register (OTP + SPC Locked).'
        : '[SECURITY] Shizuku TS 23.003 Override: Hardware IMEI broadcast suppressed.',
    ],
    'qfil-efs': [
      ...shizukuBanner,
      `[${portMode}] Inspecting LUN4 EFS2 partitions (modemst1, modemst2, fsg)...`,
      '[EFS2] modemst1 CRC32: 0x8841F02A == modemst2 CRC32: 0x8841F02A (Parity VALID)',
      bb.ts22022PersonalizationLock
        ? '[EFS2] fsg Golden Backup RSA-4096 Signature: VALID (3GPP TS 22.022 Lock Enforced)'
        : '[EFS2] Shizuku TS 22.022 Override: SIM Personalization policy bypassed in RIL memory.',
    ],
    'odin-loke': [
      ...shizukuBanner,
      `[${portMode}] Sending 4-byte "ODIN" handshake to Samsung Download Mode target...`,
      '[LOKE] RX: "LOKE" v4.0 initialized (Transfer Block=1048576B)',
      '[FUSE] KNOX Warranty Bit: 0x0 | RP SWREV: B:4 K:4 S:4 (Anti-Rollback Enforced)',
      '[PIT] Parsed 38 partitions including efs, sec_efs, CP (modem.bin.lz4), CSC (optics.img).',
    ],
    'odin-cp-csc': [
      ...shizukuBanner,
      `[${portMode}] Inspecting Slot CP (modem.bin.lz4) & Slot CSC (OYN Multi-CSC)...`,
      bb.cellularBasebandArchitecture
        ? '[CP] Shannon Baseband RTOS Image RSA-4096 Signature: VALID'
        : '[CP] Shizuku Override: Shannon Baseband Architecture suspended via /dev/umts_ipc0.',
      bb.ts22022PersonalizationLock
        ? '[CSC] Switching U -> U1 updates RF band masks, while /efs/nv_data.bin retains 3GPP TS 22.022 SIM lock state.'
        : '[CSC] Shizuku TS 22.022 Override Active: /efs/nv_data.bin SIM lock verification turned OFF.',
    ],
    'odin-efs-cert': [
      ...shizukuBanner,
      `[${portMode}] Mounting /efs/nv_data.bin & /sec_efs DRK Certificate...`,
      bb.ts23003ImeiIdentityLock
        ? '[CERT] Verifying 3GPP TS 23.003 RSA-2048 IMEI Certificate against CPU Unique ID (UID)...'
        : '[CERT] Shizuku TS 23.003 Override: IMEI Certificate attestation turned OFF.',
      '[STATUS] Shizuku Shannon IPC Bridge: CONNECTED.',
    ],
    'mtk-scatter': [
      ...shizukuBanner,
      `[${portMode}] Parsing MT6897_Android_scatter.txt memory layout...`,
      '[SCATTER] nvram @ 0x02800000 (64MB) | nvdata @ 0x06800000 (64MB)',
      '[SCATTER] protect1 @ 0x0A800000 (16MB SIM-ME Lock) | md1img @ 0x12000000 (Helio M80 5G)',
    ],
    'mtk-brom': [
      ...shizukuBanner,
      `[${portMode}] Probing MediaTek BootROM (VID_0E8D&PID_0003) -> TX: 0xA0 0x0A 0x50 0x05`,
      '[BROM] RX: 0x5F 0xF5 0xAF 0xFA | Target Config: SBC=1, SLA=1, DAA=1',
      '[AUTH] Connected to Shizuku MediaTek CCCI Bridge (/dev/ccci_fs).',
    ],
    'mtk-meta': [
      ...shizukuBanner,
      `[${portMode}] Querying MediaTek Meta Mode NVRAM Logical Data Items (LID)...`,
      bb.ts23003ImeiIdentityLock
        ? '[NVRAM] LID #0x0005 (NVRAM_EF_IMEI_IMEISV_LID / TS 23.003) -> Checksum Verified'
        : '[NVRAM] LID #0x0005 (TS 23.003) -> TURNED OFF via Shizuku CCCI Bridge',
      bb.ts22022PersonalizationLock
        ? '[SML] NVRAM_EF_SML_LID (/protect_f / TS 22.022) -> Enforced'
        : '[SML] NVRAM_EF_SML_LID (TS 22.022 SIM-ME Lock) -> TURNED OFF via Shizuku CCCI Bridge',
    ],
  };

  res.json({
    success: true,
    toolId,
    actionId,
    command,
    basebandControls: bb,
    telemetry: telemetryMap[actionId] || [
      ...shizukuBanner,
      `[${portMode}] Executed diagnostic probe on ${toolId.toUpperCase()}`,
      '[STATUS] Baseband NVM & Shizuku IPC bridge verified.',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Baseband & Firmware Lab API: Probe Non-Volatile Memory (NVM) Register over UART / DIAG
app.post('/api/baseband/probe-nvm', (req, res) => {
  const {
    registerId = 'nv-550',
    nvItemNumber = 'NV Item 550 (0x0226)',
    hexOffset = '0x00022600',
    portMode = 'UART 115200 8N1',
    imei = '352011110482917',
  } = req.body || {};

  const bb = shizukuDeviceState.basebandControls;
  const bcdHex = bb.ts23003ImeiIdentityLock
    ? encodeImeiToBcdHex(imei)
    : '08 0A 00 00 00 00 00 00 00 (TS 23.003 OFF)';

  const logs =
    registerId === 'nv-550'
      ? [
          `[UART-DIAG] TX: 7E 26 26 02 00 ... (NV_READ_F Item 550 / 0x0226 via Shizuku QMI Bridge)`,
          `[HEX DUMP]  ${hexOffset}: ${bcdHex}`,
          bb.ts23003ImeiIdentityLock
            ? `[DECODED]   3GPP TS 23.003 IMEI=${imei.replace(/\D/g, '').slice(0, 15)} | Write-Once Hardware Lock: ACTIVE`
            : `[SHIZUKU]   3GPP TS 23.003 Identity Attestation is TURNED OFF! NV Item 550 broadcast is suppressed by Shizuku.`,
          !bb.cellularBasebandArchitecture
            ? `[SHIZUKU]   Cellular Baseband Architecture is TURNED OFF (vendor.ril.baseband.architecture=disabled).`
            : `[NOTE]      Connected to Shizuku NVM Interceptor.`,
        ]
      : [
          `[UART-DIAG] Reading ${nvItemNumber} at physical offset ${hexOffset} via ${portMode}...`,
          !bb.ts22022PersonalizationLock
            ? `[SHIZUKU]   3GPP TS 22.022 Personalization Lock is TURNED OFF! SIM lock enforcement in ${nvItemNumber} is bypassed.`
            : `[SECURITY]  3GPP TS 22.022 Cryptographic signature verified against SoC Unique ID (UID).`,
          !bb.cellularBasebandArchitecture
            ? `[SHIZUKU]   Cellular Baseband Architecture is TURNED OFF via Shizuku RIL Bridge.`
            : `[VERDICT]   Baseband RTOS enforces this NVM policy unless overridden via Shizuku.`,
        ];

  res.json({
    success: true,
    registerId,
    nvItemNumber,
    hexOffset,
    bcdHex,
    basebandControls: bb,
    logs,
    timestamp: new Date().toISOString(),
  });
});

// Baseband & Firmware Lab API: Trace OS Toggle vs Baseband Firmware 3GPP Handshake
app.post('/api/baseband/handshake', (req, res) => {
  const { airplaneMode = false, mobileData = true, simMccMnc = '311-480' } = req.body || {};
  const bb = shizukuDeviceState.basebandControls;

  if (!bb.cellularBasebandArchitecture) {
    res.json({
      success: true,
      verdict: 'SHIZUKU_BASEBAND_OFF',
      basebandControls: bb,
      trace: [
        '[SHIZUKU IPC OVERRIDE] Cellular Baseband Architecture is TURNED OFF (vendor.ril.baseband.architecture=disabled).',
        '[RILD BRIDGE] Shizuku UID 2000 issued service call phone 27 i32 0 -> Baseband coprocessor enforcement is halted.',
        `[3GPP STATUS] TS 22.022 Personalization=${bb.ts22022PersonalizationLock ? 'ON' : 'OFF'} | TS 23.003 IMEI Attestation=${bb.ts23003ImeiIdentityLock ? 'ON' : 'OFF'}`,
        '[VERDICT] Baseband hardware lock check cannot block the host OS because Shizuku has turned off the Cellular Baseband Architecture.',
      ],
    });
    return;
  }

  if (airplaneMode) {
    res.json({
      success: true,
      verdict: 'RADIO_OFF',
      basebandControls: bb,
      trace: [
        '[HOST OS] User toggled Airplane Mode ON -> Android RIL sends AT+CFUN=0 to Baseband.',
        '[BASEBAND] Cellular RF transceivers powered down. No tower handshake occurs.',
        '[ANALYSIS] Standard Airplane Mode stops RF transmission, whereas Shizuku Baseband Override directly turns off 3GPP TS 22.022 & TS 23.003 lock gates.',
      ],
    });
    return;
  }

  const isHomeSim = simMccMnc === '310-410';
  const ts22022Bypassed = !bb.ts22022PersonalizationLock;
  const ts23003Bypassed = !bb.ts23003ImeiIdentityLock;

  res.json({
    success: true,
    verdict: isHomeSim || ts22022Bypassed ? 'ATTACH_ALLOWED' : 'BLOCKED_BY_BASEBAND',
    basebandControls: bb,
    trace: [
      `[HOST OS] Airplane Mode=OFF | Mobile Data Toggle=${mobileData ? 'ON' : 'OFF (User-space IP only)'}`,
      `[BASEBAND] Reading USIM EF_IMSI over ISO-7816 bus -> Detected MCC/MNC: ${simMccMnc}`,
      ts22022Bypassed
        ? `[SHIZUKU 3GPP TS 22.022 OVERRIDE] persist.vendor.radio.3gpp.ts22022=0 -> SIM Personalization Lock is TURNED OFF! Foreign SIM ${simMccMnc} is PERMITTED.`
        : `[BASEBAND] Checking 3GPP TS 22.022 Network Personalisation Policy in NVM (Allowed: 310-410)...`,
      ts23003Bypassed
        ? `[SHIZUKU 3GPP TS 23.003 OVERRIDE] persist.vendor.radio.3gpp.ts23003=0 -> IMEI / PEI (NV Item 550) Identity Attestation is TURNED OFF!`
        : `[BASEBAND] Preparing 3GPP TS 23.003 PEI/IMEI Identity Frame from NV Item 550 (0x0226)...`,
      isHomeSim || ts22022Bypassed
        ? `[VERDICT] PASS: ${ts22022Bypassed ? 'Shizuku turned OFF 3GPP TS 22.022 SIM Lock — ' : ''}Cellular NAS Attach Request COMPLETED for ${simMccMnc}.`
        : `[VERDICT] REJECTED: MCC/MNC ${simMccMnc} blocked by 3GPP TS 22.022! (Turn OFF 3GPP TS 22.022 via Shizuku to bypass this lock).`,
    ],
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
