import React, { memo } from 'react';
import { FSMState } from '../types';

interface StatusBarProps {
  status: FSMState;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const steps = [
    { key: FSMState.IDLE, label: 'Detection' },
    { key: FSMState.CHECKING, label: 'Analysis' },
    { key: FSMState.SELECTION, label: 'Selection' },
    { key: FSMState.RIPPING, label: 'Ripping' },
    { key: FSMState.COMPLETED, label: 'Finished' },
  ];

  const getStatusColor = () => {
    if (status === FSMState.ERROR) return 'bg-red-500';
    if (status === FSMState.COMPLETED) return 'bg-emerald-500';
    return 'bg-emerald-500';
  };

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-500">
      <div className="flex items-center gap-8 w-full">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{status}</span>
        </div>

        <div className="flex-1 flex justify-between max-w-2xl mx-auto">
          {steps.map((step, i) => {
            const isCompleted = steps.findIndex(s => s.key === status) >= i || status === FSMState.COMPLETED;
            const isCurrent = step.key === status;
            
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-zinc-800 text-zinc-600'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-tighter transition-colors duration-500 ${
                  isCurrent ? 'text-zinc-100' : isCompleted ? 'text-zinc-400' : 'text-zinc-700'
                }`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && <div className="w-8 h-[1px] bg-zinc-800 ml-2" />}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default memo(StatusBar);