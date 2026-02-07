import React, { memo } from 'react';
import { HardDrive, Disc, Activity, History, Settings, RefreshCcw, Server, Link2, Link2Off } from 'lucide-react';
import { AppState, AppView } from '../types';

interface SidebarProps {
  state: AppState;
  onReset: () => void;
  onSwitchView: (view: AppView) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ state, onReset, onSwitchView, onOpenSettings }) => {
  return (
    <aside className="w-80 border-r border-zinc-800 flex flex-col bg-[#0c0c0e]/90 backdrop-blur-xl hidden lg:flex z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Disc className="text-zinc-950" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-zinc-100 whitespace-nowrap">MKV WRAPPER <span className="text-emerald-500">PRO</span></h1>
        </div>

        <nav className="space-y-2">
          <SidebarItem 
            icon={<Activity size={18} />} 
            label="Hardware Monitor" 
            active={state.currentView === 'monitor'} 
            onClick={() => onSwitchView('monitor')}
          />
          <SidebarItem 
            icon={<History size={18} />} 
            label="Master Library" 
            active={state.currentView === 'library'} 
            onClick={() => onSwitchView('library')}
          />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="System Config" 
            onClick={onOpenSettings}
          />
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {/* Server Status Indicator */}
        <div className={`rounded-2xl p-4 border transition-all duration-500 ${
          state.isServerConnected 
            ? 'bg-emerald-500/5 border-emerald-500/20' 
            : 'bg-red-500/5 border-red-500/20'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server size={14} className={state.isServerConnected ? 'text-emerald-500' : 'text-red-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest">Server Bridge</span>
            </div>
            {state.isServerConnected ? <Link2 size={12} className="text-emerald-500" /> : <Link2Off size={12} className="text-red-500" />}
          </div>
          <p className={`text-[11px] font-bold ${state.isServerConnected ? 'text-zinc-300' : 'text-red-400'}`}>
            {state.isServerConnected ? 'LINK ACTIVE (PORT 5005)' : 'NO CONNECTION FOUND'}
          </p>
        </div>

        {state.drive && state.isServerConnected && (
          <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-3">
              <HardDrive className="text-emerald-500" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Optical HW Ready</span>
            </div>
            <p className="text-[11px] font-bold text-zinc-300 truncate mb-1">{state.drive.name}</p>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
               <div className="h-full bg-emerald-500 w-1/3 animate-pulse" />
            </div>
          </div>
        )}

        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
        >
          <RefreshCcw size={14} />
          REBOOT SESSION
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active ? 'bg-emerald-500 text-zinc-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default memo(Sidebar);