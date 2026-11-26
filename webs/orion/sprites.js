// ════════════════════════════════════════════════════════════════
//  Personajes de ORIÓN: CAZA DE BUGS — pixel art con volumen.
//  Cada personaje se "esculpe" con esferas, cajas, anillos y cilindros
//  iluminados desde arriba a la izquierda, se cuantiza a 5 tonos con
//  tramado (Bayer 4×4) y se le pone contorno. Así hay volumen real y
//  animaciones suaves de 4 cuadros.
// ════════════════════════════════════════════════════════════════

const RAMPAS = {
	blanco: ['#2a3148', '#5b6680', '#a9b4c9', '#e3e9f4', '#ffffff'],
	acero: ['#141826', '#2f3650', '#56607c', '#8f9bb5', '#d5dceb'],
	visor: ['#041824', '#0a3d57', '#1590b3', '#36e2ff', '#d2faff'],
	rojo: ['#33070f', '#741424', '#cf2d43', '#ff6b7c', '#ffd6db'],
	cabeza: ['#140408', '#2e0a12', '#561421', '#8a2335', '#c9485c'],
	verde: ['#082a1b', '#135437', '#2b9c55', '#8be04a', '#eaffb8'],
	morado: ['#170c2e', '#36206a', '#6545c4', '#a07cff', '#e6dcff'],
	oro: ['#331f05', '#77480b', '#c98a14', '#ffcb3f', '#fff4c4'],
	naranja: ['#361105', '#882c0b', '#e2601b', '#ffa24b', '#ffe4bc'],
	lima: ['#1f2c08', '#4a6d12', '#8cc11d', '#c6ff3d', '#f6ffd6'],
	nucleo: ['#3a0505', '#a3150f', '#ff4d1a', '#ffb224', '#fff7cc'],
	pantalla: ['#05070d', '#0b1020', '#121a33', '#1b2648', '#26345e'],
};
const NEGRO = '#0b0d17';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const LUZ = (() => {
	const v = [-0.5, -0.62, 0.6];
	const m = Math.hypot(...v);
	return v.map((x) => x / m);
})();

function lienzo(w, h) {
	return {w, h, c: new Array(w * h).fill(null), z: new Float32Array(w * h).fill(-1e9)};
}
function tono(rampa, i, x, y) {
	const n = rampa.length - 1;
	const f = Math.max(0, Math.min(1, i)) * n;
	let k = Math.floor(f);
	// tramado solo en una franja estrecha entre tonos: sombras limpias, transiciones suaves
	const r = f - k;
	if (r > 0.7 || (r > 0.42 && r - 0.42 > ((BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) * 0.28)) k++;
	return rampa[Math.min(n, k)];
}
function poner(L, x, y, color, z) {
	x = Math.round(x);
	y = Math.round(y);
	if (x < 0 || y < 0 || x >= L.w || y >= L.h) return;
	const i = y * L.w + x;
	if (z >= L.z[i]) {
		L.z[i] = z;
		L.c[i] = color;
	}
}
const luzDe = (nx, ny, nz, amb = 0.22) => amb + (1 - amb) * Math.max(0, nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]);

