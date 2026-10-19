export const ORDER_STATUS_LABEL = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  READY_FOR_PICKUP: "Pronto para retirada",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABEL;

export const PAYMENT_METHOD_LABEL = {
  PIX: "Pix (Mercado Pago)",
  CARD: "Cartão (Mercado Pago)",
  ON_DELIVERY: "Pagar na entrega/retirada",
} as const;

export const PAYMENT_STATUS_LABEL = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Estornado",
  NOT_REQUIRED: "Na entrega",
} as const;

/** Próximos status permitidos a partir de cada status. */
export const STATUS_FLOW: Record<OrderStatusKey, OrderStatusKey[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["PREPARING", "CANCELED"],
  PREPARING: ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "CANCELED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  READY_FOR_PICKUP: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

export const TRACKING_STEPS: OrderStatusKey[] = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
