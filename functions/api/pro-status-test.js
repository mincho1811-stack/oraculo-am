function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const item of header.split(";")) {
    const i = item.indexOf("="); if (i < 0) continue;
    if (item.slice(0, i).trim() === name) return item.slice(i + 1).trim();
  }
  return null;
}
function parseDate(value) {
  if (!value) return null;
  const s = String(value); const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}
export async function onRequestGet(context) {
  try {
    const { DB } = context.env;
    if (!DB) return jsonResponse({ ok: false, error: "No está disponible DB." }, 500);
    const token = getCookie(context.request, "oraculo_pro_session");
    if (!token) return jsonResponse({ ok: true, autenticado: false, pro_activo: false });
    const hash = await sha256Hex(token);
    const s = await DB.prepare(`
      SELECT s.id sesion_id, s.expira_at sesion_expira_at, s.revocada,
             u.email, u.pro_activo, u.pro_vencimiento
      FROM sesiones s INNER JOIN usuarios u ON u.id=s.usuario_id
      WHERE s.token_hash=? LIMIT 1
    `).bind(hash).first();
    if (!s) return jsonResponse({ ok: true, autenticado: false, pro_activo: false });
    const valid = Number(s.revocada) === 0 && parseDate(s.sesion_expira_at) > new Date() &&
      Number(s.pro_activo) === 1 && parseDate(s.pro_vencimiento) > new Date();
    return jsonResponse({
      ok: true, autenticado: valid, pro_activo: valid,
      email: valid ? s.email : null,
      pro_vencimiento: valid ? s.pro_vencimiento : null
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
