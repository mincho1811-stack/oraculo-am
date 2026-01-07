const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const vistaRespuesta = document.getElementById("vista-respuesta");

const respuestaEl = document.getElementById("respuesta");

const banco = {
  palabras: [
    "SILENCIO", "UMBRAL", "PAUSA", "OBSERVA", "RECUERDA",
    "ESPERA", "CAMBIO", "CLARIDAD", "ORIGEN"
  ],
  frases_cortas: [
    "TODO COMIENZA DENTRO.",
    "NO ES EL MOMENTO.",
    "CONFÍA EN EL PROCESO.",
    "LO SIMPLE ES PROFUNDO."
  ],
  frases_largas: [
    "LO QUE BUSCAS NO SE REVELA CUANDO INSISTES, SINO CUANDO PERMITES.",
    "A VECES LA RESPUESTA ES CAMINAR SIN SABER HACIA DÓNDE.",
    "CUANDO CESAS LA BÚSQUEDA, LA RESPUESTA APARECE."
  ]
};

function respuestaAleatoria() {
  const tipos = [
    { arr: banco.palabras, n: [1,3,5] },
    { arr: banco.frases_cortas, n: [1,3] },
    { arr: banco.frases_largas, n: [1] }
  ];

  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const cantidad = tipo.n[Math.floor(Math.random() * tipo.n.length)];

  return tipo.arr
    .sort(() => 0.5 - Math.random())
    .slice(0, cantidad)
    .join("<br><br>");
}

btnConsultar.onclick = () => {
  respuestaEl.innerHTML = respuestaAleatoria();
  vistaConsulta.hidden = true;
  vistaRespuesta.hidden = false;
};

btnVolver.onclick = () => {
  vistaRespuesta.hidden = true;
  vistaConsulta.hidden = false;
  respuestaEl.innerHTML = "";
};
