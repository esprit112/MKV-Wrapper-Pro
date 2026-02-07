import React from 'react';
import { Disc, HardDrive, RefreshCw, AlertCircle, Zap, Loader2, Upload } from 'lucide-react';
import { DriveStatus } from '../types';

interface InsertDiscModalProps {
  status: DriveStatus;
  driveName: string;
  onRefresh: () => void;
  isEjectAlert?: boolean;
}

const InsertDiscModal: React.FC<InsertDiscModalProps> = ({ status, driveName, onRefresh, isEjectAlert }) => {
  const isSpinning = status === 'SPINNING';
  const isOpen = status === 'OPEN';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="max-w-xl w-full flex flex-col items-center text-center">
        {/* Visual Header */}
        <div className="relative mb-12 group">
          <div className={`w-40 h-40 rounded-full flex items-center justify-center border shadow-[0_0_80px_rgba(16,185,129,0.15)] relative overflow-hidden transition-all duration-700 ${
            isEjectAlert ? 'bg-amber-500/10 border-amber-500/40' :
            isSpinning ? 'bg-amber-500/10 border-amber-500/20' : 
            isOpen ? 'bg-blue-500/10 border-blue-500/20' : 
            'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            {isEjectAlert ? (
               <AlertCircle className="text-amber-500 animate-pulse" size={60} strokeWidth={2} />
            ) : isSpinning ? (
               <Loader2 className="text-amber-500 animate-spin" size={60} strokeWidth={2} />
            ) : isOpen ? (
               <Upload className="text-blue-500" size={60} strokeWidth={1.5} />
            ) : (
               <Disc className="text-emerald-500 animate-[spin_6s_linear_infinite]" size={80} strokeWidth={1.5} />
            )}
            
            <div className={`absolute inset-0 bg-gradient-to-t opacity-50 ${
                isEjectAlert || isSpinning ? 'from-amber-500/10' : isOpen ? 'from-blue-500/10' : 'from-emerald-500/10'
            } to-transparent`} />
          </div>

          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 text-zinc-950 rounded-full border-4 border-[#09090b] shadow-xl font-black uppercase tracking-widest text-[10px] ${
             isEjectAlert || isSpinning ? 'bg-amber-500' : isOpen ? 'bg-blue-500' : 'bg-emerald-500'
          }`}>
            <Zap size={14} fill="currentColor" />
            <span>{isEjectAlert ? 'DISC EJECTED' : isSpinning ? 'Reading TOC' : isOpen ? 'Tray Open' : 'Awaiting Media'}</span>
          </div>
        </div>

        {/* Content */}
        <h2 className={`text-4xl font-black tracking-tighter mb-4 uppercase transition-colors duration-500 ${isEjectAlert ? 'text-amber-500' : 'text-white'}`}>
            {isEjectAlert ? 'Process Halted' : isSpinning ? 'Identifying Media' : isOpen ? 'Insert Disc' : 'Insert Your Disc'}
        </h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-sm leading-relaxed font-medium">
          {isEjectAlert 
            ? "Disc ejected. Waiting for the drive tray to close..." 
            : isSpinning 
            ? "The hardware is currently reading the Table of Contents. This may take a moment." 
            : isOpen 
            ? "The drive tray appears to be open. Please place your media on the tray and close it."
            : "The drive tray is detected as closed but empty. Please insert the media you wish to archive."}
        </p>

        {/* Hardware Status Tag */}
        <div className={`w-full glass p-8 rounded-[32px] mb-10 flex flex-col items-center space-y-4 transition-colors duration-500 ${
            isEjectAlert || isSpinning ? 'border-amber-500/20' : isOpen ? 'border-blue-500/20' : 'border-emerald-500/10'
        }`}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)] ${
                 isEjectAlert || isSpinning ? 'bg-amber-500' : isOpen ? 'bg-blue-500' : 'bg-emerald-500'
             }`} />
             <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Device Path Confirmed</span>
          </div>
          <div className="flex items-center gap-4 bg-zinc-950 px-6 py-4 rounded-2xl border border-zinc-800 w-full group transition-all hover:border-zinc-700">
             <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                <HardDrive size={20} />
             </div>
             <div className="text-left flex-1">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-0.5">Hardware Target</div>
                <div className="text-sm font-bold text-zinc-200 truncate">{driveName}</div>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={onRefresh}
            disabled={isSpinning || isEjectAlert}
            className={`w-full flex items-center justify-center gap-3 text-zinc-950 font-black py-5 rounded-[24px] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl group disabled:opacity-50 disabled:cursor-not-allowed ${
                isEjectAlert || isSpinning ? 'bg-amber-500' : isOpen ? 'bg-blue-500 hover:bg-blue-400' : 'bg-emerald-500 hover:bg-emerald-400'
            }`}
          >
            {(isSpinning || isEjectAlert) ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
            {isEjectAlert ? 'RESETTING...' : isSpinning ? 'SCANNING...' : 'RE-SCAN HARDWARE BUS'}
          </button>
          
          <div className="flex items-center gap-2 justify-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
             <span className="w-8 h-[1px] bg-zinc-800" />
             <span>The system will auto-detect once tray closes</span>
             <span className="w-8 h-[1px] bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertDiscModal;