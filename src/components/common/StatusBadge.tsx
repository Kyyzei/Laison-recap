import React from 'react';
import { DeviceStatus } from '../../types/device';

interface StatusBadgeProps {
  status: DeviceStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'Aktif':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'Terpasang':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-600';
      break;
    case 'Stok':
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      dotColor = 'bg-slate-500';
      break;
    case 'Rusak':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      dotColor = 'bg-rose-500';
      break;
    case 'Maintenance':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'Dipinjamkan':
      badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
    default:
      badgeStyle = 'bg-slate-50 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
  }

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap ${sizeClass} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status || 'Stok'}
    </span>
  );
};
