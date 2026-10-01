function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value);
  const normalized = text.includes("T") ? text : text.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;

    if (!DB) {
      return jsonResponse({ ok: false, error: "No está disponible la base de datos DB." }, 500);
    }

    const body = await context.request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const codigo = String(body.codigo || "").trim();

    if (!email || !email.includes("@") || email.length > 254 || !/^\d{6}$/.test(codigo)) {
      return jsonResponse({ ok: false, error: "Datos de verificación no válidos." }, 400);
    }

    const usuario = await DB.prepare(`
      SELECT id, email, pro_activo, pro_vencimiento
      FROM usuarios
      WHERE lower(email) = ?
      LIMIT 1
    `).bind(email).first();

    const vencimientoPro = parseDate(usuario?.pro_vencimiento);
    const proVigente =
      usuario &&
      Number(usuario.pro_activo) === 1 &&
      vencimientoPro &&
      vencimientoPro > new Date();

    if (!proVigente) {
      return jsonResponse({ ok: false, error: "No se pudo verificar el código." }, 401);
    }

    const registro = await DB.prepare(`
      SELECT id, codigo_hash, expira_at, intentos, usado
      FROM codigos_verificacion
      WHERE email = ? AND usado = 0
      ORDER BY id DESC
      LIMIT 1
    `).bind(email).first();

    if (!registro) {
      return jsonResponse({ ok: false, error: "El código no es válido o ya fue utilizado." }, 401);
    }

    const expiraCodigo = parseDate(registro.expira_at);
    if (!expiraCodigo || expiraCodigo <= new Date()) {
      await DB.prepare(`UPDATE codigos_verificacion SET usado = 1 WHERE id = ?`)
        .bind(registro.id).run();
      return jsonResponse({ ok: false, error: "El código ha vencido. Solicita uno nuevo." }, 401);
    }

    const intentos = Number(registro.intentos || 0);
    if (intentos >= 5) {
      await DB.prepare(`UPDATE codigos_verificacion SET usado = 1 WHERE id = ?`)
        .bind(registro.id).run();
      return jsonResponse({ ok: false, error: "Se alcanzó el máximo de intentos. Solicita un código nuevo." }, 429);
    }

    const codigoHash = await sha256Hex(codigo);

    if (codigoHash !== String(registro.codigo_hash)) {
      const nuevosIntentos = intentos + 1;
      await DB.prepare(`
        UPDATE codigos_verificacion
        SET intentos = ?, usado = CASE WHEN ? >= 5 THEN 1 ELSE usado END
        WHERE id = ?
      `).bind(nuevosIntentos, nuevosIntentos, registro.id).run();

      return jsonResponse({
        ok: false,
        error: nuevosIntentos >= 5
          ? "Se alcanzó el máximo de intentos. Solicita un código nuevo."
          : "El código no es correcto."
      }, nuevosIntentos >= 5 ? 429 : 401);
    }

    await DB.prepare(`UPDATE codigos_verificacion SET usado = 1 WHERE id = ?`)
      .bind(registro.id).run();

    const ahora = Date.now();
    const treintaDias = ahora + 30 * 24 * 60 * 60 * 1000;
    const vencimientoSesion = Math.min(treintaDias, vencimientoPro.getTime());

    const token = randomToken(32);
    const tokenHash = await sha256Hex(token);
    const expiraSesion = new Date(vencimientoSesion).toISOString();

    await DB.prepare(`
      INSERT INTO sesiones (
        usuario_id, token_hash, expira_at, ultimo_acceso_at, revocada
      )
      VALUES (?, ?, ?, ?, 0)
    `).bind(
      usuario.id,
      tokenHash,
      expiraSesion,
      new Date().toISOString()
    ).run();

    const maxAge = Math.max(1, Math.floor((vencimientoSesion - ahora) / 1000));

    const cookie = [
      `oraculo_pro_session=${token}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${maxAge}`
    ].join("; ");

    return new Response(JSON.stringify({
      ok: true,
      autenticado: true,
      mensaje: "Código verificado. Sesión PRO creada."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Set-Cookie": cookie
      }
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
