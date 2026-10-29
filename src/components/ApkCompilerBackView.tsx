import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  Wrench,
  Layers,
  FileArchive,
  Upload,
  FileCode,
  Plus,
  Trash2,
  Globe,
  Terminal,
  Code2,
} from 'lucide-react';
import {
  compileOmniUnlockApkWithReport,
  downloadOmniUnlockApk,
  downloadStandaloneMobileAppBundle,
  downloadOmniUnlockZipBundle,
  buildOmniUnlockZipBundleBytes,
  ApkBuildReport,
  ApkBuildConfig,
  UploadedAppFile,
} from '../utils/apkBuilder.ts';
import { usePWAInstall } from '../utils/usePWAInstall.ts';

type AppBuildMode =
  | 'builtin-omniunlock'
  | 'custom-html-webapp'
  | 'custom-fullstack'
  | 'custom-shizuku-script'
  | 'custom-pwa-url';

const STARTER_TEMPLATES: Record<AppBuildMode, UploadedAppFile[]> = {
  'builtin-omniunlock': [
    {
      name: 'index.html',
      content: '<!doctype html>\n<html><head><title>App Console</title></head><body><h1>Built-In Suite</h1></body></html>',
      sizeBytes: 102,
    },
    {
      name: 'system/config.xml',
      content: '<?xml version="1.0" encoding="utf-8"?>\n<config>\n  <feature name="android.software.webview" />\n</config>',
      sizeBytes: 104,
    },
  ],
  'custom-html-webapp': [
    {
      name: 'index.html',
      content:
        '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Custom HTML5 Android App</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <main class="app">\n    <h1>My Custom HTML5 APK</h1>\n    <p>Packaged into a signed Android APK binary.</p>\n    <button id="actionBtn">Run App Action</button>\n  </main>\n  <script src="app.js"></script>\n</body>\n</html>',
      sizeBytes: 458,
    },
    {
      name: 'styles.css',
      content:
        'body { background: #090d16; color: #f8fafc; font-family: system-ui, sans-serif; padding: 24px; }\n.app { max-width: 480px; margin: 0 auto; background: #111827; padding: 24px; border-radius: 16px; border: 1px solid #1f2937; }\nbutton { background: #06b6d4; color: #020617; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }',
      sizeBytes: 360,
    },
    {
      name: 'app.js',
      content:
        'document.getElementById("actionBtn")?.addEventListener("click", () => {\n  console.log("Custom HTML5 APK action triggered!");\n});',
      sizeBytes: 129,
    },
  ],
  'custom-fullstack': [
    {
      name: 'package.json',
      content: JSON.stringify(
        {
          name: 'custom-fullstack-apk',
          version: '1.0.0',
          scripts: { dev: 'tsx server.ts', build: 'vite build' },
        },
        null,
        2
      ),
      sizeBytes: 138,
    },
    {
      name: 'server.ts',
      content:
        'import express from "express";\nconst app = express();\napp.get("/api/health", (_req, res) => res.json({ ok: true }));\napp.listen(3000);\n',
      sizeBytes: 135,
    },
    {
      name: 'src/App.tsx',
      content:
        'import React from "react";\nexport default function App() {\n  return <div>Full-Stack Android WebView & API App</div>;\n}\n',
      sizeBytes: 120,
    },
  ],
  'custom-shizuku-script': [
    {
      name: 'system/build.prop',
      content:
        '# Custom Android System Properties\nro.build.version.release=15\npersist.sys.usb.config=adb\n',
      sizeBytes: 91,
    },
    {
      name: 'scripts/bootstrap.sh',
      content:
        '#!/system/bin/sh\necho "[APK System Bootstrap] Applying bundled system configuration..."\ngetprop ro.product.model\n',
      sizeBytes: 114,
    },
    {
      name: 'system/etc/sysconfig/app_policy.xml',
      content:
        '<?xml version="1.0" encoding="utf-8"?>\n<config>\n  <allow-in-power-save package="com.custom.systemapp" />\n</config>\n',
      sizeBytes: 115,
    },
  ],
  'custom-pwa-url': [
    {
      name: 'manifest.json',
      content: JSON.stringify(
        {
          name: 'Custom Web Wrapper APK',
          short_name: 'WebAPK',
          start_url: 'https://example.com',
          display: 'standalone',
        },
        null,
        2
      ),
      sizeBytes: 142,
    },
  ],
};