// Esfera / elipsoide
function bola(L, cx, cy, rx, ry, rampa, z = 0, o = {}) {
	const {corteAbajo = Infinity, amb = 0.22, brillo = true} = o;
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		if (y > corteAbajo) continue;
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const u = (x + 0.5 - cx) / rx;
			const v = (y + 0.5 - cy) / ry;
			const d = u * u + v * v;
			if (d > 1) continue;
			const nz = Math.sqrt(1 - d);
			let i = luzDe(u, v, nz, amb);
			let col = tono(rampa, i, x, y);
			if (brillo && u * LUZ[0] + v * LUZ[1] + nz * LUZ[2] > 0.965) col = '#ffffff';
			poner(L, x, y, col, z + nz * Math.min(rx, ry));
		}
	}
}
// Caja con bisel (metal, pantallas)
function caja(L, x0, y0, w, h, rampa, z = 0, o = {}) {
	const {radio = 1, base = 0.5, bisel = 1} = o;
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			const dx = Math.min(x - x0, x0 + w - 1 - x);
			const dy = Math.min(y - y0, y0 + h - 1 - y);
			if (dx + dy < radio) continue;
			let i = base;
			if (y - y0 < bisel) i += 0.32;
			else if (y0 + h - 1 - y < bisel) i -= 0.3;
			if (x - x0 < bisel) i += 0.14;
			else if (x0 + w - 1 - x < bisel) i -= 0.16;
			poner(L, x, y, tono(rampa, i, x, y), z);
		}
	}
}
// Cilindro vertical (cuerpos de fantasma)
function cilindro(L, cx, y0, y1, rx, rampa, z = 0, fondo = null) {
	for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
		const u = (x + 0.5 - cx) / rx;
		if (Math.abs(u) > 1) continue;
		const nz = Math.sqrt(1 - u * u);
		const yFin = fondo ? fondo(x) : y1;
		for (let y = y0; y <= yFin; y++) {
			const i = luzDe(u, 0.25, nz) - (y - y0) * 0.015;
			poner(L, x, y, tono(rampa, i, x, y), z + nz * rx);
		}
	}
}
// Anillo con volumen (toro visto de frente)
function anillo(L, cx, cy, r0, r1, rampa, z = 0) {
	for (let y = Math.floor(cy - r1); y <= Math.ceil(cy + r1); y++) {
		for (let x = Math.floor(cx - r1); x <= Math.ceil(cx + r1); x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			const d = Math.hypot(dx, dy);
			if (d < r0 || d > r1) continue;
			const s = ((d - r0) / (r1 - r0)) * 2 - 1;
			const nz = Math.sqrt(Math.max(0, 1 - s * s));
			poner(L, x, y, tono(rampa, luzDe((dx / d) * s, (dy / d) * s, nz), x, y), z + nz * 2);
		}
	}
}
function linea(L, x0, y0, x1, y1, color, z = 50) {
	const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
	for (let k = 0; k <= n; k++) poner(L, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, color, z);
}
// Estampa pixel a pixel: filas de texto + mapa de colores
function estampa(L, x0, y0, filas, mapa, z = 80) {
	filas.forEach((f, y) => {
		for (let x = 0; x < f.length; x++) if (mapa[f[x]]) poner(L, x0 + x, y0 + y, mapa[f[x]], z);
	});
}
// Contorno exterior oscuro
function contorno(L, color = NEGRO) {
	const lleno = L.c.map((c) => c !== null && c !== 'hueco');
	for (let y = 0; y < L.h; y++) {
		for (let x = 0; x < L.w; x++) {
			const i = y * L.w + x;
			if (lleno[i]) continue;
			const vecino = (xx, yy) => xx >= 0 && yy >= 0 && xx < L.w && yy < L.h && lleno[yy * L.w + xx];
			if (vecino(x - 1, y) || vecino(x + 1, y) || vecino(x, y - 1) || vecino(x, y + 1)) L.c[i] = color;
		}
	}
	L.c = L.c.map((c) => (c === 'hueco' ? null : c));
}
function aCanvas(L, blanco = false) {
	const cv = document.createElement('canvas');
	cv.width = L.w;
	cv.height = L.h;
	const cx = cv.getContext('2d');
	L.c.forEach((col, i) => {
		if (!col) return;
		cx.fillStyle = blanco ? (col === NEGRO ? NEGRO : '#ffffff') : col;
		cx.fillRect(i % L.w, Math.floor(i / L.w), 1, 1);
	});
	return cv;
}

// ─────────────────────────── PERSONAJES ───────────────────────────

