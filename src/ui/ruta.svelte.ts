// Navegación por hash (#/facturas/…) para que funcione el gesto de volver atrás de iOS.
export const ruta = $state<{ partes: string[]; query: URLSearchParams }>(leer());

function leer() {
  const [camino, q = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return { partes: camino.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

addEventListener('hashchange', () => {
  Object.assign(ruta, leer());
  scrollTo(0, 0);
});

export function ir(destino: string, reemplazar = false): void {
  const hash = `#/${destino.replace(/^\//, '')}`;
  if (reemplazar) {
    history.replaceState(null, '', hash);
    Object.assign(ruta, leer());
    scrollTo(0, 0);
  } else {
    location.hash = hash;
  }
}

export function volver(porDefecto: string): void {
  if (history.length > 1 && sessionStorage.getItem('navegado')) history.back();
  else ir(porDefecto, true);
}

addEventListener('hashchange', () => sessionStorage.setItem('navegado', '1'));
