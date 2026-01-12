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

// --------- GENERAR RESPUESTA ---------
function generarRespuesta() {

  // --- CASO PRO + ARCANO ---
  if (ES_PRO && saleArcano()) {
    return generarArcano();
  }

  // --- RESPUESTA NORMAL (igual que antes) ---
  const totales = [1, 3, 5];
  const total = elegir(totales);

  let respuesta = [];

  const fuentes = [
    banco.palabras,
    banco.frases_cortas,
    banco.frases_largas
  ];

  // PRO: se amplían fuentes
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

function generarArcano() {
  if (!bancoPRO || !bancoPRO.arcanos_mayores) return null;

  const arcano = elegir(bancoPRO.arcanos_mayores);
  const invertido = arcanoInvertido();

  return {
    tipo: "arcano",
    numero: arcano.numero,
    nombre: arcano.nombre,
    imagen: arcano.imagen,
    interpretacion: invertido
      ? arcano.invertido.interpretacion_corta
      : arcano.derecho.interpretacion_corta,
    invertido
  };
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


  const resultado = generarRespuesta();

if (resultado.tipo === "arcano") {
  respuestaEl.innerHTML = `
    <img src="${resultado.imagen}" style="max-width:240px; margin-bottom:1.2rem;">
    <div>${resultado.interpretacion}</div>
  `;
} else {
  respuestaEl.innerHTML = resultado.items.join("<br><br>");
}

  function construirPromptIA(resultado, preguntaUsuario = "") {

  if (resultado.tipo === "arcano") {
    return `
Eres una voz simbólica inspirada en la visión de consciencia de Enrique Barrios.
No predices, no aconsejas, no moralizas.

Arcano: ${resultado.nombre}
Interpretación base: ${resultado.interpretacion}
${resultado.invertido ? "El Arcano está invertido." : ""}

${preguntaUsuario ? "La pregunta del consultante es solo contexto interno." : ""}

Amplía el significado de forma contemplativa, serena y abierta.
No cierres la interpretación.
    `;
  }

  // RESPUESTA TEXTUAL
  const items = resultado.items;
  const primero = items[0];
  const ultimo = items[items.length - 1];

  return `
Eres una voz simbólica inspirada en la visión de consciencia de Enrique Barrios.
No predices, no aconsejas, no moralizas.

Respuesta del Oráculo:
${items.join(" / ")}

Enfoca la ampliación principalmente en:
- Inicio: "${primero}"
- Cierre: "${ultimo}"

Los elementos intermedios son tránsito simbólico.

${preguntaUsuario ? "La pregunta del consultante es solo contexto interno." : ""}

Usa lenguaje contemplativo, claro y respetuoso.
No expliques como profesor.
No concluyas de forma absoluta.
  `;
}

  async function ampliarConIA(prompt) {

  const respuestaIA = await fetch("TU_ENDPOINT_IA", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt
    })
  });

  const data = await respuestaIA.json();
  return data.texto;
}


  document.querySelector(".oracle-seal").style.display = "block";

  localStorage.setItem("oraculoAM_ultimaConsulta", hoy);

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

const ampliacionEl = document.getElementById("ampliacion-ia");
ampliacionEl.innerHTML = "";

if (ES_PRO) {
  const prompt = construirPromptIA(resultado, inputPregunta.value);

  ampliarConIA(prompt).then(textoIA => {
    ampliacionEl.innerHTML = `
      <hr style="opacity:0.2; margin:2rem 0;">
      <em>${textoIA}</em>
    `;
  });
}

// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;
  respuestaEl.innerHTML = "";
    document.getElementById("ampliacion-ia").innerHTML = "";
  inputPregunta.value = "";
};
