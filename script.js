document.addEventListener("DOMContentLoaded", () => {

  const boton = document.getElementById("consultar");
  const respuesta = document.getElementById("respuesta");
  const pregunta = document.getElementById("pregunta");
  const ritual = document.querySelector(".ritual");

  let banco = null;

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  let tarot = null;

fetch("data/tarot.json")
  .then(res => res.json())
  .then(data => tarot = data);

  boton.addEventListener("click", () => {

    const hoy = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaConsulta");

    // Límite versión esencial
    if (ultima === hoy) {
      mostrarMensaje("El Oráculo ya habló hoy.<br>Regresa mañana.");
      bloquearBoton();
      return;
    }

    if (!banco) {
      mostrarMensaje("El Oráculo permanece en silencio.");
      return;
    }

    // La pregunta nunca se guarda
    if (pregunta) pregunta.value = "";

    // Transición ritual
    ritual.classList.add("fade-out");
    respuesta.style.opacity = 0;

    setTimeout(() => {
      generarRespuesta();
    }, 1400);

    localStorage.setItem("ultimaConsulta", hoy);
  });

  const contenedor = document.getElementById("ritual-contenedor");
contenedor.classList.add("silencio");

  function generarRespuesta() {

    const tipos = [
      "palabra",
      "palabras_3",
      "palabras_5",
      "frase_1",
      "frases_3",
      "frases_5"
    ];

    const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

// Probabilidad de Tarot SOLO si es PRO
const usarTarot = esPro && Math.random() < 0.35;

    if (usarTarot && tarot) {

  const carta = tarot[Math.floor(Math.random() * tarot.length)];
  const invertida = Math.random() < 0.5;

  const interpretacion = invertida
    ? carta.invertido
    : carta.derecho;

  respuesta.innerHTML = `
    <div class="tarot-card">
      <img src="${carta.imagen}" alt="${carta.nombre}">
      <h3>${carta.nombre}</h3>
      <p class="posicion">
        ${invertida ? "Invertida" : "Al derecho"}
      </p>
      <p class="interpretacion">
        ${interpretacion}
      </p>
    </div>
  `;

  setTimeout(() => {
    respuesta.style.opacity = 1;
  }, 600);

  localStorage.setItem("ultimaConsulta", hoy);
  return;
}

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
    respuesta.style.opacity = 1;
  }

  function mostrarMensaje(texto) {
    respuesta.innerHTML = texto;
    respuesta.style.opacity = 1;
  }

  function bloquearBoton() {
    boton.disabled = true;
    boton.style.opacity = 0.4;
  }

});
