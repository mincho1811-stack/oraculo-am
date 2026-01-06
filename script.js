document.addEventListener("DOMContentLoaded", () => {

  const botonConsultar = document.getElementById("consultar");
  const contenedorRitual = document.getElementById("ritual-contenedor");
  const contenedorRespuesta = document.getElementById("respuesta");
  const inputPregunta = document.getElementById("pregunta");

  let banco = null;
  let respuestaActual = [];
  let preguntaActual = "";

  // --- CARGA DEL BANCO ---
  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  // --- UTILIDADES ---
  const tomar = (arr, n) =>
    arr.sort(() => 0.5 - Math.random()).slice(0, n);

  const esPRO = () =>
    localStorage.getItem("oraculoAM_PRO") === "true";

  const fechaHora = () =>
    new Date().toLocaleString();

  // --- GENERADOR COMBINATORIO ---
  function generarRespuesta() {
    const cantidades = [1, 3, 5];
    const total = cantidades[Math.floor(Math.random() * cantidades.length)];

    const tipos = ["palabras", "frases_cortas", "frases_largas"];
    const tiposElegidos = tomar(tipos, Math.floor(Math.random() * 3) + 1);

    let resultado = [];

    let restantes = total;

    tiposElegidos.forEach((tipo, i) => {
      let cantidad = i === tiposElegidos.length - 1
        ? restantes
        : Math.max(1, Math.floor(Math.random() * restantes));

      restantes -= cantidad;

      resultado.push(...tomar(banco[tipo], cantidad));
    });

    return tomar(resultado, total);
  }

  // --- GUARDAR CONSULTA (PRO) ---
  function guardarConsulta() {
    const historial = JSON.parse(localStorage.getItem("oraculoAM_historial") || "[]");

    historial.unshift({
      fecha: fechaHora(),
      pregunta: preguntaActual,
      respuesta: respuestaActual.join(" ")
    });

    localStorage.setItem("oraculoAM_historial", JSON.stringify(historial));
    mostrarHistorial();
  }

  // --- MOSTRAR HISTORIAL ---
  function mostrarHistorial() {
    if (!esPRO()) return;

    const historial = JSON.parse(localStorage.getItem("oraculoAM_historial") || "[]");
    if (!historial.length) return;

    let html = `<section class="section"><h3>Consultas guardadas conscientemente</h3>`;

    historial.forEach(item => {
      html += `
        <div class="historial-item">
          <div class="fecha">${item.fecha}</div>
          <p><strong>Pregunta:</strong> ${item.pregunta}</p>
          <p><em>Respuesta:</em> ${item.respuesta}</p>
        </div>
      `;
    });

    html += `<button id="borrar-historial">Borrar historial</button></section>`;

    contenedorRitual.insertAdjacentHTML("beforeend", html);

    document.getElementById("borrar-historial").onclick = () => {
      localStorage.removeItem("oraculoAM_historial");
      location.reload();
    };
  }

  // --- REGRESAR AL SILENCIO ---
  function regresar() {
    contenedorRespuesta.innerHTML = "";
    contenedorRespuesta.style.opacity = 0;
    contenedorRitual.style.display = "block";
    mostrarHistorial();
  }

  // --- CONSULTA ---
  botonConsultar.addEventListener("click", () => {

    if (!banco) return;

    // regla diaria (no-PRO)
    const hoy = new Date().toDateString();
    if (!esPRO() && localStorage.getItem("ultimaConsulta") === hoy) {
      contenedorRespuesta.innerHTML = "EL ORÁCULO YA HABLÓ HOY.";
      contenedorRespuesta.style.opacity = 1;
      return;
    }

    preguntaActual = inputPregunta.value.trim() || "(no escrita)";
    inputPregunta.value = "";

    respuestaActual = generarRespuesta();

    contenedorRitual.style.display = "none";
    contenedorRespuesta.innerHTML = `
      <div class="respuesta-texto">
        ${respuestaActual.join("<br><br>")}
      </div>
    `;
    contenedorRespuesta.style.opacity = 1;

    if (!esPRO()) {
      localStorage.setItem("ultimaConsulta", hoy);
    }

    // interacción consciente
    contenedorRespuesta.onclick = () => {
      if (esPRO()) {
        const btnGuardar = document.createElement("button");
        btnGuardar.textContent = "Guardar consulta ✧";
        btnGuardar.onclick = (e) => {
          e.stopPropagation();
          guardarConsulta();
          btnGuardar.remove();
        };
        contenedorRespuesta.appendChild(btnGuardar);
      }
      contenedorRespuesta.ondblclick = regresar;
    };
  });

});
