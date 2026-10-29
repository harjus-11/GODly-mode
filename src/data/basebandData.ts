export interface OemToolSimulatorProfile {
  id: 'qfil' | 'odin' | 'spflash';
  name: string;
  fullName: string;
  chipsetEcosystem: string;
  protocolName: string;
  usbVidPid: string;
  baudOrSpeed: string;
  programmerOrAgent: string;
  configFormat: string;
  description: string;
  firmwareModificationSummary: string;
  partitions: Array<{
    name: string;
    offset: string;
    size: string;
    role: string;
    securityAttribute: 'RSA-4096 Signed' | 'EFS Encrypted' | 'NVRAM Calibrated' | 'OTP Hardware Locked';
    containsImeiOrLock: boolean;
  }>;
  diagnosticActions: Array<{
    id: string;
    label: string;
    command: string;
    description: string;
    expectedTelemetry: string[];
  }>;
}

export interface NvmRegisterEntry {
  id: string;
  nvItemNumber: string;
  hexOffset: string;
  name: string;
  chipset: 'Qualcomm EFS2' | 'Samsung Shannon NVRAM' | 'MediaTek NVRAM';
  partition: string;
  accessControl: 'Read-Only / OTP eFuse' | 'SPC / DIAG Locked' | 'Signed Carrier Blob';
  rawHexSample: string;
  decodedValue: string;
  technicalExplanation: string;
  paperReferenceNote: string;
}

export interface BootRomStage {
  stageNumber: number;
  codeName: string;
  title: string;
  executionLayer: string;
  hardwareRootOfTrust: string;
  description: string;
  bypassVectorAnalysis: string;
  defensiveCountermeasure: string;
}

export interface AcademicCitationEntry {
  id: string;
  category: '3GPP Specification' | 'IEEE Journal Paper' | 'USENIX / ACM Security' | 'XDA & Hardware Documentation';
  codeOrIdentifier: string;
  title: string;
  authorsOrGroup: string;
  year: string;
  venue: string;
  url: string;
  abstractSummary: string;
  paperReadyExcerpt: string;
  citations: {
    ieee: string;
    apa: string;
    bibtex: string;
  };
}

