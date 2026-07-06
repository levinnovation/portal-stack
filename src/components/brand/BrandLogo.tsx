import { CoreLogo } from "@/components/brand/CoreLogo";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  tenantId: string;
  brand: string;
  className?: string;
}

export function BrandLogo({ tenantId, brand, className }: BrandLogoProps) {
  if (tenantId === "core") return <CoreLogo className={className} />;
  return <span className={cn("font-display text-2xl tracking-tight", className)}>{brand}</span>;
}
