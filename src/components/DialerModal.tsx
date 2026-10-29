import React, { useState } from 'react';
import { X, Smartphone, Hash, Phone, Info, Check, Copy, ExternalLink } from 'lucide-react';

interface DialerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DialerModal: React.FC<DialerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText('*#06#');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">How to Find Your Phone's IMEI</h3>
            <p className="text-xs text-slate-400">Works universally on all iOS, Android, and feature phones</p>
          </div>
        </div>

        {/* Method 1: The Universal Dial Code */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
            Method 1: Universal Keypad Code (Instant)
          </span>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-2xl font-mono font-extrabold text-white tracking-widest pl-2">
              *#06#
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <a
                href="tel:*%2306%23"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Launch Dialer</span>
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Open the <strong>Phone</strong> app keypad and press <code className="text-cyan-300 font-mono">* # 0 6 #</code>. A white or dark system screen will immediately appear displaying your 15-digit IMEI barcode and number.
          </p>
        </div>

        {/* Method 2 & 3: Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">On Apple iPhone:</strong>
            <p className="text-slate-400">
              Go to <strong>Settings &gt; General &gt; About</strong>. Scroll down to find the 15-digit IMEI and IMEI2 (for eSIM).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <strong className="text-white block font-semibold">On Android:</strong>
            <p className="text-slate-400">
              Go to <strong>Settings &gt; About phone</strong> (or Status information). The IMEI is listed under Device details.
            </p>
          </div>
        </div>

        {/* Physical Locations */}
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            If the phone does not turn on: The IMEI is laser-etched on the physical <strong>SIM card tray</strong>, printed on the back glass of older phones, or printed on the original retail barcode sticker.
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
        >
          Close &amp; Return to Diagnostics
        </button>
      </div>
    </div>
  );
};
