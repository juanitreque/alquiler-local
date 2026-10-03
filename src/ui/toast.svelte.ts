export const toast = $state<{ texto: string | null }>({ texto: null });
let temporizador: ReturnType<typeof setTimeout> | undefined;

export function avisar(texto: string): void {
  toast.texto = texto;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (toast.texto = null), 2600);
}
