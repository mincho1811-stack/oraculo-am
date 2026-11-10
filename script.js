// --------- CONFIG ---------
const PROBABILIDAD_ARCANO_FREE = 0.11;
const PROBABILIDAD_ARCANO_PRO = 0.35;

// --------- DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");
const vistaConsulta = document.getElementById("vista-consulta");
const pantallaResultado = document.getElementById("pantalla-resultado");
const respuestaEl = document.getElementById("respuesta");
const preguntaInput = document.getElementById("pregunta");
const ampliacionEl = document.getElementById("ampliacion-ia");

const proAcceso = document.getElementById("pro-acceso");
const proEmailPaso = document.getElementById("pro-email-paso");
const proCodigoPaso = document.getElementById("pro-codigo-paso");
const proEmail = document.getElementById("pro-email");
const proCodigo = document.getElementById("pro-codigo");
const proEnviarCodigo = document.getElementById("pro-enviar-codigo");
const proVerificarCodigo = document.getElementById("pro-verificar-codigo");
const proMensaje = document.getElementById("pro-mensaje");
const proCerrar = document.getElementById("pro-cerrar");
const proAbrir = document.getElementById("pro-abrir");

const LIMITE_GRATIS = 1;
const LIMITE_PRO = 7;
let estadoPro = false;
let banco = null;
let bancoCargado = false;
let consultaAutorizada = false;
let resultadoActual = null;

