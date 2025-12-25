"use client";

import { cn } from "@/lib/utils";

interface ModelCardProps {
  title: string;
  description: string;
  gradient: string;
}

const gradients: Record<string, string> = {
  "lunaby-pro": "from-rose-500 to-amber-400",
  lunaby: "from-purple-500 to-indigo-500",
  "lunaby-vision": "from-cyan-500 to-pink-400",
};

export function ModelCard({ title, description, gradient }: ModelCardProps) {
  const gradientClass = gradients[gradient] || gradients["lunaby"];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-border/80 transition-shadow">
      <div
        className={cn(
          "h-24 p-5 flex items-end bg-gradient-to-br",
          gradientClass
        )}
      >
        <h3 className="text-white text-xl font-bold drop-shadow-md">{title}</h3>
      </div>
      <div className="p-5 flex-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

interface ModelGridProps {
  models: ModelCardProps[];
}

export function ModelGrid({ models }: ModelGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {models.map((model, idx) => (
        <ModelCard key={idx} {...model} />
      ))}
    </div>
  );
}
