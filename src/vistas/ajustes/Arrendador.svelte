<script lang="ts">
  import { personaVacia, type Persona } from '../../core/modelo';
  import { app, cambiar } from '../../datos/estado.svelte';
  import Cabecera from '../../ui/Cabecera.svelte';
  import PersonaForm from '../../ui/PersonaForm.svelte';
  import { volver } from '../../ui/ruta.svelte';
  import { avisar } from '../../ui/toast.svelte';

  let p = $state<Persona>(app.datos.emisor ? { ...app.datos.emisor } : { ...personaVacia(), provincia: 'Illes Balears' });

  async function guardar() {
    const copia = $state.snapshot(p);
    await cambiar((d) => (d.emisor = copia));
    avisar('Guardado');
    volver('ajustes');
  }
</script>

<Cabecera titulo="Arrendador" atras="ajustes" atrasTexto="Ajustes" accion={guardar} accionTexto="Guardar" />
<p class="nota" style="margin:0 4px 12px">El propietario que emite las facturas. Estos datos salen en cada factura.</p>
<PersonaForm bind:persona={p} />
<p class="nota">Los cambios solo afectan a las facturas nuevas: las ya emitidas conservan los datos de su fecha.</p>
