import { describe, expect, it } from "vitest";
import { isOpenAt, localParts, scheduleSlots, validateSchedule, type DayHours } from "@/lib/hours";

const hours: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "10:30", close: "15:00", enabled: day !== 0 }));

// 2026-10-19 é segunda-feira. 13:00 UTC = 10:00 em São Paulo (UTC-3)
describe("horários", () => {
  it("converte para o fuso da loja", () => {
    expect(localParts(new Date("2026-10-19T13:00:00Z"))).toMatchObject({ day: 1, minutes: 600 });
  });

  it("respeita abertura, fechamento e dia fechado", () => {
    expect(isOpenAt(hours, new Date("2026-10-19T13:00:00Z"))).toBe(false); // 10:00
    expect(isOpenAt(hours, new Date("2026-10-19T14:00:00Z"))).toBe(true); // 11:00
    expect(isOpenAt(hours, new Date("2026-10-19T18:00:00Z"))).toBe(false); // 15:00
    expect(isOpenAt(hours, new Date("2026-10-18T15:00:00Z"))).toBe(false); // domingo
  });

  it("valida agendamento", () => {
    const now = new Date("2026-10-19T14:00:00Z");
    const base = { hours, now, prepTimeMinutes: 40, maxScheduleDays: 7 };
    expect(validateSchedule({ ...base, scheduledFor: null })).toBeNull();
    expect(validateSchedule({ ...base, scheduledFor: new Date("2026-10-19T14:20:00Z") })).toMatch(/antecedência/);
    expect(validateSchedule({ ...base, scheduledFor: new Date("2026-10-20T15:00:00Z") })).toBeNull();
    expect(validateSchedule({ ...base, scheduledFor: new Date("2026-10-20T20:00:00Z") })).toMatch(/expediente/);
    expect(validateSchedule({ ...base, scheduledFor: new Date("2026-11-20T15:00:00Z") })).toMatch(/dias/);
  });

  it("gera horários só dentro do expediente", () => {
    const slots = scheduleSlots({ hours, now: new Date("2026-10-19T14:00:00Z"), prepTimeMinutes: 40, maxScheduleDays: 1 });
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) expect(isOpenAt(hours, new Date(s.value))).toBe(true);
  });
});
