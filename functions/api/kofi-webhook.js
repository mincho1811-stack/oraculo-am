
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function addOneCalendarMonth(value) {
  const date = new Date(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

function cleanPayload(payment) {
  const copy = { ...payment };
  delete copy.verification_token;
  return JSON.stringify(copy);
}

export async function onRequestPost(context) {
  const { DB, KOFI_VERIFICATION_TOKEN } = context.env;

  if (!DB) {
    console.error("Ko-fi webhook: falta la vinculación DB.");
    return jsonResponse({ ok: false, error: "No está disponible la base de datos." }, 500);
  }

  if (!KOFI_VERIFICATION_TOKEN) {
    console.error("Ko-fi webhook: falta el secreto de verificación.");
    return jsonResponse({ ok: false, error: "No está configurado el secreto de verificación." }, 500);
  }

  let payment;

  try {
    const form = await context.request.formData();
    const rawData = form.get("data");

    if (typeof rawData !== "string" || !rawData) {
      return jsonResponse({ ok: false, error: "No se recibió el campo data de Ko-fi." }, 400);
    }

    try {
      payment = JSON.parse(rawData);
    } catch {
      return jsonResponse({ ok: false, error: "El contenido recibido no es JSON válido." }, 400);
    }

    if (!safeEqual(String(payment.verification_token || ""), String(KOFI_VERIFICATION_TOKEN))) {
      console.warn("Ko-fi webhook: token no válido.");
      return jsonResponse({ ok: false, error: "Token de verificación no válido." }, 401);
    }

    const transactionId = String(payment.kofi_transaction_id || "").trim() || null;
    const subscriptionId = String(
      payment.kofi_subscription_id || payment.subscription_id || ""
    ).trim() || null;

    const email = String(payment.email || "").trim().toLowerCase();
    const eventType = String(payment.type || "");
    const tierName = String(payment.tier_name || "").trim();
    const amount = Number(payment.amount);
    const currency = String(payment.currency || "").toUpperCase();
    const isSubscription = payment.is_subscription_payment === true;

    // Registrar todas las notificaciones verificadas.
    // Nunca guardar el token secreto.
    const insert = await DB.prepare(`
      INSERT OR IGNORE INTO eventos_kofi
        (transaction_id, subscription_id, email, event_type, payload, procesado)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(
      transactionId,
      subscriptionId,
      email || null,
      eventType || "unknown",
      cleanPayload(payment)
    ).run();

    // Evitar duplicados, pero permitir reintentar eventos pendientes.
    if (Number(insert?.meta?.changes || 0) === 0 && transactionId) {
      const existing = await DB.prepare(`
        SELECT procesado FROM eventos_kofi
        WHERE transaction_id = ? LIMIT 1
      `).bind(transactionId).first();

      if (Number(existing?.procesado || 0) === 1) {
        return jsonResponse({
          ok: true,
          recibido: true,
          duplicado: true,
          procesado: true
        });
      }
    }

    // Solo una membresía PRO válida puede activar el acceso.
    const isProMembership =
      eventType === "Subscription" &&
      isSubscription &&
      tierName.toLowerCase() === "oráculo am pro" &&
      currency === "USD" &&
      Number.isFinite(amount) &&
      amount >= 9.90;

    if (!isProMembership) {
      console.log("Ko-fi: evento recibido sin activar PRO.", {
        eventType,
        isSubscription,
        tierName: tierName || null,
        currency,
        amount: Number.isFinite(amount) ? amount : null
      });

      return jsonResponse({
        ok: true,
        recibido: true,
        procesado: false,
        motivo: "El evento no corresponde a un pago válido de Oráculo AM PRO."
      });
    }

    if (!email || !email.includes("@") || email.length > 254 || !transactionId) {
      return jsonResponse({
        ok: false,
        error: "El pago PRO no contiene un correo o identificador válido."
      }, 400);
    }

    // Crear la cuenta si todavía no existe.
    await DB.prepare(`
      INSERT INTO usuarios (email, pro_activo, timezone)
      VALUES (?, 0, 'America/Bogota')
      ON CONFLICT(email) DO NOTHING
    `).bind(email).run();

    const user = await DB.prepare(`
      SELECT id, pro_inicio, pro_vencimiento
      FROM usuarios
      WHERE lower(email) = ?
      LIMIT 1
    `).bind(email).first();

    if (!user) {
      throw new Error("No fue posible localizar la cuenta del miembro.");
    }

    const now = new Date();
    const expiryText = user.pro_vencimiento
      ? String(user.pro_vencimiento)
      : "";

    const currentExpiry = expiryText
      ? new Date(
          expiryText.includes("T")
            ? expiryText
            : expiryText.replace(" ", "T") + "Z"
        )
      : null;

    const baseDate =
      currentExpiry &&
      !Number.isNaN(currentExpiry.getTime()) &&
      currentExpiry > now
        ? currentExpiry
        : now;

    const newExpiry = addOneCalendarMonth(baseDate);

    const updateUser = await DB.prepare(`
      UPDATE usuarios
      SET pro_activo = 1,
          pro_inicio = COALESCE(pro_inicio, ?),
          pro_vencimiento = ?,
          kofi_transaction_id = ?,
          kofi_subscription_id = COALESCE(?, kofi_subscription_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      now.toISOString(),
      newExpiry,
      transactionId,
      subscriptionId,
      user.id
    ).run();

    if (Number(updateUser?.meta?.changes || 0) !== 1) {
      throw new Error("No se pudo actualizar el estado PRO.");
    }

    await DB.prepare(`
      UPDATE eventos_kofi
      SET procesado = 1
      WHERE transaction_id = ?
    `).bind(transactionId).run();

    console.log("Ko-fi: membresía PRO activada o renovada.", {
      email,
      amount,
      currency,
      pro_vencimiento: newExpiry
    });

    return jsonResponse({
      ok: true,
      recibido: true,
      procesado: true,
      pro_activo: true,
      pro_vencimiento: newExpiry
    });

  } catch (error) {
    console.error("Error webhook Ko-fi:", error);

    return jsonResponse({
      ok: false,
      error: error instanceof Error
        ? error.message
        : "Error al procesar la notificación de Ko-fi."
    }, 500);
  }
}
