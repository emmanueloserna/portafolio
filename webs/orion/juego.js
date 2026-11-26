// ════════════════════════════════════════════════════════════════
//  ORIÓN: CAZA DE BUGS — motor del juego
// ════════════════════════════════════════════════════════════════
'use strict';

const W = 640, H = 416, T = 32, CW = 20, CH = 13;
const cv = document.getElementById('juego');
const ctx = cv.getContext('2d');
cv.width = W;
cv.height = H;
const luzCv = document.createElement('canvas');
luzCv.width = W;
luzCv.height = H;
const lctx = luzCv.getContext('2d');
const $ = (s) => document.querySelector(s);
const azar = (a, b) => a + Math.random() * (b - a);
const entero = (a, b) => Math.floor(azar(a, b + 1));
const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const guardar = (k, v) => {
	try {
		localStorage.setItem(k, JSON.stringify(v));
	} catch (e) {}
};
const leer = (k, d) => {
	try {
		const v = JSON.parse(localStorage.getItem(k));
		return v ?? d;
	} catch (e) {
		return d;
	}
};

prepararSprites();

// ─────────────────────────── ESCALA ───────────────────────────
function ajustar() {
	let f = Math.min(innerWidth / W, innerHeight / H);
	if (f >= 2) f = Math.floor(f);
	cv.style.width = W * f + 'px';
	cv.style.height = H * f + 'px';
	$('#marco').style.width = W * f + 'px';
	$('#marco').style.height = H * f + 'px';
}
addEventListener('resize', ajustar);
addEventListener('pagehide', () => G.estado !== 'inicio' && G.estado !== 'fin' && G.stats && guardarPartida());
ajustar();

// ─────────────────────────── PALETAS DE CUBIERTA ───────────────────────────
const PAL = [
	{suelo: ['#0c1222', '#111a30', '#18233f'], linea: '#070b16', pared: ['#121a33', '#1d2850', '#2c3b70', '#3c4f92'], neon: '#36E2FF', acento: '#FFB224', sombra: 'rgba(2,4,12,0.62)'},
	{suelo: ['#120c22', '#18112e', '#21183e'], linea: '#08060f', pared: ['#1a1233', '#2a1d52', '#3b2a72', '#523b98'], neon: '#FF5FD2', acento: '#A07CFF', sombra: 'rgba(6,2,12,0.62)'},
	{suelo: ['#1b0e0a', '#24130e', '#301a12'], linea: '#0e0604', pared: ['#2a120d', '#3e1c14', '#5a2a1c', '#7a3a26'], neon: '#FFB224', acento: '#FF4D5E', sombra: 'rgba(10,3,2,0.6)'},
];

// ─────────────────────────── BRILLOS (cache) ───────────────────────────
const cacheBrillo = {};
function brillo(color) {
	if (cacheBrillo[color]) return cacheBrillo[color];
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const g = c.getContext('2d');
	const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	gr.addColorStop(0, color);
	gr.addColorStop(0.35, color + '88');
	gr.addColorStop(1, color + '00');
	g.fillStyle = gr;
	g.fillRect(0, 0, 64, 64);
	return (cacheBrillo[color] = c);
}
const agujero = (() => {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	gr.addColorStop(0, 'rgba(0,0,0,1)');
	gr.addColorStop(0.55, 'rgba(0,0,0,0.75)');
	gr.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = gr;
	g.fillRect(0, 0, 128, 128);
	return c;
})();

// ─────────────────────────── AUDIO ───────────────────────────
const A = {ctx: null, maestro: null, musica: null, musicaOn: leer('orion-musica', true), paso: 0, tema: 0, jefe: false, sig: 0};
function iniciarAudio() {
	if (A.ctx) return;
	try {
		A.ctx = new (window.AudioContext || window.webkitAudioContext)();
		A.maestro = A.ctx.createGain();
		A.maestro.gain.value = 0.5;
		A.maestro.connect(A.ctx.destination);
		A.musica = A.ctx.createGain();
		A.musica.gain.value = A.musicaOn ? 0.16 : 0;
		A.musica.connect(A.maestro);
		const ruido = A.ctx.createBuffer(1, A.ctx.sampleRate * 0.6, A.ctx.sampleRate);
		const d = ruido.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
		A.ruido = ruido;
		A.sig = A.ctx.currentTime + 0.1;
		setInterval(programarMusica, 60);
	} catch (e) {}
}
function sonido(f, dur, tipo = 'square', vol = 0.15, f2 = null, destino = null, cuando = 0) {
	if (!A.ctx) return;
	const t = A.ctx.currentTime + cuando;
	const o = A.ctx.createOscillator();
	const g = A.ctx.createGain();
	o.type = tipo;
	o.frequency.setValueAtTime(f, t);
	if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
	g.gain.setValueAtTime(vol, t);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	o.connect(g).connect(destino || A.maestro);
	o.start(t);
	o.stop(t + dur + 0.02);
}
function ruido(dur, vol = 0.3, corte = 1200) {
	if (!A.ctx) return;
	const s = A.ctx.createBufferSource();
	s.buffer = A.ruido;
	const fl = A.ctx.createBiquadFilter();
	fl.type = 'lowpass';
	fl.frequency.value = corte;
	const g = A.ctx.createGain();
	const t = A.ctx.currentTime;
	g.gain.setValueAtTime(vol, t);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	s.connect(fl).connect(g).connect(A.maestro);
	s.start(t);
	s.stop(t + dur);
}
const SFX = {
	disparo: (id) => {
		if (id === 'input') sonido(1400, 0.05, 'square', 0.04, 900);
		else if (id === 'keydown') (ruido(0.18, 0.25, 2400), sonido(220, 0.15, 'square', 0.08, 90));
		else if (id === 'submit') sonido(160, 0.35, 'sawtooth', 0.14, 60);
		else sonido(880, 0.08, 'square', 0.07, 420);
	},
	golpe: () => sonido(300, 0.06, 'square', 0.05, 160),
	muerte: () => (ruido(0.25, 0.18, 1800), sonido(500, 0.2, 'square', 0.07, 80)),
	explosion: () => (ruido(0.6, 0.5, 700), sonido(120, 0.5, 'sine', 0.3, 30)),
	dano: () => (sonido(200, 0.25, 'sawtooth', 0.15, 60), ruido(0.15, 0.2, 900)),
	escudo: () => sonido(900, 0.12, 'triangle', 0.1, 1600),
	recoger: () => (sonido(1200, 0.06, 'square', 0.05), sonido(1800, 0.08, 'square', 0.05, null, null, 0.05)),
	dash: () => (ruido(0.15, 0.15, 3000), sonido(400, 0.12, 'sine', 0.06, 900)),
	puerta: () => (sonido(200, 0.18, 'square', 0.08, 400), sonido(600, 0.2, 'square', 0.06, null, null, 0.1)),
	cerrar: () => sonido(500, 0.25, 'square', 0.08, 120),
	bien: () => [523, 659, 784, 1046].forEach((f, i) => sonido(f, 0.18, 'square', 0.07, null, null, i * 0.08)),
	mal: () => (sonido(300, 0.2, 'square', 0.08, 200), sonido(200, 0.3, 'square', 0.08, 120, null, 0.15)),
	texto: () => sonido(entero(600, 760), 0.03, 'square', 0.02),
	alerta: () => [0, 0.18, 0.36].forEach((d) => sonido(880, 0.12, 'square', 0.08, 660, null, d)),
	cofre: () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => sonido(f, 0.2, 'triangle', 0.08, null, null, i * 0.06)),
	portal: () => sonido(200, 1.2, 'sine', 0.18, 1400),
};
// Música procedural: bajo + arpegio en menor, más rápida en los jefes
const ESCALAS = [
	[57, 60, 64, 67, 69, 72],
	[53, 56, 60, 63, 65, 68],
	[52, 55, 59, 62, 64, 67],
];
const BAJOS = [
	[45, 45, 41, 43],
	[41, 41, 44, 39],
	[40, 40, 43, 38],
];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
function programarMusica() {
	if (!A.ctx || !A.musicaOn) return;
	const bpm = A.jefe ? 150 : 112;
	const semi = 60 / bpm / 4;
	while (A.sig < A.ctx.currentTime + 0.25) {
		const p = A.paso;
		const cuando = A.sig - A.ctx.currentTime;
		const esc = ESCALAS[A.tema];
		const bajo = BAJOS[A.tema][Math.floor(p / 16) % 4];
		if (p % 4 === 0) sonido(midi(bajo - 12), semi * 3, 'triangle', 0.5, null, A.musica, cuando);
		if (A.jefe && p % 4 === 2) sonido(midi(bajo - 12), semi, 'triangle', 0.35, null, A.musica, cuando);
		const patron = [0, 2, 4, 2, 5, 4, 2, 1];
		if (p % 2 === 0 || A.jefe) sonido(midi(esc[patron[p % 8] % esc.length] + (Math.floor(p / 32) % 2 ? 12 : 0)), semi * 0.9, 'square', 0.12, null, A.musica, cuando);
		if (A.jefe && p % 8 === 4) {
			const s = A.ctx.createBufferSource();
			s.buffer = A.ruido;
			const g = A.ctx.createGain();
			g.gain.setValueAtTime(0.25, A.sig);
			g.gain.exponentialRampToValueAtTime(0.001, A.sig + 0.08);
			s.connect(g).connect(A.musica);
			s.start(A.sig);
			s.stop(A.sig + 0.1);
		}
		A.paso++;
		A.sig += semi;
	}
}
function alternarMusica() {
	A.musicaOn = !A.musicaOn;
	guardar('orion-musica', A.musicaOn);
	if (A.musica) A.musica.gain.value = A.musicaOn ? 0.16 : 0;
	if (A.ctx) A.sig = A.ctx.currentTime + 0.05;
	$('#pMusica').textContent = '♪ MÚSICA: ' + (A.musicaOn ? 'SÍ' : 'NO');
	aviso(A.musicaOn ? '♪ Música encendida' : '♪ Música apagada', 'cian');
}

// ─────────────────────────── ESTADO ───────────────────────────
const G = {
	estado: 'inicio',
	t: 0,
	piso: 0,
	salas: new Map(),
	sala: null,
	j: null,
	enemigos: [],
	balas: [],
	part: [],
	textos: [],
	recogibles: [],
	barriles: [],
	temblor: 0,
	congelar: 0,
	transicion: null,
	bitacora: new Set(leer('orion-bitacora', [])),
	codigos: leer('orion-codigos', {}),
	usadas: new Set(),
	stats: null,
	telegrafos: [],
	camaraLenta: 0,
	semilla: 1,
};
const teclas = {};
const raton = {x: W / 2, y: H / 2, abajo: false};
const tactil = {activo: false, mx: 0, my: 0, disparo: false};

function nuevasStats() {
	return {inicio: performance.now(), bugs: 0, preguntas: 0, aciertos: 0, retos: 0, sinSolucion: 0, bytes: 0, golpes: 0, muertes: 0};
}

// ─────────────────────────── GENERACIÓN ───────────────────────────
const DIRS = {n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0]};
const OPUESTA = {n: 's', s: 'n', e: 'o', o: 'e'};
const clave = (x, y) => x + ',' + y;

function generarCubierta() {
	const tipos = ['inicio', 'combate', 'cofre', 'combate', 'terminal', 'jefe'];
	const libre = (salas, x, y) => x >= 0 && y >= 0 && x < 7 && y < 7 && !salas.has(clave(x, y));
	for (let intento = 0; intento < 300; intento++) {
		const salas = new Map();
		let x = 3,
			y = 3,
			previa = null,
			dPrevia = null,
			ok = true;
		for (let i = 0; i < tipos.length; i++) {
			const s = crearSala(x, y, tipos[i]);
			salas.set(clave(x, y), s);
			if (previa) {
				previa.puertas[dPrevia] = true;
				s.puertas[OPUESTA[dPrevia]] = true;
			}
			if (i === tipos.length - 1) break;
			const opciones = Object.entries(DIRS).filter(([, [dx, dy]]) => libre(salas, x + dx, y + dy));
			if (!opciones.length) {
				ok = false;
				break;
			}
			const [d, [dx, dy]] = elegir(opciones);
			previa = s;
			dPrevia = d;
			x += dx;
			y += dy;
		}
		if (!ok) continue;
		// rama extra: sala de combate con cofre de premio, lejos del jefe
		const medias = [...salas.values()].filter((s) => s.tipo === 'combate' || s.tipo === 'cofre').sort(() => Math.random() - 0.5);
		for (const m of medias) {
			const opciones = Object.entries(DIRS).filter(([, [dx, dy]]) => {
				const nx = m.gx + dx,
					ny = m.gy + dy;
				return libre(salas, nx, ny) && !Object.values(DIRS).some(([a, b]) => salas.get(clave(nx + a, ny + b))?.tipo === 'jefe');
			});
			if (opciones.length) {
				const [d, [dx, dy]] = elegir(opciones);
				const extra = crearSala(m.gx + dx, m.gy + dy, 'premio');
				m.puertas[d] = true;
				extra.puertas[OPUESTA[d]] = true;
				salas.set(clave(extra.gx, extra.gy), extra);
				break;
			}
		}
		return salas;
	}
	throw new Error('No se pudo generar la cubierta');
}

function crearSala(gx, gy, tipo) {
	return {gx, gy, tipo, puertas: {n: false, s: false, e: false, o: false}, estado: tipo === 'combate' || tipo === 'premio' ? 'nueva' : tipo === 'jefe' ? 'jefe' : 'limpia', visitada: false, grid: null, fondo: null, decor: [], brillos: [], oleada: 0, cofre: null, terminal: null, portal: null, sellada: null, barriles: []};
}

const PLANTILLAS = [
	[[4, 3], [15, 3], [4, 9], [15, 9]],
	[[5, 3], [6, 3], [7, 3], [12, 3], [13, 3], [14, 3], [5, 9], [6, 9], [7, 9], [12, 9], [13, 9], [14, 9]],
	[[6, 4], [7, 4], [12, 4], [13, 4], [6, 8], [7, 8], [12, 8], [13, 8], [4, 6], [15, 6]],
	[[3, 3], [3, 4], [16, 3], [16, 4], [3, 8], [3, 9], [16, 8], [16, 9], [8, 3], [11, 9]],
	[[5, 5], [5, 7], [14, 5], [14, 7], [9, 3], [10, 3], [9, 9], [10, 9]],
	[],
];

function prepararSala(s) {
	if (s.grid) return;
	const g = [];
	for (let y = 0; y < CH; y++) {
		g.push([]);
		for (let x = 0; x < CW; x++) g[y].push(x === 0 || y === 0 || x === CW - 1 || y === CH - 1 ? 1 : 0);
	}
	if (s.puertas.n) g[0][9] = g[0][10] = 0;
	if (s.puertas.s) g[CH - 1][9] = g[CH - 1][10] = 0;
	if (s.puertas.o) g[5][0] = g[6][0] = g[7][0] = 0;
	if (s.puertas.e) g[5][CW - 1] = g[6][CW - 1] = g[7][CW - 1] = 0;
	let obst = [];
	if (s.tipo === 'combate' || s.tipo === 'premio') obst = elegir(PLANTILLAS);
	else if (s.tipo === 'jefe') obst = [[3, 3], [16, 3], [3, 9], [16, 9]];
	else obst = [[2, 2], [17, 2], [2, 10], [17, 10]];
	obst.forEach(([x, y]) => (g[y][x] = 2));
	s.grid = g;
	// barriles explosivos
	if ((s.tipo === 'combate' || s.tipo === 'premio') && (G.piso === 2 || Math.random() < 0.5)) {
		const n = G.piso === 2 ? entero(3, 4) : entero(1, 2);
		for (let k = 0; k < n; k++) {
			const p = puntoLibre(s, 60);
			if (p) s.barriles.push({x: p.x, y: p.y, vida: 18, r: 9, flash: 0});
		}
	}
	// interactuables
	const cx = W / 2,
		cy = H / 2 + 6;
	if (s.tipo === 'cofre') s.cofre = {x: cx, y: cy, abierto: false, t: 0};
	if (s.tipo === 'terminal') s.terminal = {x: cx, y: cy - 10, resuelto: !!G.terminalHecha, reto: elegir(CUBIERTAS[G.piso].retos)};
	if (s.tipo === 'inicio') s.ori = {x: cx + 70, y: cy - 30};
	if (s.tipo === 'terminal') {
		const dJefe = Object.keys(s.puertas).find((d) => {
			const [dx, dy] = DIRS[d];
			return G.salas.get(clave(s.gx + dx, s.gy + dy))?.tipo === 'jefe';
		});
		s.sellada = G.terminalHecha ? null : dJefe || null;
	}
	pintarFondo(s);
}

