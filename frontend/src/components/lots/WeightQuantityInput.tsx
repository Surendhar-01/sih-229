import React from 'react';
import { Scale, Layers, Minus, Plus, Info } from 'lucide-react';

interface WeightQuantityInputProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  weight: number;
  onWeightChange: (weight: number) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  disabled?: boolean;
}

export const WeightQuantityInput: React.FC<WeightQuantityInputProps> = ({
  quantity,
  onQuantityChange,
  weight,
  onWeightChange,
  unit,
  onUnitChange,
  disabled = false,
}) => {
  const quickWeightChips = [
    { label: '0.2 kg (Phone)', val: 0.2 },
    { label: '0.5 kg (Tablet/Accessory)', val: 0.5 },
    { label: '2.2 kg (Laptop)', val: 2.2 },
    { label: '8 kg (CPU Tower)', val: 8.0 },
    { label: '18 kg (TV / Display)', val: 18.0 },
    { label: '45 kg (Appliance)', val: 45.0 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Quantity Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quantity of Items</span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled || quantity <= 1}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="number"
            min="1"
            max="1000"
            disabled={disabled}
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 text-center py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => onQuantityChange(quantity + 1)}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-400">unit(s)</span>
        </div>
      </div>

      {/* Weight Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Estimated Total Weight</span>
          </label>

          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUnitChange('kg')}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition ${
                unit === 'kg' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              kg
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onUnitChange('g')}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition ${
                unit === 'g' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              g
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            step={unit === 'kg' ? '0.1' : '50'}
            min="0.01"
            disabled={disabled}
            value={weight || ''}
            placeholder={unit === 'kg' ? 'e.g. 2.5' : 'e.g. 2500'}
            onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
            className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
          />
          <span className="text-sm font-semibold text-slate-400 w-12">{unit}</span>
        </div>

        {/* Visual Milestone Weight Selector (Mockup feature: 🪣 Bucket, 🧺 Basket, 🎒 Sack) */}
        <div className="pt-2 pb-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
            <span>Visual Weight Estimation (वज़न चुनें)</span>
            <span className="text-emerald-400 font-mono font-bold">{weight ? `${weight} ${unit}` : '0 kg'}</span>
          </div>
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onWeightChange(3.5);
                onUnitChange('kg');
              }}
              className={`flex flex-col items-center gap-0.5 transition-transform ${
                weight > 0 && weight <= 5 ? 'scale-110 text-emerald-400 font-bold' : 'opacity-60 text-slate-400'
              }`}
            >
              <span className="text-lg">🪣</span>
              <span className="text-[10px]">Bucket (1-5kg)</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onWeightChange(14.5);
                onUnitChange('kg');
              }}
              className={`flex flex-col items-center gap-0.5 transition-transform ${
                weight > 5 && weight <= 20 ? 'scale-110 text-emerald-400 font-bold' : 'opacity-60 text-slate-400'
              }`}
            >
              <span className="text-lg">🧺</span>
              <span className="text-[10px]">Basket (5-20kg)</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onWeightChange(35.0);
                onUnitChange('kg');
              }}
              className={`flex flex-col items-center gap-0.5 transition-transform ${
                weight > 20 ? 'scale-110 text-emerald-400 font-bold' : 'opacity-60 text-slate-400'
              }`}
            >
              <span className="text-lg">🎒</span>
              <span className="text-[10px]">Sack (20-50kg)</span>
            </button>
          </div>
          <input
            type="range"
            min="0.5"
            max="50"
            step="0.5"
            disabled={disabled}
            value={unit === 'kg' ? (weight || 1) : ((weight || 1000) / 1000)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onWeightChange(val);
              onUnitChange('kg');
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Quick select chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickWeightChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                onWeightChange(chip.val);
                onUnitChange('kg');
              }}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Approximate weight. Runner will verify with calibrated scale.</span>
        </div>
      </div>
    </div>
  );
};