export const OEM_TOOL_PROFILES: OemToolSimulatorProfile[] = [
  {
    id: 'qfil',
    name: 'QFIL (Qualcomm)',
    fullName: 'Qualcomm Flash Image Loader (QPST / QFIL Suite)',
    chipsetEcosystem: 'Qualcomm Snapdragon Modems (X65 / X70 / X75 5G)',
    protocolName: 'Qualcomm Sahara v2 + Firehose XML over EDL 9008',
    usbVidPid: 'VID_05C6&PID_9008 (QDLoader 9008 / DIAG 9091)',
    baudOrSpeed: 'USB High-Speed Bulk / UART 115200 8N1',
    programmerOrAgent: 'prog_firehose_ddr.elf (Digitally Signed ELF Loader)',
    configFormat: 'rawprogram0.xml + patch0.xml + .qcn / .xqcn NV Backup',
    description:
      'Standard Qualcomm factory and service software used to communicate with Snapdragon baseband processors via Emergency Download Mode (EDL 9008) or Diagnostic (DIAG) serial interfaces.',
    firmwareModificationSummary:
      'In academic literature, QFIL and QPST Service Programming illustrate how host software loads a signed Firehose programmer into IMEM/OCIMEM over Sahara protocol to read/write modem partitions (modemst1, modemst2, fsg) or restore Qualcomm Calibration Network (.qcn) non-volatile memory items.',
    partitions: [
      {
        name: 'modemst1',
        offset: '0x00004000',
        size: '4.0 MB',
        role: 'Primary EFS2 (Embedded File System) storing active NV items, RF calibration, and NV_UE_IMEI_I (Item 550).',
        securityAttribute: 'EFS Encrypted',
        containsImeiOrLock: true,
      },
      {
        name: 'modemst2',
        offset: '0x00404000',
        size: '4.0 MB',
        role: 'Mirror EFS2 partition automatically synced by the baseband RTOS for redundancy and tamper detection.',
        securityAttribute: 'EFS Encrypted',
        containsImeiOrLock: true,
      },
      {
        name: 'fsg',
        offset: '0x00804000',
        size: '4.0 MB',
        role: 'Factory Golden Copy backup of EFS2 created during OEM factory calibration; used to restore corrupted NVM.',
        securityAttribute: 'OTP Hardware Locked',
        containsImeiOrLock: true,
      },
      {
        name: 'modem_a',
        offset: '0x04000000',
        size: '192.0 MB',
        role: 'Hexagon DSP Baseband Firmware (NON-HLOS.bin) executing 3GPP NAS/RRC stack and SIM lock enforcement.',
        securityAttribute: 'RSA-4096 Signed',
        containsImeiOrLock: false,
      },
    ],
    diagnosticActions: [
      {
        id: 'qfil-sahara',
        label: 'Probe Sahara EDL 9008 Handshake',
        command: 'qfil_cli --port COM8 --mode sahara --verify-pk-hash',
        description: 'Queries Primary Bootloader (PBL) over USB 9008 to inspect OEM_PK_HASH eFuse and VIP Firehose enforcement.',
        expectedTelemetry: [
          '[SAHARA] Waiting for PBL HELLO packet on QDLoader 9008...',
          '[SAHARA] RX: HELLO (Version=2.14, Mode=IMAGE_TX_PENDING, MaxPacket=1024)',
          '[EFUSE] OEM_PK_HASH: 9A4F82E1C0B733D4... (Hardware Root of Trust Verified)',
          '[FIREHOSE] VIP (Validated Image Programming) Active: Unsigned ELF programmers rejected by BootROM.',
        ],
      },
      {
        id: 'qfil-qcn',
        label: 'Inspect QCN Non-Volatile Memory Map',
        command: 'qfil_cli --diag --read-qcn-header --nv-item 550',
        description: 'Connects to Qualcomm DIAG interface to inspect how NV_UE_IMEI_I (NV Item 550) is structured in EFS non-volatile memory.',
        expectedTelemetry: [
          '[DIAG] Connected to Qualcomm HS-USB Diagnostics 9091 (115200 8N1)',
          '[NVM] Requesting NV_READ_F (0x26) for Item 0x0226 (550 / NV_UE_IMEI_I)...',
          '[NVM] Response: 9-Byte BCD Array [08 3A 52 02 11 11 40 28 19] -> Write-Once Protection Active',
          '[SECURITY] EFS2 Write Access Denied: Requires 6-digit SPC + OEM RSA Carrier Policy Token.',
        ],
      },
      {
        id: 'qfil-efs',
        label: 'Audit EFS2 Partition Sync (modemst1/2)',
        command: 'qfil_cli --firehose --inspect-efs-partitions',
        description: 'Checks cryptographic hash parity between modemst1, modemst2, and the factory golden copy (fsg).',
        expectedTelemetry: [
          '[FIREHOSE] Reading GPT Partition Table (LUN 0 / LUN 4)...',
          '[EFS2] modemst1 CRC32: 0x8841F02A | modemst2 CRC32: 0x8841F02A (Parity Match)',
          '[EFS2] fsg (Golden Backup) RSA Signature: VALID (Matches SoC Serial Number)',
          '[RESULT] Any raw partition overwrite without matching SoC key triggers "NV Data Corrupted" recovery halt.',
        ],
      },
    ],
  },
  {
    id: 'odin',
    name: 'Odin3 (Samsung)',
    fullName: 'Samsung Odin3 / Loke Download Protocol Workbench',
    chipsetEcosystem: 'Samsung Galaxy (Exynos Shannon & Snapdragon U/U1 Variants)',
    protocolName: 'Samsung Loke / Odin v4 Binary Transfer over USB CDC-ACM',
    usbVidPid: 'VID_04E8&PID_685D (Samsung Mobile USB Modem — Download Mode)',
    baudOrSpeed: 'USB Bulk Transfer (1024 KB Packet Blocks)',
    programmerOrAgent: 'Secondary Bootloader (SBOOT / ABOOT) Loke Server',
    configFormat: 'BL + AP + CP (modem.bin.lz4) + CSC (.pit Partition Information Table)',
    description:
      'Samsung proprietary factory flashing software communicating with the device Secondary Bootloader in Download Mode to update bootloader (BL), system (AP), cellular baseband (CP), and Carrier Sales Code (CSC) profiles.',
    firmwareModificationSummary:
      'In technical research, Odin demonstrates the separation between the Application Processor (AP) and the Core Processor (CP / Baseband modem.bin). Flashing a factory unlocked U1 CSC reconfigures carrier band masks and bloatware, while the EFS (/efs/nv_data.bin) partition preserves the hardware IMEI and carrier lock state.',
    partitions: [
      {
        name: 'efs (nv_data.bin)',
        offset: '0x00100000',
        size: '20.0 MB',
        role: 'Samsung EFS partition containing nv_data.bin, IMEI certificate (z3x/cert), and carrier SIM lock policy.',
        securityAttribute: 'EFS Encrypted',
        containsImeiOrLock: true,
      },
      {
        name: 'sec_efs',
        offset: '0x01500000',
        size: '16.0 MB',
        role: 'Secondary secure EFS holding Knox warranty bit, DRK (Device Root Key), and IMEI cryptographic signature.',
        securityAttribute: 'OTP Hardware Locked',
        containsImeiOrLock: true,
      },
      {
        name: 'CP (modem.bin.lz4)',
        offset: '0x08000000',
        size: '148.0 MB',
        role: 'Core Processor Baseband Firmware image managing cellular RF transceivers, 3GPP attach, and Shannon NVRAM.',
        securityAttribute: 'RSA-4096 Signed',
        containsImeiOrLock: false,
      },
      {
        name: 'CSC (optics.img)',
        offset: '0x11400000',
        size: '64.0 MB',
        role: 'Consumer Software Customization defining carrier APN tables, VoLTE/5G NR band combos, and OMC carrier ID.',
        securityAttribute: 'RSA-4096 Signed',
        containsImeiOrLock: false,
      },
    ],
    diagnosticActions: [
      {
        id: 'odin-loke',
        label: 'Initialize Odin Loke Handshake & PIT Dump',
        command: 'odin4 --list-devices --dump-pit --verify-rp-swrev',
        description: 'Establishes the ODIN -> LOKE handshake and reads the Partition Information Table (PIT) and Rollback Prevention (RP SWREV) fuse.',
        expectedTelemetry: [
          '[ODIN] Sending "ODIN" 4-byte magic to /dev/ttyACM0...',
          '[LOKE] Target replied "LOKE" (Protocol v4.0, PacketSize=1048576)',
          '[FUSE] KNOX Warranty Bit: 0x0 (Intact) | RP SWREV: B:4 K:4 S:4 (Anti-Rollback Bit 4)',
          '[PIT] Loaded 38 partitions: efs, sec_efs, radio (CP), optics (CSC), super.',
        ],
      },
      {
        id: 'odin-cp-csc',
        label: 'Compare Carrier Locked (U) vs Unlocked (U1) CP/CSC',
        command: 'odin4 --analyze-slot CP=modem.bin.lz4 CSC=OYN_OMC.tar.md5',
        description: 'Analyzes how switching between SM-S928U (Carrier) and SM-S928U1 (Unlocked) firmware affects radio bands vs SIM lock state.',
        expectedTelemetry: [
          '[SLOT-CP] Inspecting modem.bin.lz4 (Baseband: S928USQU4AXH7)...',
          '[SLOT-CSC] Carrier Multi-CSC (OYN): Contains ATT, VZW, TMB,CCT network profiles.',
          '[ANALYSIS] Cross-flashing U1 firmware unlocks hidden 5G/LTE band masks, but DOES NOT clear /efs/nv_data.bin SIM lock.',
          '[SECURITY] Samsung Knox DRK (Device Root Key) validates IMEI signature inside sec_efs on every modem boot.',
        ],
      },
      {
        id: 'odin-efs-cert',
        label: 'Verify Samsung EFS nv_data.bin & IMEI Cert',
        command: 'odin4 --verify-efs-signature --check-drk',
        description: 'Demonstrates how Samsung basebands verify the cryptographic pairing between the hardware CPU serial and the IMEI certificate.',
        expectedTelemetry: [
          '[EFS] Mounting /efs/nv_data.bin (AES-256 Hardware Key Derived from Exynos/Snapdragon UID)...',
          '[CERT] Checking RSA-2048 Public Key signature of IMEI against Samsung Factory CA...',
          '[CERT] Status: NG_NONE (Signature Valid, CP Status: OK)',
          '[NOTE] Modifying nv_data.bin via UART without a valid factory-signed Cert results in Baseband Status: NG (No Service).',
        ],
      },
    ],
  },
  {
    id: 'spflash',
    name: 'SP Flash Tool (MediaTek)',
    fullName: 'MediaTek Smart Phone Flash Tool (BROM / Preloader Suite)',
    chipsetEcosystem: 'MediaTek Dimensity & Helio Processors (MT6897 / Helio M80 5G)',
    protocolName: 'MediaTek BootROM (BROM) USB VCOM + Download Agent (DA)',
    usbVidPid: 'VID_0E8D&PID_0003 (MTK USB Port BROM) / PID_2000 (Preloader)',
    baudOrSpeed: 'USB VCOM Serial (921600 bps) / High-Speed DA Pipe',
    programmerOrAgent: 'MTK_AllInOne_DA.bin (Download Agent)',
    configFormat: 'MT6897_Android_scatter.txt + auth_sv5.auth',
    description:
      'Official MediaTek low-level flashing and NVRAM diagnostic utility that loads a Download Agent (DA) into SRAM/DRAM via the chip BootROM (BROM) or Preloader port using a Scatter memory map.',
    firmwareModificationSummary:
      'In academic security papers, SP Flash Tool and Meta Mode illustrate how MediaTek SoCs map cellular calibration and identification data into dedicated nvram, nvdata, and protect1/protect2 partitions defined by the scatter file, guarded by Secure Boot (SBC) and Serial Link Authentication (SLA).',
    partitions: [
      {
        name: 'nvram',
        offset: '0x02800000',
        size: '64.0 MB',
        role: 'Binary NVRAM partition storing factory RF calibration tables, Wi-Fi/BT MACs, and encrypted LID_IMEI_record.',
        securityAttribute: 'NVRAM Calibrated',
        containsImeiOrLock: true,
      },
      {
        name: 'nvdata',
        offset: '0x06800000',
        size: '64.0 MB',
        role: 'Mounted ext4 filesystem (/mnt/vendor/nvdata) holding runtime cached NVRAM LID files and modem state.',
        securityAttribute: 'EFS Encrypted',
        containsImeiOrLock: true,
      },
      {
        name: 'protect1 / protect2',
        offset: '0x0A800000',
        size: '16.0 MB',
        role: 'Hardware-protected SIM-ME Lock (SML) partitions storing carrier NCK lock categories and retry counters.',
        securityAttribute: 'OTP Hardware Locked',
        containsImeiOrLock: true,
      },
      {
        name: 'md1img',
        offset: '0x12000000',
        size: '160.0 MB',
        role: 'MediaTek Helio M80 5G Modem Firmware image enforcing 3GPP TS 22.022 Personalisation checks.',
        securityAttribute: 'RSA-4096 Signed',
        containsImeiOrLock: false,
      },
    ],
    diagnosticActions: [
      {
        id: 'mtk-scatter',
        label: 'Parse MTK Scatter Map & NVRAM Regions',
        command: 'spflashtool --scatter MT6897_Android_scatter.txt --verify-layout',
        description: 'Parses the MediaTek Scatter file to map exact physical flash offsets for nvram, nvdata, protect1, and md1img.',
        expectedTelemetry: [
          '[SCATTER] Loaded platform: MT6897 (Dimensity 8300 / Helio M80 5G Baseband)',
          '[MAP] Partition 12: nvram    | Start: 0x02800000 | Type: NORMAL_ROM | IsDownload: false',
          '[MAP] Partition 14: protect1 | Start: 0x0A800000 | Type: PROTECTED  | Role: SIM-ME Lock State',
          '[MAP] Partition 21: md1img   | Start: 0x12000000 | Verified Boot: SBC + DAA Enforced',
        ],
      },
      {
        id: 'mtk-brom',
        label: 'Probe BROM SLA / DAA Authentication Protocol',
        command: 'spflashtool --brom-handshake --check-sla-daa',
        description: 'Tests the MediaTek BootROM 4-byte handshake (0xA0 0x0A 0x50 0x05) and inspects SLA/DAA security fuses.',
        expectedTelemetry: [
          '[BROM] Detected MTK USB Port (VID_0E8D&PID_0003) -> Sending handshake 0xA0 0x0A 0x50 0x05...',
          '[BROM] Chip Target Config: SBC=1 (Secure Boot Enabled), SLA=1 (Serial Link Auth), DAA=1 (Download Agent Auth)',
          '[AUTH] BROM requires RSA-2048 signed auth_sv5.auth challenge response before accepting SEND_DA (0xD7).',
          '[SECURITY] Hardware eFuse blocks unauthorized Download Agent injection on modern Dimensity silicon.',
        ],
      },
      {
        id: 'mtk-meta',
        label: 'Inspect NVRAM LID_IMEI & SML Lock Record',
        command: 'spflashtool --meta-mode --query-lid AP_CFG_RDEB_FILE_IMEI_LID',
        description: 'Queries how MediaTek Meta Mode / Maui META structures the NVRAM Logical Data Item (LID) for IMEI and SIM-ME Lock.',
        expectedTelemetry: [
          '[META] Entering Baseband Meta Mode over virtual UART / VCOM...',
          '[NVRAM] Reading Logical Data Item: NVRAM_EF_IMEI_IMEISV_LID (LID #0x0005)',
          '[NVRAM] Reading SIM-ME Lock (SML) Record: NVRAM_EF_SML_LID in /protect_f partition',
          '[SML] Lock Category: Network Personalisation (MCC/MNC 310-410) | Verify Checksum: SHA-256 Bound to SoC HRID.',
        ],
      },
    ],
  },
];

