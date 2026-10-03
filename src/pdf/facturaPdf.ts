import { jsPDF } from 'jspdf';
import { numero, type Centimos } from '../core/dinero';
import { corta } from '../core/fechas';
import type { Factura, Persona } from '../core/modelo';

const M = 18; // margen (mm)
const ANCHO = 210;
const DERECHA = ANCHO - M;
const ACENTO: [number, number, number] = [15, 92, 80];
const GRIS: [number, number, number] = [110, 110, 110];

function lineasPersona(p: Persona): string[] {
  return [
    p.nombre,
    `NIF: ${p.nif}`,
    p.direccion,
    [p.codigoPostal, p.poblacion].filter(Boolean).join(' ') + (p.provincia ? ` (${p.provincia})` : ''),
    ...(p.email ? [p.email] : []),
    ...(p.telefono ? [`Tel. ${p.telefono}`] : []),
  ].filter((l) => l.trim());
}

/** Importe alineado a la derecha. El € se dibuja aparte porque jsPDF mide mal su ancho. */
function importe(doc: jsPDF, c: Centimos, y: number): void {
  doc.text(numero(c), DERECHA - 3.6, y, { align: 'right' });
  doc.text('€', DERECHA - 2.6, y);
}

export function facturaPdf(f: Factura): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const esRect = f.serie === 'R';
  doc.setProperties({ title: `Factura ${f.codigo}`, author: f.emisor.nombre, creator: 'Alquiler' });

  // Cabecera
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...ACENTO);
  doc.text('FACTURA', M, 26);
  if (esRect) {
    doc.setFontSize(11);
    doc.text('RECTIFICATIVA', M, 32);
  }
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  const datosCab = [['Número', f.codigo], ['Fecha de expedición', corta(f.fechaExpedicion)],
    ['Periodo facturado', `${corta(f.periodo.desde)} – ${corta(f.periodo.hasta)}`]];
  datosCab.forEach(([k, v], i) => {
    doc.setTextColor(...GRIS);
    doc.text(k, DERECHA - 45, 20 + i * 5.5, { align: 'right' });
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(v, DERECHA, 20 + i * 5.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // Partes
  let y = 44;
  const columna = (titulo: string, p: Persona, x: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...ACENTO);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, x, y);
    doc.setTextColor(0);
    doc.setFontSize(10);
    lineasPersona(p).forEach((l, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.text(doc.splitTextToSize(l, 80)[0], x, y + 6 + i * 5);
    });
  };
  columna('ARRENDADOR', f.emisor, M);
  columna('ARRENDATARIO', f.destinatario, ANCHO / 2 + 4);
  y += 6 + 6 * 5 + 6;

  // Inmueble
  doc.setDrawColor(220);
  doc.setFillColor(246, 248, 247);
  const inmueble = doc.splitTextToSize(`Inmueble arrendado: ${f.inmueble.direccion}`, DERECHA - M - 8) as string[];
  const altoInmueble = 6 + inmueble.length * 5 + (f.inmueble.referenciaCatastral ? 5 : 0);
  doc.roundedRect(M, y, DERECHA - M, altoInmueble, 2, 2, 'F');
  doc.setFontSize(9.5);
  inmueble.forEach((l, i) => doc.text(l, M + 4, y + 6 + i * 5));
  if (f.inmueble.referenciaCatastral) {
    doc.text(`Referencia catastral: ${f.inmueble.referenciaCatastral}`, M + 4, y + 6 + inmueble.length * 5);
  }
  y += altoInmueble + 10;

  // Conceptos
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPTO', M, y);
  doc.text('IMPORTE', DERECHA, y, { align: 'right' });
  y += 2;
  doc.setDrawColor(...ACENTO);
  doc.setLineWidth(0.4);
  doc.line(M, y, DERECHA, y);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 6;
  for (const l of f.lineas) {
    const texto = doc.splitTextToSize(l.concepto, DERECHA - M - 40) as string[];
    texto.forEach((t, i) => doc.text(t, M, y + i * 5));
    importe(doc, l.importe, y);
    y += texto.length * 5 + 3;
  }
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  doc.line(M, y - 1, DERECHA, y - 1);
  y += 6;

  // Totales
  const x = ANCHO / 2 + 10;
  const filaTotal = (k: string, v: Centimos, negrita = false) => {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.text(k, x, y);
    importe(doc, v, y);
    y += 6;
  };
  filaTotal('Base imponible', f.base);
  filaTotal(`IVA (${f.tipoIVA} %)`, f.cuotaIVA);
  if (f.tipoRetencion > 0) filaTotal(`Retención IRPF (${f.tipoRetencion} %)`, -f.retencion);
  doc.setDrawColor(...ACENTO);
  doc.setLineWidth(0.4);
  doc.line(x, y - 3.5, DERECHA, y - 3.5);
  y += 2;
  doc.setFontSize(12);
  doc.setTextColor(...ACENTO);
  filaTotal(esRect ? 'TOTAL RECTIFICADO' : 'TOTAL A PAGAR', f.total, true);
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 6;

  // Notas legales
  const notas: string[] = [];
  if (f.rectifica) {
    notas.push(`Factura rectificativa de la factura nº ${f.rectifica.codigo} de fecha ${corta(f.rectifica.fechaExpedicion)}.`);
    notas.push(`Motivo de la rectificación: ${f.rectifica.motivo}`);
  }
  if (f.tipoRetencion > 0) {
    notas.push(`Retención a cuenta del IRPF a practicar por el arrendatario (art. 101.8 Ley 35/2006 y art. 100 RD 439/2007).`);
  }
  if (f.formaPago && !esRect) notas.push(`Forma de pago: ${f.formaPago}`);
  doc.setTextColor(60);
  for (const n of notas) {
    const t = doc.splitTextToSize(n, DERECHA - M) as string[];
    doc.text(t, M, y);
    y += t.length * 4.5 + 1.5;
  }

  // Pie
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text(`${f.emisor.nombre} · NIF ${f.emisor.nif}`, ANCHO / 2, 287, { align: 'center' });

  return doc.output('blob');
}

export function nombreArchivo(f: Factura): string {
  return `Factura_${f.codigo}.pdf`;
}
