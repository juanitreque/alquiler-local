<script lang="ts">
  import { euros } from '../core/dinero';
  import {
    borradorMensual, borradorRectificativa, calcular, codigo, emitir, mesAFacturar, problemasEmision, siguienteNumero, type Borrador,
  } from '../core/factura';
  import { capitalizar, corta, hoy, inicioMes, mesDe, nombreMes, partes, type Mes } from '../core/fechas';
  import { nuevoId, type Factura } from '../core/modelo';
  import { app, cambiar } from '../datos/estado.svelte';
  import Cabecera from '../ui/Cabecera.svelte';
  import CampoImporte from '../ui/CampoImporte.svelte';
  import Modal from '../ui/Modal.svelte';
  import { ir, ruta } from '../ui/ruta.svelte';
  import { avisar } from '../ui/toast.svelte';

  let { rectificarId }: { rectificarId?: string } = $props();

  const d = app.datos;
  const original: Factura | undefined = rectificarId ? d.facturas.find((f) => f.id === rectificarId) : undefined;

  /** El mes indicado en el enlace o el más antiguo sin facturar desde el inicio del contrato. */
  function mesPropuesto(): Mes {
    const q = ruta.query.get('mes');
    return q ? mesDe(`${q}-01`) : mesAFacturar(d, mesDe(hoy()));
  }

  let mesTexto = $state(inicioMes(mesPropuesto()).slice(0, 7));
  let b = $state<Borrador | null>(
    original
      ? borradorRectificativa(original, '', hoy())
      : d.contrato ? borradorMensual(d.contrato, mesDe(`${mesTexto}-01`), hoy()) : null,
  );
  let retiene = $state((b?.tipoRetencion ?? 0) > 0);
  let confirmar = $state(false);

  function cambiarMes() {
    if (!d.contrato || !b || !/^\d{4}-\d{2}$/.test(mesTexto)) return;
    const nuevo = borradorMensual(d.contrato, mesDe(`${mesTexto}-01`), b.fechaExpedicion);
    b.periodo = nuevo.periodo;
    b.lineas = nuevo.lineas;
  }

  $effect(() => {
    if (b && !original) b.tipoRetencion = retiene ? d.contrato?.tipoRetencion ?? 19 : 0;
  });

  const totales = $derived(b ? calcular(b.lineas, b.tipoIVA, b.tipoRetencion) : null);
  const problemas = $derived(b ? problemasEmision(app.datos, b) : []);
  const numeroPrevisto = $derived(b ? codigo(b.serie, partes(b.fechaExpedicion).anyo, siguienteNumero(app.datos, b.serie, partes(b.fechaExpedicion).anyo)) : '');

  async function emitirFactura() {
    if (!b) return;
    const f = emitir(app.datos, $state.snapshot(b) as Borrador, nuevoId(), new Date().toISOString());
    await cambiar((datos) => {
      datos.facturas.push(f);
      if (f.rectifica) {
        const o = datos.facturas.find((x) => x.id === f.rectifica!.id);
        if (o) o.rectificadaPor = f.id;
      }
    });
    avisar(`Factura ${f.codigo} emitida`);
    ir(`facturas/${f.id}`, true);
  }
</script>

<Cabecera titulo={original ? 'Rectificar' : 'Nueva factura'} atras={original ? `facturas/${original.id}` : 'facturas'} atrasTexto={original ? original.codigo : 'Facturas'} />

