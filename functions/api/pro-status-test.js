export async function onRequestGet(context) {
  try {
    const result = await context.env.DB
      .prepare(`
        SELECT
          email,
          pro_activo,
          pro_inicio,
          pro_vencimiento
        FROM usuarios
        WHERE email = ?
        LIMIT 1
      `)
      .bind('prueba@oraculo-am.test')
      .first();

    if (!result) {
      return new Response(JSON.stringify({
        ok: true,
        encontrado: false,
        mensaje: 'Usuario de prueba no encontrado en D1.'
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const ahora = new Date();
    const vencimiento = result.pro_vencimiento
      ? new Date(result.pro_vencimiento)
      : null;

    const proVigente = Boolean(result.pro_activo) &&
      (!vencimiento || vencimiento > ahora);

    return new Response(JSON.stringify({
      ok: true,
      encontrado: true,
      usuario: result.email,
      pro_activo: proVigente,
      pro_inicio: result.pro_inicio,
      pro_vencimiento: result.pro_vencimiento,
      mensaje: proVigente
        ? 'Usuario de prueba con PRO vigente.'
        : 'Usuario de prueba sin PRO vigente.'
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'No fue posible consultar el estado PRO.',
      detalle: String(error?.message || error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
