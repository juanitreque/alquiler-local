<script lang="ts">
  import { untrack } from 'svelte';
  import { editable, parsear, type Centimos } from '../core/dinero';

  let { etiqueta, valor = $bindable(), negativo = false, placeholder = '0,00' }: {
    etiqueta: string;
    valor: Centimos;
    negativo?: boolean;
    placeholder?: string;
  } = $props();

  const idCampo = `imp-${Math.random().toString(36).slice(2, 9)}`;
  let texto = $state(editable(valor));
  let error = $state(false);

  // Si el valor cambia desde fuera (p. ej. al cargar), refrescar el texto.
  $effect(() => {
    const v = valor;
    untrack(() => {
      if (parsear(texto) !== v && !(texto === '' && v === 0)) texto = editable(v);
    });
  });

  function actualizar() {
    if (texto.trim() === '') {
      valor = 0;
      error = false;
      return;
    }
    const c = parsear(texto);
    error = c === null || (!negativo && c < 0);
    if (!error && c !== null) valor = c;
  }
</script>

<div class="campo" class:error>
  <label for={idCampo}>{etiqueta}</label>
  <input
    id={idCampo}
    type="text" inputmode="decimal" {placeholder} bind:value={texto} oninput={actualizar}
    onblur={() => { if (!error) texto = editable(valor); }}
  />
  <span class="valor">€</span>
</div>
