import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { facturaPdf } from '../src/pdf/facturaPdf';
import { borradorMensual, borradorRectificativa, emitir } from '../src/core/factura';
import { datosVacios, type Datos, type Persona } from '../src/core/modelo';

const p: Persona = {
  nombre: 'Propietario de Ejemplo', nif: '12345678Z', direccion: 'C/ Ejemplo 1', codigoPostal: '07001',
  poblacion: 'Palma', provincia: 'Illes Balears', email: '', telefono: '',
};
const d: Datos = {
  ...datosVacios(),
  emisor: p,
  contrato: {
    inquilino: { ...p, nombre: 'Comercial Ejemplo SL', nif: 'B07000003', direccion: 'C/ Comercio 3' },
    inmueble: { direccion: 'Local comercial en C/ Comercio 3, bajos, 07001 Palma', referenciaCatastral: '1234567DD8912S0001AB' },
    fechaInicio: '2024-01-01', renta: 105000, conceptosFijos: [{ id: '1', concepto: 'IBI repercutido (1/12)', importe: 4550 }],
    tipoIVA: 21, aplicaRetencion: true, tipoRetencion: 19, mesActualizacion: 1,
    fianza: { importe: 0, fechaDeposito: '', referencia: '' }, formaPago: 'Transferencia bancaria',
  },
};

describe('PDF', () => {
  it('genera factura y rectificativa', async () => {
    const f = emitir(d, borradorMensual(d.contrato!, { anyo: 2026, mes: 10 }, '2026-10-01'), 'a', 'x');
    const r = emitir({ ...d, facturas: [f] }, borradorRectificativa(f, 'Importe erróneo', '2026-10-05'), 'b', 'x');
    for (const [nombre, factura] of [['factura', f], ['rectificativa', r]] as const) {
      const pdf = Buffer.from(await facturaPdf(factura).arrayBuffer());
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      // PDF_SALIDA=carpeta npm test → guarda los PDF para revisarlos a ojo.
      if (process.env.PDF_SALIDA) writeFileSync(`${process.env.PDF_SALIDA}/${nombre}.pdf`, pdf);
    }
  });
});
