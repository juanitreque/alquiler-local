<script lang="ts">
  import { euros, suma } from '../core/dinero';
  import { capitalizar, hoy, mesDe, nombreMes, partes } from '../core/fechas';
  import type { Factura } from '../core/modelo';
  import { app } from '../datos/estado.svelte';
  import { ir } from '../ui/ruta.svelte';

  const anyoActual = partes(hoy()).anyo;
  const anyos = $derived(
    [...new Set([anyoActual, ...app.datos.facturas.map((f) => f.anyo)])].sort((a, b) => b - a),
  );
  let anyo = $state(anyoActual);

  const lista = $derived(
    app.datos.facturas.filter((f) => f.anyo === anyo).sort((a, b) => b.fechaExpedicion.localeCompare(a.fechaExpedicion) || b.codigo.localeCompare(a.codigo)),
  );
  const total = $derived(suma(lista, (f) => f.total));

  function estado(f: Factura): { texto: string; clase: string } {
    if (f.serie === 'R') return { texto: 'Rectificativa', clase: 'anulada' };
    if (f.rectificadaPor) return { texto: 'Anulada', clase: 'anulada' };
    return f.cobro ? { texto: 'Cobrada', clase: 'cobrada' } : { texto: 'Pendiente', clase: 'pendiente' };
  }
</script>

<div class="cabecera"><span></span><button class="accion" onclick={() => ir('facturas/nueva')}>Nueva</button></div>
<h1>Facturas</h1>

{#if anyos.length > 1}
  <div class="selector">
    {#each anyos.slice(0, 4) as a (a)}
      <button class:activo={a === anyo} onclick={() => (anyo = a)}>{a}</button>
    {/each}
  </div>
{/if}

{#if lista.length === 0}
  <p class="vacio">No hay facturas en {anyo}.</p>
{:else}
  <div class="grupo">
    {#each lista as f (f.id)}
      {@const e = estado(f)}
      <button class="fila" onclick={() => ir(`facturas/${f.id}`)}>
        <span class="etiqueta">
          {f.codigo}
          <span class="sub">{capitalizar(nombreMes(mesDe(f.periodo.desde)))}</span>
        </span>
        <span class="valor">
          {euros(f.total)}<br /><span class="etiqueta-estado {e.clase}">{e.texto}</span>
        </span>
        <span class="flecha"></span>
      </button>
    {/each}
    <div class="fila total"><span class="etiqueta">Total {anyo}</span><span class="valor">{euros(total)}</span></div>
  </div>
  <p class="nota">Las facturas emitidas no se pueden modificar ni borrar. Para corregir una, ábrela y crea una rectificativa.</p>
{/if}
