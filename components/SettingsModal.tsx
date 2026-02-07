
import React, { useState } from 'react';
import { X, Save, Folder, Settings, Shield, Zap, HardDrive, FileCode, Key } from 'lucide-react';
import { SystemConfig } from '../types';

interface SettingsModalProps {
  config: SystemConfig;
  onClose: () => void;
  onSave: (config: SystemConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState<SystemConfig>({ ...config });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700">
                <Settings className="text-emerald-500" size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">System Config</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Hardware Bridge Parameters</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-full transition-colors"><X /></button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <Key size={18} className="text-emerald-500" />
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Credentials</h3>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TMDB API Key</label>
               <div className="relative group">
                  <input 
                    type="password"
                    value={localConfig.tmdbApiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, tmdbApiKey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-5 pr-4 text-emerald-500 font-mono text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-black uppercase"><Key size={12}/></div>
               </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <HardDrive size={18} className="text-emerald-500" />
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Executables</h3>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MakeMKV Binary Path (makemkvcon.exe)</label>
               <div className="relative group">
                  <input 
                    value={localConfig.makeMkvPath}
                    onChange={(e) => setLocalConfig({ ...localConfig, makeMkvPath: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-5 pr-4 text-emerald-500 font-mono text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-black uppercase"><FileCode size={12}/></div>
               </div>
               <p className="text-[9px] text-zinc-600 leading-relaxed italic">
                 Default is usually: C:\Program Files (x86)\MakeMKV\makemkvcon.exe
               </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <Folder size={18} className="text-emerald-500" />
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Archival Target</h3>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Master Output Path</label>
               <div className="relative group">
                  <input 
                    value={localConfig.outputPath}
                    onChange={(e) => setLocalConfig({ ...localConfig, outputPath: e.target.value })}
                    placeholder="D:\Videos\Archive"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-5 pr-4 text-emerald-500 font-mono text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
               </div>
               <p className="text-[9px] text-zinc-600 leading-relaxed italic">
                 The Bridge creates subfolders formatted as: Movie Name (Year)
               </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div className="glass p-6 rounded-[24px] border-zinc-800 space-y-4">
               <div className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Behavior</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">Auto-Eject</span>
                  <button 
                    onClick={() => setLocalConfig({ ...localConfig, autoEject: !localConfig.autoEject })}
                    className={`w-10 h-5 rounded-full p-1 transition-all ${localConfig.autoEject ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${localConfig.autoEject ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>
               <p className="text-[9px] text-zinc-500 leading-tight">
                 Automatically open the drive tray upon successful completion of a batch rip sequence.
               </p>
            </div>

            <div className="glass p-6 rounded-[24px] border-zinc-800 space-y-4">
               <div className="flex items-center gap-2">
                  <Zap size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Duration</span>
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-zinc-200">Min Secs</span>
                    <span className="text-[10px] font-mono text-emerald-500">{localConfig.minTitleLength}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1800" step="30"
                    value={localConfig.minTitleLength}
                    onChange={(e) => setLocalConfig({ ...localConfig, minTitleLength: parseInt(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
               </div>
            </div>
          </section>

          <div className="flex gap-4 pt-6">
             <button 
              onClick={() => onSave(localConfig)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-[0_10px_40px_rgba(16,185,129,0.3)] text-xs"
             >
                <Save size={18} />
                COMMIT CHANGES
             </button>
             <button 
              onClick={onClose}
              className="px-8 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all text-xs"
             >
                CANCEL
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
