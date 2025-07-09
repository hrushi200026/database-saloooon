import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & { withGlow?: boolean }
>(({ className, align = "center", sideOffset = 4, withGlow = true, ...props }, ref) => (
  <HoverCardPrimitive.Content asChild>
    <div className="relative group">
      {withGlow && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-0 group-hover:opacity-70 blur-md transition duration-1000 group-hover:duration-200 dark:opacity-0 z-0" />
      )}
      <div
        ref={ref}
        className={cn(
          "relative z-10 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-all duration-300",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          withGlow && "group-hover:shadow-glow dark:group-hover:shadow-glow",
          className
        )}
        {...props}
      />
    </div>
  </HoverCardPrimitive.Content>
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
