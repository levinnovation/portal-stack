"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Re-consulta los datos del servidor (revalida la ruta). Las páginas usan
// `force-dynamic` + `revalidate`, así que esto trae lo más reciente de las fuentes.
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function onClick() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 600);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
      Actualizar
    </button>
  );
}
