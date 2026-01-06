const ritual = document.getElementById("ritual-contenedor");
const respuesta = document.getElementById("respuesta");
const textoRespuesta = document.getElementById("texto-respuesta");

const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");
const btnGuardar = document.getElementById("guardar");

const historialSeccion = document.getElementById("historial");
const listaHistorial = document.getElementById("lista-historial");
const btnBorrarHistorial = document.getElementById("borrar-historial");

const inputPregunta = document.getElementById("pregunta");

/* RESPUESTAS AMPLIADAS */
const respuestas = [
  "Silencio.",
  "Observa.",
  "Permite que se revele.",
  "No es el momento.",
  "La respuesta ya habita en ti.",
  "Confía en el proceso que se despliega.",
  "Detente antes de avanzar.",
  "Aquello que buscas se transforma.",
  "Escucha lo que no se dice.",
  "El tiempo aún no ha madurado.",
  "Hay más de una verdad en juego.",
  "Acepta lo que emerge sin juicio.",
  "No fuerces la comprensión.",
  "El sentido llegará cuando sueltes la pregunta.",
  "Mira desde otro ángulo.",
  "La claridad nace del reposo.",
  "Todo movimiento comienza en quietud.",
  "Esto no requiere acción inmediata.",
  "Permanece atento.",
  "Lo esencial no hace ruido."
];

function obtenerRespuesta() {
  return respuestas[Math.floor(Math.random() * respuestas.length)];
}

/* CONSULTAR */
btnConsultar.addEventListener("click", () => {
  const respuestaElegida = obtenerRespuesta();

  textoRespuesta.innerText = respuestaElegida;

  ritual.classList.add("oculto");
  historialSeccion.classList.add("oculto");

  respuesta.classList.remove("oculto");

  btnGuardar.disabled = false;
  btnGuardar.innerText = "Guardar consulta ✧";
});

/* VOLVER */
btnVolver.addEventListener("click", () => {
  respuesta.classList.add("oculto");
  ritual.classList.remove("oculto");
  inputPregunta.value = "";

  cargarHistorial();
});

/* GUARDAR (PRO LOCAL) */
btnGuardar.addEventListener("click", () => {
  const pregunta = inputPregunta.value || "Pregunta no escrita";
  const respuestaTexto = textoRespuesta.innerText;

  const registro = {
    fecha: new Date().toLocaleString(),
    pregunta,
    respuesta: respuestaTexto
  };

  const historial = JSON.parse(localStorage.getItem("oraculoAM")) || [];
  historial.push(registro);
  localStorage.setItem("oraculoAM", JSON.stringify(historial));

  btnGuardar.disabled = true;
  btnGuardar.innerText = "Guardado ✨";
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

/* BORRAR HISTORIAL */
btnBorrarHistorial.addEventListener("click", () => {
  localStorage.removeItem("oraculoAM");
  historialSeccion.classList.add("oculto");
});
