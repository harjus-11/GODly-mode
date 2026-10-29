# Baseband & Firmware Lab — Telecom Security & Protocol Workbench

This update introduces a comprehensive **Baseband & Firmware Lab** alongside deep technical enhancements to the existing IMEI and Shizuku modules, turning the concepts from your reference screenshots into an interactive, console-driven engineering and academic research workbench.

## User Review & Critical Decisions

> [!IMPORTANT]
> All interactive preferences from your clarification responses have been locked into this specification. Please review the architecture and module breakdown below before we proceed to implementation.

- **Confirmed Organization**: We will add a dedicated **Baseband & Firmware Lab** view in the main navigation bar AND expand the existing **IMEI Lookup**, **IMEI Masker**, and **Shizuku Network** views with direct cross-links and baseband-level inspection panels.
- **Confirmed Modules**:
  1. **QFIL, Odin & SP Flash Tool Simulators** (Qualcomm Firehose/QCN, Samsung CP/CSC Odin slots, MediaTek Scatter/NVRAM).
  2. **Baseband NVM & UART Serial Explorer** (Non-Volatile Memory register map, UART/DIAG serial frame inspector, and OS vs. Baseband handshake trace).
  3. **BootROM & Authentication Protocol Analyzer** (PBL/SBL boot chain, cryptographic eFuse verification, EDL/BROM authentication, and why OS toggles like Airplane Mode cannot bypass baseband locks).
  4. **3GPP & IEEE Academic Specification Library** (Searchable 3GPP TS clauses, IEEE baseband security papers, XDA technical references, and one-click IEEE/APA/BibTeX citation generator).
- **Confirmed Experience**: Interactive engineering workbench with live execution console logs, stateful protocol handshakes, and backend diagnostic API routes.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an interactive telecommunications engineering workbench that demonstrates how cellular network locks are enforced inside the isolated baseband processor rather than the host operating system, how OEM flashing tools (QFIL, Odin, SP Flash Tool) communicate with modem partitions and Non-Volatile Memory (NVM), how BootROM security chains validate firmware signatures, and how to cite official 3GPP/IEEE standards for academic research.
- **Target Audience / Persona**: Telecommunications security researchers, academic paper authors, mobile hardware technicians, and Android power users analyzing carrier lock architectures.
- **Key Value**: Bridges high-level carrier unlocking policies with low-level baseband hardware architecture, providing hands-on diagnostic simulators, live serial/IPC console traces, and ready-to-cite academic references in a single unified environment.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **OS vs. Baseband Handshake & BootROM Flow**: Users toggle OS-level settings (Airplane Mode, Mobile Data, Roaming) alongside Baseband Radio states to observe in real time why standard Android/iOS toggles do not bypass the baseband processor's 3GPP NAS attach and SIM lock verification against carrier PLMN whitelists. Users can step through the 4-stage BootROM chain (Primary Bootloader $\rightarrow$ Secondary Bootloader $\rightarrow$ Baseband Modem RTOS $\rightarrow$ EFS/NVM Verification) and inspect authentication handshakes.
  2. **Baseband NVM & UART Serial Explorer Flow**: Users select a serial interface mode (`UART 115200 8N1`, `Qualcomm DIAG USB`, `Samsung DM Port`, or `MTK VCOM`) and inspect hexadecimal and decoded Non-Volatile Memory items (such as `NV_UE_IMEI_I / Item 550`, `SIM_LOCK_POLICY_DATA`, `RFCAL_BAND_MASK`, and `EFS2_MODEM_PARTITIONS`). Clicking any NVM register dispatches a read/verify probe to the live serial console log.
  3. **OEM Flashing Tool Simulators (QFIL / Odin / SP Flash Tool)**: Users switch between three interactive OEM service tool workbenches:
     - **Qualcomm QFIL Mode**: Select Firehose programmer (`prog_firehose_ddr.elf`), inspect Sahara EDL 9008 port status, audit `modemst1`/`modemst2`/`fsg` partitions, and run simulated QCN/NV backup Integrity verification.
     - **Samsung Odin3 Mode**: Load and inspect `BL`, `AP`, `CP` (Core Processor / Baseband Modem), and `CSC` / `HOME_CSC` tar.md5 containers, compare carrier-locked vs. U1 unbranded CSC carrier profiles, and simulate PIT partition map verification.
     - **MediaTek SP Flash Tool Mode**: Parse an MTK Scatter file (`MT6897_Android_scatter.txt`), inspect Preloader/BROM Download Agent (DA) authentication, and audit `nvram`, `nvdata`, `protect1`, and `md1img` regions with live console telemetry.
  4. **3GPP & IEEE Academic Reference & Citation Flow**: Users filter authoritative references across **3GPP Specifications** (TS 22.022, TS 23.003, TS 33.501, TS 31.102), **IEEE Baseband Security Papers**, and **XDA Technical Threads**, inspect technical summaries for their paper, and copy formatted citations in **IEEE**, **APA**, or **BibTeX** format with a single click.
  5. **Expanded Existing Views**:
     - **IMEI Lookup View**: Adds a "Baseband & NVM Hardware Profile" section showing the detected chipset's flashing protocol (QFIL / Odin / SP Flash Tool), NVRAM partition layout, and a direct button to open that chipset in the Baseband Lab.
     - **IMEI Masker View**: Adds an "NVM Register & AT/DIAG Log Scrubber" mode that detects and redacts IMEIs stored in hexadecimal NV Item 550 BCD byte arrays and UART serial dumps.
     - **Shizuku Network Manager**: Adds a "Baseband vs. OS Framework Layer" comparison panel clarifying which carrier restrictions live in Android `settings_global` (modifiable via Shizuku UID 2000) versus isolated Baseband NVM firmware.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Precision laboratory instrumentation and high-density developer telemetry console.
  - *Color Palette & Mood*: Deep obsidian slate canvas (`bg-slate-950`, `#020617`) paired with flat structural slate panels (`bg-slate-900`, `#0F172A`), crisp 1px hairline borders (`border-slate-800`), and calibrated semantic accents: laser cyan (`#06B6D4`) for active bus/protocol traces, emerald (`#10B981`) for verified cryptographic signatures, and amber (`#F59E0B`) for locked/restricted hardware registers.
  - *Typography & Hierarchy*: Crisp geometric sans-serif headings and prose paired with strict tabular monospace (`font-mono tabular-nums`) for memory offsets (`0x00226`), baud rates (`115200 bps`), BCD hex strings, and live console timestamps.
  - *Component Styling & Layout*: Asymmetric split workbench layout with parameter/tool selectors on the left, high-density interactive register/partition inspectors in the center, and a live streaming UART/IPC console log docked below.

