const ES_PRO = true; // cambiar a false para volver a FREE

const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaEl = document.getElementById("respuesta");
const inputPregunta = document.getElementById("pregunta");

// BANCO (puede ampliarse luego)
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

let bancoPRO = null;

if (ES_PRO) {
  fetch("data/banco_pro.json")
    .then(res => res.json())
    .then(data => bancoPRO = data);
}

// --------- UTILIDADES ---------
function hoyString() {
  return new Date().toDateString();
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function saleArcano() {
  return Math.random() < 0.2; // ~20%
}

function arcanoInvertido() {
  return Math.random() < 0.35; // 35%
}

function generarArcano() {
  if (!bancoPRO || !bancoPRO.arcanos_mayores) return null;

  const arcano = elegir(bancoPRO.arcanos_mayores);
  const invertido = arcanoInvertido();

  return {
    tipo: "arcano",
    imagen: arcano.imagen,
    interpretacion: invertido
      ? arcano.invertido.interpretacion_corta
      : arcano.derecho.interpretacion_corta
  };
}

// --------- GENERAR RESPUESTA ---------
function generarRespuesta() {

  // --- PRO: posibilidad de Arcano Mayor ---
  if (modoActual === "pro") {
    const chanceArcano = Math.random();

    // 25% de probabilidad
    if (chanceArcano < 0.25) {
      generarArcanoMayor();
      return;
    }
  }
  
  if (ES_PRO && saleArcano()) {
    return generarArcano();
  }

  const totales = [1, 3, 5];
  const total = elegir(totales);

  let respuesta = [];

  const fuentes = [
    banco.palabras,
    banco.frases_cortas,
    banco.frases_largas
  ];

  if (ES_PRO && bancoPRO) {
    fuentes.push(
      bancoPRO.palabras_pro,
      bancoPRO.frases_cortas_pro,
      bancoPRO.frases_largas_pro
    );
  }

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

  if (ultima === hoy) {
    respuestaEl.innerHTML =
      "EL ORÁCULO YA HABLÓ HOY.<br><br>REGRESA MAÑANA.";
    vistaConsulta.hidden = true;
    vistaRespuesta.hidden = false;
    return;
  }

  const resultado = generarRespuesta();

  // MOSTRAR RESPUESTA
  if (typeof resultado === "string") {
    // CASO FREE ANTIGUO (seguridad)
    respuestaEl.innerHTML = resultado;
  } else if (resultado.tipo === "arcano") {
    respuestaEl.innerHTML = `
      <img src="${resultado.imagen}" style="max-width:240px; margin-bottom:1.2rem;">
      <div>${resultado.interpretacion}</div>
    `;
  } else if (resultado.tipo === "texto") {
    respuestaEl.innerHTML = resultado.items.join("<br><br>");
  }

  localStorage.setItem("oraculoAM_ultimaConsulta", hoy);

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

function generarArcanoMayor() {
  console.log("Arcano Mayor PRO (pendiente de render)");
}


// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;

  respuestaEl.innerHTML = "";
  inputPregunta.value = "";

  window.scrollTo(0, 0);
};