const AVAILABLE_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.POST_NOTIFICATIONS',
  'moe.shizuku.manager.permission.API_V23',
];

export const ApkCompilerBackView: React.FC = () => {
  const [appMode, setAppMode] = useState<AppBuildMode>('custom-html-webapp');
  const [appName, setAppName] = useState<string>('Universal Custom APK');
  const [versionName, setVersionName] = useState<string>('1.0.0');
  const [packageName, setPackageName] = useState<string>('com.custom.universalapk');
  const [entryPoint, setEntryPoint] = useState<string>('index.html');
  const [remoteUrl, setRemoteUrl] = useState<string>('https://example.com');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedAppFile[]>(
    STARTER_TEMPLATES['custom-html-webapp']
  );
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileContent, setNewFileContent] = useState<string>('');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildReport, setBuildReport] = useState<ApkBuildReport>(() =>
    compileOmniUnlockApkWithReport({
      appMode: 'custom-html-webapp',
      appName: 'Universal Custom APK',
      versionName: '1.0.0',
      packageName: 'com.custom.universalapk',
      entryPoint: 'index.html',
      customPermissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
      ],
      uploadedFiles: STARTER_TEMPLATES['custom-html-webapp'],
    }).report
  );

  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const { isInstallable, install } = usePWAInstall();

  const currentConfig: ApkBuildConfig = {
    appMode,
    appName,
    versionName,
    packageName,
    entryPoint,
    remoteUrl,
    customPermissions: selectedPermissions,
    uploadedFiles,
  };

  const zipPreviewFiles = buildOmniUnlockZipBundleBytes(currentConfig).includedFiles;

  const handleSelectMode = (mode: AppBuildMode) => {
    setAppMode(mode);
    const template = STARTER_TEMPLATES[mode] || [];
    setUploadedFiles(template);
    setActiveFileIndex(0);
    if (mode === 'builtin-omniunlock') {
      setAppName('OmniUnlock Suite');
      setPackageName('com.omniunlock.shizuku');
      setEntryPoint('index.html');
    } else if (mode === 'custom-html-webapp') {
      setAppName('Custom HTML5 App');
      setPackageName('com.custom.html5app');
      setEntryPoint('index.html');
    } else if (mode === 'custom-fullstack') {
      setAppName('Custom FullStack App');
      setPackageName('com.custom.fullstack');
      setEntryPoint('src/App.tsx');
    } else if (mode === 'custom-shizuku-script') {
      setAppName('Custom System & Script APK');
      setPackageName('com.custom.systempack');
      setEntryPoint('scripts/bootstrap.sh');
    } else if (mode === 'custom-pwa-url') {
      setAppName('Custom WebApp Wrapper');
      setPackageName('com.custom.webwrapper');
      setEntryPoint('manifest.json');
    }
    setStatusToast(`Loaded ${mode} starter files into the APK Builder workspace.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const loaded: UploadedAppFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const text = await file.text();
      loaded.push({
        name: file.webkitRelativePath || file.name,
        content: text,
        sizeBytes: file.size,
      });
    }

    setUploadedFiles((prev) => [...prev, ...loaded]);
    setStatusToast(`✓ Added ${loaded.length} file(s) into the APK Builder workspace.`);
    e.target.value = '';
  };

  const handleAddInlineFile = () => {
    const cleanName = newFileName.trim();
    if (!cleanName) return;
    const encoder = new TextEncoder();
    const entry: UploadedAppFile = {
      name: cleanName,
      content: newFileContent,
      sizeBytes: encoder.encode(newFileContent).length,
    };
    setUploadedFiles((prev) => [...prev, entry]);
    setNewFileName('');
    setNewFileContent('');
    setStatusToast(`✓ Added ${cleanName} to the APK asset tree.`);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex((prev) => prev - 1);
    }
  };

  const handleUpdateActiveFileContent = (updatedText: string) => {
    const encoder = new TextEncoder();
    setUploadedFiles((prev) =>
      prev.map((f, idx) =>
        idx === activeFileIndex
          ? { ...f, content: updatedText, sizeBytes: encoder.encode(updatedText).length }
          : f
      )
    );
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleDownloadZipSuite = () => {
    setIsBuilding(true);
    setStatusToast('Packaging signed binary .APK, standalone HTML5 bundle, and all project files into .ZIP archive...');
    setTimeout(() => {
      const zipInfo = downloadOmniUnlockZipBundle(currentConfig);
      setIsBuilding(false);
      setStatusToast(
        `✓ Downloaded ${zipInfo.zipFilename} (${zipInfo.sizeBytes} bytes — ${zipInfo.includedFiles.length} files bundled)`
      );
    }, 200);
  };

  const handleRebuildAndDownloadApk = () => {
    setIsBuilding(true);
    setStatusToast('Compiling AAPT2 Binary AXML, embedding project files, verifying DEX Adler-32, and signing CERT.RSA...');
    setTimeout(() => {
      const report = downloadOmniUnlockApk(currentConfig);
      setBuildReport(report);
      setIsBuilding(false);
      setStatusToast(
        `✓ Build Succeeded: Downloaded ${report.filename} (${report.sizeBytes} bytes, ${uploadedFiles.length} custom files embedded)`
      );
    }, 200);
  };

  const handleDownloadMobileBundle = () => {
    const file = downloadStandaloneMobileAppBundle();
    setStatusToast(`✓ Downloaded ${file} — Standalone HTML5 bundle`);
  };

  const handleCopyAdbInstall = () => {
    const cmd = `adb install -r -d -g ${buildReport.filename}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setStatusToast(`✓ Copied ADB install command: ${cmd}`);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="space-y-8">
      {statusToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{statusToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Official Universal APK & Project Folder ZIP Builder Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              <FileArchive className="w-4 h-4 text-cyan-400" />
              <span>Universal Multi-App Android APK &amp; Project Folder Compiler</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Official Universal APK Builder (HTML, Full-Stack, System Files &amp; Scripts)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Build a standalone signed <code className="text-cyan-300 font-mono">.apk</code> or downloadable project folder <code className="text-emerald-300 font-mono">.zip</code> from <strong>any application</strong>—upload HTML/CSS/JS files, full-stack React/Node code, Android system configuration files (<code className="text-amber-300 font-mono">.xml</code>, <code className="text-amber-300 font-mono">.prop</code>, <code className="text-amber-300 font-mono">.sh</code>), or use the built-in application files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRebuildAndDownloadApk}
              disabled={isBuilding}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isBuilding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling APK...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Build &amp; Download Signed APK (.apk)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadZipSuite}
              disabled={isBuilding}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download APK + Files Bundle (.zip)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMobileBundle}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Standalone HTML5 App (.html)</span>
            </button>

            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="px-4 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Install WebAPK</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Select Application Architecture / Template Mode */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Step 1 — Choose Application Type or Starter Template
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Active Engine: <strong className="text-emerald-300">{appMode}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleSelectMode('custom-html-webapp')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                appMode === 'custom-html-webapp'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1">
                <Code2 className="w-4 h-4" />
                <span>HTML5 / JS / CSS App</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Compile any HTML, CSS, and JS files into a standalone Android APK.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('custom-fullstack')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                appMode === 'custom-fullstack'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                <Layers className="w-4 h-4" />
                <span>Full-Stack React / Node</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Package React/Vite UI and Express server files into an APK &amp; ZIP bundle.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('custom-shizuku-script')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                appMode === 'custom-shizuku-script'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <Terminal className="w-4 h-4" />
                <span>System Files &amp; Scripts</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bundle custom <code className="font-mono">.prop</code>, <code className="font-mono">.xml</code>, and <code className="font-mono">.sh</code> system files into an APK.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('custom-pwa-url')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                appMode === 'custom-pwa-url'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
                <Globe className="w-4 h-4" />
                <span>PWA / Web URL APK</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Wrap any live URL or web app manifest into an installable Android APK.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('builtin-omniunlock')}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                appMode === 'builtin-omniunlock'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                <Smartphone className="w-4 h-4" />
                <span>Built-In App Preset</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Build the default application preset with pre-configured manifest settings.
              </p>
            </button>
          </div>
        </div>

        {/* Step 2: Upload & Edit Custom Project / HTML / System Files */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Step 2 — Upload or Edit Application, HTML &amp; System Files ({uploadedFiles.length} files in APK)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All files listed below are packaged directly into <code className="text-cyan-300 font-mono">assets/app/</code> inside the compiled <code className="text-cyan-300 font-mono">.apk</code> and <code className="text-emerald-300 font-mono">project-files/</code> inside the <code className="text-emerald-300 font-mono">.zip</code>.
              </p>
            </div>

            <label className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0 transition">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Files from Device (.html, .js, .xml, .sh, .prop, etc.)</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: File List & Add New File */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Embedded Project Files
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    onClick={() => setActiveFileIndex(idx)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                      activeFileIndex === idx
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate font-mono">
                      <span className="text-cyan-300">{file.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({file.sizeBytes} B)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New File Form */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Create New File in APK</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. index.html or system/build.prop"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="File contents..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddInlineFile}
                  className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  + Add File to APK Project
                </button>
              </div>
            </div>

            {/* Right 2 Columns: Live Code Editor for Selected File */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-300 font-bold">
                  {uploadedFiles[activeFileIndex]
                    ? `Editing: assets/app/${uploadedFiles[activeFileIndex].name}`
                    : 'Select or add a file to edit its contents'}
                </span>
                {uploadedFiles[activeFileIndex] && (
                  <span className="font-mono text-slate-400">
                    {uploadedFiles[activeFileIndex].sizeBytes} bytes
                  </span>
                )}
              </div>
              <textarea
                rows={13}
                value={uploadedFiles[activeFileIndex]?.content || ''}
                onChange={(e) => handleUpdateActiveFileContent(e.target.value)}
                disabled={!uploadedFiles[activeFileIndex]}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: APK Manifest Metadata & Permissions + Binary Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Step 3 — AndroidManifest.xml Configuration &amp; Permissions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Application Display Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Android Package ID</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Release Version Tag</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Main Entry Point / Boot File</label>
                <input
                  type="text"
                  value={entryPoint}
                  onChange={(e) => setEntryPoint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
            </div>

            {appMode === 'custom-pwa-url' && (
              <div className="text-xs">
                <label className="block text-slate-400 mb-1 font-medium">Target Web App URL</label>
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>
            )}

            <div className="space-y-2 pt-1 text-xs">
              <div className="text-slate-400 font-medium">Android Manifest Permissions:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                  >
                    <span className="font-mono text-[11px] text-slate-200 truncate pr-2" title={perm}>
                      {perm.replace('android.permission.', '').replace('moe.shizuku.manager.permission.', 'SHIZUKU_')}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="accent-cyan-500 w-3.5 h-3.5 shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 4-Stage Binary Verification Telemetry & ZIP Preview */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>APK Binary Verification &amp; Archive Contents</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                DEX Adler32: {buildReport.dexAdler32Hex}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {buildReport.steps.map((s, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-white">{s.step}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{s.detail}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold shrink-0">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="font-mono text-cyan-300 truncate">
                adb install -r -d -g {buildReport.filename}
              </div>
              <button
                type="button"
                onClick={handleCopyAdbInstall}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy ADB Install'}</span>
              </button>
            </div>

            <div className="pt-1 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400">
                Files Bundled in Output ZIP ({zipPreviewFiles.length} items):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                {zipPreviewFiles.slice(0, 6).map((item) => (
                  <div
                    key={item.name}
                    className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-cyan-300 truncate">{item.name}</span>
                    <span className="font-mono text-slate-500 shrink-0">{item.sizeBytes} B</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