// CHISPA — robot de mantenimiento con bufanda. modo: 'quieto' | 'camina'
function dibujarChispa(f, modo) {
	const L = lienzo(30, 32);
	const bob = modo === 'camina' ? [0, -1, 0, -1][f] : [0, 0, 1, 1][f];
	const pasoI = modo === 'camina' ? [0, -2, 0, 1][f] : 0;
	const pasoD = modo === 'camina' ? [0, 1, 0, -2][f] : 0;
	// piernas
	caja(L, 11, 25 + pasoI, 3, 5, RAMPAS.acero, 1, {radio: 0});
	caja(L, 17, 25 + pasoD, 3, 5, RAMPAS.acero, 1, {radio: 0});
	caja(L, 10, 29 + pasoI, 5, 2, RAMPAS.acero, 2, {radio: 0, base: 0.3});
	caja(L, 16, 29 + pasoD, 5, 2, RAMPAS.acero, 2, {radio: 0, base: 0.3});
	// cuerpo
	bola(L, 15.5, 21.5 + bob, 6.5, 5.5, RAMPAS.blanco, 5);
	bola(L, 15.5, 22 + bob, 1.8, 1.8, RAMPAS.lima, 20, {amb: 0.6});
	// brazos
	bola(L, 8.5, 21 + bob + (modo === 'camina' ? pasoD * 0.5 : 0), 2.2, 2.6, RAMPAS.acero, 8);
	bola(L, 22.5, 21 + bob + (modo === 'camina' ? pasoI * 0.5 : 0), 2.2, 2.6, RAMPAS.acero, 8);
	// bufanda (nudo + cola que ondea)
	bola(L, 15.5, 16.5 + bob, 6, 2, RAMPAS.naranja, 14);
	const ola = [0, 1, 2, 1][f];
	for (let k = 0; k < 6; k++) {
		const yy = 17 + bob + k * 0.55 + Math.sin((k + ola) * 1.2) * 0.9;
		bola(L, 8 - k * 1.1, yy, 1.5, 1.2, RAMPAS.naranja, 3);
	}
	// cabeza
	bola(L, 15.5, 10 + bob, 9.5, 8, RAMPAS.blanco, 10);
	// visor
	caja(L, 8, 7 + bob, 15, 6, RAMPAS.visor, 30, {radio: 2, base: 0.55});
	for (let k = 0; k < 4; k++) poner(L, 10 + k, 8 + bob, RAMPAS.visor[4], 31);
	const parpadea = modo === 'quieto' && f === 3;
	if (parpadea) {
		linea(L, 16, 10 + bob, 19, 10 + bob, '#ffffff', 32);
	} else {
		caja(L, 16, 9 + bob, 3, 3, ['#ffffff', '#ffffff', '#ffffff'], 32, {radio: 0});
		poner(L, 18, 9 + bob, RAMPAS.visor[3], 33);
	}
	// antena
	linea(L, 15, 2 + bob, 15, 2.5 + bob, RAMPAS.acero[3], 12);
	linea(L, 15, 1 + bob, 15, 1 + bob, RAMPAS.acero[2], 12);
	bola(L, 15.5, 0.8 + bob, 1.7, 1.7, f % 2 ? RAMPAS.oro : RAMPAS.naranja, 13, {amb: 0.7});
	contorno(L);
	return L;
}

// ORI — holograma ojo con anillos y haz de luz
function dibujarOri(f) {
	const L = lienzo(28, 30);
	const bob = [0, -1, -1, 0][f];
	// haz del proyector (tramado)
	for (let y = 18; y < 27; y++) {
		const ancho = (y - 16) * 0.8;
		for (let x = Math.round(14 - ancho); x <= Math.round(13 + ancho); x++) {
			if (BAYER[(y & 3) * 4 + (x & 3)] < 5 - (y - 18) * 0.4) poner(L, x, y, '#1597b8', -5);
		}
	}
	caja(L, 8, 26, 12, 3, RAMPAS.acero, 2, {radio: 1});
	poner(L, 13, 26, RAMPAS.visor[3], 3);
	poner(L, 14, 26, RAMPAS.visor[3], 3);
	anillo(L, 14, 11 + bob, 8, 11, RAMPAS.visor, 4);
	bola(L, 14, 11 + bob, 8, 8, RAMPAS.pantalla, 2, {brillo: false});
	bola(L, 14, 11 + bob, 5, 5, RAMPAS.lima, 6, {amb: 0.45});
	bola(L, 14 + [0, 1, 0, -1][f], 11 + bob, 2.2, 2.2, [NEGRO, NEGRO, '#1b1f2e', '#2a3148', '#3a4258'], 9, {brillo: false});
	poner(L, 12, 9 + bob, '#ffffff', 12);
	// línea de escaneo que baja
	const yScan = 4 + f * 4 + bob;
	for (let x = 4; x < 25; x++) if (L.c[yScan * L.w + x]) poner(L, x, yScan, RAMPAS.visor[4], 20);
	// marcas del anillo que giran
	for (let k = 0; k < 4; k++) {
		const a = (k * Math.PI) / 2 + f * 0.4;
		poner(L, 14 + Math.cos(a) * 9.5, 11 + bob + Math.sin(a) * 9.5, '#ffffff', 21);
	}
	contorno(L);
	return L;
}

