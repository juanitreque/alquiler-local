// Importes en céntimos (enteros) para evitar errores de coma flotante.
export type Centimos = number;

/** `tipo` % de `base`, redondeo comercial (half-up, simétrico para negativos). */
export function porcentaje(tipo: number, base: Centimos): Centimos {
  const valor = Number(((Math.abs(base) * tipo) / 100).toFixed(6));
  const r = Math.floor(valor + 0.5);
  return base < 0 ? -r : r;
}

export function suma<T>(elementos: readonly T[], campo: (e: T) => Centimos): Centimos {
  return elementos.reduce((total, e) => total + campo(e), 0);
}

/** Acepta "45,50", "1.234,56", "45.5", "1234", "45 €". Devuelve null si no es un número. */
export function parsear(texto: string): Centimos | null {
  let t = texto.replace(/[€\s ]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const negativo = t.startsWith('-');
  const [entero, dec = ''] = t.replace('-', '').split('.');
  const cent = Number(entero) * 100 + Number(dec.padEnd(2, '0'));
  return negativo ? -cent : cent;
}

const formato = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
} as unknown as Intl.NumberFormatOptions);

/** 123456 → "1.234,56 €" */
export function euros(c: Centimos): string {
  return `${formato.format(c / 100)} €`;
}

/** 123456 → "1.234,56" */
export function numero(c: Centimos): string {
  return formato.format(c / 100);
}

/** Texto editable: 123456 → "1234,56"; 0 → "". */
export function editable(c: Centimos): string {
  if (!c) return '';
  return (c / 100).toFixed(2).replace('.', ',');
}
