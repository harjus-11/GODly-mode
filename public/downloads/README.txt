==============================================================================
OMNIUNLOCK — STANDALONE SHIZUKU & 3GPP BASEBAND SCRIPTS (NO APK REQUIRED)
Direct Download Folder: /downloads/
==============================================================================

FILES IN THIS FOLDER:
1. shizuku-baseband-unlock.sh
   - Master standalone shell script for Shizuku (UID 2000), rish, Termux, or ADB.
   - Turns OFF Cellular Baseband Architecture enforcement, 3GPP TS 22.022 SIM
     Personalization Lock, and 3GPP TS 23.003 IMEI/NV Item 550 Identity Gate,
     plus unlocks DUN tethering, hotspot entitlement, 5G SA, and VoLTE.

2. disable-3gpp-baseband-only.sh
   - Focused standalone kill-switch script that ONLY turns off:
     * Cellular Baseband Architecture (service call phone 27 i32 0 / vendor.ril.baseband.architecture)
     * 3GPP TS 22.022 Personalization Lock (persist.vendor.radio.3gpp.ts22022=0)
     * 3GPP TS 23.003 Identity Gate (persist.vendor.radio.3gpp.ts23003=0)

3. restore-stock-baseband.sh
   - Restores all Baseband Architecture, 3GPP TS 22.022, 3GPP TS 23.003, and
     carrier network settings back to factory defaults.

4. launch-secret-menus.sh
   - Standalone script to launch hidden carrier-blocked engineering menus
     (*#*#4636#*#* RadioInfo, *#2263# Band Lock, *#0011# ServiceMode, MTK/QCOM).

5. run-from-windows-adb.bat
   - 1-click Windows batch script to push and run the standalone scripts over ADB.

6. run-from-mac-linux-termux.sh
   - 1-click macOS / Linux / Android Termux (rish) runner script.

HOW TO RUN ON ANDROID (SHIZUKU / TERMUX / aShell / LADB):
  sh /sdcard/Download/shizuku-baseband-unlock.sh

HOW TO RUN FROM PC (ADB):
  adb push shizuku-baseband-unlock.sh /data/local/tmp/
  adb shell sh /data/local/tmp/shizuku-baseband-unlock.sh
