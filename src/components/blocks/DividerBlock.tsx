export function DividerBlock({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-4" : size === "lg" ? "h-16" : "h-10";
  return <div className={h} />;
}