- **Interactive Feedback & Motion**:
  - Immediate ($\le 150\text{ms}$) state transitions when switching OEM tool modes, probing NVM offsets, or formatting citations, accompanied by timestamped multi-line telemetry entries in the live console log.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Safe, Educational & Diagnostic Simulation of Baseband & Flashing Workflows**
  - *Chosen Approach*: Build realistic, interactive diagnostic simulators for QFIL, Odin, SP Flash Tool, UART serial frames, and NVM registers that demonstrate exact memory structures, partition layouts, and cryptographic security boundaries while emphasizing legal compliance and hardware security realities.
  - *Why*: Directly fulfills the user's need to understand, interact with, and write technically accurate documentation about baseband locks, UART/NVM interactions, OEM service tools, and 3GPP/IEEE standards without generating destructive exploit binaries.
  - *Alternatives Considered*: Static text cards without interactive tool states (rejected because the user requested an interactive workbench with live console logs).

- **Decision 2: Unified Express Backend Protocol Engine (`/api/baseband/*`)**
  - *Chosen Approach*: Add dedicated backend endpoints in the Express server to process simulated UART/NVM register reads, OEM flashing tool protocol handshakes (QFIL Sahara/Firehose, Odin PIT/CP analysis, MTK Scatter/DA inspection), and BootROM security chain diagnostics.
  - *Why*: Ensures every workbench button dispatches a real API request and returns rich, structured telemetry, hex dumps, and timing metrics to the live console.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        OmniUnlock Application Shell                        │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   Top Navigation     │  │         Cross-View Context State           │  │
