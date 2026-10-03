import { describe, expect, it } from 'vitest';
import { euros, parsear, porcentaje } from '../src/core/dinero';
import { plazo303, trimestreAPresentar, trimestreDe } from '../src/core/fechas';
import * as NIF from '../src/core/nif';
import {
  borradorMensual, borradorRectificativa, calcular, emitir, fechaDevengo, problemasEmision, siguienteNumero,
} from '../src/core/factura';
import { liquidacion303, resumenRenta, sentido } from '../src/core/impuestos';
import { datosVacios, type Contrato, type Datos, type Gasto, type Persona } from '../src/core/modelo';

const arrendador: Persona = {
  nombre: 'Propietario de Ejemplo', nif: '12345678Z', direccion: 'C/ Ejemplo 1', codigoPostal: '07001',
  poblacion: 'Palma', provincia: 'Illes Balears', email: '', telefono: '',
};
const contrato: Contrato = {
  inquilino: { ...arrendador, nombre: 'Comercial Ejemplo SL', nif: 'B07000003', direccion: 'C/ Comercio 3' },
  inmueble: { direccion: 'Local en C/ Comercio 3, bajos, 07001 Palma', referenciaCatastral: '' },
  fechaInicio: '2024-01-01',
  renta: 100000,
  conceptosFijos: [{ id: '1', concepto: 'IBI repercutido', importe: 5000 }],
  tipoIVA: 21, aplicaRetencion: true, tipoRetencion: 19, mesActualizacion: 1,
  fianza: { importe: 200000, fechaDeposito: '', referencia: '' },
  formaPago: 'Transferencia',
};

function datos(): Datos {
  return { ...datosVacios(), emisor: arrendador, contrato };
}

describe('dinero', () => {
  it('redondea half-up', () => {
    expect(porcentaje(21, 50)).toBe(11); // 10,5 céntimos
    expect(porcentaje(19, 105000)).toBe(19950);
    expect(porcentaje(21, -50)).toBe(-11);
  });
  it('parsea formatos españoles', () => {
    expect(parsear('1.234,56')).toBe(123456);
    expect(parsear('45,5 €')).toBe(4550);
    expect(parsear('1000')).toBe(100000);
    expect(parsear('1.000')).toBe(100000);
    expect(parsear('12.5')).toBe(1250);
    expect(parsear('abc')).toBeNull();
    expect(euros(123456)).toBe('1.234,56 €');
  });
});

describe('fechas', () => {
  it('plazo del 303 salta el fin de semana', () => {
    expect(plazo303({ anyo: 2026, numero: 3 })).toBe('2026-10-20');
    expect(plazo303({ anyo: 2026, numero: 2 })).toBe('2026-07-20');
    expect(plazo303({ anyo: 2026, numero: 4 })).toBe('2027-02-01'); // 30/1/2027 es sábado
    expect(trimestreAPresentar('2026-10-03')).toEqual({ anyo: 2026, numero: 3 });
    expect(trimestreDe('2026-12-31')).toEqual({ anyo: 2026, numero: 4 });
  });
});

describe('NIF', () => {
  it('valida DNI, NIE y entidades', () => {
    expect(NIF.valido('12345678Z')).toBe(true);
    expect(NIF.valido('12345678A')).toBe(false);
    expect(NIF.valido('X1234567L')).toBe(true);
    expect(NIF.valido('B07000003')).toBe(true);
    expect(NIF.valido('B07000005')).toBe(false);
    expect(NIF.valido('A58818501')).toBe(true);
  });
});

