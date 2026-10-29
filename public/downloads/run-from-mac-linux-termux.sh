#!/usr/bin/env bash
# ==============================================================================
# OmniUnlock — macOS / Linux / Termux Standalone Script Runner (No APK Required)
# File: run-from-mac-linux-termux.sh
# ==============================================================================

echo "========================================================================="
echo " OmniUnlock Standalone Shizuku & 3GPP Baseband Runner (No APK Required)"
echo "========================================================================="

if command -v rish >/dev/null 2>&1; then
  echo "[Termux + rish detected] Executing via Shizuku rish shell..."
  rish -c "sh ./shizuku-baseband-unlock.sh"
elif command -v adb >/dev/null 2>&1; then
  echo "[ADB detected] Pushing and executing standalone scripts on device..."
  adb push shizuku-baseband-unlock.sh /data/local/tmp/shizuku-baseband-unlock.sh
  adb push disable-3gpp-baseband-only.sh /data/local/tmp/disable-3gpp-baseband-only.sh
  adb push restore-stock-baseband.sh /data/local/tmp/restore-stock-baseband.sh
  adb push launch-secret-menus.sh /data/local/tmp/launch-secret-menus.sh
  adb shell chmod +x /data/local/tmp/*.sh
  adb shell sh /data/local/tmp/shizuku-baseband-unlock.sh
else
  echo "[Local Shell] Running shizuku-baseband-unlock.sh directly..."
  sh ./shizuku-baseband-unlock.sh
fi
