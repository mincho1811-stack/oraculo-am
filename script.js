// --------- CONFIG ---------
const PROBABILIDAD_ARCANO = 0.4; // 40% arcano, 60% oráculo

// --------- DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const pantallaResultado = document.getElementById("pantalla-resultado");

const respuestaEl = document.getElementById("respuesta");

// --------- DATA ---------
const arcanosMayores = [
  { "romano": "0", "nombre": "El Loco", "imagen": "img/arcanos/00_el_loco.jpg", "derecho": "Inicio, apertura, confianza en el viaje del alma. Un inicio sin garantías, pero lleno de posibilidad.", "invertido": "Impulsividad sin dirección, dispersión, miedo a avanzar. Riesgo de no ver lo evidente." },
  { "romano": "I", "nombre": "El Mago", "imagen": "img/arcanos/01_el_mago.jpg", "derecho": "Voluntad consciente, poder creador, manifestación. Tienes los recursos. Es momento de actuar con intención.", "invertido": "Energía bloqueada, duda, manipulación. Ilusión de control. Algo no es lo que parece." },
  { "romano": "II", "nombre": "La Sacerdotisa", "imagen": "img/arcanos/02_la_sacerdotisa.jpg", "derecho": "Intuición profunda, sabiduría interior, silencio fértil. La respuesta está dentro. Escucha lo que no es evidente.", "invertido": "Desconexión interna, secretos no escuchados. Estás ignorando tu intuición." },
  { "romano": "III", "nombre": "La Emperatriz", "imagen": "img/arcanos/03_la_emperatriz.jpg", "derecho": "Fertilidad, creación, expansión. Algo está creciendo.", "invertido": "Bloqueo creativo o dependencia emocional." },
  { "romano": "IV", "nombre": "El Emperador", "imagen": "img/arcanos/04_el_emperador.jpg", "derecho": "Orden, estructura, decisión. Es momento de liderar.", "invertido": "Rigidez o control excesivo. Falta de flexibilidad." },
  { "romano": "V", "nombre": "El Hierofante", "imagen": "img/arcanos/05_el_hierofante.jpg", "derecho": "Sabiduría tradicional. Aprende de lo establecido.", "invertido": "Cuestiona las reglas. No todo lo heredado es verdad." },
  { "romano": "VI", "nombre": "Los Enamorados", "imagen": "img/arcanos/06_los_enamorados.jpg", "derecho": "Elección alineada. Unión con propósito.", "invertido": "Confusión emocional. Decisión no alineada." },
  { "romano": "VII", "nombre": "El Carro", "imagen": "img/arcanos/07_el_carro.jpg", "derecho": "Avance decidido. Control en movimiento.", "invertido": "Falta de dirección. Energía dispersa." },
  { "romano": "VIII", "nombre": "La Fuerza", "imagen": "img/arcanos/08_la_fuerza.jpg", "derecho": "Dominio interno. Calma en medio del impulso.", "invertido": "Debilidad percibida. Falta de confianza." },
  { "romano": "IX", "nombre": "El Ermitaño", "imagen": "img/arcanos/09_el_ermitano.jpg", "derecho": "Retiro necesario. Búsqueda interior.", "invertido": "Aislamiento improductivo. Evitación." },
  { "romano": "X", "nombre": "La Rueda de la Fortuna", "imagen": "img/arcanos/10_la_rueda.jpg", "derecho": "Cambio inevitable. Movimiento del destino.", "invertido": "Resistencia al cambio. Ciclo estancado." },
  { "romano": "XI", "nombre": "La Justicia", "imagen": "img/arcanos/11_la_justicia.jpg", "derecho": "Equilibrio. Consecuencias claras.", "invertido": "Desbalance. Falta de claridad o verdad." },
  { "romano": "XII", "nombre": "El Colgado", "imagen": "img/arcanos/12_el_colgado.jpg", "derecho": "Pausa necesaria. Nueva perspectiva.", "invertido": "Resistencia a soltar. Estancamiento." },
  { "romano": "XIII", "nombre": "La Muerte", "imagen": "img/arcanos/13_la_muerte.jpg", "derecho": "Transformación profunda. Fin necesario.", "invertido": "Negación del cambio. Apego al pasado." },
  { "romano": "XIV", "nombre": "La Templanza", "imagen": "img/arcanos/14_la_templanza.jpg", "derecho": "Equilibrio fluido. Integración.", "invertido": "Desajuste. Falta de armonía." },
  { "romano": "XV", "nombre": "El Diablo", "imagen": "img/arcanos/15_el_diablo.jpg", "derecho": "Ataduras conscientes. Lo que eliges sostener.", "invertido": "Liberación posible. Reconocer la cadena." },
  { "romano": "XVI", "nombre": "La Torre", "imagen": "img/arcanos/16_la_torre.jpg", "derecho": "Ruptura inevitable. Caída de lo falso.", "invertido": "Cambio evitado. Tensión acumulada." },
  { "romano": "XVII", "nombre": "La Estrella", "imagen": "img/arcanos/17_la_estrella.jpg", "derecho": "Esperanza. Guía sutil pero presente.", "invertido": "Duda. Pérdida de fe momentánea." },
  { "romano": "XVIII", "nombre": "La Luna", "imagen": "img/arcanos/18_la_luna.jpg", "derecho": "Lo oculto emerge. Intuición activa.", "invertido": "Confusión. Ilusión o autoengaño." },
  { "romano": "XIX", "nombre": "El Sol", "imagen": "img/arcanos/19_el_sol.jpg", "derecho": "Claridad total. Energía abierta.", "invertido": "Exceso o ceguera por optimismo." },
  { "romano": "XX", "nombre": "El Juicio", "imagen": "img/arcanos/20_el_juicio.jpg", "derecho": "Llamado interno. Despertar.", "invertido": "Negación. No escuchar lo evidente." },
  { "romano": "XXI", "nombre": "El Mundo", "imagen": "img/arcanos/21_el_mundo.jpg", "derecho": "Cierre completo. Integración total.", "invertido": "Ciclo inconcluso. Algo falta cerrar." }
];

