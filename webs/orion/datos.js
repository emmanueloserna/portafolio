// ════════════════════════════════════════════════════════════════
//  Historia, bitácora, preguntas y retos de código
// ════════════════════════════════════════════════════════════════

const CUBIERTAS = [
	{
		nombre: 'SALA DE MÁQUINAS',
		tema: 'click · value · textContent',
		color: '#36E2FF',
		jefe: 'granNull',
		jefeNombre: 'EL GRAN NULL',
		jefeFrase: '¿Valor? Aquí no hay NADA. ¡Todo es null!',
		retos: ['saludo', 'contador'],
	},
	{
		nombre: 'SENSORES',
		tema: 'input · change · keydown',
		color: '#FF5FD2',
		jefe: 'reyKeylogger',
		jefeNombre: 'REY KEYLOGGER',
		jefeFrase: 'Cada tecla que presionas… ¡es MÍA!',
		retos: ['espejo', 'color', 'enter'],
	},
	{
		nombre: 'NÚCLEO',
		tema: 'classList · createElement · submit',
		color: '#FFB224',
		jefe: 'sobrecarga',
		jefeNombre: 'SOBRECARGA SUBMIT',
		jefeFrase: 'SUBMIT… SUBMIT… ¡RECARGARÉ LA PÁGINA PARA SIEMPRE!',
		retos: ['lista', 'luces', 'registro'],
	},
];

const HISTORIA = {
	intro: [
		['ORI', '¡Chispa! Soy ORI, la IA de la nave. Encendiste los 15 sistemas… pero el núcleo se llenó de BUGS.'],
		['CHISPA', '¡Bip! ¿Bip-bup?'],
		['ORI', 'Baja las 3 cubiertas. En cada una te espero en una terminal con un reto de JavaScript REAL: si funciona, abro la puerta del jefe.'],
		['ORI', 'Los cofres esconden preguntas. Acierta y te doy un arma. Arriba en pantalla siempre verás tu objetivo.'],
	],
	cubierta: [
		[
			['ORI', 'Cubierta 1: SALA DE MÁQUINAS. Aquí los bugs no escuchan clics.'],
			['ORI', 'Recuerda la receta: ¿QUIÉN escucha? ¿CUÁNDO? ¿QUÉ cambia?'],
		],
		[
			['ORI', 'Cubierta 2: SENSORES. Aquí todo reacciona sin botón: input, change, keydown.'],
			['ORI', 'Cuidado con el Keylogger: dispara en abanico y huye de ti.'],
		],
		[
			['ORI', 'Cubierta 3: EL NÚCLEO. Hace calor. Los barriles rojos explotan si les disparas.'],
			['ORI', 'Aquí se fabrica DOM: createElement, classList… y el temido submit.'],
		],
	],
	terminal: [
		['ORI', 'Esta terminal controla la puerta del jefe. Escribe el código, yo lo pruebo.'],
		['ORI', 'Si te trabas, después de un intento te doy una pista.'],
	],
	jefeEscudo: [['ORI', '¡Activó un ESCUDO DE SINTAXIS! Solo se rompe con conocimiento. Responde rápido.']],
	final: [
		['ORI', 'Lo lograste, Chispa. El núcleo está limpio.'],
		['ORI', 'Escuchaste clics, leíste values, cambiaste textContent, fabricaste elementos y frenaste un submit.'],
		['ORI', 'Eso es exactamente tu actividad de DOM y eventos. Ya no es teoría: ya lo hiciste.'],
		['CHISPA', '¡BIIIP! 🎉'],
	],
};