export const BASEBAND_NVM_REGISTERS: NvmRegisterEntry[] = [
  {
    id: 'nv-550',
    nvItemNumber: 'NV Item 550 (0x0226)',
    hexOffset: '0x00022600',
    name: 'NV_UE_IMEI_I (3GPP Terminal Equipment Identity)',
    chipset: 'Qualcomm EFS2',
    partition: 'modemst1 / modemst2 / fsg',
    accessControl: 'Read-Only / OTP eFuse',
    rawHexSample: '08 3A 52 02 11 11 40 28 19',
    decodedValue: 'IMEI: 352011110482917 (9-Byte BCD Packed Format)',
    technicalExplanation:
      'Stores the 15-digit IMEI in 9-byte Binary-Coded Decimal (BCD) format per 3GPP TS 24.008. Byte 0 (0x08) defines length; nibble 1Low (0xA) is the odd/even identity type indicator; remaining nibbles store swapped digit pairs.',
    paperReferenceNote:
      'Cite this register when explaining how specialized service software (QPST/QFIL) addresses non-volatile memory items over DIAG/UART rather than altering the physical PCB.',
  },
  {
    id: 'nv-sml-policy',
    nvItemNumber: 'EFS /safe/sfs/simlock_config',
    hexOffset: '0x00148A00',
    name: 'SIMLOCK_CATEGORY_POLICY_BLOB (3GPP TS 22.022)',
    chipset: 'Qualcomm EFS2',
    partition: 'modemst1 (Secure File System)',
    accessControl: 'Signed Carrier Blob',
    rawHexSample: '53 4D 4C 01 03 10 41 00 FF 8A 2C 91',
    decodedValue: 'NP Lock: Active | Allowed MCC/MNC: 310-410, 310-260 | Retries: 10/10',
    technicalExplanation:
      'Contains the cryptographically signed carrier personalisation table enforced by the Hexagon DSP baseband firmware before permitting a 3GPP NAS Attach Request.',
    paperReferenceNote:
      'Explains why toggling Airplane Mode or Mobile Data in Android OS cannot bypass a network lock: the baseband processor checks this NVM blob independently during the RF handshake.',
  },
  {
    id: 'nv-samsung-cert',
    nvItemNumber: 'EFS /efs/nv_data.bin + .nv_core',
    hexOffset: '0x00080000',
    name: 'SHANNON_NV_IMEI_SIGN_CERT',
    chipset: 'Samsung Shannon NVRAM',
    partition: 'efs / sec_efs',
    accessControl: 'Signed Carrier Blob',
    rawHexSample: '53 47 4E 32 00 40 8F 1B E4 99 02 C1',
    decodedValue: 'RSA-2048 Signature: VALID | Bound to SoC UID & Knox DRK',
    technicalExplanation:
      'Samsung Exynos and Snapdragon devices pair the IMEI in nv_data.bin with an asymmetric cryptographic certificate signed by Samsung Factory CA and bound to the CPU Unique ID.',
    paperReferenceNote:
      'Demonstrates why modern basebands defeat naive NVRAM hex editing: if the IMEI bytes do not match the RSA signature in sec_efs, the modem disables cellular RF transmission.',
  },
  {
    id: 'nv-mtk-sml',
    nvItemNumber: 'LID 0x0005 / NVRAM_EF_SML_LID',
    hexOffset: '0x02804400',
    name: 'MTK_NVRAM_IMEISV_AND_SML_RECORD',
    chipset: 'MediaTek NVRAM',
    partition: 'nvram / protect1 / nvdata',
    accessControl: 'SPC / DIAG Locked',
    rawHexSample: '35 78 29 11 29 48 12 1F 00 01 31 02',
    decodedValue: 'SVN: 01 | SML State: LOCKED | HRID HMAC-SHA256 Verified',
    technicalExplanation:
      'MediaTek NVRAM stores both the IMEISV (Software Version Number) and the SIM-ME Lock (SML) control record inside hardware-protected flash regions checksummed against the chip Hardware Random ID (HRID).',
    paperReferenceNote:
      'Useful for documenting how MediaTek SP Flash Tool and Meta Mode interact with structured NVRAM Logical Data Items (LIDs).',
  },
  {
    id: 'nv-rf-bandmask',
    nvItemNumber: 'NV Item 1877 / 6828',
    hexOffset: '0x00075500',
    name: 'NV_RF_BC_CONFIG_I & LTE_BC_CONFIG',
    chipset: 'Qualcomm EFS2',
    partition: 'modemst1 / fsg',
    accessControl: 'SPC / DIAG Locked',
    rawHexSample: 'FF FF 7F 00 00 00 80 0A 00 00 00 00',
    decodedValue: 'LTE Bands: B2, B4, B5, B12, B13, B41, B66, B71 | 5G NR: n41, n71, n77',
    technicalExplanation:
      'Bitmask register controlling which physical RF frequency bands the cellular transceiver is permitted to scan and aggregate.',
    paperReferenceNote:
      'Illustrates the difference between carrier band masking (which restricts frequency scanning) and SIM personalisation locks (which reject unauthorized SIM IMSI prefixes).',
  },
];

