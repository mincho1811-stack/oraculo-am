function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
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

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator === -1) continue;
    const key = item.slice(0, separator).trim();
    if (key === name) return item.slice(separator + 1).trim();
  }
  return null;
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value);
  const normalized = text.includes("T") ? text : text.replace(" ", "T") + "Z";
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateForTimezone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  return `${values.year}-${values.month}-${values.day}`;
}

function newToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getProUser(DB, request) {
  const token = getCookie(request, "oraculo_pro_session");
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const session = await DB.prepare(`
    SELECT s.id AS sesion_id, s.usuario_id, s.expira_at AS sesion_expira_at,
           s.revocada, u.email, u.pro_activo, u.pro_tipo, u.pro_vencimiento, u.timezone
    FROM sesiones s
    INNER JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ?
    LIMIT 1
  `).bind(tokenHash).first();

  if (!session) return null;

  const now = new Date();
  const sessionExpires = parseDate(session.sesion_expira_at);
  const proExpires = parseDate(session.pro_vencimiento);

  const accesoEspecial = ["propietario", "cortesia"].includes(String(session.pro_tipo || ""));
  const proVigente = Number(session.pro_activo) === 1 &&
    (accesoEspecial || (proExpires && proExpires > now));

  if (
    Number(session.revocada) !== 0 ||
    !sessionExpires || sessionExpires <= now ||
    !proVigente
  ) {
    return null;
  }

  return session;
}

