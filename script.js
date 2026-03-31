// --------- CONFIG ---------
const PRO_ACTIVO = true;
const MAX_CONSULTAS_PRO = 7;
const PROBABILIDAD_ARCANO = 0.3;
const PROB_DERECHO = 0.55;

// --------- DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaEl = document.getElementById("respuesta");
const inputPregunta = document.getElementById("pregunta");

// --------- ESTADO ---------
let arcanosMayores = [];
let arcanosListos = false;

// --------- CARGA SEGURA ---------
fetch("data/arcanos_mayores.json")
  .then(res => res.json())
  .then(data => {
    arcanosMayores = data;
    arcanosListos = true;
  })
  .catch(() => {
    arcanosListos = false;
  });

// --------- BANCO ---------
const banco = {

  palabras: [
    "SÍ","NO","MAGIA","ELIGE","BARRERA","POSITIVO","NEGATIVO","INDIFERENTE","DIOS","AMOR","MARAVILLA","UNIVERSO","CULPA","PRESENTE","RESPIRA","SILENCIO","UMBRAL","PAUSA","OBSERVA","RECUERDA","ESPERA","CAMBIO","CLARIDAD","ORIGEN","ENTREGA",
    "FLUYE","DESPIERTA","ACEPTA","CONFÍA","SUELTA","TRANSFORMA","INTEGRA","SOSTÉN","RENUEVA","PERMITE",
    "ESCUCHA","REVELA","ALINEA","DESCIENDE","ASCIENDE","CRUZA","MIRA","RECIBE","VACÍA","ABRE"
  ],

  frases_cortas: [
    "TODO COMIENZA DENTRO.",
    "NO ES EL MOMENTO.",
    "CONFÍA EN EL PROCESO.",
    "LO SIMPLE ES PROFUNDO.",
    "NO FUERCES LA RESPUESTA.",
    "AÚN NO ES CLARO.",
    "LO SABES, PERO NO LO ESCUCHAS.",
    "HAY ALGO QUE NO ESTÁS VIENDO.",
    "LA RESPUESTA YA EXISTE.",
    "EL TIEMPO ES PARTE DE LA RESPUESTA.",
    "NO TODO DEBE RESOLVERSE AHORA.",
    "LO QUE RESISTES, PERSISTE.",
    "ES MOMENTO DE DETENERTE.",
    "LO QUE BUSCAS TE ESTÁ BUSCANDO.",
    "NO INTERVENGAS.",
    "PERMITE QUE OCURRA.",
    "HAY MÁS DE UNA VERDAD.",
    "NO CONFUNDAS URGENCIA CON IMPORTANCIA.",
    "LO ESENCIAL NO CAMBIA.",
    "EL RUIDO NO ES GUÍA."
  ],

  frases_largas: [
    "LA AUSENCIA DE RESPUESTA, TAMBIÉN ES UNA RESPUESTA.",
    "LO QUE BUSCAS NO SE REVELA CUANDO INSISTES, SINO CUANDO PERMITES.",
    "A VECES LA RESPUESTA ES CAMINAR SIN SABER HACIA DÓNDE.",
    "CUANDO CESAS LA BÚSQUEDA, LA RESPUESTA APARECE.",
    "EL SILENCIO NO ES AUSENCIA, ES PRESENCIA PLENA.",
    "LO QUE PARECE DETENIDO ESTÁ REORDENÁNDOSE EN UN NIVEL QUE AÚN NO VES.",
    "NO TODO LO QUE SE CIERRA ES UNA PÉRDIDA; A VECES ES PROTECCIÓN.",
    "CUANDO INTENTAS FORZAR EL CAMINO, TE ALEJAS DE ÉL.",
    "HAY RESPUESTAS QUE SOLO LLEGAN CUANDO DEJAS DE HACER LA PREGUNTA.",
    "LO QUE HOY TE CONFUNDE, MAÑANA TE DARÁ CLARIDAD.",
    "A VECES EL SIGUIENTE PASO ES NO DAR NINGÚN PASO.",
    "LO QUE NO COMPRENDES AÚN, NO SIGNIFICA QUE ESTÉ MAL.",
    "LA RESPUESTA NO SIEMPRE ES ACCIÓN; A VECES ES ESPERA.",
    "LO QUE EVITAS MIRAR CONTIENE PARTE DE LA VERDAD.",
    "NO TODO DEBE SER ENTENDIDO PARA SER ACEPTADO.",
    "CUANDO SUELTAS EL CONTROL, EMPIEZAS A VER.",
    "LO QUE CREES QUE FALTA, TAL VEZ SOLO NECESITA TIEMPO.",
    "HAY MOVIMIENTOS INVISIBLES SOSTENIENDO LO QUE VES.",
    "LO QUE HOY DUELE, TAMBIÉN ESTÁ ENSEÑANDO.",
    "NO TODO LO QUE TERMINA, TERMINA REALMENTE.",
    "LO QUE PARECE INCERTIDUMBRE ES UN UMBRAL."
  ]
};

// --------- UTIL ---------
function hoyString() {
  return new Date().toDateString();
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --------- ARCANO SEGURO ---------
function generarArcanoMayor() {

  if (!arcanosListos || arcanosMayores.length === 0) {
    return `
      <div class="arcano">
        <p class="interpretacion">EL ORÁCULO AÚN SE ESTÁ REVELANDO...</p>
      </div>
    `;
  }

  const carta = elegir(arcanosMayores);
  const esDerecho = Math.random() < PROB_DERECHO;

  let titulo = `${carta.romano}. ${carta.nombre}`;
  if (!esDerecho) titulo += " (invertido)";

  const interpretacion = esDerecho ? carta.derecho : carta.invertido;
  const rotacion = esDerecho ? "rotate(0deg)" : "rotate(180deg)";

  return `
    <div class="arcano">
      <h2 class="arcano-titulo">${titulo}</h2>
      <img src="/${carta.imagen}" class="arcano-img" style="transform:${rotacion};">
      <p class="interpretacion">${interpretacion}</p>
    </div>
  `;
}

// --------- RESPUESTA ---------
function generarRespuesta() {

  if (PRO_ACTIVO && Math.random() < PROBABILIDAD_ARCANO) {
    return { tipo: "arcano", html: generarArcanoMayor() };
  }

  const totales = [1,3,5];
  const total = elegir(totales);

  let respuesta = [];
  const fuentes = [banco.palabras, banco.frases_cortas, banco.frases_largas];

  while (respuesta.length < total) {
    respuesta.push(elegir(elegir(fuentes)));
  }

  return { tipo: "texto", items: respuesta };
}

// --------- CONSULTAR ---------
btnConsultar.onclick = () => {

  const ultima = localStorage.getItem("oraculoAM_ultimaConsulta");
  const hoy = hoyString();

  let contador = parseInt(localStorage.getItem("oraculoAM_contadorHoy")) || 0;

  if (ultima === hoy && (!PRO_ACTIVO || contador >= MAX_CONSULTAS_PRO)) {
    respuestaEl.innerHTML = "EL ORÁCULO YA HABLÓ HOY.<br><br>REGRESA MAÑANA.";
  } else {

    const r = generarRespuesta();

    if (r.tipo === "arcano") {
      respuestaEl.innerHTML = r.html;
    } else {
      respuestaEl.innerHTML = r.items.join("<br><br>");
    }

    localStorage.setItem("oraculoAM_ultimaConsulta", hoy);
    contador++;
    localStorage.setItem("oraculoAM_contadorHoy", contador);
  }

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;
  respuestaEl.innerHTML = "";
  inputPregunta.value = "";
  window.scrollTo(0,0);
};