// BICHO CLICK — escarabajo con el cursor del mouse en el caparazón
const CURSOR = ['X.....', 'XX....', 'XWX...', 'XWWX..', 'XWWWX.', 'XWWWWX', 'XWWXXX', 'XXWX..', '...XX.'];
function dibujarBicho(f) {
	const L = lienzo(28, 26);
	const p = [0, 1, 0, -1][f];
	// patas
	for (let k = 0; k < 3; k++) {
		const y = 10 + k * 4;
		const d = (k % 2 ? p : -p) * 1;
		linea(L, 7, y, 2, y - 2 + d, '#2a0a12', 1);
		linea(L, 2, y - 2 + d, 1, y + 1 + d, '#2a0a12', 1);
		linea(L, 20, y, 25, y - 2 - d, '#2a0a12', 1);
		linea(L, 25, y - 2 - d, 26, y + 1 - d, '#2a0a12', 1);
	}
	// cabeza y mandíbulas
	bola(L, 13.5, 5, 5, 3.6, RAMPAS.cabeza, 4);
	linea(L, 10, 2, 8, 0 + p * 0.5, '#2a0a12', 2);
	linea(L, 17, 2, 19, 0 - p * 0.5, '#2a0a12', 2);
	poner(L, 11, 4, '#ffffff', 10);
	poner(L, 16, 4, '#ffffff', 10);
	poner(L, 11, 5, RAMPAS.rojo[3], 10);
	poner(L, 16, 5, RAMPAS.rojo[3], 10);
	// caparazón
	bola(L, 13.5, 14, 9, 9, RAMPAS.rojo, 8);
	linea(L, 13.5, 6, 13.5, 22, '#33070f', 30);
	// cursor del mouse (el "click")
	estampa(L, 15, 9, CURSOR, {X: NEGRO, W: '#ffffff'}, 40);
	// puntos
	bola(L, 9, 11, 1.2, 1.2, RAMPAS.cabeza, 31, {brillo: false});
	bola(L, 9.5, 17, 1.4, 1.4, RAMPAS.cabeza, 31, {brillo: false});
	contorno(L);
	return L;
}

