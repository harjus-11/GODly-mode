export interface CarrierInfo {
  id: string;
  name: string;
  country: string;
  logoColor: string;
  portalUrl: string;
  portalLabel: string;
  autoUnlock: boolean;
  lockPeriodPostpaidDays: number;
  lockPeriodPrepaidDays: number;
  phoneSupport: string;
  militaryWaiver: boolean;
  notes: string[];
  androidMethod: string;
  iosMethod: string;
}

export interface ImeiAnalysisResult {
  imei: string;
  luhn: {
    valid: boolean;
    calculatedCheckDigit: number;
    actualCheckDigit: number;
  };
  tac: string;
  device: {
    brand: string;
    model: string;
    os: 'iOS' | 'Android';
  };
  policy: {
    name: string;
    country: string;
    portalUrl: string;
    portalLabel: string;
    autoUnlock: boolean;
    lockPeriodPostpaidDays: number;
    lockPeriodPrepaidDays: number;
    militaryPolicy: string;
    directNotes: string[];
  };
  eligibility: {
    status: 'Eligible' | 'Conditional' | 'Needs Payoff' | 'Invalid IMEI';
    score: number;
    method: string;
    requirements: {
      title: string;
      satisfied: boolean;
      note: string;
    }[];
    actionSteps: string[];
  };
}

export interface AiAdvisorResponse {
  success: boolean;
  source: string;
  summary: string;
  isDirectlyUnlockable: boolean;
  estimatedTime: string;
  carrierPolicyOverview?: string;
  stepByStepInstructions: string[];
  deviceSpecificNotes?: string;
  nckMckExplanation?: string;
  consumerRightsTip?: string;
  fraudWarning?: string;
  requirements?: string[];
  officialSteps?: string[];
}