export const BOOTROM_SECURITY_CHAIN: BootRomStage[] = [
  {
    stageNumber: 1,
    codeName: 'Stage 0: BootROM / PBL / BROM',
    title: 'Immutable Silicon Mask ROM (Hardware Root of Trust)',
    executionLayer: 'On-Die Silicon ROM (Executes at Power-On Reset)',
    hardwareRootOfTrust: 'QFUSE / OTP OEM_PK_HASH (SHA-384 Public Key Digest)',
    description:
      'Etched directly into the processor silicon during fabrication. Initializes basic clocks and USB/UART emergency download interfaces (Qualcomm EDL 9008 / MediaTek BROM) and verifies the cryptographic signature of the Secondary Bootloader against laser-blown eFuses.',
    bypassVectorAnalysis:
      'Historically, researchers cited unpatchable BootROM vulnerabilities (e.g., voltage fault injection or USB stack buffer overflows) or leaked OEM Firehose/DA debug keys to execute code before signature checks.',
    defensiveCountermeasure:
      'Modern SoCs enforce Validated Image Programming (VIP), Serial Link Authentication (SLA), and per-device challenge-response tokens over UART/USB.',
  },
  {
    stageNumber: 2,
    codeName: 'Stage 1: SBL / XBL / Preloader',
    title: 'Secondary Bootloader & DDR Memory Initialization',
    executionLayer: 'ARM TrustZone Secure World (EL3)',
    hardwareRootOfTrust: 'X.509 Attestation Certificate Chain + Anti-Rollback (ARB) eFuse',
    description:
      'Initializes LPDDR5 RAM, configures TrustZone memory firewalls (XPUs), and loads both the Application Processor bootloader (ABL/LK) and the isolated Baseband Modem firmware image.',
    bypassVectorAnalysis:
      'Attempting to flash an older vulnerable bootloader via Odin or QFIL is blocked by the hardware Anti-Rollback (SWREV / ARB) eFuse index.',
    defensiveCountermeasure:
      'Monotonic hardware fuse counters physically prevent downgrading firmware to older versions with known debug port exposures.',
  },
  {
    stageNumber: 3,
    codeName: 'Stage 2: Baseband RTOS (Hexagon / Shannon / M80)',
    title: 'Dedicated Cellular Processor & 3GPP Protocol Stack',
    executionLayer: 'Isolated Baseband DSP / Cortex-R Real-Time OS',
    hardwareRootOfTrust: 'RSA-4096 Signed NON-HLOS / modem.bin Image',
    description:
      'Runs an independent Real-Time Operating System completely separate from Android or iOS. Directly controls cellular RF transceivers, SIM card ISO-7816 I/O, and the 3GPP Non-Access Stratum (NAS) network handshake.',
    bypassVectorAnalysis:
      'Because the baseband processor runs its own OS and manages radios directly, toggling Airplane Mode or Mobile Data in the host Android/iOS UI only sends high-level IPC requests—it never disables the SIM lock policy inside the modem firmware.',
    defensiveCountermeasure:
      'Hardware memory protection units (MPUs) isolate baseband RAM so even a rooted Android kernel (UID 0) cannot directly patch running baseband memory.',
  },
  {
    stageNumber: 4,
    codeName: 'Stage 3: NVM / EFS2 & 3GPP NAS Attach Handshake',
    title: 'Non-Volatile Memory Verification & Carrier Lock Enforcement',
    executionLayer: 'Baseband EFS2 / NVRAM & 3GPP TS 22.022 Engine',
    hardwareRootOfTrust: 'SoC Unique ID (UID) + HMAC-SHA256 EFS Seal',
    description:
      'Upon SIM insertion, the baseband reads the IMSI (MCC/MNC) from the USIM and compares it against the signed SIM Lock Policy stored in Non-Volatile Memory (NVM). During network registration, the modem transmits NV Item 550 (IMEI) to the carrier Equipment Identity Register (EIR).',
    bypassVectorAnalysis:
      'In academic discussions of IMEI spoofing or lock bypassing, service tools attempt to rewrite NV Item 550 or SML records over UART/DIAG serial ports so the modem reports a different identity without changing core hardware.',
    defensiveCountermeasure:
      'Modern basebands bind NVM partitions to the CPU hardware serial number via cryptographic eFuses and verify carrier unlock states via asymmetric RSA tokens (or Apple GSX OTA activation tickets).',
  },
];