describe('factura', () => {
  it('base + 21 % − 19 %', () => {
    const t = calcular([{ concepto: 'Renta', importe: 105000 }], 21, 19);
    expect(t).toMatchObject({ base: 105000, cuotaIVA: 22050, retencion: 19950, total: 107100 });
  });

  it('borrador mensual con gastos repercutidos y numeración correlativa', () => {
    const d = datos();
    const b = borradorMensual(contrato, { anyo: 2026, mes: 10 }, '2026-10-01');
    expect(b.lineas).toHaveLength(2);
    expect(problemasEmision(d, b)).toEqual([]);
    const f = emitir(d, b, 'a', 'x');
    expect(f.codigo).toBe('2026-001');
    expect(f.total).toBe(105000 + 22050 - 19950);
    d.facturas.push(f);
    expect(siguienteNumero(d, 'F', 2026)).toBe(2);
    expect(problemasEmision(d, b)).toContain('Ese mes ya está facturado (2026-001)');
  });

  it('respeta la numeración previa y la fecha', () => {
    const d = datos();
    d.ajustes.numeracionPrevia = { F2026: 9 };
    const f = emitir(d, borradorMensual(contrato, { anyo: 2026, mes: 10 }, '2026-10-01'), 'a', 'x');
    expect(f.codigo).toBe('2026-010');
    d.facturas.push(f);
    const anterior = borradorMensual(contrato, { anyo: 2026, mes: 9 }, '2026-09-30');
    expect(problemasEmision(d, anterior)).toContain('La fecha no puede ser anterior a la de la factura 2026-010');
  });

  it('rectificativa anula en negativo y permite refacturar el mes', () => {
    const d = datos();
    const f = emitir(d, borradorMensual(contrato, { anyo: 2026, mes: 10 }, '2026-10-01'), 'a', 'x');
    d.facturas.push(f);
    const rb = borradorRectificativa(f, 'Importe erróneo', '2026-10-05');
    const r = emitir(d, rb, 'b', 'x');
    expect(r.codigo).toBe('R2026-001');
    expect(r.total).toBe(-f.total);
    expect(fechaDevengo(r)).toBe('2026-10-05');
    f.rectificadaPor = r.id;
    d.facturas.push(r);
    expect(problemasEmision(d, borradorMensual(contrato, { anyo: 2026, mes: 10 }, '2026-10-05'))).toEqual([]);
  });

  it('detecta NIF erróneo', () => {
    const d = datos();
    d.contrato = { ...contrato, inquilino: { ...contrato.inquilino, nif: 'B07000005' } };
    expect(problemasEmision(d, borradorMensual(contrato, { anyo: 2026, mes: 10 }, '2026-10-01')))
      .toContain('El NIF del inquilino no es válido (B07000005)');
  });
});

describe('impuestos', () => {
  const d = datos();
  const facturas = [10, 11, 12].map((mes, i) => {
    const f = emitir(d, borradorMensual(contrato, { anyo: 2026, mes }, `2026-${mes}-01`), String(i), 'x');
    d.facturas.push(f);
    return f;
  });
  // Factura de diciembre emitida en enero: cuenta en el 4T de 2026.
  const gastos: Gasto[] = [
    { id: 'g1', fecha: '2026-11-10', categoria: 'reparacion', proveedor: 'Fontaner', nifProveedor: '', numeroFactura: '1',
      concepto: '', base: 20000, cuotaIVA: 4200, ivaDeducible: true, deducibleRenta: true, notas: '' },
    { id: 'g2', fecha: '2026-06-30', categoria: 'ibi', proveedor: 'Ajuntament', nifProveedor: '', numeroFactura: '',
      concepto: '', base: 60000, cuotaIVA: 0, ivaDeducible: false, deducibleRenta: true, notas: '' },
  ];

  it('303 del 4T con información anual', () => {
    const l = liquidacion303({ anyo: 2026, numero: 4 }, facturas, gastos, 1000);
    expect(l.baseDevengada).toBe(315000);
    expect(l.cuotaDevengada).toBe(66150);
    expect(l.cuotaDeducible).toBe(4200);
    expect(l.compensacionAplicada).toBe(1000);
    expect(l.resultado).toBe(66150 - 4200 - 1000);
    expect(l.anual?.volumenOperaciones).toBe(315000);
    expect(sentido(l)).toBe('ingresar');
  });

  it('resumen para la Renta', () => {
    const r = resumenRenta(2026, facturas, gastos, 30000);
    expect(r.ingresos).toBe(315000);
    expect(r.retenciones).toBe(3 * 19950);
    expect(r.interesesYReparaciones).toBe(20000);
    expect(r.otrosGastos).toBe(60000);
    expect(r.rendimientoNeto).toBe(315000 - 20000 - 60000 - 30000);
  });
});