// ── Bitácora: tarjetas de conceptos que se desbloquean al aprender
const BITACORA = {
	addEventListener: {titulo: 'addEventListener', texto: 'Pone a un elemento a escuchar un evento. Se le pasa la función SIN paréntesis.', codigo: "boton.addEventListener('click', () => {\n  // qué pasa\n});"},
	querySelector: {titulo: 'querySelector', texto: 'Busca el primer elemento que coincide con un selector CSS. Si no existe, da null.', codigo: "const salida = document.querySelector('#salida');"},
	value: {titulo: 'value', texto: 'Lo que hay escrito dentro de un input, textarea o select. Siempre es texto.', codigo: 'const nombre = campo.value;'},
	textContent: {titulo: 'textContent', texto: 'El texto visible de un elemento. Asignarlo reemplaza lo que había.', codigo: "salida.textContent = '¡Hola!';"},
	trim: {titulo: 'trim()', texto: 'Quita espacios al inicio y al final. Así "   " cuenta como vacío.', codigo: "if (campo.value.trim() === '') { ... }"},
	let: {titulo: 'let vs const', texto: 'let para lo que cambia (un contador). const para lo que no se reasigna.', codigo: 'let carga = 0;\ncarga++;'},
	input: {titulo: "evento 'input'", texto: 'Se dispara con cada letra que entra o sale de un campo.', codigo: "campo.addEventListener('input', () => {\n  vista.textContent = campo.value;\n});"},
	change: {titulo: "evento 'change'", texto: 'En un select, se dispara al elegir otra opción.', codigo: "modo.addEventListener('change', () => {\n  panel.style.backgroundColor = modo.value;\n});"},
	keydown: {titulo: "keydown y e.key", texto: 'Se dispara al presionar una tecla. e.key dice cuál fue. keypress está obsoleto.', codigo: "campo.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') { ... }\n});"},
	style: {titulo: 'style', texto: 'Cambia un estilo CSS desde JS. Las propiedades van en camelCase.', codigo: "panel.style.backgroundColor = 'gold';"},
	number: {titulo: 'Number()', texto: 'Convierte texto a número. "70" + "5" da "705"; Number("70") + 5 da 75.', codigo: 'const peso = Number(campo.value);'},
	createElement: {titulo: 'createElement + append', texto: 'Fabrica un elemento nuevo y lo mete al final, sin borrar lo anterior.', codigo: "const li = document.createElement('li');\nli.textContent = 'Agua';\nlista.append(li);"},
	innerHTML: {titulo: "innerHTML = ''", texto: 'Vacía un contenedor completo. Úsalo antes de volver a generar.', codigo: "tabla.innerHTML = '';"},
	classList: {titulo: 'classList', texto: 'Prende y apaga clases de CSS: add, remove, toggle.', codigo: "luz.classList.add('encendida');\nluz.classList.remove('encendida');"},
	querySelectorAll: {titulo: 'querySelectorAll + forEach', texto: 'Trae TODOS los elementos que coinciden; forEach los recorre.', codigo: "document.querySelectorAll('.luz')\n  .forEach((l) => l.classList.remove('on'));"},
	submit: {titulo: 'submit + preventDefault', texto: 'El form recarga la página al enviarse. e.preventDefault() lo frena para validar.', codigo: "form.addEventListener('submit', (e) => {\n  e.preventDefault();\n});"},
	includes: {titulo: 'includes()', texto: 'Revisa si un texto contiene otro.', codigo: "correo.value.includes('@')"},
};

