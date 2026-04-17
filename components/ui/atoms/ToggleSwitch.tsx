import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  activeBg?: string;
  inactiveBg?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  disabled = false,
  activeBg = 'bg-theme-brand shadow-lg shadow-theme-brand/20',
  inactiveBg = 'bg-theme-soft',
  className = '',
}) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${enabled ? activeBg : inactiveBg} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${enabled ? 'left-7' : 'left-1'}`} />
  </button>
);
