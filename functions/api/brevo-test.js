export async function onRequestPost(context) {
  try {
    const apiKey = context.env.BREVO_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se encontró el secreto BREVO_API_KEY en Cloudflare." }),
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Oráculo AM", email: "oraculo.am@gmail.com" },
        to: [{ email: "oraculo.am@gmail.com", name: "Oráculo AM" }],
        subject: "Prueba de correo — Oráculo AM",
        textContent: "Este es un correo de prueba enviado desde Cloudflare mediante la API de Brevo.\n\nSi recibiste este mensaje, la conexión Oráculo AM → Cloudflare → Brevo está funcionando correctamente."
      })
    });

    const resultText = await brevoResponse.text();
    let result;
    try { result = JSON.parse(resultText); } catch { result = { raw: resultText }; }

    return new Response(
      JSON.stringify({
        ok: brevoResponse.ok,
        brevo_status: brevoResponse.status,
        brevo: result,
        mensaje: brevoResponse.ok ? "Brevo aceptó el envío del correo de prueba." : "Brevo rechazó el envío. Revisa la respuesta."
      }),
      { status: brevoResponse.ok ? 200 : 502, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
