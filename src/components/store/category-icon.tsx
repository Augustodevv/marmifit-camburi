import { Beef, Carrot, CalendarDays, Dumbbell, Leaf, Package, Salad, Soup, Sparkles, Users, Utensils, Briefcase } from "lucide-react";

const ICONS: Record<string, typeof Beef> = {
  tradicionais: Soup,
  "low-carb": Carrot,
  "proteina-extra": Beef,
  vegetarianas: Salad,
  veganas: Leaf,
  executivas: Briefcase,
  fitness: Dumbbell,
  "do-dia": CalendarDays,
  personalizadas: Sparkles,
  "combos-familiares": Users,
  "combos-semanais": Package,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Utensils;
  return <Icon className={className} aria-hidden />;
}
