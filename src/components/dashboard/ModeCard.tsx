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
    <div className="group relative bg-card rounded-lg border border-border overflow-hidden hover:border-[#4a4a54] hover:shadow-[0_6px_24px_rgba(0,0,0,0.4)] transition-all duration-200">
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-16 h-0.5"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-6">
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 border"
        style={{
          backgroundColor: `${accentColor}1a`,
          borderColor: `${accentColor}40`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold tracking-tight mb-1.5">{title}</h2>

      {/* Description */}
      <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>

      {/* Features */}
      <ul className="space-y-1.5 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            {feature}
          </li>
        ))}
      </ul>

      {/* Button */}
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold text-white transition-colors hover:brightness-110"
        style={{ backgroundColor: accentColor }}
      >
        {buttonLabel}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
      </div>
    </div>
  );
}
