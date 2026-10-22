"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Beef,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CookingPot,
  Leaf,
  Lightbulb,
  Plus,
  Ruler,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Wheat,
  Salad,
  NotebookPen,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/store/cart-store";
import { NutritionTable } from "@/components/store/nutrition-table";
import { Button } from "@/components/ui/button";
import {
  formatBRL,
  groupLimit,
  ingredientBlockReason,
  ingredientFitsStyle,
  quoteCustom,
  type Catalog,
  type CustomConfig,
  type IngredientGroup,
  type PricingIngredient,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

type StepId = "style" | "size" | "PROTEIN" | "BASE" | "SIDE" | "ADDON" | "notes";

const STEPS: { id: StepId; label: string; icon: typeof Beef; title: string; hint: string }[] = [
  { id: "style", label: "Estilo", icon: Sparkles, title: "Qual é o seu estilo hoje?", hint: "O estilo filtra os ingredientes compatíveis." },
  { id: "size", label: "Tamanho", icon: Ruler, title: "Escolha o tamanho", hint: "Cada tamanho tem um limite de escolhas por grupo." },
  { id: "PROTEIN", label: "Proteína", icon: Beef, title: "Escolha a proteína", hint: "Quer mais? Ative a porção extra." },
  { id: "BASE", label: "Base", icon: Wheat, title: "Escolha a base", hint: "A base dá sustância à marmita." },
  { id: "SIDE", label: "Acompanhamentos", icon: Salad, title: "Escolha os acompanhamentos", hint: "Toque de novo para remover ou trocar." },
  { id: "ADDON", label: "Adicionais", icon: Plus, title: "Algum adicional?", hint: "Opcional. Ovos, queijo, legumes extras e molhos." },
  { id: "notes", label: "Revisão", icon: NotebookPen, title: "Observações e revisão", hint: "Conte restrições alimentares ou instruções de preparo." },
];

const GROUP_KEY: Record<IngredientGroup, "proteinIds" | "baseIds" | "sideIds" | "addonIds"> = {
  PROTEIN: "proteinIds",
  BASE: "baseIds",
  SIDE: "sideIds",
  ADDON: "addonIds",
};

const GROUP_TONE: Record<IngredientGroup, string> = {
  PROTEIN: "bg-tangerine-100 text-[#a35a12]",
  BASE: "bg-cream-200 text-[#7a5b2a]",
  SIDE: "bg-leaf-100 text-leaf-700",
  ADDON: "bg-[#efe3f3] text-[#7a3f8f]",
};

const GROUP_ICON: Record<IngredientGroup, typeof Beef> = { PROTEIN: Beef, BASE: Wheat, SIDE: Leaf, ADDON: CookingPot };
/** Ícone de cada estilo (por slug), com fallback pelas restrições. */
const STYLE_ICON: Record<string, typeof Beef> = { tradicional: CookingPot, "low-carb": Salad, vegetariano: Leaf, vegano: Sprout, personalizado: Sparkles };

type IngredientImages = Record<string, { src: string; blur: string }>;

const SUGGESTED_SIDES = ["feijao-carioca", "salada-verde", "brocolis", "abobrinha", "feijao-preto", "cenoura"];

export function Configurator({ catalog, images = {} }: { catalog: Catalog; images?: IngredientImages }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const styles = catalog.styles.filter((s) => s.active);
  const sizes = catalog.sizes.filter((s) => s.active);

  const [step, setStep] = useState(0);
  const [mobileSummary, setMobileSummary] = useState(false);
  const [config, setConfig] = useState<CustomConfig>({
    styleId: styles[0]?.id ?? "",
    sizeId: (sizes.find((s) => s.slug === "media") ?? sizes[0])?.id ?? "",
    proteinIds: [],
    extraProteinIds: [],
    baseIds: [],
    sideIds: [],
    addonIds: [],
    notes: "",
  });

  const quote = useMemo(() => quoteCustom(catalog, config), [catalog, config]);
  const size = sizes.find((s) => s.id === config.sizeId);
  const style = styles.find((s) => s.id === config.styleId);
  const byId = useMemo(() => new Map(catalog.ingredients.map((i) => [i.id, i])), [catalog]);
  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const stepsRef = useRef<HTMLOListElement>(null);

  // no celular, mantém a etapa atual visível na fila de etapas
  useEffect(() => {
    const el = stepsRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [step]);

  /** Remove escolhas que deixaram de ser válidas (estilo/tamanho/regras). */
  function sanitize(next: CustomConfig): CustomConfig {
    const nextStyle = styles.find((s) => s.id === next.styleId);
    const nextSize = sizes.find((s) => s.id === next.sizeId);
    const removed: string[] = [];
    const out = { ...next };
    (Object.keys(GROUP_KEY) as IngredientGroup[]).forEach((g) => {
      const key = GROUP_KEY[g];
      let ids = out[key].filter((id) => {
        const ing = byId.get(id);
        const ok = ing && ing.available && ingredientFitsStyle(ing, nextStyle) && !catalog.rules.some((r) => r.active && r.ingredientId === id && r.sizeId && r.sizeId === next.sizeId);
        if (!ok && ing) removed.push(ing.name);
        return ok;
      });
      const max = groupLimit(nextSize, g);
      if (ids.length > max) {
        ids.slice(max).forEach((id) => removed.push(byId.get(id)!.name));
        ids = ids.slice(0, max);
      }
      out[key] = ids;
    });
    out.extraProteinIds = out.extraProteinIds.filter((id) => out.proteinIds.includes(id));
    if (removed.length) toast(`Ajustamos sua marmita`, { description: `Removido: ${removed.join(", ")}` });
    return out;
  }

  function toggle(ing: PricingIngredient) {
    const key = GROUP_KEY[ing.group];
    const list = config[key];
    if (list.includes(ing.id)) {
      setConfig({
        ...config,
        [key]: list.filter((id) => id !== ing.id),
        extraProteinIds: config.extraProteinIds.filter((id) => id !== ing.id),
      });
      return;
    }
    const reason = ingredientBlockReason(catalog, config, ing);
    if (reason) {
      toast.error(reason);
      return;
    }
    const max = groupLimit(size, ing.group);
    if (max === 1) {
      // substitui direto quando só cabe um
      setConfig({ ...config, [key]: [ing.id], extraProteinIds: ing.group === "PROTEIN" ? [] : config.extraProteinIds });
      return;
    }
    if (list.length >= max) {
      toast(`Limite de ${max} no tamanho ${size?.name}`, { description: "Remova um item para trocar." });
      return;
    }
    setConfig({ ...config, [key]: [...list, ing.id] });
  }

  function toggleExtra(id: string) {
    setConfig((c) => ({
      ...c,
      extraProteinIds: c.extraProteinIds.includes(id) ? c.extraProteinIds.filter((x) => x !== id) : [...c.extraProteinIds, id],
    }));
  }

  const stepError = (() => {
    if (current.id === "PROTEIN" && config.proteinIds.length === 0) return "Escolha pelo menos uma proteína.";
    if (current.id === "BASE" && config.baseIds.length === 0) return "Escolha pelo menos uma base.";
    return null;
  })();

  function next() {
    if (stepError) {
      toast.error(stepError);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart() {
    if (!quote.ok) {
      toast.error("Revise sua marmita", { description: quote.errors.join(" ") });
      return;
    }
    add({
      type: "custom",
      config: { ...config, notes: config.notes?.trim() || undefined },
      name: "Marmita personalizada",
      description: quote.description,
      sizeLabel: size ? `${size.name} (${size.grams} g)` : null,
      unitPrice: quote.unitPrice,
    });
    toast.success("Marmita personalizada no carrinho!", { action: { label: "Ver carrinho", onClick: () => router.push("/carrinho") } });
    setConfig((c) => ({ ...c, proteinIds: [], extraProteinIds: [], baseIds: [], sideIds: [], addonIds: [], notes: "" }));
    setStep(2);
  }

  const groupItems = (g: IngredientGroup) => catalog.ingredients.filter((i) => i.group === g);

  const suggestions =
    current.id === "SIDE"
      ? SUGGESTED_SIDES.map((slug) => catalog.ingredients.find((i) => i.slug === slug))
          .filter((i): i is PricingIngredient => !!i && !config.sideIds.includes(i.id) && !ingredientBlockReason(catalog, config, i))
          .slice(0, 3)
      : [];

  const summary = (
    <Summary
      config={config}
      byId={byId}
      sizeLabel={size ? `${size.name} · ${size.grams} g` : "—"}
      styleLabel={style?.name ?? "—"}
      quote={quote}
      onRemove={(ing) => toggle(ing)}
    />
  );

  return (
    <div className="container-page grid grid-cols-1 gap-8 pb-32 pt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-16">
      <div>
        {/* Indicador de etapas */}
        <nav aria-label="Etapas" className="-mx-4 overflow-x-auto px-4">
          <ol ref={stepsRef} className="flex min-w-max gap-2">
            {STEPS.map((s, i) => {
              const done = i < step;
              const isCurrent = i === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => (i <= step || !stepError ? setStep(i) : toast.error(stepError))}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      isCurrent && "border-forest bg-forest text-cream",
                      done && "border-leaf-700/40 bg-leaf-100 text-leaf-700",
                      !isCurrent && !done && "border-cream-300 bg-white text-muted-foreground hover:text-forest",
                    )}
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-full text-[10px]", isCurrent ? "bg-tangerine text-forest" : done ? "bg-leaf-700 text-white" : "bg-cream-200")}>
                      {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-cream-300/60"
              role="progressbar"
              aria-label="Progresso da montagem"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf to-tangerine" animate={{ width: `${progress}%` }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} />
            </div>
            <span className="text-xs font-bold tabular-nums text-forest">{progress}%</span>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.section
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
            aria-labelledby="step-title"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">
                  Etapa {step + 1} de {STEPS.length}
                </p>
                <h2 id="step-title" className="mt-1 text-3xl font-semibold text-forest">{current.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
              </div>
              {(["PROTEIN", "BASE", "SIDE", "ADDON"] as StepId[]).includes(current.id) && size && (
                <p className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-forest shadow-soft" aria-live="polite">
                  {config[GROUP_KEY[current.id as IngredientGroup]].length} de {groupLimit(size, current.id as IngredientGroup)} escolhidos
                </p>
              )}
            </div>

            <div className="mt-6">
              {current.id === "style" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {styles.map((s) => (
                    <OptionCard
                      key={s.id}
                      selected={config.styleId === s.id}
                      onClick={() => setConfig(sanitize({ ...config, styleId: s.id }))}
                      title={s.name}
                      subtitle={
                        s.requireVegan ? "Somente vegetais" : s.requireVegetarian ? "Sem carnes" : s.requireLowCarb ? "Menos carboidrato" : "Sem restrições"
                      }
                      icon={STYLE_ICON[s.slug] ?? (s.requireVegan ? Sprout : s.requireVegetarian ? Leaf : s.requireLowCarb ? Salad : CookingPot)}
                    />
                  ))}
                </div>
              )}

              {current.id === "size" && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {sizes.map((s) => (
                    <OptionCard
                      key={s.id}
                      selected={config.sizeId === s.id}
                      onClick={() => setConfig(sanitize({ ...config, sizeId: s.id }))}
                      title={s.name}
                      subtitle={`${s.grams} g · até ${s.maxProteins} prot., ${s.maxBases} base${s.maxBases > 1 ? "s" : ""}, ${s.maxSides} acomp.`}
                      price={formatBRL(s.customBasePrice)}
                      icon={Ruler}
                    />
                  ))}
                </div>
              )}

              {(["PROTEIN", "BASE", "SIDE", "ADDON"] as const).map(
                (g) =>
                  current.id === g && (
                    <div key={g}>
                      {suggestions.length > 0 && (
                        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card bg-white p-3 text-sm shadow-soft">
                          <Lightbulb className="size-4 text-tangerine" aria-hidden />
                          <span className="font-semibold text-forest">Combina bem:</span>
                          {suggestions.map((s) => (
                            <button key={s.id} type="button" onClick={() => toggle(s)} className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-700 hover:bg-leaf hover:text-white">
                              + {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {groupItems(g).map((ing) => {
                          const selected = config[GROUP_KEY[g]].includes(ing.id);
                          const reason = selected ? null : ingredientBlockReason(catalog, config, ing);
                          return (
                            <IngredientCard
                              key={ing.id}
                              ing={ing}
                              image={images[ing.id]}
                              selected={selected}
                              disabledReason={reason}
                              onClick={() => toggle(ing)}
                              extra={
                                g === "PROTEIN" && selected && ing.extraPrice != null
                                  ? { on: config.extraProteinIds.includes(ing.id), price: ing.extraPrice, grams: ing.extraGrams, toggle: () => toggleExtra(ing.id) }
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  ),
              )}

              {current.id === "notes" && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="cfg-notes" className="text-sm font-bold text-forest">
                      Observações <span className="font-normal text-muted-foreground">(opcional)</span>
                    </label>
                    <textarea
                      id="cfg-notes"
                      rows={4}
                      maxLength={300}
                      value={config.notes ?? ""}
                      onChange={(e) => setConfig({ ...config, notes: e.target.value })}
                      placeholder="Ex.: sem sal no feijão, molho à parte, intolerância a lactose..."
                      className="mt-2 w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{(config.notes ?? "").length}/300</p>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-forest">Informação nutricional estimada pela composição</h3>
                    <div className="mt-2">
                      <NutritionTable data={quote.nutrition} note="Calculada a partir dos dados cadastrados de cada ingrediente e das gramas do tamanho." />
                    </div>
                  </div>
                  {!quote.ok && (
                    <ul className="space-y-1 rounded-xl bg-tangerine-100 p-4 text-sm text-forest">
                      {quote.errors.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="size-4" aria-hidden /> Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="lg" onClick={next}>
              Continuar <ChevronRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button size="lg" variant="accent" onClick={addToCart} disabled={!quote.ok}>
              <ShoppingBag className="size-4" aria-hidden /> Adicionar ao carrinho
            </Button>
          )}
        </div>
      </div>

      {/* Resumo fixo no desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-panel border border-cream-300 bg-white p-6 shadow-lift">
          {summary}
          <Button size="xl" variant="accent" className="mt-6 w-full" onClick={addToCart} disabled={!quote.ok}>
            <ShoppingBag className="size-5" aria-hidden /> Adicionar · {formatBRL(quote.unitPrice)}
          </Button>
          {!quote.ok && <p className="mt-2 text-center text-xs text-muted-foreground">Complete proteína e base para adicionar.</p>}
        </div>
      </aside>

      {/* Resumo inferior no celular */}
      <div data-mobile-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-white/95 shadow-lift backdrop-blur lg:hidden">
        <AnimatePresence>
          {mobileSummary && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="max-h-[55vh] overflow-y-auto px-4 pt-4">{summary}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => setMobileSummary((v) => !v)} className="flex flex-1 items-center gap-2 text-left" aria-expanded={mobileSummary}>
            <ChevronUp className={cn("size-5 text-forest transition", mobileSummary && "rotate-180")} aria-hidden />
            <span>
              <span className="block text-xs text-muted-foreground">Sua marmita</span>
              <motion.span key={quote.unitPrice} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="block font-display text-xl font-semibold text-forest">
                {formatBRL(quote.unitPrice)}
              </motion.span>
            </span>
          </button>
          <Button size="lg" variant="accent" onClick={step < STEPS.length - 1 ? next : addToCart} disabled={step === STEPS.length - 1 && !quote.ok}>
            {step < STEPS.length - 1 ? "Continuar" : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  price,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  price?: string;
  icon: typeof Beef;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex items-start gap-4 rounded-card border-2 bg-white p-5 text-left transition",
        selected ? "border-leaf-700 shadow-lift" : "border-cream-300 hover:-translate-y-0.5 hover:border-leaf/50 hover:shadow-soft",
      )}
    >
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl transition", selected ? "bg-leaf-700 text-white" : "bg-leaf-100 text-leaf-700")}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-display text-xl font-semibold text-forest">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{subtitle}</span>
        {price && <span className="mt-2 block text-sm font-bold text-leaf-700">{price}</span>}
      </span>
      <SelectedMark on={selected} />
    </motion.button>
  );
}

function SelectedMark({ on }: { on: boolean }) {
  return (
    <AnimatePresence>
      {on && (
        <motion.span
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-leaf-700 text-white"
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function IngredientCard({
  ing,
  image,
  selected,
  disabledReason,
  onClick,
  extra,
}: {
  ing: PricingIngredient;
  image?: { src: string; blur: string };
  selected: boolean;
  disabledReason: string | null;
  onClick: () => void;
  extra?: { on: boolean; price: number; grams: number | null; toggle: () => void };
}) {
  const Icon = GROUP_ICON[ing.group];
  const disabled = !!disabledReason;
  return (
    <div className={cn("relative rounded-card border-2 bg-white transition", selected ? "border-leaf-700 shadow-lift" : "border-cream-300 hover:border-leaf/50", disabled && "opacity-60")}>
      <motion.button
        type="button"
        whileTap={disabled ? undefined : { scale: 0.97 }}
        onClick={onClick}
        aria-pressed={selected}
        aria-disabled={disabled}
        aria-describedby={disabled ? `why-${ing.id}` : undefined}
        className={cn("flex w-full items-center gap-3 p-4 text-left", disabled ? "cursor-not-allowed" : "hover:bg-cream/40")}
      >
        <motion.span
          animate={selected ? { rotate: [0, -12, 10, 0], scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.45 }}
          className={cn("relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl", GROUP_TONE[ing.group])}
        >
          {image ? (
            <Image src={image.src} alt="" fill sizes="56px" placeholder="blur" blurDataURL={image.blur} className="object-cover" />
          ) : (
            <Icon className="size-6" aria-hidden />
          )}
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-tight text-forest">{ing.name}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {ing.isVegan ? <Tag>Vegano</Tag> : ing.isVegetarian ? <Tag>Vegetariano</Tag> : null}
            {ing.isLowCarb && <Tag>Low carb</Tag>}
            {ing.allergens.length > 0 && <Tag tone="warn">{ing.allergens.join(", ")}</Tag>}
          </span>
          {disabled ? (
            <span id={`why-${ing.id}`} className="mt-1 block text-xs font-medium text-destructive">{disabledReason}</span>
          ) : (
            <span className="mt-1 block text-sm font-bold text-leaf-700">{ing.price > 0 ? `+ ${formatBRL(ing.price)}` : "Incluso"}</span>
          )}
        </span>
      </motion.button>
      <SelectedMark on={selected} />
      {extra && (
        <label className="flex cursor-pointer items-center justify-between gap-2 border-t border-cream-300 px-4 py-2.5 text-sm">
          <span className="font-medium text-forest">
            Porção extra{extra.grams ? ` (+${extra.grams} g)` : ""} <span className="text-leaf-700">+ {formatBRL(extra.price)}</span>
          </span>
          <input type="checkbox" checked={extra.on} onChange={extra.toggle} className="size-5 accent-[#43865B]" />
        </label>
      )}
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tone === "warn" ? "bg-tangerine-100 text-[#8a4a0c]" : "bg-leaf-100 text-leaf-700")}>
      {children}
    </span>
  );
}

function Summary({
  config,
  byId,
  sizeLabel,
  styleLabel,
  quote,
  onRemove,
}: {
  config: CustomConfig;
  byId: Map<string, PricingIngredient>;
  sizeLabel: string;
  styleLabel: string;
  quote: ReturnType<typeof quoteCustom>;
  onRemove: (ing: PricingIngredient) => void;
}) {
  const groups: [string, string[], IngredientGroup][] = [
    ["Proteína", config.proteinIds, "PROTEIN"],
    ["Base", config.baseIds, "BASE"],
    ["Acompanhamentos", config.sideIds, "SIDE"],
    ["Adicionais", config.addonIds, "ADDON"],
  ];
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">Resumo</p>
      <h3 className="mt-1 text-2xl font-semibold text-forest">Sua marmita</h3>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-cream p-3">
          <dt className="text-xs text-muted-foreground">Estilo</dt>
          <dd className="font-semibold text-forest">{styleLabel}</dd>
        </div>
        <div className="rounded-xl bg-cream p-3">
          <dt className="text-xs text-muted-foreground">Tamanho</dt>
          <dd className="font-semibold text-forest">{sizeLabel}</dd>
        </div>
      </dl>
      {/* bandeja: um compartimento por grupo, colorido quando preenchido */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-forest p-2 shadow-inner">
        {groups.map(([label, ids, g]) => (
          <div
            key={label}
            className={cn(
              "min-h-24 rounded-xl p-2.5 transition-colors duration-300",
              ids.length ? GROUP_TONE[g] : "border border-dashed border-cream/25 text-cream/70",
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide">{label}</p>
            {ids.length === 0 ? (
              <p className="mt-1 text-xs">Vazio</p>
            ) : (
              <ul className="mt-1.5 flex flex-wrap gap-1">
                <AnimatePresence>
                  {ids.map((id) => {
                    const ing = byId.get(id);
                    if (!ing) return null;
                    return (
                      <motion.li key={id} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                        <button
                          type="button"
                          onClick={() => onRemove(ing)}
                          className="group flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-forest shadow-soft hover:bg-white hover:text-destructive"
                          aria-label={`Remover ${ing.name}`}
                        >
                          {ing.name}
                          {config.extraProteinIds.includes(id) && " (extra)"}
                          <span aria-hidden className="text-muted-foreground group-hover:text-destructive">×</span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        ))}
      </div>
      {quote.allergens.length > 0 && (
        <p className="mt-4 flex gap-2 rounded-xl bg-tangerine-100 p-3 text-xs text-forest">
          <ShieldAlert className="size-4 shrink-0 text-[#a35a12]" aria-hidden /> Contém: {quote.allergens.join(", ")}
        </p>
      )}
      <div className="mt-5 space-y-1 border-t border-dashed border-cream-300 pt-4 text-sm">
        {quote.breakdown.map((b, i) => (
          <div key={i} className="flex justify-between gap-2 text-muted-foreground">
            <span>{b.label}</span>
            <span className="tabular-nums">{formatBRL(b.amount)}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between pt-2">
          <span className="font-semibold text-forest">Total</span>
          <motion.span key={quote.unitPrice} initial={{ scale: 1.15, color: "#F59E42" }} animate={{ scale: 1, color: "#163B2E" }} className="font-display text-3xl font-semibold tabular-nums">
            {formatBRL(quote.unitPrice)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
