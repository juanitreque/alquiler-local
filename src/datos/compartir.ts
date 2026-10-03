// Enviar archivos desde el iPhone: hoja de compartir de iOS (Mail, WhatsApp, Guardar en Archivos…).

export async function compartirArchivo(contenido: Blob, nombre: string, titulo: string): Promise<'compartido' | 'cancelado' | 'descargado'> {
  const archivo = new File([contenido], nombre, { type: contenido.type });
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return 'compartido';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelado';
      throw e;
    }
  }
  // Ordenador o navegador sin hoja de compartir: descarga normal.
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'descargado';
}

export function leerArchivo(aceptar: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = aceptar;
    input.onchange = async () => resolve(input.files?.[0] ? await input.files[0].text() : null);
    input.click();
  });
}