// NULL — baba con el símbolo ∅ como boca
function dibujarNull(f, grande = false) {
	const esc = grande ? 2.1 : 1;
	const W = Math.round(26 * esc);
	const H = Math.round(22 * esc);
	const L = lienzo(W, H);
	const sx = [1, 1.07, 1, 0.94][f];
	const sy = [1, 0.9, 1, 1.08][f];
	const piso = H - 2;
	const rx = 11 * esc * sx;
	const ry = 9 * esc * sy;
	const cx = W / 2;
	const cy = piso - ry * 0.85;
	bola(L, cx, cy, rx, ry, RAMPAS.verde, 5, {corteAbajo: piso});
	// gotas en la base
	for (let k = -2; k <= 2; k++) bola(L, cx + k * rx * 0.42, piso - 0.5, 1.6 * esc, 1.2 * esc, RAMPAS.verde, 4, {brillo: false});
	// burbujas internas que suben
	[
		[-0.45, 0.2],
		[0.35, 0.35],
		[0.1, -0.1],
	].forEach(([u, v], k) => {
		const yy = cy + ry * v - ((f + k) % 4) * esc;
		bola(L, cx + rx * u, yy, 1.1 * esc, 1.1 * esc, [RAMPAS.verde[3], RAMPAS.verde[4], '#ffffff'], 20, {brillo: false, amb: 0.8});
	});
	// ojos
	const oy = cy - ry * 0.25;
	[-1, 1].forEach((lado) => {
		bola(L, cx + lado * rx * 0.38, oy, 2.3 * esc, 2.6 * esc, RAMPAS.blanco, 100, {brillo: false, amb: 0.9});
		bola(L, cx + lado * rx * 0.38 + 0.6 * esc, oy + 0.6 * esc, 1.1 * esc, 1.3 * esc, [NEGRO, NEGRO, NEGRO], 120, {brillo: false});
		poner(L, cx + lado * rx * 0.38 - 0.6 * esc, oy - 1 * esc, '#ffffff', 130);
	});
	// boca ∅
	const my = cy + ry * 0.32;
	const r = 2.4 * esc;
	for (let a = 0; a < Math.PI * 2; a += 0.12) poner(L, cx + Math.cos(a) * r, my + Math.sin(a) * r, RAMPAS.verde[0], 120);
	linea(L, cx - r - 1, my + r + 1, cx + r + 1, my - r - 1, RAMPAS.verde[0], 120);
	// corona del Gran Null
	if (grande) {
		const ty = cy - ry - 1;
		caja(L, Math.round(cx - 9), Math.round(ty - 1), 18, 5, RAMPAS.oro, 40, {radio: 0, base: 0.55});
		[-8, -3, 2, 7].forEach((dx, k) => {
			for (let h = 0; h < 4; h++) for (let w = 0; w < 3 - Math.floor(h * 0.7); w++) poner(L, cx + dx + w + Math.floor(h * 0.35), ty - 2 - h, tono(RAMPAS.oro, 0.75 - h * 0.08, k, h), 41);
		});
		bola(L, cx - 4, ty + 1.5, 1.4, 1.4, RAMPAS.rojo, 45);
		bola(L, cx + 4, ty + 1.5, 1.4, 1.4, RAMPAS.visor, 45);
		// cejas furiosas
		[-1, 1].forEach((lado) => linea(L, cx + lado * rx * 0.22, oy - 3.4 * esc, cx + lado * rx * 0.55, oy - 4.6 * esc, RAMPAS.verde[0], 120));
	}
	contorno(L);
	return L;
}

// TORRETA UNDEFINED — pantalla con "?" que hace glitch. carga: ojo ámbar antes del disparo
const INTERROGA = ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.....', '..X..'];
function dibujarTorreta(f, carga = false) {
	const L = lienzo(28, 30);
	caja(L, 4, 20, 20, 9, RAMPAS.acero, 2, {radio: 2, base: 0.45});
	[6, 21].forEach((x) => poner(L, x, 22, RAMPAS.acero[4], 3));
	[6, 21].forEach((x) => poner(L, x, 26, RAMPAS.acero[4], 3));
	caja(L, 11, 17, 6, 4, RAMPAS.acero, 3, {radio: 0, base: 0.3});
	bola(L, 14, 11, 10, 9, RAMPAS.acero, 6);
	caja(L, 7, 7, 14, 9, RAMPAS.pantalla, 30, {radio: 1, base: 0.5});
	const col = carga ? RAMPAS.oro[3] : RAMPAS.rojo[3];
	const glitch = f === 2 ? 1 : 0;
	estampa(L, 12 + glitch, 8, INTERROGA, {X: col}, 40);
	if (f === 2) for (let x = 8; x < 20; x += 2) poner(L, x, 11, col, 41);
	for (let x = 8; x < 20; x++) if (f % 2 === 0) poner(L, x, 9 + f, 'rgba(255,255,255,0.08)', 35);
	// luz de estado
	bola(L, 14, 2.5, 1.6, 1.6, carga ? RAMPAS.oro : RAMPAS.rojo, 20, {amb: 0.7});
	contorno(L);
	return L;
}

