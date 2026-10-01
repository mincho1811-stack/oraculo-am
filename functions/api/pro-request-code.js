async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  try {
    const { DB, BREVO_API_KEY } = context.env;

    if (!DB) {
      return jsonResponse({ ok: false, error: "No está disponible la base de datos DB." }, 500);
    }

    if (!BREVO_API_KEY) {
      return jsonResponse({ ok: false, error: "No está configurado el secreto BREVO_API_KEY." }, 500);
    }

    const body = await context.request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@") || email.length > 254) {
      return jsonResponse({ ok: false, error: "Introduce un correo electrónico válido." }, 400);
    }

    const usuario = await DB.prepare(`
      SELECT id, email, pro_activo, pro_vencimiento
      FROM usuarios
      WHERE lower(email) = ?
      LIMIT 1
    `).bind(email).first();

    const ahora = new Date();
    const vencimiento = usuario?.pro_vencimiento
      ? new Date(String(usuario.pro_vencimiento).replace(" ", "T") + "Z")
      : null;

    const proVigente =
      usuario &&
      Number(usuario.pro_activo) === 1 &&
      vencimiento &&
      vencimiento > ahora;

    if (!proVigente) {
      return jsonResponse({
        ok: true,
        mensaje: "Si el correo corresponde a una cuenta PRO vigente, recibirás un código de verificación."
      });
    }

    await DB.prepare(`
      UPDATE codigos_verificacion
      SET usado = 1
      WHERE email = ? AND usado = 0
    `).bind(email).run();

    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const codigo = String(random[0] % 1000000).padStart(6, "0");
    const codigoHash = await sha256Hex(codigo);
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await DB.prepare(`
      INSERT INTO codigos_verificacion (
        usuario_id, email, codigo_hash, expira_at, intentos, usado
      )
      VALUES (?, ?, ?, ?, 0, 0)
    `).bind(usuario.id, email, codigoHash, expira).run();

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Oráculo AM", email: "oraculo.am@gmail.com" },
        to: [{ email, name: "Usuario Oráculo AM" }],
        subject: "Tu código de acceso a Oráculo AM PRO",
        textContent:
          `Tu código de acceso a Oráculo AM PRO es: ${codigo}\n\n` +
          "Este código es válido durante 10 minutos y solo puede utilizarse una vez.\n\n" +
          "Si no solicitaste este código, puedes ignorar este mensaje."
      })
    });

    if (!brevoResponse.ok) {
      await DB.prepare(`
        UPDATE codigos_verificacion
        SET usado = 1
        WHERE id = (
          SELECT id FROM codigos_verificacion
          WHERE email = ? ORDER BY id DESC LIMIT 1
        )
      `).bind(email).run();

      return jsonResponse({
        ok: false,
        error: "Brevo no aceptó el envío del código.",
        brevo_status: brevoResponse.status
      }, 502);
    }

    return jsonResponse({
      ok: true,
      mensaje: "Código enviado correctamente.",
      expira_en_minutos: 10
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
