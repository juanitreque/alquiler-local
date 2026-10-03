<script lang="ts">
  import { euros, suma } from '../core/dinero';
  import { corta, hoy, partes } from '../core/fechas';
  import { CATEGORIAS_GASTO } from '../core/modelo';
  import { app } from '../datos/estado.svelte';
  import { ir } from '../ui/ruta.svelte';

  const anyoActual = partes(hoy()).anyo;
  const anyos = $derived([...new Set([anyoActual, ...app.datos.gastos.map((g) => partes(g.fecha).anyo)])].sort((a, b) => b - a));
  let anyo = $state(anyoActual);
  const lista = $derived(app.datos.gastos.filter((g) => partes(g.fecha).anyo === anyo).sort((a, b) => b.fecha.localeCompare(a.fecha)));
</script>

<div class="cabecera"><span></span><button class="accion" onclick={() => ir('gastos/nuevo')}>Añadir</button></div>
<h1>Gastos del local</h1>

{#if anyos.length > 1}
  <div class="selector">
    {#each anyos.slice(0, 4) as a (a)}<button class:activo={a === anyo} onclick={() => (anyo = a)}>{a}</button>{/each}
  </div>
{/if}

{#if lista.length === 0}
  <p class="vacio">No hay gastos en {anyo}.<br />Apunta aquí el IBI, la comunidad, el seguro, reparaciones, la gestoría…</p>
{:else}
  <div class="grupo">
    {#each lista as g (g.id)}
      <button class="fila" onclick={() => ir(`gastos/${g.id}`)}>
        <span class="etiqueta">{g.proveedor || CATEGORIAS_GASTO[g.categoria].nombre}<span class="sub">{corta(g.fecha)} · {CATEGORIAS_GASTO[g.categoria].nombre}</span></span>
        <span class="valor">{euros(g.base + g.cuotaIVA)}</span>
        <span class="flecha"></span>
      </button>
    {/each}
    <div class="fila total"><span class="etiqueta">Total {anyo}</span><span class="valor">{euros(suma(lista, (g) => g.base + g.cuotaIVA))}</span></div>
  </div>
{/if}
<p class="nota">El IVA de los gastos con factura a nombre del arrendador se descuenta en el 303. Todos los gastos deducibles van a la Renta.</p>
