
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

export async function onRequestPost(context) {
  try {
    const { DB, KOFI_VERIFICATION_TOKEN } = context.env;

    if (!DB) {
      return jsonResponse({ ok: false, error: "No está disponible la base de datos." }, 500);
    }
    if (!KOFI_VERIFICATION_TOKEN) {
      return jsonResponse({ ok: false, error: "No está configurado el secreto KOFI_VERIFICATION_TOKEN." }, 500);
    }

    const form = await context.request.formData();
    const rawData = form.get("data");
    if (typeof rawData !== "string" || !rawData) {
      return jsonResponse({ ok: false, error: "No se recibió el campo data de Ko-fi." }, 400);
    }

    let payment;
    try {
      payment = JSON.parse(rawData);
    } catch {
      return jsonResponse({ ok: false, error: "El contenido recibido de Ko-fi no es JSON válido." }, 400);
    }

    if (!safeEqual(String(payment.verification_token || ""), String(KOFI_VERIFICATION_TOKEN))) {
      return jsonResponse({ ok: false, error: "Token de verificación no válido." }, 401);
    }

    const email = String(payment.email || "").trim().toLowerCase();
    const transactionId = String(payment.kofi_transaction_id || "").trim();
    const tierName = String(payment.tier_name || "").trim();
    const amount = Number(payment.amount);
    const currency = String(payment.currency || "").toUpperCase();
    const isSubscription = payment.is_subscription_payment === true;
    const eventType = String(payment.type || "");

    // Solo se concede acceso por el pago de la membresía Oráculo AM PRO.
    // Se aceptan pagos iguales o superiores a USD 9.90.
    if (
      eventType !== "Subscription" ||
      !isSubscription ||
      tierName !== "Oráculo AM PRO" ||
      currency !== "USD" ||
      !Number.isFinite(amount) ||
      amount < 9.90
    ) {
      return jsonResponse({
        ok: true,
        recibido: true,
        procesado: false,
        mensaje: "Pago recibido; no corresponde a la membresía Oráculo AM PRO."
      });
    }

    if (!email || !email.includes("@") || email.length > 254 || !transactionId) {
      return jsonResponse({
        ok: false,
        error: "El pago no contiene un correo o identificador de transacción válido."
      }, 400);
    }

    // Asegura que el usuario exista antes de preparar la renovación.
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
      return jsonResponse({
        ok: false,
        error: "No fue posible crear o localizar la cuenta del miembro."
      }, 500);
    }

    const now = new Date();
    const currentExpiry = user.pro_vencimiento
      ? new Date(String(user.pro_vencimiento).includes("T")
          ? String(user.pro_vencimiento)
          : String(user.pro_vencimiento).replace(" ", "T") + "Z")
      : null;

    const baseDate = currentExpiry &&
      !Number.isNaN(currentExpiry.getTime()) &&
      currentExpiry > now
        ? currentExpiry
        : now;

    const newExpiry = addOneCalendarMonth(baseDate);

    const safePayment = { ...payment };
    delete safePayment.verification_token;

    // Evita procesar dos veces la misma transacción de Ko-fi.
    await DB.batch([
      DB.prepare(`
        INSERT INTO eventos_kofi (
          transaction_id, subscription_id, email, event_type, payload, procesado
        )
        VALUES (?, NULL, ?, ?, ?, 0)
        ON CONFLICT(transaction_id) DO NOTHING
      `).bind(
        transactionId,
        email,
        eventType,
        JSON.stringify(safePayment)
      ),

      DB.prepare(`
        UPDATE usuarios
        SET pro_activo = 1,
            pro_inicio = COALESCE(pro_inicio, ?),
            pro_vencimiento = ?,
            kofi_transaction_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE lower(email) = ?
          AND EXISTS (
            SELECT 1 FROM eventos_kofi
            WHERE transaction_id = ? AND procesado = 0
          )
      `).bind(
        now.toISOString(),
        newExpiry,
        transactionId,
        email,
        transactionId
      ),

      DB.prepare(`
        UPDATE eventos_kofi
        SET procesado = 1
        WHERE transaction_id = ? AND procesado = 0
      `).bind(transactionId)
    ]);

    const event = await DB.prepare(`
      SELECT procesado
      FROM eventos_kofi
      WHERE transaction_id = ?
      LIMIT 1
    `).bind(transactionId).first();

    return jsonResponse({
      ok: true,
      recibido: true,
      procesado: Number(event?.procesado || 0) === 1,
      mensaje: "Notificación de Ko-fi recibida."
    });

  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error
        ? error.message
        : "Error al procesar la notificación de Ko-fi."
    }, 500);
  }
}
