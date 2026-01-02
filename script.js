document.addEventListener("DOMContentLoaded", () => {

  const boton = document.getElementById("consultar");
  const respuesta = document.getElementById("respuesta");
  const pregunta = document.getElementById("pregunta");

  let banco = null;

  fetch("data/banco.json")
    .then(res => res.json())
    .then(data => banco = data);

  boton.addEventListener("click", () => {

    const hoy = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaConsulta");

    if (ultima === hoy) {
      respuesta.innerText = "EL ORÁCULO YA HABLÓ HOY. REGRESA MAÑANA.";
      respuesta.style.opacity = 1;
      boton.disabled = true;
      boton.style.opacity = 0.4;
      return;
    }

    if (!banco) {
      respuesta.innerText = "El Oráculo permanece en silencio.";
      respuesta.style.opacity = 1;
      return;
    }

    // La pregunta NO se guarda
    pregunta.value = "";

    respuesta.style.opacity = 0;

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

    function prepararRespuesta() {
  const ritual = document.querySelector(".ritual");
  ritual.classList.add("hidden");

  setTimeout(() => {
    mostrarRespuesta();
  }, 1400);
}

    setTimeout(() => {
      respuesta.innerHTML = resultado.join("<br><br>");
      respuesta.style.opacity = 1;
    }, 400);

    localStorage.setItem("ultimaConsulta", hoy);

    localStorage.setItem("oraculoAM_PRO", "true");

    const esPro = localStorage.getItem("oraculoAM_PRO") === "true";

  });

});
