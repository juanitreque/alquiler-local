import { numero } from './dinero';
import { corta, partes, type Fecha } from './fechas';
import { fechaDevengo } from './factura';
import { CATEGORIAS_GASTO, type Factura, type Gasto } from './modelo';

// MARK: Libros registro de IVA (art. 62 LIVA) en CSV para Excel/Numbers

function csv(filas: (string | number)[][]): string {
  const celda = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  // Punto y coma y BOM: así lo abre bien Excel en español.
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';
}

export function libroExpedidas(facturas: Factura[], anyo: number): string {
  const filas = facturas
    .filter((f) => partes(f.fechaExpedicion).anyo === anyo)
    .sort((a, b) => a.fechaExpedicion.localeCompare(b.fechaExpedicion) || a.codigo.localeCompare(b.codigo))
    .map((f) => [
      f.codigo, corta(f.fechaExpedicion), corta(fechaDevengo(f)), f.destinatario.nif, f.destinatario.nombre,
      numero(f.base), f.tipoIVA, numero(f.cuotaIVA), f.tipoRetencion, numero(f.retencion), numero(f.total),
      f.rectifica ? `Rectifica ${f.rectifica.codigo}` : '',
    ]);
  return csv([
    ['Número', 'Fecha expedición', 'Fecha operación', 'NIF destinatario', 'Destinatario', 'Base imponible',
      'Tipo IVA %', 'Cuota IVA', 'Retención %', 'Retención', 'Total', 'Observaciones'],
    ...filas,
  ]);
}

export function libroRecibidas(gastos: Gasto[], anyo: number): string {
  const filas = gastos
    .filter((g) => partes(g.fecha).anyo === anyo)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((g, i) => [
      i + 1, corta(g.fecha), g.numeroFactura, g.nifProveedor, g.proveedor, CATEGORIAS_GASTO[g.categoria].nombre,
      g.concepto, numero(g.base), numero(g.cuotaIVA), g.ivaDeducible ? numero(g.cuotaIVA) : '0,00', numero(g.base + g.cuotaIVA),
    ]);
  return csv([
    ['Nº orden', 'Fecha', 'Nº factura', 'NIF proveedor', 'Proveedor', 'Categoría', 'Concepto', 'Base imponible',
      'Cuota IVA', 'IVA deducible', 'Total'],
    ...filas,
  ]);
}

// MARK: Recordatorios para el calendario del iPhone (.ics)

function evento(uid: string, inicio: Fecha, titulo: string, descripcion: string, rrule: string): string {
  const dia = inicio.replace(/-/g, '');
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@alquiler-local`,
    `DTSTAMP:${dia}T080000Z`,
    `DTSTART;VALUE=DATE:${dia}`,
    `RRULE:${rrule}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${titulo}`,
    'TRIGGER:PT9H',
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

/** Factura el día 1 de cada mes y el 303 al principio de cada plazo trimestral. */
export function recordatorios(anyo: number): string {
  const eventos = [
    evento('factura-mensual', `${anyo}-01-01`, 'Hacer la factura del alquiler',
      'Abre la app Alquiler y emite la factura del mes.', 'FREQ=MONTHLY;BYMONTHDAY=1'),
    ...[
      { mes: 4, t: '1T' }, { mes: 7, t: '2T' }, { mes: 10, t: '3T' },
    ].map(({ mes, t }) =>
      evento(`iva-${t}`, `${anyo}-${String(mes).padStart(2, '0')}-05`, `Presentar IVA ${t} (modelo 303)`,
        'Plazo hasta el día 20. Abre la app Alquiler > Impuestos.', `FREQ=YEARLY;BYMONTH=${mes};BYMONTHDAY=5`)),
    evento('iva-4T', `${anyo + 1}-01-12`, 'Presentar IVA 4T (modelo 303 + resumen anual)',
      'Plazo hasta el 30 de enero. Rellenar el apartado de exonerados del 390.', 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=12'),
  ];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alquiler//ES', 'CALSCALE:GREGORIAN', ...eventos, 'END:VCALENDAR', '']
    .join('\r\n');
}
