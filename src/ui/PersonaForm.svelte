<script lang="ts">
  import type { Persona } from '../core/modelo';
  import * as NIF from '../core/nif';

  let { persona = $bindable(), etiquetaNombre = 'Nombre y apellidos' }: { persona: Persona; etiquetaNombre?: string } = $props();
  const nifMal = $derived(persona.nif.trim() !== '' && !NIF.valido(persona.nif));
</script>

<div class="grupo">
  <div class="campo apilado"><label for="pn">{etiquetaNombre}</label><input id="pn" bind:value={persona.nombre} autocomplete="off" /></div>
  <div class="campo" class:error={nifMal}>
    <label for="pnif">NIF</label>
    <input id="pnif" bind:value={persona.nif} autocapitalize="characters" autocomplete="off"
      onblur={() => (persona.nif = NIF.normalizar(persona.nif))} />
  </div>
</div>
{#if nifMal}<p class="nota peligro-texto">Este NIF no es válido: revisa números y letra.</p>{/if}

<h2>Domicilio fiscal</h2>
<div class="grupo">
  <div class="campo apilado"><label for="pd">Dirección</label><input id="pd" bind:value={persona.direccion} autocomplete="off" /></div>
  <div class="campo"><label for="pcp">Código postal</label><input id="pcp" bind:value={persona.codigoPostal} inputmode="numeric" maxlength="5" /></div>
  <div class="campo"><label for="pp">Población</label><input id="pp" bind:value={persona.poblacion} /></div>
  <div class="campo"><label for="ppr">Provincia</label><input id="ppr" bind:value={persona.provincia} /></div>
</div>

<h2>Contacto (opcional)</h2>
<div class="grupo">
  <div class="campo"><label for="pe">Email</label><input id="pe" type="email" bind:value={persona.email} autocapitalize="off" /></div>
  <div class="campo"><label for="pt">Teléfono</label><input id="pt" type="tel" bind:value={persona.telefono} /></div>
</div>