const arcanosMayores = [
  {romano:"0",nombre:"El Loco",imagen:"img/arcanos/00_el_loco.jpg",derecho:"Inicio, apertura, confianza en el viaje del alma. Un inicio sin garantías, pero lleno de posibilidad.",invertido:"Impulsividad sin dirección, dispersión, miedo a avanzar. Riesgo de no ver lo evidente."},
  {romano:"I",nombre:"El Mago",imagen:"img/arcanos/01_el_mago.jpg",derecho:"Voluntad consciente, poder creador, manifestación. Tienes los recursos. Es momento de actuar con intención.",invertido:"Energía bloqueada, duda, manipulación. Ilusión de control. Algo no es lo que parece."},
  {romano:"II",nombre:"La Sacerdotisa",imagen:"img/arcanos/02_la_sacerdotisa.jpg",derecho:"Intuición profunda, sabiduría interior, silencio fértil. La respuesta está dentro. Escucha lo que no es evidente.",invertido:"Desconexión interna, secretos no escuchados. Estás ignorando tu intuición."},
  {romano:"III",nombre:"La Emperatriz",imagen:"img/arcanos/03_la_emperatriz.jpg",derecho:"Fertilidad, creación, expansión. Algo está creciendo.",invertido:"Bloqueo creativo o dependencia emocional."},
  {romano:"IV",nombre:"El Emperador",imagen:"img/arcanos/04_el_emperador.jpg",derecho:"Orden, estructura, decisión. Es momento de liderar.",invertido:"Rigidez o control excesivo. Falta de flexibilidad."},
  {romano:"V",nombre:"El Hierofante",imagen:"img/arcanos/05_el_hierofante.jpg",derecho:"Sabiduría tradicional. Aprende de lo establecido.",invertido:"Cuestiona las reglas. No todo lo heredado es verdad."},
  {romano:"VI",nombre:"Los Enamorados",imagen:"img/arcanos/06_los_enamorados.jpg",derecho:"Elección alineada. Unión con propósito.",invertido:"Confusión emocional. Decisión no alineada."},
  {romano:"VII",nombre:"El Carro",imagen:"img/arcanos/07_el_carro.jpg",derecho:"Avance decidido. Control en movimiento.",invertido:"Falta de dirección. Energía dispersa."},
  {romano:"VIII",nombre:"La Fuerza",imagen:"img/arcanos/08_la_fuerza.jpg",derecho:"Dominio interno. Calma en medio del impulso.",invertido:"Debilidad percibida. Falta de confianza."},
  {romano:"IX",nombre:"El Ermitaño",imagen:"img/arcanos/09_el_ermitano.jpg",derecho:"Retiro necesario. Búsqueda interior.",invertido:"Aislamiento improductivo. Evitación."},
  {romano:"X",nombre:"La Rueda de la Fortuna",imagen:"img/arcanos/10_la_rueda.jpg",derecho:"Cambio inevitable. Movimiento del destino.",invertido:"Resistencia al cambio. Ciclo estancado."},
  {romano:"XI",nombre:"La Justicia",imagen:"img/arcanos/11_la_justicia.jpg",derecho:"Equilibrio. Consecuencias claras.",invertido:"Desbalance. Falta de claridad o verdad."},
  {romano:"XII",nombre:"El Colgado",imagen:"img/arcanos/12_el_colgado.jpg",derecho:"Pausa necesaria. Nueva perspectiva.",invertido:"Resistencia a soltar. Estancamiento."},
  {romano:"XIII",nombre:"La Muerte",imagen:"img/arcanos/13_la_muerte.jpg",derecho:"Transformación profunda. Fin necesario.",invertido:"Negación del cambio. Apego al pasado."},
  {romano:"XIV",nombre:"La Templanza",imagen:"img/arcanos/14_la_templanza.jpg",derecho:"Equilibrio fluido. Integración.",invertido:"Desajuste. Falta de armonía."},
  {romano:"XV",nombre:"El Diablo",imagen:"img/arcanos/15_el_diablo.jpg",derecho:"Ataduras conscientes. Lo que eliges sostener.",invertido:"Liberación posible. Reconocer la cadena."},
  {romano:"XVI",nombre:"La Torre",imagen:"img/arcanos/16_la_torre.jpg",derecho:"Ruptura inevitable. Caída de lo falso.",invertido:"Cambio evitado. Tensión acumulada."},
  {romano:"XVII",nombre:"La Estrella",imagen:"img/arcanos/17_la_estrella.jpg",derecho:"Esperanza. Guía sutil pero presente.",invertido:"Duda. Pérdida de fe momentánea."},
  {romano:"XVIII",nombre:"La Luna",imagen:"img/arcanos/18_la_luna.jpg",derecho:"Lo oculto emerge. Intuición activa.",invertido:"Confusión. Ilusión o autoengaño."},
  {romano:"XIX",nombre:"El Sol",imagen:"img/arcanos/19_el_sol.jpg",derecho:"Claridad total. Energía abierta.",invertido:"Exceso o ceguera por optimismo."},
  {romano:"XX",nombre:"El Juicio",imagen:"img/arcanos/20_el_juicio.jpg",derecho:"Llamado interno. Despertar.",invertido:"Negación. No escuchar lo evidente."},
  {romano:"XXI",nombre:"El Mundo",imagen:"img/arcanos/21_el_mundo.jpg",derecho:"Cierre completo. Integración total.",invertido:"Ciclo inconcluso. Algo falta cerrar."}
];

async function cargarBanco(){
  try{
    const r=await fetch("data/banco.json",{cache:"no-store"});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    banco=await r.json();bancoCargado=true;
    btnConsultar.disabled=false;btnConsultar.removeAttribute("aria-disabled");
  }catch(error){
    console.error("No se pudo cargar el banco del Oráculo AM:",error);
    btnConsultar.disabled=true;btnConsultar.setAttribute("aria-disabled","true");
    respuestaEl.innerHTML=`<div class="limite">NO SE PUDO CARGAR EL BANCO DEL ORÁCULO.<br><br>RECARGA LA PÁGINA E INTÉNTALO DE NUEVO.</div>`;
  }
}

function elegir(arr){return arr[Math.floor(Math.random()*arr.length)];}
function cantidadElementos(){return elegir([1,3,5]);}

function generarOraculo(){
  const cantidad=cantidadElementos();let elementos=[];
  for(let i=0;i<cantidad;i++){
    const tipo=Math.random();
    if(tipo<0.4){
      const texto=elegir(banco.palabras);
      elementos.push({html:`<div class="respuesta-elemento palabra">${texto}</div>`,texto});
    }else if(tipo<0.7){
      const texto=elegir(banco.frases_cortas);
      elementos.push({html:`<div class="respuesta-elemento frase-corta">${texto}</div>`,texto});
    }else{
      const texto=elegir(banco.frases_largas);
      elementos.push({html:`<div class="respuesta-elemento frase-larga">${texto}</div>`,texto});
    }
  }
  return {html:`<div class="oraculo respuesta-simple">${elementos.map(e=>e.html).join("")}</div>`,texto:elementos.map(e=>e.texto).join("\\n"),tipo:"respuesta_simple"};
}