export async function onRequestPost(context) {
  try {
    const { DB } = context.env;
    if (!DB) {
      return jsonResponse({ ok: false, error: "No está disponible la base de datos DB." }, 500);
    }

    // PRO: sesión segura ya existente.
    const proUser = await getProUser(DB, context.request);

    if (proUser) {
      const timezone = proUser.timezone || "America/Bogota";
      let fechaLocal;
      try {
        fechaLocal = localDateForTimezone(timezone);
      } catch {
        fechaLocal = localDateForTimezone("America/Bogota");
      }

      const limiteDiario = 7;

      await DB.prepare(`
        INSERT INTO consultas_diarias (usuario_id, fecha, cantidad)
        VALUES (?, ?, 0)
        ON CONFLICT(usuario_id, fecha) DO NOTHING
      `).bind(proUser.usuario_id, fechaLocal).run();

      const update = await DB.prepare(`
        UPDATE consultas_diarias
        SET cantidad = cantidad + 1, updated_at = CURRENT_TIMESTAMP
        WHERE usuario_id = ? AND fecha = ? AND cantidad < ?
      `).bind(proUser.usuario_id, fechaLocal, limiteDiario).run();

      const row = await DB.prepare(`
        SELECT cantidad FROM consultas_diarias
        WHERE usuario_id = ? AND fecha = ? LIMIT 1
      `).bind(proUser.usuario_id, fechaLocal).first();

      const cantidad = Number(row?.cantidad || 0);
      const registrada = Number(update?.meta?.changes || 0) > 0;

      await DB.prepare(`UPDATE sesiones SET ultimo_acceso_at = ? WHERE id = ?`)
        .bind(new Date().toISOString(), proUser.sesion_id).run();

      if (!registrada) {
        return jsonResponse({
          ok: true, permitido: false, autenticado: true, pro_activo: true,
          consultas_usadas: cantidad, limite_diario: limiteDiario,
          fecha_local: fechaLocal, timezone,
          probabilidad_arcano: 0.35,
          mensaje: "Has alcanzado el límite diario de Oráculo PRO."
        }, 429);
      }

      return jsonResponse({
        ok: true, permitido: true, autenticado: true, pro_activo: true,
        consultas_usadas: cantidad, limite_diario: limiteDiario,
        fecha_local: fechaLocal, timezone,
        probabilidad_arcano: 0.35,
        mensaje: "Consulta PRO autorizada."
      });
    }

    // FREE: identidad anónima por cookie. Si se borra la cookie o se cambia de
    // navegador/dispositivo, un usuario anónimo puede volver a consultar.
    // Esto es deliberado: PRO es la parte que requiere identidad fuerte.
    let anonymousToken = getCookie(context.request, "oraculo_free_id");
    let setCookie = null;
    let anonymous = null;

    if (anonymousToken) {
      const tokenHash = await sha256Hex(anonymousToken);
      anonymous = await DB.prepare(`
        SELECT id, token_hash, timezone
        FROM identidades_anonimas
        WHERE token_hash = ?
        LIMIT 1
      `).bind(tokenHash).first();
    }

    if (!anonymous) {
      anonymousToken = newToken(32);
      const tokenHash = await sha256Hex(anonymousToken);
      await DB.prepare(`
        INSERT INTO identidades_anonimas (token_hash, timezone)
        VALUES (?, ?)
      `).bind(tokenHash, "America/Bogota").run();
      anonymous = await DB.prepare(`
        SELECT id, token_hash, timezone
        FROM identidades_anonimas
        WHERE token_hash = ?
        LIMIT 1
      `).bind(tokenHash).first();
      setCookie = [
        `oraculo_free_id=${anonymousToken}`,
        "Path=/", "HttpOnly", "Secure", "SameSite=Lax",
        "Max-Age=31536000"
      ].join("; ");
    }

    const timezone = anonymous.timezone || "America/Bogota";
    let fechaLocal;
    try {
      fechaLocal = localDateForTimezone(timezone);
    } catch {
      fechaLocal = localDateForTimezone("America/Bogota");
    }

    const limiteDiario = 1;

    // Para el usuario FREE usamos una identidad anónima independiente de usuarios PRO.
    // Se reutiliza la misma tabla diaria mediante un registro técnico en usuarios.
    const pseudoEmail = `anon-${anonymous.id}@anonymous.oraculo-am.local`;
    await DB.prepare(`
      INSERT INTO usuarios (email, pro_activo, timezone)
      VALUES (?, 0, ?)
      ON CONFLICT(email) DO NOTHING
    `).bind(pseudoEmail, timezone).run();

    const anonUser = await DB.prepare(`
      SELECT id FROM usuarios WHERE email = ? LIMIT 1
    `).bind(pseudoEmail).first();

    await DB.prepare(`
      INSERT INTO consultas_diarias (usuario_id, fecha, cantidad)
      VALUES (?, ?, 0)
      ON CONFLICT(usuario_id, fecha) DO NOTHING
    `).bind(anonUser.id, fechaLocal).run();

    const update = await DB.prepare(`
      UPDATE consultas_diarias
      SET cantidad = cantidad + 1, updated_at = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND fecha = ? AND cantidad < ?
    `).bind(anonUser.id, fechaLocal, limiteDiario).run();

    const row = await DB.prepare(`
      SELECT cantidad FROM consultas_diarias
      WHERE usuario_id = ? AND fecha = ? LIMIT 1
    `).bind(anonUser.id, fechaLocal).first();

    const cantidad = Number(row?.cantidad || 0);
    const registrada = Number(update?.meta?.changes || 0) > 0;

    const headers = setCookie ? { "Set-Cookie": setCookie } : {};

    if (!registrada) {
      return jsonResponse({
        ok: true, permitido: false, autenticado: false, pro_activo: false,
        consultas_usadas: cantidad, limite_diario: limiteDiario,
        fecha_local: fechaLocal, timezone,
        probabilidad_arcano: 0.11,
        mensaje: "Has alcanzado el límite gratuito de hoy."
      }, 429, headers);
    }

    return jsonResponse({
      ok: true, permitido: true, autenticado: false, pro_activo: false,
      consultas_usadas: cantidad, limite_diario: limiteDiario,
      fecha_local: fechaLocal, timezone,
      probabilidad_arcano: 0.11,
      mensaje: "Consulta gratuita autorizada."
    }, 200, headers);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
