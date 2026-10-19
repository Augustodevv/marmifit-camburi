import type { Nutrition } from "@/lib/pricing";

const fmt = (n: number, d = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });

/** Exibe nutrição somente quando há dados verificados; nunca estima. */
export function NutritionTable({
  data,
  source,
  note,
}: {
  data: Omit<Nutrition, "grams"> & { grams?: number } | null;
  source?: string | null;
  note?: string;
}) {
  if (!data) {
    return (
      <p className="rounded-xl border border-dashed border-cream-300 bg-white p-4 text-sm text-muted-foreground">
        Informação nutricional ainda não disponível para esta composição. Publicamos apenas valores verificados.
      </p>
    );
  }
  const rows: [string, string][] = [
    ["Valor energético", `${fmt(data.kcal, 0)} kcal`],
    ["Proteínas", `${fmt(data.protein)} g`],
    ["Carboidratos", `${fmt(data.carbs)} g`],
    ["Gorduras totais", `${fmt(data.fat)} g`],
    ["Fibras", `${fmt(data.fiber)} g`],
    ["Sódio", `${fmt(data.sodiumMg, 0)} mg`],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-cream-300 bg-white">
      <table className="w-full text-sm">
        <caption className="bg-cream-200/60 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-forest">
          Por porção{data.grams ? ` (${data.grams} g)` : ""}
        </caption>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-cream-300/70">
              <th scope="row" className="px-4 py-2 text-left font-medium text-forest">{k}</th>
              <td className="px-4 py-2 text-right tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(source || note) && (
        <p className="border-t border-cream-300/70 px-4 py-2 text-xs text-muted-foreground">
          {note}
          {source ? ` Fonte: ${source}.` : ""}
        </p>
      )}
    </div>
  );
}