function generarArcano(){
  const carta=elegir(arcanosMayores),invertido=Math.random()<0.5;
  const titulo=invertido?`${carta.romano}. ${carta.nombre} (INVERTIDO)`: `${carta.romano}. ${carta.nombre}`;
  const texto=invertido?carta.invertido:carta.derecho;
  const rotacion=invertido?"rotate(180deg)":"rotate(0deg)";
  return {html:`<div class="arcano"><h2>${titulo}</h2><img src="${carta.imagen}" style="max-width:200px;transform:${rotacion};"><p>${texto}</p></div>`,texto:`${titulo}. ${texto}`,tipo:"arcano"};
}

async function autorizarConsulta(){
  const r=await fetch("/api/consultar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
  const data=await r.json().catch(()=>({}));
  return {r,data};
}

btnConsultar.addEventListener("click",async()=>{
  if(!bancoCargado||!banco||consultaAutorizada)return;
  consultaAutorizada=true;btnConsultar.disabled=true;
  try{
    const {r,data}=await autorizarConsulta();
    if(!r.ok||!data.permitido){
      const mensaje=data.mensaje||"No se pudo autorizar la consulta.";
      respuestaEl.innerHTML=`<div class="limite">${mensaje}<br><br>${!data.pro_activo?"ACTIVA EL ORÁCULO PRO PARA ACCEDER A MÁS RESPUESTAS.":""}</div>`;
      vistaConsulta.style.display="none";pantallaResultado.style.display="block";window.scrollTo({top:0,behavior:"smooth"});
      return;
    }

    estadoPro=Boolean(data.pro_activo);
    const probabilidadArcano=Number(data.probabilidad_arcano)||PROBABILIDAD_ARCANO_FREE;
    resultadoActual=Math.random()<probabilidadArcano?generarArcano():generarOraculo();
    const html=resultadoActual.html;
    respuestaEl.innerHTML=`<div class="cargando">CONECTANDO CON LO SUPERIOR...</div>`;
    ampliacionEl.innerHTML="";
    vistaConsulta.style.display="none";pantallaResultado.style.display="block";

    setTimeout(()=>{
      if(pantallaResultado.style.display!=="none"){
        respuestaEl.innerHTML=html;
        actualizarAmpliacion(resultadoActual, preguntaInput.value.trim());
      }
    },1800);
    window.scrollTo({top:0,behavior:"smooth"});
  }catch(error){
    console.error(error);
    respuestaEl.innerHTML=`<div class="limite">NO FUE POSIBLE CONECTAR CON EL ORÁCULO.<br><br>INTÉNTALO DE NUEVO.</div>`;
    vistaConsulta.style.display="none";pantallaResultado.style.display="block";window.scrollTo({top:0,behavior:"smooth"});
  }finally{
    consultaAutorizada=false;
    btnConsultar.disabled=false;
  }
});

function actualizarAmpliacion(resultado=null, pregunta=""){
  if(estadoPro){
    const textoRespuesta=resultado?.texto || resultadoActual?.texto || "";
    ampliacionEl.innerHTML=`
      <section class="ampliacion ampliacion-pro">
        <h3>Ampliación</h3>
        <p class="ampliacion-intro">Profundiza en el mensaje recibido desde una mirada de atención, autoobservación y trabajo interior.</p>
        <button type="button" id="btn-ampliar-ia" class="btn-ampliar-ia">Ampliar con inteligencia artificial</button>
        <p class="ampliacion-privacidad">Tu pregunta no se guarda en Oráculo AM.</p>
        <div id="resultado-ampliacion-ia" aria-live="polite"></div>
      </section>`;
    const boton=document.getElementById("btn-ampliar-ia");
    boton?.addEventListener("click",()=>solicitarAmpliacionIA(textoRespuesta,pregunta));
  }else{
    ampliacionEl.innerHTML=`<div class="bloque-pro" role="button" tabindex="0" id="bloque-pro-acceso">ACCEDE A LA AMPLIACIÓN DEL MENSAJE CON ORÁCULO PRO</div>`;
    const bloque=document.getElementById("bloque-pro-acceso");
    if(bloque){bloque.addEventListener("click",abrirPro);bloque.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();abrirPro();}});}
  }
}

