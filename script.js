// --------- MODO PRO (pruebas) ---------
const PRO_ACTIVO = true;
const MAX_CONSULTAS_PRO = 7;
const PROBABILIDAD_ARCANO = 0.3; // 30%
const PROB_DERECHO = 0.55;

// --------- ELEMENTOS DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaEl = document.getElementById("respuesta");
const inputPregunta = document.getElementById("pregunta");

// --------- BANCO BASE (FREE) ---------
const banco = {
  palabras: [
    "SILENCIO", "UMBRAL", "PAUSA", "OBSERVA", "RECUERDA",
    "ESPERA", "CAMBIO", "CLARIDAD", "ORIGEN", "ENTREGA"
  ],
  frases_cortas: [
    "TODO COMIENZA DENTRO.",
    "NO ES EL MOMENTO.",
    "CONFÍA EN EL PROCESO.",
    "LO SIMPLE ES PROFUNDO.",
    "NO FUERCES LA RESPUESTA."
  ],
  frases_largas: [
    "LO QUE BUSCAS NO SE REVELA CUANDO INSISTES, SINO CUANDO PERMITES.",
    "A VECES LA RESPUESTA ES CAMINAR SIN SABER HACIA DÓNDE.",
    "CUANDO CESAS LA BÚSQUEDA, LA RESPUESTA APARECE.",
    "EL SILENCIO NO ES AUSENCIA, ES PRESENCIA PLENA."
  ]
};

let arcanosMayores = [];

fetch("data/arcanos_mayores.json")
  .then(res => res.json())
  .then(data => arcanosMayores = data);


// --------- UTILIDADES ---------
function hoyString() {
  return new Date().toDateString();
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --------- ARCANO MAYOR ---------
function saleArcanoMayor() {
  return PRO_ACTIVO && Math.random() < PROBABILIDAD_ARCANO;
}

function generarArcanoMayor() {
  if (!arcanosMayores.length) {
    return "<p>Cargando el oráculo...</p>";
  }

  const carta = elegir(arcanosMayores);
  const esDerecho = Math.random() < PROB_DERECHO;

  let titulo = `${carta.romano}. ${carta.nombre}`;
  if (!esDerecho) titulo += " (invertido)";

  const interpretacion = esDerecho
    ? carta.derecho
    : carta.invertido;

  const rotacion = esDerecho ? "rotate(0deg)" : "rotate(180deg)";

  return `
  <div class="arcano">
    <h2 class="arcano-titulo">${titulo}</h2>
    <img src="/${carta.imagen}" class="arcano-img" style="transform:${rotacion};">
    <hr style="width:60px; margin:1.5rem auto; border:1px solid #aaa;">
    <p class="interpretacion">${interpretacion}</p>
  </div>
`;
}


// --------- RESPUESTA GENERAL ---------
function generarRespuesta() {

  // PRO: posible Arcano Mayor (exclusivo)
  if (saleArcanoMayor()) {
    return {
      tipo: "arcano_mayor",
      html: generarArcanoMayor()
    };
  }

  // Respuesta simbólica normal
  const totales = [1, 3, 5];
  const total = elegir(totales);

  let respuesta = [];

  const fuentes = [
    banco.palabras,
    banco.frases_cortas,
    banco.frases_largas
  ];

  while (respuesta.length < total) {
    const fuente = elegir(fuentes);
    respuesta.push(elegir(fuente));
  }

  return {
    tipo: "texto",
    items: respuesta
  };
}

// --------- CONSULTAR ---------
btnConsultar.onclick = () => {
  const ultima = localStorage.getItem("oraculoAM_ultimaConsulta");
  const hoy = hoyString();

  const contadorKey = "oraculoAM_contadorHoy";
  let contadorHoy = parseInt(localStorage.getItem(contadorKey)) || 0;

  if (ultima === hoy) {
    if (!PRO_ACTIVO || contadorHoy >= MAX_CONSULTAS_PRO) {
      respuestaEl.innerHTML =
        "EL ORÁCULO YA HABLÓ HOY.<br><br>REGRESA MAÑANA.";
      vistaConsulta.hidden = true;
      vistaRespuesta.hidden = false;
      return;
    }
  } else {
    contadorHoy = 0;
  }

  const resultado = generarRespuesta();

  // MOSTRAR RESPUESTA
  if (resultado.tipo === "arcano_mayor") {
    respuestaEl.innerHTML = resultado.html;
  } else if (resultado.tipo === "texto") {
    respuestaEl.innerHTML = resultado.items.join("<br><br>");
  }

  localStorage.setItem("oraculoAM_ultimaConsulta", hoy);
  contadorHoy++;
  localStorage.setItem("oraculoAM_contadorHoy", contadorHoy);

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;

  respuestaEl.innerHTML = "";
  inputPregunta.value = "";

  window.scrollTo(0, 0);
};
