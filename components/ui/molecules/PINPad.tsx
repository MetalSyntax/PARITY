import React from 'react';
import { Delete } from 'lucide-react';

interface PINPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  className?: string;
}

export const PINPad: React.FC<PINPadProps> = ({ onDigit, onDelete, className = '' }) => (
  <div className={`grid grid-cols-3 gap-6 w-full px-4 ${className}`}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
      <button
        key={num}
        onClick={() => onDigit(num.toString())}
        className="w-full aspect-square rounded-full bg-theme-soft hover:bg-theme-surface border border-theme-soft text-2xl font-black text-theme-primary transition-all active:scale-95 flex items-center justify-center shadow-sm"
      >
        {num}
      </button>
    ))}
    <div />
    <button
      onClick={() => onDigit('0')}
      className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
    >
      0
    </button>
    <button
      onClick={onDelete}
      className="w-full aspect-square rounded-full flex items-center justify-center text-theme-secondary hover:text-white"
    >
      <Delete size={24} />
    </button>
  </div>
);
