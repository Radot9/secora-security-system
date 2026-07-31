import { ShieldCheck } from "lucide-react";

type BrandMarkProps = {
  size?: "small" | "default" | "large";
  className?: string;
};

export function BrandMark({
  size = "default",
  className = "",
}: BrandMarkProps) {
  const iconSizes = {
    small: "h-5 w-5",
    default: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <span
      aria-hidden="true"
      className={`brand-mark brand-mark--${size} ${className}`}
    >
      <ShieldCheck className={iconSizes[size]} strokeWidth={2.15} />
    </span>
  );
}