// --------- BANCO ---------
const banco = {
  palabras: [
    "SÍ.","NO.","MAGIA.","ELIGE.","BARRERA.","POSITIVO.","NEGATIVO.","INDIFERENTE.","DIOS.","AMOR.","MARAVILLA.","UNIVERSO.""¡CERTEZA!","CULPA.","PRESENTE.","RESPIRA.","SILENCIO.","UMBRAL.","PAUSA.","OBSERVA.","RECUERDA.","ESPERA.","CAMBIO.","CLARIDAD.","ORIGEN.","ENTREGA.",
    "FLUYE.","DESPIERTA.","ACEPTA.","¡CONFÍA!","SUELTA.","TRANSFORMA.","INTEGRA.","SOSTÉN.","RENUEVA.","PERMITE.",
    "ESCUCHA.","REVELA.","ALINEA.","DESCIENDE.","ASCIENDE.","CRUZA.","MIRA.","RECIBE.","VACÍA.","ABRE."
  ],

  frases_cortas: [
    "TODO COMIENZA DENTRO.",
    "NO ES EL MOMENTO.",
    "CONFÍA EN EL PROCESO.",
    "LO SIMPLE ES PROFUNDO.",
    "NO FUERCES LA RESPUESTA.",
    "AÚN NO ES CLARO.",
    "LO SABES, PERO NO LO ESCUCHAS.",
    "HAY ALGO QUE NO ESTÁS VIENDO.",
    "LA RESPUESTA YA EXISTE.",
    "EL TIEMPO ES PARTE DE LA RESPUESTA.",
    "NO TODO DEBE RESOLVERSE AHORA.",
    "LO QUE RESISTES, PERSISTE.",
    "ES MOMENTO DE DETENERTE.",
    "LO QUE BUSCAS TE ESTÁ BUSCANDO.",
    "NO INTERVENGAS.",
    "PERMITE QUE OCURRA.",
    "HAY MÁS DE UNA VERDAD.",
    "NO CONFUNDAS URGENCIA CON IMPORTANCIA.",
    "LO ESENCIAL NO CAMBIA.",
    "EL RUIDO NO ES GUÍA."
  ],

  frases_largas: [
    "LA AUSENCIA DE RESPUESTA, TAMBIÉN ES UNA RESPUESTA.",
    "LO QUE BUSCAS NO SE REVELA CUANDO INSISTES, SINO CUANDO PERMITES.",
    "A VECES LA RESPUESTA ES CAMINAR SIN SABER HACIA DÓNDE.",
    "CUANDO CESAS LA BÚSQUEDA, LA RESPUESTA APARECE.",
    "EL SILENCIO NO ES AUSENCIA, ES PRESENCIA PLENA.",
    "LO QUE PARECE DETENIDO ESTÁ REORDENÁNDOSE EN UN NIVEL QUE AÚN NO VES.",
    "NO TODO LO QUE SE CIERRA ES UNA PÉRDIDA; A VECES ES PROTECCIÓN.",
    "CUANDO INTENTAS FORZAR EL CAMINO, TE ALEJAS DE ÉL.",
    "HAY RESPUESTAS QUE SOLO LLEGAN CUANDO DEJAS DE HACER LA PREGUNTA.",
    "LO QUE HOY TE CONFUNDE, MAÑANA TE DARÁ CLARIDAD.",
    "A VECES EL SIGUIENTE PASO ES NO DAR NINGÚN PASO.",
    "LO QUE NO COMPRENDES AÚN, NO SIGNIFICA QUE ESTÉ MAL.",
    "LA RESPUESTA NO SIEMPRE ES ACCIÓN; A VECES ES ESPERA.",
    "LO QUE EVITAS MIRAR CONTIENE PARTE DE LA VERDAD.",
    "NO TODO DEBE SER ENTENDIDO PARA SER ACEPTADO.",
    "CUANDO SUELTAS EL CONTROL, EMPIEZAS A VER.",
    "LO QUE CREES QUE FALTA, TAL VEZ SOLO NECESITA TIEMPO.",
    "HAY MOVIMIENTOS INVISIBLES SOSTENIENDO LO QUE VES.",
    "LO QUE HOY DUELE, TAMBIÉN ESTÁ ENSEÑANDO.",
    "NO TODO LO QUE TERMINA, TERMINA REALMENTE.",
    "LO QUE PARECE INCERTIDUMBRE ES UN UMBRAL."
  ]
};