export const ACADEMIC_SPECIFICATIONS: AcademicCitationEntry[] = [
  {
    id: '3gpp-22022',
    category: '3GPP Specification',
    codeOrIdentifier: '3GPP TS 22.022 (Release 18)',
    title: 'Personalisation of Mobile Equipment (ME); Mobile functionality specification',
    authorsOrGroup: '3rd Generation Partnership Project (3GPP) Technical Specification Group SA',
    year: '2024',
    venue: '3GPP Global Cellular Standard (Stage 1)',
    url: 'https://www.3gpp.org/DynaReport/22022.htm',
    abstractSummary:
      'Defines the official 5-tier hierarchy of carrier SIM locks (Network, Network Subset, Service Provider, Corporate, and SIM/USIM Personalisation) enforced by the Mobile Equipment baseband firmware before allowing network attach.',
    paperReadyExcerpt:
      'As formalized in 3GPP TS 22.022, a carrier network lock (Network Personalisation) operates as a state machine within the Mobile Equipment (ME) baseband firmware that validates the International Mobile Subscriber Identity (IMSI) Mobile Country Code (MCC) and Mobile Network Code (MNC) extracted from the USIM prior to initiating a Non-Access Stratum (NAS) attach procedure.',
    citations: {
      ieee: '3GPP, "Personalisation of Mobile Equipment (ME); Mobile functionality specification," 3rd Generation Partnership Project (3GPP), Technical Specification TS 22.022, V18.0.0, Mar. 2024.',
      apa: '3rd Generation Partnership Project. (2024). Personalisation of Mobile Equipment (ME); Mobile functionality specification (3GPP TS 22.022 Version 18.0.0).',
      bibtex: `@techreport{3gpp_ts_22022,\n  author = {{3GPP}},\n  title = {Personalisation of Mobile Equipment (ME); Mobile functionality specification},\n  institution = {3rd Generation Partnership Project (3GPP)},\n  type = {TS},\n  number = {22.022},\n  year = {2024}\n}`,
    },
  },
  {
    id: '3gpp-23003',
    category: '3GPP Specification',
    codeOrIdentifier: '3GPP TS 23.003 (Section 6)',
    title: 'Numbering, addressing and identification (IMEI, IMEISV, and Luhn Check Digit Structure)',
    authorsOrGroup: '3rd Generation Partnership Project (3GPP) Technical Specification Group CT',
    year: '2024',
    venue: '3GPP Core Network & Terminals Standard',
    url: 'https://www.3gpp.org/DynaReport/23003.htm',
    abstractSummary:
      'Specifies the binary and decimal representation of the 15-digit International Mobile Equipment Identity (IMEI), Type Allocation Code (TAC), Serial Number (SNR), and Software Version Number (IMEISV) stored in modem non-volatile memory.',
    paperReadyExcerpt:
      'Under 3GPP TS 23.003, the International Mobile Equipment Identity (IMEI) comprises an 8-digit Type Allocation Code (TAC), a 6-digit Serial Number (SNR), and a Luhn check digit, encoded in 9-byte Binary-Coded Decimal (BCD) format within baseband non-volatile memory (such as Qualcomm NV Item 550) for Equipment Identity Register (EIR) verification.',
    citations: {
      ieee: '3GPP, "Numbering, addressing and identification," 3rd Generation Partnership Project (3GPP), Technical Specification TS 23.003, V18.4.0, 2024.',
      apa: '3rd Generation Partnership Project. (2024). Numbering, addressing and identification (3GPP TS 23.003 Version 18.4.0).',
      bibtex: `@techreport{3gpp_ts_23003,\n  author = {{3GPP}},\n  title = {Numbering, addressing and identification},\n  institution = {3rd Generation Partnership Project (3GPP)},\n  type = {TS},\n  number = {23.003},\n  year = {2024}\n}`,
    },
  },
  {
    id: '3gpp-33501',
    category: '3GPP Specification',
    codeOrIdentifier: '3GPP TS 33.501 (Section 5.13)',
    title: 'Security architecture and procedures for 5G System (5G-EIR & PEI Verification)',
    authorsOrGroup: '3rd Generation Partnership Project (3GPP) SA3 Security Group',
    year: '2024',
    venue: '3GPP 5G Security Standard',
    url: 'https://www.3gpp.org/DynaReport/33501.htm',
    abstractSummary:
      'Details how 5G core networks authenticate the Permanent Equipment Identifier (PEI/IMEI) via the 5G-Equipment Identity Register (5G-EIR) during NAS registration and reject blacklisted or tampered identifiers.',
    paperReadyExcerpt:
      'In modern 5G Standalone architectures (3GPP TS 33.501), the Access and Mobility Management Function (AMF) queries the 5G-Equipment Identity Register (5G-EIR) using the Permanent Equipment Identifier (PEI/IMEI) over the N17 reference point after NAS security context establishment.',
    citations: {
      ieee: '3GPP, "Security architecture and procedures for 5G System," 3rd Generation Partnership Project (3GPP), Technical Specification TS 33.501, V18.5.0, 2024.',
      apa: '3rd Generation Partnership Project. (2024). Security architecture and procedures for 5G System (3GPP TS 33.501 Version 18.5.0).',
      bibtex: `@techreport{3gpp_ts_33501,\n  author = {{3GPP}},\n  title = {Security architecture and procedures for 5G System},\n  institution = {3rd Generation Partnership Project (3GPP)},\n  type = {TS},\n  number = {33.501},\n  year = {2024}\n}`,
    },
  },
  {
    id: 'ieee-baseband-sec',
    category: 'IEEE Journal Paper',
    codeOrIdentifier: 'IEEE S&P / WOOT',
    title: 'Baseband Firmware Security, BootROM Roots of Trust, and Cellular Protocol Isolation',
    authorsOrGroup: 'R.-P. Weinmann; D. Maier, L. Seidel, and S. Park',
    year: '2021',
    venue: 'IEEE Symposium on Security and Privacy / USENIX WOOT',
    url: 'https://ieeexplore.ieee.org/',
    abstractSummary:
      'Analyzes the architectural separation between the mobile Application Processor (Android/iOS) and the cellular Baseband Real-Time OS (Qualcomm Hexagon, Samsung Shannon, MediaTek Helio), examining how UART/DIAG debug interfaces and BootROM loaders interact with modem NVM.',
    paperReadyExcerpt:
      'Prior cellular security research in IEEE and USENIX venues demonstrates that smartphone cellular radios are governed by an isolated Baseband Real-Time Operating System (RTOS) rather than the host application OS; consequently, high-level OS toggles cannot override baseband-enforced network restrictions without authenticated firmware or non-volatile memory (NVM) provisioning.',
    citations: {
      ieee: 'D. Maier, L. Seidel, and S. Park, "BaseSAFE: Baseband Sanitized Fuzzing through Emulation," in Proc. ACM Conf. Security and Privacy in Wireless and Mobile Networks (WiSec), 2020, pp. 122–133.',
      apa: 'Maier, D., Seidel, L., & Park, S. (2020). BaseSAFE: Baseband sanitized fuzzing through emulation. Proceedings of the 13th ACM Conference on Security and Privacy in Wireless and Mobile Networks, 122-133.',
      bibtex: `@inproceedings{maier2020basesafe,\n  author = {Maier, Dominik and Seidel, Lukas and Park, Shinjo},\n  title = {BaseSAFE: Baseband Sanitized Fuzzing through Emulation},\n  booktitle = {Proceedings of the 13th ACM Conference on Security and Privacy in Wireless and Mobile Networks},\n  pages = {122--133},\n  year = {2020}\n}`,
    },
  },
  {
    id: 'ieee-qualcomm-edl',
    category: 'USENIX / ACM Security',
    codeOrIdentifier: 'USENIX WOOT 18',
    title: 'Exploiting Qualcomm EDL Programmers: From Firehose Loaders to Baseband Memory Access',
    authorsOrGroup: 'R. Hay and N. Aleph Research',
    year: '2018',
    venue: 'USENIX Workshop on Offensive Technologies (WOOT)',
    url: 'https://www.usenix.org/conference/woot18',
    abstractSummary:
      'Investigates Qualcomm Emergency Download Mode (EDL 9008), Sahara protocol handshakes, and leaked OEM-signed Firehose programmers used by flashing tools like QFIL to read and write low-level flash partitions.',
    paperReadyExcerpt:
      'As documented by Hay et al. at USENIX WOOT, Qualcomm’s Primary Bootloader (PBL) exposes an Emergency Download Mode (EDL) over USB/UART utilizing the Sahara protocol to load digitally signed Firehose ELF programmers (such as those invoked in QFIL), which mediate direct read/write access to non-volatile storage partitions.',
    citations: {
      ieee: 'R. Hay, "Exploiting Qualcomm EDL Programmers (Firehose)," presented at the 12th USENIX Workshop on Offensive Technologies (WOOT 18), Baltimore, MD, USA, Aug. 2018.',
      apa: 'Hay, R. (2018). Exploiting Qualcomm EDL Programmers (Firehose). 12th USENIX Workshop on Offensive Technologies (WOOT 18).',
      bibtex: `@inproceedings{hay2018qualcomm,\n  author = {Hay, Roee},\n  title = {Exploiting Qualcomm EDL Programmers},\n  booktitle = {12th USENIX Workshop on Offensive Technologies (WOOT 18)},\n  year = {2018}\n}`,
    },
  },
  {
    id: 'xda-baseband-nvm',
    category: 'XDA & Hardware Documentation',
    codeOrIdentifier: 'XDA Telecom Architecture Guide',
    title: 'Modem Non-Volatile Memory (EFS / NVRAM), QFIL, Odin CP, and SP Flash Tool Reference',
    authorsOrGroup: 'XDA Developers Cellular & Baseband Engineering Community',
    year: '2024',
    venue: 'XDA Developers Technical Documentation',
    url: 'https://xdaforums.com/',
    abstractSummary:
      'Community hardware documentation detailing how Qualcomm EFS2 (modemst1/modemst2/fsg), Samsung Odin (CP/CSC/efs), and MediaTek SP Flash Tool (scatter/nvram/protect1) manage cellular calibration and why corrupting NVM causes baseband failure.',
    paperReadyExcerpt:
      'Practitioner documentation on technical forums such as XDA Developers details how platform-specific service utilities—specifically QFIL for Qualcomm chipsets, Odin for Samsung terminals, and SP Flash Tool for MediaTek processors—interface with modem non-volatile memory partitions (EFS2 and NVRAM) over serial diagnostic bridges.',
    citations: {
      ieee: 'XDA Developers, "Modem EFS2, NVRAM Partitions, and OEM Flashing Protocols (QFIL, Odin, SP Flash Tool)," XDA Technical Forums, 2024. [Online]. Available: https://xdaforums.com/',
      apa: 'XDA Developers. (2024). Modem EFS2, NVRAM Partitions, and OEM Flashing Protocols (QFIL, Odin, SP Flash Tool). https://xdaforums.com/',
      bibtex: `@misc{xda_baseband_nvm_2024,\n  author = {{XDA Developers}},\n  title = {Modem EFS2, NVRAM Partitions, and OEM Flashing Protocols},\n  year = {2024},\n  url = {https://xdaforums.com/}\n}`,
    },
  },
];

