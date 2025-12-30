const palabras = [
  "SÍ", "NO", "ESPERA", "CONFÍA", "AVANZA",
  "OBSERVA", "SUELTA", "PERMITE"
];

document.getElementById("consultar").addEventListener("click", () => {
  const r = palabras[Math.floor(Math.random() * palabras.length)];
  document.getElementById("respuesta").innerText = r;
});
const respuesta = document.getElementById("respuesta");
respuesta.style.opacity = 0;

setTimeout(() => {
  respuesta.innerText = r;
  respuesta.style.opacity = 1;
}, 300);
const hoy = new Date().toDateString();
const ultima = localStorage.getItem("ultimaConsulta");

if (ultima === hoy) {
  document.getElementById("respuesta").innerText =
    "El Oráculo ya habló hoy. Regresa mañana.";
  return;
}

localStorage.setItem("ultimaConsulta", hoy);
