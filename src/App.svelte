<script lang="ts">
  import { app } from './datos/estado.svelte';
  import { ruta } from './ui/ruta.svelte';
  import { toast } from './ui/toast.svelte';
  import Inicio from './vistas/Inicio.svelte';
  import Facturas from './vistas/Facturas.svelte';
  import FacturaNueva from './vistas/FacturaNueva.svelte';
  import FacturaDetalle from './vistas/FacturaDetalle.svelte';
  import Gastos from './vistas/Gastos.svelte';
  import GastoForm from './vistas/GastoForm.svelte';
  import Impuestos from './vistas/Impuestos.svelte';
  import Ajustes from './vistas/Ajustes.svelte';

  const [p0, p1, p2] = $derived(ruta.partes);
  const clave = $derived(ruta.partes.join('/') + '?' + ruta.query.toString());

  const PESTANAS = [
    { id: '', nombre: 'Inicio', icono: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h5v-5.5h3V20h5V9.5' },
    { id: 'facturas', nombre: 'Facturas', icono: 'M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 15h7' },
    { id: 'gastos', nombre: 'Gastos', icono: 'M4 7h16v12H4zM4 11h16M8 15h3' },
    { id: 'impuestos', nombre: 'Impuestos', icono: 'M5 20V10M10 20V5M15 20v-7M20 20V8' },
    { id: 'ajustes', nombre: 'Ajustes', icono: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3' },
  ];
</script>

<main>
  {#if !app.listo}
    <p class="vacio">Cargando…</p>
  {:else}
    {#if app.error}<div class="aviso">{app.error}</div>{/if}
    {#key clave}
      {#if p0 === 'facturas' && p1 === 'nueva'}
        <FacturaNueva />
      {:else if p0 === 'facturas' && p1 && p2 === 'rectificar'}
        <FacturaNueva rectificarId={p1} />
      {:else if p0 === 'facturas' && p1}
        <FacturaDetalle id={p1} />
      {:else if p0 === 'facturas'}
        <Facturas />
      {:else if p0 === 'gastos' && p1 === 'nuevo'}
        <GastoForm />
      {:else if p0 === 'gastos' && p1}
        <GastoForm id={p1} />
      {:else if p0 === 'gastos'}
        <Gastos />
      {:else if p0 === 'impuestos'}
        <Impuestos />
      {:else if p0 === 'ajustes'}
        <Ajustes />
      {:else}
        <Inicio />
      {/if}
    {/key}
  {/if}
</main>

<nav class="pestanas">
  {#each PESTANAS as p (p.id)}
    <a href="#/{p.id}" class:activa={(p0 ?? '') === p.id}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.icono} /></svg>
      {p.nombre}
    </a>
  {/each}
</nav>

{#if toast.texto}<div class="toast" role="status">{toast.texto}</div>{/if}
