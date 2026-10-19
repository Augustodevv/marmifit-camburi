import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isOpenAt, scheduleSlots } from "@/lib/hours";
import { getSettings } from "@/server/catalog";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, user, zones] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: { district: "asc" } }),
  ]);
  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  const now = new Date();
  const slots = scheduleSlots({ hours: settings.hours, now, prepTimeMinutes: settings.prepTimeMinutes, maxScheduleDays: settings.maxScheduleDays });

  return (
    <CheckoutForm
      user={user ? { name: user.name, email: user.email, phone: user.phone ?? "", points: user.loyaltyPoints } : null}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label,
        street: a.street,
        number: a.number,
        complement: a.complement ?? "",
        district: a.district,
        city: a.city,
        state: a.state,
        zip: a.zip,
        reference: a.reference ?? "",
      }))}
      zones={zones.map((z) => ({ district: z.district, fee: z.fee, eta: z.etaMinutes }))}
      slots={slots}
      openNow={settings.acceptingOrders && isOpenAt(settings.hours, now)}
      acceptingOrders={settings.acceptingOrders}
      onlinePayment={isMercadoPagoConfigured()}
      pickupAddress={settings.pickupAddress}
      freeDeliveryMin={settings.freeDeliveryMin}
      loyalty={{ perRedemption: settings.pointsPerRedemption, value: settings.redemptionValue }}
    />
  );
}
