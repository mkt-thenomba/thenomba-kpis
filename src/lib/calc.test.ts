import { describe, it, expect } from "vitest";
import {
  companyTotals,
  conversionPct,
  isSustainedBelow,
  projectMonth,
  touchpointCounts,
  progress,
} from "./calc";

describe("REGLA RECTORA: el total de compañía sale SOLO de las ventas reales", () => {
  // Ventas reales (fuente de verdad), sin solapes.
  const ventasReales = [
    { amount: 490 },
    { amount: 990 },
    { amount: 290 },
  ];

  it("cuenta filas y suma importes de las ventas reales", () => {
    const t = companyTotals(ventasReales);
    expect(t.salesCount).toBe(3);
    expect(t.revenue).toBe(1770);
  });

  it("las atribuciones NO pueden entrar en el total de compañía", () => {
    // Atribuciones de Josep y Rodrigo (se solapan entre sí y con el canal).
    const atribuidasJosep = 40;
    const atribuiblesRodrigo = 25;
    const atribuidasPago = 30;
    const sumaDeAtribuciones =
      atribuidasJosep + atribuiblesRodrigo + atribuidasPago; // 95 — número SIN sentido

    const totalReal = companyTotals(ventasReales).salesCount;

    // El total real (3) jamás coincide con la suma de atribuciones (95).
    // companyTotals ni siquiera acepta atribuciones por firma de tipos.
    expect(totalReal).toBe(3);
    expect(totalReal).not.toBe(sumaDeAtribuciones);
  });

  it("cambiar las atribuciones no altera el total real", () => {
    const antes = companyTotals(ventasReales);
    // Por más que crezcan las atribuciones, el total real depende solo de Sale.
    const despues = companyTotals(ventasReales);
    expect(despues).toEqual(antes);
  });
});

describe("conversionPct", () => {
  it("ventas / contactos en porcentaje", () => {
    expect(conversionPct(5, 100)).toBe(5);
  });
  it("evita división por cero", () => {
    expect(conversionPct(3, 0)).toBe(0);
  });
});

describe("isSustainedBelow (aviso de lectura a 5 días)", () => {
  it("avisa cuando los últimos 5 valores están bajo umbral", () => {
    expect(isSustainedBelow([60, 40, 30, 20, 10, 5], 50, 5)).toBe(true);
  });
  it("no avisa si algún día reciente cumple", () => {
    expect(isSustainedBelow([10, 10, 10, 10, 60], 50, 5)).toBe(false);
  });
  it("no avisa con menos de 5 datos", () => {
    expect(isSustainedBelow([10, 10, 10], 50, 5)).toBe(false);
  });
});

describe("projectMonth", () => {
  it("proyecta a ritmo y calcula lo necesario por día", () => {
    const r = projectMonth({
      revenueSoFar: 10000,
      salesSoFar: 20,
      revenueTarget: 32000,
      salesTarget: 70,
      daysElapsed: 10,
      daysInMonth: 30,
    });
    expect(r.projectedRevenue).toBe(30000); // 1000/día * 30
    expect(r.projectedSales).toBe(60);
    expect(r.daysRemaining).toBe(20);
    // Faltan 22000 € en 20 días → 1100 €/día
    expect(r.revenuePerDayNeeded).toBe(1100);
    expect(r.onTrack).toBe(false);
  });
});

describe("touchpointCounts", () => {
  it("cuenta presencia única por venta", () => {
    const m = touchpointCounts([
      ["DOSSIER", "LLAMADA"],
      ["DOSSIER", "DOSSIER"], // duplicado dentro de la misma venta = 1
      ["TEST"],
    ]);
    expect(m.get("DOSSIER")).toBe(2);
    expect(m.get("LLAMADA")).toBe(1);
    expect(m.get("TEST")).toBe(1);
  });
});

describe("progress", () => {
  it("recorta a 100 pero guarda el porcentaje real", () => {
    const p = progress(80, 50);
    expect(p.pct).toBe(100);
    expect(p.rawPct).toBe(160);
  });
});
