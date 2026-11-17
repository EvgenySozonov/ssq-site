/**
 * Инварианты данных направлений (vitest, qa.md глобальный чек № 3).
 * Карточки-модули импортируются как в lines.ts: реальные JSON-файлы — валидируем.
 */
import { describe, expect, it } from "vitest";
import { getLineServices, getLines, lineSchema, requireLineSlugs, serviceSchema } from "./lines";

describe("lines.json (направления)", () => {
  it("валиден и содержит обязательные направления каркаса", () => {
    const lines = getLines();
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(() => requireLineSlugs()).not.toThrow();
  });

  it("отсортирован по order", () => {
    const orders = getLines().map((line) => line.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it("слаги уникальны", () => {
    const slugs = getLines().map((line) => line.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("услуги направлений (elektromontazh/umniy-dom)", () => {
  it("у каждого направления есть валидный список услуг", () => {
    for (const line of getLines()) {
      const services = getLineServices(line.slug);
      expect(services.length).toBeGreaterThanOrEqual(1);
      const orders = services.map((service) => service.order);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
      expect(new Set(services.map((service) => service.slug)).size).toBe(services.length);
    }
  });
});

describe("схемы", () => {
  it("lineSchema отвергает слаг вне kebab-case", () => {
    expect(lineSchema.safeParse({ slug: "Умный дом", title: "x", tagline: "x", order: 1 }).success).toBe(
      false,
    );
  });

  it("serviceSchema: priceFrom по умолчанию 0 (по смете), отрицательная цена отвергается", () => {
    const base = { slug: "a", title: "t", summary: "s", order: 1 };
    expect(serviceSchema.parse(base).priceFrom).toBe(0);
    expect(serviceSchema.safeParse({ ...base, priceFrom: -1 }).success).toBe(false);
  });

  it("getLineServices на неизвестном направлении бросает понятную ошибку", () => {
    expect(() => getLineServices("net-takogo")).toThrow(/нет файла для направления/);
  });
});
