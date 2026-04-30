import { addMinutes, formatISO, isBefore, parseISO, startOfDay } from "date-fns";

import { AppError } from "@/lib/http/errors";

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string, options?: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify({ timeZone, options });

  if (!dateFormatterCache.has(key)) {
    dateFormatterCache.set(
      key,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        ...options,
      }),
    );
  }

  return dateFormatterCache.get(key)!;
}

export function getTimeZoneDateParts(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

export function shopDateString(date: Date, timeZone: string) {
  const { year, month, day } = getTimeZoneDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseShopLocalDate(date: string) {
  const parsed = parseISO(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("INVALID_DATE", "Invalid date.", 400);
  }

  return parsed;
}

export function combineShopDateAndTime(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = getTimeZoneDateParts(utcGuess, timeZone);
  const targetUtc = new Date(
    utcGuess.getTime() -
      ((parts.year - year) * 365 * 24 * 60 +
        (parts.month - month) * 31 * 24 * 60 +
        (parts.day - day) * 24 * 60 +
        (parts.hour - hour) * 60 +
        (parts.minute - minute)) *
        60 *
        1000,
  );

  return targetUtc;
}

export function enumerateSlots(
  date: string,
  start: string,
  end: string,
  slotMinutes: number,
  serviceMinutes: number,
  timeZone: string,
) {
  const opening = combineShopDateAndTime(date, start, timeZone);
  const closing = combineShopDateAndTime(date, end, timeZone);
  const slots: { startTime: string; endTime: string }[] = [];
  let cursor = opening;

  while (isBefore(addMinutes(cursor, serviceMinutes), addMinutes(closing, 1))) {
    const slotEnd = addMinutes(cursor, serviceMinutes);
    slots.push({
      startTime: formatISO(cursor),
      endTime: formatISO(slotEnd),
    });
    cursor = addMinutes(cursor, slotMinutes);
  }

  return slots;
}

export function startOfShopDay(dateTime: string) {
  return startOfDay(parseISO(dateTime));
}
