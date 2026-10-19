import { formatBRL } from "@/lib/pricing";

/** Gráfico de barras simples em SVG (sem dependências). */
export function RevenueChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const w = 100 / data.length;
  return (
    <figure>
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label="Faturamento por dia">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2="100" y1={50 - f * 46} y2={50 - f * 46} stroke="#E3DBC6" strokeWidth="0.2" />
        ))}
        {data.map((d, i) => {
          const h = (d.revenue / max) * 46;
          return (
            <rect key={d.day} x={i * w + w * 0.15} y={50 - h} width={w * 0.7} height={Math.max(h, 0.4)} rx="0.8" fill={i === data.length - 1 ? "#F59E42" : "#43865B"}>
              <title>{`${d.day.split("-").reverse().slice(0, 2).join("/")}: ${formatBRL(d.revenue)} (${d.orders} pedidos)`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.day} className={i % 2 && data.length > 10 ? "hidden sm:inline" : ""}>
            {d.day.slice(8)}/{d.day.slice(5, 7)}
          </span>
        ))}
      </figcaption>
      <table className="sr-only">
        <caption>Faturamento diário</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}><td>{d.day}</td><td>{formatBRL(d.revenue)}</td><td>{d.orders} pedidos</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
