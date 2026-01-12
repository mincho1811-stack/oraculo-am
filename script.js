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

// --------- UTILIDADES ---------
function hoyString() {
  return new Date().toDateString();
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --------- GENERAR RESPUESTA ---------
function generarRespuesta() {
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

  return respuesta.join("<br><br>");
}

// --------- CONSULTAR ---------
btnConsultar.onclick = () => {
  const ultima = localStorage.getItem("oraculoAM_ultimaConsulta");
  const hoy = hoyString();

  if (ultima === hoy) {
  respuestaEl.innerHTML =
    "EL ORÁCULO YA HABLÓ HOY.<br><br>REGRESA MAÑANA.";

  document.querySelector(".oracle-seal").style.display = "none";

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
  return;
}


  respuestaEl.innerHTML = generarRespuesta();

  document.querySelector(".oracle-seal").style.display = "block";

  localStorage.setItem("oraculoAM_ultimaConsulta", hoy);

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;

  respuestaEl.innerHTML = "";
  inputPregunta.value = "";
};
