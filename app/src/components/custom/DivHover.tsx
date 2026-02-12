
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DivHoverProps = { 
  hoverContent: ReactNode;
  children: ReactNode;
  delayDuration?: number;
} & React.ComponentProps<typeof TooltipContent>;

export default function DivHover({ hoverContent, children, className, delayDuration=250, ...props}: DivHoverProps) {

  return (
    <TooltipProvider>
      <Tooltip delayDuration={delayDuration} disableHoverableContent={true}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent {...props} className={cn("bg-popover text-popover-foreground border border-foreground/20 shadow-lg", className)}>
          {hoverContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};