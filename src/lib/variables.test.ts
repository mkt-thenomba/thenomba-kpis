import { describe, it, expect } from "vitest";
import {
  josepPay,
  rodrigoBase,
  pabloVentasAmount,
  funsexAmount,
} from "./variables";

// Los números esperados salen de los ejemplos del documento de estructura
// del área de ventas (sección 8).

describe("Variable de Josep (15 € hasta objetivo, 25 € por encima)", () => {
  it("a objetivo en julio (30 ventas): 450 €", () => {
    expect(josepPay(30, 30).total).toBe(450);
  });
  it("a objetivo en agosto (40 ventas): 600 €", () => {
    expect(josepPay(40, 40).total).toBe(600);
  });
  it("septiembre con 100 atribuidas (obj 70): 70×15 + 30×25 = 1.800 €", () => {
    expect(josepPay(100, 70).total).toBe(1800);
  });
});

describe("Variable de Rodrigo (8 € hasta objetivo, 15 € por encima)", () => {
  it("septiembre a objetivo (30 ventas): 240 €", () => {
    expect(rodrigoBase(30, 30).total).toBe(240);
  });
  it("diciembre cumplido (60 ventas): 480 €", () => {
    expect(rodrigoBase(60, 60).total).toBe(480);
  });
  it("diciembre excelente (75 ventas, obj 60): 60×8 + 15×15 = 705 €", () => {
    expect(rodrigoBase(75, 60).total).toBe(705);
  });
});

describe("Variable A de Pablo (tramos de facturación)", () => {
  it("por debajo de 50k: 0 €", () => {
    expect(pabloVentasAmount(49999)).toBe(0);
  });
  it("50k → 500 €, 70k → 1.000 €", () => {
    expect(pabloVentasAmount(50000)).toBe(500);
    expect(pabloVentasAmount(70000)).toBe(1000);
  });
  it("100k → 2.000 €, 150k → 3.500 €", () => {
    expect(pabloVentasAmount(100000)).toBe(2000);
    expect(pabloVentasAmount(150000)).toBe(3500);
    expect(pabloVentasAmount(500000)).toBe(3500);
  });
});

describe("Variable B de Pablo (FunSex, % de la preventa)", () => {
  it("por debajo de 40k: 0 €", () => {
    expect(funsexAmount(39999)).toBe(0);
  });
  it("40k → 2% = 800 €", () => {
    expect(funsexAmount(40000)).toBe(800);
  });
  it("50k → 2,5% = 1.250 €", () => {
    expect(funsexAmount(50000)).toBe(1250);
  });
  it("60k → 3% = 1.800 €", () => {
    expect(funsexAmount(60000)).toBe(1800);
  });
});
