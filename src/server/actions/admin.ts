"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/auth";
import { bool, imageUrl, int, list, optFloat, optStr, slugify, str, toCents } from "@/lib/admin-form";
import { changeOrderStatus } from "@/server/orders";
import type { OrderStatusKey } from "@/lib/constants";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { IngredientGroup } from "@/generated/prisma/client";

export type AdminState = { ok: boolean; message: string } | null;

const ok = (message: string): AdminState => ({ ok: true, message });
const fail = (message: string): AdminState => ({ ok: false, message });

function refreshStore() {
  revalidatePath("/", "layout");
}

function isUniqueError(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
}

// ---------------------------------------------------------------- Pedidos

export async function updateOrderStatus(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const orderId = str(fd, "orderId");
  const status = str(fd, "status") as OrderStatusKey;
  if (!(status in ORDER_STATUS_LABEL)) return fail("Status inválido.");
  try {
    await changeOrderStatus(orderId, status, optStr(fd, "note") ?? undefined);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao atualizar.");
  }
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return ok(`Pedido atualizado: ${ORDER_STATUS_LABEL[status]}`);
}

/** Pedido "na entrega" também pode ser marcado como pago na entrega/retirada. */
export async function markPaidOnDelivery(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireAdmin();
  const orderId = str(fd, "orderId");
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "ON_DELIVERY") return fail("Somente para pagamento na entrega.");
  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "APPROVED" } });
  revalidatePath("/admin/pedidos");
  return ok("Pagamento registrado.");
}

// ---------------------------------------------------------------- Produtos

export async function saveProduct(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  const basePrice = toCents(fd.get("basePrice"));
  const compareAtPrice = toCents(fd.get("compareAtPrice"));
  const image = imageUrl(fd, "image");
  if (name.length < 2) return fail("Informe o nome.");
  if (basePrice == null || Number.isNaN(basePrice) || basePrice <= 0) return fail("Preço base inválido.");
  if (compareAtPrice != null && Number.isNaN(compareAtPrice)) return fail("Preço 'de' inválido.");
  if (image === undefined) return fail("Imagem deve ser um caminho /images/... ou uma URL https.");
  const categoryId = str(fd, "categoryId");
  if (!(await db.category.findUnique({ where: { id: categoryId } }))) return fail("Escolha uma categoria.");

  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: str(fd, "description"),
    categoryId,
    basePrice,
    compareAtPrice: compareAtPrice || null,
    hasSizes: bool(fd, "hasSizes"),
    active: bool(fd, "active"),
    available: bool(fd, "available"),
    featured: bool(fd, "featured"),
    dailyDays: fd.getAll("dailyDays").map(Number).filter((n) => n >= 0 && n <= 6),
    tags: list(fd, "tags").map((t) => t.toLowerCase()),
    ingredientsText: optStr(fd, "ingredientsText"),
    allergens: list(fd, "allergens"),
    image,
    kcal: optFloat(fd, "kcal"),
    proteinG: optFloat(fd, "proteinG"),
    carbsG: optFloat(fd, "carbsG"),
    fatG: optFloat(fd, "fatG"),
    fiberG: optFloat(fd, "fiberG"),
    sodiumMg: optFloat(fd, "sodiumMg"),
    nutritionSource: optStr(fd, "nutritionSource"),
    sortOrder: int(fd, "sortOrder"),
  };
  const nutritionCount = [data.kcal, data.proteinG, data.carbsG, data.fatG, data.fiberG, data.sodiumMg].filter((v) => v != null).length;
  if (nutritionCount > 0 && nutritionCount < 6) return fail("Preencha todos os campos nutricionais ou deixe todos em branco.");
  if (nutritionCount === 6 && !data.nutritionSource) return fail("Informe a fonte dos dados nutricionais.");
  if (data.description.length < 5) return fail("Escreva uma descrição.");

  try {
    if (id) await db.product.update({ where: { id }, data });
    else await db.product.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Já existe um produto com esse slug.");
    throw e;
  }
  refreshStore();
  if (!id) redirect("/admin/produtos?criado=1");
  return ok("Produto salvo.");
}

