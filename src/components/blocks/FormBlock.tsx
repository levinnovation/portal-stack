"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "textarea" | "date";
  required?: boolean;
}

export interface FormBlockProps {
  title?: string;
  description?: string;
  submitLabel?: string;
  endpoint: string;
  fields: FormField[];
}

export function FormBlock({ title, description, submitLabel = "Enviar", endpoint, fields }: FormBlockProps) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast({ tone: "error", title: "No se pudo enviar", description: j.error || "Error" });
        return;
      }
      toast({ tone: "success", title: "Enviado" });
      setValues({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-display text-xl mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <Label htmlFor={f.name}>
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  required={f.required}
                  value={values[f.name] || ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "phone" ? "tel" : f.type}
                  required={f.required}
                  value={values[f.name] || ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? "Enviando…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