function puntoLibre(s, lejosDe = 0, ref = null) {
	for (let k = 0; k < 80; k++) {
		const tx = entero(2, CW - 3),
			ty = entero(2, CH - 3);
		if (s.grid[ty][tx] !== 0) continue;
		if ((tx === 9 || tx === 10) && (ty < 3 || ty > CH - 4)) continue;
		if (ty >= 5 && ty <= 7 && (tx < 3 || tx > CW - 4)) continue;
		const p = {x: tx * T + T / 2, y: ty * T + T / 2};
		if (ref && dist(p, ref) < lejosDe) continue;
		if (s.barriles.some((b) => dist(b, p) < 30)) continue;
		return p;
	}
	return null;
}

// ─────────────────────────── PAISAJES (fondo prerenderizado) ───────────────────────────
function hash(x, y, k = 0) {
	let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k + G.semilla, 1442695041)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}
function pintarFondo(s) {
	const c = document.createElement('canvas');
	c.width = W;
	c.height = H;
	const g = c.getContext('2d');
	const P = PAL[G.piso];
	s.decor = [];
	s.brillos = [];
	const esSuelo = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && s.grid[y][x] !== 1;
	// suelo
	for (let y = 0; y < CH; y++) {
		for (let x = 0; x < CW; x++) {
			if (s.grid[y][x] === 1) continue;
			const px = x * T,
				py = y * T,
				h = hash(x, y, G.piso);
			g.fillStyle = P.suelo[1];
			g.fillRect(px, py, T, T);
			if (G.piso === 0) {
				// placas de acero, rejillas con luz cian por debajo
				g.fillStyle = P.suelo[2];
				g.fillRect(px, py, T, 1);
				g.fillRect(px, py, 1, T);
				g.fillStyle = P.linea;
				g.fillRect(px, py + T - 1, T, 1);
				g.fillRect(px + T - 1, py, 1, T);
				if (h < 0.1) {
					g.fillStyle = '#05080f';
					g.fillRect(px + 4, py + 4, T - 8, T - 8);
					for (let k = 0; k < 5; k++) {
						g.fillStyle = 'rgba(54,226,255,0.35)';
						g.fillRect(px + 6, py + 7 + k * 4, T - 12, 1);
					}
					s.brillos.push({x: px + T / 2, y: py + T / 2, r: 26, color: '#36E2FF', fase: h * 10});
				} else {
					g.fillStyle = P.suelo[2];
					[[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]].forEach(([a, b]) => g.fillRect(px + a, py + b, 2, 2));
					if (h > 0.9) {
						g.fillStyle = 'rgba(0,0,0,0.25)';
						g.fillRect(px + 8, py + 12, 12, 3);
					}
				}
			} else if (G.piso === 1) {
				// vidrio oscuro con circuitos que laten
				g.fillStyle = P.suelo[0];
				g.fillRect(px + 1, py + 1, T - 2, T - 2);
				g.fillStyle = 'rgba(255,255,255,0.03)';
				for (let k = 0; k < 8; k++) g.fillRect(px + 2 + k, py + 2 + k * 2, 8 - k, 1);
				g.strokeStyle = 'rgba(255,95,210,0.28)';
				g.lineWidth = 1;
				g.beginPath();
				if (h < 0.5) {
					g.moveTo(px, py + 16.5);
					g.lineTo(px + 10, py + 16.5);
					g.lineTo(px + 16, py + 10.5);
					g.lineTo(px + T, py + 10.5);
				} else {
					g.moveTo(px + 16.5, py);
					g.lineTo(px + 16.5, py + 12);
					g.lineTo(px + 22, py + 18);
					g.lineTo(px + 22, py + T);
				}
				g.stroke();
				g.fillStyle = '#FF5FD2';
				g.fillRect(px + (h < 0.5 ? 9 : 15), py + (h < 0.5 ? 15 : 11), 3, 3);
				if (h > 0.82) s.brillos.push({x: px + 16, y: py + 16, r: 20, color: '#FF5FD2', fase: h * 10});
			} else {
				// placas calientes con grietas de lava
				g.fillStyle = P.suelo[2];
				g.fillRect(px, py, T, 2);
				g.fillStyle = P.linea;
				g.fillRect(px, py + T - 2, T, 2);
				g.fillRect(px + T - 1, py, 1, T);
				if (h < 0.22) {
					g.strokeStyle = '#ff7a1a';
					g.lineWidth = 1;
					g.beginPath();
					let gx = px + 4 + h * 40,
						gy = py + 2;
					g.moveTo(gx, gy);
					for (let k = 0; k < 5; k++) {
						gx += azar(-5, 5);
						gy += 6;
						g.lineTo(limitar(gx, px + 2, px + T - 2), Math.min(gy, py + T - 2));
					}
					g.stroke();
					s.brillos.push({x: px + T / 2, y: py + T / 2, r: 30, color: '#FF7A1A', fase: h * 10});
				} else if (h > 0.88) {
					g.fillStyle = '#0e0604';
					g.beginPath();
					g.arc(px + 16, py + 16, 9, 0, Math.PI * 2);
					g.fill();
					g.strokeStyle = P.suelo[2];
					for (let k = -6; k <= 6; k += 3) {
						g.beginPath();
						g.moveTo(px + 16 + k, py + 9);
						g.lineTo(px + 16 + k, py + 23);
						g.stroke();
					}
					s.decor.push({tipo: 'vapor', x: px + 16, y: py + 16, t: h * 3});
				}
			}
		}
	}
	// franjas de peligro junto a las puertas
	const franja = (x, y, w, h) => {
		const horizontal = w > h;
		const largo = horizontal ? w : h;
		for (let k = 0; k < largo; k += 4) {
			g.fillStyle = (k / 4) % 2 ? 'rgba(10,10,10,0.6)' : 'rgba(255,178,36,0.6)';
			if (horizontal) g.fillRect(x + k, y, 4, h);
			else g.fillRect(x, y + k, w, 4);
		}
	};
	g.save();
	g.beginPath();
	g.rect(T, T, W - 2 * T, H - 2 * T);
	g.clip();
	if (s.puertas.n) franja(9 * T, T, 2 * T, 6);
	if (s.puertas.s) franja(9 * T, H - T - 6, 2 * T, 6);
	if (s.puertas.o) franja(T, 5 * T, 6, 3 * T);
	if (s.puertas.e) franja(W - T - 6, 5 * T, 6, 3 * T);
	g.restore();
	// emblemas en el piso
	const cx = W / 2,
		cy = H / 2 + 6;
	if (s.tipo === 'jefe' || s.tipo === 'terminal' || s.tipo === 'inicio') {
		g.strokeStyle = s.tipo === 'jefe' ? 'rgba(255,77,94,0.35)' : P.neon + '55';
		g.lineWidth = 2;
		g.beginPath();
		g.arc(cx, cy, s.tipo === 'jefe' ? 110 : 60, 0, Math.PI * 2);
		g.stroke();
		g.beginPath();
		g.arc(cx, cy, s.tipo === 'jefe' ? 80 : 44, 0, Math.PI * 2);
		g.stroke();
		for (let k = 0; k < 12; k++) {
			const a = (k / 12) * Math.PI * 2;
			const r0 = s.tipo === 'jefe' ? 80 : 44,
				r1 = s.tipo === 'jefe' ? 110 : 60;
			g.beginPath();
			g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
			g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
			g.stroke();
		}
	}
	// paredes
	for (let y = 0; y < CH; y++) {
		for (let x = 0; x < CW; x++) {
			if (s.grid[y][x] !== 1) continue;
			const px = x * T,
				py = y * T;
			g.fillStyle = P.pared[0];
			g.fillRect(px, py, T, T);
			if (esSuelo(x, y + 1)) {
				// cara frontal: tapa + panel
				g.fillStyle = P.pared[3];
				g.fillRect(px, py, T, 6);
				g.fillStyle = P.pared[2];
				g.fillRect(px, py + 6, T, 3);
				g.fillStyle = P.pared[1];
				g.fillRect(px, py + 9, T, T - 9);
				g.fillStyle = P.pared[0];
				g.fillRect(px + 3, py + 12, T - 6, T - 15);
				g.fillStyle = P.pared[2];
				g.fillRect(px + 3, py + 12, T - 6, 1);
				g.fillStyle = P.neon;
				g.globalAlpha = 0.7;
				g.fillRect(px, py + T - 2, T, 2);
				g.globalAlpha = 1;
				const h = hash(x, y, 9 + G.piso);
				if (y === 0 && x > 1 && x < CW - 2 && !(x === 8 || x === 11)) {
					if (h < 0.28) s.decor.push({tipo: 'pantalla', x: px + 4, y: py + 12, w: T - 8, h: T - 16, fase: h * 20});
					else if (h < 0.5) {
						s.decor.push({tipo: 'luz', x: px + T / 2, y: py + 8, fase: h * 20});
					} else if (h < 0.62) s.decor.push({tipo: 'ventila', x: px + T / 2, y: py + 20, t: h * 3});
				}
				// tubos en la sala de máquinas
				if (G.piso === 0 && y === 0) {
					g.fillStyle = '#2c3b70';
					g.fillRect(px, py + 2, T, 3);
					g.fillStyle = '#4c63b0';
					g.fillRect(px, py + 2, T, 1);
				}
			} else {
				g.fillStyle = P.pared[1];
				g.fillRect(px + 2, py + 2, T - 4, T - 4);
				g.fillStyle = P.pared[0];
				g.fillRect(px + 6, py + 6, T - 12, T - 12);
				// bordes neón donde la pared toca el suelo
				g.fillStyle = P.neon;
				g.globalAlpha = 0.55;
				if (esSuelo(x + 1, y)) g.fillRect(px + T - 2, py, 2, T);
				if (esSuelo(x - 1, y)) g.fillRect(px, py, 2, T);
				if (esSuelo(x, y - 1)) g.fillRect(px, py, T, 2);
				g.globalAlpha = 1;
			}
		}
	}
	// obstáculos según la cubierta
	for (let y = 0; y < CH; y++) {
		for (let x = 0; x < CW; x++) {
			if (s.grid[y][x] !== 2) continue;
			const px = x * T,
				py = y * T;
			g.fillStyle = 'rgba(0,0,0,0.45)';
			g.fillRect(px + 3, py + 8, T - 2, T - 4);
			if (G.piso === 0) {
				g.fillStyle = '#3a4a78';
				g.fillRect(px + 1, py - 4, T - 2, T);
				g.fillStyle = '#56689e';
				g.fillRect(px + 1, py - 4, T - 2, 6);
				g.fillStyle = '#26325a';
				g.fillRect(px + 1, py + T - 6, T - 2, 2);
				g.strokeStyle = '#26325a';
				g.lineWidth = 2;
				g.beginPath();
				g.moveTo(px + 4, py + 4);
				g.lineTo(px + T - 4, py + T - 7);
				g.moveTo(px + T - 4, py + 4);
				g.lineTo(px + 4, py + T - 7);
				g.stroke();
				g.fillStyle = '#36E2FF';
				g.fillRect(px + 3, py - 1, T - 6, 1);
			} else if (G.piso === 1) {
				g.fillStyle = '#1b1530';
				g.fillRect(px + 2, py - 14, T - 4, T + 10);
				g.fillStyle = '#2f2552';
				g.fillRect(px + 2, py - 14, T - 4, 4);
				for (let k = 0; k < 5; k++) {
					g.fillStyle = '#0c0818';
					g.fillRect(px + 5, py - 8 + k * 6, T - 10, 4);
					s.decor.push({tipo: 'led', x: px + 7 + (k % 2) * 12, y: py - 7 + k * 6, fase: hash(x, y, k) * 20, color: k % 3 ? '#C6FF3D' : '#FF5FD2'});
				}
			} else {
				g.fillStyle = '#4a2418';
				g.fillRect(px + 3, py - 10, T - 6, T + 6);
				g.fillStyle = '#6e3626';
				g.fillRect(px + 3, py - 10, T - 6, 4);
				g.fillStyle = '#1a0806';
				g.fillRect(px + 9, py - 4, T - 18, T - 4);
				s.decor.push({tipo: 'nucleo', x: px + T / 2, y: py + 6, fase: hash(x, y) * 10});
			}
		}
	}
	s.fondo = c;
}

// ─────────────────────────── JUGADOR ───────────────────────────
function nuevoJugador(previo) {
	return {
		x: W / 2,
		y: H / 2 + 40,
		r: 8,
		vx: 0,
		vy: 0,
		vida: previo ? previo.vidaMax : 6,
		vidaMax: previo ? previo.vidaMax : 6,
		escudo: 5,
		escudoMax: 5,
		energia: 200,
		energiaMax: 200,
		armas: previo ? previo.armas.slice() : ['click'],
		ai: previo ? previo.ai : 0,
		cd: 0,
		dash: 0,
		dashCd: 0,
		inv: 0,
		sinGolpe: 9,
		ang: 0,
		anim: 0,
		mueve: false,
		flash: 0,
		retroceso: 0,
		bytes: previo ? previo.bytes : 0,
		avisoEnergia: 0,
	};
}

// ─────────────────────────── COLISIONES ───────────────────────────
function puertaCerrada(s, d) {
	if (!s.puertas[d]) return true;
	if (s.estado === 'combate') return true;
	if (s.sellada === d) return true;
	return false;
}
function solido(s, tx, ty) {
	if (tx < 0 || ty < 0 || tx >= CW || ty >= CH) return false;
	const v = s.grid[ty][tx];
	if (v === 1 || v === 2) return true;
	if (ty === 0 && puertaCerrada(s, 'n')) return true;
	if (ty === CH - 1 && puertaCerrada(s, 's')) return true;
	if (tx === 0 && puertaCerrada(s, 'o')) return true;
	if (tx === CW - 1 && puertaCerrada(s, 'e')) return true;
	return false;
}
function chocaEn(s, x, y, r) {
	const pts = [
		[x - r, y - r * 0.3],
		[x + r, y - r * 0.3],
		[x - r, y + r],
		[x + r, y + r],
	];
	if (pts.some(([a, b]) => solido(s, Math.floor(a / T), Math.floor(b / T)))) return true;
	return s.barriles.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + r * 0.8);
}
function mover(e, dx, dy) {
	const s = G.sala;
	if (!chocaEn(s, e.x + dx, e.y, e.r)) e.x += dx;
	else if (e.rebota) e.vx *= -1;
	if (!chocaEn(s, e.x, e.y + dy, e.r)) e.y += dy;
	else if (e.rebota) e.vy *= -1;
}

