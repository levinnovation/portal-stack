"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroBlockProps {
  title: string;
  subtitle?: string;
  image?: { url?: string; alt?: string };
  ctaLabel?: string;
  ctaHref?: string;
  background?: "hero" | "gold" | "subtle";
}

export function HeroBlock({ title, subtitle, image, ctaLabel, ctaHref, background = "hero" }: HeroBlockProps) {
  const bg =
    background === "gold" ? "bg-gold" : background === "subtle" ? "bg-subtle" : "bg-hero";

  return (
    <section className={`relative overflow-hidden rounded-lg ${bg} text-primary-foreground`}>
      {image?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt ?? ""} className="absolute inset-0 w-full h-full object-cover opacity-30" />
      )}
      <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 max-w-5xl">
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-4">{title}</h1>
        {subtitle && <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mb-8">{subtitle}</p>}
        {ctaLabel && ctaHref && (
          <Link href={ctaHref}>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
              {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
