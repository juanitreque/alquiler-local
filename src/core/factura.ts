import { porcentaje, suma } from './dinero';
import { finMes, inicioMes, nombreMes, partes, type Fecha, type Mes } from './fechas';
import type { Contrato, Datos, Factura, Linea, Persona, Serie, Totales } from './modelo';
import * as NIF from './nif';

export function calcular(lineas: Linea[], tipoIVA: number, tipoRetencion: number): Totales {
  const base = suma(lineas, (l) => l.importe);
  const cuotaIVA = porcentaje(tipoIVA, base);
  const retencion = porcentaje(tipoRetencion, base);
  return { base, tipoIVA, cuotaIVA, tipoRetencion, retencion, total: base + cuotaIVA - retencion };
}

// MARK: Numeración (correlativa por serie y año, art. 6.1.a RD 1619/2012)

export function codigo(serie: Serie, anyo: number, numero: number): string {
  return `${serie === 'R' ? 'R' : ''}${anyo}-${String(numero).padStart(3, '0')}`;
}

export function ultimaDeSerie(datos: Datos, serie: Serie, anyo: number): Factura | undefined {
  return datos.facturas
    .filter((f) => f.serie === serie && f.anyo === anyo)
    .sort((a, b) => b.numero - a.numero)[0];
}

export function siguienteNumero(datos: Datos, serie: Serie, anyo: number): number {
  const previa = datos.ajustes.numeracionPrevia[`${serie}${anyo}`] ?? 0;
  const ultima = ultimaDeSerie(datos, serie, anyo)?.numero ?? 0;
  return Math.max(previa, ultima) + 1;
}

// MARK: Borrador

export interface Borrador {
  serie: Serie;
  fechaExpedicion: Fecha;
  periodo: { desde: Fecha; hasta: Fecha };
  lineas: Linea[];
  tipoIVA: number;
  tipoRetencion: number;
  rectifica?: Factura['rectifica'];
}

/** Factura mensual del alquiler a partir del contrato. */
export function borradorMensual(contrato: Contrato, mes: Mes, fechaExpedicion: Fecha): Borrador {
  const lineas: Linea[] = [
    { concepto: `Renta del local · ${nombreMes(mes)}`, importe: contrato.renta },
    ...contrato.conceptosFijos.filter((c) => c.importe !== 0).map((c) => ({ concepto: c.concepto, importe: c.importe })),
  ];
  return {
    serie: 'F',
    fechaExpedicion,
    periodo: { desde: inicioMes(mes), hasta: finMes(mes) },
    lineas,
    tipoIVA: contrato.tipoIVA,
    tipoRetencion: contrato.aplicaRetencion ? contrato.tipoRetencion : 0,
  };
}

/** Rectificativa que anula íntegramente la factura original (importes en negativo, art. 15 RD 1619/2012). */
export function borradorRectificativa(original: Factura, motivo: string, fechaExpedicion: Fecha): Borrador {
  return {
    serie: 'R',
    fechaExpedicion,
    periodo: original.periodo,
    lineas: original.lineas.map((l) => ({ concepto: `Anulación: ${l.concepto}`, importe: -l.importe })),
    tipoIVA: original.tipoIVA,
    tipoRetencion: original.tipoRetencion,
    rectifica: { id: original.id, codigo: original.codigo, fechaExpedicion: original.fechaExpedicion, motivo },
  };
}

// MARK: Validación antes de emitir

export function problemasPersona(p: Persona | null, quien: string): string[] {
  if (!p) return [`Faltan los datos ${quien}`];
  const problemas: string[] = [];
  if (!p.nombre.trim()) problemas.push(`Falta el nombre ${quien}`);
  if (!p.nif.trim()) problemas.push(`Falta el NIF ${quien}`);
  else if (!NIF.valido(p.nif)) problemas.push(`El NIF ${quien} no es válido (${p.nif})`);
  if (!p.direccion.trim() || !p.poblacion.trim()) problemas.push(`Falta el domicilio ${quien}`);
  return problemas;
}

export function problemasEmision(datos: Datos, b: Borrador): string[] {
  const problemas = [
    ...problemasPersona(datos.emisor, 'del arrendador'),
    ...problemasPersona(datos.contrato?.inquilino ?? null, 'del inquilino'),
  ];
  if (!datos.contrato?.inmueble.direccion.trim()) problemas.push('Falta la dirección del local');
  if (b.lineas.length === 0) problemas.push('La factura no tiene conceptos');
  if (b.lineas.some((l) => !l.concepto.trim())) problemas.push('Hay un concepto sin descripción');
  if (b.serie === 'F' && suma(b.lineas, (l) => l.importe) <= 0) problemas.push('El importe debe ser mayor que cero');
  if (b.serie === 'R' && !b.rectifica?.motivo.trim()) problemas.push('Indica el motivo de la rectificación');

  // Las facturas de una serie deben ir en orden de fecha además de número.
  const anyo = partes(b.fechaExpedicion).anyo;
  const ultima = ultimaDeSerie(datos, b.serie, anyo);
  if (ultima && b.fechaExpedicion < ultima.fechaExpedicion) {
    problemas.push(`La fecha no puede ser anterior a la de la factura ${ultima.codigo}`);
  }
  if (b.serie === 'F') {
    const repetida = datos.facturas.find(
      (f) => f.serie === 'F' && !f.rectificadaPor && f.periodo.desde === b.periodo.desde && f.lineas.length > 0,
    );
    if (repetida) problemas.push(`Ese mes ya está facturado (${repetida.codigo})`);
  }
  return problemas;
}

/** Crea la factura definitiva con número y copia de los datos de las partes. */
export function emitir(datos: Datos, b: Borrador, id: string, ahora: string): Factura {
  const anyo = partes(b.fechaExpedicion).anyo;
  const numero = siguienteNumero(datos, b.serie, anyo);
  const contrato = datos.contrato!;
  return {
    id,
    serie: b.serie,
    anyo,
    numero,
    codigo: codigo(b.serie, anyo, numero),
    fechaExpedicion: b.fechaExpedicion,
    periodo: { ...b.periodo },
    emisor: { ...datos.emisor! },
    destinatario: { ...contrato.inquilino },
    inmueble: { ...contrato.inmueble },
    lineas: b.lineas.map((l) => ({ ...l, concepto: l.concepto.trim() })),
    formaPago: contrato.formaPago,
    ...calcular(b.lineas, b.tipoIVA, b.tipoRetencion),
    ...(b.rectifica ? { rectifica: { ...b.rectifica } } : {}),
    creada: ahora,
  };
}

/**
 * Fecha que decide el trimestre del IVA: el alquiler se devenga al exigirse la renta (art. 75.Uno.7º LIVA),
 * que es el mes facturado; las rectificativas se declaran en el periodo en que se emiten (art. 89.Cinco LIVA).
 */
export function fechaDevengo(f: Factura): Fecha {
  return f.rectifica ? f.fechaExpedicion : f.periodo.desde;
}

/** Último día para expedir la factura a un empresario: el 16 del mes siguiente (art. 11 RD 1619/2012). */
export function plazoExpedicion(mes: Mes): Fecha {
  const sig = mes.mes === 12 ? { anyo: mes.anyo + 1, mes: 1 } : { anyo: mes.anyo, mes: mes.mes + 1 };
  return `${sig.anyo}-${String(sig.mes).padStart(2, '0')}-15`;
}
