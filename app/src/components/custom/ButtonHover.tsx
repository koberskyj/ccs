import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ReactNode } from "react";
import DivHover from "./DivHover";

type ButtonHoverProps = { 
  hoverContent?: ReactNode;
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  };

export default function ButtonHover({ hoverContent, ...props}: ButtonHoverProps) {

  return (
    <DivHover hoverContent={hoverContent}>
      <Button {...props}></Button>
    </DivHover>
  )
};