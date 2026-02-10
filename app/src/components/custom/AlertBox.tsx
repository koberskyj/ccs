import { AlertTriangle, Check, CircleX, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertBoxProps = {
  type: "warning" | "error" | "success" | "info";
} & React.ComponentProps<"div">;

const alertStyles = {
  warning: {
    container: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    text: "text-amber-800",
    IconComponent: AlertTriangle,
  },
  error: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-600",
    text: "text-red-700",
    IconComponent: CircleX,
  },
  success: {
    container: "border-green-200 bg-green-50",
    icon: "text-green-600",
    text: "text-green-700",
    IconComponent: Check,
  },
  info: {
    container: "border-indigo-200 bg-indigo-50",
    icon: "text-indigo-600",
    text: "text-indigo-700",
    IconComponent: Info,
  },
};

export default function AlertBox({ type, className, children, ...props }: AlertBoxProps) {
  const style = alertStyles[type];
  const Icon = style.IconComponent;

  return (
    <div className={cn("border p-2 rounded-md flex w-fit gap-2 shadow-xs animate-in fade-in duration-300", style.container, className)} {...props}>
      <Icon className={cn("shrink-0 mt-0.5", style.icon)} size={20} />
      <span className={cn("text-xs mt-0.5", style.text)}>
        {children}
      </span>
    </div>
  );
}