export async function toggleProductFlag(id: string, flag: "available" | "active" | "featured") {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return;
  await db.product.update({ where: { id }, data: { [flag]: !p[flag] } });
  refreshStore();
}

export async function setProductDays(id: string, days: number[]) {
  await requireAdmin();
  await db.product.update({ where: { id }, data: { dailyDays: days.filter((d) => d >= 0 && d <= 6) } });
  refreshStore();
}

export async function deleteProduct(id: string) {
  await requireOwner();
  const used = await db.orderItem.count({ where: { productId: id } });
  // produtos com pedidos são apenas desativados para manter o histórico
  if (used > 0) await db.product.update({ where: { id }, data: { active: false } });
  else await db.product.delete({ where: { id } });
  refreshStore();
}

// ---------------------------------------------------------------- Categorias

export async function saveCategory(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  if (name.length < 2) return fail("Informe o nome.");
  const image = imageUrl(fd, "image");
  if (image === undefined) return fail("Imagem inválida.");
  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: optStr(fd, "description"),
    image,
    sortOrder: int(fd, "sortOrder"),
    active: bool(fd, "active"),
    isCombo: bool(fd, "isCombo"),
  };
  try {
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Slug já usado.");
    throw e;
  }
  refreshStore();
  return ok("Categoria salva.");
}

// ---------------------------------------------------------------- Tamanhos

export async function saveSize(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  const customBasePrice = toCents(fd.get("customBasePrice"));
  if (name.length < 2) return fail("Informe o nome.");
  if (customBasePrice == null || Number.isNaN(customBasePrice) || customBasePrice <= 0) return fail("Preço do configurador inválido.");
  const multiplier = optFloat(fd, "priceMultiplier");
  if (multiplier == null || multiplier <= 0 || multiplier > 10) return fail("Multiplicador deve estar entre 0,1 e 10.");
  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    grams: int(fd, "grams"),
    customBasePrice,
    priceMultiplier: Math.round(multiplier * 10000),
    maxProteins: Math.max(1, int(fd, "maxProteins", 1)),
    maxBases: Math.max(1, int(fd, "maxBases", 1)),
    maxSides: Math.max(0, int(fd, "maxSides")),
    maxAddons: Math.max(0, int(fd, "maxAddons")),
    proteinGrams: Math.max(0, int(fd, "proteinGrams")),
    baseGrams: Math.max(0, int(fd, "baseGrams")),
    sidesGrams: Math.max(0, int(fd, "sidesGrams")),
    sortOrder: int(fd, "sortOrder"),
    active: bool(fd, "active"),
  };
  if (data.grams <= 0) return fail("Informe o peso em gramas.");
  try {
    if (id) await db.size.update({ where: { id }, data });
    else await db.size.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Slug já usado.");
    throw e;
  }
  refreshStore();
  return ok("Tamanho salvo.");
}

// ---------------------------------------------------------------- Estilos e regras

export async function saveStyle(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  if (name.length < 2) return fail("Informe o nome.");
  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: optStr(fd, "description"),
    requireVegetarian: bool(fd, "requireVegetarian"),
    requireVegan: bool(fd, "requireVegan"),
    requireLowCarb: bool(fd, "requireLowCarb"),
    sortOrder: int(fd, "sortOrder"),
    active: bool(fd, "active"),
  };
  try {
    if (id) await db.style.update({ where: { id }, data });
    else await db.style.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Slug já usado.");
    throw e;
  }
  refreshStore();
  return ok("Estilo salvo.");
}

export async function createRule(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const ingredientId = str(fd, "ingredientId");
  const conflictIngredientId = optStr(fd, "conflictIngredientId");
  const sizeId = optStr(fd, "sizeId");
  const description = str(fd, "description");
  if (!ingredientId) return fail("Escolha o ingrediente.");
  if (!conflictIngredientId && !sizeId) return fail("Escolha um ingrediente em conflito ou um tamanho.");
  if (conflictIngredientId === ingredientId) return fail("Escolha ingredientes diferentes.");
  if (description.length < 5) return fail("Escreva a mensagem que o cliente verá.");
  await db.combinationRule.create({ data: { ingredientId, conflictIngredientId, sizeId, description } });
  refreshStore();
  return ok("Regra criada.");
}

