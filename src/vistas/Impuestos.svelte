<script lang="ts">
  import { euros } from '../core/dinero';
  import {
    corta, etiquetaTrimestre, hoy, partes, plazo303, trimestreAnterior, trimestreAPresentar, trimestreSiguiente, trimestreDe,
    type Trimestre,
  } from '../core/fechas';
  import { CATEGORIAS_GASTO, nuevoId, type CategoriaGasto, type Presentacion, type ResultadoDeclaracion } from '../core/modelo';
  import { liquidacion303, resumenRenta, sentido } from '../core/impuestos';
  import { app, cambiar } from '../datos/estado.svelte';
  import CampoImporte from '../ui/CampoImporte.svelte';
  import Modal from '../ui/Modal.svelte';
  import { ir, ruta } from '../ui/ruta.svelte';

  const h = hoy();
  const pestana = $derived(ruta.partes[1] === 'renta' ? 'renta' : 'iva');

  function trimestreInicial(): Trimestre {
    const q = ruta.query.get('t')?.match(/^(\d{4})-([1-4])$/);
    return q ? { anyo: Number(q[1]), numero: Number(q[2]) as Trimestre['numero'] } : trimestreAPresentar(h);
  }
  let t = $state(trimestreInicial());
  const presentacion = $derived(app.datos.presentaciones.find((p) => p.anyo === t.anyo && p.trimestre === t.numero));
  const previa = $derived(
    app.datos.presentaciones.find((p) => {
      const a = trimestreAnterior(t);
      return p.anyo === a.anyo && p.trimestre === a.numero;
    }),
  );
  let pendiente = $state(0);
  $effect(() => {
    pendiente = previa?.resultado === 'compensar' ? previa.importe : 0;
  });

  const l = $derived(liquidacion303(t, app.datos.facturas, app.datos.gastos, pendiente));
  const s = $derived(sentido(l));
  const futuro = $derived(trimestreDe(h).anyo < t.anyo || (trimestreDe(h).anyo === t.anyo && trimestreDe(h).numero <= t.numero));

  // Registrar presentación
  let registrando = $state(false);
  let reg = $state<Omit<Presentacion, 'id' | 'modelo' | 'anyo' | 'trimestre'>>({ resultado: 'ingresar', importe: 0, fecha: h, justificante: '' });
  function abrirRegistro() {
    reg = { resultado: s, importe: Math.abs(l.resultado), fecha: h, justificante: '' };
    registrando = true;
  }
  async function guardarPresentacion() {
    const p: Presentacion = { id: nuevoId(), modelo: '303', anyo: t.anyo, trimestre: t.numero, ...$state.snapshot(reg) };
    await cambiar((d) => {
      d.presentaciones = d.presentaciones.filter((x) => !(x.anyo === p.anyo && x.trimestre === p.trimestre));
      d.presentaciones.push(p);
    });
    registrando = false;
  }
  async function quitarPresentacion() {
    await cambiar((d) => {
      d.presentaciones = d.presentaciones.filter((x) => !(x.anyo === t.anyo && x.trimestre === t.numero));
    });
  }

  const TEXTO_RESULTADO: Record<ResultadoDeclaracion, string> = {
    ingresar: 'A ingresar', compensar: 'A compensar', devolver: 'A devolver', cero: 'Sin actividad / cero',
  };

  // Renta
  let anyoRenta = $state(partes(h).anyo - (partes(h).mes <= 6 ? 1 : 0));
  const renta = $derived(resumenRenta(anyoRenta, app.datos.facturas, app.datos.gastos, app.datos.ajustes.amortizacionAnual));
</script>

<h1>Impuestos</h1>
<div class="selector">
  <button class:activo={pestana === 'iva'} onclick={() => ir('impuestos', true)}>IVA · modelo 303</button>
  <button class:activo={pestana === 'renta'} onclick={() => ir('impuestos/renta', true)}>Renta</button>
</div>

