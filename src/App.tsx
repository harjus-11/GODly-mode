import React, { useState } from 'react';
import { Navbar, WORKSPACE_HUBS } from './components/Navbar.tsx';
import { BasebandFirmwareLab } from './components/BasebandFirmwareLab.tsx';
import { ImeiLookupView } from './components/ImeiLookupView.tsx';
import { ImeiMaskingView } from './components/ImeiMaskingView.tsx';
import { UnlockDatabaseView } from './components/UnlockDatabaseView.tsx';
import { SecretMenusView } from './components/SecretMenusView.tsx';
import { ShizukuNetworkManager } from './components/ShizukuNetworkManager.tsx';
import { ImeiChecker } from './components/ImeiChecker.tsx';
import { UnlockWizard } from './components/UnlockWizard.tsx';
import { LockStatusGuide } from './components/LockStatusGuide.tsx';
import { NckDecoder } from './components/NckDecoder.tsx';
import { CarrierDirectory } from './components/CarrierDirectory.tsx';
import { AiAdvisor } from './components/AiAdvisor.tsx';
import { SavingsCalculator } from './components/SavingsCalculator.tsx';
import { DialerModal } from './components/DialerModal.tsx';
import { ApkCompilerBackView } from './components/ApkCompilerBackView.tsx';
import { BootBiosSandboxManager } from './components/BootBiosSandboxManager.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('boot-bios-sandbox');
  const [wizardBrand, setWizardBrand] = useState<string>('Apple');
  const [wizardCarrier, setWizardCarrier] = useState<string>('att');
  const [isDialerModalOpen, setIsDialerModalOpen] = useState<boolean>(false);

  // Cross-view state for the Baseband & Firmware Lab
  const [labInitialTool, setLabInitialTool] = useState<'qfil' | 'odin' | 'spflash'>('qfil');
  const [labInitialModule, setLabInitialModule] = useState<
    'oem-tools' | 'nvm-uart' | 'bootrom-auth' | 'academic-specs'
  >('oem-tools');
  const [labInitialImei, setLabInitialImei] = useState<string>('352011110482917');

  const handleNavigateToWizard = (brand: string, carrier: string) => {
    setWizardBrand(brand);
    setWizardCarrier(carrier);
    setActiveTab('wizard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCodesDbFromImei = (brand: string, _model: string) => {
    setWizardBrand(brand);
    setActiveTab('codes-db');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToBasebandLab = (
    module: 'oem-tools' | 'nvm-uart' | 'bootrom-auth' | 'academic-specs' = 'oem-tools',
    tool: 'qfil' | 'odin' | 'spflash' = 'qfil',
    imei?: string
  ) => {
    setLabInitialModule(module);
    setLabInitialTool(tool);
    if (imei) setLabInitialImei(imei);
    setActiveTab('baseband-lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentHub =
    WORKSPACE_HUBS.find((hub) => hub.subTabs.some((t) => t.id === activeTab)) || WORKSPACE_HUBS[0];
  const currentSubTab =
    currentHub.subTabs.find((t) => t.id === activeTab) || currentHub.subTabs[0];

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar (3-Zone Top Bar + Contextual Hub Sub-Navigation) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDialerModal={() => setIsDialerModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Contextual Workspace Breadcrumb & Module Switcher Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span className="font-semibold text-cyan-400">{currentHub.hubLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-white">{currentSubTab.label}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="text-slate-400 hidden sm:inline">{currentSubTab.shortDesc}</span>
          </div>

          {currentHub.subTabs.length > 1 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
              <span>Related in {currentHub.hubLabel}:</span>
              <div className="flex items-center gap-1.5">
                {currentHub.subTabs.map((t, idx) => (
                  <React.Fragment key={t.id}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <button
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`cursor-pointer transition-colors ${
                        activeTab === t.id
                          ? 'text-cyan-300 font-bold underline underline-offset-4'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label.split(' ')[0]} {t.label.split(' ')[1]}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HUB 1: MODEM, SIM/eSIM CARRIER & BIOS CORE */}
        {activeTab === 'boot-bios-sandbox' && <BootBiosSandboxManager />}

        {activeTab === 'shizuku' && (
          <ShizukuNetworkManager
            onNavigateToSecretMenus={() => {
              setActiveTab('secret-menus');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToBasebandCompare={() => handleNavigateToBasebandLab('bootrom-auth', 'qfil')}
          />
        )}

        {activeTab === 'secret-menus' && (
          <SecretMenusView
            onNavigateToShizukuSetup={() => {
              setActiveTab('shizuku');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* HUB 2: BASEBAND & FIRMWARE LAB */}
        {activeTab === 'baseband-lab' && (
          <BasebandFirmwareLab
            key={`${labInitialModule}-${labInitialTool}-${labInitialImei}`}
            initialModule={labInitialModule}
            initialTool={labInitialTool}
            initialImei={labInitialImei}
          />
        )}

        {/* HUB 3: IMEI & IDENTITY LAB */}
        {activeTab === 'imei-masking' && (
          <ImeiMaskingView
            onOpenBasebandNvm={(imei) => handleNavigateToBasebandLab('nvm-uart', 'qfil', imei)}
          />
        )}

        {activeTab === 'imei-lookup' && (
          <ImeiLookupView
            onUnlockDevice={handleNavigateToCodesDbFromImei}
            onOpenDialerModal={() => setIsDialerModalOpen(true)}
            onNavigateToMasker={() => {
              setActiveTab('imei-masking');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenBasebandLab={(tool, imei) => handleNavigateToBasebandLab('oem-tools', tool, imei)}
          />
        )}

        {activeTab === 'imei' && (
          <ImeiChecker
            onSelectCarrier={(carrierId) => handleNavigateToWizard('Apple', carrierId)}
            onNavigateToWizard={handleNavigateToWizard}
          />
        )}

        {activeTab === 'check-status' && (
          <LockStatusGuide
            onNavigateToImei={() => {
              setActiveTab('imei-lookup');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToCodes={() => {
              setActiveTab('codes-db');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* HUB 4: CARRIER UNLOCK & NCK SUITE */}
        {activeTab === 'wizard' && (
          <UnlockWizard
            initialBrand={wizardBrand}
            initialCarrier={wizardCarrier}
            onNavigateToNck={() => setActiveTab('nck')}
          />
        )}

        {activeTab === 'nck' && (
          <NckDecoder
            onNavigateToWizard={() => {
              setActiveTab('wizard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToCodes={() => {
              setActiveTab('codes-db');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'codes-db' && (
          <UnlockDatabaseView
            onSelectModel={(brand) => handleNavigateToWizard(brand, 'att')}
          />
        )}

        {activeTab === 'carriers' && <CarrierDirectory />}

        {activeTab === 'advisor' && <AiAdvisor />}

        {activeTab === 'savings' && <SavingsCalculator />}

        {/* HUB 5: UNIVERSAL APK BUILDER STUDIO */}
        {activeTab === 'apk-compiler' && <ApkCompilerBackView />}
      </main>

      {/* Dialer Helper Modal */}
      <DialerModal
        isOpen={isDialerModalOpen}
        onClose={() => setIsDialerModalOpen(false)}
      />

      {/* Clean Production Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#050811] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">OmniUnlock Studio</span>
            <span aria-hidden="true">·</span>
            <span>3GPP TS 22.022 / TS 23.003 &amp; FCC/CTIA Compliant</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {WORKSPACE_HUBS.map((hub) => (
              <button
                key={hub.hubId}
                type="button"
                onClick={() => {
                  setActiveTab(hub.defaultTab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {hub.hubLabel}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNavigateToBasebandLab('academic-specs', 'qfil')}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              3GPP &amp; IEEE Citations
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

