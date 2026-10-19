import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

const { verifyWebhookSignature } = await import("@/server/mercadopago");

describe("assinatura do webhook Mercado Pago", () => {
  const secret = "segredo-de-teste";
  const ts = "1700000000";
  const manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  it("aceita assinatura válida", () => {
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "123456", secret })).toBe(true);
  });

  it("rejeita assinatura adulterada, de outro pagamento ou ausente", () => {
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=${"0".repeat(64)}`, requestId: "req-1", dataId: "123456", secret })).toBe(false);
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "999", secret })).toBe(false);
    expect(verifyWebhookSignature({ signature: null, requestId: null, dataId: "123456", secret })).toBe(false);
  });
});
