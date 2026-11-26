import React from 'react';
import { Droplet, AudioLines, Gauge, Cpu, Layers } from 'lucide-react';
import { DeviceModel } from '../../types/device';

export type ModelIconVariant = DeviceModel | 'ALL';

interface ModelIconProps {
  model: ModelIconVariant | string;
  isActive?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ModelIconProps['size']>, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-7 h-7',
};

/**
 * Mengembalikan kelas warna ikon minimalis sesuai kategori model dan status aktif.
 */
export function getModelAccentColor(model: ModelIconVariant | string, isActive = false): string {
  if (model === 'AquaLink') return isActive ? 'text-sky-300' : 'text-sky-500';
  if (model === 'Ultrasonic') return isActive ? 'text-violet-300' : 'text-violet-500';
  if (model === 'Hybrid' || model === 'Smart Meter Hybrid') {
    return isActive ? 'text-cyan-200' : 'text-cyan-500';
  }
  if (model === 'MIU') return isActive ? 'text-emerald-300' : 'text-emerald-500';
  return isActive ? 'text-amber-300' : 'text-amber-500';
}

/**
 * Ikon vektor minimalis modern (Lucide outline) untuk kategori perangkat IoT Laison.
 */
export const ModelIcon: React.FC<ModelIconProps> = ({
  model,
  isActive = false,
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const colorClass = getModelAccentColor(model, isActive);
  const combined = `${sizeClass} ${colorClass} shrink-0 ${className}`.trim();

  if (model === 'AquaLink') {
    return <Droplet className={combined} strokeWidth={2} />;
  }
  if (model === 'Ultrasonic') {
    return <AudioLines className={combined} strokeWidth={2} />;
  }
  if (model === 'Hybrid' || model === 'Smart Meter Hybrid') {
    return <Gauge className={combined} strokeWidth={2} />;
  }
  if (model === 'MIU') {
    return <Cpu className={combined} strokeWidth={2} />;
  }
  return <Layers className={combined} strokeWidth={2} />;
};
