"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  value: any;
  onValueChange: (v: any) => void;
} | null>(null);

function RadioGroup({ className, value, onValueChange, children, ...props }: any) {
  const contextValue = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  
  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={cn("grid w-full gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({ className, value, id, ...props }: any) {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }

  const checked = context.value === value;
  const onChange = () => context.onValueChange(value);

  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
