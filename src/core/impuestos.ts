import { suma, type Centimos } from './dinero';
import { enTrimestre, partes, type Trimestre } from './fechas';
import { fechaDevengo } from './factura';
import type { CategoriaGasto, Factura, Gasto } from './modelo';

// MARK: Modelo 303 (IVA trimestral, régimen general)

export interface Liquidacion303 {
  trimestre: Trimestre;
  facturas: Factura[];
  gastos: Gasto[];
  /** Casillas 07 / 09: base y cuota al 21 %. */
  baseDevengada: Centimos;
  cuotaDevengada: Centimos;
  tipoIVA: number;
  /** Casillas 28 / 29: IVA soportado en operaciones interiores corrientes. */
  baseDeducible: Centimos;
  cuotaDeducible: Centimos;
  /** Casilla 46 = 27 − 45. */
  resultadoRegimenGeneral: Centimos;
  /** Casilla 110: cuotas a compensar de periodos anteriores que se aplican ahora (78). */
  compensacionAplicada: Centimos;
  /** Casilla 71 (sin regularizaciones). */
  resultado: Centimos;
  /** Solo en el 4T: información anual para exonerados del 390. */
  anual?: { operacionesRegimenGeneral: Centimos; volumenOperaciones: Centimos };
}

export function liquidacion303(
  t: Trimestre,
  facturas: Factura[],
  gastos: Gasto[],
  pendienteCompensar: Centimos,
): Liquidacion303 {
  const delTrimestre = facturas.filter((f) => enTrimestre(fechaDevengo(f), t));
  const deducibles = gastos.filter((g) => enTrimestre(g.fecha, t) && g.ivaDeducible && g.cuotaIVA > 0);

  const baseDevengada = suma(delTrimestre, (f) => f.base);
  const cuotaDevengada = suma(delTrimestre, (f) => f.cuotaIVA);
  const baseDeducible = suma(deducibles, (g) => g.base);
  const cuotaDeducible = suma(deducibles, (g) => g.cuotaIVA);
  const resultadoRegimenGeneral = cuotaDevengada - cuotaDeducible;
  const compensacionAplicada = resultadoRegimenGeneral > 0 ? Math.min(pendienteCompensar, resultadoRegimenGeneral) : 0;

  let anual: Liquidacion303['anual'];
  if (t.numero === 4) {
    const delAnyo = facturas.filter((f) => partes(fechaDevengo(f)).anyo === t.anyo);
    const operaciones = suma(delAnyo, (f) => f.base);
    anual = { operacionesRegimenGeneral: operaciones, volumenOperaciones: operaciones };
  }

  return {
    trimestre: t,
    facturas: delTrimestre,
    gastos: deducibles,
    baseDevengada,
    cuotaDevengada,
    tipoIVA: delTrimestre[0]?.tipoIVA ?? 21,
    baseDeducible,
    cuotaDeducible,
    resultadoRegimenGeneral,
    compensacionAplicada,
    resultado: resultadoRegimenGeneral - compensacionAplicada,
    anual,
  };
}

/** Qué hacer con el resultado: a ingresar, a compensar (1T-3T) o a devolver/compensar (4T). */
export function sentido(l: Liquidacion303): 'ingresar' | 'compensar' | 'devolver' | 'cero' {
  if (l.resultado > 0) return 'ingresar';
  if (l.resultado === 0) return 'cero';
  return l.trimestre.numero === 4 ? 'devolver' : 'compensar';
}

// MARK: Renta (rendimientos del capital inmobiliario)

export interface ResumenRenta {
  anyo: number;
  /** Ingresos íntegros: todas las bases (renta + gastos repercutidos), sin IVA. */
  ingresos: Centimos;
  /** Retenciones del 19 % practicadas por el inquilino (se restan de la cuota de la Renta). */
  retenciones: Centimos;
  gastosPorCategoria: Partial<Record<CategoriaGasto, Centimos>>;
  /** Intereses + reparación y conservación (art. 23.1.a.1º LIRPF: no pueden superar los ingresos). */
  interesesYReparaciones: Centimos;
  /** Exceso de intereses y reparaciones que se traslada a los 4 años siguientes. */
  excesoTrasladable: Centimos;
  otrosGastos: Centimos;
  amortizacion: Centimos;
  rendimientoNeto: Centimos;
  facturas: number;
}

/** Gasto que va a la Renta: base + IVA no deducido en el 303. */
export function gastoRenta(g: Gasto): Centimos {
  if (!g.deducibleRenta) return 0;
  return g.base + (g.ivaDeducible ? 0 : g.cuotaIVA);
}

export function resumenRenta(anyo: number, facturas: Factura[], gastos: Gasto[], amortizacion: Centimos): ResumenRenta {
  const delAnyo = facturas.filter((f) => partes(fechaDevengo(f)).anyo === anyo);
  const gastosAnyo = gastos.filter((g) => partes(g.fecha).anyo === anyo && g.deducibleRenta);
  const ingresos = suma(delAnyo, (f) => f.base);

  const gastosPorCategoria: ResumenRenta['gastosPorCategoria'] = {};
  for (const g of gastosAnyo) {
    gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] ?? 0) + gastoRenta(g);
  }
  const limitables = (gastosPorCategoria.intereses ?? 0) + (gastosPorCategoria.reparacion ?? 0);
  const interesesYReparaciones = Math.min(limitables, Math.max(0, ingresos));
  const otrosGastos = suma(
    gastosAnyo.filter((g) => g.categoria !== 'intereses' && g.categoria !== 'reparacion'),
    gastoRenta,
  );

  return {
    anyo,
    ingresos,
    retenciones: suma(delAnyo, (f) => f.retencion),
    gastosPorCategoria,
    interesesYReparaciones,
    excesoTrasladable: limitables - interesesYReparaciones,
    otrosGastos,
    amortizacion,
    rendimientoNeto: ingresos - interesesYReparaciones - otrosGastos - amortizacion,
    facturas: delAnyo.length,
  };
}
