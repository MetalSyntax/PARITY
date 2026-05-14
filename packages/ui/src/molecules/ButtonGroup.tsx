import React from 'react';

interface ButtonGroupProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  className = '',
}) => (
  <div className={`flex gap-2 mt-4 ${className}`}>
    <button
      onClick={onCancel}
      className="flex-1 py-3 text-xs font-black text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest"
    >
      {cancelLabel}
    </button>
    <button
      onClick={onConfirm}
      className="flex-1 py-3 bg-theme-brand text-white rounded-xl text-xs font-black shadow-lg shadow-theme-brand/30 uppercase tracking-widest"
    >
      {confirmLabel}
    </button>
  </div>
);
