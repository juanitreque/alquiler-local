# Alquiler

App web instalable (PWA) para que una **persona física** facture el alquiler de un **local comercial** a una
empresa o autónomo en **Baleares (España)**, y lleve el IVA trimestral y los datos de la Renta.

**Abrir la app:** <https://juanitreque.github.io/alquiler-local/> · **[Manual de uso](MANUAL.md)**

## Para quién es

Se creó para un uso concreto y particular, y se comparte por si a alguien en la misma situación le sirve:

- Propietario persona física (no sociedad) que alquila un local de negocio, sin empleados para el alquiler.
- Inquilino empresa o autónomo, que practica la retención del 19 %.
- Inmueble en Baleares (territorio común del IVA; fianza depositada en el IBAVI).

En otros casos (alquiler de vivienda, sociedades, Canarias, País Vasco o Navarra, alquiler turístico) las reglas
cambian y la app no sirve tal cual. Es información general, no asesoramiento fiscal: ante la duda, consulta con un gestor.

## Privacidad

Los datos se guardan solo en el dispositivo (IndexedDB del navegador). La app no tiene servidor, cuentas ni
analítica, y no envía nada a ningún sitio. Las copias de seguridad son archivos JSON que guarda el propio usuario.

## Qué hace

- Factura mensual: renta + gastos repercutidos, IVA 21 %, retención IRPF 19 %.
- Numeración correlativa por año (`2026-001`) y rectificativas en serie aparte (`R2026-001`). Las facturas emitidas no se pueden modificar.
- PDF generado en el propio móvil y enviado con la hoja de compartir (Mail, WhatsApp…).
- Gastos del local, asistente del modelo 303 (incluido el apartado anual del 4T para exonerados del 390) y resumen para la Renta.
- Libros registro de IVA en CSV y recordatorios para el Calendario (.ics).

## Marco legal (resumen, revisado en octubre de 2026)

- Alquiler de local: sujeto y no exento de IVA (21 %). Factura según el RD 1619/2012, antes del día 16 del mes siguiente.
- IRPF: rendimientos del capital inmobiliario, así que **no aplica VeriFactu** (RD 1007/2023, art. 3) ni el modelo 130 ni el RETA.
  La retención del 19 % la practica e ingresa el inquilino (modelos 115 y 180).
- IVA: modelo 303 trimestral; exonerado del 390 (solo arrendamiento de urbanos), con información anual en el 303 del 4T. Sin 347 si hay retención.
- Fianza: depósito obligatorio en el IBAVI (Ley 5/2018 de vivienda de las Illes Balears).

## Desarrollo

    npm install
    npm run dev        # http://localhost:5173
    npm test           # lógica fiscal y PDF (PDF_SALIDA=/carpeta npm test guarda los PDF de muestra)
    npm run check      # tipos
    npm run build      # genera dist/ (lo que se publica)
    swift scripts/make-icons.swift   # regenera los iconos

Código: `src/core` (lógica pura y testeada), `src/datos` (almacenamiento y compartir), `src/pdf`, `src/vistas` (Svelte 5).
Cada push a `main` pasa los tests y publica en GitHub Pages.
