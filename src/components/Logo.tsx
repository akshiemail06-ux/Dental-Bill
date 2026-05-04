import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
}

const IdBLogoIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <text 
      x="50%" 
      y="58%" 
      dominantBaseline="middle" 
      textAnchor="middle" 
      fill="currentColor" 
      style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: '260px', letterSpacing: '-14px' }}
    >
      IdB
    </text>
  </svg>
);

export function Logo({ 
  className, 
  iconClassName, 
  textClassName, 
  subtitleClassName,
  showText = true 
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300",
        iconClassName
      )}>
        <IdBLogoIcon size={22} />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xl font-bold tracking-tight text-gray-900 leading-tight block truncate max-w-[200px]",
            textClassName
          )}>
            Instant<span className="text-blue-600">Dental</span>Bill
          </span>
          <span className={cn(
            "text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] leading-none block",
            subtitleClassName
          )}>
            Smart Clinic ERP
          </span>
        </div>
      )}
    </div>
  );
}
