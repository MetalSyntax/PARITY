import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 16, className = '' }) => (
  <RefreshCw size={size} className={`animate-spin ${className}`} />
);
