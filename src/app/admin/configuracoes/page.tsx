import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionForm, Check, Field } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/admin-form";
import { WEEKDAYS } from "@/lib/hours";
import { getSettings } from "@/server/catalog";
import { saveSettings, saveZone, setUserRole } from "@/server/actions/admin";

export const metadata = { title: "Entrega e horários" };

export default async function SettingsAdmin() {
  await requireOwner();
  const [s, zones, team] = await Promise.all([
    getSettings(),
    db.deliveryZone.findMany({ orderBy: { district: "asc" } }),
    db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, select: { id: true, name: true, email: true, role: true } }),
  ]);
  return (
    <>
      <AdminTitle title="Entrega, horários e loja" />
      <div className="space-y-6">
        <ActionForm action={saveSettings} submitVariant="accent" submitLabel="Salvar configurações" className="space-y-6">
          <Panel title="Loja">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nome da loja" name="storeName" defaultValue={s.storeName} />
              <Field label="WhatsApp (com DDD)" name="whatsappNumber" defaultValue={s.whatsappNumber} placeholder="27 9XXXX-XXXX" hint="Ativa os botões de WhatsApp no site." />
              <Field label="Telefone" name="phone" defaultValue={s.phone} />
              <Field label="E-mail" name="email" type="email" defaultValue={s.email} />
              <Field label="Instagram" name="instagram" defaultValue={s.instagram} placeholder="@marmifit" />
              <Field label="Endereço de retirada" name="pickupAddress" defaultValue={s.pickupAddress} />
              <Field label="Imagem do banner principal" name="heroImage" defaultValue={s.heroImage} placeholder="/images/hero/banner.webp" className="md:col-span-3" />
            </div>
            <div className="mt-4"><Check label="Aceitando pedidos (desmarque para pausar a loja)" name="acceptingOrders" defaultChecked={s.acceptingOrders} /></div>
          </Panel>
          <Panel title="Pedidos e fidelidade">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Field label="Pedido mínimo (R$)" name="minOrder" defaultValue={centsToInput(s.minOrder)} />
              <Field label="Frete grátis acima de (R$)" name="freeDeliveryMin" defaultValue={centsToInput(s.freeDeliveryMin)} hint="Vazio = nunca" />
              <Field label="Tempo de preparo (min)" name="prepTimeMinutes" type="number" defaultValue={s.prepTimeMinutes} />
              <Field label="Agendar até (dias)" name="maxScheduleDays" type="number" defaultValue={s.maxScheduleDays} />
              <Field label="Pontos por R$ 1" name="pointsPerReal" type="number" defaultValue={s.pointsPerReal} />
              <Field label="Pontos por resgate" name="pointsPerRedemption" type="number" defaultValue={s.pointsPerRedemption} />
              <Field label="Valor do resgate (R$)" name="redemptionValue" defaultValue={centsToInput(s.redemptionValue)} />
            </div>
          </Panel>
          <Panel title="Horário de funcionamento">
            <div className="space-y-2">
              {WEEKDAYS.map((d, i) => {
                const h = s.hours.find((x) => x.day === i);
                return (
                  <div key={d} className="grid grid-cols-[110px_1fr_1fr] items-center gap-3 sm:grid-cols-[140px_160px_160px]">
                    <Check label={d} name={`enabled-${i}`} defaultChecked={h?.enabled} />
                    <input type="time" name={`open-${i}`} defaultValue={h?.open ?? "10:30"} aria-label={`Abertura ${d}`} className="h-10 rounded-lg border border-input px-2 text-sm" />
                    <input type="time" name={`close-${i}`} defaultValue={h?.close ?? "15:00"} aria-label={`Fechamento ${d}`} className="h-10 rounded-lg border border-input px-2 text-sm" />
                  </div>
                );
              })}
            </div>
          </Panel>
        </ActionForm>

        <Panel title="Bairros atendidos e taxas">
          <div className="space-y-2">
            {[...zones, null].map((z) => (
              <ActionForm key={z?.id ?? "novo"} action={saveZone} className="grid items-end gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto_auto]" inlineSubmit submitLabel={z ? "Salvar" : "Adicionar"} resetOnSuccess={!z}>
                {z && <input type="hidden" name="id" value={z.id} />}
                <Field label={z ? "Bairro" : "Novo bairro"} name="district" defaultValue={z?.district} required />
                <Field label="Taxa (R$)" name="fee" defaultValue={centsToInput(z?.fee ?? 0)} />
                <Field label="Tempo (min)" name="etaMinutes" type="number" defaultValue={z?.etaMinutes ?? 45} />
                <div className="pb-2"><Check label="Ativo" name="active" defaultChecked={z?.active ?? true} /></div>
              </ActionForm>
            ))}
          </div>
        </Panel>

        <Panel title="Equipe e permissões">
          <ul className="mb-4 space-y-1 text-sm">
            {team.map((u) => (
              <li key={u.id}>{u.name} · {u.email} · <strong>{u.role === "ADMIN" ? "Proprietário" : "Equipe"}</strong></li>
            ))}
          </ul>
          <p className="mb-3 text-xs text-muted-foreground">Equipe pode ver e atualizar pedidos e disponibilidade. Proprietário acessa tudo. A pessoa precisa ter uma conta criada.</p>
          <ActionForm action={setUserRole} className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]" inlineSubmit submitLabel="Aplicar" resetOnSuccess>
            <Field label="E-mail do usuário" name="email" type="email" required />
            <label className="block text-xs font-semibold text-forest">
              Papel
              <select name="role" className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal">
                <option value="STAFF">Equipe</option>
                <option value="ADMIN">Proprietário</option>
                <option value="CUSTOMER">Cliente (remover acesso)</option>
              </select>
            </label>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
