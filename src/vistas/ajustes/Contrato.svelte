<script lang="ts">
  import { euros, porcentaje } from '../../core/dinero';
  import { MESES, hoy } from '../../core/fechas';
  import { nuevoId, personaVacia, type Contrato } from '../../core/modelo';
  import { app, cambiar } from '../../datos/estado.svelte';
  import Cabecera from '../../ui/Cabecera.svelte';
  import CampoImporte from '../../ui/CampoImporte.svelte';
  import PersonaForm from '../../ui/PersonaForm.svelte';
  import { volver } from '../../ui/ruta.svelte';
  import { avisar } from '../../ui/toast.svelte';

  function nuevo(): Contrato {
    return {
      inquilino: personaVacia(),
      inmueble: { direccion: '', referenciaCatastral: '' },
      fechaInicio: hoy(),
      renta: 0,
      conceptosFijos: [],
      tipoIVA: 21,
      aplicaRetencion: true,
      tipoRetencion: 19,
      diaFacturacion: 1,
      mesActualizacion: 0,
      fianza: { importe: 0, fechaDeposito: '', referencia: '' },
      formaPago: 'Transferencia bancaria a la cuenta ES…',
    };
  }

  let c = $state<Contrato>(app.datos.contrato ? structuredClone($state.snapshot(app.datos.contrato)) as Contrato : nuevo());
  const base = $derived(c.renta + c.conceptosFijos.reduce((s, x) => s + x.importe, 0));

  async function guardar() {
    const copia = $state.snapshot(c) as Contrato;
    copia.conceptosFijos = copia.conceptosFijos.filter((x) => x.concepto.trim() && x.importe);
    await cambiar((d) => (d.contrato = copia));
    avisar('Guardado');
    volver('ajustes');
  }
</script>

<Cabecera titulo="Contrato" atras="ajustes" atrasTexto="Ajustes" accion={guardar} accionTexto="Guardar" />

<h2>Inquilino</h2>
<PersonaForm bind:persona={c.inquilino} etiquetaNombre="Nombre o razón social" />

<h2>Local</h2>
<div class="grupo">
  <div class="campo apilado">
    <label for="dir">Descripción y dirección</label>
    <input id="dir" bind:value={c.inmueble.direccion} placeholder="Local comercial en C/ …, CP Población" />
  </div>
  <div class="campo apilado">
    <label for="rc">Referencia catastral</label>
    <input id="rc" bind:value={c.inmueble.referenciaCatastral} autocapitalize="characters" placeholder="20 caracteres, está en el recibo del IBI" />
  </div>
  <div class="campo"><label for="fi">Inicio del contrato</label><input id="fi" type="date" bind:value={c.fechaInicio} /></div>
</div>

<h2>Importe mensual (sin IVA)</h2>
<div class="grupo">
  <CampoImporte etiqueta="Renta" bind:valor={c.renta} />
  {#each c.conceptosFijos as cf, i (cf.id)}
    <div class="campo apilado"><label for="cf{i}">Gasto repercutido {i + 1}</label><input id="cf{i}" bind:value={cf.concepto} placeholder="IBI, comunidad, agua…" /></div>
    <CampoImporte etiqueta="Importe mensual" bind:valor={cf.importe} />
    <button class="fila peligro" style="font-size:15px" onclick={() => c.conceptosFijos.splice(i, 1)}>Quitar</button>
  {/each}
  <button class="fila enlace" onclick={() => c.conceptosFijos.push({ id: nuevoId(), concepto: '', importe: 0 })}>＋ Añadir gasto que paga el inquilino</button>
</div>
<p class="nota">Solo si el contrato dice que el inquilino paga el IBI, la comunidad u otros gastos y se le cobran en la factura. Llevan IVA y retención como la renta.</p>

<h2>Impuestos</h2>
<div class="grupo">
  <div class="fila"><span class="etiqueta">IVA</span><span class="valor">{c.tipoIVA} %</span></div>
  <label class="interruptor">
    <span>Retención IRPF {c.tipoRetencion} %<small>El inquilino es una empresa o un autónomo</small></span>
    <input type="checkbox" bind:checked={c.aplicaRetencion} />
  </label>
  <div class="fila"><span class="etiqueta">Base</span><span class="valor">{euros(base)}</span></div>
  <div class="fila"><span class="etiqueta">+ IVA</span><span class="valor">{euros(porcentaje(c.tipoIVA, base))}</span></div>
  {#if c.aplicaRetencion}<div class="fila"><span class="etiqueta">− Retención</span><span class="valor">{euros(-porcentaje(c.tipoRetencion, base))}</span></div>{/if}
  <div class="fila total"><span class="etiqueta">Cobro mensual</span><span class="valor">{euros(base + porcentaje(c.tipoIVA, base) - (c.aplicaRetencion ? porcentaje(c.tipoRetencion, base) : 0))}</span></div>
</div>
<p class="nota">El inquilino ingresa la retención en Hacienda (modelo 115) y en la Renta se descuenta de lo que tenga que pagar el propietario.</p>

<h2>Facturación</h2>
<div class="grupo">
  <div class="campo">
    <label for="df">Día de la factura</label>
    <select id="df" bind:value={c.diaFacturacion}>
      {#each Array.from({ length: 28 }, (_, i) => i + 1) as dia (dia)}<option value={dia}>día {dia} de cada mes</option>{/each}
    </select>
  </div>
</div>
<p class="nota">La factura de cada mes se hace ese día, con la fecha real y el periodo del mes. Los meses se facturan en orden desde el inicio del contrato.</p>

<h2>Actualización de la renta</h2>
<div class="grupo">
  <div class="campo">
    <label for="ma">Mes de actualización</label>
    <select id="ma" bind:value={c.mesActualizacion}>
      <option value={0}>No se actualiza</option>
      {#each MESES as m, i (m)}<option value={i + 1}>{m}</option>{/each}
    </select>
  </div>
</div>
<p class="nota">La app avisará ese mes para que revises la renta según lo que diga el contrato (IPC u otro índice).</p>

<h2>Fianza</h2>
<div class="grupo">
  <CampoImporte etiqueta="Importe" bind:valor={c.fianza.importe} />
  <div class="campo"><label for="fd">Depositada en el IBAVI el</label><input id="fd" type="date" bind:value={c.fianza.fechaDeposito} /></div>
  <div class="campo"><label for="fr">Nº de depósito</label><input id="fr" bind:value={c.fianza.referencia} /></div>
</div>
<p class="nota">En locales son 2 mensualidades (art. 36 LAU). No se factura ni lleva IVA. En Baleares hay que depositarla en el IBAVI (modelo F-1) en 30 días.</p>

<h2>Forma de pago (sale en la factura)</h2>
<div class="grupo">
  <div class="campo apilado"><textarea bind:value={c.formaPago} aria-label="Forma de pago"></textarea></div>
</div>
