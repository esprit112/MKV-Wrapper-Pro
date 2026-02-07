
import React, { useState } from 'react';
import { Rocket, FileCode, Folder, Key, ArrowRight, Check } from 'lucide-react';
import { SystemConfig } from '../types';

interface OnboardingModalProps {
  onComplete: (config: SystemConfig) => void;
  defaultConfig: SystemConfig;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, defaultConfig }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (step === 1 && !config.tmdbApiKey) {
      setError("Please enter a valid TMDB API Key.");
      return;
    }
    if (step === 2 && !config.makeMkvPath) {
      setError("Please specify the path to makemkvcon.exe.");
      return;
    }
    if (step === 3 && !config.outputPath) {
      setError("Please specify the output directory.");
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700">
      <div className="max-w-2xl w-full flex flex-col md:flex-row bg-[#09090b] rounded-[40px] border border-zinc-800 overflow-hidden shadow-2xl relative">
        
        {/* Progress Sidebar */}
        <div className="w-full md:w-64 bg-zinc-900/50 p-8 border-r border-zinc-800 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Rocket className="text-zinc-950" size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-500">System</div>
                        <div className="text-lg font-bold text-white tracking-tight">Setup</div>
                    </div>
                </div>

                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex items-center gap-4 ${step === i ? 'opacity-100' : 'opacity-30'} transition-opacity`}>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                step > i 
                                ? 'bg-emerald-500 border-emerald-500 text-zinc-950' 
                                : step === i 
                                ? 'border-emerald-500 text-emerald-500' 
                                : 'border-zinc-700 text-zinc-500'
                            }`}>
                                {step > i ? <Check size={14} /> : i}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                                {i === 1 ? 'API Keys' : i === 2 ? 'Binaries' : 'Storage'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-[9px] text-zinc-600 font-mono mt-10">
                V1.0.0-RELEASE
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-10 flex flex-col">
            <div className="flex-1">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Metadata Provider</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                MKV Wrapper Pro uses TMDB for automated artwork and metadata fetching. You need a free API Key.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TMDB V3 API Key</label>
                            <div className="relative">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={config.tmdbApiKey}
                                    onChange={(e) => setConfig({ ...config, tmdbApiKey: e.target.value })}
                                    placeholder="e.g. ce9bb4e1..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-emerald-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            </div>
                            <div className="flex justify-end">
                                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 hover:text-emerald-500 underline decoration-zinc-700 underline-offset-4">Get a free key here</a>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Core Executable</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Locate the MakeMKV Console executable (makemkvcon). This handles the optical drive interaction.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MakeMKV Binary Path</label>
                            <div className="relative">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={config.makeMkvPath}
                                    onChange={(e) => setConfig({ ...config, makeMkvPath: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-emerald-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                                <FileCode className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            </div>
                            <p className="text-[10px] text-zinc-600 italic">Default: C:\Program Files (x86)\MakeMKV\makemkvcon.exe</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                     <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Archival Target</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Where should the ripped media be stored? The system will create subfolders for each title.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Output Directory</label>
                            <div className="relative">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={config.outputPath}
                                    onChange={(e) => setConfig({ ...config, outputPath: e.target.value })}
                                    placeholder="D:\Movies"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-emerald-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                                <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-between">
                {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
                {!error && <span />}
                
                <button 
                    onClick={handleNext}
                    className="flex items-center gap-3 bg-white hover:bg-zinc-200 text-black font-black px-8 py-4 rounded-xl transition-all shadow-xl"
                >
                    {step === 3 ? 'FINISH SETUP' : 'NEXT STEP'}
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
