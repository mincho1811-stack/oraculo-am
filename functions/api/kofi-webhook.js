
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
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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

  try {
    const form = await context.request.formData();
    const rawData = form.get("data");

    if (typeof rawData !== "string" || !rawData) {
      return jsonResponse({ ok: false, error: "No se recibió el campo data de Ko-fi." }, 400);
    }

    let receivedPayment;

    try {
      receivedPayment = JSON.parse(rawData);
    } catch {
      return jsonResponse({ ok: false, error: "El contenido recibido no es JSON válido." }, 400);
    }

    if (!receivedPayment || typeof receivedPayment !== "object" || Array.isArray(receivedPayment)) {
      return jsonResponse({ ok: false, error: "Los datos recibidos no tienen un formato válido." }, 400);
    }

    if (!safeEqual(
      String(receivedPayment.verification_token || ""),
      String(KOFI_VERIFICATION_TOKEN)
    )) {
      console.warn("Ko-fi webhook: token no válido.");
      return jsonResponse({ ok: false, error: "Token de verificación no válido." }, 401);
    }

    const transactionId = String(receivedPayment.kofi_transaction_id || "").trim() || null;

    const subscriptionId = String(
      receivedPayment.kofi_subscription_id ||
      receivedPayment.subscription_id ||
      ""
    ).trim() || null;

    const receivedEmail = String(receivedPayment.email || "").trim().toLowerCase();
    const receivedType = String(receivedPayment.type || "unknown");

    // Registrar todas las notificaciones verificadas.
    // Nunca guardar el token secreto.
    await DB.prepare(`
      INSERT OR IGNORE INTO eventos_kofi
        (transaction_id, subscription_id, email, event_type, payload, procesado)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(
      transactionId,
      subscriptionId,
      receivedEmail || null,
      receivedType,
      cleanPayload(receivedPayment)
    ).run();

    // Recuperar el primer payload registrado para esa transacción.
    if (!transactionId) {
      return jsonResponse({
        ok: true,
        recibido: true,
        procesado: false,
        motivo: "Notificación registrada sin identificador de transacción."
      });
    }

    const storedEvent = await DB.prepare(`
      SELECT transaction_id, payload, procesado
      FROM eventos_kofi
      WHERE transaction_id = ?
      LIMIT 1
    `).bind(transactionId).first();

    if (!storedEvent) {
      throw new Error("No fue posible recuperar el evento registrado.");
    }

    if (Number(storedEvent.procesado) === 1) {
      return jsonResponse({
        ok: true,
        recibido: true,
        duplicado: true,
        procesado: true
      });
    }

    let payment;

    try {
      payment = JSON.parse(storedEvent.payload || "{}");
    } catch {
      throw new Error("El evento guardado contiene un payload no válido.");
    }

    const email = String(payment.email || "").trim().toLowerCase();
    const eventType = String(payment.type || "");
    const tierName = String(payment.tier_name || "").trim().toLowerCase();
    const amount = Number(payment.amount);
    const currency = String(payment.currency || "").trim().toUpperCase();
    const isSubscription = payment.is_subscription_payment === true;

    // Solo la membresía PRO exacta puede activar el acceso.
    const isProMembership =
      eventType === "Subscription" &&
      isSubscription &&
      tierName === "oráculo am pro" &&
      currency === "USD" &&
      Number.isFinite(amount) &&
      amount >= 9.90;

    if (!isProMembership) {
      console.log("Ko-fi: evento registrado sin activar PRO.", {
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

    if (!email || !email.includes("@") || email.length > 254) {
      return jsonResponse({
        ok: false,
        error: "El pago PRO no contiene un correo válido."
      }, 400);
    }

    const finalSubscriptionId = String(
      payment.kofi_subscription_id ||
      payment.subscription_id ||
      ""
    ).trim() || null;

    // Crear el usuario si todavía no existe.
    await DB.prepare(`
      INSERT INTO usuarios (email, pro_activo, timezone)
      VALUES (?, 0, 'America/Bogota')
      ON CONFLICT(email) DO NOTHING
    `).bind(email).run();

    const now = new Date().toISOString();

    /*
      La actualización del usuario y el marcado del evento se ejecutan
      dentro de un único batch transaccional de D1.

      Así, una transacción solo puede renovar PRO una vez.
      La fecha se calcula usando el vencimiento vigente en la base de datos,
      evitando perder renovaciones cuando llegan pagos distintos juntos.
    */

    const updateUser = DB.prepare(`
      WITH base AS (
        SELECT
          CASE
            WHEN pro_vencimiento IS NOT NULL
             AND julianday(pro_vencimiento) > julianday(?)
            THEN pro_vencimiento
            ELSE ?
          END AS value
        FROM usuarios
        WHERE lower(email) = ?
      ),
      parts AS (
        SELECT
          value,
          CAST(strftime('%d', value) AS INTEGER) AS day_number,
          CAST(
            strftime(
              '%d',
              date(value, 'start of month', '+2 months', '-1 day')
            ) AS INTEGER
          ) AS last_day
        FROM base
      )
      UPDATE usuarios
      SET pro_activo = 1,
          pro_inicio = COALESCE(pro_inicio, ?),
          pro_vencimiento = (
            SELECT strftime(
              '%Y-%m-%dT%H:%M:%SZ',
              datetime(
                date(
                  value,
                  'start of month',
                  '+1 month',
                  printf('+%d days', MIN(day_number - 1, last_day - 1))
                ),
                strftime('%H:%M:%S', value)
              )
            )
            FROM parts
          ),
          kofi_transaction_id = ?,
          kofi_subscription_id = COALESCE(?, kofi_subscription_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE lower(email) = ?
        AND EXISTS (
          SELECT 1
          FROM eventos_kofi
          WHERE transaction_id = ?
            AND procesado = 0
        )
    `).bind(
      now,
      now,
      email,
      now,
      transactionId,
      finalSubscriptionId,
      email,
      transactionId
    );

    const markEvent = DB.prepare(`
      UPDATE eventos_kofi
      SET procesado = 1
      WHERE transaction_id = ?
        AND procesado = 0
        AND EXISTS (
          SELECT 1
          FROM usuarios
          WHERE lower(email) = ?
            AND pro_activo = 1
            AND pro_vencimiento IS NOT NULL
        )
    `).bind(transactionId, email);

    // D1 ejecuta ambas operaciones como una transacción.
    const batchResults = await DB.batch([updateUser, markEvent]);

    const userChanges = Number(batchResults?.[0]?.meta?.changes || 0);
    const eventChanges = Number(batchResults?.[1]?.meta?.changes || 0);

    if (userChanges === 1 && eventChanges === 1) {
      const updatedUser = await DB.prepare(`
        SELECT pro_vencimiento
        FROM usuarios
        WHERE lower(email) = ?
        LIMIT 1
      `).bind(email).first();

      console.log("Ko-fi: membresía PRO activada o renovada.", {
        email,
        amount,
        currency,
        pro_vencimiento: updatedUser?.pro_vencimiento || null
      });

      return jsonResponse({
        ok: true,
        recibido: true,
        procesado: true,
        pro_activo: true,
        pro_vencimiento: updatedUser?.pro_vencimiento || null
      });
    }

    // Otra solicitud pudo haber procesado la misma transacción primero.
    const finalEvent = await DB.prepare(`
      SELECT procesado
      FROM eventos_kofi
      WHERE transaction_id = ?
      LIMIT 1
    `).bind(transactionId).first();

    if (Number(finalEvent?.procesado) === 1) {
      return jsonResponse({
        ok: true,
        recibido: true,
        duplicado: true,
        procesado: true
      });
    }

    throw new Error(
      "No se pudo completar la activación PRO. El evento permanece pendiente para reintento."
    );

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
