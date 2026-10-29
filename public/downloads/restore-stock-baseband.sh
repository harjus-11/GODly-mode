#!/system/bin/sh
# ==============================================================================
# OmniUnlock — Restore Stock Baseband & Carrier Settings Script
# File: restore-stock-baseband.sh (Standalone Script — No APK Required)
# ==============================================================================

echo "=================================================================="
echo " Restoring Default Cellular Baseband Architecture & 3GPP Settings"
echo "=================================================================="

service call phone 27 i32 1
setprop vendor.ril.baseband.architecture enabled
setprop persist.vendor.radio.3gpp.ts22022 1
settings put global ts22022_sim_personalization 1
setprop persist.vendor.radio.3gpp.ts23003 1
settings put global ts23003_imei_attestation 1

settings put global tether_dun_required 1
settings put global tether_entitlement_check_state 1
settings put global preferred_network_mode 9

cmd connectivity reset 2>/dev/null || true

echo " [OK] Stock Baseband Architecture, 3GPP TS 22.022 & TS 23.003 Restored."
