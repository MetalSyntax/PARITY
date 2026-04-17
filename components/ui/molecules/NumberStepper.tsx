import React from 'react';
import { motion } from 'framer-motion';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  step = 0.1,
  label,
  unit,
  disabled = false,
  className = '',
}) => (
  <div className={`flex items-center justify-between gap-4 bg-theme-bg p-3 rounded-[28px] border border-theme-soft shadow-inner ${className}`}>
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(Number((value - step).toFixed(2)))}
      disabled={disabled}
      className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme-soft shadow-sm hover:bg-theme-soft flex items-center justify-center text-xl font-black transition-all text-theme-primary"
    >
      -
    </motion.button>
    <div className="flex flex-col items-center flex-1">
      {label && <span className="text-[9px] font-black text-theme-secondary opacity-40 uppercase tracking-[0.2em] mb-1">{label}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="text-3xl font-black text-theme-primary bg-transparent text-center w-full outline-none focus:text-theme-brand transition-colors tracking-tighter"
      />
      {unit && <span className="text-[9px] font-black text-theme-secondary opacity-40 uppercase tracking-[0.2em] -mt-1">{unit}</span>}
    </div>
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(Number((value + step).toFixed(2)))}
      disabled={disabled}
      className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme-soft shadow-sm hover:bg-theme-soft flex items-center justify-center text-xl font-black transition-all text-theme-primary"
    >
      +
    </motion.button>
  </div>
);
