import React from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, className = '' }) => (
  <div className={`p-6 border-b border-theme-soft flex justify-between items-center bg-theme-surface/50 shrink-0 ${className}`}>
    <h2 className="text-xl font-black text-theme-primary tracking-tight">{title}</h2>
    <button onClick={onClose} className="p-2 hover:bg-theme-soft rounded-full transition-colors">
      <X size={20} className="text-theme-secondary" />
    </button>
  </div>
);
