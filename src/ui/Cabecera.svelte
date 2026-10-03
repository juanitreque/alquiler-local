<script lang="ts">
  import { volver } from './ruta.svelte';

  let { titulo, atras, atrasTexto = 'Atrás', accion, accionTexto, accionDesactivada = false }: {
    titulo: string;
    atras?: string;
    atrasTexto?: string;
    accion?: () => void;
    accionTexto?: string;
    accionDesactivada?: boolean;
  } = $props();
</script>

<div class="cabecera">
  {#if atras}
    <button class="atras" onclick={() => volver(atras)}>
      <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><path d="M10 2 2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      {atrasTexto}
    </button>
  {:else}<span></span>{/if}
  {#if accion}
    <button class="accion" onclick={accion} disabled={accionDesactivada}>{accionTexto}</button>
  {/if}
</div>
<h1>{titulo}</h1>
