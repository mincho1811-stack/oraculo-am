document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ELEMENTOS BASE
  ========================= */

  const boton = document.getElementById("consultar");
  const respuesta = document.getElementById("respuesta");
  const pregunta = document.getElementById("pregunta");
  const capa = document.getElementById("capa-oraculo");
  const volver = document.getElementById("volver");

  const accionesPro = document.getElementById("acciones-pro");
  const seccionHistorial = document.getElementById("historial-pro");
  const listaHistorial = document.getElementById("lista-historial");
  const btnGuardar = document.getElementById("guardar-historial");
  const btnBorrar = document.getElementById("borrar-historial");

  let banco = null;

  /* =========================
     CARGAR BANCO
  ========================= */

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  /* =========================
     ESTADO PRO
  ========================= */

  const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

  if (esPro && accionesPro && seccionHistorial) {
    accionesPro.classList.remove("oculto");
    seccionHistorial.classList.remove("oculto");
  }

  /* =========================
     CONSULTA
  ========================= */

  boton.addEventListener("click", () => {

    if (!banco) {
      respuesta.innerText = "El Oráculo permanece en silencio.";
      mostrarOraculo();
      return;
    }

    const hoy = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaConsulta");

    if (!esPro && ultima === hoy) {
      respuesta.innerText = "EL ORÁCULO YA HABLÓ HOY. REGRESA MAÑANA.";
      mostrarOraculo();
      return;
    }

    // La pregunta NO se guarda automáticamente
    const textoPregunta = pregunta.value;
    pregunta.value = "";

    const tipos = [
      "palabra",
      "palabras_3",
      "palabras_5",
      "frase_1",
      "frases_3",
      "frases_5"
    ];

    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    let resultado = [];

    const tomar = (arr, n) =>
      arr.sort(() => 0.5 - Math.random()).slice(0, n);

    switch (tipo) {
      case "palabra":
        resultado = tomar(banco.palabras, 1);
        break;
      case "palabras_3":
        resultado = tomar(banco.palabras, 3);
        break;
      case "palabras_5":
        resultado = tomar(banco.palabras, 5);
        break;
      case "frase_1":
        resultado = tomar(banco.frases_cortas, 1);
        break;
      case "frases_3":
        resultado = tomar(banco.frases_cortas, 3);
        break;
      case "frases_5":
        resultado = tomar(banco.frases_largas, 1);
        break;
    }

    respuesta.innerHTML = resultado.join("<br><br>");
    mostrarOraculo();

    localStorage.setItem("ultimaConsulta", hoy);

    // Reset botón guardar
    if (btnGuardar) {
      btnGuardar.innerText = "Guardar esta consulta";
      btnGuardar.disabled = false;
    }
  });

  /* =========================
     MOSTRAR / CERRAR ORÁCULO
  ========================= */

  function mostrarOraculo() {
    capa.classList.add("activa");
  }

  function cerrarOraculo() {
    capa.classList.remove("activa");
  }

  if (volver) volver.addEventListener("click", cerrarOraculo);
  if (respuesta) respuesta.addEventListener("dblclick", cerrarOraculo);

  /* =========================
     HISTORIAL PRO
  ========================= */

  function cargarHistorial() {
    if (!listaHistorial) return;

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

  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      const historial = JSON.parse(localStorage.getItem("historialAM")) || [];

      historial.unshift({
        fecha: new Date().toLocaleString(),
        pregunta: pregunta.value || "(no escrita)",
        respuesta: respuesta.innerText
      });

      localStorage.setItem("historialAM", JSON.stringify(historial));
      cargarHistorial();

      btnGuardar.innerText = "Guardado ✨";
      btnGuardar.disabled = true;
    });
  }

  if (btnBorrar) {
    btnBorrar.addEventListener("click", () => {
      if (confirm("¿Deseas borrar todo el historial?")) {
        localStorage.removeItem("historialAM");
        cargarHistorial();
      }
    });
  }

  cargarHistorial();

});
