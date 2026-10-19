import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { db } from "@/lib/db";
import { SCHEDULE_WINDOW, scheduleSlots } from "@/lib/hours";
import { getSettings } from "@/server/catalog";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

export const metadata: Metadata = { title: "Finalizar pedido", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, zones] = await Promise.all([
    getSettings(),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: { district: "asc" } }),
  ]);
  const now = new Date();
  const slots = scheduleSlots({ hours: SCHEDULE_WINDOW, now, prepTimeMinutes: settings.prepTimeMinutes, maxScheduleDays: settings.maxScheduleDays });

  return (
    <CheckoutForm
      zones={zones.map((z) => ({ district: z.district, fee: z.fee, eta: z.etaMinutes }))}
      slots={slots}
      openNow={settings.acceptingOrders}
      acceptingOrders={settings.acceptingOrders}
      onlinePayment={isMercadoPagoConfigured()}
      pickupAddress={settings.pickupAddress}
      freeDeliveryMin={settings.freeDeliveryMin}
    />
  );
}
