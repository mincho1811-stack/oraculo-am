document.addEventListener("DOMContentLoaded", () => {

  const boton = document.getElementById("consultar");
  const respuesta = document.getElementById("respuesta");
  const pregunta = document.getElementById("pregunta");
  const ritualContenedor = document.getElementById("ritual-contenedor");

  let banco = null;

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  boton.addEventListener("click", () => {

    const hoy = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaConsulta");

    if (ultima === hoy) {
      mostrar("El Oráculo ya habló hoy.<br>Regresa mañana.");
      return;
    }

    if (!banco) {
      mostrar("El Oráculo permanece en silencio.");
      return;
    }

    // Limpia la pregunta (no se guarda)
    if (pregunta) pregunta.value = "";

    // Silencio ritual
    ritualContenedor.classList.add("silencio");

    setTimeout(() => {
      revelarRespuesta();
    }, 1800);

    localStorage.setItem("ultimaConsulta", hoy);
  });

  function revelarRespuesta() {

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
    respuesta.style.opacity = 1;
  }

  function mostrar(texto) {
    respuesta.innerHTML = texto;
    respuesta.style.opacity = 1;
  }

});
