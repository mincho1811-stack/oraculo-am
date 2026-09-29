export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return Response.json({ ok: false, error: "Falta el correo." }, { status: 400 });
    }

    const user = await env.DB.prepare(`
      SELECT id, email, pro_activo, pro_vencimiento, timezone
      FROM usuarios
      WHERE email = ?
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      return Response.json({ ok: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    const timezone = user.timezone || "America/Bogota";
    const now = new Date();
    const expiration = user.pro_vencimiento
      ? new Date(String(user.pro_vencimiento).replace(" ", "T") + "Z")
      : null;

    const proVigente =
      Number(user.pro_activo) === 1 &&
      expiration instanceof Date &&
      !Number.isNaN(expiration.getTime()) &&
      expiration.getTime() > now.getTime();

    const limite = proVigente ? 7 : 1;

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now);

    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    const fechaLocal = `${year}-${month}-${day}`;

    const incremento = await env.DB.prepare(`
      INSERT INTO consultas_diarias (usuario_id, fecha, cantidad)
      VALUES (?, ?, 1)
      ON CONFLICT(usuario_id, fecha)
      DO UPDATE SET cantidad = cantidad + 1
      WHERE cantidad < ?
      RETURNING cantidad
    `).bind(user.id, fechaLocal, limite).first();

    const registro = await env.DB.prepare(`
      SELECT cantidad
      FROM consultas_diarias
      WHERE usuario_id = ? AND fecha = ?
      LIMIT 1
    `).bind(user.id, fechaLocal).first();

    const usadas = Number(registro?.cantidad || 0);
    const permitida = incremento !== null && incremento !== undefined;

    return Response.json({
      ok: true,
      modo_prueba: true,
      email: user.email,
      timezone,
      fecha_local: fechaLocal,
      pro_vigente: proVigente,
      limite_diario: limite,
      consultas_usadas: usadas,
      consultas_restantes: Math.max(0, limite - usadas),
      consulta_registrada: permitida,
      mensaje: permitida
        ? "Consulta registrada correctamente."
        : "Límite diario alcanzado."
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: "Error interno.",
      detalle: String(error?.message || error)
    }, { status: 500 });
  }
}

export async function onRequestGet() {
  return Response.json({
    ok: false,
    error: "Esta prueba utiliza POST.",
    ejemplo: {
      url: "/api/usage-test",
      metodo: "POST",
      body: { email: "prueba@oraculo-am.test" }
    }
  }, { status: 405 });
}