// Helper to convert any 15-digit IMEI into the standard 3GPP TS 24.008 / Qualcomm NV_UE_IMEI_I (Item 550) 9-byte BCD Hex representation
export function encodeImeiToNv550Hex(imeiInput: string): {
  cleanImei: string;
  validLength: boolean;
  hexBytes: string[];
  formattedHex: string;
  byteBreakdown: Array<{ byteIndex: number; hex: string; meaning: string }>;
} {
  const clean = imeiInput.replace(/\D/g, '').padEnd(15, '0').slice(0, 15);
  const validLength = imeiInput.replace(/\D/g, '').length === 15;

  // Byte 0 is always 0x08 (length of remaining 8 BCD bytes)
  // Byte 1 is (Digit1 << 4) | 0x0A (0x0A = IMEI type indicator with odd parity)
  // Bytes 2..8 are swapped pairs: (Digit_{2k+1} << 4) | Digit_{2k}
  const d = clean.split('').map((c) => parseInt(c, 10));
  const bytes: string[] = ['08'];

  const byte1 = ((d[0] << 4) | 0x0a).toString(16).toUpperCase().padStart(2, '0');
  bytes.push(byte1);

  for (let i = 1; i < 15; i += 2) {
    const lowNibble = d[i];
    const highNibble = d[i + 1];
    const b = ((highNibble << 4) | lowNibble).toString(16).toUpperCase().padStart(2, '0');
    bytes.push(b);
  }

  const byteBreakdown = [
    { byteIndex: 0, hex: bytes[0], meaning: 'Payload Length (8 bytes follow)' },
    { byteIndex: 1, hex: bytes[1], meaning: `D1 (${d[0]}) + Type 0xA (IMEI Odd Identity)` },
    { byteIndex: 2, hex: bytes[2], meaning: `TAC Digits 2–3 (${d[1]}${d[2]} swapped BCD)` },
    { byteIndex: 3, hex: bytes[3], meaning: `TAC Digits 4–5 (${d[3]}${d[4]} swapped BCD)` },
    { byteIndex: 4, hex: bytes[4], meaning: `TAC Digits 6–7 (${d[5]}${d[6]} swapped BCD)` },
    { byteIndex: 5, hex: bytes[5], meaning: `TAC Digit 8 + SNR 1 (${d[7]}${d[8]} swapped BCD)` },
    { byteIndex: 6, hex: bytes[6], meaning: `SNR Digits 2–3 (${d[9]}${d[10]} swapped BCD)` },
    { byteIndex: 7, hex: bytes[7], meaning: `SNR Digits 4–5 (${d[11]}${d[12]} swapped BCD)` },
    { byteIndex: 8, hex: bytes[8], meaning: `SNR Digit 6 + Luhn CD (${d[13]}${d[14]} swapped BCD)` },
  ];

  return {
    cleanImei: clean,
    validLength,
    hexBytes: bytes,
    formattedHex: bytes.join(' '),
    byteBreakdown,
  };
}