// KEYLOGGER — espectro con dientes de tecla. rey: versión jefe
function dibujarKeylogger(f, rey = false) {
	const esc = rey ? 2 : 1;
	const W = Math.round(26 * esc);
	const extra = rey ? 10 : 0;
	const H = Math.round(28 * esc) + extra;
	const L = lienzo(W, H);
	const bob = [0, -1, -1, 0][f] * esc;
	const cx = W / 2;
	const top = 9 * esc + bob + extra;
	const rx = 9.5 * esc;
	const fondo = (x) => Math.round(H - 4 * esc + Math.sin(x * (0.7 / esc) + f * 1.6) * 1.6 * esc + bob);
	bola(L, cx, top, rx, rx * 0.95, RAMPAS.morado, 6);
	cilindro(L, cx, Math.round(top), 0, rx, RAMPAS.morado, 5, fondo);
	// ojos furiosos
	const oy = top - 1 * esc;
	[-1, 1].forEach((lado) => {
		const ex = cx + lado * 4 * esc;
		bola(L, ex, oy, 2.6 * esc, 2.2 * esc, RAMPAS.blanco, 100, {brillo: false, amb: 0.9});
		bola(L, ex + lado * 0.5 * esc, oy + 0.4 * esc, 1.1 * esc, 1.1 * esc, RAMPAS.rojo, 120, {brillo: false, amb: 0.9});
		linea(L, ex - 2.5 * esc, oy - (2.8 + lado * 0.9) * esc, ex + 2.5 * esc, oy - (2.8 - lado * 0.9) * esc, RAMPAS.morado[0], 120);
	});
	if (rey) {
		[-1, 1].forEach((lado) => {
			bola(L, cx + lado * 8 * esc, oy + 4 * esc, 1.4 * esc, 1.2 * esc, RAMPAS.blanco, 100, {brillo: false, amb: 0.9});
			bola(L, cx + lado * 8 * esc, oy + 4.2 * esc, 0.6 * esc, 0.6 * esc, RAMPAS.rojo, 120, {brillo: false});
		});
	}
	// boca: fila de teclas
	const my = Math.round(top + 5 * esc);
	caja(L, Math.round(cx - 7 * esc), my - 1, Math.round(14 * esc), Math.round(6 * esc), [NEGRO, NEGRO, '#14081f'], 110, {radio: 1});
	const teclas = rey ? 6 : 4;
	for (let k = 0; k < teclas; k++) {
		const tx = Math.round(cx - 6 * esc + k * ((12 * esc) / teclas)) + 1;
		const tw = Math.max(2, Math.round((12 * esc) / teclas) - 1);
		caja(L, tx, my, tw, Math.round(2.5 * esc), RAMPAS.blanco, 115, {radio: 0, base: 0.6});
		caja(L, tx, my + Math.round(3 * esc), tw, Math.round(2 * esc), RAMPAS.blanco, 115, {radio: 0, base: 0.45});
	}
	// tecla que orbita
	const orbitas = rey ? 3 : 1;
	for (let k = 0; k < orbitas; k++) {
		const a = f * (Math.PI / 2) + (k * Math.PI * 2) / orbitas;
		const kx = Math.round(cx + Math.cos(a) * (rx + 3 * esc) - 2);
		const ky = Math.round(top + 4 * esc + Math.sin(a) * 4 * esc);
		caja(L, kx, ky, 4, 4, RAMPAS.morado, Math.sin(a) > 0 ? 60 : -10, {radio: 0, base: 0.75});
		poner(L, kx + 1, ky + 1, RAMPAS.morado[4], Math.sin(a) > 0 ? 61 : -9);
	}
	// corona de teclas del rey
	if (rey) {
		const cy0 = Math.round(top - rx * 0.95 - 5);
		['E', 'S', 'C'].forEach((_, k) => {
			const kx = Math.round(cx - 9 + k * 6);
			const alto = k === 1 ? 7 : 5;
			caja(L, kx, cy0 + (7 - alto), 5, alto, RAMPAS.oro, 50, {radio: 0, base: 0.65});
		});
		bola(L, cx, cy0 + 3, 1.2, 1.2, RAMPAS.rojo, 55);
	}
	contorno(L);
	return L;
}

