<script lang="ts">
  import { euros } from '../core/dinero';
  import { corta, diasEntre, hoy, partes } from '../core/fechas';
  import { libroExpedidas, libroRecibidas, recordatorios } from '../core/exportar';
  import { app, cambiar, restaurar } from '../datos/estado.svelte';
  import { compartirArchivo, leerArchivo } from '../datos/compartir';
  import Cabecera from '../ui/Cabecera.svelte';
  import Modal from '../ui/Modal.svelte';
  import { ir, ruta } from '../ui/ruta.svelte';
  import { avisar } from '../ui/toast.svelte';
  import Arrendador from './ajustes/Arrendador.svelte';
  import Contrato from './ajustes/Contrato.svelte';
  import Numeracion from './ajustes/Numeracion.svelte';
  import Legal from './ajustes/Legal.svelte';

  const seccion = $derived(ruta.partes[1]);
  const d = $derived(app.datos);
  const anyo = partes(hoy()).anyo;
  let restaurando = $state<string | null>(null);

  async function copia() {
    const json = JSON.stringify($state.snapshot(app.datos), null, 1);
    const r = await compartirArchivo(new Blob([json], { type: 'application/json' }), `Alquiler-copia-${hoy()}.json`, 'Copia de seguridad');
    if (r !== 'cancelado') {
      await cambiar((x) => (x.ajustes.ultimaCopia = new Date().toISOString()));
      avisar('Copia guardada');
    }
  }

  async function elegirCopia() {
    const texto = await leerArchivo('application/json,.json');
    if (texto) restaurando = texto;
  }

  async function confirmarRestauracion() {
    try {
      await restaurar(restaurando!);
      avisar('Datos restaurados');
    } catch (e) {
      avisar((e as Error).message);
    }
    restaurando = null;
  }

  async function exportarLibro(tipo: 'expedidas' | 'recibidas', a: number) {
    const csv = tipo === 'expedidas' ? libroExpedidas(app.datos.facturas, a) : libroRecibidas(app.datos.gastos, a);
    await compartirArchivo(new Blob([csv], { type: 'text/csv' }), `Libro-${tipo}-${a}.csv`, `Libro de facturas ${tipo} ${a}`);
  }

  async function calendario() {
    await compartirArchivo(new Blob([recordatorios(anyo)], { type: 'text/calendar' }), 'Recordatorios-alquiler.ics', 'Recordatorios');
  }
</script>

{#if seccion === 'arrendador'}
  <Arrendador />
{:else if seccion === 'contrato'}
  <Contrato />
{:else if seccion === 'numeracion'}
  <Numeracion />
{:else if seccion === 'legal'}
  <Legal />
{:else if seccion === 'copias'}
  <Cabecera titulo="Copia de seguridad" atras="ajustes" atrasTexto="Ajustes" />
  <p class="nota" style="margin:0 4px 12px">
    Los datos solo se guardan en este iPhone. Haz una copia cada mes y guárdala en «Archivos › iCloud Drive»
    o envíatela por correo. Si cambias de móvil o borras la app, se recuperan desde aquí.
  </p>
  <div class="grupo">
    <button class="fila enlace" onclick={copia}>Hacer copia de seguridad…</button>
    <div class="fila"><span class="etiqueta">Última copia</span><span class="valor">{d.ajustes.ultimaCopia ? corta(d.ajustes.ultimaCopia.slice(0, 10)) : 'Nunca'}</span></div>
  </div>
  <div class="grupo" style="margin-top:24px">
    <button class="fila enlace" onclick={elegirCopia}>Restaurar una copia…</button>
  </div>
  <p class="nota">Restaurar sustituye todos los datos actuales por los de la copia.</p>
{:else}
  <h1>Ajustes</h1>
  <div class="grupo">
    <button class="fila" onclick={() => ir('ajustes/arrendador')}>
      <span class="etiqueta">Arrendador<span class="sub">{d.emisor?.nombre || 'Sin rellenar'}</span></span><span class="flecha"></span>
    </button>
    <button class="fila" onclick={() => ir('ajustes/contrato')}>
      <span class="etiqueta">Inquilino y contrato<span class="sub">{d.contrato ? `${d.contrato.inquilino.nombre || 'Sin inquilino'} · ${euros(d.contrato.renta)}/mes` : 'Sin rellenar'}</span></span><span class="flecha"></span>
    </button>
    <button class="fila" onclick={() => ir('ajustes/numeracion')}>
      <span class="etiqueta">Numeración y Renta<span class="sub">Facturas anteriores, amortización</span></span><span class="flecha"></span>
    </button>
  </div>

  <h2>Datos</h2>
  <div class="grupo">
    <button class="fila" onclick={() => ir('ajustes/copias')}>
      <span class="etiqueta">Copia de seguridad<span class="sub">{d.ajustes.ultimaCopia ? `Hace ${diasEntre(d.ajustes.ultimaCopia.slice(0, 10), hoy())} días` : 'Nunca'}</span></span><span class="flecha"></span>
    </button>
    <button class="fila" onclick={() => exportarLibro('expedidas', anyo)}><span class="etiqueta">Libro de facturas emitidas {anyo} (CSV)</span></button>
    <button class="fila" onclick={() => exportarLibro('recibidas', anyo)}><span class="etiqueta">Libro de gastos {anyo} (CSV)</span></button>
    <button class="fila" onclick={() => exportarLibro('expedidas', anyo - 1)}><span class="etiqueta">Libro de facturas emitidas {anyo - 1} (CSV)</span></button>
  </div>
  <p class="nota">Los libros registro son obligatorios por el IVA. Pásaselos al gestor si los pide.</p>

  <h2>Recordatorios</h2>
  <div class="grupo">
    <button class="fila enlace" onclick={calendario}>Añadir recordatorios al Calendario…</button>
  </div>
  <p class="nota">El día 1 de cada mes para la factura y al principio de cada plazo del IVA.</p>

  <h2>Información</h2>
  <div class="grupo">
    <a class="fila" href="https://github.com/juanitreque/alquiler-local/blob/main/MANUAL.md" target="_blank" rel="noopener"><span class="etiqueta">Manual de uso</span><span class="flecha"></span></a>
    <button class="fila" onclick={() => ir('ajustes/legal')}><span class="etiqueta">Qué dice la ley</span><span class="flecha"></span></button>
  </div>
  <p class="nota">
    App creada para un uso particular: facturar el alquiler de un local comercial de una persona física a una empresa o autónomo
    en Baleares. Es gratuita y no envía datos a ningún servidor. No sustituye el consejo de un asesor fiscal.
  </p>
{/if}

{#if restaurando}
  <Modal titulo="¿Restaurar la copia?" texto="Se sustituirán todos los datos actuales de la app por los de la copia." cerrar={() => (restaurando = null)}>
    <button class="boton" style="background:var(--peligro)" onclick={confirmarRestauracion}>Restaurar</button>
    <button class="boton secundario" onclick={() => (restaurando = null)}>Cancelar</button>
  </Modal>
{/if}
