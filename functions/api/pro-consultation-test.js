function jsonResponse(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
async function sha256Hex(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function getCookie(req,name){const h=req.headers.get("Cookie")||"";for(const x of h.split(";")){const i=x.indexOf("=");if(i<0)continue;if(x.slice(0,i).trim()===name)return x.slice(i+1).trim();}return null;}
function parseDate(v){if(!v)return null;const s=String(v);const d=new Date(s.includes("T")?s:s.replace(" ","T")+"Z");return Number.isNaN(d.getTime())?null:d;}
function localDate(tz){const ps=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const o={};for(const p of ps)if(p.type!=="literal")o[p.type]=p.value;return `${o.year}-${o.month}-${o.day}`;}
export async function onRequestPost(context){
 try{
  const {DB}=context.env;if(!DB)return jsonResponse({ok:false,error:"No está disponible la base de datos DB."},500);
  const token=getCookie(context.request,"oraculo_pro_session");
  if(!token)return jsonResponse({ok:false,autenticado:false,error:"No existe una sesión PRO."},401);
  const hash=await sha256Hex(token);
  const s=await DB.prepare(`SELECT s.id sesion_id,s.usuario_id,s.expira_at sesion_expira_at,s.revocada,u.email,u.pro_activo,u.pro_vencimiento,u.timezone FROM sesiones s INNER JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=? LIMIT 1`).bind(hash).first();
  const now=new Date(),se=parseDate(s?.sesion_expira_at),pe=parseDate(s?.pro_vencimiento);
  const sv=s&&Number(s.revocada)===0&&se&&se>now,pv=s&&Number(s.pro_activo)===1&&pe&&pe>now;
  if(!sv||!pv)return jsonResponse({ok:false,autenticado:false,error:"La sesión PRO no es válida o el PRO ya no está vigente."},401);
  const tz=s.timezone||"America/Bogota";let fecha;
  try{fecha=localDate(tz);}catch{fecha=localDate("America/Bogota");}
  const limite=7;
  await DB.prepare(`INSERT INTO consultas_diarias(usuario_id,fecha,cantidad) VALUES(?,?,0) ON CONFLICT(usuario_id,fecha) DO NOTHING`).bind(s.usuario_id,fecha).run();
  const upd=await DB.prepare(`UPDATE consultas_diarias SET cantidad=cantidad+1,updated_at=CURRENT_TIMESTAMP WHERE usuario_id=? AND fecha=? AND cantidad<?`).bind(s.usuario_id,fecha,limite).run();
  const row=await DB.prepare(`SELECT cantidad FROM consultas_diarias WHERE usuario_id=? AND fecha=? LIMIT 1`).bind(s.usuario_id,fecha).first();
  const cantidad=Number(row?.cantidad||0),registrada=Number(upd?.meta?.changes||0)>0;
  await DB.prepare(`UPDATE sesiones SET ultimo_acceso_at=? WHERE id=?`).bind(new Date().toISOString(),s.sesion_id).run();
  if(!registrada)return jsonResponse({ok:true,autenticado:true,pro_activo:true,consulta_registrada:false,consultas_usadas:cantidad,limite_diario:limite,fecha_local:fecha,timezone:tz,mensaje:"Límite diario PRO alcanzado."},429);
  return jsonResponse({ok:true,autenticado:true,pro_activo:true,consulta_registrada:true,consultas_usadas:cantidad,limite_diario:limite,fecha_local:fecha,timezone:tz,mensaje:"Consulta PRO registrada correctamente."});
 }catch(e){return jsonResponse({ok:false,error:e instanceof Error?e.message:String(e)},500);}
}