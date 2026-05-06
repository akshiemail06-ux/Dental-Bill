"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

function Select({ value, onValueChange, children }: { value?: string, onValueChange?: (v: string) => void, children?: React.ReactNode }) {
  const [internalValue, setInternalValue] = React.useState(value);
  
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <div className="relative group">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            value: internalValue, 
            onValueChange: handleChange 
          });
        }
        return child;
      })}
    </div>
  )
}

function SelectTrigger({ className, children, value, onValueChange, ...props }: any) {
  return (
    <div className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value });
        }
        return child;
      })}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </div>
  )
}

function SelectValue({ placeholder, children, value }: any) {
  return <span className="block truncate">{children || value || placeholder}</span>
}

function SelectContent({ children, value, onValueChange }: any) {
  return (
    <select 
      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="" disabled>Select an option</option>
      {children}
    </select>
  )
}

function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ children }: { children: React.ReactNode }) {
  return <option disabled>{children}</option>
}

function SelectSeparator() {
  return <hr />
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
