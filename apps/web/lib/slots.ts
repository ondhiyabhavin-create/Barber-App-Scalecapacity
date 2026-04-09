import { addMinutes, parse, isAfter } from "date-fns";

export type WorkingHourRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type BusyRange = { start: Date; end: Date };
export type SlotState = { start: Date; available: boolean };

/**
 * Generate candidate slot starts. Assumes `day` is the calendar date in local time.
 */
export function generateSlotsForDay(
  day: Date,
  working: WorkingHourRow[],
  durationMin: number,
  busy: BusyRange[],
  intervalMin = 15
): Date[] {
  const dow = day.getDay();
  const wh = working.find((w) => w.day_of_week === dow);
  if (!wh) return [];

  const start = parse(wh.start_time, "HH:mm:ss", day);
  const end = parse(wh.end_time, "HH:mm:ss", day);
  const slots: Date[] = [];

  let cursor = start;
  while (true) {
    const slotEnd = addMinutes(cursor, durationMin);
    if (isAfter(slotEnd, end)) break;

    const overlaps = busy.some((b) => cursor < b.end && slotEnd > b.start);
    if (!overlaps) {
      slots.push(new Date(cursor));
    }
    cursor = addMinutes(cursor, intervalMin);
  }

  return slots;
}

export function generateSlotStatesForDay(
  day: Date,
  working: WorkingHourRow[],
  durationMin: number,
  busy: BusyRange[],
  intervalMin = 15
): SlotState[] {
  const dow = day.getDay();
  const wh = working.find((w) => w.day_of_week === dow);
  if (!wh) return [];

  const start = parse(wh.start_time, "HH:mm:ss", day);
  const end = parse(wh.end_time, "HH:mm:ss", day);
  const slots: SlotState[] = [];

  let cursor = start;
  while (true) {
    const slotEnd = addMinutes(cursor, durationMin);
    if (isAfter(slotEnd, end)) break;
    const overlaps = busy.some((b) => cursor < b.end && slotEnd > b.start);
    slots.push({ start: new Date(cursor), available: !overlaps });
    cursor = addMinutes(cursor, intervalMin);
  }

  return slots;
}
