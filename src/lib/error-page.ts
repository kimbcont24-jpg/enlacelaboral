export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>No se pudo cargar la página</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; text-align: center; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>No se pudo cargar la página</h1>
      <p>Algo salió mal. Intenta recargar o vuelve al inicio.</p>
      <button onclick="location.reload()">Intentar de nuevo</button>
      <a href="/">Ir al inicio</a>
    </div>
  </body>
</html>`;
}