// --------- UTIL ---------
function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cantidadElementos() {
  const opciones = [1, 3, 5];
  return elegir(opciones);
}

// --------- ORÁCULO SIMPLE ---------
function generarOraculo() {
  const cantidad = cantidadElementos();
  let resultado = [];

  for (let i = 0; i < cantidad; i++) {
    const tipo = Math.random();

    if (tipo < 0.4) {
      resultado.push(`<div class="palabra">${elegir(banco.palabras)}</div>`);
    } else if (tipo < 0.7) {
      resultado.push(`<div class="frase-corta">${elegir(banco.frases_cortas)}</div>`);
    } else {
      resultado.push(`<div class="frase-larga">${elegir(banco.frases_largas)}</div>`);
    }
  }

  return `<div class="oraculo">${resultado.join("")}</div>`;
}

// --------- ARCANO ---------
function generarArcano() {
  const carta = elegir(arcanosMayores);
  const invertido = Math.random() < 0.5;

  const titulo = invertido
    ? `${carta.romano}. ${carta.nombre} (INVERTIDO)`
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

// --------- CONSULTAR ---------
btnConsultar.onclick = () => {

  let html;

  if (Math.random() < PROBABILIDAD_ARCANO) {
    html = generarArcano();
  } else {
    html = generarOraculo();
  }

  respuestaEl.innerHTML = html;

  vistaConsulta.style.display = "none";
  pantallaResultado.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
};

// --------- VOLVER ---------
btnVolver.onclick = () => {

  pantallaResultado.style.display = "none";
  vistaConsulta.style.display = "block";

  respuestaEl.innerHTML = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
};
