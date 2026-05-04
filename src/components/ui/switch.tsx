"use client"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<"input"> & {
  size?: "sm" | "default"
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <div className={cn("relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2", 
      size === "sm" ? "h-5 w-9" : "h-6 w-11",
      checked ? "bg-blue-600" : "bg-gray-200",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0"
        )}
      />
    </div>
  )
}

export { Switch }
