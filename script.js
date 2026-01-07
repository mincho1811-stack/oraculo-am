const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");
const btnGuardar = document.getElementById("guardar");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const inputPregunta = document.getElementById("pregunta");
const respuestaEl = document.getElementById("respuesta");

const historialLista = document.getElementById("historial-lista");
const borrarHistorial = document.getElementById("borrar-historial");
const aporte = document.getElementById("aporte");

const banco = {
  palabras: ["OBSERVA", "SILENCIO", "UMBRAL", "PAUSA", "RECUERDA"],
  frases_cortas: [
    "TODO CAMBIO COMIENZA DENTRO.",
    "NO ES EL MOMENTO.",
    "CONFÍA EN EL PROCESO."
  ],
  frases_largas: [
    "LO QUE BUSCAS NO SE REVELA CUANDO INSISTES, SINO CUANDO PERMITES.",
    "A VECES LA RESPUESTA ES CAMINAR SIN SABER."
  ]
};

function respuestaAleatoria() {
  const grupos = [
    banco.palabras,
    banco.frases_cortas,
    banco.frases_largas
  ];
  const grupo = grupos[Math.floor(Math.random() * grupos.length)];
  const cantidad = [1, 3, 5][Math.floor(Math.random() * 3)];
  return grupo.sort(() => 0.5 - Math.random()).slice(0, cantidad).join("<br><br>");
}

btnConsultar.onclick = () => {
  respuestaEl.innerHTML = respuestaAleatoria();
  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
  aporte.hidden = true;
};

btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;
  respuestaEl.innerHTML = "";
  aporte.hidden = false;
};

btnGuardar.onclick = () => {
  const historial = JSON.parse(localStorage.getItem("historialAM")) || [];
  historial.unshift({
    pregunta: inputPregunta.value || "(no escrita)",
    respuesta: respuestaEl.innerText,
    fecha: new Date().toLocaleString()
  });
  localStorage.setItem("historialAM", JSON.stringify(historial));
  cargarHistorial();
};

borrarHistorial.onclick = () => {
  localStorage.removeItem("historialAM");
  cargarHistorial();
};

function cargarHistorial() {
  historialLista.innerHTML = "";
  const historial = JSON.parse(localStorage.getItem("historialAM")) || [];

  historial.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "historial-item";
    div.innerHTML = `
      <strong>${item.fecha}</strong><br>
      Pregunta: ${item.pregunta}<br>
      Respuesta: ${item.respuesta}<br>
      <button onclick="borrarItem(${i})">Borrar</button>
    `;
    historialLista.appendChild(div);
  });
}

window.borrarItem = (i) => {
  const historial = JSON.parse(localStorage.getItem("historialAM")) || [];
  historial.splice(i, 1);
  localStorage.setItem("historialAM", JSON.stringify(historial));
  cargarHistorial();
};

cargarHistorial();
