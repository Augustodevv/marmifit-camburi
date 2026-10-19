import { AdminTitle } from "@/components/admin/page-title";
import { ActionButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/hours";
import { toggleMessageHandled } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Mensagens" };

export default async function MessagesAdmin() {
  await requireAdmin();
  const messages = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <AdminTitle title="Mensagens do site" description="Recebidas pelo formulário de contato." />
      <ul className="space-y-3">
        {messages.length === 0 && <li className="text-muted-foreground">Nenhuma mensagem.</li>}
        {messages.map((m) => (
          <li key={m.id} className={cn("rounded-2xl border bg-white p-5 shadow-soft", m.handled ? "border-cream-300 opacity-60" : "border-tangerine")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-forest">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""} · {formatDateTime(m.createdAt)}
                </p>
              </div>
              <ActionButton run={toggleMessageHandled.bind(null, m.id)} className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-semibold hover:bg-cream">
                {m.handled ? "Reabrir" : "Marcar como respondida"}
              </ActionButton>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