{#if !b}
  <div class="aviso">Primero rellena el contrato en Ajustes.</div>
  <button class="boton" onclick={() => ir('ajustes/contrato')}>Ir al contrato</button>
{:else}
  {#if original}
    <p class="nota" style="margin:0 4px 8px">
      Se emitirá una factura rectificativa que anula por completo la {original.codigo} (mismos importes en negativo).
      Después podrás hacer la factura correcta de ese mes.
    </p>
    <div class="grupo">
      <div class="campo apilado">
        <label for="motivo">Motivo de la rectificación</label>
        <input id="motivo" bind:value={b.rectifica!.motivo} placeholder="Ej.: importe de la renta erróneo" />
      </div>
    </div>
  {:else}
    <div class="grupo">
      <div class="campo">
        <label for="mes">Mes que se factura</label>
        <input id="mes" type="month" bind:value={mesTexto} onchange={cambiarMes} />
      </div>
      <div class="fila"><span class="etiqueta">Periodo</span><span class="valor">{corta(b.periodo.desde)} – {corta(b.periodo.hasta)}</span></div>
    </div>
  {/if}

  <h2>Fecha</h2>
  <div class="grupo">
    <div class="campo">
      <label for="fecha">Fecha de la factura</label>
      <input id="fecha" type="date" bind:value={b.fechaExpedicion} />
    </div>
  </div>

  <h2>Conceptos</h2>
  <div class="grupo">
    {#each b.lineas as linea, i (i)}
      <div class="campo apilado">
        <label for="c{i}">Concepto {i + 1}</label>
        <input id="c{i}" bind:value={linea.concepto} readonly={!!original} />
      </div>
      {#if original}
        <div class="fila"><span class="etiqueta">Importe</span><span class="valor">{euros(linea.importe)}</span></div>
      {:else}
        <CampoImporte etiqueta="Importe (sin IVA)" bind:valor={linea.importe} />
        {#if b.lineas.length > 1}
          <button class="fila peligro" style="font-size:15px" onclick={() => b!.lineas.splice(i, 1)}>Quitar concepto {i + 1}</button>
        {/if}
      {/if}
    {/each}
    {#if !original}
      <button class="fila enlace" onclick={() => b!.lineas.push({ concepto: '', importe: 0 })}>＋ Añadir concepto</button>
    {/if}
  </div>
  {#if !original}
    <p class="nota">Los gastos que se cobran al inquilino (IBI, comunidad, agua…) forman parte de la base y llevan IVA y retención.</p>

    <div class="grupo" style="margin-top:16px">
      <label class="interruptor">
        <span>Retención IRPF {d.contrato?.tipoRetencion ?? 19} %<small>El inquilino es empresa o autónomo</small></span>
        <input type="checkbox" bind:checked={retiene} />
      </label>
    </div>
  {/if}

  {#if totales}
    <h2>Totales</h2>
    <div class="grupo">
      <div class="fila"><span class="etiqueta">Base imponible</span><span class="valor">{euros(totales.base)}</span></div>
      <div class="fila"><span class="etiqueta">IVA {totales.tipoIVA} %</span><span class="valor">{euros(totales.cuotaIVA)}</span></div>
      {#if totales.tipoRetencion > 0}
        <div class="fila"><span class="etiqueta">Retención IRPF {totales.tipoRetencion} %</span><span class="valor">{euros(-totales.retencion)}</span></div>
      {/if}
      <div class="fila total"><span class="etiqueta">Total a pagar</span><span class="valor">{euros(totales.total)}</span></div>
    </div>
  {/if}

  {#if problemas.length}
    <div class="aviso"><strong>Antes de emitir:</strong><ul>{#each problemas as p (p)}<li>{p}</li>{/each}</ul></div>
  {/if}

  <div style="margin-top:20px">
    <button class="boton" disabled={problemas.length > 0} onclick={() => (confirmar = true)}>Emitir factura {numeroPrevisto}</button>
  </div>
{/if}

{#if confirmar && b && totales}
  <Modal titulo="¿Emitir la factura {numeroPrevisto}?" texto="Una vez emitida no se puede modificar ni borrar; solo se puede corregir con una rectificativa." cerrar={() => (confirmar = false)}>
    <div class="grupo" style="margin-bottom:16px">
      {#if !original}<div class="fila"><span class="etiqueta">Mes</span><span class="valor">{capitalizar(nombreMes(mesDe(b.periodo.desde)))}</span></div>{/if}
      <div class="fila"><span class="etiqueta">Fecha</span><span class="valor">{corta(b.fechaExpedicion)}</span></div>
      <div class="fila total"><span class="etiqueta">Total</span><span class="valor">{euros(totales.total)}</span></div>
    </div>
    <button class="boton" onclick={emitirFactura}>Emitir</button>
    <button class="boton secundario" onclick={() => (confirmar = false)}>Revisar</button>
  </Modal>
{/if}
