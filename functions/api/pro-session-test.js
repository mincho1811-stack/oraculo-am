function jsonResponse(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
async function sha256Hex(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function cookie(req,name){const h=req.headers.get("Cookie")||"";for(const x of h.split(";")){const i=x.indexOf("=");if(i<0)continue;if(x.slice(0,i).trim()===name)return x.slice(i+1).trim();}return null;}
function date(v){if(!v)return null;const s=String(v);const d=new Date(s.includes("T")?s:s.replace(" ","T")+"Z");return Number.isNaN(d.getTime())?null:d;}
export async function onRequestGet(context){
 try{
  const {DB}=context.env;
  if(!DB)return jsonResponse({ok:false,error:"No está disponible la base de datos DB."},500);
  const token=cookie(context.request,"oraculo_pro_session");
  if(!token)return jsonResponse({ok:true,autenticado:false,mensaje:"No existe una sesión PRO en este navegador."},401);
  const hash=await sha256Hex(token);
  const s=await DB.prepare(`SELECT s.id sesion_id,s.usuario_id,s.expira_at sesion_expira_at,s.revocada,u.email,u.pro_activo,u.pro_vencimiento FROM sesiones s INNER JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=? LIMIT 1`).bind(hash).first();
  if(!s)return jsonResponse({ok:true,autenticado:false,mensaje:"La sesión PRO no existe."},401);
  const now=new Date(), se=date(s.sesion_expira_at), pe=date(s.pro_vencimiento);
  const sv=Number(s.revocada)===0&&se&&se>now, pv=Number(s.pro_activo)===1&&pe&&pe>now;
  if(!sv||!pv)return jsonResponse({ok:true,autenticado:false,mensaje:"La sesión no es válida o el PRO ya no está vigente."},401);
  await DB.prepare(`UPDATE sesiones SET ultimo_acceso_at=? WHERE id=?`).bind(new Date().toISOString(),s.sesion_id).run();
  return jsonResponse({ok:true,autenticado:true,pro_activo:true,email:s.email,sesion_expira_at:s.sesion_expira_at,pro_vencimiento:s.pro_vencimiento,mensaje:"Sesión PRO válida y reconocida por el servidor."});
 }catch(e){return jsonResponse({ok:false,error:e instanceof Error?e.message:String(e)},500);}
}
