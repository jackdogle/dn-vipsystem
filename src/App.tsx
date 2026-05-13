/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Info, Terminal, Settings, ShieldCheck, Download } from 'lucide-react';

export default function App() {
  return (
    <div className="w-full h-full bg-zinc-950 text-white font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Documentation */}
      <div className="w-full md:w-96 bg-zinc-900/50 border-r border-zinc-800 p-8 overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Darkness VIP</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Indonesia Community</p>
          </div>
        </div>

        <section className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
              <Info size={16} /> FITUR UTAMA
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span>•</span> Sistem Koin (DC) Terpisah</li>
              <li className="flex gap-2"><span>•</span> Multi-Tier VIP (Bronze - Platinum)</li>
              <li className="flex gap-2"><span>•</span> Badge VIP di Atas Kepala & Chat</li>
              <li className="flex gap-2"><span>•</span> Diskon Toko Standar Otomatis</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
              <Terminal size={16} /> ADMIN COMMANDS
            </h3>
            <div className="bg-black/50 p-3 rounded font-mono text-[11px] space-y-2 text-rose-400">
              <div>/givedc [id] [amount]</div>
              <div>/setvip [id] [tier] [days]</div>
              <div>/checkdc [id]</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
              <Settings size={16} /> EKSPOR FUNGSI
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-2 italic">Dapat dipanggil dari script lain:</p>
            <div className="bg-black/50 p-3 rounded font-mono text-[10px] text-zinc-400">
              exports['darkness_vip']:GetDiscountedPrice(src, 1000)
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-3 bg-zinc-800 hover:bg-rose-600 transition-colors rounded-lg flex items-center justify-center gap-2 text-sm font-bold group">
              <Download size={18} /> DOWNLOAD RESOURCE
            </button>
          </div>
        </section>
      </div>

      {/* Main Preview */}
      <div className="flex-1 flex flex-col relative bg-black">
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-rose-600/20 text-rose-500 text-[10px] font-bold rounded-full border border-rose-600/30">
            LIVE NUI PREVIEW
          </span>
        </div>
        
        <iframe 
          src="/html/index.html?preview=true" 
          className="w-full h-full border-none"
          title="Darkness VIP Shop Preview"
        />
      </div>
    </div>
  );
}
