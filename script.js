document.addEventListener("DOMContentLoaded", () => {

  const botonConsultar = document.getElementById("consultar");
  const botonVolver = document.getElementById("volver");
  const botonGuardar = document.getElementById("guardar");
  const botonBorrarHistorial = document.getElementById("borrar-historial");

  const ritual = document.getElementById("ritual-contenedor");
  const respuestaContenedor = document.getElementById("respuesta-contenedor");
  const respuestaEl = document.getElementById("respuesta");
  const inputPregunta = document.getElementById("pregunta");

  const historialSeccion = document.getElementById("historial");
  const listaHistorial = document.getElementById("lista-historial");

  let banco = null;
  let ultimaRespuesta = "";
  let ultimaPregunta = "";

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

  function mezclar(arr) {
    return arr.sort(() => 0.5 - Math.random());
  }

  function generarRespuesta() {
    const cantidad = [1, 3, 5][Math.floor(Math.random() * 3)];

    const fuentes = mezclar([
      { data: banco.palabras, tipo: "palabra" },
      { data: banco.frases_cortas, tipo: "frase corta" },
      { data: banco.frases_largas, tipo: "frase larga" }
    ]);

    let resultado = [];

    fuentes.forEach(f => {
      if (resultado.length < cantidad) {
        resultado.push(...mezclar(f.data).slice(0, 1));
      }
    });

    return resultado.slice(0, cantidad);
  }

  botonConsultar.addEventListener("click", () => {

    if (!banco) return;

    ultimaPregunta = inputPregunta.value.trim() || "(no escrita)";
    ultimaRespuesta = generarRespuesta().join("<br><br>");

    ritual.classList.add("oculto");
    respuestaContenedor.classList.remove("oculto");

    respuestaEl.innerHTML = ultimaRespuesta;

    if (esPro) {
      botonGuardar.classList.remove("oculto");
    }

    inputPregunta.value = "";
  });

  botonVolver.addEventListener("click", () => {
    respuestaContenedor.classList.add("oculto");
    ritual.classList.remove("oculto");

    if (esPro) {
      mostrarHistorial();
    }
  });

  botonGuardar.addEventListener("click", () => {
    if (!esPro) return;

    const historial = JSON.parse(localStorage.getItem("oraculoAM_historial")) || [];

    historial.unshift({
      fecha: new Date().toLocaleString(),
      pregunta: ultimaPregunta,
      respuesta: ultimaRespuesta.replace(/<br><br>/g, " ")
    });

    localStorage.setItem("oraculoAM_historial", JSON.stringify(historial));
    botonGuardar.innerText = "Guardado ✨";
    botonGuardar.disabled = true;
  });

  function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem("oraculoAM_historial")) || [];

    if (historial.length === 0) return;

    historialSeccion.classList.remove("oculto");
    listaHistorial.innerHTML = "";

    historial.forEach(item => {
      const div = document.createElement("div");
      div.className = "entrada-historial";
      div.innerHTML = `
        <p class="fecha">${item.fecha}</p>
        <p><strong>Pregunta:</strong> ${item.pregunta}</p>
        <p><em>Respuesta:</em> ${item.respuesta}</p>
      `;
      listaHistorial.appendChild(div);
    });
  }

  botonBorrarHistorial.addEventListener("click", () => {
    localStorage.removeItem("oraculoAM_historial");
    historialSeccion.classList.add("oculto");
  });

});
