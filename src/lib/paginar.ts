/**
 * Supabase (PostgREST) devuelve como máximo 1000 filas por consulta, aunque se pida .limit(5000).
 * Por eso los contadores se quedaban en 1000. Esta función trae TODAS las filas por lotes.
 *
 * `consulta(desde, hasta)` debe crear una consulta nueva en cada llamada, con un orden estable
 * (incluye .order("id") al final para que ninguna fila se repita ni se pierda entre lotes).
 * Si la consulta pide { count: "exact" }, el resto de los lotes se piden en paralelo (más rápido).
 */
type Respuesta<T> = { data: T[] | null; error: unknown; count?: number | null };

export async function todasLasFilas<T>(
  consulta: (desde: number, hasta: number) => PromiseLike<Respuesta<T>>,
  { lote = 1000, tope = 50_000 }: { lote?: number; tope?: number } = {},
): Promise<T[]> {
  const primera = await consulta(0, lote - 1);
  if (primera.error) throw primera.error;
  const filas = [...(primera.data ?? [])];
  if (filas.length < lote) return filas;

  const total = typeof primera.count === "number" ? Math.min(primera.count, tope) : null;
  if (total !== null) {
    const desdes: number[] = [];
    for (let d = lote; d < total; d += lote) desdes.push(d);
    const resto = await Promise.all(desdes.map((d) => consulta(d, d + lote - 1)));
    for (const r of resto) {
      if (r.error) throw r.error;
      filas.push(...(r.data ?? []));
    }
    return sinRepetir(filas);
  }

  // Sin conteo: lote por lote hasta que llegue uno incompleto.
  for (let d = lote; d < tope; d += lote) {
    const r = await consulta(d, d + lote - 1);
    if (r.error) throw r.error;
    const datos = r.data ?? [];
    filas.push(...datos);
    if (datos.length < lote) break;
  }
  return sinRepetir(filas);
}

/** Si entra una vacante nueva mientras se cargan los lotes, una fila puede salir dos veces: se quita. */
function sinRepetir<T>(filas: T[]): T[] {
  const vistos = new Set<unknown>();
  return filas.filter((f) => {
    const id = (f as { id?: unknown } | null)?.id;
    if (id === undefined) return true;
    if (vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });
}
