import type { Centimos } from './dinero';
import type { Fecha } from './fechas';

export interface Persona {
  nombre: string;
  nif: string;
  direccion: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  email: string;
  telefono: string;
}

export function personaVacia(): Persona {
  return { nombre: '', nif: '', direccion: '', codigoPostal: '', poblacion: '', provincia: '', email: '', telefono: '' };
}

export interface Inmueble {
  /** "Local comercial en C/ Ejemplo 10, bajos, 07001 Palma" */
  direccion: string;
  referenciaCatastral: string;
}

export interface ConceptoFijo {
  id: string;
  /** "IBI repercutido", "Gastos de comunidad"… */
  concepto: string;
  importe: Centimos;
}

export interface Contrato {
  inquilino: Persona;
  inmueble: Inmueble;
  fechaInicio: Fecha;
  /** Renta mensual sin IVA. */
  renta: Centimos;
  /** Gastos repercutidos al inquilino cada mes. Forman parte de la base (IVA y retención). */
  conceptosFijos: ConceptoFijo[];
  tipoIVA: number;
  /** El inquilino es empresa o autónomo y retiene a cuenta del IRPF (art. 100 RIRPF). */
  aplicaRetencion: boolean;
  tipoRetencion: number;
  /** Día del mes en que se hace la factura (recordatorio y aviso en Inicio). */
  diaFacturacion: number;
  /** Mes en que se actualiza la renta (IPC u otro índice pactado), o 0 si no hay. */
  mesActualizacion: number;
  fianza: {
    importe: Centimos;
    /** Fecha de depósito en el IBAVI (obligatorio en Baleares, Ley 5/2018). */
    fechaDeposito: Fecha | '';
    referencia: string;
  };
  /** Datos de pago que aparecen en la factura. */
  formaPago: string;
}

export interface Linea {
  concepto: string;
  importe: Centimos;
}

export interface Totales {
  base: Centimos;
  tipoIVA: number;
  cuotaIVA: Centimos;
  tipoRetencion: number;
  retencion: Centimos;
  total: Centimos;
}

export type Serie = 'F' | 'R';

/** Factura emitida. Es inmutable: los datos de las partes se copian en el momento de emitirla. */
export interface Factura extends Totales {
  id: string;
  serie: Serie;
  anyo: number;
  numero: number;
  /** "2026-010" o "R2026-001" */
  codigo: string;
  fechaExpedicion: Fecha;
  /** Periodo de alquiler que se factura. */
  periodo: { desde: Fecha; hasta: Fecha };
  emisor: Persona;
  destinatario: Persona;
  inmueble: Inmueble;
  lineas: Linea[];
  formaPago: string;
  rectifica?: { id: string; codigo: string; fechaExpedicion: Fecha; motivo: string };
  creada: string;
  // Datos de gestión (no forman parte del documento fiscal):
  cobro?: Fecha;
  rectificadaPor?: string;
}

export const CATEGORIAS_GASTO = {
  ibi: { nombre: 'IBI', ayuda: 'Sin IVA. Deducible en la Renta (si no lo pagas tú y lo repercutes, no lo apuntes aquí).', iva: false },
  comunidad: { nombre: 'Comunidad de propietarios', ayuda: 'Normalmente sin IVA.', iva: false },
  seguro: { nombre: 'Seguro del local', ayuda: 'Los seguros no llevan IVA.', iva: false },
  reparacion: { nombre: 'Reparación y conservación', ayuda: 'Pintura, fontanería, arreglos… Las mejoras o ampliaciones no son gasto: se amortizan.', iva: true },
  gestoria: { nombre: 'Gestoría y asesoría', ayuda: 'Con IVA. Pide la factura a nombre del propietario.', iva: true },
  suministros: { nombre: 'Suministros', ayuda: 'Agua, luz… a nombre del propietario.', iva: true },
  tasas: { nombre: 'Tasas y tributos', ayuda: 'Basuras, vados… Sin IVA.', iva: false },
  intereses: { nombre: 'Intereses de préstamo', ayuda: 'Solo si el préstamo fue para comprar o mejorar el local. Sin IVA.', iva: false },
  mejora: { nombre: 'Mejora o inversión', ayuda: 'No es gasto del año: se amortiza. El IVA sí se deduce en el 303.', iva: true },
  otros: { nombre: 'Otros', ayuda: '', iva: true },
} as const;

export type CategoriaGasto = keyof typeof CATEGORIAS_GASTO;

export interface Gasto {
  id: string;
  fecha: Fecha;
  categoria: CategoriaGasto;
  proveedor: string;
  nifProveedor: string;
  numeroFactura: string;
  concepto: string;
  base: Centimos;
  cuotaIVA: Centimos;
  /** Factura completa a nombre y NIF del arrendador: el IVA es deducible en el 303. */
  ivaDeducible: boolean;
  /** Deducible en la Renta como gasto del año (las mejoras se amortizan, no se imputan aquí). */
  deducibleRenta: boolean;
  notas: string;
}

export type ResultadoDeclaracion = 'ingresar' | 'compensar' | 'devolver' | 'cero';

export interface Presentacion {
  id: string;
  modelo: '303';
  anyo: number;
  trimestre: 1 | 2 | 3 | 4;
  resultado: ResultadoDeclaracion;
  /** Siempre positivo. */
  importe: Centimos;
  fecha: Fecha;
  /** NRC del pago o CSV del justificante. */
  justificante: string;
}

export interface Datos {
  version: 1;
  emisor: Persona | null;
  contrato: Contrato | null;
  facturas: Factura[];
  gastos: Gasto[];
  presentaciones: Presentacion[];
  ajustes: {
    /** Última factura hecha con otro programa antes de usar esta app, por serie y año: { "F2026": 9 }. */
    numeracionPrevia: Record<string, number>;
    /** Amortización anual del local para la Renta (3 % del valor de la construcción). */
    amortizacionAnual: Centimos;
    ultimaCopia: string | null;
  };
}

export function datosVacios(): Datos {
  return {
    version: 1,
    emisor: null,
    contrato: null,
    facturas: [],
    gastos: [],
    presentaciones: [],
    ajustes: { numeracionPrevia: {}, amortizacionAnual: 0, ultimaCopia: null },
  };
}

export function nuevoId(): string {
  return crypto.randomUUID();
}