// ── Preguntas (cofres y escudos de jefe). c = índice de la correcta. codigo opcional (sabotajes)
const PREGUNTAS = [
	// Cubierta 1
	{p: 0, q: '¿Qué propiedad lee lo que la persona escribió en un input?', o: ['value', 'textContent', 'innerText', 'src'], c: 0, e: 'value es lo que hay dentro del campo. textContent es el texto de elementos como <p> o <h1>.', b: 'value'},
	{p: 0, q: 'SABOTAJE: el saludo sale solo al cargar la página y el botón no hace nada. ¿Qué línea tiene el error?', codigo: ["function saludar() {", "  salida.textContent = 'Hola';", '}', "boton.addEventListener('click', saludar());"], o: ['Línea 1', 'Línea 2', 'Línea 4', 'Ninguna'], c: 2, e: 'saludar() con paréntesis la EJECUTA de una. Al listener se le pasa la función sin ejecutar: saludar.', b: 'addEventListener'},
	{p: 0, q: '¿Qué hace .trim()?', o: ['Quita los espacios del inicio y del final', 'Borra todo el texto', 'Convierte a número', 'Pone mayúsculas'], c: 0, e: 'Con trim, "   " se vuelve "" y puedes detectar que el campo está vacío.', b: 'trim'},
	{p: 0, q: 'Para cambiar el texto visible de un <p> usas…', o: ["p.textContent = '…'", "p.value = '…'", "p.src = '…'", 'p.click()'], c: 0, e: 'textContent reemplaza el texto que se ve. value es solo para campos de formulario.', b: 'textContent'},
	{p: 0, q: "¿Qué devuelve document.querySelector('#nada') si ese id no existe?", o: ['null', 'undefined', 'Un elemento vacío', '0'], c: 0, e: 'null. Por eso sale el error "Cannot read properties of null": el elemento no se encontró.', b: 'querySelector'},
	{p: 0, q: 'Un contador que va subiendo se declara con…', o: ['let', 'const', 'function', 'return'], c: 0, e: 'let, porque su valor cambia. const no se puede reasignar.', b: 'let'},
	{p: 0, q: 'SABOTAJE: el value siempre llega vacío. ¿Por qué?', codigo: ['const texto = campo.value;', '', "boton.addEventListener('click', () => {", '  salida.textContent = texto;', '});'], o: ['Lee el value al cargar, antes de que escriban', 'Falta trim()', 'Debe ser innerHTML', 'El botón está mal'], c: 0, e: 'La línea 1 corre cuando la página carga y el campo está vacío. Lee el value DENTRO del clic.', b: 'value'},
	// Cubierta 2
	{p: 1, q: '¿Qué evento se dispara con cada letra que escribes?', o: ['input', 'change', 'click', 'submit'], c: 0, e: 'input se dispara con cada letra que entra o sale. change solo cuando sales del campo.', b: 'input'},
	{p: 1, q: '¿Cuándo se dispara change en un <select>?', o: ['Al elegir otra opción', 'Con cada tecla', 'Al pasar el mouse', 'Nunca'], c: 0, e: 'En un select, change llega en cuanto eliges otra opción.', b: 'change'},
	{p: 1, q: '¿Cómo sabes qué tecla presionaron en un keydown?', o: ['e.key', 'e.value', 'e.tecla', 'e.target.key'], c: 0, e: 'El evento (e) trae e.key: "Enter", "a", "Escape"…', b: 'keydown'},
	{p: 1, q: '¿Por qué no usar keypress?', o: ['Está obsoleto', 'Es más rápido', 'Solo sirve en celular', 'Es igual a click'], c: 0, e: 'keypress está obsoleto. keydown es el evento confiable para detectar teclas.', b: 'keydown'},
	{p: 1, q: 'Para cambiar el fondo de un panel desde JS:', o: ["panel.style.backgroundColor = 'gold'", "panel.background = 'gold'", "panel.color('gold')", "panel.textContent = 'gold'"], c: 0, e: 'style + la propiedad CSS en camelCase: background-color → backgroundColor.', b: 'style'},
	{p: 1, q: 'Después de enviar con Enter, ¿cómo vacías el input?', o: ["input.value = ''", "input.textContent = ''", 'input.remove()', 'input.clear'], c: 0, e: 'value también sirve para ESCRIBIR en el campo, no solo para leerlo.', b: 'value'},
	{p: 1, q: 'SABOTAJE: nunca detecta el Enter. ¿Qué falla?', codigo: ["campo.addEventListener('keydown', () => {", "  if (e.key === 'Enter') {", '    enviar();', '  }', '});'], o: ['Falta recibir (e) como parámetro', "Debe ser 'enter' en minúscula", 'Falta preventDefault', 'keydown no existe'], c: 0, e: 'Sin (e) en la función, e no existe. Debe ser (e) => { … }.', b: 'keydown'},
	// Cubierta 3
	{p: 2, q: 'Para agregar un <li> SIN borrar los anteriores:', o: ['createElement + append', 'lista.textContent = li', 'lista.innerHTML = li', 'lista.value = li'], c: 0, e: 'createElement fabrica el elemento y append lo mete al final. Lo demás se conserva.', b: 'createElement'},
	{p: 2, q: "En JavaScript, '70' + '5' da…", o: ["'705'", '75', 'Error', "'75'"], c: 0, e: 'Dos textos con + se pegan. Convierte con Number() antes de sumar.', b: 'number'},
	{p: 2, q: '¿Qué hace e.preventDefault() en un submit?', o: ['Evita que la página se recargue', 'Envía el formulario', 'Borra los campos', 'Valida el correo'], c: 0, e: 'El form recarga la página por defecto. preventDefault lo frena para que puedas validar.', b: 'submit'},
	{p: 2, q: 'Para prender una clase CSS desde JS:', o: ["el.classList.add('activa')", "el.class = 'activa'", "el.style = 'activa'", "el.addClass('activa')"], c: 0, e: 'classList.add pone la clase; remove la quita; toggle la alterna.', b: 'classList'},
	{p: 2, q: "querySelectorAll('.luz') devuelve…", o: ['Todos los elementos con clase luz', 'Solo el primero', 'Un número', 'Un texto'], c: 0, e: 'Devuelve una lista con todos. Se recorre con forEach.', b: 'querySelectorAll'},
	{p: 2, q: 'Para vaciar un contenedor completo:', o: ["cont.innerHTML = ''", "cont.value = ''", 'cont.remove()', "cont = ''"], c: 0, e: "innerHTML = '' borra todo lo de adentro. remove() borraría el contenedor mismo.", b: 'innerHTML'},
	{p: 2, q: '¿Cuál revisa si el correo tiene arroba?', o: ["correo.value.includes('@')", "correo.includes('@')", "correo.value == '@'", "correo.has('@')"], c: 0, e: 'includes revisa si el TEXTO (el value) contiene la arroba.', b: 'includes'},
	{p: 2, q: 'SABOTAJE: el total nunca acumula. ¿Qué línea falla?', codigo: ["boton.addEventListener('click', () => {", '  let total = 0;', '  total += Number(valor.value);', '  pantalla.textContent = total;', '});'], o: ['Línea 2', 'Línea 3', 'Línea 4', 'Línea 1'], c: 0, e: 'let total = 0 está ADENTRO del clic: vuelve a 0 cada vez. Sácalo afuera.', b: 'let'},
];