// ─────────────────────────── EFECTOS ───────────────────────────
function particulas(x, y, n, color, o = {}) {
	for (let k = 0; k < n; k++) {
		const a = o.ang !== undefined ? o.ang + azar(-o.abre, o.abre) : azar(0, Math.PI * 2);
		const v = azar(o.vmin ?? 30, o.vmax ?? 140);
		const vida = azar(0.25, o.vida ?? 0.6);
		G.part.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida, max: vida, color: Array.isArray(color) ? elegir(color) : color, tam: o.tam ?? entero(1, 3), tipo: o.tipo ?? 'chispa', g: o.g ?? 0});
	}
}
function anilloOnda(x, y, color, rmax = 40) {
	G.part.push({x, y, vx: 0, vy: 0, vida: 0.35, max: 0.35, color, tipo: 'anillo', rmax});
}
function textoFlotante(x, y, txt, color = '#fff', grande = false) {
	G.textos.push({x, y, txt, color, vida: 0.8, grande});
}
function temblar(n) {
	G.temblor = Math.min(14, G.temblor + n);
}
function explosion(x, y, r, dmg, deJugador = true) {
	SFX.explosion();
	temblar(9);
	G.congelar = 0.05;
	anilloOnda(x, y, '#FFB224', r * 1.4);
	anilloOnda(x, y, '#ffffff', r);
	particulas(x, y, 36, ['#fff7cc', '#FFB224', '#FF4D1A', '#FF4D5E'], {vmax: 260, vida: 0.7, tam: 3});
	particulas(x, y, 14, ['#2a2a35', '#3a3a48'], {vmax: 60, vida: 1.2, tam: 4, tipo: 'humo'});
	G.destellos.push({x, y, r: r * 3.2, vida: 0.25, max: 0.25, color: '#FFB224'});
	for (const e of G.enemigos) if (Math.hypot(e.x - x, e.y - y) < r + e.r) danarEnemigo(e, dmg, x, y);
	for (const b of G.sala.barriles) if (b.vida > 0 && Math.hypot(b.x - x, b.y - y) < r + b.r) setTimeout(() => danarBarril(b, 99), 90);
	if (Math.hypot(G.j.x - x, G.j.y - y) < r * (deJugador ? 0.45 : 1) + 6) danarJugador(1);
}
G.destellos = [];

function aviso(txt, tipo = '') {
	const d = document.createElement('div');
	d.className = 'aviso ' + tipo;
	d.textContent = txt;
	$('#avisos').append(d);
	setTimeout(() => d.remove(), 3100);
}

// ─────────────────────────── BITÁCORA ───────────────────────────
function desbloquear(k) {
	if (!k || G.bitacora.has(k) || !BITACORA[k]) return;
	G.bitacora.add(k);
	guardar('orion-bitacora', [...G.bitacora]);
	setTimeout(() => aviso('📘 Bitácora: ' + BITACORA[k].titulo, 'cian'), 400);
}
function abrirBitacora(volver) {
	const caja = $('#bTarjetas');
	caja.innerHTML = '';
	const total = Object.keys(BITACORA).length;
	$('#bResumen').textContent = `${G.bitacora.size} de ${total} conceptos desbloqueados. Se desbloquean respondiendo cofres y resolviendo terminales.`;
	for (const [k, v] of Object.entries(BITACORA)) {
		const t = document.createElement('div');
		const abierta = G.bitacora.has(k);
		t.className = 'tarjeta' + (abierta ? '' : ' bloqueada');
		const h = document.createElement('h5');
		h.textContent = abierta ? v.titulo : '??? bloqueada';
		const p = document.createElement('p');
		p.textContent = abierta ? v.texto : 'Sigue jugando para descubrirla.';
		t.append(h, p);
		if (abierta) {
			const pre = document.createElement('pre');
			pre.textContent = v.codigo;
			t.append(pre);
		}
		caja.append(t);
	}
	$('#bitacora').classList.remove('oculto');
	$('#bCerrar').onclick = () => {
		$('#bitacora').classList.add('oculto');
		volver && volver();
	};
}

// ─────────────────────────── ENEMIGOS ───────────────────────────
const TIPOS = {
	bicho: {r: 9, vida: 24, vel: 72, sprite: 'bicho', color: ['#ff6b7c', '#cf2d43', '#741424']},
	null: {r: 10, vida: 32, vel: 0, sprite: 'null', color: ['#8be04a', '#2b9c55', '#eaffb8']},
	nullito: {r: 6, vida: 10, vel: 0, sprite: 'null', escala: 0.6, color: ['#8be04a', '#2b9c55']},
	torreta: {r: 11, vida: 40, vel: 0, sprite: 'torreta', color: ['#8f9bb5', '#56607c', '#ff6b7c']},
	keylogger: {r: 10, vida: 30, vel: 52, sprite: 'keylogger', color: ['#a07cff', '#6545c4', '#e6dcff']},
	granNull: {r: 30, vida: 560, vel: 0, sprite: 'granNull', jefe: true, color: ['#8be04a', '#2b9c55', '#ffcb3f']},
	reyKeylogger: {r: 28, vida: 720, vel: 0, sprite: 'reyKeylogger', jefe: true, color: ['#a07cff', '#6545c4', '#ffcb3f']},
	sobrecarga: {r: 34, vida: 900, vel: 0, sprite: 'sobrecarga', jefe: true, color: ['#ffb224', '#ff4d1a', '#fff7cc']},
};
function crearEnemigo(tipo, x, y) {
	const d = TIPOS[tipo];
	const mult = d.jefe ? 1 : 1 + G.piso * 0.3;
	const e = {tipo, x, y, r: d.r, vida: d.vida * mult, vidaMax: d.vida * mult, t: azar(0, 1), estado: 'normal', flash: 0, kx: 0, ky: 0, frame: 0, z: 0, ang: 0, jefe: !!d.jefe, escudoHecho: false, dir: 1, aparece: 0};
	G.enemigos.push(e);
	return e;
}
function aparecerEn(tipo, x, y) {
	G.telegrafos.push({x, y, t: 0, dur: 0.75, tipo});
}
function oleada(s) {
	const p = G.piso;
	const pool = p === 0 ? ['bicho', 'bicho', 'null', 'torreta'] : p === 1 ? ['bicho', 'null', 'torreta', 'keylogger', 'keylogger'] : ['bicho', 'null', 'torreta', 'keylogger', 'bicho', 'torreta'];
	const n = 3 + p + entero(0, 2) + (s.tipo === 'premio' ? 1 : 0);
	for (let k = 0; k < n; k++) {
		const pt = puntoLibre(s, 120, G.j);
		if (pt) aparecerEn(elegir(pool), pt.x, pt.y);
	}
	SFX.alerta();
}

function disparoEnemigo(x, y, ang, vel, color = '#FF4D5E', r = 4) {
	G.balas.push({x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, r, dmg: 1, de: 'e', color, vida: 5});
}
function anilloBalas(x, y, n, vel, off = 0, color) {
	for (let k = 0; k < n; k++) disparoEnemigo(x, y, off + (k / n) * Math.PI * 2, vel, color);
}

function actualizarEnemigo(e, dt) {
	const j = G.j;
	const a = Math.atan2(j.y - e.y, j.x - e.x);
	const d = dist(e, j);
	e.t += dt;
	e.flash = Math.max(0, e.flash - dt);
	e.frame += dt * (e.tipo === 'bicho' ? 10 : 6);
	// retroceso por golpe
	if (Math.abs(e.kx) + Math.abs(e.ky) > 1) {
		mover(e, e.kx * dt, e.ky * dt);
		e.kx *= 0.82;
		e.ky *= 0.82;
	}
	const vel = TIPOS[e.tipo].vel;
	switch (e.tipo) {
		case 'bicho': {
			const ox = Math.sin(e.t * 3) * 0.5;
			mover(e, Math.cos(a + ox) * vel * dt, Math.sin(a + ox) * vel * dt);
			e.dir = j.x < e.x ? -1 : 1;
			break;
		}
		case 'null':
		case 'nullito': {
			if (e.estado === 'normal' && e.t > (e.tipo === 'nullito' ? 0.7 : 1.1)) {
				e.estado = 'salta';
				e.t = 0;
				e.sx = Math.cos(a) * (e.tipo === 'nullito' ? 140 : 110);
				e.sy = Math.sin(a) * (e.tipo === 'nullito' ? 140 : 110);
			}
			if (e.estado === 'salta') {
				const dur = 0.45;
				e.z = Math.sin((e.t / dur) * Math.PI) * 14;
				mover(e, e.sx * dt, e.sy * dt);
				if (e.t > dur) {
					e.estado = 'normal';
					e.t = 0;
					e.z = 0;
					particulas(e.x, e.y + e.r, 6, ['#2b9c55', '#8be04a'], {vmax: 50, vida: 0.3});
				}
			}
			break;
		}
		case 'torreta': {
			e.ang = a;
			if (e.estado === 'normal' && e.t > 1.7) {
				e.estado = 'carga';
				e.t = 0;
			}
			if (e.estado === 'carga' && e.t > 0.5) {
				disparoEnemigo(e.x, e.y - 8, Math.atan2(j.y - (e.y - 8), j.x - e.x), 150 + G.piso * 20);
				if (G.piso >= 1) {
					disparoEnemigo(e.x, e.y - 8, Math.atan2(j.y - (e.y - 8), j.x - e.x) + 0.25, 150);
					disparoEnemigo(e.x, e.y - 8, Math.atan2(j.y - (e.y - 8), j.x - e.x) - 0.25, 150);
				}
				e.estado = 'normal';
				e.t = 0;
				particulas(e.x, e.y - 8, 5, '#FFB224', {ang: a, abre: 0.4, vmax: 90});
			}
			break;
		}
		case 'keylogger': {
			const ideal = 130;
			const sentido = d < ideal - 20 ? -1 : d > ideal + 20 ? 1 : 0;
			const lateral = Math.sin(e.t * 1.3) > 0 ? 1 : -1;
			mover(e, (Math.cos(a) * sentido + Math.cos(a + Math.PI / 2) * lateral * 0.6) * vel * dt, (Math.sin(a) * sentido + Math.sin(a + Math.PI / 2) * lateral * 0.6) * vel * dt);
			if (e.t > 2) {
				e.t = 0;
				[-0.3, 0, 0.3].forEach((o) => disparoEnemigo(e.x, e.y, a + o, 130, '#A07CFF'));
			}
			e.dir = j.x < e.x ? -1 : 1;
			break;
		}
		case 'granNull':
			jefeGranNull(e, dt, a);
			break;
		case 'reyKeylogger':
			jefeRey(e, dt, a);
			break;
		case 'sobrecarga':
			jefeSobrecarga(e, dt, a);
			break;
	}
	// contacto
	if (d < e.r + j.r - 2 && e.z < 6 && e.aparece <= 0) danarJugador(1);
	// escudo de sintaxis del jefe a la mitad
	if (e.jefe && !e.escudoHecho && e.vida < e.vidaMax * 0.5) {
		e.escudoHecho = true;
		escudoJefe(e);
	}
}

function jefeGranNull(e, dt, a) {
	const fase2 = e.vida < e.vidaMax * 0.5;
	if (e.estado === 'normal' && e.t > (fase2 ? 1.3 : 1.9)) {
		e.estado = 'salta';
		e.t = 0;
		e.saltos = (e.saltos || 0) + 1;
		const d = Math.min(160, dist(e, G.j));
		e.sx = (Math.cos(a) * d) / 0.75;
		e.sy = (Math.sin(a) * d) / 0.75;
	}
	if (e.estado === 'salta') {
		const dur = 0.75;
		e.z = Math.sin((e.t / dur) * Math.PI) * 60;
		mover(e, e.sx * dt, e.sy * dt);
		if (e.t > dur) {
			e.estado = 'normal';
			e.t = 0;
			e.z = 0;
			temblar(8);
			SFX.explosion();
			anilloOnda(e.x, e.y + 10, '#8be04a', 90);
			particulas(e.x, e.y + 20, 24, ['#2b9c55', '#8be04a', '#eaffb8'], {vmax: 160, vida: 0.5, tam: 3});
			anilloBalas(e.x, e.y, fase2 ? 20 : 14, 120, e.saltos * 0.2, '#8be04a');
			if (fase2) setTimeout(() => G.enemigos.includes(e) && anilloBalas(e.x, e.y, 20, 90, e.saltos * 0.2 + 0.15, '#eaffb8'), 220);
			if (e.saltos % 3 === 0) {
				crearEnemigo('nullito', e.x - 30, e.y);
				crearEnemigo('nullito', e.x + 30, e.y);
			}
		}
	}
}
function jefeRey(e, dt, a) {
	const fase2 = e.vida < e.vidaMax * 0.5;
	e.frame += dt * 2;
	if (e.estado === 'normal') {
		e.estado = 'apunta';
		e.t = 0;
	}
	if (e.estado === 'apunta') {
		e.angDash = a;
		G.lineaJefe = {x: e.x, y: e.y, ang: a, t: e.t};
		if (e.t > (fase2 ? 0.55 : 0.8)) {
			e.estado = 'embiste';
			e.t = 0;
			G.lineaJefe = null;
			SFX.dash();
		}
	} else if (e.estado === 'embiste') {
		const v = fase2 ? 420 : 340;
		const antes = {x: e.x, y: e.y};
		mover(e, Math.cos(e.angDash) * v * dt, Math.sin(e.angDash) * v * dt);
		if (G.t % 0.08 < dt) G.part.push({x: e.x, y: e.y, vx: 0, vy: 0, vida: 0.2, max: 0.2, tipo: 'sombra', sprite: 'reyKeylogger', frame: Math.floor(e.frame) % 4, escala: 2, dir: e.dir});
		const choco = Math.hypot(e.x - antes.x, e.y - antes.y) < v * dt * 0.3;
		if (e.t > 0.7 || choco) {
			if (choco) {
				temblar(10);
				SFX.explosion();
				anilloBalas(e.x, e.y, 10, 110, 0, '#A07CFF');
			}
			e.estado = 'espiral';
			e.t = 0;
			e.rafaga = 0;
		}
	} else if (e.estado === 'espiral') {
		e.rafaga += dt;
		if (e.rafaga > (fase2 ? 0.06 : 0.09)) {
			e.rafaga = 0;
			const base = e.t * 5;
			disparoEnemigo(e.x, e.y, base, 120, '#FF5FD2');
			if (fase2) disparoEnemigo(e.x, e.y, base + Math.PI, 120, '#A07CFF');
		}
		if (e.t > 1.8) {
			e.estado = 'normal';
			e.t = 0;
		}
	}
	e.dir = G.j.x < e.x ? -1 : 1;
}
function jefeSobrecarga(e, dt, a) {
	const fase2 = e.vida < e.vidaMax * 0.5;
	e.ox = e.ox ?? e.x;
	e.oy = e.oy ?? e.y;
	e.x = e.ox + Math.sin(G.t * 0.6) * 120;
	e.y = e.oy + Math.sin(G.t * 1.1) * 30;
	e.patron = e.patron ?? 0;
	e.rafaga = (e.rafaga ?? 0) + dt;
	const nombres = ['espiral', 'rafaga', 'anillo'];
	const p = nombres[e.patron % 3];
	if (p === 'espiral' && e.rafaga > (fase2 ? 0.07 : 0.1)) {
		e.rafaga = 0;
		const brazos = fase2 ? 5 : 4;
		for (let k = 0; k < brazos; k++) disparoEnemigo(e.x, e.y, e.t * 1.6 + (k / brazos) * Math.PI * 2, 115, '#FFB224');
	}
	if (p === 'rafaga' && e.rafaga > 0.45) {
		e.rafaga = 0;
		for (let k = -2; k <= 2; k++) disparoEnemigo(e.x, e.y, a + k * 0.12, 170, '#FF4D5E');
	}
	if (p === 'anillo' && e.rafaga > 0.6) {
		e.rafaga = 0;
		anilloBalas(e.x, e.y, fase2 ? 26 : 20, 100, e.t, '#fff7cc');
	}
	if (e.t > (p === 'espiral' ? 3 : 2.4)) {
		e.t = 0;
		e.patron++;
		particulas(e.x, e.y, 20, ['#36E2FF', '#d2faff'], {vmax: 200, vida: 0.4});
	}
	e.frame += dt * 4;
}