{#if pestana === 'iva'}
  <div class="grupo">
    <div class="fila">
      <button class="accion" style="border:0;background:none;color:var(--acento);font-size:22px;padding:0 8px" aria-label="Trimestre anterior" onclick={() => (t = trimestreAnterior(t))}>‹</button>
      <span class="etiqueta" style="text-align:center;font-weight:600">{etiquetaTrimestre(t)}</span>
      <button class="accion" style="border:0;background:none;color:var(--acento);font-size:22px;padding:0 8px" aria-label="Trimestre siguiente" onclick={() => (t = trimestreSiguiente(t))}>›</button>
    </div>
    <div class="fila"><span class="etiqueta">Plazo</span><span class="valor">del 1 al {corta(plazo303(t))}</span></div>
    {#if presentacion}
      <div class="fila"><span class="etiqueta">Presentado</span><span class="valor ok">{corta(presentacion.fecha)} ✓</span></div>
    {/if}
  </div>
  {#if futuro}<p class="nota">El trimestre aún no ha terminado: los importes pueden cambiar.</p>{/if}

  <h2>IVA devengado (facturas emitidas)</h2>
  <div class="grupo">
    <div class="fila"><span class="etiqueta"><span class="casilla">07</span>Base imponible {l.tipoIVA} %</span><span class="valor">{euros(l.baseDevengada)}</span></div>
    <div class="fila"><span class="etiqueta"><span class="casilla">08</span>Tipo</span><span class="valor">{l.tipoIVA} %</span></div>
    <div class="fila"><span class="etiqueta"><span class="casilla">09</span>Cuota</span><span class="valor">{euros(l.cuotaDevengada)}</span></div>
    <div class="fila total"><span class="etiqueta"><span class="casilla">27</span>Total devengado</span><span class="valor">{euros(l.cuotaDevengada)}</span></div>
  </div>
  <p class="nota">{l.facturas.length === 0 ? 'Sin facturas' : `${l.facturas.length === 1 ? 'Factura' : 'Facturas'}: ${l.facturas.map((f) => f.codigo).join(', ')}`}</p>

  <h2>IVA deducible (gastos)</h2>
  <div class="grupo">
    <div class="fila"><span class="etiqueta"><span class="casilla">28</span>Base operaciones interiores</span><span class="valor">{euros(l.baseDeducible)}</span></div>
    <div class="fila"><span class="etiqueta"><span class="casilla">29</span>Cuota</span><span class="valor">{euros(l.cuotaDeducible)}</span></div>
    <div class="fila total"><span class="etiqueta"><span class="casilla">45</span>Total a deducir</span><span class="valor">{euros(l.cuotaDeducible)}</span></div>
  </div>

  <h2>Resultado</h2>
  <div class="grupo">
    <div class="fila"><span class="etiqueta"><span class="casilla">46</span>Régimen general (= 64 y 66)</span><span class="valor">{euros(l.resultadoRegimenGeneral)}</span></div>
    <CampoImporte etiqueta="110 · Pendiente de compensar de trimestres anteriores" bind:valor={pendiente} />
    {#if pendiente > 0}
      <div class="fila"><span class="etiqueta"><span class="casilla">78</span>Se compensa ahora</span><span class="valor">{euros(l.compensacionAplicada)}</span></div>
      <div class="fila"><span class="etiqueta"><span class="casilla">87</span>Queda para más adelante</span><span class="valor">{euros(pendiente - l.compensacionAplicada)}</span></div>
    {/if}
    <div class="fila total">
      <span class="etiqueta"><span class="casilla">71</span>{TEXTO_RESULTADO[s]}</span>
      <span class="valor">{euros(Math.abs(l.resultado))}</span>
    </div>
  </div>
  {#if s === 'compensar'}<p class="nota">Sale a compensar: no se paga nada y el importe se descuenta en próximos trimestres.</p>{/if}
  {#if s === 'devolver'}<p class="nota">En el 4T puedes pedir la devolución (indica el IBAN) o seguir compensando.</p>{/if}

  {#if l.anual}
    <h2>Resumen anual (4T, exonerado del 390)</h2>
    <div class="grupo">
      <div class="fila"><span class="etiqueta">Página 1: marcar «Exonerado de la Declaración-resumen anual (390)»</span></div>
      <div class="fila"><span class="etiqueta">Marcar «Volumen anual de operaciones distinto de cero»</span><span class="valor">{l.anual.volumenOperaciones ? 'Sí' : 'No'}</span></div>
      <div class="fila"><span class="etiqueta">Actividad principal · epígrafe IAE</span><span class="valor">861.2</span></div>
      <div class="fila"><span class="etiqueta"><span class="casilla">80</span>Operaciones en régimen general {t.anyo}</span><span class="valor">{euros(l.anual.operacionesRegimenGeneral)}</span></div>
      <div class="fila total"><span class="etiqueta"><span class="casilla">88</span>Total volumen de operaciones</span><span class="valor">{euros(l.anual.volumenOperaciones)}</span></div>
    </div>
    <p class="nota">Quien solo alquila locales no presenta el 390, pero rellenar este apartado en el 303 del 4T es obligatorio. Comprueba que las casillas coinciden con el formulario del año.</p>
  {/if}

  <h2>Presentación</h2>
  <div class="grupo">
    {#if presentacion}
      <div class="fila"><span class="etiqueta">{TEXTO_RESULTADO[presentacion.resultado]}</span><span class="valor">{euros(presentacion.importe)}</span></div>
      {#if presentacion.justificante}<div class="fila"><span class="etiqueta">Justificante</span><span class="valor">{presentacion.justificante}</span></div>{/if}
      <button class="fila enlace" onclick={abrirRegistro}>Corregir datos de la presentación</button>
      <button class="fila peligro" onclick={quitarPresentacion}>Marcar como no presentado</button>
    {:else}
      <button class="fila enlace" onclick={abrirRegistro}>Ya lo he presentado…</button>
    {/if}
  </div>
  <p class="nota">
    Se presenta en la sede de la Agencia Tributaria: IVA › Modelo 303 › Presentación. El propietario puede hacerlo con su Cl@ve;
    si lo presenta otra persona en su nombre, el propietario tiene que darle de alta un apoderamiento en la AEAT. Si se domicilia el pago, hay que presentarlo antes del día 15.
  </p>
{:else}
  <div class="selector">
    {#each [partes(h).anyo - 1, partes(h).anyo] as a (a)}<button class:activo={a === anyoRenta} onclick={() => (anyoRenta = a)}>{a}</button>{/each}
  </div>

  <h2>Ingresos {anyoRenta}</h2>
  <div class="grupo">
    <div class="fila"><span class="etiqueta">Ingresos íntegros<span class="sub">{renta.facturas} facturas, sin IVA</span></span><span class="valor">{euros(renta.ingresos)}</span></div>
    <div class="fila"><span class="etiqueta">Retenciones del inquilino<span class="sub">Se restan de lo que sale a pagar</span></span><span class="valor">{euros(renta.retenciones)}</span></div>
  </div>

  <h2>Gastos deducibles</h2>
  <div class="grupo">
    {#each Object.entries(renta.gastosPorCategoria) as [cat, importe] (cat)}
      <div class="fila"><span class="etiqueta">{CATEGORIAS_GASTO[cat as CategoriaGasto].nombre}</span><span class="valor">{euros(importe ?? 0)}</span></div>
    {:else}
      <div class="fila"><span class="etiqueta" style="color:var(--secundario)">Sin gastos apuntados</span></div>
    {/each}
    <div class="fila"><span class="etiqueta">Amortización del local<span class="sub">3 % del valor de la construcción · en Ajustes</span></span><span class="valor">{euros(renta.amortizacion)}</span></div>
  </div>
  {#if renta.excesoTrasladable > 0}
    <p class="nota">Los intereses y reparaciones superan los ingresos: {euros(renta.excesoTrasladable)} se pueden deducir en los 4 años siguientes.</p>
  {/if}

  <h2>Resultado</h2>
  <div class="grupo">
    <div class="fila total"><span class="etiqueta">Rendimiento neto</span><span class="valor">{euros(renta.rendimientoNeto)}</span></div>
  </div>
  <p class="nota">
    En la Renta va en «Rendimientos del capital inmobiliario» (inmueble arrendado, uso distinto de vivienda: sin reducción del 60 %).
    Si el local es ganancial, se reparte al 50 % entre los dos cónyuges. Compara las retenciones con el certificado que entrega el inquilino.
  </p>
{/if}

{#if registrando}
  <Modal titulo="Presentación del 303 {etiquetaTrimestre(t)}" cerrar={() => (registrando = false)}>
    <div class="grupo" style="margin-bottom:16px">
      <div class="campo">
        <label for="rr">Resultado</label>
        <select id="rr" bind:value={reg.resultado}>
          {#each Object.entries(TEXTO_RESULTADO) as [k, v] (k)}<option value={k}>{v}</option>{/each}
        </select>
      </div>
      <CampoImporte etiqueta="Importe" bind:valor={reg.importe} />
      <div class="campo"><label for="rf">Fecha</label><input id="rf" type="date" bind:value={reg.fecha} /></div>
      <div class="campo"><label for="rj">NRC o CSV</label><input id="rj" bind:value={reg.justificante} autocapitalize="characters" /></div>
    </div>
    <button class="boton" onclick={guardarPresentacion}>Guardar</button>
  </Modal>
{/if}