// ── Retos de código reales. Las pruebas corren dentro de un iframe aislado.
//    Ayudas disponibles en las pruebas: $, ok(desc, cond), escribir(el, v), cambiar(el, v), tecla(el, k), enviar(form)
const RETOS = {
	saludo: {
		titulo: 'Identifica al piloto',
		b: ['addEventListener', 'value', 'textContent', 'trim'],
		enunciado: 'Al hacer clic en <b>#saludar</b>: si <b>#nombre</b> está vacío (o solo tiene espacios), <b>#salida</b> debe pedir el nombre. Si no, debe decir <b>¡Hola, NOMBRE!</b>',
		html: '<input id="nombre" placeholder="Tu nombre">\n<button id="saludar">Identificarse</button>\n<p id="salida"></p>',
		inicio: "// 1. QUIÉN: busca los elementos\nconst nombre = document.querySelector('#nombre');\n\n\n// 2. CUÁNDO: escucha el clic\n\n\n// 3. QUÉ CAMBIA: el textContent de #salida\n",
		pruebas: "const n=$('#nombre'),b=$('#saludar'),s=$('#salida');\nn.value='';b.click();ok('Vacío → pide el nombre', s.textContent.trim().length>0 && !s.textContent.includes('Hola'));\nn.value='Ana';b.click();ok('Con \"Ana\" → saluda a Ana', s.textContent.includes('Ana'));\nn.value='   ';b.click();ok('Solo espacios cuenta como vacío (usa trim)', !s.textContent.includes('Hola'));",
		pista: 'Lee nombre.value DENTRO del clic y usa .trim() para quitar los espacios antes de comparar con \'\'.',
		solucion: "const nombre = document.querySelector('#nombre');\nconst boton = document.querySelector('#saludar');\nconst salida = document.querySelector('#salida');\n\nboton.addEventListener('click', () => {\n  const texto = nombre.value.trim();\n  if (texto === '') {\n    salida.textContent = 'Primero dime tu nombre';\n  } else {\n    salida.textContent = `¡Hola, ${texto}!`;\n  }\n});",
	},
	contador: {
		titulo: 'Carga el reactor',
		b: ['addEventListener', 'let', 'textContent', 'style'],
		enunciado: '<b>#cargar</b> suma 1 al número de <b>#num</b>. <b>#purgar</b> lo vuelve a 0. Cuando llega a 10, ponle un color con <b>style.color</b>.',
		html: '<h1 id="num">0</h1>\n<button id="cargar">Cargar</button>\n<button id="purgar">Purgar</button>',
		inicio: "let carga = 0;\nconst num = document.querySelector('#num');\n\n",
		pruebas: "const c=$('#cargar'),p=$('#purgar'),n=$('#num');\nc.click();c.click();c.click();ok('3 clics → muestra 3', n.textContent.trim()==='3');\np.click();ok('Purgar → vuelve a 0', n.textContent.trim()==='0');\nfor(let i=0;i<10;i++)c.click();ok('A los 10 → muestra 10', n.textContent.trim()==='10');ok('A los 10 → cambia style.color', n.style.color!=='');",
		pista: 'Cambia la variable (carga++ o carga = 0) y DESPUÉS pinta: num.textContent = carga. Para el color: if (carga >= 10) num.style.color = "lime";',
		solucion: "let carga = 0;\nconst num = document.querySelector('#num');\n\nfunction pintar() {\n  num.textContent = carga;\n  num.style.color = carga >= 10 ? 'lime' : '';\n}\n\ndocument.querySelector('#cargar').addEventListener('click', () => {\n  carga++;\n  pintar();\n});\ndocument.querySelector('#purgar').addEventListener('click', () => {\n  carga = 0;\n  pintar();\n});",
	},
	espejo: {
		titulo: 'Transmisión en vivo',
		b: ['input', 'value', 'textContent'],
		enunciado: 'Lo que se escriba en <b>#mensaje</b> debe verse al instante en <b>#pantalla</b>, letra por letra, sin botón. Si borran, también se borra.',
		html: '<textarea id="mensaje" placeholder="Mensaje a la base"></textarea>\n<p id="pantalla"></p>',
		inicio: "const mensaje = document.querySelector('#mensaje');\nconst pantalla = document.querySelector('#pantalla');\n\n",
		pruebas: "const m=$('#mensaje'),p=$('#pantalla');\nescribir(m,'Hola base');ok('Escribe \"Hola base\" → se copia', p.textContent==='Hola base');\nescribir(m,'Hola');ok('Borra letras → también se borran', p.textContent==='Hola');",
		pista: "El mismo campo escucha: mensaje.addEventListener('input', () => { … }) y copia mensaje.value.",
		solucion: "const mensaje = document.querySelector('#mensaje');\nconst pantalla = document.querySelector('#pantalla');\n\nmensaje.addEventListener('input', () => {\n  pantalla.textContent = mensaje.value;\n});",
	},
	color: {
		titulo: 'Modo de alerta',
		b: ['change', 'style', 'value'],
		enunciado: 'Al elegir una opción en <b>#modo</b>, el fondo de <b>#panel</b> debe tomar el color guardado en el value de esa opción. El texto del panel no se toca.',
		html: '<div id="panel"><h2>PANEL</h2><p>Rumbo: Marte</p></div>\n<select id="modo">\n  <option value="">Elige</option>\n  <option value="steelblue">Calma</option>\n  <option value="gold">Alerta</option>\n  <option value="hotpink">Fiesta</option>\n</select>',
		inicio: "const modo = document.querySelector('#modo');\nconst panel = document.querySelector('#panel');\n\n",
		pruebas: "const m=$('#modo'),p=$('#panel');\ncambiar(m,'gold');ok('Elige Alerta → fondo gold', p.style.backgroundColor==='gold');\ncambiar(m,'hotpink');ok('Elige Fiesta → reemplaza por hotpink', p.style.backgroundColor==='hotpink');ok('El texto sigue igual', p.querySelector('h2') && p.querySelector('h2').textContent==='PANEL');",
		pista: "modo.addEventListener('change', …) y adentro: panel.style.backgroundColor = modo.value;",
		solucion: "const modo = document.querySelector('#modo');\nconst panel = document.querySelector('#panel');\n\nmodo.addEventListener('change', () => {\n  panel.style.backgroundColor = modo.value;\n});",
	},
	enter: {
		titulo: 'Consola de comandos',
		b: ['keydown', 'value', 'textContent'],
		enunciado: 'Cuando presionen <b>Enter</b> en <b>#comando</b>, <b>#registro</b> debe decir <b>Comando recibido: …</b> y el input debe quedar vacío. Otras teclas no hacen nada.',
		html: '<input id="comando" placeholder="Escribe un comando">\n<p id="registro"></p>',
		inicio: "const comando = document.querySelector('#comando');\nconst registro = document.querySelector('#registro');\n\n",
		pruebas: "const c=$('#comando'),r=$('#registro');\nc.value='Abrir';tecla(c,'a');ok('Otra tecla → no pasa nada', r.textContent==='');\ntecla(c,'Enter');ok('Enter → muestra el comando', r.textContent.includes('Abrir'));ok('Enter → vacía el input', c.value==='');",
		pista: "Recibe el evento: comando.addEventListener('keydown', (e) => { if (e.key === 'Enter') { … } })",
		solucion: "const comando = document.querySelector('#comando');\nconst registro = document.querySelector('#registro');\n\ncomando.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') {\n    registro.textContent = `Comando recibido: ${comando.value}`;\n    comando.value = '';\n  }\n});",
	},
	lista: {
		titulo: 'Carga la bodega',
		b: ['createElement', 'trim', 'value'],
		enunciado: 'Al hacer clic en <b>#agregar</b>, lo escrito en <b>#item</b> se agrega como un <b>&lt;li&gt;</b> nuevo al final de <b>#bodega</b> y el input queda vacío. Si está vacío, no agregues nada y escribe un aviso en <b>#aviso</b>.',
		html: '<input id="item" placeholder="Suministro">\n<button id="agregar">Agregar</button>\n<p id="aviso"></p>\n<ul id="bodega"></ul>',
		inicio: "const item = document.querySelector('#item');\nconst bodega = document.querySelector('#bodega');\n\n",
		pruebas: "const i=$('#item'),b=$('#agregar'),u=$('#bodega'),a=$('#aviso');\ni.value='Oxígeno';b.click();ok('Agrega \"Oxígeno\" como <li>', u.querySelectorAll('li').length===1 && u.textContent.includes('Oxígeno'));ok('El input queda vacío', i.value==='');\ni.value='Agua';b.click();ok('El segundo NO reemplaza al primero', u.querySelectorAll('li').length===2 && u.querySelector('li').textContent.includes('Oxígeno'));\ni.value='  ';b.click();ok('Vacío → no agrega', u.querySelectorAll('li').length===2);ok('Vacío → muestra aviso', a.textContent.trim().length>0);",
		pista: "Adentro del clic: const li = document.createElement('li'); li.textContent = texto; bodega.append(li);",
		solucion: "const item = document.querySelector('#item');\nconst bodega = document.querySelector('#bodega');\nconst aviso = document.querySelector('#aviso');\n\ndocument.querySelector('#agregar').addEventListener('click', () => {\n  const texto = item.value.trim();\n  if (texto === '') {\n    aviso.textContent = 'Escribe un suministro';\n    return;\n  }\n  aviso.textContent = '';\n  const li = document.createElement('li');\n  li.textContent = texto;\n  bodega.append(li);\n  item.value = '';\n});",
	},
	luces: {
		titulo: 'Torre de despegue',
		b: ['classList', 'querySelectorAll', 'textContent'],
		enunciado: 'Tres luces <b>.luz</b> (#roja, #amarilla, #verde) y tres botones. Al pulsar uno, SOLO su luz debe tener la clase <b>encendida</b>, y <b>#estado</b> muestra un mensaje.',
		html: '<div class="luz" id="roja"></div>\n<div class="luz" id="amarilla"></div>\n<div class="luz" id="verde"></div>\n<button id="b-roja">Rojo</button>\n<button id="b-amarilla">Amarillo</button>\n<button id="b-verde">Verde</button>\n<p id="estado"></p>',
		css: '.luz{width:40px;height:40px;border-radius:50%;background:#333;display:inline-block;margin:4px}.luz.encendida{background:lime;box-shadow:0 0 20px lime}#roja.encendida{background:red;box-shadow:0 0 20px red}#amarilla.encendida{background:gold;box-shadow:0 0 20px gold}',
		inicio: "const luces = document.querySelectorAll('.luz');\nconst estado = document.querySelector('#estado');\n\n",
		pruebas: "const L=()=>[...document.querySelectorAll('.luz')].filter(x=>x.classList.contains('encendida')).map(x=>x.id);\n$('#b-verde').click();ok('Verde → solo la verde encendida', L().join()==='verde');\n$('#b-roja').click();ok('Rojo → la verde se apaga, solo la roja', L().join()==='roja');ok('#estado muestra un mensaje', $('#estado').textContent.trim().length>0);",
		pista: "Primero apaga TODAS: luces.forEach((l) => l.classList.remove('encendida')); después prende la que toca con classList.add.",
		solucion: "const luces = document.querySelectorAll('.luz');\nconst estado = document.querySelector('#estado');\n\nfunction activar(id, mensaje) {\n  luces.forEach((l) => l.classList.remove('encendida'));\n  document.querySelector('#' + id).classList.add('encendida');\n  estado.textContent = mensaje;\n}\n\ndocument.querySelector('#b-roja').addEventListener('click', () => activar('roja', 'Alto'));\ndocument.querySelector('#b-amarilla').addEventListener('click', () => activar('amarilla', 'Precaución'));\ndocument.querySelector('#b-verde').addEventListener('click', () => activar('verde', 'Despega'));",
	},
	registro: {
		titulo: 'Registro de tripulación',
		b: ['submit', 'includes', 'number'],
		enunciado: 'Al enviar <b>#form</b> la página NO debe recargarse. Si <b>#correo</b> no tiene @, escribe un error en <b>#err-correo</b>. Si <b>#edad</b> es menor de 18, error en <b>#err-edad</b>. Si todo está bien, borra los errores y escribe en <b>#exito</b>.',
		html: '<form id="form">\n  <input id="correo" placeholder="correo">\n  <p id="err-correo"></p>\n  <input id="edad" type="number" placeholder="edad">\n  <p id="err-edad"></p>\n  <button>Registrarme</button>\n</form>\n<p id="exito"></p>',
		inicio: "const form = document.querySelector('#form');\n\n",
		pruebas: "const f=$('#form'),c=$('#correo'),e=$('#edad'),ec=$('#err-correo'),ee=$('#err-edad'),x=$('#exito');\nc.value='anamail.com';e.value='20';ok('No recarga la página (preventDefault)', enviar(f));ok('Correo sin @ → error en #err-correo', ec.textContent.trim().length>0);\nc.value='ana@mail.com';e.value='16';enviar(f);ok('Edad 16 → error en #err-edad', ee.textContent.trim().length>0);ok('Correo bueno → su error se borra', ec.textContent.trim()==='');\ne.value='19';enviar(f);ok('Todo bien → mensaje de éxito', x.textContent.trim().length>0 && ee.textContent.trim()==='');",
		pista: "form.addEventListener('submit', (e) => { e.preventDefault(); … }). Borra los errores al inicio y usa una bandera let valido = true.",
		solucion: "const form = document.querySelector('#form');\nconst correo = document.querySelector('#correo');\nconst edad = document.querySelector('#edad');\nconst errCorreo = document.querySelector('#err-correo');\nconst errEdad = document.querySelector('#err-edad');\nconst exito = document.querySelector('#exito');\n\nform.addEventListener('submit', (e) => {\n  e.preventDefault();\n  let valido = true;\n  errCorreo.textContent = '';\n  errEdad.textContent = '';\n  exito.textContent = '';\n\n  if (!correo.value.includes('@')) {\n    errCorreo.textContent = 'Escribe un correo válido';\n    valido = false;\n  }\n  if (Number(edad.value) < 18) {\n    errEdad.textContent = 'Debes tener 18 o más';\n    valido = false;\n  }\n  if (valido) exito.textContent = 'Registro completado';\n});",
	},
};

const ARMAS = {
	click: {nombre: 'Pistola Click', evento: 'click', costo: 0, cad: 0.26, vel: 330, dmg: 10, n: 1, disp: 0.05, color: '#C6FF3D', r: 2.5, desc: 'Un disparo por clic. Confiable.'},
	input: {nombre: 'Láser Input', evento: 'input', costo: 1, cad: 0.075, vel: 460, dmg: 5, n: 1, disp: 0.09, color: '#36E2FF', r: 2, desc: 'Dispara con cada letra… digo, cada frame.'},
	keydown: {nombre: 'Escopeta Keydown', evento: 'keydown', costo: 4, cad: 0.62, vel: 300, dmg: 8, n: 6, disp: 0.5, color: '#FFB224', r: 2.5, desc: 'Una ráfaga por tecla presionada.'},
	submit: {nombre: 'Cañón Submit', evento: 'submit', costo: 8, cad: 0.95, vel: 210, dmg: 45, n: 1, disp: 0, color: '#FF5FD2', r: 5, explota: true, desc: 'Lo envía todo. Explota al impactar.'},
};
const ORDEN_ARMAS = ['input', 'keydown', 'submit'];