function danarEnemigo(e, dmg, ox, oy) {
	if (e.aparece > 0 || e.vida <= 0) return;
	if (e.invulnerable) {
		textoFlotante(e.x, e.y - e.r - 6, 'ESCUDO', '#36E2FF');
		return;
	}
	e.vida -= dmg;
	e.flash = 0.08;
	const a = Math.atan2(e.y - oy, e.x - ox);
	if (!e.jefe && e.tipo !== 'torreta') {
		e.kx += Math.cos(a) * 160;
		e.ky += Math.sin(a) * 160;
	}
	textoFlotante(e.x + azar(-6, 6), e.y - e.r - 8, Math.round(dmg), dmg >= 20 ? '#FFB224' : '#ffffff', dmg >= 20);
	particulas(e.x, e.y, 4, TIPOS[e.tipo].color, {vmax: 90, vida: 0.3});
	SFX.golpe();
	if (e.vida <= 0) matarEnemigo(e);
}
function matarEnemigo(e) {
	const i = G.enemigos.indexOf(e);
	if (i < 0) return;
	G.enemigos.splice(i, 1);
	G.stats.bugs++;
	SFX.muerte();
	temblar(e.jefe ? 14 : 3);
	G.congelar = e.jefe ? 0.2 : 0.035;
	particulas(e.x, e.y, e.jefe ? 80 : 18, TIPOS[e.tipo].color, {vmax: e.jefe ? 300 : 160, vida: 0.8, tam: 3, tipo: 'pixel', g: 200});
	anilloOnda(e.x, e.y, TIPOS[e.tipo].color[0], e.jefe ? 120 : 30);
	// botín
	const n = e.jefe ? 14 : entero(1, 3);
	for (let k = 0; k < n; k++) soltar('byte', e.x, e.y);
	if (Math.random() < 0.7 || e.jefe) soltar('energia', e.x, e.y);
	if (Math.random() < 0.06) soltar('vida', e.x, e.y);
	if (e.tipo === 'null' && G.piso >= 0) {
		const a = crearEnemigo('nullito', e.x - 10, e.y);
		const b = crearEnemigo('nullito', e.x + 10, e.y);
		a.kx = -120;
		b.kx = 120;
	}
	if (e.jefe) jefeDerrotado(e);
}
function soltar(tipo, x, y) {
	const a = azar(0, Math.PI * 2),
		v = azar(40, 140);
	G.recogibles.push({tipo, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0});
}
function danarBarril(b, dmg) {
	if (b.vida <= 0) return;
	b.vida -= dmg;
	b.flash = 0.1;
	if (b.vida <= 0) {
		G.sala.barriles = G.sala.barriles.filter((x) => x !== b);
		explosion(b.x, b.y, 52, 40, false);
	}
}

function danarJugador(n) {
	const j = G.j;
	if (j.inv > 0 || j.dash > 0 || G.estado !== 'jugando') return;
	j.sinGolpe = 0;
	j.inv = 0.9;
	j.flash = 0.15;
	G.stats.golpes++;
	temblar(7);
	G.congelar = 0.06;
	if (j.escudo > 0) {
		j.escudo -= n;
		SFX.escudo();
		particulas(j.x, j.y, 10, ['#e3e9f4', '#8f9bb5'], {vmax: 120});
		if (j.escudo < 0) {
			j.vida += j.escudo;
			j.escudo = 0;
		}
	} else {
		j.vida -= n;
		SFX.dano();
		particulas(j.x, j.y, 14, ['#FF4D5E', '#ff9aa5'], {vmax: 150});
		G.vineta = 0.5;
	}
	if (j.vida <= 0) muerteJugador();
}

// ─────────────────────────── ARMAS ───────────────────────────
function disparar() {
	const j = G.j;
	const id = j.armas[j.ai];
	const w = ARMAS[id];
	if (j.cd > 0) return;
	if (j.energia < w.costo) {
		if (j.avisoEnergia <= 0) {
			aviso('⚡ Sin energía: Q para la Pistola Click', 'ambar');
			j.avisoEnergia = 2;
		}
		return;
	}
	j.energia -= w.costo;
	j.cd = w.cad;
	const bx = j.x + Math.cos(j.ang) * 14,
		by = j.y - 6 + Math.sin(j.ang) * 14;
	for (let k = 0; k < w.n; k++) {
		const a = j.ang + (w.n > 1 ? (k / (w.n - 1) - 0.5) * w.disp : azar(-w.disp, w.disp));
		const v = w.vel * (w.n > 1 ? azar(0.85, 1.1) : 1);
		G.balas.push({x: bx, y: by, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: w.r, dmg: w.dmg, de: 'j', color: w.color, vida: 1.2, explota: w.explota, id});
	}
	j.retroceso = id === 'submit' ? 5 : id === 'keydown' ? 4 : 2;
	particulas(bx, by, id === 'keydown' ? 8 : 3, [w.color, '#ffffff'], {ang: j.ang, abre: 0.5, vmax: 120, vida: 0.15});
	G.fogonazo = {x: bx, y: by, color: w.color, vida: 0.06};
	if (id === 'submit' || id === 'keydown') temblar(2);
	SFX.disparo(id);
}
function cambiarArma() {
	const j = G.j;
	if (j.armas.length < 2) {
		aviso('Solo tienes la Pistola Click. Abre cofres para conseguir más.', 'ambar');
		return;
	}
	j.ai = (j.ai + 1) % j.armas.length;
	SFX.recoger();
	const w = ARMAS[j.armas[j.ai]];
	aviso('🔫 ' + w.nombre, 'cian');
}

// ─────────────────────────── SALAS Y TRANSICIONES ───────────────────────────
function entrarSala(s, desde) {
	prepararSala(s);
	G.sala = s;
	G.balas = [];
	G.enemigos = [];
	G.recogibles = [];
	G.telegrafos = [];
	G.part = [];
	G.lineaJefe = null;
	const j = G.j;
	if (desde === 'n') (j.x = W / 2, j.y = T + 18);
	if (desde === 's') (j.x = W / 2, j.y = H - T - 14);
	if (desde === 'o') (j.x = T + 16, j.y = 6.5 * T);
	if (desde === 'e') (j.x = W - T - 16, j.y = 6.5 * T);
	const primera = !s.visitada;
	s.visitada = true;
	if (s.estado === 'nueva') {
		s.estado = 'combate';
		s.oleada = 0;
		SFX.cerrar();
		setTimeout(() => {
			if (G.sala === s) {
				s.oleada = 1;
				oleada(s);
			}
		}, 450);
	}
	if (s.tipo === 'jefe' && s.estado === 'jefe') {
		s.estado = 'combate';
		iniciarJefe(s);
	}
	if (s.tipo === 'terminal' && primera && !s.terminal.resuelto) setTimeout(() => G.sala === s && dialogo(HISTORIA.terminal), 300);
	A.jefe = s.tipo === 'jefe' && s.estado === 'combate';
}
function intentarSalir() {
	const j = G.j,
		s = G.sala;
	let d = null;
	if (j.y < 6 && s.puertas.n) d = 'n';
	else if (j.y > H - 6 && s.puertas.s) d = 's';
	else if (j.x < 6 && s.puertas.o) d = 'o';
	else if (j.x > W - 6 && s.puertas.e) d = 'e';
	if (!d || G.transicion) return;
	const [dx, dy] = DIRS[d];
	const sig = G.salas.get(clave(s.gx + dx, s.gy + dy));
	if (!sig) return;
	G.transicion = {t: 0, cambiado: false, sig, desde: OPUESTA[d]};
	SFX.puerta();
}

function iniciarJefe(s) {
	const C = CUBIERTAS[G.piso];
	G.estado = 'cinematica';
	A.jefe = true;
	banner('JEFE · CUBIERTA ' + (G.piso + 1), C.jefeNombre, C.jefeFrase, '#FF4D5E');
	SFX.alerta();
	setTimeout(() => {
		const e = crearEnemigo(C.jefe, W / 2, H / 2 - 30);
		e.aparece = 0.9;
		particulas(e.x, e.y, 60, TIPOS[C.jefe].color, {vmax: 260, vida: 0.8, tam: 3});
		temblar(12);
		$('#jefe').classList.remove('oculto');
		$('#jNom').textContent = C.jefeNombre;
		G.estado = 'jugando';
	}, 2600);
}
function escudoJefe(e) {
	e.invulnerable = true;
	$('#jefe').classList.add('escudo');
	G.balas = G.balas.filter((b) => b.de === 'j');
	anilloOnda(e.x, e.y, '#36E2FF', 120);
	SFX.escudo();
	dialogo(HISTORIA.jefeEscudo, () => {
		const q = tomarPregunta();
		abrirQuiz(q, {kicker: 'ESCUDO DE SINTAXIS', titulo: 'Rómpelo con conocimiento'}, (bien) => {
			e.invulnerable = false;
			$('#jefe').classList.remove('escudo');
			if (bien) {
				e.vida -= e.vidaMax * 0.12;
				e.aturdido = 3;
				aviso('💥 ¡ESCUDO ROTO! El jefe recibe daño crítico', '');
				textoFlotante(e.x, e.y - 40, 'CRÍTICO', '#FFB224', true);
				explosion(e.x, e.y, 40, 0);
			} else {
				e.vida = Math.min(e.vidaMax, e.vida + e.vidaMax * 0.08);
				aviso('El jefe se curó un poco. ¡Sigue!', 'ambar');
			}
		});
	});
}
function jefeDerrotado(e) {
	const s = G.sala;
	$('#jefe').classList.add('oculto');
	G.camaraLenta = 1.2;
	G.balas = G.balas.filter((b) => b.de === 'j');
	for (let k = 0; k < 6; k++) setTimeout(() => explosion(e.x + azar(-40, 40), e.y + azar(-40, 40), 40, 0), k * 180);
	setTimeout(() => {
		s.estado = 'limpia';
		A.jefe = false;
		s.portal = {x: W / 2, y: H / 2 + 6, t: 0};
		soltar('vida', W / 2 - 40, H / 2 + 40);
		soltar('vida', W / 2 + 40, H / 2 + 40);
		aviso('🏆 JEFE DERROTADO · ' + CUBIERTAS[G.piso].jefeNombre, '');
		SFX.bien();
	}, 1300);
}

// ─────────────────────────── INTERACCIÓN ───────────────────────────
function interactuable() {
	const j = G.j,
		s = G.sala;
	if (s.cofre && !s.cofre.abierto && dist(j, s.cofre) < 34) return {txt: 'Abrir cofre (pregunta)', fn: abrirCofre};
	if (s.terminal && dist(j, s.terminal) < 40) return s.terminal.resuelto ? {txt: 'Terminal: puerta abierta ✓', fn: () => aviso('Esta terminal ya está resuelta.', 'cian')} : {txt: 'Hackear terminal (reto de código)', fn: () => abrirTerminal(s)};
	if (s.ori && dist(j, s.ori) < 40) return {txt: 'Hablar con ORI', fn: hablarOri};
	if (s.portal && dist(j, s.portal) < 34) return {txt: G.piso < 2 ? 'Bajar a la siguiente cubierta' : 'Salir del núcleo', fn: usarPortal};
	return null;
}
function hablarOri() {
	const C = CUBIERTAS[G.piso];
	const consejos = [
		[['ORI', `Esta cubierta entrena: ${C.tema}.`], ['ORI', 'Antes de programar, pregúntate: ¿quién escucha?, ¿cuándo?, ¿qué cambia?']],
		[['ORI', 'Los cofres hacen una pregunta. Si aciertas, te doy un arma con nombre de evento.'], ['ORI', 'Tus conceptos quedan en la Bitácora (ESC → Bitácora).']],
		[['ORI', 'Si te quedas sin energía, cambia a la Pistola Click con Q: no gasta nada.'], ['ORI', 'Y usa ESPACIO para esquivar: durante el dash eres invencible.']],
	];
	dialogo(elegir(consejos));
}
function abrirCofre() {
	const s = G.sala;
	const q = tomarPregunta();
	abrirQuiz(q, {kicker: 'COFRE · PREGUNTA', titulo: q.codigo ? '¡Sabotaje! Encuentra el error' : 'Ábrelo con conocimiento'}, (bien) => {
		s.cofre.abierto = true;
		SFX.cofre();
		particulas(s.cofre.x, s.cofre.y - 8, 40, ['#FFB224', '#fff4c4', '#C6FF3D'], {vmax: 180, vida: 0.8, tam: 2, g: 120});
		anilloOnda(s.cofre.x, s.cofre.y, '#FFB224', 60);
		const j = G.j;
		if (bien) {
			const nueva = ORDEN_ARMAS.find((a) => !j.armas.includes(a));
			if (nueva) {
				j.armas.push(nueva);
				j.ai = j.armas.length - 1;
				const w = ARMAS[nueva];
				aviso(`🔫 ¡NUEVA ARMA! ${w.nombre} — ${w.desc}`, '');
			} else {
				j.vidaMax = Math.min(10, j.vidaMax + 1);
				j.vida = j.vidaMax;
				aviso('♥ Vida máxima +1', '');
			}
			for (let k = 0; k < 4; k++) soltar('energia', s.cofre.x, s.cofre.y);
		} else {
			for (let k = 0; k < 2; k++) soltar('energia', s.cofre.x, s.cofre.y);
			aviso('El cofre solo tenía energía. ¡La próxima!', 'ambar');
		}
		for (let k = 0; k < 6; k++) soltar('byte', s.cofre.x, s.cofre.y);
	});
}
function usarPortal() {
	SFX.portal();
	G.estado = 'cinematica';
	G.blanco = 1;
	setTimeout(() => {
		if (G.piso < 2) iniciarCubierta(G.piso + 1);
		else
			dialogo(HISTORIA.final, () => {
				borrarPartida();
				mostrarFin(true);
			});
	}, 700);
}

// ─────────────────────────── DIÁLOGOS Y BANNERS ───────────────────────────
const D = {lineas: [], i: 0, letras: 0, alTerminar: null, previo: 'jugando'};
function dialogo(lineas, alTerminar) {
	D.lineas = lineas;
	D.i = 0;
	D.letras = 0;
	D.alTerminar = alTerminar;
	if (G.estado !== 'dialogo') D.previo = G.estado === 'cinematica' ? 'jugando' : G.estado;
	G.estado = 'dialogo';
	$('#dialogo').classList.remove('oculto');
	pintarLinea();
}
function pintarLinea() {
	const [quien] = D.lineas[D.i];
	$('#dQuien').textContent = quien;
	$('#dialogo').classList.toggle('chispa', quien === 'CHISPA');
	D.letras = 0;
}
function avanzarDialogo() {
	const txt = D.lineas[D.i][1];
	if (D.letras < txt.length) {
		D.letras = txt.length;
		return;
	}
	D.i++;
	if (D.i >= D.lineas.length) {
		$('#dialogo').classList.add('oculto');
		G.estado = D.previo === 'dialogo' ? 'jugando' : D.previo;
		const fn = D.alTerminar;
		D.alTerminar = null;
		fn && fn();
		return;
	}
	pintarLinea();
}
function actualizarDialogo(dt) {
	if (G.estado !== 'dialogo') return;
	const txt = D.lineas[D.i][1];
	const antes = Math.floor(D.letras);
	D.letras = Math.min(txt.length, D.letras + dt * 48);
	if (Math.floor(D.letras) !== antes && Math.floor(D.letras) % 3 === 0) SFX.texto();
	$('#dTxt').textContent = txt.slice(0, Math.floor(D.letras));
	const rc = $('#retrato').getContext('2d');
	rc.imageSmoothingEnabled = false;
	rc.clearRect(0, 0, 96, 96);
	const quien = D.lineas[D.i][0];
	const img = IMG[quien === 'CHISPA' ? 'chispa' : 'ori'][Math.floor(G.t * 4) % 4];
	const z = Math.floor(84 / Math.max(img.width, img.height));
	rc.drawImage(img, (96 - img.width * z) / 2, (96 - img.height * z) / 2 + (D.letras < txt.length ? Math.sin(G.t * 30) : 0), img.width * z, img.height * z);
}
function banner(k, t, f, color) {
	const b = $('#banner');
	b.innerHTML = '';
	const add = (cls, txt) => {
		const d = document.createElement('div');
		d.className = cls;
		if (txt) d.textContent = txt;
		b.append(d);
		return d;
	};
	add('franja a');
	add('franja b');
	add('k', k);
	const tt = add('t', t);
	tt.style.color = color;
	tt.style.textShadow = `0 0 40px ${color}`;
	if (f) add('f', '“' + f + '”');
	b.classList.remove('oculto');
	clearTimeout(banner.temp);
	banner.temp = setTimeout(() => b.classList.add('oculto'), 3000);
}

