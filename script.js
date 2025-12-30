const palabras = [
  "SÍ", "NO", "ESPERA", "CONFÍA", "AVANZA",
  "OBSERVA", "SUELTA", "PERMITE"
];

document.getElementById("consultar").addEventListener("click", () => {
  const r = palabras[Math.floor(Math.random() * palabras.length)];
  document.getElementById("respuesta").innerText = r;
});
