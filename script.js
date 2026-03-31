// --------- CONFIG ---------
const PROBABILIDAD_ARCANO = 1; // para prueba

// --------- DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaEl = document.getElementById("respuesta");

// --------- DATA ---------
const arcanosMayores = [
  {
    romano: "0",
    nombre: "El Loco",
    imagen: "img/arcanos/loco.jpg",
    derecho: "Un inicio sin garantías, pero lleno de posibilidad.",
    invertido: "Impulsividad sin dirección."
  },
  {
    romano: "I",
    nombre: "El Mago",
    imagen: "img/arcanos/mago.jpg",
    derecho: "Tienes los recursos. Es momento de actuar.",
    invertido: "Ilusión de control."
  }
];

// --------- UTIL ---------
function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --------- ARCANO ---------
function generarArcano() {

  const carta = elegir(arcanosMayores);
  const invertido = Math.random() < 0.5;

  const titulo = invertido
    ? `${carta.romano}. ${carta.nombre} (invertido)`
    : `${carta.romano}. ${carta.nombre}`;

  const texto = invertido ? carta.invertido : carta.derecho;
  const rotacion = invertido ? "rotate(180deg)" : "rotate(0deg)";

  return `
    <div class="arcano">
      <h2>${titulo}</h2>
      <img src="${carta.imagen}" style="max-width:200px; transform:${rotacion};">
      <p>${texto}</p>
    </div>
  `;
}

// --------- BOTÓN ---------
btnConsultar.onclick = () => {

  console.log("CLICK OK");

  let html;

  if (Math.random() < PROBABILIDAD_ARCANO) {
    html = generarArcano();
  } else {
    html = "RESPUESTA SIMPLE";
  }

  respuestaEl.innerHTML = html;

  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

// --------- VOLVER ---------
btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;
  respuestaEl.innerHTML = "";
};
