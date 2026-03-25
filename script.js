const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaTexto = document.getElementById("respuesta-texto");
const respuestaArcano = document.getElementById("respuesta-arcano");

let arcanosMayores = [];

fetch("data/arcanos_mayores.json")
  .then(res => res.json())
  .then(data => arcanosMayores = data);

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generarArcanoMayor() {
  const carta = elegir(arcanosMayores);
  const esDerecho = Math.random() < 0.55;

  const rotacion = esDerecho ? "rotate(0deg)" : "rotate(180deg)";
  const interpretacion = esDerecho ? carta.derecho : carta.invertido;

  return `
    <div class="arcano">
      <div class="arcano-contenido">
        <h2 class="arcano-titulo">${carta.nombre}</h2>

        <img src="${carta.imagen}" class="arcano-img" style="transform:${rotacion};">

        <div class="arcano-separador"></div>

        <p class="interpretacion">${interpretacion}</p>
      </div>
    </div>
  `;
}

function generarTexto() {
  const opciones = [
    "SILENCIO",
    "CONFÍA EN EL PROCESO",
    "NO ES EL MOMENTO",
    "TODO COMIENZA DENTRO"
  ];
  return elegir(opciones);
}

btnConsultar.onclick = () => {

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;

  respuestaTexto.innerHTML = "";
  respuestaArcano.innerHTML = "";

  // Pausa ritual (oscuridad implícita)
  setTimeout(() => {

    if (Math.random() < 0.4 && arcanosMayores.length) {

      respuestaArcano.innerHTML = generarArcanoMayor();

      setTimeout(() => {
        const arcano = document.querySelector(".arcano");
        if (arcano) arcano.classList.add("visible");
      }, 200);

    } else {
      respuestaTexto.innerHTML = generarTexto();
    }

  }, 400);
};

btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;

  respuestaTexto.innerHTML = "";
  respuestaArcano.innerHTML = "";

  window.scrollTo(0, 0);
};
