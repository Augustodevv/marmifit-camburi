import { z } from "zod";

const id = z.string().min(1).max(40);

export const customConfigSchema = z.object({
  styleId: id,
  sizeId: id,
  proteinIds: z.array(id).max(10),
  extraProteinIds: z.array(id).max(10).default([]),
  baseIds: z.array(id).max(10),
  sideIds: z.array(id).max(20),
  addonIds: z.array(id).max(20),
  notes: z.string().trim().max(300).optional(),
});

export const cartItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    productId: id,
    sizeId: id.nullable().optional(),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().trim().max(300).optional(),
  }),
  z.object({
    type: z.literal("custom"),
    config: customConfigSchema,
    quantity: z.number().int().min(1).max(50),
  }),
]);

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido (inclua o DDD).");

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  street: z.string().trim().min(2, "Informe a rua").max(120),
  number: z.string().trim().min(1, "Informe o número").max(15),
  complement: z.string().trim().max(60).optional(),
  district: z.string().trim().min(2, "Informe o bairro").max(60),
  city: z.string().trim().min(2).max(60).default("São Sebastião"),
  state: z.string().trim().length(2).default("SP"),
  zip: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, "CEP inválido"),
  reference: z.string().trim().max(120).optional(),
});

export const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1, "Carrinho vazio").max(40),
    customerName: z.string().trim().min(2, "Informe seu nome").max(80),
    customerPhone: phoneSchema,
    customerEmail: z.email("E-mail inválido").max(120).optional().or(z.literal("")),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    address: addressSchema.optional(),
    scheduledFor: z.iso.datetime().nullable().optional(),
    paymentMethod: z.enum(["PIX", "CARD", "ON_DELIVERY"]),
    couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
    usePoints: z.boolean().default(false),
    notes: z.string().trim().max(500).optional(),
    saveAddress: z.boolean().default(false),
  })
  .refine((d) => d.fulfillment === "PICKUP" || !!d.address, {
    message: "Informe o endereço de entrega",
    path: ["address"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Prévia do checkout: só o que afeta o valor. */
export const checkoutQuoteSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(40),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  address: z.object({ district: z.string().trim().max(60) }).optional(),
  scheduledFor: z.iso.datetime().nullable().optional(),
  paymentMethod: z.enum(["PIX", "CARD", "ON_DELIVERY"]),
  couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
  usePoints: z.boolean().default(false),
});
export type CheckoutQuoteInput = z.infer<typeof checkoutQuoteSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const loginSchema = z.object({
  email: z.email("E-mail inválido").trim().toLowerCase(),
  password: z.string().min(1, "Informe a senha").max(100),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.email("E-mail inválido").max(120),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Escreva pelo menos 10 caracteres").max(2000),
});
