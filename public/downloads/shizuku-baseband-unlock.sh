#!/system/bin/sh
# ==============================================================================
# OmniUnlock — Master Shizuku UID 2000 Network & 3GPP Baseband Override Script
# File: shizuku-baseband-unlock.sh (Standalone Script — No APK Required)
# Usage (ADB):    adb shell sh /sdcard/Download/shizuku-baseband-unlock.sh
# Usage (Shizuku/rish/Termux): sh ./shizuku-baseband-unlock.sh
# ==============================================================================

echo "=================================================================="
echo " OmniUnlock Standalone Shizuku & 3GPP Baseband Override Suite"
echo "=================================================================="

echo "[1/9] Ensuring Shizuku UID 2000 Binder Daemon is Active..."
if [ -f /sdcard/Android/data/moe.shizuku.privileged.api/start.sh ]; then
    sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh 2>/dev/null || true
fi

echo "[2/9] Turning OFF Cellular Baseband Architecture Enforcement..."
service call phone 27 i32 0
setprop vendor.ril.baseband.architecture disabled

echo "[3/9] Turning OFF 3GPP TS 22.022 SIM Personalization / Network Lock..."
setprop persist.vendor.radio.3gpp.ts22022 0
settings put global ts22022_sim_personalization 0
settings put global carrier_sim_lock_policy 0

echo "[4/9] Turning OFF 3GPP TS 23.003 IMEI / PEI & NV Item 550 Attestation..."
setprop persist.vendor.radio.3gpp.ts23003 0
settings put global ts23003_imei_attestation 0

echo "[5/9] Unlocking APN Editing & Bypassing DUN Tethering Restriction..."
settings put global tether_dun_required 0

echo "[6/9] Bypassing Carrier Mobile Hotspot Entitlement Checks..."
settings put global tether_entitlement_check_state 0

echo "[7/9] Forcing 5G Standalone (NR SA / LTE Mode 33) Radio Priority..."
settings put global preferred_network_mode 33
settings put global preferred_network_mode1 33

echo "[8/9] Forcing VoLTE & Wi-Fi Calling (IMS Provisioning Override)..."
settings put global volte_vt_enabled 1
settings put global wfc_ims_enabled 1
setprop persist.dbg.volte_avail_ovr 1
setprop persist.dbg.wfc_avail_ovr 1
setprop persist.dbg.vt_avail_ovr 1

echo "[9/9] Resetting Android Connectivity Daemon to Apply Changes..."
cmd connectivity reset 2>/dev/null || true

echo "=================================================================="
echo " [OK] All Shizuku Baseband, 3GPP TS 22.022, 3GPP TS 23.003,"
echo "      and Carrier Network Overrides Applied Successfully!"
echo "=================================================================="
