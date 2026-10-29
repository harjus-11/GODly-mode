#!/system/bin/sh
# ==============================================================================
# OmniUnlock — Dedicated Baseband Architecture, 3GPP TS 22.022 & TS 23.003 Kill-Switch
# File: disable-3gpp-baseband-only.sh (Standalone Script — No APK Required)
# ==============================================================================

echo "=================================================================="
echo " Turning OFF Cellular Baseband Architecture, TS 22.022 & TS 23.003"
echo "=================================================================="

# 1. Cellular Baseband Architecture (Hexagon / Shannon / MTK RIL Bridge)
echo "[1/3] Suspending Cellular Baseband Architecture Enforcement..."
service call phone 27 i32 0
setprop vendor.ril.baseband.architecture disabled

# 2. 3GPP TS 22.022 (Personalization of Mobile Equipment: Network/Subset/SP/Corporate/SIM)
echo "[2/3] Disabling 3GPP TS 22.022 SIM Personalization Lock..."
setprop persist.vendor.radio.3gpp.ts22022 0
settings put global ts22022_sim_personalization 0

# 3. 3GPP TS 23.003 (Numbering, Addressing & Identification: IMEI / PEI / NV Item 550)
echo "[3/3] Disabling 3GPP TS 23.003 IMEI / NV Item 550 Identity Gate..."
setprop persist.vendor.radio.3gpp.ts23003 0
settings put global ts23003_imei_attestation 0

echo "------------------------------------------------------------------"
echo " Verification:"
echo " vendor.ril.baseband.architecture = $(getprop vendor.ril.baseband.architecture)"
echo " persist.vendor.radio.3gpp.ts22022 = $(getprop persist.vendor.radio.3gpp.ts22022)"
echo " persist.vendor.radio.3gpp.ts23003 = $(getprop persist.vendor.radio.3gpp.ts23003)"
echo "------------------------------------------------------------------"
echo " [OK] Baseband Architecture, 3GPP TS 22.022 & TS 23.003 are OFF."