async function solicitarAmpliacionIA(respuesta,pregunta){
  const boton=document.getElementById("btn-ampliar-ia");
  const salida=document.getElementById("resultado-ampliacion-ia");
  if(!boton||!salida||!respuesta)return;
  boton.disabled=true;
  salida.textContent="Preparando la ampliación…";
  try{
    const r=await fetch("/api/ampliar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({respuesta,pregunta})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok)throw new Error(data.error||"No fue posible generar la ampliación.");
    const parrafo=document.createElement("p");
    parrafo.className="ampliacion-texto-ia";
    parrafo.textContent=data.ampliacion;
    salida.replaceChildren(parrafo);
    boton.textContent="Ampliación generada";
  }catch(error){
    console.error("Error en ampliación IA:",error);
    salida.textContent=error.message||"No fue posible generar la ampliación. Inténtalo más tarde.";
    boton.disabled=false;
  }
}

proAbrir.addEventListener("click", abrirPro);

function abrirPro(){
  proAcceso.hidden=false;proMensaje.textContent="";proEmail.focus();
  proAcceso.scrollIntoView({behavior:"smooth",block:"center"});
}
function cerrarPro(){proAcceso.hidden=true;proMensaje.textContent="";proCodigoPaso.hidden=true;proEmailPaso.hidden=false;proCodigo.value="";}

proEnviarCodigo.addEventListener("click",async()=>{
  const email=proEmail.value.trim().toLowerCase();
  if(!email||!email.includes("@")){proMensaje.textContent="Escribe un correo válido.";return;}
  proEnviarCodigo.disabled=true;proMensaje.textContent="Enviando código…";
  try{
    const r=await fetch("/api/pro-request-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){proMensaje.textContent=data.error||"No fue posible solicitar el código.";return;}
    proEmailPaso.hidden=true;proCodigoPaso.hidden=false;proMensaje.textContent="Te enviamos un código de 6 dígitos. Revisa tu correo.";proCodigo.focus();
  }catch(error){console.error(error);proMensaje.textContent="No fue posible conectar con el servicio.";}
  finally{proEnviarCodigo.disabled=false;}
});

proVerificarCodigo.addEventListener("click",async()=>{
  const email=proEmail.value.trim().toLowerCase(),codigo=proCodigo.value.trim();
  if(!/^\d{6}$/.test(codigo)){proMensaje.textContent="El código debe tener 6 dígitos.";return;}
  proVerificarCodigo.disabled=true;proMensaje.textContent="Verificando…";
  try{
    const r=await fetch("/api/pro-verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,codigo})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.autenticado){proMensaje.textContent=data.error||"No se pudo verificar el código.";return;}
    estadoPro=true;proMensaje.textContent="Acceso PRO activado en este navegador.";
    setTimeout(()=>{cerrarPro();actualizarAmpliacion();},700);
  }catch(error){console.error(error);proMensaje.textContent="No fue posible conectar con el servicio.";}
  finally{proVerificarCodigo.disabled=false;}
});

proCerrar.addEventListener("click",cerrarPro);

btnVolver.addEventListener("click",()=>{
  pantallaResultado.style.display="none";vistaConsulta.style.display="block";
  respuestaEl.innerHTML="";ampliacionEl.innerHTML="";preguntaInput.value="";
  window.scrollTo({top:0,behavior:"smooth"});
});

async function comprobarSesionPro(){
  try{
    const r=await fetch("/api/pro-status",{cache:"no-store"});
    const data=await r.json();
    estadoPro=Boolean(data.autenticado&&data.pro_activo);
  }catch{estadoPro=false;}
}

async function iniciar(){
  await comprobarSesionPro();
  actualizarAmpliacion();
  await cargarBanco();
}

iniciar();
