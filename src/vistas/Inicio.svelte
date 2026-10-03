<script lang="ts">
  import { euros } from '../core/dinero';
  import { borradorMensual, calcular, fechaDevengo, plazoExpedicion } from '../core/factura';
  import {
    capitalizar, corta, diasEntre, hoy, inicioMes, mesAnterior, mesDe, MESES, nombreMes, plazo303, etiquetaTrimestre,
    trimestreAPresentar, type Mes,
  } from '../core/fechas';
  import { liquidacion303 } from '../core/impuestos';
  import { app } from '../datos/estado.svelte';
  import { ir } from '../ui/ruta.svelte';

  const d = $derived(app.datos);
  const h = hoy();
  const configurado = $derived(!!d.emisor?.nif && !!d.contrato?.inquilino.nif);

  const vigentes = $derived(d.facturas.filter((f) => f.serie === 'F' && !f.rectificadaPor));
  const facturado = (m: Mes) => vigentes.find((f) => f.periodo.desde === inicioMes(m));
  const mesActual = mesDe(h);
  const anterior = mesAnterior(mesActual);
  const facturaActual = $derived(facturado(mesActual));
  // Solo avisa si ya se usaba la app antes de ese mes (las facturas previas pudieron hacerse en otro sitio).
  const faltaAnterior = $derived(
    vigentes.some((f) => f.periodo.desde < inicioMes(anterior)) && !facturado(anterior),
  );
  const estimado = $derived(d.contrato ? calcular(borradorMensual(d.contrato, mesActual, h).lineas, d.contrato.tipoIVA,
    d.contrato.aplicaRetencion ? d.contrato.tipoRetencion : 0) : null);

  const pendientesCobro = $derived(
    d.facturas.filter((f) => f.serie === 'F' && !f.cobro && !f.rectificadaPor).sort((a, b) => a.fechaExpedicion.localeCompare(b.fechaExpedicion)),
  );

  const t = trimestreAPresentar(h);
  const plazo = plazo303(t);
  const presentado = $derived(d.presentaciones.some((p) => p.anyo === t.anyo && p.trimestre === t.numero));
  const iva = $derived(liquidacion303(t, d.facturas, d.gastos, 0));
  const hayActividadTrimestre = $derived(iva.facturas.length > 0 || d.facturas.some((f) => fechaDevengo(f) < inicioMes(mesActual)));

  const diasCopia = $derived(d.ajustes.ultimaCopia ? diasEntre(d.ajustes.ultimaCopia.slice(0, 10), h) : null);
</script>

<h1>Alquiler</h1>

{#if !configurado}
  <div class="tarjeta destacada">
    <div class="titulo">Primeros pasos</div>
    <p>Antes de la primera factura, rellena los datos del arrendador, del inquilino y del contrato.</p>
    <button class="boton" onclick={() => ir('ajustes')}>Configurar</button>
  </div>
{:else}
  {#if faltaAnterior}
    <div class="aviso">
      <strong>Falta la factura de {nombreMes(anterior)}.</strong> Debe emitirse antes del {corta(plazoExpedicion(anterior))}.
      <button class="boton secundario" style="margin-top:10px" onclick={() => ir(`facturas/nueva?mes=${inicioMes(anterior).slice(0, 7)}`)}>
        Hacer factura de {MESES[anterior.mes - 1]}
      </button>
    </div>
  {/if}

  {#if facturaActual}
    <button class="tarjeta fila" style="padding:16px" onclick={() => ir(`facturas/${facturaActual.id}`)}>
      <span class="etiqueta">
        <span class="titulo" style="font-size:13px;color:var(--secundario)">{capitalizar(nombreMes(mesActual))}</span>
        <span style="display:block;font-weight:600;margin-top:2px">Factura {facturaActual.codigo} emitida <span class="ok">✓</span></span>
        <span class="sub">{euros(facturaActual.total)} · {facturaActual.cobro ? `cobrada el ${corta(facturaActual.cobro)}` : 'pendiente de cobro'}</span>
      </span>
      <span class="flecha"></span>
    </button>
  {:else}
    <div class="tarjeta destacada">
      <div class="titulo">Factura de {nombreMes(mesActual)}</div>
      {#if estimado}<div class="grande">{euros(estimado.total)}</div>{/if}
      <div style="font-size:15px;opacity:.85">Pendiente de emitir · plazo hasta el {corta(plazoExpedicion(mesActual))}</div>
      <button class="boton" onclick={() => ir(`facturas/nueva?mes=${inicioMes(mesActual).slice(0, 7)}`)}>Hacer la factura</button>
    </div>
  {/if}

  {#if hayActividadTrimestre}
    <h2>IVA</h2>
    <div class="grupo">
      <button class="fila" onclick={() => ir(`impuestos?t=${t.anyo}-${t.numero}`)}>
        <span class="etiqueta">
          Modelo 303 · {etiquetaTrimestre(t)}
          <span class="sub">
            {#if presentado}Presentado <span class="ok">✓</span>{:else}Plazo hasta el {corta(plazo)}{/if}
          </span>
        </span>
        <span class="valor">{euros(iva.resultado)}</span>
        <span class="flecha"></span>
      </button>
    </div>
    {#if !presentado && h <= plazo}
      <p class="nota">Quedan {diasEntre(h, plazo)} días para presentarlo.</p>
    {:else if !presentado}
      <p class="nota peligro-texto">El plazo terminó el {corta(plazo)}. Si no se presentó, hay que hacerlo cuanto antes (recargo por presentación tardía).</p>
    {/if}
  {/if}

  {#if pendientesCobro.length}
    <h2>Pendiente de cobro</h2>
    <div class="grupo">
      {#each pendientesCobro as f (f.id)}
        <button class="fila" onclick={() => ir(`facturas/${f.id}`)}>
          <span class="etiqueta">{f.codigo}<span class="sub">{capitalizar(nombreMes(mesDe(f.periodo.desde)))}</span></span>
          <span class="valor">{euros(f.total)}</span>
          <span class="flecha"></span>
        </button>
      {/each}
    </div>
  {/if}

  {#if d.contrato?.mesActualizacion === mesActual.mes}
    <div class="aviso">Este mes toca actualizar la renta según el contrato (IPC u otro índice). Cámbiala en Ajustes › Contrato antes de facturar.</div>
  {/if}
  {#if d.contrato && d.contrato.fianza.importe > 0 && !d.contrato.fianza.fechaDeposito}
    <div class="aviso">No consta el depósito de la fianza en el IBAVI. En Baleares es obligatorio (30 días desde que se cobra). Si ya está hecho, anota la fecha en Ajustes › Contrato.</div>
  {/if}
{/if}

{#if d.facturas.length && (diasCopia === null || diasCopia > 30)}
  <div class="aviso">
    {diasCopia === null ? 'Aún no has hecho ninguna copia de seguridad.' : `La última copia de seguridad es de hace ${diasCopia} días.`}
    Los datos solo están en este iPhone.
    <button class="boton secundario" style="margin-top:10px" onclick={() => ir('ajustes/copias')}>Hacer copia ahora</button>
  </div>
{/if}
