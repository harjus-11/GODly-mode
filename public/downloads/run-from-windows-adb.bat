@echo off
echo =========================================================================
echo OmniUnlock Standalone Shizuku & 3GPP Baseband Runner (No APK Required)
echo =========================================================================
adb devices
echo.
echo Pushing standalone scripts to /data/local/tmp/...
adb push shizuku-baseband-unlock.sh /data/local/tmp/shizuku-baseband-unlock.sh
adb push disable-3gpp-baseband-only.sh /data/local/tmp/disable-3gpp-baseband-only.sh
adb push restore-stock-baseband.sh /data/local/tmp/restore-stock-baseband.sh
adb push launch-secret-menus.sh /data/local/tmp/launch-secret-menus.sh

adb shell chmod +x /data/local/tmp/shizuku-baseband-unlock.sh
adb shell chmod +x /data/local/tmp/disable-3gpp-baseband-only.sh
adb shell chmod +x /data/local/tmp/restore-stock-baseband.sh
adb shell chmod +x /data/local/tmp/launch-secret-menus.sh

echo.
echo Executing shizuku-baseband-unlock.sh via ADB / Shizuku UID 2000...
adb shell sh /data/local/tmp/shizuku-baseband-unlock.sh
echo.
echo Done!
pause
