<script lang="ts">
  import { euros } from '../core/dinero';
  import { capitalizar, corta, hoy, mesDe, nombreMes } from '../core/fechas';
  import { app, cambiar } from '../datos/estado.svelte';
  import { compartirArchivo } from '../datos/compartir';
  import Cabecera from '../ui/Cabecera.svelte';
  import Modal from '../ui/Modal.svelte';
  import { ir } from '../ui/ruta.svelte';
  import { avisar } from '../ui/toast.svelte';

  let { id }: { id: string } = $props();

  const f = $derived(app.datos.facturas.find((x) => x.id === id));
  const rectificativa = $derived(f?.rectificadaPor ? app.datos.facturas.find((x) => x.id === f.rectificadaPor) : undefined);
  const mesRefacturado = $derived(
    f && app.datos.facturas.some((x) => x.serie === 'F' && !x.rectificadaPor && x.periodo.desde === f.periodo.desde),
  );

  // Se precarga al abrir la ficha: iOS solo muestra la hoja de compartir si se llama justo tras el toque.
  let pdf = $state<typeof import('../pdf/facturaPdf') | null>(null);
  import('../pdf/facturaPdf').then((m) => (pdf = m));

  let cobrando = $state(false);
  let fechaCobro = $state(hoy());

  async function compartir() {
    if (!f || !pdf) return;
    try {
      const r = await compartirArchivo(pdf.facturaPdf($state.snapshot(f)), pdf.nombreArchivo(f), `Factura ${f.codigo}`);
      if (r === 'descargado') avisar('PDF descargado');
    } catch (e) {
      avisar(`No se pudo compartir: ${(e as Error).message}`);
    }
  }

  function verPdf() {
    if (!f || !pdf) return;
    const url = URL.createObjectURL(pdf.facturaPdf($state.snapshot(f)));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function marcarCobro(fecha: string | null) {
    await cambiar((d) => {
      const x = d.facturas.find((x) => x.id === id);
      if (x) {
        if (fecha) x.cobro = fecha;
        else delete x.cobro;
      }
    });
    cobrando = false;
  }
</script>

{#if !f}
  <Cabecera titulo="Factura" atras="facturas" atrasTexto="Facturas" />
  <p class="vacio">No existe esta factura.</p>
{:else}
  <Cabecera titulo={f.codigo} atras="facturas" atrasTexto="Facturas" />

  {#if f.rectificadaPor}
    <div class="aviso">
      Anulada por la rectificativa
      <a href="#/facturas/{f.rectificadaPor}" style="color:inherit;font-weight:600">{rectificativa?.codigo}</a>.
    </div>
  {/if}
  {#if f.rectifica}
    <div class="aviso">
      Rectifica la factura <a href="#/facturas/{f.rectifica.id}" style="color:inherit;font-weight:600">{f.rectifica.codigo}</a>.
      Motivo: {f.rectifica.motivo}
    </div>
  {/if}

  <div class="tarjeta">
    <div class="titulo" style="color:var(--secundario)">{f.serie === 'R' ? 'Rectificativa' : capitalizar(nombreMes(mesDe(f.periodo.desde)))}</div>
    <div class="grande">{euros(f.total)}</div>
    <div style="color:var(--secundario);font-size:15px">{f.destinatario.nombre}</div>
  </div>

  <button class="boton" onclick={compartir} disabled={!pdf}>Enviar PDF…</button>
  <button class="boton secundario" onclick={verPdf} disabled={!pdf}>Ver PDF</button>

  {#if f.serie === 'F' && !f.rectificadaPor}
    <h2>Cobro</h2>
    <div class="grupo">
      {#if f.cobro}
        <div class="fila"><span class="etiqueta">Cobrada</span><span class="valor ok">{corta(f.cobro)}</span></div>
        <button class="fila enlace" onclick={() => marcarCobro(null)}>Marcar como pendiente</button>
      {:else}
        <div class="fila"><span class="etiqueta">Estado</span><span class="etiqueta-estado pendiente">Pendiente</span></div>
        <button class="fila enlace" onclick={() => (cobrando = true)}>Marcar como cobrada…</button>
      {/if}
    </div>
  {/if}

  <h2>Detalle</h2>
  <div class="grupo">
    <div class="fila"><span class="etiqueta">Fecha de la factura</span><span class="valor">{corta(f.fechaExpedicion)}</span></div>
    <div class="fila"><span class="etiqueta">Periodo</span><span class="valor">{corta(f.periodo.desde)} – {corta(f.periodo.hasta)}</span></div>
    {#each f.lineas as l, i (i)}
      <div class="fila"><span class="etiqueta">{l.concepto}</span><span class="valor">{euros(l.importe)}</span></div>
    {/each}
    <div class="fila"><span class="etiqueta">Base imponible</span><span class="valor">{euros(f.base)}</span></div>
    <div class="fila"><span class="etiqueta">IVA {f.tipoIVA} %</span><span class="valor">{euros(f.cuotaIVA)}</span></div>
    {#if f.tipoRetencion}
      <div class="fila"><span class="etiqueta">Retención {f.tipoRetencion} %</span><span class="valor">{euros(-f.retencion)}</span></div>
    {/if}
    <div class="fila total"><span class="etiqueta">Total</span><span class="valor">{euros(f.total)}</span></div>
  </div>

  {#if f.serie === 'F' && !f.rectificadaPor}
    <h2>¿Hay un error?</h2>
    <div class="grupo">
      <button class="fila enlace" onclick={() => ir(`facturas/${f.id}/rectificar`)}>Crear factura rectificativa</button>
    </div>
    <p class="nota">Una factura emitida no se puede editar ni borrar. Se anula con una rectificativa y se hace una nueva.</p>
  {:else if !mesRefacturado && (f.rectificadaPor || f.rectifica)}
    <div style="margin-top:20px">
      <button class="boton secundario" onclick={() => ir(`facturas/nueva?mes=${f.periodo.desde.slice(0, 7)}`)}>
        Hacer la factura correcta de {nombreMes(mesDe(f.periodo.desde))}
      </button>
    </div>
  {/if}
{/if}

{#if cobrando}
  <Modal titulo="Marcar como cobrada" cerrar={() => (cobrando = false)}>
    <div class="grupo" style="margin-bottom:16px">
      <div class="campo"><label for="fc">Fecha de cobro</label><input id="fc" type="date" bind:value={fechaCobro} /></div>
    </div>
    <button class="boton" onclick={() => marcarCobro(fechaCobro)}>Guardar</button>
  </Modal>
{/if}