export async function toggleRule(id: string) {
  await requireOwner();
  const r = await db.combinationRule.findUnique({ where: { id } });
  if (r) await db.combinationRule.update({ where: { id }, data: { active: !r.active } });
  refreshStore();
}

export async function deleteRule(id: string) {
  await requireOwner();
  await db.combinationRule.deleteMany({ where: { id } });
  refreshStore();
}

// ---------------------------------------------------------------- Ingredientes

const GROUPS: IngredientGroup[] = ["PROTEIN", "BASE", "SIDE", "ADDON"];

export async function saveIngredient(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const name = str(fd, "name");
  const group = str(fd, "group") as IngredientGroup;
  if (name.length < 2) return fail("Informe o nome.");
  if (!GROUPS.includes(group)) return fail("Grupo inválido.");
  const price = toCents(fd.get("price")) ?? 0;
  const extraPrice = toCents(fd.get("extraPrice"));
  if (Number.isNaN(price) || (extraPrice != null && Number.isNaN(extraPrice))) return fail("Preço inválido.");
  const image = imageUrl(fd, "image");
  if (image === undefined) return fail("Imagem inválida.");
  const data = {
    name,
    slug: slugify(str(fd, "slug") || name),
    description: optStr(fd, "description"),
    group,
    price,
    extraPrice: group === "PROTEIN" ? extraPrice : null,
    extraGrams: optFloat(fd, "extraGrams") != null ? Math.round(optFloat(fd, "extraGrams")!) : null,
    available: bool(fd, "available"),
    isVegetarian: bool(fd, "isVegetarian") || bool(fd, "isVegan"),
    isVegan: bool(fd, "isVegan"),
    isLowCarb: bool(fd, "isLowCarb"),
    allergens: list(fd, "allergens"),
    image,
    sortOrder: int(fd, "sortOrder"),
    kcalPer100g: optFloat(fd, "kcalPer100g"),
    proteinPer100g: optFloat(fd, "proteinPer100g"),
    carbsPer100g: optFloat(fd, "carbsPer100g"),
    fatPer100g: optFloat(fd, "fatPer100g"),
    fiberPer100g: optFloat(fd, "fiberPer100g"),
    sodiumMgPer100g: optFloat(fd, "sodiumMgPer100g"),
    nutritionSource: optStr(fd, "nutritionSource"),
  };
  const n = [data.kcalPer100g, data.proteinPer100g, data.carbsPer100g, data.fatPer100g, data.fiberPer100g, data.sodiumMgPer100g].filter((v) => v != null).length;
  if (n > 0 && n < 6) return fail("Preencha todos os campos nutricionais ou deixe todos em branco.");
  if (n === 6 && !data.nutritionSource) return fail("Informe a fonte dos dados nutricionais (ex.: TACO 4ª ed., laudo, fornecedor).");
  try {
    if (id) await db.ingredient.update({ where: { id }, data });
    else await db.ingredient.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Slug já usado.");
    throw e;
  }
  refreshStore();
  if (!id) redirect("/admin/ingredientes?criado=1");
  return ok("Ingrediente salvo.");
}

export async function toggleIngredient(id: string) {
  await requireAdmin();
  const i = await db.ingredient.findUnique({ where: { id } });
  if (i) await db.ingredient.update({ where: { id }, data: { available: !i.available } });
  refreshStore();
}

// ---------------------------------------------------------------- Cupons

export async function saveCoupon(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const code = str(fd, "code").toUpperCase().replace(/\s/g, "");
  const type = str(fd, "type") === "FIXED" ? "FIXED" : "PERCENT";
  const value = type === "FIXED" ? toCents(fd.get("value")) : int(fd, "value");
  const minOrder = toCents(fd.get("minOrder")) ?? 0;
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return fail("Código: 3 a 30 letras/números.");
  if (value == null || Number.isNaN(value) || value <= 0 || (type === "PERCENT" && value > 100)) return fail("Valor do desconto inválido.");
  if (Number.isNaN(minOrder)) return fail("Pedido mínimo inválido.");
  const expires = str(fd, "expiresAt");
  try {
    await db.coupon.create({
      data: {
        code,
        type,
        value,
        minOrder,
        description: optStr(fd, "description"),
        maxUses: str(fd, "maxUses") ? int(fd, "maxUses") : null,
        expiresAt: expires ? new Date(`${expires}T23:59:59-03:00`) : null,
      },
    });
  } catch (e) {
    if (isUniqueError(e)) return fail("Já existe um cupom com esse código.");
    throw e;
  }
  refreshStore();
  return ok(`Cupom ${code} criado.`);
}

