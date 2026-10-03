<script lang="ts">
  import { codigo, ultimaDeSerie } from '../../core/factura';
  import { hoy, partes } from '../../core/fechas';
  import { app, cambiar } from '../../datos/estado.svelte';
  import Cabecera from '../../ui/Cabecera.svelte';
  import CampoImporte from '../../ui/CampoImporte.svelte';
  import { volver } from '../../ui/ruta.svelte';
  import { avisar } from '../../ui/toast.svelte';

  const anyo = partes(hoy()).anyo;
  let previa = $state(app.datos.ajustes.numeracionPrevia[`F${anyo}`] ?? 0);
  let amortizacion = $state(app.datos.ajustes.amortizacionAnual);
  let valorConstruccion = $state(0);
  const ultimaEnApp = ultimaDeSerie(app.datos, 'F', anyo)?.numero ?? 0;

  async function guardar() {
    await cambiar((d) => {
      d.ajustes.numeracionPrevia[`F${anyo}`] = Math.max(0, Math.floor(previa));
      d.ajustes.amortizacionAnual = amortizacion;
    });
    avisar('Guardado');
    volver('ajustes');
  }
</script>

<Cabecera titulo="Numeración y Renta" atras="ajustes" atrasTexto="Ajustes" accion={guardar} accionTexto="Guardar" />

<h2>Numeración de facturas {anyo}</h2>
<div class="grupo">
  <div class="campo">
    <label for="prev">Última factura hecha fuera de la app</label>
    <input id="prev" type="number" inputmode="numeric" min="0" bind:value={previa} />
  </div>
  <div class="fila"><span class="etiqueta">La próxima será</span><span class="valor">{codigo('F', anyo, Math.max(previa || 0, ultimaEnApp) + 1)}</span></div>
</div>
<p class="nota">
  La numeración tiene que ser correlativa y sin saltos dentro del año. Si este año ya se hicieron facturas con otro programa o el gestor,
  pon aquí el número de la última (por ejemplo, 9 si la última fue la 9) y la app seguirá desde ahí. Cada año empieza de nuevo en 001.
</p>

<h2>Amortización del local (Renta)</h2>
<div class="grupo">
  <CampoImporte etiqueta="Valor de la construcción" bind:valor={valorConstruccion} />
  {#if valorConstruccion > 0}
    <button class="fila enlace" onclick={() => (amortizacion = Math.round(valorConstruccion * 0.03))}>Usar el 3 %</button>
  {/if}
  <CampoImporte etiqueta="Amortización anual" bind:valor={amortizacion} />
</div>
<p class="nota">
  Es el 3 % del mayor entre el coste de adquisición y el valor catastral, contando solo la construcción (no el suelo).
  Lo más fiable es copiar la cifra de la Renta del año pasado o pedírsela al gestor.
</p>
