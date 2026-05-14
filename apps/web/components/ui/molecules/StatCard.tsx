import React from 'react';
import { motion } from 'framer-motion';
import { Typography } from '../atoms/Typography';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  amount: React.ReactNode;
  secondaryAmount?: React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'brand' | 'success' | 'error' | 'secondary';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amount,
  secondaryAmount,
  icon,
  trend,
  color = 'brand',
  onClick,
  className = '',
}) => {
  const colorMap = {
    brand: 'text-theme-brand bg-theme-brand/10 border-theme-brand/20',
    success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    error: 'text-red-500 bg-red-500/10 border-red-500/20',
    secondary: 'text-theme-secondary bg-white/5 border-white/10',
  };

  return (
    <Card 
      variant="elevated" 
      onClick={onClick}
      className={`relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all bg-gradient-to-br from-theme-surface to-theme-bg/50 backdrop-blur-sm border-white/5 shadow-theme ${className}`}
    >
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${colorMap[color]} shadow-lg border relative overflow-hidden`}>
            <div className={`absolute inset-0 opacity-20 bg-current blur-lg`} />
            <div className="relative z-10">{icon}</div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Typography variant="tiny" weight="black" color="secondary" className="uppercase tracking-widest opacity-60">
            {label}
          </Typography>
          <div className="flex flex-col">
            <Typography variant="h2" weight="black" className="tracking-tighter">
              {amount}
            </Typography>
            {secondaryAmount && (
              <Typography variant="tiny" color="secondary" className="font-mono opacity-50">
                {secondaryAmount}
              </Typography>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity ${colorMap[color].split(' ')[0]}`} />
    </Card>
  );
};
