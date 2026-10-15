# Manual de uso de Alquiler

Alquiler sirve para hacer desde el iPhone la factura mensual del alquiler de un local comercial, enviarla al
inquilino y preparar el IVA de cada trimestre. Está pensada para una **persona física** que alquila un local en
**Baleares** a una empresa o autónomo.

La app calcula el IVA (21 %) y la retención (19 %), numera las facturas sin saltos, avisa de los plazos y
da hechas las cifras del modelo 303 y de la Renta. No hace falta cuenta ni conexión: todo se guarda en el
propio móvil, así que es importante hacer copias de seguridad.

> Información general revisada en octubre de 2026. No sustituye el consejo de un asesor fiscal.

## 1. Instalar la app

1. Abre **Safari** (en iPhone tiene que ser Safari) y entra en <https://juanitreque.github.io/alquiler-local/>.
2. Toca **Compartir** (el cuadrado con la flecha hacia arriba).
3. Toca **Añadir a pantalla de inicio › Añadir**.
4. Abre siempre la app desde el icono **Alquiler**. Si la abres desde Safari la verás vacía: los datos se guardan en el icono.

En Android, ábrela con Chrome y elige **Instalar aplicación** en el menú. Las versiones nuevas se instalan solas al abrirla con conexión.

## 2. Configurar los datos (una vez)

En **Ajustes**, con el contrato de alquiler y un recibo del IBI a mano:

- **Arrendador:** nombre, NIF y domicilio fiscal del propietario. Si el NIF está mal escrito, sale en rojo.
- **Inquilino y contrato:**
    - Inquilino: nombre o razón social, NIF y domicilio.
    - Local: dirección y referencia catastral (20 caracteres, en el recibo del IBI).
    - Renta mensual **sin IVA**.
    - Gastos que paga el inquilino (IBI, comunidad, agua…), solo si el contrato lo dice y se le cobran en la factura.
    - Retención IRPF 19 %: activada si el inquilino es empresa o autónomo.
    - Día de la factura (por ejemplo, el 8 de cada mes).
    - Mes de actualización de la renta (IPC), fianza y fecha de depósito en el IBAVI, y forma de pago (IBAN).
    - Fecha de inicio del contrato: la app factura los meses en orden desde esa fecha.
- **Numeración y Renta:** si este año ya se hicieron facturas por otro medio, indica el número de la última
  para que la app continúe. La amortización anual se copia de la Renta del año anterior.
- **Recordatorios:** añade al Calendario el aviso del día de la factura y los plazos del IVA.

## 3. Cada mes: la factura

El día de la factura, con la fecha real de ese día y el periodo del mes que se cobra.

1. En **Inicio**, toca **Hacer la factura**. La app propone siempre el mes más antiguo sin facturar.
2. Revisa el mes, la fecha y los conceptos (puedes añadir uno puntual, como una derrama).
3. Toca **Emitir factura** y confirma.
4. Toca **Enviar PDF…** y elige Mail o WhatsApp.
5. Cuando cobres, abre la factura y toca **Marcar como cobrada…**.

El plazo legal para expedir la factura a una empresa es el día 15 del mes siguiente. Si la app no deja emitir,
un recuadro naranja explica por qué (NIF erróneo, mes ya facturado, un mes anterior sin facturar, fecha anterior a la última factura…).
Los meses se facturan en orden para que la numeración siga la cronología: no se puede facturar octubre con septiembre pendiente.

## 4. Corregir una factura

Una factura emitida no se puede modificar ni borrar. Para corregirla:

1. Abre la factura y toca **Crear factura rectificativa**, con el motivo. Sale con número `R2026-001` y los importes en negativo.
2. Toca **Hacer la factura correcta de …** y emítela.
3. Envía las dos al inquilino.

### Empezar de cero

Si las primeras facturas se hicieron mal (por ejemplo, en desorden) y **todavía no se ha presentado ningún IVA**,
**Ajustes › Copia de seguridad › Reiniciar facturación** borra las facturas y la numeración, conservando el
arrendador, el inquilino, el contrato y los gastos. Antes guarda una copia de todo. Hay que avisar por escrito al
inquilino de que las facturas anteriores quedan anuladas y se sustituyen por las nuevas.

## 5. Gastos del local

En **Gastos › Añadir** apunta el IBI, la comunidad, el seguro, las reparaciones, la gestoría… Reducen lo que se
paga en la Renta, y el IVA de los que lo llevan se descuenta en el 303, **solo si la factura está a nombre y NIF
del propietario**. Las mejoras (obras que añaden algo nuevo) no son gasto del año: se amortizan.

## 6. Cada trimestre: el IVA (modelo 303)

Plazos: del 1 al 20 de abril, julio y octubre, y hasta el 30 de enero para el 4.º trimestre.

1. En **Impuestos › IVA** aparece el trimestre que toca, con las cifras por casilla (07, 09, 28, 29, 71…).
2. En la sede de la Agencia Tributaria, entra en IVA › Modelo 303 › Presentación y copia cada cifra en su casilla.
3. Si sale **a ingresar**, se paga al presentar (para domiciliar, presenta antes del día 15). Si sale **a compensar**, no se paga y la app lo descuenta el trimestre siguiente.
4. En la app, toca **Ya lo he presentado…** y apunta el justificante.

Si lo presenta otra persona en nombre del propietario, necesita un **apoderamiento** dado de alta por el propietario en la AEAT.

**4.º trimestre:** quien solo alquila locales no presenta el resumen anual 390, pero tiene que rellenar en el 303
de enero el apartado anual: marcar «exonerado del 390», epígrafe **861.2** y las casillas 80 y 88 que da la app.

## 7. La Renta

En **Impuestos › Renta** la app da los ingresos íntegros, los gastos, la amortización, el rendimiento neto y
las retenciones del 19 % ya ingresadas por el inquilino. En la declaración van en «Rendimientos del capital
inmobiliario» (local, no vivienda). El inquilino entrega cada enero un certificado de retenciones para comprobarlas.

## 8. Copias de seguridad

Los datos solo están en el móvil. Cada mes, en **Ajustes › Copia de seguridad › Hacer copia**, guárdala en
iCloud Drive o envíatela por correo. Para recuperarla (móvil nuevo o app reinstalada): **Restaurar una copia…**.

En Ajustes también se exportan en CSV los libros registro de facturas emitidas y de gastos, por si los pide el gestor.

## 9. Calendario

| Cuándo | Qué hacer |
| --- | --- |
| Día de la factura, cada mes | Factura, envío y copia de seguridad |
| Enero (hasta el 30) | IVA del 4.º trimestre con el apartado anual; certificado de retenciones del inquilino |
| Abril (hasta el 20) | IVA del 1.er trimestre |
| Abril a junio | Renta |
| Julio (hasta el 20) | IVA del 2.º trimestre |
| Octubre (hasta el 20) | IVA del 3.er trimestre |
| Mes de actualización | Revisar la renta (IPC) antes de facturar |

## 10. Qué dice la ley (resumen)

- El alquiler de un local lleva IVA del 21 % (la vivienda está exenta) y requiere factura (RD 1619/2012).
- Si el inquilino es empresa o autónomo, retiene el 19 % y lo ingresa él (modelos 115 y 180).
- Una persona física sin empleados para el alquiler obtiene rendimientos del capital inmobiliario: no está obligada a VeriFactu, al modelo 130 ni a darse de alta como autónomo.
- En Baleares, la fianza (2 mensualidades en locales) se deposita en el IBAVI en 30 días (Ley 5/2018).
