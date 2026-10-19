/** Horários e agendamento, sempre no fuso de São Paulo (America/Sao_Paulo). */

export const STORE_TZ = "America/Sao_Paulo";

export interface DayHours {
  day: number; // 0 = domingo
  open: string; // "10:30"
  close: string; // "15:00"
  enabled: boolean;
}

/** A loja não trabalha com expediente: aceita pedidos a qualquer hora (pausa pelo painel). */
export const ALWAYS_OPEN: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "00:00", close: "24:00", enabled: true }));

/** Janela oferecida para agendamentos (evita sugerir horários de madrugada). */
export const SCHEDULE_WINDOW: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "08:00", close: "22:00", enabled: true }));

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function parseHours(value: unknown): DayHours[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((d): d is DayHours => typeof d === "object" && d !== null && "day" in d)
    .map((d) => ({ day: Number(d.day), open: String(d.open), close: String(d.close), enabled: Boolean(d.enabled) }));
}

/** Retorna dia da semana e minutos desde meia-noite no fuso da loja. */
export function localParts(date: Date): { day: number; minutes: number; ymd: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isOpenAt(hours: DayHours[], date: Date): boolean {
  const { day, minutes } = localParts(date);
  const today = hours.find((h) => h.day === day);
  if (!today || !today.enabled) return false;
  return minutes >= toMinutes(today.open) && minutes < toMinutes(today.close);
}

export function todayDailyIndex(date: Date = new Date()): number {
  return localParts(date).day;
}

/**
 * Valida o horário do pedido. Sem agendamento, a loja precisa estar aberta agora.
 * Com agendamento, o horário precisa ser futuro (respeitando o preparo),
 * dentro do limite de dias e dentro do expediente.
 */
export function validateSchedule(opts: {
  hours: DayHours[];
  now: Date;
  scheduledFor: Date | null;
  prepTimeMinutes: number;
  maxScheduleDays: number;
}): string | null {
  const { hours, now, scheduledFor, prepTimeMinutes, maxScheduleDays } = opts;
  if (!scheduledFor) {
    return isOpenAt(hours, now) ? null : "Estamos fechados agora. Agende seu pedido para um horário de funcionamento.";
  }
  const min = now.getTime() + prepTimeMinutes * 60_000;
  if (scheduledFor.getTime() < min) return `Agende com pelo menos ${prepTimeMinutes} minutos de antecedência.`;
  if (scheduledFor.getTime() > now.getTime() + maxScheduleDays * 86_400_000) {
    return `Agendamentos podem ser feitos com até ${maxScheduleDays} dias de antecedência.`;
  }
  if (!isOpenAt(hours, scheduledFor)) return "O horário escolhido está fora do nosso expediente.";
  return null;
}

/** Gera horários disponíveis (a cada 30 min) para os próximos dias. */
export function scheduleSlots(opts: {
  hours: DayHours[];
  now: Date;
  prepTimeMinutes: number;
  maxScheduleDays: number;
}): { value: string; label: string; dayLabel: string }[] {
  const slots: { value: string; label: string; dayLabel: string }[] = [];
  const start = Math.ceil((opts.now.getTime() + opts.prepTimeMinutes * 60_000) / 1_800_000) * 1_800_000;
  const end = opts.now.getTime() + opts.maxScheduleDays * 86_400_000;
  const dayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: STORE_TZ, weekday: "short", day: "2-digit", month: "2-digit" });
  const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: STORE_TZ, hour: "2-digit", minute: "2-digit" });
  for (let t = start; t <= end && slots.length < 200; t += 1_800_000) {
    const d = new Date(t);
    if (isOpenAt(opts.hours, d)) {
      slots.push({ value: d.toISOString(), label: timeFmt.format(d), dayLabel: dayFmt.format(d) });
    }
  }
  return slots;
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: STORE_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