│  │  (New Baseband Lab   │  │ (Selected Chipset / OEM Tool / Active Tab) │  │
│  │   + Existing Tabs)   │  └─────────────────────┬──────────────────────┘  │
│  └──────────┬───────────┘                        │                         │
│             ▼                                    ▼                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                Baseband & Firmware Lab Workbench                     │  │
│  │  ┌─────────────────────────┐  ┌───────────────────────────────────┐  │  │
│  │  │ 1. OEM Tool Simulators  │  │ 2. Baseband NVM & UART Explorer   │  │  │
│  │  │  • Qualcomm QFIL (9008) │  │  • NV Item 550 (BCD Hex Inspector)│  │  │
│  │  │  • Samsung Odin3 (CP)   │  │  • UART 115200 / DIAG Frame Probe │  │  │
│  │  │  • MTK SP Flash Tool    │  │  • EFS / NVRAM Partition Map      │  │  │
│  │  └───────────┬─────────────┘  └─────────────────┬─────────────────┘  │  │
│  │              │                                  │                    │  │
│  │  ┌───────────▼─────────────┐  ┌─────────────────▼─────────────────┐  │  │
│  │  │ 3. BootROM & Auth Chain │  │ 4. 3GPP & IEEE Academic Library   │  │  │
│  │  │  • OS Toggle vs Baseband│  │  • 3GPP TS 22.022 / 23.003 / 33.5 │  │  │
│  │  │  • PBL -> SBL -> Modem  │  │  • IEEE Baseband Security Papers  │  │  │
│  │  │  • eFuse & Key Handshake│  │  • IEEE / APA / BibTeX Exporter   │  │  │
│  │  └───────────┬─────────────┘  └─────────────────┬─────────────────┘  │  │
│  │              └────────────────┬─────────────────┘                    │  │
│  │                               ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │         Live UART / EDL / Baseband Diagnostic Console          │  │  │
│  │  └────────────────────────────┬───────────────────────────────────┘  │  │
│  └───────────────────────────────┼──────────────────────────────────────┘  │
│                                  │                                         │
│  ┌───────────────────────────────▼──────────────────────────────────────┐  │
│  │         Expanded Existing Views (IMEI Lookup, Masker, Shizuku)       │  │
│  │  • IMEI Lookup -> Chipset Flashing Tool & NVM Partition Mapping      │  │
│  │  • IMEI Masker -> NV Item 550 BCD Hex & UART Serial Dump Scrubber    │  │
│  │  • Shizuku Network -> OS Global Settings vs Baseband NVM Comparison  │  │
│  └───────────────────────────────┬──────────────────────────────────────┘  │
└──────────────────────────────────┼─────────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Express Backend API (/api/baseband/*)                  │
│  • POST /api/baseband/probe-nvm    (Reads & decodes NVM / EFS registers)   │
│  • POST /api/baseband/simulate-tool (Executes QFIL, Odin, SP Flash checks) │
│  • POST /api/baseband/handshake    (Traces OS vs Baseband 3GPP attach)     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **OEM Flashing Profiles**: Structured definitions for **Qualcomm QFIL** (Sahara protocol v2, Firehose ELF programmer, `modemst1`/`modemst2`/`fsg` partitions, NV Item 550), **Samsung Odin3** (`BL`, `AP`, `CP` modem.bin, `CSC` carrier policy tables, PIT partition blocks), and **MediaTek SP Flash Tool** (BROM 16-bit handshake, DA agent, `nvram.bin`, `nvdata.img`, `protect1`/`protect2`, `md1img.img`).
- **Baseband NVM Registers**: Address offset (`0x0226` / Item 550), register name, storage partition, access control status (`Read-Only / RSA Signed`, `DIAG SPC Locked`, `EFS Protected`), raw BCD/Hex payload, and decoded engineering meaning.
- **3GPP & IEEE Academic Catalog**: Specification ID, title, organization (`3GPP`, `IEEE`, `USENIX`, `XDA Engineering`), publication year, key technical takeaways for academic papers, and pre-formatted citation templates (`IEEE`, `APA`, `BibTeX`).

### Interactive Component & State Mapping

- **Sub-Navigation & Tool Switcher**: Switching between the 4 core lab modules or selecting a specific chipset (`Qualcomm Snapdragon X75`, `Samsung Exynos 2400 / Shannon`, `MediaTek Dimensity 9300 / Helio M80`) dynamically updates the partition table, memory offsets, and active protocol trace.
- **NVM Register & BCD Hex Encoder/Decoder**: Entering any 15-digit IMEI converts it in real time into the standard Qualcomm 9-byte BCD (Binary-Coded Decimal) `NV_UE_IMEI_I` hex array (e.g., `08 3A 52 02 11 11 40 28 19`) and displays how it is stored in non-volatile memory—and how to scrub it in the IMEI Masker view.
- **Live Console Execution**: Every probe button ("Read NVM Register", "Run QFIL Sahara Handshake", "Inspect Odin CP Modem", "Verify MTK Scatter", "Simulate 3GPP NAS Attach") calls `/api/baseband/*` and appends timestamped serial/protocol frames to the live console with copy and export controls.
