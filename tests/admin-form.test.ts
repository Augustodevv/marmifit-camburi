import { describe, expect, it } from "vitest";
import { centsToInput, imageUrl, slugify, toCents } from "@/lib/admin-form";
import { safeRedirectPath } from "@/lib/format";

describe("helpers do painel", () => {
  it("converte valores em reais para centavos", () => {
    expect(toCents("26,90")).toBe(2690);
    expect(toCents("26.90")).toBe(2690);
    expect(toCents("R$ 1.026,90")).toBe(102690);
    expect(toCents("")).toBeNull();
    expect(toCents("-1")).toBeNaN();
    expect(centsToInput(2690)).toBe("26,90");
  });
  it("gera slugs", () => {
    expect(slugify("Moqueca Caiçara de Peixe!")).toBe("moqueca-caicara-de-peixe");
    expect(slugify("Purê de abóbora")).toBe("pure-de-abobora");
  });
  it("valida imagens (só caminho local ou https)", () => {
    const fd = (v: string) => {
      const f = new FormData();
      f.set("image", v);
      return f;
    };
    expect(imageUrl(fd("/images/produtos/x.webp"), "image")).toBe("/images/produtos/x.webp");
    expect(imageUrl(fd("https://cdn.exemplo.com/a.jpg"), "image")).toBe("https://cdn.exemplo.com/a.jpg");
    expect(imageUrl(fd("javascript:alert(1)"), "image")).toBeUndefined();
    expect(imageUrl(fd("http://inseguro.com/a.jpg"), "image")).toBeUndefined();
    expect(imageUrl(fd(""), "image")).toBeNull();
  });
  it("bloqueia open redirect", () => {
    expect(safeRedirectPath("/conta", "/")).toBe("/conta");
    expect(safeRedirectPath("//evil.com", "/")).toBe("/");
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/\\evil.com", "/")).toBe("/");
  });
});
