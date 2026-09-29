export async function onRequestGet(context) {
  try {
    const result = await context.env.DB.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('usuarios', 'consultas_diarias', 'eventos_kofi')
      ORDER BY name
    `).all();

    const tablas = (result.results || []).map((fila) => fila.name);

    return Response.json({
      ok: true,
      db: 'oraculo-am-pro',
      tablas,
      mensaje: tablas.length === 3
        ? 'Conexión D1 correcta. Las tres tablas PRO están disponibles.'
        : 'Conexión D1 correcta, pero falta alguna tabla PRO.'
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: 'No fue posible conectar con D1.',
      detalle: error instanceof Error ? error.message : String(error)
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
