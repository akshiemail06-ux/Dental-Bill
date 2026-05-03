import React from 'react';
import { Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
}

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
        "relative flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300",
        iconClassName
      )}>
        <Stethoscope size={24} strokeWidth={2.5} />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
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
