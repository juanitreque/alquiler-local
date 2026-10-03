// Validación de NIF (DNI), NIE y NIF de entidades (antiguo CIF).

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function normalizar(nif: string): string {
  return nif.toUpperCase().replace(/[\s.\-]/g, '');
}

export type TipoNIF = 'persona' | 'extranjero' | 'entidad';

export function tipo(nif: string): TipoNIF | null {
  const n = normalizar(nif);
  if (/^\d{8}[A-Z]$/.test(n)) return 'persona';
  if (/^[XYZ]\d{7}[A-Z]$/.test(n)) return 'extranjero';
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(n)) return 'entidad';
  return null;
}

export function valido(nif: string): boolean {
  const n = normalizar(nif);
  switch (tipo(n)) {
    case 'persona':
      return LETRAS_DNI[Number(n.slice(0, 8)) % 23] === n[8];
    case 'extranjero': {
      const num = 'XYZ'.indexOf(n[0]) + n.slice(1, 8);
      return LETRAS_DNI[Number(num) % 23] === n[8];
    }
    case 'entidad': {
      const digitos = n.slice(1, 8);
      let pares = 0, impares = 0;
      for (let i = 0; i < 7; i++) {
        const d = Number(digitos[i]);
        if (i % 2 === 0) {
          const doble = d * 2;
          impares += Math.floor(doble / 10) + (doble % 10);
        } else {
          pares += d;
        }
      }
      const control = (10 - ((pares + impares) % 10)) % 10;
      const letra = 'JABCDEFGHI'[control];
      const c = n[8];
      // Según la forma jurídica el control es letra, número o cualquiera de los dos.
      if ('PQRSNW'.includes(n[0])) return c === letra;
      if ('ABEH'.includes(n[0])) return c === String(control);
      return c === letra || c === String(control);
    }
    default:
      return false;
  }
}