export async function toggleCoupon(id: string) {
  await requireOwner();
  const c = await db.coupon.findUnique({ where: { id } });
  if (c) await db.coupon.update({ where: { id }, data: { active: !c.active } });
  refreshStore();
}

// ---------------------------------------------------------------- Configurações

export async function saveSettings(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const whatsapp = str(fd, "whatsappNumber").replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) return fail("WhatsApp inválido (use DDD).");
  const minOrder = toCents(fd.get("minOrder")) ?? 0;
  const freeDeliveryMin = toCents(fd.get("freeDeliveryMin"));
  const redemptionValue = toCents(fd.get("redemptionValue")) ?? 500;
  if ([minOrder, redemptionValue].some(Number.isNaN) || (freeDeliveryMin != null && Number.isNaN(freeDeliveryMin))) return fail("Valor inválido.");
  const heroImage = imageUrl(fd, "heroImage");
  if (heroImage === undefined) return fail("Imagem do banner inválida.");
  await db.storeSettings.update({
    where: { id: "store" },
    data: {
      storeName: str(fd, "storeName") || "Marmifit Camburi",
      whatsappNumber: whatsapp || null,
      phone: optStr(fd, "phone"),
      email: optStr(fd, "email"),
      instagram: optStr(fd, "instagram"),
      pickupAddress: str(fd, "pickupAddress") || "Camburi, São Sebastião - SP",
      heroImage,
      acceptingOrders: bool(fd, "acceptingOrders"),
      minOrder,
      freeDeliveryMin,
      prepTimeMinutes: Math.max(0, int(fd, "prepTimeMinutes", 40)),
      maxScheduleDays: Math.min(30, Math.max(0, int(fd, "maxScheduleDays", 7))),
      pointsPerReal: Math.max(0, int(fd, "pointsPerReal", 1)),
      pointsPerRedemption: Math.max(1, int(fd, "pointsPerRedemption", 100)),
      redemptionValue,
    },
  });
  refreshStore();
  return ok("Configurações salvas.");
}

export async function saveZone(_prev: AdminState, fd: FormData): Promise<AdminState> {
  await requireOwner();
  const id = optStr(fd, "id");
  const district = str(fd, "district");
  const fee = toCents(fd.get("fee"));
  if (district.length < 2) return fail("Informe o bairro.");
  if (fee == null || Number.isNaN(fee)) return fail("Taxa inválida.");
  const data = { district, fee, etaMinutes: Math.max(5, int(fd, "etaMinutes", 45)), active: bool(fd, "active") };
  try {
    if (id) await db.deliveryZone.update({ where: { id }, data });
    else await db.deliveryZone.create({ data });
  } catch (e) {
    if (isUniqueError(e)) return fail("Bairro já cadastrado.");
    throw e;
  }
  refreshStore();
  return ok("Bairro salvo.");
}

export async function toggleMessageHandled(id: string) {
  await requireAdmin();
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (m) await db.contactMessage.update({ where: { id }, data: { handled: !m.handled } });
  revalidatePath("/admin/mensagens");
}

export async function setUserRole(_prev: AdminState, fd: FormData): Promise<AdminState> {
  const me = await requireOwner();
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role");
  if (!["CUSTOMER", "STAFF", "ADMIN"].includes(role)) return fail("Papel inválido.");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return fail("Usuário não encontrado. A pessoa precisa criar uma conta antes.");
  if (user.id === me.id) return fail("Você não pode alterar o próprio papel.");
  await db.user.update({ where: { id: user.id }, data: { role: role as "CUSTOMER" | "STAFF" | "ADMIN" } });
  revalidatePath("/admin/configuracoes");
  return ok(`${user.name} agora é ${role === "ADMIN" ? "administrador" : role === "STAFF" ? "equipe" : "cliente"}.`);
}
