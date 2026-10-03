<script lang="ts">
  import type { Snippet } from 'svelte';
  let { titulo, texto, cerrar, children }: { titulo: string; texto?: string; cerrar: () => void; children: Snippet } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="modal-fondo" onclick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
  <div class="modal" role="dialog" aria-modal="true">
    <h3>{titulo}</h3>
    {#if texto}<p>{texto}</p>{/if}
    {@render children()}
  </div>
</div>
