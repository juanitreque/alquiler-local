<script lang="ts">
  import { euros, porcentaje } from '../core/dinero';
  import { hoy } from '../core/fechas';
  import { CATEGORIAS_GASTO, nuevoId, type CategoriaGasto, type Gasto } from '../core/modelo';
  import { app, cambiar } from '../datos/estado.svelte';
  import Cabecera from '../ui/Cabecera.svelte';
  import CampoImporte from '../ui/CampoImporte.svelte';
  import Modal from '../ui/Modal.svelte';
  import { ir } from '../ui/ruta.svelte';

  let { id }: { id?: string } = $props();

  const existente = id ? app.datos.gastos.find((g) => g.id === id) : undefined;
  let g = $state<Gasto>(
    existente
      ? { ...existente }
      : {
          id: nuevoId(), fecha: hoy(), categoria: 'reparacion', proveedor: '', nifProveedor: '', numeroFactura: '',
          concepto: '', base: 0, cuotaIVA: 0, ivaDeducible: true, deducibleRenta: true, notas: '',
        },
  );
  let borrando = $state(false);

  function cambiarCategoria() {
    const c = CATEGORIAS_GASTO[g.categoria];
    if (!c.iva) {
      g.cuotaIVA = 0;
      g.ivaDeducible = false;
    } else if (!existente) {
      g.ivaDeducible = true;
    }
    g.deducibleRenta = g.categoria !== 'mejora';
  }

  const valido = $derived(g.base > 0 || g.cuotaIVA > 0);

  async function guardar() {
    const copia = $state.snapshot(g) as Gasto;
    await cambiar((d) => {
      const i = d.gastos.findIndex((x) => x.id === copia.id);
      if (i >= 0) d.gastos[i] = copia;
      else d.gastos.push(copia);
    });
    ir('gastos', true);
  }

  async function borrar() {
    await cambiar((d) => {
      d.gastos = d.gastos.filter((x) => x.id !== g.id);
    });
    ir('gastos', true);
  }
</script>

<Cabecera titulo={existente ? 'Gasto' : 'Nuevo gasto'} atras="gastos" atrasTexto="Gastos" accion={guardar} accionTexto="Guardar" accionDesactivada={!valido} />

<div class="grupo">
  <div class="campo">
    <label for="cat">Tipo</label>
    <select id="cat" bind:value={g.categoria} onchange={cambiarCategoria}>
      {#each Object.entries(CATEGORIAS_GASTO) as [clave, c] (clave)}
        <option value={clave as CategoriaGasto}>{c.nombre}</option>
      {/each}
    </select>
  </div>
  <div class="campo"><label for="fecha">Fecha</label><input id="fecha" type="date" bind:value={g.fecha} /></div>
</div>
{#if CATEGORIAS_GASTO[g.categoria].ayuda}<p class="nota">{CATEGORIAS_GASTO[g.categoria].ayuda}</p>{/if}

<h2>Factura</h2>
<div class="grupo">
  <div class="campo"><label for="prov">Proveedor</label><input id="prov" bind:value={g.proveedor} placeholder="Nombre" /></div>
  <div class="campo"><label for="nifp">NIF proveedor</label><input id="nifp" bind:value={g.nifProveedor} autocapitalize="characters" /></div>
  <div class="campo"><label for="num">Nº de factura</label><input id="num" bind:value={g.numeroFactura} /></div>
  <div class="campo apilado"><label for="conc">Concepto</label><input id="conc" bind:value={g.concepto} /></div>
</div>

<h2>Importes</h2>
<div class="grupo">
  <CampoImporte etiqueta="Base (sin IVA)" bind:valor={g.base} />
  {#if CATEGORIAS_GASTO[g.categoria].iva}
    <CampoImporte etiqueta="IVA" bind:valor={g.cuotaIVA} />
    {#if g.base > 0}
      <button class="fila enlace" style="font-size:15px" onclick={() => (g.cuotaIVA = porcentaje(21, g.base))}>Calcular IVA al 21 % ({euros(porcentaje(21, g.base))})</button>
    {/if}
  {/if}
  <div class="fila total"><span class="etiqueta">Total</span><span class="valor">{euros(g.base + g.cuotaIVA)}</span></div>
</div>

<div class="grupo" style="margin-top:16px">
  {#if g.cuotaIVA > 0}
    <label class="interruptor">
      <span>Descontar el IVA en el 303<small>Solo si la factura está a nombre y NIF del arrendador</small></span>
      <input type="checkbox" bind:checked={g.ivaDeducible} />
    </label>
  {/if}
  <label class="interruptor">
    <span>Gasto deducible en la Renta<small>Las mejoras no: se amortizan</small></span>
    <input type="checkbox" bind:checked={g.deducibleRenta} />
  </label>
</div>

<h2>Notas</h2>
<div class="grupo"><div class="campo apilado"><textarea bind:value={g.notas} aria-label="Notas"></textarea></div></div>

{#if existente}
  <div class="grupo" style="margin-top:24px"><button class="fila peligro" onclick={() => (borrando = true)}>Borrar gasto</button></div>
{/if}

{#if borrando}
  <Modal titulo="¿Borrar este gasto?" texto="Se quitará de los cálculos del IVA y de la Renta." cerrar={() => (borrando = false)}>
    <button class="boton" style="background:var(--peligro)" onclick={borrar}>Borrar</button>
    <button class="boton secundario" onclick={() => (borrando = false)}>Cancelar</button>
  </Modal>
{/if}
