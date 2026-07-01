"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WhatIfSimulator({
  baseSpend,
  baseReservations,
}: {
  baseSpend: number;
  baseReservations: number;
}) {
  const [deltaPct, setDeltaPct] = useState(15);
  const projected = useMemo(() => {
    const multiplier = 1 + deltaPct / 100;
    const spend = baseSpend * multiplier;
    const reservations = Math.max(0, Math.round(baseReservations * (1 + (deltaPct * 0.65) / 100)));
    const cpr = reservations > 0 ? spend / reservations : 0;
    return { spend, reservations, cpr };
  }, [baseSpend, baseReservations, deltaPct]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="budget-delta">Ajuste de presupuesto (%)</Label>
        <Input
          id="budget-delta"
          type="number"
          value={deltaPct}
          onChange={(e) => setDeltaPct(Number(e.target.value || 0))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Inversión proyectada" value={`$${projected.spend.toFixed(0)}`} />
        <Stat label="Reservas proyectadas" value={`${projected.reservations}`} />
        <Stat label="Costo/Reserva proyectado" value={`$${projected.cpr.toFixed(0)}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
