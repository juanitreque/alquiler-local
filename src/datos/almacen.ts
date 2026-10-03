// Persistencia en IndexedDB del propio iPhone. Todo el estado es un único documento (son pocos datos).
import { datosVacios, type Datos } from '../core/modelo';

const BD = 'alquiler';
const TABLA = 'estado';
const CLAVE = 'datos';

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(BD, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(TABLA);
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

export async function cargar(): Promise<Datos> {
  const bd = await abrir();
  const guardado = await new Promise<unknown>((resolve, reject) => {
    const p = bd.transaction(TABLA).objectStore(TABLA).get(CLAVE);
    p.onsuccess = () => resolve(p.result);
    p.onerror = () => reject(p.error);
  });
  bd.close();
  return guardado ? migrar(guardado) : datosVacios();
}

export async function guardar(datos: Datos): Promise<void> {
  const bd = await abrir();
  await new Promise<void>((resolve, reject) => {
    const tx = bd.transaction(TABLA, 'readwrite');
    tx.objectStore(TABLA).put(JSON.parse(JSON.stringify(datos)), CLAVE);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  bd.close();
}

/** Pide a Safari que no borre los datos aunque falte espacio. */
export async function pedirPersistencia(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** Completa campos que falten en datos de versiones anteriores o de una copia. */
export function migrar(entrada: unknown): Datos {
  const d = entrada as Partial<Datos>;
  if (!d || typeof d !== 'object' || d.version !== 1 || !Array.isArray(d.facturas)) {
    throw new Error('El archivo no es una copia de seguridad de Alquiler.');
  }
  const base = datosVacios();
  return {
    ...base,
    ...d,
    gastos: d.gastos ?? [],
    presentaciones: d.presentaciones ?? [],
    ajustes: { ...base.ajustes, ...d.ajustes },
  } as Datos;
}
