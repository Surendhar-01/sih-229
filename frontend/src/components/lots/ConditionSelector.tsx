import React from 'react';
import { CheckCircle, AlertCircle, Wrench, ShieldAlert, Zap, HelpCircle } from 'lucide-react';

export interface ConditionOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  multiplierText: string;
  color: string;
}

interface ConditionSelectorProps {
  value: string;
  onChange: (condition: string) => void;
  disabled?: boolean;
}

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const conditions: ConditionOption[] = [
    {
      key: 'WORKING',
      label: 'Working Condition',
      description: 'Device powers on and functions normally without major defects.',
      icon: <Zap className="w-4 h-4" />,
      multiplierText: 'Highest Value (~140%)',
      color: 'emerald',
    },
    {
      key: 'PARTIALLY_WORKING',
      label: 'Partially Working',
      description: 'Powers on, but has issues like battery degradation or port damage.',
      icon: <CheckCircle className="w-4 h-4" />,
      multiplierText: 'Standard Value (~100%)',
      color: 'blue',
    },
    {
      key: 'NOT_WORKING',
      label: 'Not Working / Dead',
      description: 'Device does not turn on, but physical chassis is fully intact.',
      icon: <Wrench className="w-4 h-4" />,
      multiplierText: 'Component Value (~80%)',
      color: 'amber',
    },
    {
      key: 'DAMAGED',
      label: 'Physically Damaged',
      description: 'Cracked screen, broken casing, water damage or loose parts.',
      icon: <AlertCircle className="w-4 h-4" />,
      multiplierText: 'Material Value (~65%)',
      color: 'orange',
    },
    {
      key: 'SCRAP_BROKEN',
      label: 'Scrap / Disassembled',
      description: 'Burnt boards, crushed scrap, fragments, or partially stripped.',
      icon: <ShieldAlert className="w-4 h-4" />,
      multiplierText: 'Scrap Base (~45%)',
      color: 'rose',
    },
    {
      key: 'UNKNOWN',
      label: 'Untested / Unknown',
      description: 'Citizen is unsure of internal working status.',
      icon: <HelpCircle className="w-4 h-4" />,
      multiplierText: 'Default Value (~70%)',
      color: 'slate',
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Item Physical & Operational Condition *
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {conditions.map((item) => {
          const isSelected = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.key)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-white">{item.label}</span>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.multiplierText}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
