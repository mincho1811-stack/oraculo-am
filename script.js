const palabras = [
  "SÍ",
  "NO",
  "PERMITE",
  "ESPERA",
  "CONFÍA",
  "OBSERVA",
  "AVANZA",
  "SUELTA"
];

const boton = document.getElementById("consultar");
const respuesta = document.getElementById("respuesta");

boton.addEventListener("click", () => {
  const hoy = new Date().toDateString();
  const ultima = localStorage.getItem("ultimaConsulta");

  if (ultima === hoy) {
    respuesta.innerText = "El Oráculo ya habló hoy. Regresa mañana.";
    respuesta.style.opacity = 1;
    return;
  }

  const r = palabras[Math.floor(Math.random() * palabras.length)];

  respuesta.style.opacity = 0;

  setTimeout(() => {
    respuesta.innerText = r;
    respuesta.style.opacity = 1;
  }, 300);

  localStorage.setItem("ultimaConsulta", hoy);
});

