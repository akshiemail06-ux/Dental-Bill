"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (v: string) => void;
  items: Record<string, React.ReactNode>;
  registerItem: (val: string, label: React.ReactNode) => void;
} | null>(null);

function Select({ value, onValueChange, children }: { value?: string, onValueChange?: (v: string) => void, children?: React.ReactNode }) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [items, setItems] = React.useState<Record<string, React.ReactNode>>({});
  
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };

  const registerItem = React.useCallback((val: string, label: React.ReactNode) => {
    setItems(prev => {
      if (prev[val] === label) return prev;
      return { ...prev, [val]: label };
    });
  }, []);

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleChange, items, registerItem }}>
      <div className="relative group">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, children, ...props }: any) {
  return (
    <div className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )} {...props}>
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </div>
  )
}

function SelectValue({ placeholder, children }: any) {
  const context = React.useContext(SelectContext);
  const displayValue = children || (context?.value ? context.items[context.value] : null) || placeholder;
  return <span className="block truncate">{displayValue}</span>
}

function SelectContent({ children }: any) {
  const context = React.useContext(SelectContext);
  return (
    <select 
      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
      value={context?.value || ""}
      onChange={(e) => context?.onValueChange?.(e.target.value)}
    >
      <option value="" disabled>{context?.items[""] || "Select an option"}</option>
      {children}
    </select>
  )
}

function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  const context = React.useContext(SelectContext);
  
  React.useEffect(() => {
    if (value !== undefined) {
      context?.registerItem(value, children);
    }
  }, [value, children, context]);

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
