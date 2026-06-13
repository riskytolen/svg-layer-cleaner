"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type ModeCardProps = {
  title: string;
  description: string;
  features: string[];
  href: string;
  buttonLabel: string;
  icon: ReactNode;
  accentColor: string;
};

export function ModeCard({
  title,
  description,
  features,
  href,
  buttonLabel,
  icon,
  accentColor,
}: ModeCardProps) {
  return (
    <div className="group relative bg-card rounded-xl border border-border p-8 hover:border-orange-300 hover:shadow-lg transition-all duration-200">
      {/* Accent bar */}
      <div
        className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <div style={{ color: accentColor }}>{icon}</div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2">{title}</h2>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {description}
      </p>

      {/* Features */}
      <ul className="space-y-2 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            {feature}
          </li>
        ))}
      </ul>

      {/* Button */}
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: accentColor }}
      >
        {buttonLabel}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
