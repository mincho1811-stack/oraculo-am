document.addEventListener("DOMContentLoaded", () => {

  const boton = document.getElementById("consultar");
  const respuesta = document.getElementById("respuesta");
  const preguntaInput = document.getElementById("pregunta");
  const capa = document.getElementById("capa-oraculo");
  const guardarBtn = document.getElementById("guardar");
  const accionesPro = document.getElementById("acciones-pro");

  let banco = null;

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

  if (esPro) {
    accionesPro.classList.remove("oculto");
  }

  boton.addEventListener("click", () => {

    const hoy = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaConsulta");

    if (!esPro && ultima === hoy) {
      mostrar("EL ORÁCULO YA HABLÓ HOY.");
      return;
    }

    if (!banco) {
      mostrar("El Oráculo permanece en silencio.");
      return;
    }

    const pregunta = preguntaInput.value;
    preguntaInput.value = "";

    const tipos = [
      "palabra",
      "palabras_3",
      "frase_1"
    ];

    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    let resultado = [];

    const tomar = (arr, n) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, n);

    if (tipo === "palabra") resultado = tomar(banco.palabras, 1);
    if (tipo === "palabras_3") resultado = tomar(banco.palabras, 3);
    if (tipo === "frase_1") resultado = tomar(banco.frases_cortas, 1);

    const textoRespuesta = resultado.join("<br><br>");

    mostrar(textoRespuesta);

    if (!esPro) {
      localStorage.setItem("ultimaConsulta", hoy);
    }

    guardarBtn.onclick = () => guardarHistorial(pregunta, textoRespuesta);
  });

  function mostrar(texto) {
    respuesta.innerHTML = texto;
    capa.classList.add("activa");
  }

  function guardarHistorial(pregunta, respuesta) {
    const historial = JSON.parse(localStorage.getItem("historialAM")) || [];

    historial.push({
      pregunta: pregunta || "(sin pregunta escrita)",
      respuesta,
      fecha: new Date().toLocaleString()
    });

    localStorage.setItem("historialAM", JSON.stringify(historial));
    guardarBtn.innerText = "Guardado ✓";
  }

const capa = document.getElementById("capa-oraculo");
const volver = document.getElementById("volver");

// Volver con botón
volver.addEventListener("click", cerrarOraculo);

// Volver con doble clic en la respuesta
respuesta.addEventListener("dblclick", cerrarOraculo);

function cerrarOraculo() {
  capa.classList.remove("activa");

  // opcional: limpiar respuesta
  setTimeout(() => {
    respuesta.innerHTML = "";
  }, 800);
}
const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

const accionesPro = document.getElementById("acciones-pro");
const seccionHistorial = document.getElementById("historial-pro");

if (esPro) {
  accionesPro.classList.remove("oculto");
  seccionHistorial.classList.remove("oculto");
}

  const btnGuardar = document.getElementById("guardar-historial");

btnGuardar.addEventListener("click", () => {
  const historial = JSON.parse(localStorage.getItem("historialAM")) || [];

  const entrada = {
    fecha: new Date().toLocaleString(),
    pregunta: pregunta.value || "(no escrita)",
    respuesta: respuesta.innerText
  };

  historial.unshift(entrada);
  localStorage.setItem("historialAM", JSON.stringify(historial));

  cargarHistorial();
  btnGuardar.innerText = "Guardado ✨";
  btnGuardar.disabled = true;
});

  const listaHistorial = document.getElementById("lista-historial");

function cargarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialAM")) || [];
  listaHistorial.innerHTML = "";

  historial.forEach(item => {
    const div = document.createElement("div");
    div.className = "entrada-historial";

    div.innerHTML = `
      <div class="fecha">${item.fecha}</div>
      <div class="pregunta"><strong>Pregunta:</strong> ${item.pregunta}</div>
      <div class="respuesta"><strong>Respuesta:</strong> ${item.respuesta}</div>
    `;

    listaHistorial.appendChild(div);
  });
}

cargarHistorial();

  const btnBorrar = document.getElementById("borrar-historial");

btnBorrar.addEventListener("click", () => {
  if (confirm("¿Deseas borrar todo el historial?")) {
    localStorage.removeItem("historialAM");
    cargarHistorial();
  }
});

});
