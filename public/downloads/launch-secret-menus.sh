#!/system/bin/sh
# ==============================================================================
# OmniUnlock — Secret Engineering & Radio Menu Launcher Script
# File: launch-secret-menus.sh (Standalone Script — No APK Required)
# Bypasses Verizon / AT&T / T-Mobile dialer blocks using UID 2000 intents
# ==============================================================================

TARGET="${1:-radioinfo}"

echo "=================================================================="
echo " OmniUnlock Secret Engineering Menu Dispatcher (UID 2000)"
echo "=================================================================="

case "$TARGET" in
  radioinfo|4636)
    echo "Launching Android Testing / RadioInfo (*#*#4636#*#*)..."
    am start -n com.android.settings/.TestingSettings 2>/dev/null || \
    am start -n com.android.phone/.settings.RadioInfo 2>/dev/null || \
    am broadcast -a android.provider.Telephony.SECRET_CODE -d android_secret_code://4636
    ;;
  bandlock|2263)
    echo "Launching Samsung / OEM Band Selection (*#2263#)..."
    am broadcast -a android.provider.Telephony.SECRET_CODE -d android_secret_code://2263
    ;;
  servicemode|0011)
    echo "Launching Basic ServiceMode RF Monitor (*#0011#)..."
    am broadcast -a android.provider.Telephony.SECRET_CODE -d android_secret_code://0011
    ;;
  mtk|3646633)
    echo "Launching MediaTek EngineerMode (*#*#3646633#*#*)..."
    am start -n com.mediatek.engineermode/.EngineerMode 2>/dev/null || \
    am broadcast -a android.provider.Telephony.SECRET_CODE -d android_secret_code://3646633
    ;;
  qcom|diag)
    echo "Broadcasting Qualcomm Diagnostic Port Toggle..."
    am broadcast -a android.provider.Telephony.SECRET_CODE -d android_secret_code://717717
    ;;
  *)
    echo "Usage: sh launch-secret-menus.sh [radioinfo|bandlock|servicemode|mtk|qcom]"
    ;;
esac
