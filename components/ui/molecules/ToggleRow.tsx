import React from 'react';
import { ToggleSwitch } from '../atoms/ToggleSwitch';

interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  subtle?: boolean;
  className?: string;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  icon,
  enabled,
  onChange,
  disabled = false,
  badge,
  children,
  subtle = false,
  className = '',
}) => {
  const hasChildren = children !== null && children !== undefined && children !== false;

  return (
    <div className={className}>
      <div className={`flex justify-between items-center ${hasChildren ? 'mb-4' : ''}`}>
        <div className={`flex items-center gap-3 flex-1 ${icon ? '' : ''}`}>
          {icon}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-sm text-theme-primary">{label}</p>
              {badge}
            </div>
            {description && (
              <p className="text-[10px] font-bold leading-tight text-theme-secondary opacity-50 mt-1">{description}</p>
            )}
          </div>
        </div>
        <ToggleSwitch
          enabled={enabled}
          onChange={onChange}
          disabled={disabled}
          activeBg={subtle ? 'bg-theme-brand' : 'bg-theme-brand shadow-lg shadow-theme-brand/20'}
          inactiveBg={subtle ? 'bg-white/10' : 'bg-theme-soft'}
        />
      </div>
      {children}
    </div>
  );
};
