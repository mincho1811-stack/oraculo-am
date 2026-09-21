// --------- CONFIG ---------
const PROBABILIDAD_ARCANO = 0.35;
const MODO_PRUEBA_ARCANO = true; // TEMPORAL: true = 100% Arcanos // 35% arcano, 65% oráculo

// --------- DOM ---------
const btnConsultar = document.getElementById("consultar");
const btnVolver = document.getElementById("volver");

const vistaConsulta = document.getElementById("vista-consulta");
const pantallaResultado = document.getElementById("pantalla-resultado");

const respuestaEl = document.getElementById("respuesta");
const preguntaInput = document.getElementById("pregunta");
const ampliacionEl = document.getElementById("ampliacion-ia");

// --------- LIMITE ---------
const LIMITE_GRATIS = 1;
const LIMITE_PRO = 7;

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
// El banco se carga desde data/banco.json para que pueda ampliarse sin tocar este archivo.
let banco = null;
let bancoCargado = false;

async function cargarBanco() {
  try {
    const respuesta = await fetch("data/banco.json", { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    banco = await respuesta.json();
    bancoCargado = true;
    btnConsultar.disabled = false;
    btnConsultar.removeAttribute("aria-disabled");
  } catch (error) {
    console.error("No se pudo cargar el banco del Oráculo AM:", error);
    btnConsultar.disabled = true;
    btnConsultar.setAttribute("aria-disabled", "true");
    respuestaEl.innerHTML = `
      <div class="limite">
        NO SE PUDO CARGAR EL BANCO DEL ORÁCULO.<br><br>
        RECARGA LA PÁGINA E INTÉNTALO DE NUEVO.
      </div>
    `;
  }
}

// --------- UTIL ---------
function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cantidadElementos() {
  const opciones = [1, 3, 5];
  return elegir(opciones);
}

// --------- clave PRO ---------
function activarPro(clave) {
  if (clave === "AM-PRO-2026") {
    localStorage.setItem("usuario_pro", "true");
    alert("PRO ACTIVADO");
  }
}

// --------- ES PRO ---------
function esPro() {
  return localStorage.getItem("usuario_pro") === "true";
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
btnConsultar.addEventListener("click", () => {

  if (!bancoCargado || !banco) {
    return;
  }

  const uso = obtenerUsoHoy();
  const limite = esPro() ? LIMITE_PRO : LIMITE_GRATIS;

  if (uso.consultas >= limite) {
    respuestaEl.innerHTML = `
      <div class="limite">
        HAS ALCANZADO EL LÍMITE DE CONSULTAS DE HOY.<br><br>
        ${esPro() ? "" : "ACTIVA EL ORÁCULO PRO PARA ACCEDER A MÁS RESPUESTAS."}
      </div>
    `;
    vistaConsulta.style.display = "none";
    pantallaResultado.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const html = (MODO_PRUEBA_ARCANO || Math.random() < PROBABILIDAD_ARCANO)
    ? generarArcano()
    : generarOraculo();

  respuestaEl.innerHTML = `<div class="cargando">CONECTANDO CON LO SUPERIOR...</div>`;
  ampliacionEl.innerHTML = "";

  vistaConsulta.style.display = "none";
  pantallaResultado.style.display = "block";
  guardarUso(uso.consultas + 1);

  setTimeout(() => {
    // Si el usuario volvió antes de que terminara la animación,
    // no volvemos a escribir una respuesta en la pantalla oculta.
    if (pantallaResultado.style.display !== "none") {
      respuestaEl.innerHTML = html;
      actualizarAmpliacion();
    }
  }, 1800);

  window.scrollTo({ top: 0, behavior: "smooth" });
});

// --------- Simular IA ---------
function ampliacionIA(texto) {
  return "Profundización: " + texto;
}

// --------- AMPLIACIÓN IA ---------
function actualizarAmpliacion() {
  if (esPro()) {
    ampliacionEl.innerHTML = generarAmpliacion();
  } else {
    ampliacionEl.innerHTML = `
      <div class="bloque-pro">
        ACCEDE A LA AMPLIACIÓN DEL MENSAJE CON ORÁCULO PRO
      </div>
    `;
  }
}

// --------- GENERAR AMPLIACIÓN IA ---------
function generarAmpliacion() {
  return `
    <div class="ampliacion">
      <h3>Ampliación</h3>
      <p>La respuesta no es literal. Observa cómo se manifiesta en tu situación actual. Hay matices que solo se revelan con el tiempo.</p>
    </div>
  `;
}

// --------- CONSULTAS POR DIA ---------
function obtenerUsoHoy() {
  const hoy = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem("uso_oraculo")) || {};

  if (data.fecha !== hoy) {
    return { fecha: hoy, consultas: 0 };
  }

  return data;
}

function guardarUso(consultas) {
  const hoy = new Date().toDateString();
  localStorage.setItem("uso_oraculo", JSON.stringify({
    fecha: hoy,
    consultas
  }));
}

// --------- VOLVER ---------
btnVolver.addEventListener("click", () => {

  pantallaResultado.style.display = "none";
  vistaConsulta.style.display = "block";

  respuestaEl.innerHTML = "";
  ampliacionEl.innerHTML = "";
  preguntaInput.value = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Preparar el bloque PRO sin mostrar contenido de una consulta anterior.
actualizarAmpliacion();

// Cargar el banco externo antes de permitir consultas.
cargarBanco();
