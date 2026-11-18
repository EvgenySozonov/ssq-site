/**
 * Контракт данных направлений и услуг: lines.json + <line>.json.
 * Источники: .planning/codebase/ARCHITECTURE.md «Модель данных направлений»,
 * docs/specs/ssq-site-stack-design.md §4.1. Одна схема = валидация + тип (z.infer):
 * потребители берут типы отсюда, вторых описаний нет.
 */
import { z } from "zod";

export const lineSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug — kebab-case, латиница"),
  title: z.string().min(1),
  tagline: z.string().min(1),
  order: z.number().int().min(1),
});

export const serviceSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug — kebab-case, латиница"),
  title: z.string().min(1),
  summary: z.string().min(1),
  /** 0 = «по смете»: цифра выводится только при > 0 (правило честного копирайтинга). */
  priceFrom: z.number().int().min(0).default(0),
  order: z.number().int().min(1),
});

export type Line = z.infer<typeof lineSchema>;
export type Service = z.infer<typeof serviceSchema>;

const LINE_SLUGS = ["elektromontazh", "umniy-dom"] as const;

const lineModules = import.meta.glob("../data/services/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

/** Направления из lines.json, отсортированные по order. */
export const getLines = (): Line[] => {
  const parsed = z.array(lineSchema).parse(lineModules["../data/services/lines.json"]?.default);
  return parsed.sort((a, b) => a.order - b.order);
};

/** Услуги направления по slug <line>.json; неизвестный slug — ошибка билда. */
export const getLineServices = (lineSlug: string): Service[] => {
  const key = `../data/services/${lineSlug}.json`;
  const module = lineModules[key];
  if (!module) {
    throw new Error(`services/${lineSlug}.json — нет файла для направления «${lineSlug}»`);
  }
  const parsed = z.array(serviceSchema).parse(module.default);
  return parsed.sort((a, b) => a.order - b.order);
};

/** Обязательные направления каркаса: защита от опечатки в slug при правке lines.json. */
export const requireLineSlugs = (slugs: readonly (typeof LINE_SLUGS)[number][] = LINE_SLUGS): void => {
  const present = new Set(getLines().map((line) => line.slug));
  for (const slug of slugs) {
    if (!present.has(slug)) {
      throw new Error(`lines.json: отсутствует обязательное направление «${slug}»`);
    }
  }
};
