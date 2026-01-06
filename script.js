const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");
const textoRespuesta = document.getElementById("texto-respuesta");

const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");
const btnGuardar = document.getElementById("guardar");

const historialSeccion = document.getElementById("historial");
const listaHistorial = document.getElementById("lista-historial");
const btnBorrarHistorial = document.getElementById("borrar-historial");

const inputPregunta = document.getElementById("pregunta");

/* BANCO DE RESPUESTAS (AMPLIADO, CON REPETICIÓN POSIBLE) */
const respuestas = [
  "Silencio.",
  "Observa.",
  "Permanece.",
  "Espera.",
  "Confía.",
  "Acepta.",
  "Detente.",
  "Escucha.",

  "No es el momento.",
  "Aún no.",
  "Todavía.",
  "Ahora no.",
  "Permite que sea.",

  "La respuesta no necesita palabras.",
  "El silencio también responde.",
  "No fuerces la comprensión.",
  "La claridad surge cuando sueltas.",
  "Hay más de una verdad.",
  "Lo evidente no es lo esencial.",
  "No mires hacia afuera.",
  "La pregunta ya transformó el camino.",

  "El sentido se revela en quietud.",
  "Nada falta en este instante.",
  "Lo profundo no se apresura.",
  "La comprensión llegará sin aviso.",
  "El proceso es parte de la respuesta.",
  "El símbolo se revelará cuando estés listo.",
  "La incertidumbre también guía.",
  "Permanece atento a lo sutil."
];

/* OBTENER RESPUESTA (CON REPETICIÓN POSIBLE) */
function obtenerRespuesta() {
  return respuestas[Math.floor(Math.random() * respuestas.length)];
}

/* CONSULTAR */
btnConsultar.addEventListener("click", () => {
  textoRespuesta.innerText = obtenerRespuesta();

  vistaConsulta.classList.add("oculto");
  historialSeccion.classList.add("oculto");
  vistaRespuesta.classList.remove("oculto");

  btnGuardar.disabled = false;
});

/* VOLVER */
btnVolver.addEventListener("click", () => {
  vistaRespuesta.classList.add("oculto");
  vistaConsulta.classList.remove("oculto");
  inputPregunta.value = "";
  cargarHistorial();
});

/* GUARDAR */
btnGuardar.addEventListener("click", () => {
  const historial = JSON.parse(localStorage.getItem("oraculoAM")) || [];

  historial.push({
    fecha: new Date().toLocaleString(),
    pregunta: inputPregunta.value || "Pregunta no escrita",
    respuesta: textoRespuesta.innerText
  });

  localStorage.setItem("oraculoAM", JSON.stringify(historial));
  btnGuardar.disabled = true;
});

/* HISTORIAL */
function cargarHistorial() {
  const historial = JSON.parse(localStorage.getItem("oraculoAM")) || [];
  if (historial.length === 0) return;

  listaHistorial.innerHTML = "";
  historial.forEach(item => {
    const div = document.createElement("div");
    div.className = "item-historial";
    div.innerHTML = `
      <small>${item.fecha}</small><br>
      <strong>Pregunta:</strong> ${item.pregunta}<br>
      <strong>Respuesta:</strong> ${item.respuesta}
    `;
    listaHistorial.appendChild(div);
  });

  historialSeccion.classList.remove("oculto");
}

btnBorrarHistorial.addEventListener("click", () => {
  localStorage.removeItem("oraculoAM");
  historialSeccion.classList.add("oculto");
});
