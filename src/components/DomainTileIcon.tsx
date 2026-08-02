import React from 'react';
import { LucideIcon } from 'lucide-react';

export type DomainType = 'kelas' | 'ujian' | 'materi' | 'tugas';

interface DomainTileIconProps {
  type: DomainType;
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DomainTileIcon: React.FC<DomainTileIconProps> = ({
  type,
  icon: Icon,
  size = 'md',
  className = ''
}) => {
  const gradientClass = {
    kelas: 'tile-gradient-kelas',
    ujian: 'tile-gradient-ujian',
    materi: 'tile-gradient-materi',
    tugas: 'tile-gradient-tugas',
  }[type];

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[size];

  return (
    <div
      className={`flex items-center justify-center text-white shrink-0 transition-transform duration-300 group-hover:scale-105 ${gradientClass} ${sizeClasses} ${className}`}
    >
      <Icon className={iconSizes} />
    </div>
  );
};

export default DomainTileIcon;
