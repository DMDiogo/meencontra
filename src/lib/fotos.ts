import type { Prisma } from "@prisma/client";

export function asFotoList(value: Prisma.JsonValue | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value) return [value];
  return [];
}
