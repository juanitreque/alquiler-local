// Estado global reactivo. Toda modificación pasa por `cambiar`, que guarda en el dispositivo.
import { datosVacios, type Datos } from '../core/modelo';
import { cargar, guardar, migrar } from './almacen';

export const app = $state<{ datos: Datos; listo: boolean; error: string | null }>({
  datos: datosVacios(),
  listo: false,
  error: null,
});

export async function iniciar(): Promise<void> {
  try {
    app.datos = await cargar();
  } catch (e) {
    app.error = `No se pudieron leer los datos: ${(e as Error).message}`;
  }
  app.listo = true;
}

export async function cambiar(modificar: (d: Datos) => void): Promise<void> {
  modificar(app.datos);
  try {
    await guardar($state.snapshot(app.datos) as Datos);
  } catch (e) {
    app.error = `No se pudo guardar: ${(e as Error).message}`;
    throw e;
  }
}

export async function restaurar(json: string): Promise<void> {
  const datos = migrar(JSON.parse(json));
  await guardar(datos);
  app.datos = datos;
}
