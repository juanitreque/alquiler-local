// Fechas como texto ISO "AAAA-MM-DD" (sin horas ni zonas horarias).
export type Fecha = string;

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Hoy en hora peninsular (Baleares usa la misma). */
export function hoy(ahora = new Date()): Fecha {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(ahora);
}

export function partes(f: Fecha): { anyo: number; mes: number; dia: number } {
  const [anyo, mes, dia] = f.split('-').map(Number);
  return { anyo, mes, dia };
}

export function fecha(anyo: number, mes: number, dia: number): Fecha {
  return `${anyo}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function diasDelMes(anyo: number, mes: number): number {
  return new Date(Date.UTC(anyo, mes, 0)).getUTCDate();
}

export function sumarDias(f: Fecha, dias: number): Fecha {
  const { anyo, mes, dia } = partes(f);
  const d = new Date(Date.UTC(anyo, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desde: Fecha, hasta: Fecha): number {
  const a = partes(desde), b = partes(hasta);
  return Math.round((Date.UTC(b.anyo, b.mes - 1, b.dia) - Date.UTC(a.anyo, a.mes - 1, a.dia)) / 86_400_000);
}

function diaSemana(f: Fecha): number {
  const { anyo, mes, dia } = partes(f);
  return new Date(Date.UTC(anyo, mes - 1, dia)).getUTCDay(); // 0 domingo
}

/** "3 de octubre de 2026" */
export function larga(f: Fecha): string {
  const { anyo, mes, dia } = partes(f);
  return `${dia} de ${MESES[mes - 1]} de ${anyo}`;
}

/** "03/10/2026" */
export function corta(f: Fecha): string {
  const { anyo, mes, dia } = partes(f);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anyo}`;
}

export function capitalizar(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Mes natural completo. */
export interface Mes {
  anyo: number;
  mes: number; // 1-12
}

export function mesDe(f: Fecha): Mes {
  const { anyo, mes } = partes(f);
  return { anyo, mes };
}

export function mesSiguiente(m: Mes): Mes {
  return m.mes === 12 ? { anyo: m.anyo + 1, mes: 1 } : { anyo: m.anyo, mes: m.mes + 1 };
}

export function mesAnterior(m: Mes): Mes {
  return m.mes === 1 ? { anyo: m.anyo - 1, mes: 12 } : { anyo: m.anyo, mes: m.mes - 1 };
}

export function inicioMes(m: Mes): Fecha {
  return fecha(m.anyo, m.mes, 1);
}

export function finMes(m: Mes): Fecha {
  return fecha(m.anyo, m.mes, diasDelMes(m.anyo, m.mes));
}

/** "octubre de 2026" */
export function nombreMes(m: Mes): string {
  return `${MESES[m.mes - 1]} de ${m.anyo}`;
}

// MARK: Trimestres

export interface Trimestre {
  anyo: number;
  numero: 1 | 2 | 3 | 4;
}

export function trimestreDe(f: Fecha): Trimestre {
  const { anyo, mes } = partes(f);
  return { anyo, numero: (Math.floor((mes - 1) / 3) + 1) as Trimestre['numero'] };
}

export function trimestreAnterior(t: Trimestre): Trimestre {
  return t.numero === 1 ? { anyo: t.anyo - 1, numero: 4 } : { anyo: t.anyo, numero: (t.numero - 1) as Trimestre['numero'] };
}

export function trimestreSiguiente(t: Trimestre): Trimestre {
  return t.numero === 4 ? { anyo: t.anyo + 1, numero: 1 } : { anyo: t.anyo, numero: (t.numero + 1) as Trimestre['numero'] };
}

export function inicioTrimestre(t: Trimestre): Fecha {
  return fecha(t.anyo, (t.numero - 1) * 3 + 1, 1);
}

export function finTrimestre(t: Trimestre): Fecha {
  const mes = t.numero * 3;
  return fecha(t.anyo, mes, diasDelMes(t.anyo, mes));
}

export function enTrimestre(f: Fecha, t: Trimestre): boolean {
  return f >= inicioTrimestre(t) && f <= finTrimestre(t);
}

export function etiquetaTrimestre(t: Trimestre): string {
  return `${t.numero}T ${t.anyo}`;
}

export function mismoTrimestre(a: Trimestre, b: Trimestre): boolean {
  return a.anyo === b.anyo && a.numero === b.numero;
}

/** Plazo del 303: del 1 al 20 del mes siguiente (30 de enero para el 4T). Si cae en fin de semana, pasa al lunes. No contempla festivos. */
export function plazo303(t: Trimestre): Fecha {
  let f = t.numero === 4 ? fecha(t.anyo + 1, 1, 30) : fecha(t.anyo, t.numero * 3 + 1, 20);
  while (diaSemana(f) === 0 || diaSemana(f) === 6) f = sumarDias(f, 1);
  return f;
}

/** Trimestre cuyo 303 toca presentar ahora (el anterior al actual). */
export function trimestreAPresentar(h: Fecha): Trimestre {
  return trimestreAnterior(trimestreDe(h));
}
