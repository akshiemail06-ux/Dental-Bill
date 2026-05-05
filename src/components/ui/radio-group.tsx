"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function RadioGroup({ className, value, onValueChange, children, ...props }: any) {
  return (
    <div className={cn("grid w-full gap-2", className)} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any;
          return React.cloneElement(child as React.ReactElement<any>, { 
            checked: childProps.value === value,
            onChange: () => onValueChange?.(childProps.value) 
          });
        }
        return child;
      })}
    </div>
  )
}

function RadioGroupItem({ className, value, checked, onChange, id, children, ...props }: any) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {children}
    </div>
  )
}

export { RadioGroup, RadioGroupItem }