// SOBRECARGA SUBMIT — reactor recalentado con el símbolo ⏎ en el núcleo
const ENTER = ['......XX', '......XX', '......XX', '..X...XX', '.XX...XX', 'XXXXXXXX', 'XXXXXXX.', '.XX.....', '..X.....'];
function dibujarSobrecarga(f) {
	const L = lienzo(54, 56);
	const cx = 27;
	const cy = 25;
	// tubos y base
	caja(L, 10, 44, 34, 10, RAMPAS.acero, 1, {radio: 2, base: 0.4});
	[14, 36].forEach((x) => caja(L, x, 36, 5, 10, RAMPAS.acero, 2, {radio: 0, base: 0.5}));
	for (let x = 13; x < 42; x += 4) poner(L, x, 49, f % 2 ? RAMPAS.naranja[3] : RAMPAS.naranja[2], 3);
	// anillo exterior con respiraderos que giran
	anillo(L, cx, cy, 17, 23, RAMPAS.acero, 6);
	for (let k = 0; k < 8; k++) {
		const a = (k * Math.PI) / 4 + f * (Math.PI / 16);
		for (let r = 18; r <= 22; r++) poner(L, cx + Math.cos(a) * r, cy + Math.sin(a) * r, k % 2 ? RAMPAS.naranja[2] : NEGRO, 20);
	}
	anillo(L, cx, cy, 13, 17, RAMPAS.oro, 8);
	// núcleo al rojo vivo (late)
	const pulso = [0, 0.6, 1, 0.6][f];
	bola(L, cx, cy, 12.5 + pulso * 0.5, 12.5 + pulso * 0.5, RAMPAS.nucleo, 10, {amb: 0.4 + pulso * 0.12});
	estampa(L, cx - 4, cy - 4, ENTER, {X: '#5a0a05'}, 40);
	// arcos eléctricos
	const arcos = [
		[-1, -1],
		[1, -0.6],
		[0.8, 1],
		[-1, 0.7],
	];
	const [ax, ay] = arcos[f];
	let px = cx + ax * 14;
	let py = cy + ay * 14;
	for (let k = 0; k < 6; k++) {
		const nx = px + ax * 2.2 + (k % 2 ? 1.5 : -1.5);
		const ny = py + ay * 2.2 + (k % 2 ? -1.5 : 1.5);
		linea(L, px, py, nx, ny, k % 2 ? RAMPAS.visor[4] : RAMPAS.visor[3], 70);
		px = nx;
		py = ny;
	}
	contorno(L);
	return L;
}

// ─────────────────────────── REGISTRO ───────────────────────────
const IMG = {};
const ANIM = {
	chispa: (f) => dibujarChispa(f, 'quieto'),
	chispa_camina: (f) => dibujarChispa(f, 'camina'),
	ori: dibujarOri,
	bicho: dibujarBicho,
	null: (f) => dibujarNull(f),
	torreta: (f) => dibujarTorreta(f),
	torreta_carga: (f) => dibujarTorreta(f, true),
	keylogger: (f) => dibujarKeylogger(f),
	granNull: (f) => dibujarNull(f, true),
	reyKeylogger: (f) => dibujarKeylogger(f, true),
	sobrecarga: dibujarSobrecarga,
};
function prepararSprites() {
	for (const [nombre, fn] of Object.entries(ANIM)) {
		const frames = [0, 1, 2, 3].map((f) => fn(f));
		IMG[nombre] = frames.map((L) => aCanvas(L));
		IMG[nombre + '_blanco'] = frames.map((L) => aCanvas(L, true));
	}
}