// ─────────────────────────── PREGUNTAS ───────────────────────────
function tomarPregunta() {
	let pool = PREGUNTAS.filter((q, i) => q.p === G.piso && !G.usadas.has(i));
	if (!pool.length) pool = PREGUNTAS.filter((q, i) => q.p <= G.piso && !G.usadas.has(i));
	if (!pool.length) {
		G.usadas.clear();
		pool = PREGUNTAS.filter((q) => q.p <= G.piso);
	}
	const q = elegir(pool);
	G.usadas.add(PREGUNTAS.indexOf(q));
	return q;
}
function abrirQuiz(q, textos, alTerminar) {
	G.estado = 'modal';
	$('#qKicker').textContent = textos.kicker;
	$('#qTitulo').textContent = textos.titulo;
	$('#qTexto').textContent = q.q;
	const cod = $('#qCodigo');
	cod.classList.toggle('oculto', !q.codigo);
	cod.innerHTML = '';
	(q.codigo || []).forEach((l, i) => {
		const n = document.createElement('span');
		n.className = 'nl';
		n.textContent = i + 1;
		cod.append(n, document.createTextNode(l + '\n'));
	});
	const orden = q.o.map((t, i) => ({t, i})).sort(() => Math.random() - 0.5);
	const caja = $('#qOpciones');
	caja.innerHTML = '';
	$('#qExplica').innerHTML = '';
	$('#qSeguir').classList.add('oculto');
	let respondido = false;
	const botones = orden.map(({t, i}, k) => {
		const b = document.createElement('button');
		b.className = 'opcion';
		const n = document.createElement('span');
		n.className = 'n';
		n.textContent = k + 1;
		const c = document.createElement(/[()'.=]/.test(t) ? 'code' : 'span');
		c.textContent = t;
		b.append(n, c);
		b.onclick = () => responder(i, b);
		caja.append(b);
		return b;
	});
	function responder(i, b) {
		if (respondido) return;
		respondido = true;
		const bien = i === q.c;
		G.stats.preguntas++;
		if (bien) G.stats.aciertos++;
		b.classList.add(bien ? 'bien' : 'mal');
		if (!bien) botones[orden.findIndex((o) => o.i === q.c)].classList.add('bien');
		(bien ? SFX.bien : SFX.mal)();
		const ex = document.createElement('div');
		ex.className = 'explica' + (bien ? '' : ' mal');
		const tit = document.createElement('b');
		tit.textContent = bien ? '✓ ¡CORRECTO!' : '✗ CASI…';
		ex.append(tit, document.createTextNode(q.e));
		$('#qExplica').append(ex);
		desbloquear(q.b);
		const seg = $('#qSeguir');
		seg.classList.remove('oculto');
		seg.focus();
		let cerrado = false;
		seg.onclick = () => {
			if (cerrado) return;
			cerrado = true;
			$('#quiz').classList.add('oculto');
			G.estado = 'jugando';
			quizTeclas = null;
			alTerminar(bien);
		};
	}
	quizTeclas = (k) => {
		const n = Number(k);
		if (n >= 1 && n <= botones.length && !respondido) botones[n - 1].click();
		else if ((k === 'Enter' || k === ' ') && respondido && document.activeElement !== $('#qSeguir')) $('#qSeguir').click();
	};
	$('#quiz').classList.remove('oculto');
}
let quizTeclas = null;

// ─────────────────────────── TERMINAL DE CÓDIGO ───────────────────────────
const TER = {sala: null, reto: null, id: null, intentos: 0, vioSolucion: false, prueba: null, espera: null};
function documento(reto, codigo, conPruebas) {
	const seguro = codigo.replace(/<\/script/gi, '<\\/script');
	const pruebas = conPruebas
		? `<script>(function(){const r=[];const ok=(d,c)=>r.push([d,!!c]);const $=(s)=>document.querySelector(s);
const escribir=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));};
const cambiar=(el,v)=>{el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));};
const tecla=(el,k)=>{el.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));};
const enviar=(f)=>{const ev=new Event('submit',{bubbles:true,cancelable:true});f.dispatchEvent(ev);return ev.defaultPrevented;};
try{${reto.pruebas}}catch(e){r.push(['Tu código lanzó un error: '+e.message,false]);}
parent.postMessage({orion:'resultado',r:r,errores:window.__errores},'*');})();<\/script>`
		: '';
	return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:10px;color:#111;font-size:15px}input,textarea,select,button{font:inherit;margin:3px 0;padding:4px 8px}${reto.css || ''}</style></head><body>${reto.html}
<script>window.__errores=[];window.addEventListener('error',function(e){window.__errores.push(e.message)});<\/script>
<script>${seguro}<\/script>${pruebas}</body></html>`;
}
function abrirTerminal(s) {
	const id = s.terminal.reto;
	const reto = RETOS[id];
	Object.assign(TER, {sala: s, reto, id, intentos: 0, vioSolucion: false});
	G.estado = 'modal';
	$('#tTitulo').textContent = reto.titulo;
	$('#tEnun').innerHTML = reto.enunciado;
	$('#tHtml').textContent = reto.html;
	const ed = $('#editor');
	ed.value = G.codigos[id] || reto.inicio;
	$('#resultados').innerHTML = '';
	$('#pistaTxt').innerHTML = '';
	$('#tPista').disabled = true;
	$('#tSolucion').disabled = true;
	actualizarVista();
	$('#terminal').classList.remove('oculto');
	const oc = $('#oriMini').getContext('2d');
	oc.imageSmoothingEnabled = false;
	oc.clearRect(0, 0, 48, 48);
	oc.drawImage(IMG.ori[0], 0, 0, 48, 48 * (IMG.ori[0].height / IMG.ori[0].width));
	setTimeout(() => ed.focus(), 50);
}
let tempVista = null;
function actualizarVista() {
	$('#vista').srcdoc = documento(TER.reto, $('#editor').value, false);
}
$('#editor').addEventListener('input', () => {
	G.codigos[TER.id] = $('#editor').value;
	guardar('orion-codigos', G.codigos);
	clearTimeout(tempVista);
	tempVista = setTimeout(actualizarVista, 700);
});
$('#editor').addEventListener('keydown', (e) => {
	if (e.key === 'Tab') {
		e.preventDefault();
		const ed = e.target;
		const a = ed.selectionStart;
		ed.value = ed.value.slice(0, a) + '  ' + ed.value.slice(ed.selectionEnd);
		ed.selectionStart = ed.selectionEnd = a + 2;
	}
	if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) probarCodigo();
	e.stopPropagation();
});
function probarCodigo() {
	if (TER.prueba) TER.prueba.remove();
	const res = $('#resultados');
	res.innerHTML = '<div>⏳ ORI está probando tu código…</div>';
	const f = document.createElement('iframe');
	f.setAttribute('sandbox', 'allow-scripts');
	f.style.display = 'none';
	document.body.append(f);
	TER.prueba = f;
	f.srcdoc = documento(TER.reto, $('#editor').value, true);
	clearTimeout(TER.espera);
	TER.espera = setTimeout(() => {
		if (TER.prueba === f) {
			mostrarResultados([['Tu código tardó demasiado (¿un ciclo infinito?)', false]], []);
			f.remove();
			TER.prueba = null;
		}
	}, 3000);
}
addEventListener('message', (e) => {
	if (!e.data || e.data.orion !== 'resultado' || !TER.prueba || e.source !== TER.prueba.contentWindow) return;
	clearTimeout(TER.espera);
	TER.prueba.remove();
	TER.prueba = null;
	mostrarResultados(e.data.r, e.data.errores || []);
});
function mostrarResultados(r, errores) {
	const res = $('#resultados');
	res.innerHTML = '';
	errores.slice(0, 2).forEach((m) => {
		const d = document.createElement('div');
		d.className = 'no';
		d.textContent = '⚠ Error en la consola: ' + m;
		res.append(d);
	});
	r.forEach(([desc, ok]) => {
		const d = document.createElement('div');
		d.className = ok ? 'si' : 'no';
		d.textContent = (ok ? '✓ ' : '✗ ') + desc;
		res.append(d);
	});
	const todo = r.length > 0 && r.every(([, ok]) => ok);
	if (todo) {
		SFX.bien();
		const d = document.createElement('div');
		d.className = 'si';
		d.style.fontFamily = 'var(--pixel)';
		d.textContent = '🔓 ¡ACCESO CONCEDIDO! La puerta del jefe se abrió.';
		res.append(d);
		setTimeout(cerrarTerminal.bind(null, true), 1400);
	} else {
		SFX.mal();
		TER.intentos++;
		if (TER.intentos >= 1) $('#tPista').disabled = false;
		if (TER.intentos >= 3) $('#tSolucion').disabled = false;
	}
}
function cerrarTerminal(exito) {
	$('#terminal').classList.add('oculto');
	G.estado = 'jugando';
	if (exito && TER.sala && !TER.sala.terminal.resuelto) {
		const s = TER.sala;
		s.terminal.resuelto = true;
		s.sellada = null;
		G.stats.retos++;
		if (!TER.vioSolucion) G.stats.sinSolucion++;
		TER.reto.b.forEach((k, i) => setTimeout(() => desbloquear(k), i * 500));
		aviso('🔓 Puerta del jefe abierta. ¡Prepárate!', '');
		SFX.puerta();
		particulas(s.terminal.x, s.terminal.y, 40, ['#36E2FF', '#C6FF3D', '#ffffff'], {vmax: 200, vida: 0.8});
		G.j.energia = G.j.energiaMax;
		G.terminalHecha = true;
		guardarPartida(true);
	}
}
$('#tProbar').onclick = probarCodigo;
$('#tSalir').onclick = () => cerrarTerminal(false);
$('#tPista').onclick = () => {
	const d = document.createElement('div');
	d.className = 'explica mal';
	const b = document.createElement('b');
	b.textContent = '💡 PISTA DE ORI';
	d.append(b, document.createTextNode(TER.reto.pista));
	$('#pistaTxt').innerHTML = '';
	$('#pistaTxt').append(d);
};
$('#tSolucion').onclick = () => {
	TER.vioSolucion = true;
	$('#editor').value = TER.reto.solucion;
	G.codigos[TER.id] = TER.reto.solucion;
	actualizarVista();
	aviso('Solución cargada. Léela línea por línea y luego dale PROBAR.', 'ambar');
};

// ─────────────────────────── GUARDADO DE PROGRESO ───────────────────────────
function guardarPartida(conAviso = false) {
	if (!G.j || !G.stats) return;
	const st = G.stats;
	const datos = {
		piso: G.piso,
		vidaMax: G.j.vidaMax,
		armas: G.j.armas,
		ai: G.j.ai,
		bytes: G.j.bytes,
		terminalHecha: G.terminalHecha,
		usadas: [...G.usadas],
		stats: {...st, tiempo: (performance.now() - st.inicio) / 1000},
		fecha: Date.now(),
	};
	guardar('orion-partida', datos);
	if (conAviso) aviso('💾 Progreso guardado', 'cian');
}
function partidaGuardada() {
	const d = leer('orion-partida', null);
	return d && typeof d.piso === 'number' ? d : null;
}
function borrarPartida() {
	try {
		localStorage.removeItem('orion-partida');
	} catch (e) {}
}
function continuarPartida() {
	const d = partidaGuardada();
	if (!d) return nuevaPartida();
	const {tiempo = 0, ...resto} = d.stats || {};
	G.stats = {...nuevasStats(), ...resto, inicio: performance.now() - tiempo * 1000};
	G.usadas = new Set(d.usadas || []);
	G.j = {...nuevoJugador(null), vidaMax: d.vidaMax || 6, armas: d.armas || ['click'], ai: Math.min(d.ai || 0, (d.armas || ['click']).length - 1), bytes: d.bytes || 0};
	iniciarCubierta(d.piso, false, !!d.terminalHecha);
	setTimeout(() => aviso('💾 Partida cargada: cubierta ' + (d.piso + 1), 'cian'), 2400);
}

// ─────────────────────────── FLUJO DE PARTIDA ───────────────────────────
function nuevaPartida() {
	borrarPartida();
	G.stats = nuevasStats();
	G.j = nuevoJugador(null);
	G.usadas.clear();
	iniciarCubierta(0, true);
}
function iniciarCubierta(n, conIntro = false, terminalHecha = false) {
	G.piso = n;
	G.terminalHecha = terminalHecha;
	A.tema = n;
	A.jefe = false;
	G.semilla = entero(1, 99999);
	G.inicioJuego = G.t;
	G.salas = generarCubierta();
	const previo = G.j;
	G.j = nuevoJugador(previo);
	const inicio = [...G.salas.values()].find((s) => s.tipo === 'inicio');
	entrarSala(inicio, null);
	G.j.x = W / 2;
	G.j.y = H / 2 + 40;
	G.blanco = 1;
	G.estado = 'cinematica';
	$('#hud').classList.remove('oculto');
	$('#jefe').classList.add('oculto');
	$('#hCub').textContent = 'CUBIERTA ' + (n + 1);
	$('#hNom').textContent = CUBIERTAS[n].nombre;
	$('#hNom').style.color = CUBIERTAS[n].color;
	banner('CUBIERTA ' + (n + 1) + ' · ' + CUBIERTAS[n].tema, CUBIERTAS[n].nombre, null, CUBIERTAS[n].color);
	guardarPartida();
	setTimeout(() => {
		const lineas = conIntro ? [...HISTORIA.intro, ...HISTORIA.cubierta[n]] : HISTORIA.cubierta[n];
		dialogo(lineas);
	}, 2200);
}
function muerteJugador() {
	G.estado = 'muerto';
	G.stats.muertes++;
	SFX.explosion();
	explosion(G.j.x, G.j.y, 30, 0);
	G.camaraLenta = 1;
	setTimeout(() => mostrarFin(false), 1400);
}
function mostrarFin(gano) {
	G.estado = 'fin';
	const st = G.stats;
	const seg = Math.round((performance.now() - st.inicio) / 1000);
	$('#fKicker').textContent = gano ? 'MISIÓN CUMPLIDA' : 'CHISPA SE APAGÓ';
	$('#fTitulo').textContent = gano ? 'NÚCLEO LIMPIO 🎉' : 'Cubierta ' + (G.piso + 1) + ': reintenta';
	$('#fTitulo').style.color = gano ? 'var(--lima)' : 'var(--rojo)';
	const datos = [
		[`${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, 'tiempo'],
		[st.bugs, 'bugs eliminados'],
		[`${st.aciertos}/${st.preguntas}`, 'preguntas acertadas'],
		[st.retos, 'retos de código'],
		[st.sinSolucion, 'retos sin ver solución'],
		[`${G.bitacora.size}/${Object.keys(BITACORA).length}`, 'conceptos en bitácora'],
	];
	const caja = $('#fStats');
	caja.innerHTML = '';
	datos.forEach(([v, k]) => {
		const d = document.createElement('div');
		d.className = 'stat';
		const b = document.createElement('b');
		b.textContent = v;
		const s = document.createElement('span');
		s.textContent = k;
		d.append(b, s);
		caja.append(d);
	});
	$('#fBoton').textContent = gano ? 'JUGAR DE NUEVO' : 'REINTENTAR CUBIERTA';
	$('#fBoton').onclick = () => {
		$('#fin').classList.add('oculto');
		if (gano) nuevaPartida();
		else {
			G.j.vida = G.j.vidaMax;
			iniciarCubierta(G.piso, false, G.terminalHecha);
		}
	};
	$('#fBitacora').onclick = () => abrirBitacora();
	$('#fin').classList.remove('oculto');
	$('#jefe').classList.add('oculto');
}
function pausar() {
	if (G.estado !== 'jugando') return;
	G.estado = 'pausa';
	$('#pausa').classList.remove('oculto');
}
function reanudar() {
	$('#pausa').classList.add('oculto');
	G.estado = 'jugando';
}
$('#pSeguir').onclick = reanudar;
$('#pBitacora').onclick = () => {
	$('#pausa').classList.add('oculto');
	abrirBitacora(() => $('#pausa').classList.remove('oculto'));
};
$('#pMusica').onclick = alternarMusica;
$('#pMusica').textContent = '♪ MÚSICA: ' + (A.musicaOn ? 'SÍ' : 'NO');
$('#pSalir').onclick = () => {
	guardarPartida();
	location.reload();
};
function prepararInicio() {
	const d = partidaGuardada();
	const jugar = $('#btnJugar');
	const nueva = $('#btnNueva');
	if (d) {
		jugar.textContent = '▶ CONTINUAR · CUBIERTA ' + (d.piso + 1);
		nueva.classList.remove('oculto');
		const armas = (d.armas || []).length;
		$('#guardadoInfo').textContent = `Progreso guardado: cubierta ${d.piso + 1} de 3 · ${armas} arma${armas > 1 ? 's' : ''} · ${d.bytes || 0} bytes${d.terminalHecha ? ' · terminal resuelta' : ''}`;
	} else {
		jugar.textContent = '▶ JUGAR';
		nueva.classList.add('oculto');
		$('#guardadoInfo').textContent = '';
	}
}
prepararInicio();
$('#btnJugar').onclick = () => {
	iniciarAudio();
	$('#inicio').classList.add('oculto');
	partidaGuardada() ? continuarPartida() : nuevaPartida();
};
$('#btnNueva').onclick = () => {
	const b = $('#btnNueva');
	if (!b.dataset.seguro) {
		b.dataset.seguro = '1';
		b.textContent = '¿BORRAR PROGRESO? SÍ';
		setTimeout(() => {
			delete b.dataset.seguro;
			b.textContent = 'NUEVA PARTIDA';
		}, 3000);
		return;
	}
	iniciarAudio();
	$('#inicio').classList.add('oculto');
	nuevaPartida();
};
$('#btnBitacoraInicio').onclick = () => abrirBitacora();

// ─────────────────────────── ENTRADA ───────────────────────────
addEventListener('keydown', (e) => {
	const k = e.key.toLowerCase();
	if (quizTeclas && !$('#quiz').classList.contains('oculto')) {
		quizTeclas(e.key);
		return;
	}
	if (!$('#terminal').classList.contains('oculto')) {
		if (e.key === 'Escape') cerrarTerminal(false);
		return;
	}
	if (G.estado === 'dialogo' && (k === ' ' || k === 'enter' || k === 'e')) {
		e.preventDefault();
		avanzarDialogo();
		return;
	}
	teclas[k] = true;
	if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
	if (G.estado === 'jugando') {
		if (k === ' ' || k === 'shift') hacerDash();
		if (k === 'e') {
			const it = interactuable();
			if (it) it.fn();
		}
		if (k === 'q') cambiarArma();
		if (k === 'escape' || k === 'p') pausar();
	} else if (G.estado === 'pausa' && (k === 'escape' || k === 'p')) reanudar();
	if (k === 'm') alternarMusica();
});
addEventListener('keyup', (e) => (teclas[e.key.toLowerCase()] = false));
cv.addEventListener('mousemove', (e) => {
	const r = cv.getBoundingClientRect();
	raton.x = ((e.clientX - r.left) / r.width) * W;
	raton.y = ((e.clientY - r.top) / r.height) * H;
});
cv.addEventListener('mousedown', (e) => {
	if (e.button === 0) raton.abajo = true;
});
addEventListener('mouseup', () => (raton.abajo = false));
$('#dialogo').addEventListener('click', avanzarDialogo);
cv.addEventListener('contextmenu', (e) => e.preventDefault());

function hacerDash() {
	const j = G.j;
	if (j.dashCd > 0) return;
	let dx = 0,
		dy = 0;
	if (teclas.w || teclas.arrowup) dy--;
	if (teclas.s || teclas.arrowdown) dy++;
	if (teclas.a || teclas.arrowleft) dx--;
	if (teclas.d || teclas.arrowright) dx++;
	if (tactil.activo && Math.hypot(tactil.mx, tactil.my) > 0.2) ((dx = tactil.mx), (dy = tactil.my));
	if (!dx && !dy) ((dx = Math.cos(j.ang)), (dy = Math.sin(j.ang)));
	const m = Math.hypot(dx, dy);
	j.dashDir = [dx / m, dy / m];
	j.dash = 0.17;
	j.dashCd = 0.55;
	SFX.dash();
	particulas(j.x, j.y + 6, 8, ['#8f9bb5', '#d5dceb'], {vmax: 60, vida: 0.3, tipo: 'humo', tam: 3});
}

// táctil
const esTactil = matchMedia('(pointer: coarse)').matches;
if (esTactil) {
	const pal = $('#palanca'),
		bola = pal.querySelector('i');
	let idPal = null;
	const moverPal = (t) => {
		const r = pal.getBoundingClientRect();
		let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
		let dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
		const m = Math.hypot(dx, dy);
		if (m > 1) ((dx /= m), (dy /= m));
		tactil.mx = dx;
		tactil.my = dy;
		bola.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
	};
	pal.addEventListener('touchstart', (e) => {
		e.preventDefault();
		idPal = e.changedTouches[0].identifier;
		tactil.activo = true;
		moverPal(e.changedTouches[0]);
	});
	pal.addEventListener('touchmove', (e) => {
		e.preventDefault();
		for (const t of e.changedTouches) if (t.identifier === idPal) moverPal(t);
	});
	const soltarPal = (e) => {
		for (const t of e.changedTouches)
			if (t.identifier === idPal) {
				tactil.mx = tactil.my = 0;
				bola.style.transform = '';
				idPal = null;
			}
	};
	pal.addEventListener('touchend', soltarPal);
	pal.addEventListener('touchcancel', soltarPal);
	const boton = (id, abajo, arriba) => {
		const b = $(id);
		b.addEventListener('touchstart', (e) => {
			e.preventDefault();
			iniciarAudio();
			abajo();
		});
		if (arriba) b.addEventListener('touchend', (e) => (e.preventDefault(), arriba()));
	};
	boton('#btDisparo', () => (tactil.disparo = true), () => (tactil.disparo = false));
	boton('#btDash', () => G.estado === 'jugando' && hacerDash());
	boton('#btE', () => {
		if (G.estado === 'dialogo') return avanzarDialogo();
		const it = G.estado === 'jugando' && interactuable();
		if (it) it.fn();
	});
	boton('#btQ', () => G.estado === 'jugando' && cambiarArma());
	boton('#btPausa', () => (G.estado === 'pausa' ? reanudar() : pausar()));
}

// ─────────────────────────── ACTUALIZAR ───────────────────────────
function actualizar(dt) {
	G.t += dt;
	actualizarDialogo(dt);
	G.blanco = Math.max(0, (G.blanco || 0) - dt * 1.5);
	G.vineta = Math.max(0, (G.vineta || 0) - dt);
	G.temblor = Math.max(0, G.temblor - dt * 30);
	// efectos visuales siguen aunque el juego esté en cinemática
	actualizarParticulas(dt);
	if (G.transicion) {
		const tr = G.transicion;
		tr.t += dt;
		if (tr.t > 0.16 && !tr.cambiado) {
			tr.cambiado = true;
			entrarSala(tr.sig, tr.desde);
		}
		if (tr.t > 0.34) G.transicion = null;
		return;
	}
	if (G.estado !== 'jugando') return;
	const j = G.j;
	// movimiento
	let dx = 0,
		dy = 0;
	if (teclas.w || teclas.arrowup) dy--;
	if (teclas.s || teclas.arrowdown) dy++;
	if (teclas.a || teclas.arrowleft) dx--;
	if (teclas.d || teclas.arrowright) dx++;
	if (tactil.activo) ((dx += tactil.mx), (dy += tactil.my));
	const m = Math.hypot(dx, dy);
	if (m > 1) ((dx /= m), (dy /= m));
	j.mueve = m > 0.15;
	const vel = 132;
	if (j.dash > 0) {
		j.dash -= dt;
		mover(j, j.dashDir[0] * 360 * dt, j.dashDir[1] * 360 * dt);
		if (G.t % 0.03 < dt) G.part.push({x: j.x, y: j.y, vx: 0, vy: 0, vida: 0.22, max: 0.22, tipo: 'sombra', sprite: 'chispa_camina', frame: Math.floor(j.anim) % 4, escala: 1, dir: Math.cos(j.ang) < 0 ? -1 : 1});
	} else mover(j, dx * vel * dt, dy * vel * dt);
	if (j.mueve) {
		j.anim += dt * 9;
		if (Math.floor(j.anim) % 2 === 0 && G.t % 0.2 < dt) particulas(j.x, j.y + 14, 1, PAL[G.piso].suelo[2], {vmax: 20, vida: 0.4, tipo: 'humo', tam: 2});
	} else j.anim += dt * 4;
	j.cd -= dt;
	j.dashCd -= dt;
	j.inv -= dt;
	j.flash -= dt;
	j.avisoEnergia -= dt;
	j.retroceso = Math.max(0, j.retroceso - dt * 30);
	j.sinGolpe += dt;
	// escudo se regenera tras 3 s sin golpes
	if (j.sinGolpe > 3 && j.escudo < j.escudoMax) {
		j.regen = (j.regen || 0) + dt;
		if (j.regen > 0.9) {
			j.regen = 0;
			j.escudo++;
			SFX.escudo();
		}
	}
	j.energia = Math.min(j.energiaMax, j.energia + dt * 3);
	// apuntar
	if (tactil.activo || esTactil) {
		const obj = G.enemigos.filter((e) => e.aparece <= 0).sort((a, b) => dist(a, j) - dist(b, j))[0];
		if (obj) j.ang = Math.atan2(obj.y - (j.y - 6), obj.x - j.x);
		else if (j.mueve) j.ang = Math.atan2(dy, dx);
	}
	if (!esTactil) j.ang = Math.atan2(raton.y - (j.y - 6), raton.x - j.x);
	if (raton.abajo || tactil.disparo) disparar();
	intentarSalir();
	// telegrafos de aparición
	for (const tg of G.telegrafos) {
		tg.t += dt;
		if (tg.t >= tg.dur && !tg.hecho) {
			tg.hecho = true;
			const e = crearEnemigo(tg.tipo, tg.x, tg.y);
			particulas(e.x, e.y, 14, TIPOS[e.tipo].color, {vmax: 120, vida: 0.4});
		}
	}
	G.telegrafos = G.telegrafos.filter((t) => !t.hecho);
	// enemigos
	for (const e of [...G.enemigos]) {
		if (e.aparece > 0) {
			e.aparece -= dt;
			continue;
		}
		if (e.aturdido > 0) {
			e.aturdido -= dt;
			if (G.t % 0.15 < dt) particulas(e.x, e.y - e.r, 2, '#36E2FF', {vmax: 40, vida: 0.4});
			continue;
		}
		actualizarEnemigo(e, dt);
	}
	// balas
	for (const b of G.balas) {
		b.x += b.vx * dt;
		b.y += b.vy * dt;
		b.vida -= dt;
		if (b.x < -10 || b.y < -10 || b.x > W + 10 || b.y > H + 10) b.vida = 0;
		const tx = Math.floor(b.x / T),
			ty = Math.floor(b.y / T);
		if (b.vida > 0 && solido(G.sala, tx, ty)) {
			b.vida = 0;
			particulas(b.x - b.vx * dt, b.y - b.vy * dt, 4, [b.color, '#ffffff'], {vmax: 80, vida: 0.2});
			if (b.explota) explosion(b.x, b.y, 44, 30);
		}
		if (b.vida <= 0) continue;
		if (b.de === 'j') {
			for (const e of G.enemigos) {
				if (e.aparece > 0 || e.z > 20) continue;
				if (Math.hypot(e.x - b.x, e.y - (b.y + 4)) < e.r + b.r) {
					b.vida = 0;
					if (b.explota) explosion(b.x, b.y, 44, 30);
					else danarEnemigo(e, b.dmg, b.x - b.vx, b.y - b.vy);
					break;
				}
			}
			for (const br of G.sala.barriles) {
				if (b.vida > 0 && Math.hypot(br.x - b.x, br.y - b.y) < br.r + b.r) {
					b.vida = 0;
					danarBarril(br, b.dmg);
				}
			}
		} else if (Math.hypot(j.x - b.x, j.y - 4 - b.y) < j.r - 2 + b.r) {
			b.vida = 0;
			danarJugador(b.dmg);
		}
	}
	G.balas = G.balas.filter((b) => b.vida > 0);
	// recogibles con imán
	for (const p of G.recogibles) {
		p.t += dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vx *= 0.9;
		p.vy *= 0.9;
		const d = dist(p, j);
		if (p.t > 0.4 && d < 70) {
			const a = Math.atan2(j.y - p.y, j.x - p.x);
			p.x += Math.cos(a) * 260 * dt;
			p.y += Math.sin(a) * 260 * dt;
		}
		if (p.t > 0.25 && d < 14) {
			p.fuera = true;
			SFX.recoger();
			if (p.tipo === 'byte') {
				j.bytes++;
				G.stats.bytes++;
			} else if (p.tipo === 'energia') {
				j.energia = Math.min(j.energiaMax, j.energia + 14);
				textoFlotante(j.x, j.y - 22, '+14⚡', '#36E2FF');
			} else if (p.tipo === 'vida') {
				j.vida = Math.min(j.vidaMax, j.vida + 2);
				textoFlotante(j.x, j.y - 22, '+2♥', '#FF4D5E');
			}
		}
	}
	G.recogibles = G.recogibles.filter((p) => !p.fuera);
	// lógica de la sala
	const s = G.sala;
	if (s.estado === 'combate' && s.tipo !== 'jefe' && s.oleada > 0 && !G.enemigos.length && !G.telegrafos.length) {
		if (s.oleada < 2) {
			s.oleada++;
			oleada(s);
		} else {
			s.estado = 'limpia';
			SFX.puerta();
			aviso('✓ Sala limpia · puertas abiertas', '');
			guardarPartida();
			if (s.tipo === 'premio') {
				s.cofre = {x: W / 2, y: H / 2 + 6, abierto: false, t: 0};
				aviso('🎁 ¡Apareció un cofre!', 'ambar');
				particulas(W / 2, H / 2, 30, ['#FFB224', '#fff4c4'], {vmax: 160});
			}
		}
	}
	if (s.cofre) s.cofre.t += dt;
	if (s.portal) s.portal.t += dt;
	// pista de interacción
	const it = interactuable();
	const acc = $('#accion');
	if (it) {
		acc.classList.remove('oculto');
		const txt = (esTactil ? 'E · ' : '') + it.txt;
		if (acc.dataset.t !== txt) {
			acc.dataset.t = txt;
			acc.innerHTML = '';
			if (!esTactil) {
				const k = document.createElement('span');
				k.className = 'tecla';
				k.textContent = 'E';
				acc.append(k);
			}
			acc.append(document.createTextNode(txt));
		}
	} else acc.classList.add('oculto');
}
function actualizarParticulas(dt) {
	for (const p of G.part) {
		p.vida -= dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vy += (p.g || 0) * dt;
		if (p.tipo === 'humo') ((p.vx *= 0.94), (p.vy = p.vy * 0.94 - 12 * dt));
		else ((p.vx *= 0.92), (p.vy *= p.g ? 1 : 0.92));
	}
	G.part = G.part.filter((p) => p.vida > 0);
	for (const t of G.textos) ((t.vida -= dt), (t.y -= 30 * dt));
	G.textos = G.textos.filter((t) => t.vida > 0);
	for (const d of G.destellos) d.vida -= dt;
	G.destellos = G.destellos.filter((d) => d.vida > 0);
	if (G.fogonazo) G.fogonazo.vida -= dt;
	// vapor y respiraderos
	if (G.sala) {
		for (const d of G.sala.decor) {
			if (d.tipo === 'vapor' || d.tipo === 'ventila') {
				d.t += dt;
				if (d.t > (d.tipo === 'vapor' ? 0.35 : 0.5)) {
					d.t = 0;
					G.part.push({x: d.x + azar(-4, 4), y: d.y, vx: azar(-6, 6), vy: d.tipo === 'vapor' ? -22 : 14, vida: 1.4, max: 1.4, color: d.tipo === 'vapor' ? 'rgba(255,170,120,0.18)' : 'rgba(200,220,255,0.12)', tipo: 'nube', tam: azar(5, 9)});
				}
			}
		}
	}
}

// ─────────────────────────── DIBUJAR ───────────────────────────
function sprite(nombre, frame, x, y, o = {}) {
	const frames = (o.blanco ? IMG[nombre + '_blanco'] : IMG[nombre]) || IMG[nombre];
	const img = frames[Math.floor(frame) % frames.length];
	const esc = o.escala || 1;
	const w = img.width * esc,
		h = img.height * esc;
	ctx.save();
	ctx.translate(Math.round(x), Math.round(y));
	if (o.dir === -1) ctx.scale(-1, 1);
	if (o.alfa !== undefined) ctx.globalAlpha = o.alfa;
	if (o.sx) ctx.scale(o.sx, o.sy);
	ctx.drawImage(img, Math.round(-w / 2), Math.round(-h), w, h);
	ctx.restore();
}
function sombra(x, y, rx) {
	ctx.fillStyle = 'rgba(0,0,0,0.38)';
	ctx.beginPath();
	ctx.ellipse(x, y, rx, rx * 0.38, 0, 0, Math.PI * 2);
	ctx.fill();
}
function dibujar() {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.imageSmoothingEnabled = false;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, W, H);
	if (!G.sala) return;
	const s = G.sala,
		P = PAL[G.piso],
		t = G.t;
	ctx.save();
	if (G.temblor > 0) ctx.translate(Math.round(azar(-G.temblor, G.temblor) * 0.5), Math.round(azar(-G.temblor, G.temblor) * 0.5));
	ctx.drawImage(s.fondo, 0, 0);
	// brillos del piso que laten
	ctx.globalCompositeOperation = 'lighter';
	for (const b of s.brillos) {
		ctx.globalAlpha = 0.18 + 0.14 * Math.sin(t * 2 + b.fase);
		ctx.drawImage(brillo(b.color), b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
	}
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-over';
	// decoración animada en paredes y racks
	for (const d of s.decor) {
		if (d.tipo === 'pantalla') {
			ctx.fillStyle = '#04070f';
			ctx.fillRect(d.x, d.y, d.w, d.h);
			ctx.strokeStyle = P.neon;
			ctx.globalAlpha = 0.85;
			ctx.beginPath();
			for (let k = 0; k <= d.w; k += 2) {
				const yy = d.y + d.h / 2 + Math.sin(k * 0.5 + t * 6 + d.fase) * (d.h / 3) * Math.sin(t + d.fase);
				k ? ctx.lineTo(d.x + k, yy) : ctx.moveTo(d.x + k, yy);
			}
			ctx.stroke();
			ctx.globalAlpha = 1;
		} else if (d.tipo === 'luz') {
			const on = Math.sin(t * 3 + d.fase) > -0.6;
			ctx.fillStyle = on ? P.acento : '#3a2a10';
			ctx.fillRect(d.x - 3, d.y - 2, 6, 4);
		} else if (d.tipo === 'led') {
			ctx.fillStyle = Math.sin(t * 5 + d.fase) > 0 ? d.color : '#1a1424';
			ctx.fillRect(d.x, d.y, 2, 2);
		} else if (d.tipo === 'nucleo') {
			ctx.fillStyle = `rgba(255,${120 + Math.sin(t * 4 + d.fase) * 60},40,0.9)`;
			ctx.fillRect(d.x - 4, d.y - 8, 8, 16);
		} else if (d.tipo === 'ventila') {
			ctx.fillStyle = '#05070d';
			ctx.fillRect(d.x - 8, d.y - 4, 16, 8);
			ctx.fillStyle = P.pared[2];
			for (let k = -6; k < 8; k += 3) ctx.fillRect(d.x + k, d.y - 4, 1, 8);
		}
	}
	// puertas: barreras láser o selladas
	for (const d of ['n', 's', 'e', 'o']) {
		if (!s.puertas[d]) continue;
		const cerrada = puertaCerrada(s, d);
		if (!cerrada) continue;
		const sellada = s.sellada === d;
		const col = sellada ? '#FF4D5E' : P.neon;
		ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 12);
		ctx.fillStyle = col;
		if (d === 'n' || d === 's') {
			const y = d === 'n' ? T - 6 : H - T + 2;
			for (let k = 0; k < 3; k++) ctx.fillRect(9 * T, y + k * 2, 2 * T, 1);
		} else {
			const x = d === 'o' ? T - 6 : W - T + 2;
			for (let k = 0; k < 3; k++) ctx.fillRect(x + k * 2, 5 * T, 1, 3 * T);
		}
		ctx.globalAlpha = 1;
		if (sellada) {
			const [cx, cy] = d === 'n' ? [W / 2, T - 10] : d === 's' ? [W / 2, H - T + 8] : d === 'o' ? [T - 10, 6.5 * T] : [W - T + 10, 6.5 * T];
			ctx.fillStyle = '#05070d';
			ctx.fillRect(cx - 8, cy - 6, 16, 13);
			ctx.fillStyle = '#FF4D5E';
			ctx.fillRect(cx - 6, cy - 2, 12, 8);
			ctx.strokeStyle = '#FF4D5E';
			ctx.beginPath();
			ctx.arc(cx, cy - 3, 4, Math.PI, 0);
			ctx.stroke();
		}
	}
	// portal
	if (s.portal) {
		const p = s.portal;
		for (let k = 0; k < 4; k++) {
			ctx.strokeStyle = ['#C6FF3D', '#36E2FF', '#FF5FD2', '#ffffff'][k];
			ctx.globalAlpha = 0.8;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.ellipse(p.x, p.y, 22 - k * 4 + Math.sin(t * 4 + k) * 2, (22 - k * 4) * 0.5, 0, t * (k % 2 ? 2 : -2), t * (k % 2 ? 2 : -2) + Math.PI * 1.6);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		if (G.t % 0.1 < 0.02) particulas(p.x + azar(-14, 14), p.y, 1, ['#C6FF3D', '#36E2FF'], {ang: -Math.PI / 2, abre: 0.3, vmin: 30, vmax: 60, vida: 0.8});
	}
	// telegrafos de aparición
	for (const tg of G.telegrafos) {
		const k = tg.t / tg.dur;
		ctx.strokeStyle = '#FF4D5E';
		ctx.globalAlpha = 0.9;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.ellipse(tg.x, tg.y + 8, 16 * (1 - k) + 4, (16 * (1 - k) + 4) * 0.45, 0, 0, Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = `rgba(255,77,94,${0.25 * k})`;
		ctx.beginPath();
		ctx.ellipse(tg.x, tg.y + 8, 14, 6, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;
	}
	// línea de embestida del rey
	if (G.lineaJefe) {
		const l = G.lineaJefe;
		ctx.strokeStyle = `rgba(255,77,94,${0.4 + 0.5 * Math.sin(t * 30)})`;
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.moveTo(l.x, l.y);
		ctx.lineTo(l.x + Math.cos(l.ang) * 700, l.y + Math.sin(l.ang) * 700);
		ctx.stroke();
		ctx.lineWidth = 1;
	}
	// lista de cosas a dibujar ordenadas por y
	const cosas = [];
	const j = G.j;
	if (s.cofre) cosas.push({y: s.cofre.y, f: () => dibujarCofre(s.cofre)});
	if (s.terminal) cosas.push({y: s.terminal.y + 10, f: () => dibujarTerminal(s.terminal)});
	if (s.ori) cosas.push({y: s.ori.y + 10, f: () => dibujarOriHolo(s.ori.x, s.ori.y)});
	for (const b of s.barriles) cosas.push({y: b.y + 8, f: () => dibujarBarril(b)});
	for (const e of G.enemigos) cosas.push({y: e.y + e.r, f: () => dibujarEnemigo(e)});
	if (G.estado !== 'muerto' && G.estado !== 'fin') cosas.push({y: j.y + 10, f: () => dibujarJugador(j)});
	cosas.sort((a, b) => a.y - b.y).forEach((c) => c.f());
	// recogibles
	for (const p of G.recogibles) {
		const yb = p.y + Math.sin(p.t * 6) * 2;
		if (p.tipo === 'byte') {
			ctx.fillStyle = '#FFB224';
			ctx.fillRect(Math.round(p.x) - 2, Math.round(yb) - 2, 4, 4);
			ctx.fillStyle = '#fff4c4';
			ctx.fillRect(Math.round(p.x) - 2, Math.round(yb) - 2, 2, 2);
		} else if (p.tipo === 'energia') {
			ctx.fillStyle = '#36E2FF';
			ctx.beginPath();
			ctx.moveTo(p.x, yb - 5);
			ctx.lineTo(p.x + 4, yb);
			ctx.lineTo(p.x, yb + 5);
			ctx.lineTo(p.x - 4, yb);
			ctx.fill();
		} else {
			ctx.fillStyle = '#FF4D5E';
			ctx.fillRect(p.x - 4, yb - 3, 3, 3);
			ctx.fillRect(p.x + 1, yb - 3, 3, 3);
			ctx.fillRect(p.x - 4, yb - 1, 8, 3);
			ctx.fillRect(p.x - 2, yb + 2, 4, 2);
		}
	}
	// balas
	for (const b of G.balas) {
		if (b.de === 'j') {
			const m = Math.hypot(b.vx, b.vy);
			const lx = (b.vx / m) * (b.r * 3),
				ly = (b.vy / m) * (b.r * 3);
			ctx.strokeStyle = b.color;
			ctx.lineWidth = b.r * 1.6;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(b.x - lx, b.y - ly);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = b.r * 0.7;
			ctx.beginPath();
			ctx.moveTo(b.x - lx * 0.5, b.y - ly * 0.5);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
			ctx.lineCap = 'butt';
		} else {
			ctx.fillStyle = b.color;
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.r + 1, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.r - 1.5, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	// partículas
	for (const p of G.part) {
		const k = p.vida / p.max;
		if (p.tipo === 'anillo') {
			ctx.strokeStyle = p.color;
			ctx.globalAlpha = k;
			ctx.lineWidth = 3 * k + 1;
			ctx.beginPath();
			ctx.ellipse(p.x, p.y, p.rmax * (1 - k), p.rmax * (1 - k) * 0.6, 0, 0, Math.PI * 2);
			ctx.stroke();
		} else if (p.tipo === 'sombra') {
			sprite(p.sprite, p.frame, p.x, p.y + (p.sprite === 'chispa_camina' ? 17 : 28 * p.escala), {alfa: k * (p.sprite === 'chispa_camina' ? 0.45 : 0.22), escala: p.escala, dir: p.dir, blanco: p.sprite === 'chispa_camina'});
		} else if (p.tipo === 'nube') {
			ctx.fillStyle = p.color;
			ctx.globalAlpha = Math.min(1, k * 2);
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.tam * (1.6 - k), 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.globalAlpha = p.tipo === 'humo' ? k * 0.6 : Math.min(1, k * 1.5);
			ctx.fillStyle = p.color;
			const tam = p.tipo === 'humo' ? p.tam * (2 - k) : p.tam;
			ctx.fillRect(Math.round(p.x - tam / 2), Math.round(p.y - tam / 2), Math.ceil(tam), Math.ceil(tam));
		}
		ctx.globalAlpha = 1;
	}
	// ── iluminación
	lctx.globalCompositeOperation = 'source-over';
	lctx.clearRect(0, 0, W, H);
	lctx.fillStyle = P.sombra;
	lctx.fillRect(0, 0, W, H);
	lctx.globalCompositeOperation = 'destination-out';
	const luz = (x, y, r, a = 1) => {
		lctx.globalAlpha = a;
		lctx.drawImage(agujero, x - r, y - r, r * 2, r * 2);
	};
	luz(j.x, j.y - 6, 150 + Math.sin(t * 3) * 4);
	for (const d of s.decor) if (d.tipo === 'luz' || d.tipo === 'pantalla') luz(d.x + (d.w || 0) / 2, d.y + 20, 70, 0.7);
	for (const b of s.brillos) luz(b.x, b.y, b.r * 1.8, 0.5);
	for (const b of G.balas) luz(b.x, b.y, b.de === 'j' ? 26 : 22, 0.8);
	for (const e of G.enemigos) if (e.jefe) luz(e.x, e.y - 20, 120, 0.8);
	for (const d of G.destellos) luz(d.x, d.y, d.r, d.vida / d.max);
	if (s.cofre) luz(s.cofre.x, s.cofre.y, 70, 0.8);
	if (s.terminal) luz(s.terminal.x, s.terminal.y, 90, 0.9);
	if (s.ori) luz(s.ori.x, s.ori.y, 80, 0.9);
	if (s.portal) luz(s.portal.x, s.portal.y, 110);
	lctx.globalAlpha = 1;
	ctx.drawImage(luzCv, 0, 0);
	// ── resplandor aditivo
	ctx.globalCompositeOperation = 'lighter';
	for (const b of G.balas) {
		const r = b.de === 'j' ? b.r * 5 : b.r * 4;
		ctx.globalAlpha = 0.55;
		ctx.drawImage(brillo(b.color), b.x - r, b.y - r, r * 2, r * 2);
	}
	for (const d of s.decor) {
		if (d.tipo === 'luz' && Math.sin(t * 3 + d.fase) > -0.6) {
			ctx.globalAlpha = 0.5;
			ctx.drawImage(brillo(P.acento), d.x - 14, d.y - 12, 28, 28);
		}
		if (d.tipo === 'nucleo') {
			ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 4 + d.fase);
			ctx.drawImage(brillo('#FF7A1A'), d.x - 20, d.y - 22, 40, 40);
		}
	}
	for (const d of G.destellos) {
		ctx.globalAlpha = d.vida / d.max;
		ctx.drawImage(brillo(d.color), d.x - d.r * 0.6, d.y - d.r * 0.6, d.r * 1.2, d.r * 1.2);
	}
	if (G.fogonazo && G.fogonazo.vida > 0) {
		ctx.globalAlpha = 0.9;
		ctx.drawImage(brillo(G.fogonazo.color), G.fogonazo.x - 14, G.fogonazo.y - 14, 28, 28);
	}
	if (s.portal) {
		ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 5);
		ctx.drawImage(brillo('#C6FF3D'), s.portal.x - 50, s.portal.y - 40, 100, 80);
	}
	if (s.terminal) {
		ctx.globalAlpha = 0.35;
		ctx.drawImage(brillo(s.terminal.resuelto ? '#C6FF3D' : '#36E2FF'), s.terminal.x - 40, s.terminal.y - 50, 80, 80);
	}
	for (const p of G.recogibles) {
		ctx.globalAlpha = 0.6;
		const c = p.tipo === 'byte' ? '#FFB224' : p.tipo === 'energia' ? '#36E2FF' : '#FF4D5E';
		ctx.drawImage(brillo(c), p.x - 10, p.y - 10, 20, 20);
	}
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-over';
	// textos flotantes
	for (const tx of G.textos) {
		ctx.globalAlpha = Math.min(1, tx.vida * 2.5);
		ctx.font = (tx.grande ? 'bold 14px' : '10px') + ' Silkscreen, monospace';
		ctx.textAlign = 'center';
		ctx.fillStyle = '#000';
		ctx.fillText(tx.txt, tx.x + 1, tx.y + 1);
		ctx.fillStyle = tx.color;
		ctx.fillText(tx.txt, tx.x, tx.y);
	}
	ctx.globalAlpha = 1;
	ctx.restore();
	// mira
	if (!esTactil && G.estado === 'jugando') {
		const mx = Math.round(raton.x),
			my = Math.round(raton.y);
		const w = ARMAS[j.armas[j.ai]];
		ctx.strokeStyle = w.color;
		ctx.lineWidth = 1;
		const r = 6 + (j.cd > 0 ? 2 : 0);
		ctx.beginPath();
		ctx.arc(mx + 0.5, my + 0.5, r, 0, Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = w.color;
		ctx.fillRect(mx - r - 4, my, 3, 1);
		ctx.fillRect(mx + r + 2, my, 3, 1);
		ctx.fillRect(mx, my - r - 4, 1, 3);
		ctx.fillRect(mx, my + r + 2, 1, 3);
	}
	// viñeta de daño, destello blanco y fundido de transición
	if (G.vineta > 0) {
		const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
		g.addColorStop(0, 'rgba(255,0,40,0)');
		g.addColorStop(1, `rgba(255,0,40,${G.vineta * 0.7})`);
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, H);
	}
	if (G.blanco > 0) {
		ctx.fillStyle = `rgba(255,255,255,${Math.min(1, G.blanco)})`;
		ctx.fillRect(0, 0, W, H);
	}
	if (G.transicion) {
		const k = G.transicion.t < 0.16 ? G.transicion.t / 0.16 : 1 - (G.transicion.t - 0.16) / 0.18;
		ctx.fillStyle = `rgba(0,0,0,${limitar(k, 0, 1)})`;
		ctx.fillRect(0, 0, W, H);
	}
}
function dibujarJugador(j) {
	const izq = Math.cos(j.ang) < 0;
	const parpadeo = j.inv > 0 && Math.floor(G.t * 20) % 2 === 0;
	sombra(j.x, j.y + 15, 10);
	if (parpadeo) return;
	const nombre = j.mueve ? 'chispa_camina' : 'chispa';
	sprite(nombre, j.anim, j.x, j.y + 17, {dir: izq ? -1 : 1, blanco: j.flash > 0});
	// arma
	const w = ARMAS[j.armas[j.ai]];
	const largo = j.armas[j.ai] === 'submit' ? 15 : j.armas[j.ai] === 'keydown' ? 14 : 11;
	ctx.save();
	ctx.translate(j.x + (izq ? -4 : 4), j.y + 2);
	ctx.rotate(j.ang);
	if (izq) ctx.scale(1, -1);
	ctx.translate(-j.retroceso, 0);
	ctx.fillStyle = '#0b0d17';
	ctx.fillRect(1, -4, largo + 2, 7);
	ctx.fillStyle = '#56607c';
	ctx.fillRect(2, -3, largo, 5);
	ctx.fillStyle = '#8f9bb5';
	ctx.fillRect(2, -3, largo, 1);
	ctx.fillStyle = w.color;
	ctx.fillRect(largo - 2, -3, 3, 5);
	ctx.fillRect(4, -1, 4, 1);
	ctx.restore();
}
function dibujarEnemigo(e) {
	const d = TIPOS[e.tipo];
	const esc = (d.escala || 1) * (e.jefe ? 2 : 1);
	const img = IMG[d.sprite][0];
	sombra(e.x, e.y + e.r * 0.9, e.r * (e.z > 0 ? Math.max(0.4, 1 - e.z / 80) : 1));
	if (e.aparece > 0) {
		ctx.globalAlpha = 1 - e.aparece;
	}
	let nombre = d.sprite;
	if (e.tipo === 'torreta' && e.estado === 'carga') nombre = 'torreta_carga';
	const sx = e.tipo === 'null' || e.tipo === 'nullito' || e.tipo === 'granNull' ? (e.estado === 'salta' ? 0.9 : 1 + Math.sin(G.t * 6 + e.t) * 0.04) : 1;
	const sy = sx === 1 ? 1 : 2 - sx;
	sprite(nombre, e.frame, e.x, e.y + e.r * 0.9 - e.z, {escala: esc, dir: e.dir, blanco: e.flash > 0, sx, sy});
	ctx.globalAlpha = 1;
	if (e.invulnerable) {
		ctx.strokeStyle = `rgba(54,226,255,${0.6 + 0.3 * Math.sin(G.t * 10)})`;
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(e.x, e.y - img.height * esc * 0.4, img.height * esc * 0.7, 0, Math.PI * 2);
		ctx.stroke();
		ctx.lineWidth = 1;
	}
	if (e.aturdido > 0) {
		ctx.font = '10px Silkscreen, monospace';
		ctx.fillStyle = '#36E2FF';
		ctx.textAlign = 'center';
		ctx.fillText('¡ATURDIDO!', e.x, e.y - img.height * esc - 4);
	}
	// vida de enemigos comunes
	if (!e.jefe && e.vida < e.vidaMax) {
		ctx.fillStyle = '#000';
		ctx.fillRect(e.x - 10, e.y - img.height * esc - 2, 20, 3);
		ctx.fillStyle = '#FF4D5E';
		ctx.fillRect(e.x - 10, e.y - img.height * esc - 2, 20 * (e.vida / e.vidaMax), 3);
	}
}
function dibujarBarril(b) {
	sombra(b.x, b.y + 8, 9);
	const x = Math.round(b.x - 8),
		y = Math.round(b.y - 12);
	ctx.fillStyle = '#0b0d17';
	ctx.fillRect(x - 1, y - 1, 18, 22);
	ctx.fillStyle = b.flash > 0 ? '#ffffff' : '#a3263a';
	ctx.fillRect(x, y, 16, 20);
	ctx.fillStyle = '#e05a6a';
	ctx.fillRect(x + 2, y, 3, 20);
	ctx.fillStyle = '#5a1020';
	ctx.fillRect(x, y + 5, 16, 2);
	ctx.fillRect(x, y + 13, 16, 2);
	ctx.fillStyle = '#FFB224';
	ctx.fillRect(x + 6, y + 7, 4, 5);
	ctx.fillStyle = '#0b0d17';
	ctx.fillRect(x + 7, y + 8, 2, 2);
	b.flash = Math.max(0, b.flash - 1 / 60);
}
function dibujarCofre(c) {
	sombra(c.x, c.y + 10, 16);
	const x = Math.round(c.x - 14),
		y = Math.round(c.y - 14);
	const abierto = c.abierto;
	const salto = abierto ? 0 : Math.abs(Math.sin(c.t * 3)) * -2;
	ctx.fillStyle = '#0b0d17';
	ctx.fillRect(x - 1, y - 1 + salto, 30, 26);
	ctx.fillStyle = '#77480b';
	ctx.fillRect(x, y + 8 + salto, 28, 16);
	ctx.fillStyle = '#c98a14';
	ctx.fillRect(x, y + 8 + salto, 28, 3);
	ctx.fillStyle = abierto ? '#331f05' : '#ffcb3f';
	ctx.fillRect(x, y + salto - (abierto ? 6 : 0), 28, 9);
	ctx.fillStyle = '#fff4c4';
	ctx.fillRect(x + 2, y + 1 + salto - (abierto ? 6 : 0), 24, 1);
	ctx.fillStyle = '#36E2FF';
	ctx.fillRect(x + 11, y + 6 + salto, 6, 6);
	if (!abierto) {
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = 0.4 + 0.2 * Math.sin(c.t * 4);
		ctx.drawImage(brillo('#FFB224'), c.x - 26, c.y - 30, 52, 52);
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = 'source-over';
		ctx.font = 'bold 12px Silkscreen, monospace';
		ctx.textAlign = 'center';
		ctx.fillStyle = '#FFB224';
		ctx.fillText('?', c.x, y - 6 + Math.sin(c.t * 4) * 2);
	}
}
function dibujarTerminal(tm) {
	sombra(tm.x, tm.y + 18, 16);
	const x = Math.round(tm.x - 14),
		y = Math.round(tm.y - 18);
	ctx.fillStyle = '#0b0d17';
	ctx.fillRect(x - 1, y - 1, 30, 38);
	ctx.fillStyle = '#2f3650';
	ctx.fillRect(x, y, 28, 36);
	ctx.fillStyle = '#56607c';
	ctx.fillRect(x, y, 28, 2);
	ctx.fillStyle = '#04070f';
	ctx.fillRect(x + 3, y + 4, 22, 16);
	const col = tm.resuelto ? '#C6FF3D' : '#36E2FF';
	ctx.fillStyle = col;
	for (let k = 0; k < 4; k++) {
		const w = 4 + ((Math.floor(G.t * 3) + k * 3) % 12);
		ctx.fillRect(x + 5, y + 6 + k * 3, w, 1);
	}
	ctx.fillStyle = '#1b2240';
	ctx.fillRect(x + 3, y + 24, 22, 8);
	for (let k = 0; k < 5; k++) ((ctx.fillStyle = '#8f9bb5'), ctx.fillRect(x + 5 + k * 4, y + 26, 2, 2));
	dibujarOriHolo(tm.x, y - 18, 0.75);
}
function dibujarOriHolo(x, y, a = 1) {
	ctx.globalAlpha = a * (0.8 + 0.2 * Math.sin(G.t * 8));
	sprite('ori', G.t * 4, x, y + 14 + Math.sin(G.t * 2) * 2, {escala: 1});
	ctx.globalAlpha = 1;
}

// ─────────────────────────── HUD ───────────────────────────
const hudPrevio = {};
function setHud(id, prop, val) {
	if (hudPrevio[id + prop] === val) return;
	hudPrevio[id + prop] = val;
	const el = document.getElementById(id);
	if (prop === 'text') el.textContent = val;
	else el.style.transform = `scaleX(${val})`;
}
function actualizarHud() {
	const j = G.j;
	if (!j) return;
	const obj = objetivoActual();
	if (hudPrevio.objetivo !== obj) {
		hudPrevio.objetivo = obj;
		const o = $('#objetivo');
		o.textContent = obj ? '▸ ' + obj : '';
		o.classList.remove('nuevo');
		void o.offsetWidth;
		o.classList.add('nuevo');
	}
	$('#controles').classList.toggle('oculto', esTactil || G.piso > 0 || G.t - (G.inicioJuego || 0) > 25 || G.estado !== 'jugando');
	setHud('bVida', 'scale', limitar(j.vida / j.vidaMax, 0, 1));
	setHud('tVida', 'text', `${Math.max(0, j.vida)}/${j.vidaMax}`);
	setHud('bEscudo', 'scale', limitar(j.escudo / j.escudoMax, 0, 1));
	setHud('tEscudo', 'text', `${j.escudo}/${j.escudoMax}`);
	setHud('bEnergia', 'scale', limitar(j.energia / j.energiaMax, 0, 1));
	setHud('tEnergia', 'text', String(Math.floor(j.energia)));
	setHud('tBytes', 'text', String(j.bytes));
	const id = j.armas[j.ai];
	const w = ARMAS[id];
	setHud('aNom', 'text', w.nombre);
	setHud('aEv', 'text', `addEventListener('${w.evento}')`);
	setHud('aCosto', 'text', `Costo: ${w.costo} ⚡ · ${j.armas.length} arma${j.armas.length > 1 ? 's · Q cambia' : ''}`);
	$('#arma').style.borderColor = w.color;
	$('#aNom').style.color = w.color;
	const jefe = G.enemigos.find((e) => e.jefe);
	if (jefe) setHud('bJefe', 'scale', limitar(jefe.vida / jefe.vidaMax, 0, 1));
	dibujarMapa();
}
function objetivoActual() {
	if (!G.salas.size) return '';
	const salas = [...G.salas.values()];
	const C = CUBIERTAS[G.piso];
	const jefe = salas.find((s) => s.tipo === 'jefe');
	const term = salas.find((s) => s.tipo === 'terminal');
	if (jefe.portal) return 'Entra al portal de la sala del jefe';
	if (jefe.estado === 'combate') return 'Derrota a ' + C.jefeNombre;
	if (G.sala.estado === 'combate') return 'Elimina a todos los bugs para abrir las puertas';
	if (!term.visitada) return 'Busca la terminal de ORI (cian en el mapa)';
	if (!term.terminal.resuelto) return 'Hackea la terminal de ORI con JavaScript';
	return 'Cruza la puerta roja: el jefe te espera';
}
function dibujarMapa() {
	const m = $('#mapa').getContext('2d');
	m.clearRect(0, 0, 110, 110);
	if (!G.sala) return;
	const c = 14;
	const ox = 55 - G.sala.gx * c - c / 2,
		oy = 55 - G.sala.gy * c - c / 2;
	for (const s of G.salas.values()) {
		const vecinaVisitada = Object.entries(DIRS).some(([d, [dx, dy]]) => s.puertas[d] && G.salas.get(clave(s.gx + dx, s.gy + dy))?.visitada);
		if (!s.visitada && !vecinaVisitada) continue;
		const x = ox + s.gx * c,
			y = oy + s.gy * c;
		m.fillStyle = s === G.sala ? '#C6FF3D' : s.visitada ? '#56607c' : '#1d2440';
		m.fillRect(x + 2, y + 2, c - 4, c - 4);
		m.fillStyle = '#2f3650';
		if (s.puertas.e) m.fillRect(x + c - 2, y + c / 2 - 1, 4, 2);
		if (s.puertas.s) m.fillRect(x + c / 2 - 1, y + c - 2, 2, 4);
		const icono = {jefe: '#FF4D5E', cofre: '#FFB224', terminal: '#36E2FF', premio: '#FFB224'}[s.tipo];
		if (icono && (s.visitada || s.tipo === 'jefe')) {
			m.fillStyle = icono;
			m.fillRect(x + c / 2 - 2, y + c / 2 - 2, 4, 4);
		}
	}
}

// ─────────────────────────── PANTALLA DE INICIO ───────────────────────────
(function inicio() {
	const est = $('#estrellas');
	const ec = est.getContext('2d');
	const estrellas = Array.from({length: 120}, () => ({x: Math.random(), y: Math.random(), v: azar(0.02, 0.12), b: Math.random()}));
	const hc = $('#heroeInicio').getContext('2d');
	hc.imageSmoothingEnabled = false;
	function animar() {
		if ($('#inicio').classList.contains('oculto')) return;
		est.width = innerWidth;
		est.height = innerHeight;
		for (const s of estrellas) {
			s.y += s.v / 60;
			if (s.y > 1) s.y = 0;
			ec.fillStyle = `rgba(242,245,250,${0.3 + s.b * 0.7})`;
			ec.fillRect(Math.floor(s.x * est.width), Math.floor(s.y * est.height), s.b > 0.8 ? 2 : 1, s.b > 0.8 ? 2 : 1);
		}
		hc.clearRect(0, 0, 150, 160);
		const tt = performance.now() / 1000;
		const img = IMG.chispa_camina[Math.floor(tt * 7) % 4];
		hc.drawImage(img, 15, 8 + Math.sin(tt * 3) * 3, img.width * 4, img.height * 4);
		requestAnimationFrame(animar);
	}
	animar();
})();

// ─────────────────────────── BUCLE ───────────────────────────
let ultimo = performance.now();
function bucle(ahora) {
	let dt = Math.min(0.033, (ahora - ultimo) / 1000);
	ultimo = ahora;
	if (G.congelar > 0) {
		G.congelar -= dt;
		dt = 0;
	}
	if (G.camaraLenta > 0) {
		G.camaraLenta -= dt;
		dt *= 0.35;
	}
	if (G.estado !== 'inicio') {
		actualizar(dt);
		dibujar();
		actualizarHud();
	}
	requestAnimationFrame(bucle);
}
requestAnimationFrame(bucle);
if (esTactil) $('#tactil').classList.add('oculto');
const mostrarTactil = () => esTactil && $('#tactil').classList.toggle('oculto', !['jugando', 'dialogo'].includes(G.estado));
setInterval(mostrarTactil, 250);
